import { Router } from 'express';
import pool from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { clearCachePattern } from '../services/redis';
import { logActivity } from '../services/logger';

const router = Router();

// GET /api/vendors - Public list of approved vendors
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, u.email as user_email
       FROM vendors v
       JOIN users u ON v.user_id = u.id
       WHERE v.status = 'APPROVED'
       ORDER BY v.id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des vendeurs.' });
  }
});

// GET /api/vendors/me - Current user's vendor profile
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM vendors WHERE user_id = $1`,
      [req.user?.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profil vendeur non trouvé.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération du profil vendeur.' });
  }
});

// GET /api/vendors/me/stats - Current vendor statistics
router.get('/me/stats', authenticateToken, requireRole(['VENDOR', 'ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  try {
    const vendorRes = await pool.query(`SELECT id FROM vendors WHERE user_id = $1`, [req.user?.id]);
    let vendorId: number | null = null;
    if (vendorRes.rows.length > 0) {
      vendorId = vendorRes.rows[0].id;
    }

    const productsRes = vendorId
      ? await pool.query(`SELECT COUNT(*) as count FROM products WHERE vendor_id = $1`, [vendorId])
      : await pool.query(`SELECT COUNT(*) as count FROM products`);

    const lowStockRes = vendorId
      ? await pool.query(`SELECT COUNT(*) as count FROM products WHERE vendor_id = $1 AND stock <= low_stock_threshold`, [vendorId])
      : await pool.query(`SELECT COUNT(*) as count FROM products WHERE stock <= low_stock_threshold`);

    const salesRes = vendorId
      ? await pool.query(
          `SELECT COUNT(DISTINCT oi.order_id) as total_orders, COALESCE(SUM(oi.unit_price * oi.quantity), 0) as total_revenue
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           JOIN orders o ON oi.order_id = o.id
           WHERE p.vendor_id = $1 AND o.status = 'PAID'`,
          [vendorId]
        )
      : await pool.query(
          `SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_revenue FROM orders WHERE status = 'PAID'`
        );

    res.json({
      vendorId,
      totalProducts: parseInt(productsRes.rows[0].count, 10),
      lowStockProducts: parseInt(lowStockRes.rows[0].count, 10),
      totalOrders: parseInt(salesRes.rows[0].total_orders, 10),
      totalRevenue: parseFloat(salesRes.rows[0].total_revenue),
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques vendeur.' });
  }
});

// GET /api/vendors/me/products - Vendor's own products
router.get('/me/products', authenticateToken, requireRole(['VENDOR', 'ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  try {
    const vendorRes = await pool.query(`SELECT id FROM vendors WHERE user_id = $1`, [req.user?.id]);
    let query = `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id`;
    let params: any[] = [];

    if (vendorRes.rows.length > 0 && req.user?.role === 'VENDOR') {
      query += ` WHERE p.vendor_id = $1`;
      params.push(vendorRes.rows[0].id);
    }
    query += ` ORDER BY p.id DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des produits vendeur.' });
  }
});

