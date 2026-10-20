import { Router } from 'express';
import pool from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { logActivity } from '../services/logger';

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

    res.json({
      totalOrders: parseInt(ordersRes.rows[0].total_orders, 10),
      totalRevenue: parseFloat(ordersRes.rows[0].total_revenue),
      totalProducts: parseInt(productsRes.rows[0].total_products, 10),
      lowStockProducts: parseInt(lowStockRes.rows[0].low_stock_count, 10),
      totalUsers: parseInt(usersRes.rows[0].total_users, 10),
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

export default router;
