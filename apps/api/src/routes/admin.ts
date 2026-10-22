import { Router } from 'express';
import pool from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { logActivity } from '../services/logger';
import { exportOrdersData, formatOrdersToCsv, formatOrdersToJson, syncOrdersToGoogleSheets } from '../services/googleSheets';

const router = Router();

// GET /api/admin/stats
router.get('/stats', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const ordersRes = await pool.query(`
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM orders WHERE status = 'PAID'
    `);

    const productsRes = await pool.query('SELECT COUNT(*) as total_products FROM products');
    const lowStockRes = await pool.query('SELECT COUNT(*) as low_stock_count FROM products WHERE stock <= low_stock_threshold');
    const usersRes = await pool.query('SELECT COUNT(*) as total_users FROM users');
    const vendorsRes = await pool.query("SELECT COUNT(*) as active_vendors FROM vendors WHERE status = 'APPROVED'");

    res.json({
      totalOrders: parseInt(ordersRes.rows[0].total_orders, 10),
      totalRevenue: parseFloat(ordersRes.rows[0].total_revenue),
      totalProducts: parseInt(productsRes.rows[0].total_products, 10),
      lowStockProducts: parseInt(lowStockRes.rows[0].low_stock_count, 10),
      totalUsers: parseInt(usersRes.rows[0].total_users, 10),
      activeVendors: parseInt(vendorsRes.rows[0].active_vendors || '0', 10),
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques.' });
  }
});

// GET /api/admin/logs
router.get('/logs', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, u.email as user_email
       FROM activity_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ORDER BY l.id DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des journaux d’activité.' });
  }
});

// POST /api/admin/backup
router.post('/backup', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const tables = ['users', 'categories', 'products', 'pages', 'orders', 'order_items', 'activity_logs'];
    const backupData: Record<string, any[]> = {};

    for (const table of tables) {
      const data = await pool.query(`SELECT * FROM ${table}`);
      backupData[table] = data.rows;
    }

    await logActivity(req.user?.id, 'BACKUP_CREATE', { timestamp: new Date() }, req.ip);

    res.json({
      timestamp: new Date().toISOString(),
      data: backupData,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création de la sauvegarde.' });
  }
});

// POST /api/admin/restore
router.post('/restore', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  const payload = req.body.backupData || req.body.data || req.body;
  if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'Données de sauvegarde invalides.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clean existing tables in order of foreign key dependencies if present in payload
    const knownTables = ['order_items', 'orders', 'products', 'categories', 'pages', 'users'];
    for (const table of knownTables) {
      if (Array.isArray(payload[table])) {
        await client.query(`DELETE FROM ${table}`);
      }
    }

    // Restore data for each table present
    for (const table of knownTables.slice().reverse()) {
      if (Array.isArray(payload[table]) && payload[table].length > 0) {
        const rows = payload[table];
        for (const row of rows) {
          const keys = Object.keys(row);
          const values = Object.values(row);
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
          const columns = keys.map((k) => `"${k}"`).join(', ');
          await client.query(
            `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
        }
      }
    }

    await client.query('COMMIT');
    await logActivity(req.user?.id, 'BACKUP_RESTORE', { restoredTables: Object.keys(payload) }, req.ip);

    res.json({
      message: 'Base de données restaurée avec succès.',
      restoredTables: Object.keys(payload),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Erreur lors de la restauration de la base de données.' });
  } finally {
    client.release();
  }
});

// GET /api/admin/vendors - List all vendors for admin review
router.get('/vendors', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
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

// GET /api/admin/commissions - Admin financial summary (Sales, COD, Commissions, Vendor Payouts)
router.get('/commissions', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const summaryRes = await pool.query(`
      SELECT
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'COD' AND status IN ('PENDING', 'CONFIRMED') THEN total_amount ELSE 0 END), 0) as pending_cod_amount,
        COALESCE(SUM(CASE WHEN status IN ('PAID', 'DELIVERED') THEN total_amount ELSE 0 END), 0) as collected_amount,
        COALESCE(SUM(commission_amount), 0) as total_commission,
        COALESCE(SUM(vendor_payout), 0) as total_vendor_payout
      FROM orders
      WHERE status != 'CANCELLED'
    `);

    const vendorsRes = await pool.query(`
      SELECT
        v.id as vendor_id,
        v.company_name,
        COALESCE(v.commission_rate, 10.00) as commission_rate,
        COUNT(DISTINCT oi.order_id) as total_orders,
        COALESCE(SUM(oi.unit_price * oi.quantity), 0) as total_sales,
        COALESCE(SUM(oi.commission_amount), 0) as total_commission,
        COALESCE(SUM(oi.vendor_payout), 0) as net_payout
      FROM vendors v
      LEFT JOIN order_items oi ON v.id = oi.vendor_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'CANCELLED'
      GROUP BY v.id, v.company_name, v.commission_rate
      ORDER BY v.id DESC
    `);

    const summary = summaryRes.rows[0];

    res.json({
      totalSales: parseFloat(summary.total_sales),
      pendingCodAmount: parseFloat(summary.pending_cod_amount),
      collectedAmount: parseFloat(summary.collected_amount),
      totalCommission: parseFloat(summary.total_commission),
      totalVendorPayout: parseFloat(summary.total_vendor_payout),
      vendors: vendorsRes.rows.map((row) => ({
        vendor_id: row.vendor_id,
        company_name: row.company_name,
        commission_rate: parseFloat(row.commission_rate),
        total_orders: parseInt(row.total_orders, 10),
        total_sales: parseFloat(row.total_sales),
        total_commission: parseFloat(row.total_commission),
        net_payout: parseFloat(row.net_payout),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des rapports de commissions.' });
  }
});

// PUT /api/admin/vendors/:id/commission - Update vendor specific commission rate
router.put('/vendors/:id/commission', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  const { commission_rate } = req.body;
  if (commission_rate === undefined || isNaN(Number(commission_rate)) || Number(commission_rate) < 0 || Number(commission_rate) > 100) {
    return res.status(400).json({ error: 'Taux de commission invalide (doit être un pourcentage entre 0 et 100).' });
  }

  try {
    const result = await pool.query(
      `UPDATE vendors SET commission_rate = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [Number(commission_rate), req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Boutique vendeur introuvable.' });
    }

    await logActivity(req.user?.id, 'VENDOR_COMMISSION_UPDATE', { id: req.params.id, commission_rate }, req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du taux de commission.' });
  }
});

// PUT /api/admin/vendors/:id/status - Update vendor store status (APPROVED, PENDING, REJECTED)
router.put('/vendors/:id/status', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
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

// GET /api/admin/delivery-rates - List all 58 Wilayas delivery rates
router.get('/delivery-rates', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM delivery_rates ORDER BY wilaya_code ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des tarifs de livraison.' });
  }
});

