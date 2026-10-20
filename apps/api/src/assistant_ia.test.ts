import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from './index';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_12345';

describe('Mission 17: Integrated AI Assistant API', () => {
  const adminToken = jwt.sign({ id: 1, email: 'admin@webmanager.local', role: 'ADMIN' }, JWT_SECRET);
  const managerToken = jwt.sign({ id: 2, email: 'manager@webmanager.local', role: 'MANAGER' }, JWT_SECRET);
  const customerToken = jwt.sign({ id: 3, email: 'customer@webmanager.local', role: 'CUSTOMER' }, JWT_SECRET);

  describe('POST /api/admin/ai/assistant & /api/ai/assistant', () => {
    it('should return 401 if unauthenticated', async () => {
      const res = await request(app).post('/api/admin/ai/assistant').send({ prompt: 'Casque Audio Pro' });
      expect(res.status).toBe(401);
    });

    it('should return 403 for CUSTOMER role', async () => {
      const res = await request(app)
        .post('/api/admin/ai/assistant')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ prompt: 'Casque Audio Pro' });
      expect(res.status).toBe(403);
    });

    it('should return 400 when prompt is missing', async () => {
      const res = await request(app)
        .post('/api/admin/ai/assistant')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'product_description' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Le prompt est obligatoire.');
    });

    it('should generate product description response for MANAGER', async () => {
      const res = await request(app)
        .post('/api/admin/ai/assistant')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ prompt: 'Montre Connectée Sport', type: 'product_description' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('prompt', 'Montre Connectée Sport');
      expect(res.body).toHaveProperty('type', 'product_description');
      expect(res.body.response).toContain('Description optimisée SEO pour "Montre Connectée Sport"');
    });

    it('should generate CMS article response for ADMIN', async () => {
      const res = await request(app)
        .post('/api/admin/ai/assistant')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ prompt: 'Tendances E-commerce 2025', type: 'cms_article' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('type', 'cms_article');
      expect(res.body.response).toContain('# Guide complet : Tendances E-commerce 2025');
    });

    it('should generate data analysis response on alias route /api/ai/assistant', async () => {
      const res = await request(app)
        .post('/api/ai/assistant')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ prompt: 'Rapport ventes T1', type: 'data_analysis' });

      expect(res.status).toBe(200);
      expect(res.body.response).toContain('Analyse par l\'assistant IA pour "Rapport ventes T1"');
    });
  });
});
