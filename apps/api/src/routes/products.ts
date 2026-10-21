import { Router } from 'express';
import pool from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { getCache, setCache, clearCachePattern } from '../services/redis';
import { logActivity } from '../services/logger';

const router = Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category_id, category, vendor_id, min_price, max_price, in_stock, search, limit, offset } = req.query;

    const hasFilters = category_id || category || vendor_id || min_price || max_price || in_stock !== undefined || search || limit || offset;
    const cacheKey = hasFilters ? `products:query:${JSON.stringify(req.query)}` : 'products:all';

    const cachedProducts = await getCache(cacheKey);
    if (cachedProducts) {
      return res.json(JSON.parse(cachedProducts));
    }

    let whereClauses: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (category_id) {
      whereClauses.push(`p.category_id = $${paramIndex++}`);
      params.push(category_id);
    } else if (category) {
      whereClauses.push(`c.slug = $${paramIndex++}`);
      params.push(category);
    }

    if (vendor_id) {
      whereClauses.push(`p.vendor_id = $${paramIndex++}`);
      params.push(vendor_id);
    }

    if (min_price) {
      whereClauses.push(`p.price >= $${paramIndex++}`);
      params.push(min_price);
    }

    if (max_price) {
      whereClauses.push(`p.price <= $${paramIndex++}`);
      params.push(max_price);
    }

    if (in_stock === 'true' || in_stock === '1') {
      whereClauses.push(`p.stock > 0`);
    }

    if (search && typeof search === 'string') {
      whereClauses.push(`(p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    let query = `
      SELECT p.*, c.name as category_name, v.company_name as vendor_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN vendors v ON p.vendor_id = v.id
    `;

    if (whereClauses.length > 0) {
      query += ` WHERE ` + whereClauses.join(' AND ');
    }

    query += ` ORDER BY p.id DESC`;

    if (limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(parseInt(limit as string, 10));
    }
    if (offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(parseInt(offset as string, 10));
    }

    const result = await pool.query(query, params);

    await setCache(cacheKey, JSON.stringify(result.rows), 300);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des produits.' });
  }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  try {
    const cacheKey = `products:slug:${req.params.slug}`;
    const cachedProduct = await getCache(cacheKey);
    if (cachedProduct) {
      return res.json(JSON.parse(cachedProduct));
    }

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

    await setCache(cacheKey, JSON.stringify(result.rows[0]), 300);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/products (Admin/Manager)
router.post('/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  const { category_id, vendor_id, sku, name, slug, description, price, stock, low_stock_threshold, image_url } = req.body;
  if (!sku || !name || !slug || price === undefined) {
    return res.status(400).json({ error: 'SKU, nom, slug et prix sont obligatoires.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (category_id, vendor_id, sku, name, slug, description, price, stock, low_stock_threshold, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [category_id || null, vendor_id || null, sku, name, slug, description || '', price, stock || 0, low_stock_threshold || 5, image_url || '']
    );

    await clearCachePattern('products:*');
    await logActivity(req.user?.id, 'PRODUCT_CREATE', { id: result.rows[0].id, sku, name }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création du produit.' });
  }
});

// PUT /api/products/:id (Admin/Manager)
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  const { category_id, vendor_id, sku, name, slug, description, price, stock, low_stock_threshold, image_url, is_published } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products
       SET category_id = $1, vendor_id = $2, sku = $3, name = $4, slug = $5, description = $6, price = $7, stock = $8, low_stock_threshold = $9, image_url = $10, is_published = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [
        category_id || null,
        vendor_id || null,
        sku,
        name,
        slug,
        description || '',
        price,
        stock !== undefined ? stock : 0,
        low_stock_threshold !== undefined ? low_stock_threshold : 5,
        image_url || '',
        is_published !== false,
        req.params.id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    await clearCachePattern('products:*');
    await logActivity(req.user?.id, 'PRODUCT_UPDATE', { id: req.params.id, sku, name }, req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du produit.' });
  }
});

// DELETE /api/products/:id (Admin)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    await clearCachePattern('products:*');
    await logActivity(req.user?.id, 'PRODUCT_DELETE', { id: req.params.id }, req.ip);
    res.json({ message: 'Produit supprimé avec succès.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression du produit.' });
  }
});

export default router;
