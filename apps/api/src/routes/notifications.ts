import { Router, Response } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications - List user or role notifications
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1 OR target_role = $2 OR (user_id IS NULL AND target_role IS NULL)
       ORDER BY id DESC LIMIT 50`,
      [userId, role]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications.' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [req.params.id]);
    res.json({ message: 'Notification marquée comme lue.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la notification.' });
  }
});

// POST /api/notifications - Create real notification event
export async function createNotification(userId: number | null, targetRole: string | null, type: string, summary: string, link?: string) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, target_role, type, summary, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, targetRole, type, summary, link || null]
    );
  } catch (err) {
    console.error('Notification creation error:', err);
  }
}

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { userId, targetRole, type, summary, link } = req.body;
  if (!type || !summary) {
    return res.status(400).json({ error: 'Type et résumé obligatoires.' });
  }

  try {
    await createNotification(userId || null, targetRole || null, type, summary, link);
    res.status(201).json({ message: 'Notification créée.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création de la notification.' });
  }
});

export default router;
