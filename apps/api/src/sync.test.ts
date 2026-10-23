import pool from './db';

jest.mock('./db', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
  runMigrations: jest.fn().mockResolvedValue(undefined),
  seedDatabase: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PLATFORM_URLS } from '@web-manager/shared';
import app from './index';

const mockedPool = pool as jest.Mocked<typeof pool>;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_12345';

describe('Local Data Pass & Multi-Platform Synchronization Tests', () => {
  const adminToken = jwt.sign({ id: 1, email: 'admin@webmanager.local', role: 'ADMIN' }, JWT_SECRET);
  const customerToken = jwt.sign({ id: 2, email: 'customer@webmanager.local', role: 'CUSTOMER' }, JWT_SECRET);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('PLATFORM_URLS should export valid platform addresses', () => {
    expect(PLATFORM_URLS.marketplace).toBeDefined();
    expect(PLATFORM_URLS.admin).toBeDefined();
    expect(PLATFORM_URLS.vendor).toBeDefined();
    expect(PLATFORM_URLS.api).toBeDefined();
    expect(PLATFORM_URLS.marketplace).toContain('3000');
    expect(PLATFORM_URLS.admin).toContain('3001');
    expect(PLATFORM_URLS.vendor).toContain('3002');
  });

  describe('POST /api/admin/sync', () => {
    it('should return 401 if unauthenticated', async () => {
      const res = await request(app).post('/api/admin/sync');
      expect(res.status).toBe(401);
    });

    it('should return 403 for CUSTOMER role', async () => {
      const res = await request(app)
        .post('/api/admin/sync')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('should run sync pass and return multi-platform status for ADMIN', async () => {
      (mockedPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '9' }] }) // usersCount
        .mockResolvedValueOnce({ rows: [{ count: '4' }] }) // vendorsCount
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // productsCount
        .mockResolvedValueOnce({ rows: [{ count: '4' }] }) // ordersCount
        .mockResolvedValueOnce({ rows: [{ count: '58' }] }) // wilayasCount
        .mockResolvedValueOnce({ rows: [] }); // logActivity insert

      const res = await request(app)
        .post('/api/admin/sync')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.syncedAt).toBeDefined();
      expect(res.body.stats).toEqual({
        totalUsers: 9,
        totalVendors: 4,
        totalProducts: 10,
        totalOrders: 4,
        totalWilayas: 58,
      });
      expect(res.body.platforms).toHaveLength(3);
      expect(res.body.platforms[0].status).toBe('SYNCHRONIZED');
      expect(res.body.platforms[1].status).toBe('SYNCHRONIZED');
      expect(res.body.platforms[2].status).toBe('SYNCHRONIZED');
    });
  });
});