// PUT /api/admin/delivery-rates/:id - Update delivery rate for a Wilaya
router.put('/delivery-rates/:id', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  const { home_fee, desk_fee, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE delivery_rates
       SET home_fee = COALESCE($1, home_fee),
           desk_fee = COALESCE($2, desk_fee),
           is_active = COALESCE($3, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [home_fee, desk_fee, is_active, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarif de livraison non trouvé.' });
    }

    await logActivity(req.user?.id, 'DELIVERY_RATE_UPDATE', { id: req.params.id, home_fee, desk_fee }, req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour des tarifs.' });
  }
});

// POST /api/admin/ai/assistant and /api/ai/assistant
const aiAssistantHandler = async (req: AuthRequest, res: any) => {
  const { prompt, type } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Le prompt est obligatoire.' });
  }

  let aiResponse = '';
  if (type === 'product_description') {
    aiResponse = `Description optimisée SEO pour "${prompt}" :\nDécouvrez notre produit exceptionnel "${prompt}", conçu avec des matériaux de haute qualité pour vous offrir une expérience inégalée. Alliant élégance, durabilité et performance supérieure.`;
  } else if (type === 'cms_article') {
    aiResponse = `# Guide complet : ${prompt}\n\nDans un monde en constante évolution, l'innovation joue un rôle clé. Cet article explore comment ${prompt} transforme l'expérience utilisateur et apporte une valeur ajoutée mesurable.\n\n## Points Clés\n- Innovation continue\n- Qualité garantie\n- Satisfaction client`;
  } else {
    aiResponse = `Analyse par l'assistant IA pour "${prompt}" :\nLes données indiquent une tendance très positive. Nous recommandons de surveiller le niveau des stocks et d'optimiser les fiches produits pour maximiser les conversions.`;
  }

  res.json({
    prompt,
    type: type || 'general',
    response: aiResponse,
  });
};

router.post('/ai/assistant', authenticateToken, requireRole(['ADMIN', 'MANAGER']), aiAssistantHandler);
router.post('/assistant', authenticateToken, requireRole(['ADMIN', 'MANAGER']), aiAssistantHandler);

// GET /api/admin/export/orders - Export orders in CSV, JSON, or Google Sheets format
router.get('/export/orders', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  try {
    const format = ((req.query.format as string) || 'json').toLowerCase();
    const orders = await exportOrdersData();

    if (format === 'csv') {
      const csv = formatOrdersToCsv(orders);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="orders-export.csv"');
      return res.status(200).send(csv);
    }

    if (format === 'sheets') {
      const syncResult = await syncOrdersToGoogleSheets(orders);
      return res.json(syncResult);
    }

    const jsonData = formatOrdersToJson(orders);
    res.json(jsonData);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l’exportation des commandes.' });
  }
});

// POST /api/admin/export/google-sheets - Trigger Google Sheets synchronization
router.post('/export/google-sheets', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  try {
    const orders = await exportOrdersData();
    const result = await syncOrdersToGoogleSheets(orders);
    await logActivity(req.user?.id, 'GOOGLE_SHEETS_SYNC', { mode: result.mode, synced: result.synced, count: result.exportedCount }, req.ip);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la synchronisation avec Google Sheets.' });
  }
});

export default router;
