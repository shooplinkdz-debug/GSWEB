import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import pageRoutes from './routes/pages';
import orderRoutes from './routes/orders';
import cartRoutes from './routes/cart';
import adminRoutes from './routes/admin';
import vendorRoutes from './routes/vendors';
import { runMigrations, seedDatabase } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Auto-migration and database seeding on server startup
if (process.env.NODE_ENV !== 'test') {
  runMigrations()
    .then(() => seedDatabase())
    .catch((err) => console.error('Database initialization failed:', err));
}

// Main Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'WebManager API', timestamp: new Date() });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', adminRoutes);
app.use('/api/vendors', vendorRoutes);

// Centralized 404 fallback route handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ressource introuvable' });
});

// Centralized error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur',
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server API listening on port ${PORT}`);
  });
}

export default app;
