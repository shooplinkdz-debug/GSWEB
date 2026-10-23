import { Request, Response, NextFunction } from 'express';
import pool from '../db';
import { AuthRequest } from './auth';

export async function hasPermission(userId: number, role: string, requiredPermissionCode: string): Promise<boolean> {
  if (role === 'ADMIN') {
    return true; // Main Admin has all privileges
  }

  // Check direct user override permission first
  const userPermRes = await pool.query(
    `SELECT up.granted
     FROM user_permissions up
     JOIN permissions p ON up.permission_id = p.id
     WHERE up.user_id = $1 AND p.code = $2`,
    [userId, requiredPermissionCode]
  );

  if (userPermRes.rows.length > 0) {
    return userPermRes.rows[0].granted;
  }

  // Check role-assigned permissions
  const rolePermRes = await pool.query(
    `SELECT 1
     FROM role_permissions rp
     JOIN roles r ON rp.role_id = r.id
     JOIN permissions p ON rp.permission_id = p.id
     JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1 AND p.code = $2`,
    [userId, requiredPermissionCode]
  );

  if (rolePermRes.rows.length > 0) {
    return true;
  }

  // Fallback to role name matching default system role permissions
  const defaultRolePermRes = await pool.query(
    `SELECT 1
     FROM role_permissions rp
     JOIN roles r ON rp.role_id = r.id
     JOIN permissions p ON rp.permission_id = p.id
     WHERE r.name = $1 AND p.code = $2`,
    [role, requiredPermissionCode]
  );

  return defaultRolePermRes.rows.length > 0;
}

export function requirePermission(permissionCode: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié.' });
    }

    try {
      const allowed = await hasPermission(req.user.id, req.user.role, permissionCode);
      if (!allowed) {
        return res.status(403).json({ error: `Permission refusée pour l'action : ${permissionCode}` });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: 'Erreur lors de la vérification des permissions.' });
    }
  };
}

export async function getEffectivePermissions(userId: number, role: string): Promise<string[]> {
  if (role === 'ADMIN') {
    const all = await pool.query('SELECT code FROM permissions');
    return all.rows.map(r => r.code);
  }

  const perms = new Set<string>();

  // Role permissions
  const roleRes = await pool.query(
    `SELECT DISTINCT p.code
     FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     JOIN roles r ON rp.role_id = r.id
     LEFT JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1 OR r.name = $2`,
    [userId, role]
  );
  roleRes.rows.forEach(r => perms.add(r.code));

  // Direct user overrides
  const userRes = await pool.query(
    `SELECT p.code, up.granted
     FROM user_permissions up
     JOIN permissions p ON up.permission_id = p.id
     WHERE up.user_id = $1`,
    [userId]
  );
  userRes.rows.forEach(r => {
    if (r.granted) {
      perms.add(r.code);
    } else {
      perms.delete(r.code);
    }
  });

  return Array.from(perms);
}

export async function verifyVendorAccess(userId: number, role: string, vendorId: number): Promise<boolean> {
  if (role === 'ADMIN') return true;

  if (role === 'VENDOR' || role === 'SELLER') {
    const res = await pool.query('SELECT id FROM vendors WHERE user_id = $1 AND id = $2', [userId, vendorId]);
    return res.rows.length > 0;
  }

  // Check user_vendor_assignments for CONFIRMATEUR / MANAGER / DEVELOPER
  const res = await pool.query('SELECT 1 FROM user_vendor_assignments WHERE user_id = $1 AND vendor_id = $2', [
    userId,
    vendorId,
  ]);
  return res.rows.length > 0;
}
