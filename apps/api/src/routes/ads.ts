import { Router, Response } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { logActivity } from '../services/logger';

const router = Router();

// GET /api/ads - Get public active ad banners
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ads_banners
       WHERE is_active = TRUE
         AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
         AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
       ORDER BY priority DESC, id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des bannières.' });
  }
});

// GET /api/ads/admin/all - List all campaigns for admin
router.get('/admin/all', authenticateToken, requirePermission('publicite:edit'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ads_banners ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des publicités.' });
  }
});

// POST /api/ads/admin - Create ad banner
router.post('/admin', authenticateToken, requirePermission('publicite:edit'), async (req: AuthRequest, res: Response) => {
  const { title, imageUrl, videoUrl, targetUrl, position, priority, startDate, endDate } = req.body;
  if (!title || !imageUrl) {
    return res.status(400).json({ error: 'Titre et image obligatoires.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO ads_banners (title, image_url, video_url, target_url, position, priority, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title,
        imageUrl,
        videoUrl || null,
        targetUrl || null,
        position || 'HOME_HEADER',
        priority || 0,
        startDate || null,
        endDate || null,
      ]
    );

    await logActivity(req.user?.id, 'AD_BANNER_CREATE', { title }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création de la publicité.' });
  }
});

// PUT /api/ads/admin/:id - Update ad banner
router.put('/admin/:id', authenticateToken, requirePermission('publicite:edit'), async (req: AuthRequest, res: Response) => {
  const { title, imageUrl, videoUrl, targetUrl, position, priority, isActive, startDate, endDate } = req.body;
  try {
    const result = await pool.query(
      `UPDATE ads_banners
       SET title = COALESCE($1, title),
           image_url = COALESCE($2, image_url),
           video_url = $3,
           target_url = $4,
           position = COALESCE($5, position),
           priority = COALESCE($6, priority),
           is_active = COALESCE($7, is_active),
           start_date = $8,
           end_date = $9
       WHERE id = $10
       RETURNING *`,
      [
        title,
        imageUrl,
        videoUrl ?? null,
        targetUrl ?? null,
        position,
        priority,
        isActive,
        startDate ?? null,
        endDate ?? null,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Publicité non trouvée.' });
    }

    await logActivity(req.user?.id, 'AD_BANNER_UPDATE', { id: req.params.id }, req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la modification de la publicité.' });
  }
});

// DELETE /api/ads/admin/:id - Delete ad banner
router.delete('/admin/:id', authenticateToken, requirePermission('publicite:edit'), async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM ads_banners WHERE id = $1', [req.params.id]);
    await logActivity(req.user?.id, 'AD_BANNER_DELETE', { id: req.params.id }, req.ip);
    res.json({ message: 'Publicité supprimée.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la publicité.' });
  }
});

export default router;
