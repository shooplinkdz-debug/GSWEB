import { Router, Response } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logActivity } from '../services/logger';

const router = Router();

// GET /api/settings - Public platform settings
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM platform_settings');
    const settings: Record<string, string> = {};
    result.rows.forEach(r => {
      settings[r.key] = r.value;
    });

    // Default fallbacks
    if (!settings.support_email) settings.support_email = 'support@maboutiquealgerienne.dz';
    if (!settings.support_phone) settings.support_phone = '+213 (0) 23 45 67 89';
    if (!settings.support_hours) settings.support_hours = 'Dimanche - Jeudi : 08h30 - 17h00';

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres.' });
  }
});

// PUT /api/settings - Update settings (Admin)
router.put('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const settings = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Format de paramètres invalide.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'string') {
        await client.query(
          `INSERT INTO platform_settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
          [key, value]
        );
      }
    }
    await client.query('COMMIT');
    await logActivity(req.user?.id, 'SETTINGS_UPDATE', { keys: Object.keys(settings) }, req.ip);
    res.json({ message: 'Paramètres mis à jour avec succès.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres.' });
  } finally {
    client.release();
  }
});

export default router;
