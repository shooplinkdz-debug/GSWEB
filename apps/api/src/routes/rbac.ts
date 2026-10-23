import { Router, Response } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requirePermission, getEffectivePermissions } from '../middleware/rbac';
import { logActivity } from '../services/logger';
import bcrypt from 'bcryptjs';

const router = Router();

// GET /api/rbac/roles - List all roles
router.get('/roles', authenticateToken, requirePermission('comptes:view'), async (req: AuthRequest, res: Response) => {
  try {
    const rolesRes = await pool.query('SELECT * FROM roles ORDER BY id ASC');
    res.json(rolesRes.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des rôles.' });
  }
});

// POST /api/rbac/roles - Create custom role
router.post('/roles', authenticateToken, requirePermission('comptes:edit'), async (req: AuthRequest, res: Response) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Le nom du rôle est obligatoire.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO roles (name, description, is_system) VALUES ($1, $2, FALSE) RETURNING *',
      [name.toUpperCase().trim(), description || '']
    );
    await logActivity(req.user?.id, 'ROLE_CREATE', { name }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création du rôle (nom déjà utilisé ?).' });
  }
});

// PUT /api/rbac/roles/:id - Update custom role name or description
router.put('/roles/:id', authenticateToken, requirePermission('comptes:edit'), async (req: AuthRequest, res: Response) => {
  const { name, description } = req.body;
  try {
    const roleRes = await pool.query('SELECT * FROM roles WHERE id = $1', [req.params.id]);
    if (roleRes.rows.length === 0) {
      return res.status(404).json({ error: 'Rôle introuvable.' });
    }
    const role = roleRes.rows[0];

    const updatedName = role.is_system ? role.name : (name ? name.toUpperCase().trim() : role.name);
    const result = await pool.query(
      'UPDATE roles SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [updatedName, description ?? role.description, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la modification du rôle.' });
  }
});

// GET /api/rbac/permissions - List all system permissions organized by module
router.get('/permissions', authenticateToken, requirePermission('comptes:view'), async (req: AuthRequest, res: Response) => {
  try {
    const permRes = await pool.query('SELECT * FROM permissions ORDER BY module ASC, code ASC');
    res.json(permRes.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des permissions.' });
  }
});

// GET /api/rbac/roles/:id/permissions - Get assigned permission codes for role
router.get('/roles/:id/permissions', authenticateToken, requirePermission('comptes:view'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT p.code FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = $1`,
      [req.params.id]
    );
    res.json(result.rows.map(r => r.code));
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des permissions du rôle.' });
  }
});

// PUT /api/rbac/roles/:id/permissions - Update assigned permissions for role
router.put('/roles/:id/permissions', authenticateToken, requirePermission('comptes:edit'), async (req: AuthRequest, res: Response) => {
  const { permissions } = req.body; // Array of permission codes
  if (!Array.isArray(permissions)) {
    return res.status(400).json({ error: 'Format de permissions invalide.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM role_permissions WHERE role_id = $1', [req.params.id]);

    if (permissions.length > 0) {
      const permIdsRes = await client.query('SELECT id FROM permissions WHERE code = ANY($1)', [permissions]);
      for (const row of permIdsRes.rows) {
        await client.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)', [
          req.params.id,
          row.id,
        ]);
      }
    }

    await client.query('COMMIT');
    await logActivity(req.user?.id, 'ROLE_PERMISSIONS_UPDATE', { role_id: req.params.id, count: permissions.length }, req.ip);
    res.json({ message: 'Permissions du rôle mises à jour avec succès.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Erreur lors de la mise à jour des permissions du rôle.' });
  } finally {
    client.release();
  }
});

// GET /api/rbac/users/:id/effective-permissions - Get effective permissions of user
router.get('/users/:id/effective-permissions', authenticateToken, requirePermission('comptes:view'), async (req: AuthRequest, res: Response) => {
  try {
    const userRes = await pool.query('SELECT id, role FROM users WHERE id = $1', [req.params.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }
    const user = userRes.rows[0];
    const permissions = await getEffectivePermissions(user.id, user.role);

    const vendorAssignmentsRes = await pool.query(
      `SELECT v.id, v.company_name, v.slug FROM vendors v
       JOIN user_vendor_assignments uva ON uva.vendor_id = v.id
       WHERE uva.user_id = $1`,
      [user.id]
    );

    res.json({
      userId: user.id,
      role: user.role,
      permissions,
      assignedVendors: vendorAssignmentsRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du calcul des autorisations effectives.' });
  }
});

// POST /api/rbac/users - Create account with role & store scope
router.post('/users', authenticateToken, requirePermission('comptes:create'), async (req: AuthRequest, res: Response) => {
  const { email, password, firstName, lastName, role, vendorIds } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Champs obligatoires manquants.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cet e-mail est déjà utilisé.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, email, first_name, last_name, role, is_active, created_at`,
      [email, hash, firstName || '', lastName || '', role]
    );
    const newUser = userRes.rows[0];

    // Vendor assignments if relevant
    if (Array.isArray(vendorIds) && vendorIds.length > 0) {
      for (const vid of vendorIds) {
        await client.query(
          'INSERT INTO user_vendor_assignments (user_id, vendor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [newUser.id, vid]
        );
      }
    }

    await client.query('COMMIT');
    await logActivity(req.user?.id, 'USER_ACCOUNT_CREATE', { created_user_id: newUser.id, email, role }, req.ip);
    res.status(201).json(newUser);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Erreur lors de la création du compte.' });
  } finally {
    client.release();
  }
});

// PUT /api/rbac/users/:id/status - Suspend or reactivate account
router.put('/users/:id/status', authenticateToken, requirePermission('comptes:delete'), async (req: AuthRequest, res: Response) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'Statut actif/suspendu invalide.' });
  }

  try {
    // Protect last active main ADMIN from deactivation
    const targetUserRes = await pool.query('SELECT id, role FROM users WHERE id = $1', [req.params.id]);
    if (targetUserRes.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    const targetUser = targetUserRes.rows[0];
    if (targetUser.role === 'ADMIN' && !isActive) {
      const adminCountRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'ADMIN' AND is_active = TRUE");
      if (parseInt(adminCountRes.rows[0].count, 10) <= 1) {
        return res.status(400).json({ error: 'Impossible de désactiver le dernier compte administrateur actif.' });
      }
    }

    const updated = await pool.query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, role, is_active',
      [isActive, req.params.id]
    );

    await logActivity(req.user?.id, 'USER_STATUS_CHANGE', { target_id: req.params.id, isActive }, req.ip);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du changement de statut de l’utilisateur.' });
  }
});

export default router;
