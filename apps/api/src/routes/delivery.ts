import { Router, Response } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { logActivity } from '../services/logger';

const router = Router();

// GET /api/delivery/companies - Get delivery companies
router.get('/companies', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, phone, email, status FROM delivery_companies ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des sociétés de livraison.' });
  }
});

// POST /api/delivery/companies - Create delivery company
router.post('/companies', authenticateToken, requirePermission('livraison:edit'), async (req: AuthRequest, res: Response) => {
  const { name, phone, email, apiKey, config } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Le nom de la société de livraison est requis.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO delivery_companies (name, phone, email, status, api_key, config)
       VALUES ($1, $2, $3, 'ACTIVE', $4, $5)
       RETURNING *`,
      [name, phone || null, email || null, apiKey || null, config || null]
    );

    await logActivity(req.user?.id, 'DELIVERY_COMPANY_CREATE', { name }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création de la société de livraison.' });
  }
});

// PUT /api/delivery/companies/:id - Update delivery company
router.put('/companies/:id', authenticateToken, requirePermission('livraison:edit'), async (req: AuthRequest, res: Response) => {
  const { name, phone, email, status, apiKey, config } = req.body;
  try {
    const result = await pool.query(
      `UPDATE delivery_companies
       SET name = COALESCE($1, name),
           phone = $2,
           email = $3,
           status = COALESCE($4, status),
           api_key = $5,
           config = $6
       WHERE id = $7
       RETURNING *`,
      [name, phone ?? null, email ?? null, status, apiKey ?? null, config ?? null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Société de livraison non trouvée.' });
    }

    await logActivity(req.user?.id, 'DELIVERY_COMPANY_UPDATE', { id: req.params.id }, req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la modification de la société de livraison.' });
  }
});

export default router;
