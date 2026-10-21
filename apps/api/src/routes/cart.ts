import { Router, Response } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getCache, setCache, deleteCache } from '../services/redis';

const router = Router();

// In-memory fallback for persistent carts when Redis is unavailable
const memoryCartStore = new Map<string, any[]>();

export function getCartKey(req: AuthRequest): string {
  if (req.user && req.user.id) {
    return `cart:user:${req.user.id}`;
  }
  const sessionId = req.headers['x-session-id'] || req.query.session_id || 'guest-session';
  return `cart:session:${sessionId}`;
}

export async function fetchCartItems(key: string): Promise<Array<{ product_id: number; quantity: number }>> {
  const cached = await getCache(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Fallback
    }
  }
  return memoryCartStore.get(key) || [];
}

export async function saveCartItems(key: string, items: Array<{ product_id: number; quantity: number }>): Promise<void> {
  const value = JSON.stringify(items);
  await setCache(key, value, 86400 * 7); // 7 days TTL
  memoryCartStore.set(key, items);
}

export async function clearCart(key: string): Promise<void> {
  await deleteCache(key);
  memoryCartStore.delete(key);
}

// Optional auth middleware attachment so req.user is set if token exists
function optionalAuth(req: AuthRequest, res: Response, next: () => void) {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    return authenticateToken(req, res, next);
  }
  next();
}

// GET /api/cart - Get current persistent cart
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const key = getCartKey(req);
    const rawItems = await fetchCartItems(key);

    if (rawItems.length === 0) {
      return res.json({ items: [], totalAmount: 0, itemCount: 0 });
    }

    const populatedItems = [];
    let totalAmount = 0;
    let itemCount = 0;

    for (const item of rawItems) {
      const prodRes = await pool.query(
        `SELECT p.id, p.sku, p.name, p.slug, p.price, p.stock, p.image_url, p.vendor_id, v.company_name as vendor_name
         FROM products p
         LEFT JOIN vendors v ON p.vendor_id = v.id
         WHERE p.id = $1 AND p.is_published = true`,
        [item.product_id]
      );

      if (prodRes.rows.length > 0) {
        const product = prodRes.rows[0];
        const unitPrice = parseFloat(product.price);
        const itemTotal = unitPrice * item.quantity;
        totalAmount += itemTotal;
        itemCount += item.quantity;

        populatedItems.push({
          product_id: product.id,
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          unit_price: unitPrice,
          stock: product.stock,
          image_url: product.image_url,
          vendor_id: product.vendor_id,
          vendor_name: product.vendor_name || 'Ma Boutique Algérienne',
          quantity: item.quantity,
          item_total: itemTotal,
        });
      }
    }

    res.json({
      items: populatedItems,
      totalAmount,
      itemCount,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération du panier.' });
  }
});

// POST /api/cart - Update or replace cart
router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Format du panier invalide. "items" doit être un tableau.' });
  }

  try {
    const key = getCartKey(req);
    const sanitizedItems: Array<{ product_id: number; quantity: number }> = [];

    for (const item of items) {
      if (item.product_id && item.quantity > 0) {
        sanitizedItems.push({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
        });
      }
    }

    await saveCartItems(key, sanitizedItems);
    res.json({ message: 'Panier mis à jour avec succès.', cartKey: key, count: sanitizedItems.length });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la sauvegarde du panier.' });
  }
});

// DELETE /api/cart - Clear cart
router.delete('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const key = getCartKey(req);
    await clearCart(key);
    res.json({ message: 'Panier vidé avec succès.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression du panier.' });
  }
});

// POST /api/cart/sync - Sync guest cart items into authenticated user cart
router.post('/sync', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { guest_items, session_id } = req.body;

  try {
    const userKey = `cart:user:${req.user?.id}`;
    const guestKey = session_id ? `cart:session:${session_id}` : null;

    const existingUserItems = await fetchCartItems(userKey);
    const incomingItems = guest_items || (guestKey ? await fetchCartItems(guestKey) : []);

    const mergedMap = new Map<number, number>();

    existingUserItems.forEach((it) => {
      mergedMap.set(it.product_id, (mergedMap.get(it.product_id) || 0) + it.quantity);
    });

    incomingItems.forEach((it: { product_id: number; quantity: number }) => {
      mergedMap.set(it.product_id, (mergedMap.get(it.product_id) || 0) + it.quantity);
    });

    const mergedItems: Array<{ product_id: number; quantity: number }> = [];
    mergedMap.forEach((qty, pid) => {
      mergedItems.push({ product_id: pid, quantity: qty });
    });

    await saveCartItems(userKey, mergedItems);
    if (guestKey) {
      await clearCart(guestKey);
    }

    res.json({ message: 'Panier synchronisé avec succès.', count: mergedItems.length });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la synchronisation du panier.' });
  }
});

export default router;
