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

// GET /api/vendors/admin/all - Admin route to list all vendors regardless of status
router.get('/admin/all', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, u.email as user_email
       FROM vendors v
       JOIN users u ON v.user_id = u.id
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

// PUT /api/vendors/me - Update current user's vendor store profile
router.put('/me', authenticateToken, requireRole(['VENDOR', 'ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  const company_name = req.body.company_name || req.body.store_name;
  const logo_url = req.body.logo_url || req.body.logo;
  const { slug, description, phone, wilaya } = req.body;

  try {
    const existingVendor = await pool.query(`SELECT * FROM vendors WHERE user_id = $1`, [req.user?.id]);
    if (existingVendor.rows.length === 0) {
      return res.status(404).json({ error: 'Profil vendeur non trouvé.' });
    }

    const current = existingVendor.rows[0];
    const newSlug = slug || current.slug;
    const newCompanyName = company_name || current.company_name;

    if (slug && slug !== current.slug) {
      const slugCheck = await pool.query(`SELECT id FROM vendors WHERE slug = $1 AND id != $2`, [slug, current.id]);
      if (slugCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Ce slug de boutique est déjà utilisé.' });
      }
    }

    const result = await pool.query(
      `UPDATE vendors
       SET company_name = $1,
           slug = $2,
           description = $3,
           logo_url = $4,
           phone = $5,
           wilaya = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        newCompanyName,
        newSlug,
        description !== undefined ? description : current.description,
        logo_url !== undefined ? logo_url : current.logo_url,
        phone !== undefined ? phone : current.phone,
        wilaya !== undefined ? wilaya : current.wilaya,
        current.id,
      ]
    );

    await clearCachePattern('vendors:*');
    await logActivity(req.user?.id, 'VENDOR_PROFILE_UPDATE', { id: current.id, company_name: newCompanyName }, req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil vendeur.' });
  }
});

// GET /api/vendors/me/commissions - Vendor financial recap (Sales, commissions, net payout)
const vendorCommissionsHandler = async (req: AuthRequest, res: any) => {
  try {
    const vendorRes = await pool.query(`SELECT * FROM vendors WHERE user_id = $1`, [req.user?.id]);
    if (vendorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Profil vendeur non trouvé.' });
    }

    const vendor = vendorRes.rows[0];
    const vendorId = vendor.id;

    const summaryRes = await pool.query(
      `SELECT
        COUNT(DISTINCT oi.order_id) as total_orders,
        COALESCE(SUM(oi.unit_price * oi.quantity), 0) as gross_sales,
        COALESCE(SUM(oi.commission_amount), 0) as total_commission,
        COALESCE(SUM(oi.vendor_payout), 0) as net_payout
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.vendor_id = $1 AND o.status != 'CANCELLED'`,
      [vendorId]
    );

    const itemsRes = await pool.query(
      `SELECT
        oi.*,
        o.order_number,
        o.status as order_status,
        o.payment_method,
        o.created_at as order_date
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.vendor_id = $1
       ORDER BY oi.id DESC`,
      [vendorId]
    );

    const summary = summaryRes.rows[0];

    res.json({
      vendorId: vendor.id,
      companyName: vendor.company_name,
      commissionRate: parseFloat(vendor.commission_rate || '10.00'),
      totalOrders: parseInt(summary.total_orders, 10),
      grossSales: parseFloat(summary.gross_sales),
      totalCommission: parseFloat(summary.total_commission),
      netPayout: parseFloat(summary.net_payout),
      items: itemsRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des commissions du vendeur.' });
  }
};

router.get('/me/commissions', authenticateToken, requireRole(['VENDOR', 'ADMIN', 'MANAGER']), vendorCommissionsHandler);
router.get('/me/payouts', authenticateToken, requireRole(['VENDOR', 'ADMIN', 'MANAGER']), vendorCommissionsHandler);

// GET /api/vendors/me/balance - Vendor balance management (Bénéfices - Dépenses = Solde)
router.get('/me/balance', authenticateToken, requireRole(['VENDOR', 'ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  try {
    const vendorRes = await pool.query(`SELECT * FROM vendors WHERE user_id = $1`, [req.user?.id]);
    if (vendorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Profil vendeur non trouvé.' });
    }

    const vendor = vendorRes.rows[0];

    // Calculate gross sales & net payout from completed orders
    const summaryRes = await pool.query(
      `SELECT
        COALESCE(SUM(oi.unit_price * oi.quantity), 0) as gross_sales,
        COALESCE(SUM(oi.vendor_payout), 0) as sales_payout
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.vendor_id = $1 AND o.status != 'CANCELLED'`,
      [vendor.id]
    );

    const summary = summaryRes.rows[0];
    const grossSales = parseFloat(summary.gross_sales || '0');
    const salesPayout = parseFloat(summary.sales_payout || '0');

    // Manual or credit entries
    const manualBenefits = parseFloat((req.query.manual_benefits as string) || '0');
    const manualExpenses = parseFloat((req.query.manual_expenses as string) || '0');
    const positiveCredit = parseFloat((req.query.validated_positive_credit as string) || '0');
    const negativeCredit = parseFloat((req.query.validated_negative_credit as string) || '0');

    const totalBenefits = salesPayout + manualBenefits + positiveCredit;
    const totalExpenses = manualExpenses + negativeCredit;
    const solde = totalBenefits - totalExpenses;

    res.json({
      vendorId: vendor.id,
      companyName: vendor.company_name,
      grossSales,
      salesPayout,
      manualBenefits,
      manualExpenses,
      validatedPositiveCredit: positiveCredit,
      validatedNegativeCredit: negativeCredit,
      totalBenefits,
      totalExpenses,
      solde,
      calculationFormula: 'Solde = Total Bénéfices - Total Dépenses',
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du calcul du solde vendeur.' });
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
    const vendorRes = await pool.query(`SELECT id, status FROM vendors WHERE user_id = $1`, [req.user?.id]);
    const vendor = vendorRes.rows.length > 0 ? vendorRes.rows[0] : null;

    if (req.user?.role === 'VENDOR') {
      if (!vendor) {
        return res.status(404).json({ error: 'Profil vendeur introuvable.' });
      }
      if (vendor.status !== 'APPROVED') {
        return res.status(403).json({ error: 'Seules les boutiques approuvées peuvent publier des produits.' });
      }
    }

    const vendorId = vendor ? vendor.id : null;

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
    const vendorRes = await pool.query(`SELECT id, status FROM vendors WHERE user_id = $1`, [req.user?.id]);
    const vendor = vendorRes.rows.length > 0 ? vendorRes.rows[0] : null;

    if (req.user?.role === 'VENDOR') {
      if (!vendor) {
        return res.status(404).json({ error: 'Profil vendeur introuvable.' });
      }
      if (vendor.status !== 'APPROVED') {
        return res.status(403).json({ error: 'Seules les boutiques approuvées peuvent publier des produits.' });
      }
    }

    const vendorId = vendor ? vendor.id : null;

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

// PUT /api/vendors/:id/status - Update vendor store approval status (Admin/Manager)
router.put('/:id/status', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  const { status } = req.body;
  if (!status || !['APPROVED', 'PENDING', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide. Utilisez APPROVED, PENDING ou REJECTED.' });
  }

  try {
    const result = await pool.query(
      `UPDATE vendors SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Boutique vendeur introuvable.' });
    }

    await logActivity(req.user?.id, 'VENDOR_STATUS_UPDATE', { id: req.params.id, status }, req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut vendeur.' });
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
  const company_name = req.body.company_name || req.body.store_name;
  const logo_url = req.body.logo_url || req.body.logo;
  const { slug, description, phone, wilaya, status } = req.body;

  if (!company_name || !slug) {
    return res.status(400).json({ error: 'Le nom de l’entreprise et le slug sont obligatoires.' });
  }

  try {
    const existing = await pool.query(`SELECT id FROM vendors WHERE user_id = $1 OR slug = $2`, [req.user?.id, slug]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Un profil vendeur ou un slug similaire existe déjà.' });
    }

    const initialStatus = status || 'APPROVED';

    const result = await pool.query(
      `INSERT INTO vendors (user_id, company_name, slug, description, logo_url, phone, wilaya, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user?.id,
        company_name,
        slug,
        description || '',
        logo_url || '',
        phone || '',
        wilaya || '',
        initialStatus,
      ]
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
