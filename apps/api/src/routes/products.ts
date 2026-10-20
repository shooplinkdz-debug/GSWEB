import { Router } from 'express';
import pool from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des produits.' });
  }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = $1`,
      [req.params.slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/products (Admin/Manager)
router.post('/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  const { category_id, sku, name, slug, description, price, stock, low_stock_threshold, image_url } = req.body;
  if (!sku || !name || !slug || price === undefined) {
    return res.status(400).json({ error: 'SKU, nom, slug et prix sont obligatoires.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (category_id, sku, name, slug, description, price, stock, low_stock_threshold, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [category_id || null, sku, name, slug, description || '', price, stock || 0, low_stock_threshold || 5, image_url || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création du produit.' });
  }
});

// PUT /api/products/:id (Admin/Manager)
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  const { category_id, sku, name, slug, description, price, stock, low_stock_threshold, image_url, is_published } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products
       SET category_id = $1, sku = $2, name = $3, slug = $4, description = $5, price = $6, stock = $7, low_stock_threshold = $8, image_url = $9, is_published = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [category_id || null, sku, name, slug, description, price, stock, low_stock_threshold, image_url, is_published, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du produit.' });
  }
});

// DELETE /api/products/:id (Admin)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }
    res.json({ message: 'Produit supprimé avec succès.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression du produit.' });
  }
});

export default router;
