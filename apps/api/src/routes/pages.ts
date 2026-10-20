import { Router } from 'express';
import pool from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/pages
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pages ORDER BY title ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des pages.' });
  }
});

// GET /api/pages/:slug
router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pages WHERE slug = $1', [req.params.slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page introuvable.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/pages (Admin/Manager)
router.post('/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  const { title, slug, content, is_published } = req.body;
  if (!title || !slug || !content) {
    return res.status(400).json({ error: 'Titre, slug et contenu sont obligatoires.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO pages (title, slug, content, is_published) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, slug, content, is_published !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création de la page.' });
  }
});

// PUT /api/pages/:id (Admin/Manager)
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  const { title, slug, content, is_published } = req.body;
  try {
    const result = await pool.query(
      `UPDATE pages SET title = $1, slug = $2, content = $3, is_published = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [title, slug, content, is_published !== false, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page introuvable.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la page.' });
  }
});

// DELETE /api/pages/:id (Admin)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM pages WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page introuvable.' });
    }
    res.json({ message: 'Page supprimée avec succès.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la page.' });
  }
});

export default router;
