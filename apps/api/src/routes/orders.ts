import { Router, Response } from 'express';
import pool from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { clearCart, getCartKey } from './cart';

const router = Router();

function optionalAuth(req: AuthRequest, res: Response, next: () => void) {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    return authenticateToken(req, res, next);
  }
  next();
}

// GET /api/orders - Get all orders (Admin/Manager) or vendor specific
router.get('/', authenticateToken, requireRole(['ADMIN', 'MANAGER', 'VENDOR']), async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'VENDOR') {
      const vendorRes = await pool.query(`SELECT id FROM vendors WHERE user_id = $1`, [req.user.id]);
      if (vendorRes.rows.length === 0) {
        return res.json([]);
      }
      const vendorId = vendorRes.rows[0].id;
      const result = await pool.query(
        `SELECT DISTINCT o.*
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         WHERE oi.vendor_id = $1
         ORDER BY o.id DESC`,
        [vendorId]
      );
      return res.json(result.rows);
    }

    const result = await pool.query('SELECT * FROM orders ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes.' });
  }
});

// GET /api/orders/my-orders - Customer purchase history
router.get('/my-orders', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non identifié.' });
    }

    const ordersRes = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC', [userId]);

    const ordersWithItems = [];
    for (const order of ordersRes.rows) {
      const itemsRes = await pool.query(
        `SELECT oi.*, v.company_name as vendor_name
         FROM order_items oi
         LEFT JOIN vendors v ON oi.vendor_id = v.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      ordersWithItems.push({
        ...order,
        items: itemsRes.rows,
      });
    }

    res.json(ordersWithItems);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération de votre historique de commandes.' });
  }
});

// GET /api/orders/vendor/me - Vendor specific order history
router.get('/vendor/me', authenticateToken, requireRole(['VENDOR', 'ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
  try {
    const vendorRes = await pool.query(`SELECT id FROM vendors WHERE user_id = $1`, [req.user?.id]);
    let vendorId: number | null = null;
    if (vendorRes.rows.length > 0) {
      vendorId = vendorRes.rows[0].id;
    }

    let ordersQuery = `
      SELECT DISTINCT o.*
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
    `;
    let queryParams: any[] = [];

    if (req.user?.role === 'VENDOR' && vendorId) {
      ordersQuery += ` WHERE oi.vendor_id = $1`;
      queryParams.push(vendorId);
    }

    ordersQuery += ` ORDER BY o.id DESC`;

    const ordersRes = await pool.query(ordersQuery, queryParams);
    res.json(ordersRes.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes du vendeur.' });
  }
});

// PUT /api/orders/:id/status (Admin/Manager/Vendor)
router.put('/:id/status', authenticateToken, requireRole(['ADMIN', 'MANAGER', 'VENDOR']), async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const validStatuses = ['PENDING', 'CONFIRMED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Statut de commande invalide.' });
  }

  const orderId = req.params.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const checkRes = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Commande introuvable.' });
    }

    const currentOrder = checkRes.rows[0];

    // Restock atomically if order status is changed to CANCELLED and was not already CANCELLED
    if (status === 'CANCELLED' && currentOrder.status !== 'CANCELLED') {
      const itemsRes = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
      for (const item of itemsRes.rows) {
        if (item.product_id) {
          await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
        }
      }
    }

    const updateRes = await client.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, orderId]
    );

    await client.query('COMMIT');
    res.json(updateRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut de la commande.' });
  } finally {
    client.release();
  }
});

// GET /api/orders/:id/split - Group/dissociate order items by vendor
router.get('/:id/split', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    let orderResult;
    if (isNaN(Number(id))) {
      orderResult = await pool.query('SELECT * FROM orders WHERE order_number = $1', [id]);
    } else {
      orderResult = await pool.query('SELECT * FROM orders WHERE id = $1 OR order_number = $2', [id, id]);
    }

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Commande introuvable.' });
    }

    const order = orderResult.rows[0];
    const itemsResult = await pool.query(
      `SELECT oi.*, v.company_name as vendor_name, v.slug as vendor_slug
       FROM order_items oi
       LEFT JOIN vendors v ON oi.vendor_id = v.id
       WHERE oi.order_id = $1`,
      [order.id]
    );

    const vendorMap = new Map<number | string, any>();

    itemsResult.rows.forEach((item) => {
      const vKey = item.vendor_id || 'platform';
      const vName = item.vendor_name || 'Ma Boutique Algérienne';
      if (!vendorMap.has(vKey)) {
        vendorMap.set(vKey, {
          vendor_id: item.vendor_id,
          vendor_name: vName,
          vendor_slug: item.vendor_slug || null,
          items: [],
          subtotal: 0,
        });
      }

      const group = vendorMap.get(vKey);
      const itemSubtotal = Number(item.unit_price) * Number(item.quantity);
      group.items.push(item);
      group.subtotal += itemSubtotal;
    });

    res.json({
      order,
      vendorGroups: Array.from(vendorMap.values()),
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la dissociation des commandes.' });
  }
});

// GET /api/orders/:id - Get order tracking details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    let orderResult;
    if (isNaN(Number(id))) {
      orderResult = await pool.query('SELECT * FROM orders WHERE order_number = $1', [id]);
    } else {
      orderResult = await pool.query('SELECT * FROM orders WHERE id = $1 OR order_number = $2', [id, id]);
    }

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Commande introuvable.' });
    }

    const order = orderResult.rows[0];
    const itemsResult = await pool.query(
      `SELECT oi.*, v.company_name as vendor_name
       FROM order_items oi
       LEFT JOIN vendors v ON oi.vendor_id = v.id
       WHERE oi.order_id = $1`,
      [order.id]
    );

    res.json({
      order,
      items: itemsResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la commande.' });
  }
});

// POST /api/orders (Public / Checkout avec Test Payment ou COD)
router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { customer_name, customer_email, shipping_address, items, test_card_number, payment_method } = req.body;

  if (!customer_name || !customer_email || !shipping_address || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Champs requis manquants pour la commande.' });
  }

  // Payment method logic: 'TEST_CARD' or 'COD'
  const mode = payment_method || (test_card_number ? 'TEST_CARD' : 'COD');
  if (mode === 'TEST_CARD') {
    const isPaymentValid = !test_card_number || test_card_number.replace(/\s/g, '').endsWith('4242') || test_card_number === 'TEST_SUCCESS';
    if (!isPaymentValid) {
      return res.status(400).json({ error: 'Échec de la carte bancaire de test. Utilisez le numéro 4242 4242 4242 4242.' });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let itemsSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const prodRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
      if (prodRes.rows.length === 0) {
        throw new Error(`Produit ID ${item.product_id} non trouvé.`);
      }
      const product = prodRes.rows[0];

      if (product.stock < item.quantity) {
        throw new Error(`Stock insuffisant pour ${product.name}. Stock disponible: ${product.stock}`);
      }

      // Deduct stock atomically
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, product.id]);

      const itemTotal = Number(product.price) * Number(item.quantity);
      itemsSubtotal += itemTotal;

      validatedItems.push({
        product_id: product.id,
        vendor_id: product.vendor_id || null,
        product_name: product.name,
        unit_price: product.price,
        quantity: item.quantity,
      });
    }

    // Shipping fee calculation based on wilaya
    let shippingFee = 0;
    const wilayaInput = req.body.wilaya || req.body.wilaya_code;
    const deliveryType = req.body.delivery_type === 'desk' ? 'desk' : 'home';

    let targetWilayaCode: number | null = null;
    if (wilayaInput && !isNaN(Number(wilayaInput))) {
      targetWilayaCode = Number(wilayaInput);
    } else if (shipping_address) {
      const match = shipping_address.match(/\[?(\d{1,2})\b/);
      if (match) {
        targetWilayaCode = parseInt(match[1], 10);
      }
    }

    if (targetWilayaCode) {
      const rateRes = await client.query('SELECT * FROM delivery_rates WHERE wilaya_code = $1 AND is_active = true', [targetWilayaCode]);
      if (rateRes.rows.length > 0) {
        const rate = rateRes.rows[0];
        shippingFee = deliveryType === 'desk' ? Number(rate.desk_fee) : Number(rate.home_fee);
      }
    }

    const totalAmount = itemsSubtotal + shippingFee;
    const orderNumber = `CMD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const userId = req.user ? req.user.id : null;
    const initialStatus = mode === 'TEST_CARD' ? 'PAID' : 'PENDING';

    const orderRes = await client.query(
      `INSERT INTO orders (order_number, user_id, customer_name, customer_email, shipping_address, shipping_fee, total_amount, status, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [orderNumber, userId, customer_name, customer_email, shipping_address, shippingFee, totalAmount, initialStatus, mode]
    );

    const order = orderRes.rows[0];

    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, vendor_id, product_name, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.product_id, item.vendor_id, item.product_name, item.unit_price, item.quantity]
      );
    }

    await client.query('COMMIT');

    // Clear persistent cart
    const cartKey = getCartKey(req);
    await clearCart(cartKey);

    res.status(201).json({
      message: mode === 'TEST_CARD'
        ? 'Commande validée et payée avec succès en environnement de test.'
        : 'Commande enregistrée avec succès. Paiement à la livraison.',
      order,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message || 'Erreur lors du traitement de la commande.' });
  } finally {
    client.release();
  }
});

export default router;
