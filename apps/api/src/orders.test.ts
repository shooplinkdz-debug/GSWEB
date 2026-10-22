import pool from './db';
import fs from 'fs';
import path from 'path';

jest.mock('./db', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  return {
    __esModule: true,
    default: {
      query: jest.fn(),
      connect: jest.fn().mockResolvedValue(mockClient),
    },
    mockClient,
  };
});

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from './index';
// @ts-ignore
import { mockClient } from './db';

const mockedPool = pool as jest.Mocked<typeof pool>;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_12345';

describe('Mission 11: Panier Persistent & Commandes Multi-Boutiques API', () => {
  const adminToken = jwt.sign({ id: 1, email: 'admin@webmanager.local', role: 'ADMIN' }, JWT_SECRET);
  const vendorToken = jwt.sign({ id: 2, email: 'vendor@techstore.local', role: 'VENDOR' }, JWT_SECRET);
  const customerToken = jwt.sign({ id: 3, email: 'customer@webmanager.local', role: 'CUSTOMER' }, JWT_SECRET);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Persistent Cart API (/api/cart)', () => {
    it('should update and retrieve persistent cart', async () => {
      const mockCartItems = [{ product_id: 1, quantity: 2 }];
      const mockProduct = {
        id: 1,
        sku: 'PROD-1',
        name: 'Smartphone',
        slug: 'smartphone',
        price: '15000.00',
        stock: 10,
        image_url: 'http://example.com/img.jpg',
        vendor_id: 1,
        vendor_name: 'TechStore',
      };

      // Save cart
      const postRes = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ items: mockCartItems });

      expect(postRes.status).toBe(200);
      expect(postRes.body.count).toBe(1);

      // Fetch cart
      (mockedPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockProduct] });

      const getRes = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.items.length).toBe(1);
      expect(getRes.body.totalAmount).toBe(30000);
    });

    it('should clear persistent cart', async () => {
      const deleteRes = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toContain('Panier vidé');
    });

    it('should sync guest cart to user cart', async () => {
      const syncRes = await request(app)
        .post('/api/cart/sync')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ guest_items: [{ product_id: 2, quantity: 1 }] });

      expect(syncRes.status).toBe(200);
      expect(syncRes.body.message).toContain('Panier synchronisé');
    });
  });

  describe('GET /api/orders', () => {
    it('should return 401 if unauthenticated', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(401);
    });

    it('should return orders list if user is ADMIN', async () => {
      const orders = [
        { id: 1, order_number: 'CMD-101', customer_name: 'John Doe', total_amount: 999.99, status: 'PAID' },
      ];
      (mockedPool.query as jest.Mock).mockResolvedValueOnce({ rows: orders });

      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(orders);
    });
  });

  describe('Customer & Vendor Orders API', () => {
    it('should retrieve customer order history via /api/orders/my-orders', async () => {
      const mockOrders = [{ id: 10, order_number: 'CMD-10', total_amount: 15000, status: 'PENDING' }];
      const mockItems = [{ id: 1, order_id: 10, product_name: 'Article A', unit_price: 15000, quantity: 1, vendor_name: 'TechStore' }];

      (mockedPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockOrders })
        .mockResolvedValueOnce({ rows: mockItems });

      const res = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].items.length).toBe(1);
    });

    it('should retrieve vendor orders via /api/orders/vendor/me', async () => {
      (mockedPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // vendor profile
        .mockResolvedValueOnce({ rows: [{ id: 10, order_number: 'CMD-10' }] }); // vendor orders

      const res = await request(app)
        .get('/api/orders/vendor/me')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('should dissociate/split order items by vendor via /api/orders/:id/split', async () => {
      const mockOrder = { id: 5, order_number: 'CMD-SPLIT-1', total_amount: 25000 };
      const mockItems = [
        { id: 1, order_id: 5, product_name: 'Produit Vendeur 1', unit_price: 10000, quantity: 1, vendor_id: 1, vendor_name: 'Boutique Alpha' },
        { id: 2, order_id: 5, product_name: 'Produit Vendeur 2', unit_price: 15000, quantity: 1, vendor_id: 2, vendor_name: 'Boutique Beta' },
      ];

      (mockedPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: mockItems });

      const res = await request(app).get('/api/orders/5/split');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('vendorGroups');
      expect(res.body.vendorGroups.length).toBe(2);
      expect(res.body.vendorGroups[0].vendor_name).toBe('Boutique Alpha');
      expect(res.body.vendorGroups[1].vendor_name).toBe('Boutique Beta');
    });
  });

  describe('Order Status Progression & Cancellation Stock Restoration', () => {
    it('should update order status to SHIPPED', async () => {
      const mockCurrentOrder = { id: 1, status: 'PAID' };
      const mockUpdatedOrder = { id: 1, status: 'SHIPPED' };

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockCurrentOrder] }) // FOR UPDATE
        .mockResolvedValueOnce({ rows: [mockUpdatedOrder] }) // UPDATE status
        .mockResolvedValueOnce({}); // COMMIT

      const res = await request(app)
        .put('/api/orders/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SHIPPED' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('SHIPPED');
    });

    it('should restore product stock atomically when order status changes to CANCELLED', async () => {
      const mockCurrentOrder = { id: 1, status: 'PENDING' };
      const mockItems = [{ product_id: 101, quantity: 3 }];
      const mockCancelledOrder = { id: 1, status: 'CANCELLED' };

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockCurrentOrder] }) // FOR UPDATE
        .mockResolvedValueOnce({ rows: mockItems }) // SELECT order_items
        .mockResolvedValueOnce({}) // UPDATE products stock + 3
        .mockResolvedValueOnce({ rows: [mockCancelledOrder] }) // UPDATE order status
        .mockResolvedValueOnce({}); // COMMIT

      const res = await request(app)
        .put('/api/orders/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CANCELLED' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('CANCELLED');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('POST /api/orders', () => {
    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({ customer_name: 'Jane Doe' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Champs requis manquants pour la commande.');
    });

    it('should return 400 if test card number is invalid', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          customer_name: 'Jane Doe',
          customer_email: 'jane@example.com',
          shipping_address: '123 Main St',
          items: [{ product_id: 1, quantity: 1 }],
          test_card_number: '1111 2222 3333 4444',
          payment_method: 'TEST_CARD',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Échec de la carte bancaire de test');
    });

    it('should create COD order successfully with customer phone and platform commission calculation', async () => {
      const mockProduct1 = { id: 1, name: 'Prod A', price: '10000.00', stock: 10, vendor_id: 1, vendor_commission_rate: '10.00' };
      const mockDeliveryRate = { wilaya_code: 16, home_fee: '400.00', desk_fee: '250.00' };
      const mockCreatedOrder = {
        id: 15,
        order_number: 'CMD-COD-1',
        customer_phone: '0550123456',
        shipping_fee: 400,
        total_amount: 10400,
        commission_amount: 1000,
        vendor_payout: 9000,
        status: 'PENDING',
        payment_method: 'COD',
        is_confirmed: false,
      };

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockProduct1] }) // SELECT product 1 FOR UPDATE
        .mockResolvedValueOnce({}) // UPDATE stock 1
        .mockResolvedValueOnce({ rows: [mockDeliveryRate] }) // SELECT delivery rate
        .mockResolvedValueOnce({ rows: [mockCreatedOrder] }) // INSERT order
        .mockResolvedValueOnce({}) // INSERT order_item 1
        .mockResolvedValueOnce({}); // COMMIT

      const res = await request(app)
        .post('/api/orders')
        .send({
          customer_name: 'Karim Algérois',
          customer_email: 'karim@example.dz',
          customer_phone: '0550123456',
          shipping_address: '[16 - Alger] Rue Didouche',
          items: [{ product_id: 1, quantity: 1 }],
          payment_method: 'COD',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain('Paiement à la livraison');
      expect(res.body.order.payment_method).toBe('COD');
      expect(res.body.order.commission_amount).toBe(1000);
      expect(res.body.order.vendor_payout).toBe(9000);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should create multi-vendor order successfully with delivery fee calculation', async () => {
      const mockProduct1 = { id: 1, name: 'Prod A', price: '1000.00', stock: 10, vendor_id: 1, vendor_commission_rate: '10.00' };
      const mockProduct2 = { id: 2, name: 'Prod B', price: '2000.00', stock: 5, vendor_id: 2, vendor_commission_rate: '15.00' };
      const mockDeliveryRate = { wilaya_code: 16, home_fee: '400.00', desk_fee: '250.00' };
      const mockCreatedOrder = {
        id: 10,
        order_number: 'CMD-12345',
        shipping_fee: 400,
        total_amount: 3400,
        commission_amount: 400, // (1000*0.1) + (2000*0.15) = 100 + 300 = 400
        vendor_payout: 2600, // 900 + 1700 = 2600
        status: 'PAID',
        payment_method: 'TEST_CARD',
      };

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockProduct1] }) // SELECT product 1 FOR UPDATE
        .mockResolvedValueOnce({}) // UPDATE stock 1
        .mockResolvedValueOnce({ rows: [mockProduct2] }) // SELECT product 2 FOR UPDATE
        .mockResolvedValueOnce({}) // UPDATE stock 2
        .mockResolvedValueOnce({ rows: [mockDeliveryRate] }) // SELECT delivery rate
        .mockResolvedValueOnce({ rows: [mockCreatedOrder] }) // INSERT order
        .mockResolvedValueOnce({}) // INSERT order_item 1
        .mockResolvedValueOnce({}) // INSERT order_item 2
        .mockResolvedValueOnce({}); // COMMIT

      const res = await request(app)
        .post('/api/orders')
        .send({
          customer_name: 'Jane Doe',
          customer_email: 'jane@example.com',
          shipping_address: '[16 - Alger] 10 Rue Didouche',
          items: [
            { product_id: 1, quantity: 1 },
            { product_id: 2, quantity: 1 },
          ],
          test_card_number: '4242 4242 4242 4242',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body.order).toEqual(mockCreatedOrder);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return 400 if stock is insufficient', async () => {
      const mockProduct = { id: 1, name: 'Smartphone Pro', price: '999.99', stock: 1 };

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockProduct] }) // SELECT product FOR UPDATE
        .mockResolvedValueOnce({}); // ROLLBACK (triggered by throw)

      const res = await request(app)
        .post('/api/orders')
        .send({
          customer_name: 'Jane Doe',
          customer_email: 'jane@example.com',
          shipping_address: '123 Main St',
          items: [{ product_id: 1, quantity: 5 }],
          test_card_number: 'TEST_SUCCESS',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Stock insuffisant');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('Phone / SMS Order Confirmation API', () => {
    it('should confirm COD order via PUT /api/orders/:id/confirm-phone', async () => {
      const mockPendingOrder = { id: 20, status: 'PENDING', is_confirmed: false };
      const mockConfirmedOrder = { id: 20, status: 'CONFIRMED', is_confirmed: true };

      (mockedPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockPendingOrder] })
        .mockResolvedValueOnce({ rows: [mockConfirmedOrder] });

      const res = await request(app).put('/api/orders/20/confirm-phone');

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('confirmée par téléphone');
      expect(res.body.order.status).toBe('CONFIRMED');
      expect(res.body.order.is_confirmed).toBe(true);
    });
  });

  describe('Mission 12: Logistique & Grille Tarifaire de Livraison (58 Wilayas)', () => {
    it('should calculate desk (point relais) shipping fee correctly for Wilaya code', async () => {
      const mockProduct = { id: 1, name: 'Article Wilaya', price: '5000.00', stock: 10, vendor_id: 1, vendor_commission_rate: '10.00' };
      const mockDeliveryRate = { wilaya_code: 31, home_fee: '600.00', desk_fee: '400.00' };
      const mockOrder = {
        id: 25,
        order_number: 'CMD-WILAYA-31',
        shipping_fee: 400,
        total_amount: 5400,
        status: 'PAID',
        payment_method: 'TEST_CARD',
      };

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockProduct] }) // SELECT product
        .mockResolvedValueOnce({}) // UPDATE stock
        .mockResolvedValueOnce({ rows: [mockDeliveryRate] }) // SELECT delivery rate
        .mockResolvedValueOnce({ rows: [mockOrder] }) // INSERT order
        .mockResolvedValueOnce({}) // INSERT order_item
        .mockResolvedValueOnce({}); // COMMIT

      const res = await request(app)
        .post('/api/orders')
        .send({
          customer_name: 'Amine Oran',
          customer_email: 'amine@example.dz',
          shipping_address: '[31 - Oran] Centre Ville',
          wilaya_code: 31,
          delivery_type: 'desk',
          items: [{ product_id: 1, quantity: 1 }],
          test_card_number: '4242 4242 4242 4242',
        });

      expect(res.status).toBe(201);
      expect(res.body.order.shipping_fee).toBe(400);
      expect(res.body.order.total_amount).toBe(5400);
    });

    it('should allow admin to update delivery rates for a Wilaya', async () => {
      const mockUpdatedRate = {
        id: 16,
        wilaya_code: 16,
        wilaya_name: 'Alger',
        home_fee: '500.00',
        desk_fee: '300.00',
        is_active: true,
      };

      (mockedPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUpdatedRate] });

      const res = await request(app)
        .put('/api/admin/delivery-rates/16')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ home_fee: 500, desk_fee: 300 });

      expect(res.status).toBe(200);
      expect(res.body.home_fee).toBe('500.00');
      expect(res.body.desk_fee).toBe('300.00');
    });

    it('should verify Mission 11, Mission 12, Mission 13 & Mission 14 are marked as Terminée in INDEX.md', () => {
      const rootDir = path.resolve(__dirname, '../../..');
      const indexPath = path.join(rootDir, 'missionMBA/INDEX.md');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toMatch(/\|\s*\*\*11\*\*\s*\|\s*Panier & Commandes Multi-Boutiques\s*\|.*\|\s*Terminée\s*\|/);
      expect(content).toMatch(/\|\s*\*\*12\*\*\s*\|.*Logistique & Livraison Algérie \(58 Wilayas\).*\|\s*Terminée\s*\|/);
      expect(content).toMatch(/\|\s*\*\*13\*\*\s*\|.*Paiements \(COD\) & Commissions Vendeurs.*\|\s*Terminée\s*\|/);
      expect(content).toMatch(/\|\s*\*\*14\*\*\s*\|.*Recherche Intelligente & Assistant IA.*\|\s*Terminée\s*\|/);
    });
  });
});
