import { Router, Response } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { logActivity } from '../services/logger';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_12345';

// POST /api/admin/impersonate/start - Start assistance impersonation session
router.post('/start', authenticateToken, requirePermission('comptes:impersonate'), async (req: AuthRequest, res: Response) => {
  const { targetUserId, reason } = req.body;
  if (!targetUserId || !reason) {
    return res.status(400).json({ error: 'Identifiant du compte cible et motif obligatoires.' });
  }

  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ error: 'Non authentifié.' });

    const targetRes = await pool.query('SELECT id, email, role, is_active FROM users WHERE id = $1', [targetUserId]);
    if (targetRes.rows.length === 0) {
      return res.status(404).json({ error: 'Compte cible non trouvé.' });
    }

    const targetUser = targetRes.rows[0];
    if (!targetUser.is_active) {
      return res.status(400).json({ error: 'Impossible d’assister un compte suspendu.' });
    }

    const logRes = await pool.query(
      `INSERT INTO impersonation_logs (admin_id, target_user_id, reason, ip_address)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [adminId, targetUserId, reason, req.ip]
    );

    const impersonationToken = jwt.sign(
      {
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        isImpersonated: true,
        impersonatedByAdminId: adminId,
        impersonationLogId: logRes.rows[0].id,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    await logActivity(adminId, 'IMPERSONATION_START', { targetUserId, reason, logId: logRes.rows[0].id }, req.ip);

    res.json({
      message: 'Session d’assistance démarrée avec succès.',
      token: impersonationToken,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
      },
      adminId,
      expiresInMinutes: 60,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du démarrage de la session d’assistance.' });
  }
});

// POST /api/admin/impersonate/stop - Stop assistance session
router.post('/stop', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userAny = req.user as any;
    if (userAny?.impersonationLogId) {
      await pool.query('UPDATE impersonation_logs SET ended_at = CURRENT_TIMESTAMP WHERE id = $1', [
        userAny.impersonationLogId,
      ]);
      await logActivity(
        userAny.impersonatedByAdminId,
        'IMPERSONATION_STOP',
        { targetUserId: req.user?.id, logId: userAny.impersonationLogId },
        req.ip
      );
    }

    res.json({ message: 'Session d’assistance terminée.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la fermeture de la session d’assistance.' });
  }
});

// GET /api/admin/impersonate/logs - List impersonation logs
router.get('/logs', authenticateToken, requirePermission('comptes:view'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT il.*,
              adm.email as admin_email,
              tgt.email as target_email,
              tgt.role as target_role
       FROM impersonation_logs il
       JOIN users adm ON il.admin_id = adm.id
       JOIN users tgt ON il.target_user_id = tgt.id
       ORDER BY il.id DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des journaux d’assistance.' });
  }
});

export default router;
