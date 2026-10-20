import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import pageRoutes from './routes/pages';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import { runMigrations, seedDatabase } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

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
app.use('/api/admin', adminRoutes);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server API listening on port ${PORT}`);
  });
}

export default app;
