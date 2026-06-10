import express from 'express';
import pool from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/:eventId', async (req, res) => {
  try {
    const [comments] = await pool.execute(
      `SELECT c.*, u.username
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.event_id = ?
       ORDER BY c.created_at ASC`,
      [req.params.eventId]
    );
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:eventId', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

  try {
    const [result] = await pool.execute(
      'INSERT INTO comments (event_id, user_id, content) VALUES (?, ?, ?)',
      [req.params.eventId, req.user.id, content.trim()]
    );
    res.json({ id: result.insertId, message: 'Comment added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:commentId', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM comments WHERE id = ?', [req.params.commentId]);
    if (!rows.length) return res.status(404).json({ error: 'Comment not found' });
    if (rows[0].user_id !== req.user.id)
      return res.status(403).json({ error: 'Not authorized' });

    await pool.execute('DELETE FROM comments WHERE id = ?', [req.params.commentId]);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
