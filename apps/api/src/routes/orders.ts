import { Router, Response } from 'express';
import pool from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/orders (Admin/Manager)
router.get('/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes.' });
  }
});

// POST /api/orders (Public / Checkout avec Test Payment)
router.post('/', async (req: AuthRequest, res: Response) => {
  const { customer_name, customer_email, shipping_address, items, test_card_number } = req.body;

  if (!customer_name || !customer_email || !shipping_address || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Champs requis manquants pour la commande.' });
  }

  // Verification du paiement test (Exemple: 4242 4242 4242 4242 est valide)
  const isPaymentValid = !test_card_number || test_card_number.replace(/\s/g, '').endsWith('4242') || test_card_number === 'TEST_SUCCESS';
  if (!isPaymentValid) {
    return res.status(400).json({ error: 'Échec de la carte bancaire de test. Utilisez le numéro 4242 4242 4242 4242.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let totalAmount = 0;
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

      // Diminuer le stock
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, product.id]);

      const itemTotal = Number(product.price) * Number(item.quantity);
      totalAmount += itemTotal;

      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity: item.quantity,
      });
    }

    const orderNumber = `CMD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const userId = req.user ? req.user.id : null;

    const orderRes = await client.query(
      `INSERT INTO orders (order_number, user_id, customer_name, customer_email, shipping_address, total_amount, status, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, 'PAID', 'TEST_CARD')
       RETURNING *`,
      [orderNumber, userId, customer_name, customer_email, shipping_address, totalAmount]
    );

    const order = orderRes.rows[0];

    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.product_id, item.product_name, item.unit_price, item.quantity]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Commande validée et payée avec succès en environnement de test.', order });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message || 'Erreur lors du traitement de la commande.' });
  } finally {
    client.release();
  }
});

export default router;