// POST /api/vendors/me/products - Create product for vendor
router.post('/me/products', authenticateToken, requireRole(['VENDOR', 'ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  const { category_id, sku, name, slug, description, price, stock, low_stock_threshold, image_url } = req.body;
  if (!sku || !name || !slug || price === undefined) {
    return res.status(400).json({ error: 'SKU, nom, slug et prix sont obligatoires.' });
  }

  try {
    const vendorRes = await pool.query(`SELECT id FROM vendors WHERE user_id = $1`, [req.user?.id]);
    const vendorId = vendorRes.rows.length > 0 ? vendorRes.rows[0].id : null;

    const result = await pool.query(
      `INSERT INTO products (category_id, vendor_id, sku, name, slug, description, price, stock, low_stock_threshold, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        category_id || null,
        vendorId,
        sku,
        name,
        slug,
        description || '',
        price,
        stock || 0,
        low_stock_threshold || 5,
        image_url || '',
      ]
    );

    await clearCachePattern('products:*');
    await logActivity(req.user?.id, 'VENDOR_PRODUCT_CREATE', { id: result.rows[0].id, sku, name }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création du produit vendeur.' });
  }
});

// PUT /api/vendors/me/products/:id - Update product for vendor
router.put('/me/products/:id', authenticateToken, requireRole(['VENDOR', 'ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  const { category_id, sku, name, slug, description, price, stock, low_stock_threshold, image_url, is_published } = req.body;

  try {
    const vendorRes = await pool.query(`SELECT id FROM vendors WHERE user_id = $1`, [req.user?.id]);
    const vendorId = vendorRes.rows.length > 0 ? vendorRes.rows[0].id : null;

    let checkQuery = `SELECT * FROM products WHERE id = $1`;
    let checkParams: any[] = [req.params.id];
    if (req.user?.role === 'VENDOR' && vendorId) {
      checkQuery += ` AND vendor_id = $2`;
      checkParams.push(vendorId);
    }

    const checkRes = await pool.query(checkQuery, checkParams);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Produit introuvable ou vous n’avez pas les droits dessus.' });
    }

    const result = await pool.query(
      `UPDATE products
       SET category_id = $1, sku = $2, name = $3, slug = $4, description = $5, price = $6, stock = $7, low_stock_threshold = $8, image_url = $9, is_published = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        category_id || null,
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

    await clearCachePattern('products:*');
    await logActivity(req.user?.id, 'VENDOR_PRODUCT_UPDATE', { id: req.params.id, sku, name }, req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du produit vendeur.' });
  }
});

// DELETE /api/vendors/me/products/:id - Delete product for vendor
router.delete('/me/products/:id', authenticateToken, requireRole(['VENDOR', 'ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  try {
    const vendorRes = await pool.query(`SELECT id FROM vendors WHERE user_id = $1`, [req.user?.id]);
    const vendorId = vendorRes.rows.length > 0 ? vendorRes.rows[0].id : null;

    let deleteQuery = `DELETE FROM products WHERE id = $1`;
    let deleteParams: any[] = [req.params.id];
    if (req.user?.role === 'VENDOR' && vendorId) {
      deleteQuery += ` AND vendor_id = $2`;
      deleteParams.push(vendorId);
    }
    deleteQuery += ` RETURNING id`;

    const result = await pool.query(deleteQuery, deleteParams);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produit introuvable ou non autorisé.' });
    }

    await clearCachePattern('products:*');
    await logActivity(req.user?.id, 'VENDOR_PRODUCT_DELETE', { id: req.params.id }, req.ip);
    res.json({ message: 'Produit vendeur supprimé avec succès.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression du produit vendeur.' });
  }
});

// GET /api/vendors/:slug - Vendor store detail with products
router.get('/:slug', async (req, res) => {
  try {
    const vendorRes = await pool.query(
      `SELECT v.*, u.email as user_email
       FROM vendors v
       JOIN users u ON v.user_id = u.id
       WHERE v.slug = $1 AND v.status = 'APPROVED'`,
      [req.params.slug]
    );

    if (vendorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Vendeur introuvable.' });
    }

    const vendor = vendorRes.rows[0];
    const productsRes = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.vendor_id = $1 AND p.is_published = true
       ORDER BY p.id DESC`,
      [vendor.id]
    );

    res.json({
      vendor,
      products: productsRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération du vendeur.' });
  }
});

// POST /api/vendors - Create/Register vendor store profile
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  const { company_name, slug, description, logo_url } = req.body;
  if (!company_name || !slug) {
    return res.status(400).json({ error: 'Le nom de l’entreprise et le slug sont obligatoires.' });
  }

  try {
    const existing = await pool.query(`SELECT id FROM vendors WHERE user_id = $1 OR slug = $2`, [req.user?.id, slug]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Un profil vendeur ou un slug similaire existe déjà.' });
    }

    const result = await pool.query(
      `INSERT INTO vendors (user_id, company_name, slug, description, logo_url, status)
       VALUES ($1, $2, $3, $4, $5, 'APPROVED')
       RETURNING *`,
      [req.user?.id, company_name, slug, description || '', logo_url || '']
    );

    // Upgrade user role to VENDOR if currently CUSTOMER
    if (req.user?.role === 'CUSTOMER') {
      await pool.query(`UPDATE users SET role = 'VENDOR' WHERE id = $1`, [req.user?.id]);
    }

    await logActivity(req.user?.id, 'VENDOR_REGISTER', { company_name, slug }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création du profil vendeur.' });
  }
});

export default router;
