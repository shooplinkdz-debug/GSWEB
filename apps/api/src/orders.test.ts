import pool from './db';

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

describe('Mission 14: Orders & Test Payment API', () => {
  const adminToken = jwt.sign({ id: 1, email: 'admin@webmanager.local', role: 'ADMIN' }, JWT_SECRET);
  const customerToken = jwt.sign({ id: 3, email: 'customer@webmanager.local', role: 'CUSTOMER' }, JWT_SECRET);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/orders', () => {
    it('should return 401 if unauthenticated', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(401);
    });

    it('should return 403 if user is CUSTOMER', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
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
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Échec de la carte bancaire de test');
    });

    it('should create order successfully with valid test card ending in 4242', async () => {
      const mockProduct = { id: 1, name: 'Smartphone Pro', price: '999.99', stock: 10 };
      const mockCreatedOrder = {
        id: 10,
        order_number: 'CMD-12345',
        total_amount: 999.99,
        status: 'PAID',
        payment_method: 'TEST_CARD',
      };

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockProduct] }) // SELECT product FOR UPDATE
        .mockResolvedValueOnce({}) // UPDATE stock
        .mockResolvedValueOnce({ rows: [mockCreatedOrder] }) // INSERT order
        .mockResolvedValueOnce({}) // INSERT order_items
        .mockResolvedValueOnce({}); // COMMIT

      const res = await request(app)
        .post('/api/orders')
        .send({
          customer_name: 'Jane Doe',
          customer_email: 'jane@example.com',
          shipping_address: '123 Main St',
          items: [{ product_id: 1, quantity: 1 }],
          test_card_number: '4242 4242 4242 4242',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Commande validée et payée avec succès en environnement de test.');
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
});
