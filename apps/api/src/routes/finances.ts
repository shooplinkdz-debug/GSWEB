import { Router, Response } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requirePermission, verifyVendorAccess } from '../middleware/rbac';
import { logActivity } from '../services/logger';

const router = Router();

// GET /api/finances/balance - Get calculated financial balance for vendor
router.get('/balance', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    let vendorId: number | null = null;
    if (req.query.vendorId) {
      vendorId = Number(req.query.vendorId);
      const hasAccess = await verifyVendorAccess(req.user!.id, req.user!.role, vendorId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès refusé à cette boutique.' });
      }
    } else {
      const vendorRes = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [req.user?.id]);
      if (vendorRes.rows.length === 0) {
        return res.status(404).json({ error: 'Boutique non trouvée.' });
      }
      vendorId = vendorRes.rows[0].id;
    }

    const calcRes = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'BENEFIT' AND status = 'VALIDATED' THEN amount ELSE 0 END), 0) as total_benefits,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' AND status = 'VALIDATED' THEN amount ELSE 0 END), 0) as total_expenses
       FROM financial_movements
       WHERE vendor_id = $1`,
      [vendorId]
    );

    const benefits = parseFloat(calcRes.rows[0].total_benefits);
    const expenses = parseFloat(calcRes.rows[0].total_expenses);
    const solde = benefits - expenses;

    res.json({
      vendorId,
      totalBenefits: benefits,
      totalExpenses: expenses,
      solde,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du calcul du solde financier.' });
  }
});

// GET /api/finances/movements - List financial ledger entries
router.get('/movements', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    let vendorId: number | null = null;
    if (req.query.vendorId) {
      vendorId = Number(req.query.vendorId);
      const hasAccess = await verifyVendorAccess(req.user!.id, req.user!.role, vendorId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès refusé à cette boutique.' });
      }
    } else {
      const vendorRes = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [req.user?.id]);
      if (vendorRes.rows.length === 0) {
        return res.status(404).json({ error: 'Boutique non trouvée.' });
      }
      vendorId = vendorRes.rows[0].id;
    }

    const movementsRes = await pool.query(
      `SELECT m.*, u.email as creator_email
       FROM financial_movements m
       LEFT JOIN users u ON m.created_by = u.id
       WHERE m.vendor_id = $1
       ORDER BY m.id DESC`,
      [vendorId]
    );

    res.json(movementsRes.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération du journal financier.' });
  }
});

// POST /api/finances/movements - Create benefit/expense or signed credit movement
router.post('/movements', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { vendorId: targetVendorId, type, amount, description, category, receiptUrl } = req.body;
  if (amount === undefined || isNaN(Number(amount)) || !description) {
    return res.status(400).json({ error: 'Montant et description obligatoires.' });
  }

  try {
    let vendorId: number | null = null;
    if (targetVendorId) {
      vendorId = Number(targetVendorId);
      const hasAccess = await verifyVendorAccess(req.user!.id, req.user!.role, vendorId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès refusé pour enregistrer un mouvement sur cette boutique.' });
      }
    } else {
      const vendorRes = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [req.user?.id]);
      if (vendorRes.rows.length === 0) {
        return res.status(404).json({ error: 'Boutique non trouvée.' });
      }
      vendorId = vendorRes.rows[0].id;
    }

    let finalType = type;
    let rawAmount = Number(amount);

    if (!finalType) {
      finalType = rawAmount >= 0 ? 'BENEFIT' : 'EXPENSE';
    }
    const finalAmount = Math.abs(rawAmount);

    const result = await pool.query(
      `INSERT INTO financial_movements (vendor_id, type, amount, description, category, status, receipt_url, created_by)
       VALUES ($1, $2, $3, $4, $5, 'VALIDATED', $6, $7)
       RETURNING *`,
      [vendorId, finalType, finalAmount, description, category || 'GÉNÉRAL', receiptUrl || null, req.user?.id]
    );

    await logActivity(req.user?.id, 'FINANCIAL_MOVEMENT_ADD', { vendorId, type: finalType, amount: finalAmount }, req.ip);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l’enregistrement du mouvement financier.' });
  }
});

// PUT /api/finances/movements/:id/status - Update or cancel movement
router.put('/movements/:id/status', authenticateToken, requirePermission('finances:edit'), async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!['VALIDATED', 'PENDING', 'CANCELLED'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide.' });
  }

  try {
    const result = await pool.query(
      'UPDATE financial_movements SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mouvement financier introuvable.' });
    }

    await logActivity(req.user?.id, 'FINANCIAL_MOVEMENT_STATUS', { id: req.params.id, status }, req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du mouvement financier.' });
  }
});

export default router;
