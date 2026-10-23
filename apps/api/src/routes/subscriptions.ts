import { Router, Response } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { logActivity } from '../services/logger';

const router = Router();

// Helper to refresh subscription status
async function updateSubscriptionStatuses() {
  await pool.query(`
    UPDATE subscriptions
    SET status = CASE
      WHEN end_date < CURRENT_TIMESTAMP THEN 'EXPIRED'
      WHEN end_date <= CURRENT_TIMESTAMP + INTERVAL '7 days' THEN 'EXPIRING_SOON'
      ELSE 'ACTIVE'
    END
    WHERE status != 'SUSPENDED'
  `);
}

// GET /api/admin/subscriptions - List all subscriptions
router.get('/', authenticateToken, requirePermission('abonnements:view'), async (req: AuthRequest, res: Response) => {
  try {
    await updateSubscriptionStatuses();
    const result = await pool.query(
      `SELECT s.*, v.company_name as vendor_name, v.slug as vendor_slug, u.email as vendor_email
       FROM subscriptions s
       JOIN vendors v ON s.vendor_id = v.id
       JOIN users u ON v.user_id = u.id
       ORDER BY s.end_date ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des abonnements.' });
  }
});

// POST /api/admin/subscriptions - Create or update vendor subscription
router.post('/', authenticateToken, requirePermission('abonnements:edit'), async (req: AuthRequest, res: Response) => {
  const { vendorId, planName, endDate, notes } = req.body;
  if (!vendorId || !endDate) {
    return res.status(400).json({ error: 'Identifiant boutique et date de fin requis.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM subscriptions WHERE vendor_id = $1', [vendorId]);

    let sub;
    if (existing.rows.length > 0) {
      const updateRes = await pool.query(
        `UPDATE subscriptions
         SET plan_name = COALESCE($1, plan_name),
             end_date = $2,
             notes = COALESCE($3, notes),
             updated_at = CURRENT_TIMESTAMP
         WHERE vendor_id = $4
         RETURNING *`,
        [planName, endDate, notes, vendorId]
      );
      sub = updateRes.rows[0];
    } else {
      const insertRes = await pool.query(
        `INSERT INTO subscriptions (vendor_id, plan_name, end_date, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [vendorId, planName || 'Standard MBA', endDate, notes || '']
      );
      sub = insertRes.rows[0];
    }

    await updateSubscriptionStatuses();
    await logActivity(req.user?.id, 'SUBSCRIPTION_UPDATE', { vendorId, planName, endDate }, req.ip);

    res.json(sub);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l’enregistrement de l’abonnement.' });
  }
});

// GET /api/vendors/me/subscription - Get current vendor subscription
router.get('/my-subscription', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const vendorRes = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [req.user?.id]);
    if (vendorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Boutique introuvable.' });
    }

    await updateSubscriptionStatuses();
    const subRes = await pool.query('SELECT * FROM subscriptions WHERE vendor_id = $1', [vendorRes.rows[0].id]);
    if (subRes.rows.length === 0) {
      return res.json({
        vendor_id: vendorRes.rows[0].id,
        plan_name: 'Essai Gratuit',
        status: 'ACTIVE',
        end_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      });
    }

    res.json(subRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération de votre abonnement.' });
  }
});

export default router;
