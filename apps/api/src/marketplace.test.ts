import pool from './db';
import fs from 'fs';
import path from 'path';

jest.mock('./db', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

import request from 'supertest';
import app from './index';

const mockedPool = pool as jest.Mocked<typeof pool>;

describe('Mission 07: MBA Marketplace Front Public & Order Tracking API', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Order Tracking Endpoint (GET /api/orders/:id)', () => {
    it('should return 404 if order is not found', async () => {
      (mockedPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/orders/NONEXISTENT');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Commande introuvable.');
    });

    it('should return order details and items when order exists', async () => {
      const mockOrder = {
        id: 1,
        order_number: 'CMD-12345',
        customer_name: 'Karim Benali',
        customer_email: 'karim@example.com',
        shipping_address: '[16 - Alger] Rue Didouche Mourad',
        total_amount: 15000,
        status: 'PAID',
        payment_method: 'TEST_CARD',
      };

      const mockItems = [
        { id: 1, order_id: 1, product_id: 10, product_name: 'Smartphone Pro', unit_price: 15000, quantity: 1 },
      ];

      (mockedPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: mockItems });

      const res = await request(app).get('/api/orders/CMD-12345');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('order');
      expect(res.body).toHaveProperty('items');
      expect(res.body.order.order_number).toBe('CMD-12345');
      expect(res.body.items.length).toBe(1);
    });
  });

  describe('Astro Frontend Structure & Mission Verification', () => {
    it('should verify all required Astro marketplace pages exist in apps/web-astro', () => {
      const astroSrc = path.join(rootDir, 'apps/web-astro/src');

      expect(fs.existsSync(path.join(astroSrc, 'layouts/Layout.astro'))).toBe(true);
      expect(fs.existsSync(path.join(astroSrc, 'utils/format.ts'))).toBe(true);
      expect(fs.existsSync(path.join(astroSrc, 'pages/index.astro'))).toBe(true);
      expect(fs.existsSync(path.join(astroSrc, 'pages/catalog.astro'))).toBe(true);
      expect(fs.existsSync(path.join(astroSrc, 'pages/products/[slug].astro'))).toBe(true);
      expect(fs.existsSync(path.join(astroSrc, 'pages/vendors/index.astro'))).toBe(true);
      expect(fs.existsSync(path.join(astroSrc, 'pages/vendors/[slug].astro'))).toBe(true);
      expect(fs.existsSync(path.join(astroSrc, 'pages/cart.astro'))).toBe(true);
      expect(fs.existsSync(path.join(astroSrc, 'pages/checkout.astro'))).toBe(true);
      expect(fs.existsSync(path.join(astroSrc, 'pages/orders/index.astro'))).toBe(true);
      expect(fs.existsSync(path.join(astroSrc, 'pages/orders/[id].astro'))).toBe(true);
    });

    it('should mark Mission 07 as Terminée in INDEX.md', () => {
      const indexPath = path.join(rootDir, 'missionMBA/INDEX.md');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toMatch(/\|\s*\*\*07\*\*\s*\|\s*MBA Marketplace \(Front Public Client\)\s*\|.*\|\s*Terminée\s*\|/);
    });
  });
});
