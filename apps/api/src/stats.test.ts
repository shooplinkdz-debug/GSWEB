import pool from './db';

jest.mock('./db', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from './index';

const mockedPool = pool as jest.Mocked<typeof pool>;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_12345';

describe('Mission 15: Dashboard Stats & Admin API', () => {
  const adminToken = jwt.sign({ id: 1, email: 'admin@webmanager.local', role: 'ADMIN' }, JWT_SECRET);
  const managerToken = jwt.sign({ id: 2, email: 'manager@webmanager.local', role: 'MANAGER' }, JWT_SECRET);
  const customerToken = jwt.sign({ id: 3, email: 'customer@webmanager.local', role: 'CUSTOMER' }, JWT_SECRET);
  const vendorToken = jwt.sign({ id: 4, email: 'vendor@techstore.local', role: 'VENDOR' }, JWT_SECRET);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/stats', () => {
    it('should return 401 if unauthenticated', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
    });

    it('should return 403 for CUSTOMER role', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('should return correct statistics for ADMIN', async () => {
      (mockedPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total_orders: '12', total_revenue: '1229.97' }] }) // ordersRes
        .mockResolvedValueOnce({ rows: [{ total_products: '3' }] }) // productsRes
        .mockResolvedValueOnce({ rows: [{ low_stock_count: '1' }] }) // lowStockRes
        .mockResolvedValueOnce({ rows: [{ total_users: '5' }] }) // usersRes
        .mockResolvedValueOnce({ rows: [{ active_vendors: '2' }] }); // vendorsRes

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        totalOrders: 12,
        totalRevenue: 1229.97,
        totalProducts: 3,
        lowStockProducts: 1,
        totalUsers: 5,
        activeVendors: 2,
      });
    });

    it('should return correct statistics for MANAGER', async () => {
      (mockedPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total_orders: '0', total_revenue: '0' }] }) // ordersRes
        .mockResolvedValueOnce({ rows: [{ total_products: '0' }] }) // productsRes
        .mockResolvedValueOnce({ rows: [{ low_stock_count: '0' }] }) // lowStockRes
        .mockResolvedValueOnce({ rows: [{ total_users: '1' }] }) // usersRes
        .mockResolvedValueOnce({ rows: [{ active_vendors: '0' }] }); // vendorsRes

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        lowStockProducts: 0,
        totalUsers: 1,
        activeVendors: 0,
      });
    });
  });

  describe('Mission 13: Commissions & Payouts Financial Reports API', () => {
    it('should return admin financial summary via GET /api/admin/commissions', async () => {
      const mockSummary = [{
        total_sales: '50000.00',
        pending_cod_amount: '15000.00',
        collected_amount: '35000.00',
        total_commission: '5000.00',
        total_vendor_payout: '45000.00',
      }];
      const mockVendors = [{
        vendor_id: 1,
        company_name: 'TechStore',
        commission_rate: '10.00',
        total_orders: '5',
        total_sales: '50000.00',
        total_commission: '5000.00',
        net_payout: '45000.00',
      }];

      (mockedPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockSummary })
        .mockResolvedValueOnce({ rows: mockVendors });

      const res = await request(app)
        .get('/api/admin/commissions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalSales).toBe(50000);
      expect(res.body.pendingCodAmount).toBe(15000);
      expect(res.body.collectedAmount).toBe(35000);
      expect(res.body.totalCommission).toBe(5000);
      expect(res.body.totalVendorPayout).toBe(45000);
      expect(res.body.vendors.length).toBe(1);
      expect(res.body.vendors[0].commission_rate).toBe(10);
    });

    it('should update vendor commission rate via PUT /api/admin/vendors/:id/commission', async () => {
      const updatedVendor = { id: 1, company_name: 'TechStore', commission_rate: 12.5 };

      (mockedPool.query as jest.Mock).mockResolvedValueOnce({ rows: [updatedVendor] });

      const res = await request(app)
        .put('/api/admin/vendors/1/commission')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ commission_rate: 12.5 });

      expect(res.status).toBe(200);
      expect(res.body.commission_rate).toBe(12.5);
    });

    it('should return vendor financial recap via GET /api/vendors/me/commissions', async () => {
      const mockVendor = { id: 1, company_name: 'TechStore', commission_rate: '10.00' };
      const mockSummary = [{
        total_orders: '3',
        gross_sales: '30000.00',
        total_commission: '3000.00',
        net_payout: '27000.00',
      }];
      const mockItems = [
        { id: 101, order_id: 1, product_name: 'Smartphone', unit_price: '10000.00', quantity: 1, commission_rate: '10.00', commission_amount: '1000.00', vendor_payout: '9000.00' },
      ];

      (mockedPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockVendor] })
        .mockResolvedValueOnce({ rows: mockSummary })
        .mockResolvedValueOnce({ rows: mockItems });

      const res = await request(app)
        .get('/api/vendors/me/commissions')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.vendorId).toBe(1);
      expect(res.body.grossSales).toBe(30000);
      expect(res.body.totalCommission).toBe(3000);
      expect(res.body.netPayout).toBe(27000);
      expect(res.body.items.length).toBe(1);
    });
  });
});
