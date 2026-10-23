import { Router, Response } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { logActivity } from '../services/logger';

const router = Router();

// GET /api/reviews/product/:productId - Get public approved reviews for product
router.get('/product/:productId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.photos, r.is_verified_purchase, r.created_at,
              COALESCE(u.first_name, 'Client MBA') as author_name
       FROM product_reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 AND r.status = 'APPROVED'
       ORDER BY r.id DESC`,
      [req.params.productId]
    );

    const formatted = result.rows.map(r => ({
      ...r,
      photos: r.photos ? JSON.parse(r.photos) : [],
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des avis.' });
  }
});

// POST /api/reviews/product/:productId - Submit new review
router.post('/product/:productId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { rating, comment, photos } = req.body;
  if (!rating || Number(rating) < 1 || Number(rating) > 5) {
    return res.status(400).json({ error: 'La note doit être comprise entre 1 et 5 étoiles.' });
  }

  try {
    const userId = req.user?.id;

    // Check if verified purchase
    const orderCheck = await pool.query(
      `SELECT 1 FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status IN ('PAID', 'DELIVERED')`,
      [userId, req.params.productId]
    );

    const isVerified = orderCheck.rows.length > 0;
    const photosJson = Array.isArray(photos) ? JSON.stringify(photos) : null;

    const result = await pool.query(
      `INSERT INTO product_reviews (product_id, user_id, rating, comment, photos, is_verified_purchase, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED')
       RETURNING *`,
      [req.params.productId, userId, Number(rating), comment || '', photosJson, isVerified]
    );

    // Update product rating aggregate
    await pool.query(
      `UPDATE vendors SET rating = (
        SELECT ROUND(AVG(r.rating)::numeric, 2)
        FROM product_reviews r
        JOIN products p ON r.product_id = p.id
        WHERE p.vendor_id = vendors.id AND r.status = 'APPROVED'
       ) WHERE id IN (SELECT vendor_id FROM products WHERE id = $1)`,
      [req.params.productId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la publication de l’avis.' });
  }
});

// GET /api/reviews/admin/all - List reviews for moderation
router.get('/admin/all', authenticateToken, requirePermission('commentaires:moderate'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, p.name as product_name, u.email as user_email
       FROM product_reviews r
       JOIN products p ON r.product_id = p.id
       LEFT JOIN users u ON r.user_id = u.id
       ORDER BY r.id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des avis.' });
  }
});

// PUT /api/reviews/admin/:id/status - Update review status (APPROVED, HIDDEN, PENDING)
router.put('/admin/:id/status', authenticateToken, requirePermission('commentaires:moderate'), async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!['APPROVED', 'HIDDEN', 'PENDING'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide.' });
  }

  try {
    const result = await pool.query(
      'UPDATE product_reviews SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avis introuvable.' });
    }

    await logActivity(req.user?.id, 'REVIEW_STATUS_UPDATE', { id: req.params.id, status }, req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la modération de l’avis.' });
  }
});

export default router;
