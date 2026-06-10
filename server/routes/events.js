import express from 'express';
import pool from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { getIO } from '../socket/io.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [events] = await pool.execute(
      `SELECT e.*, u.username AS creator_name
       FROM events e
       JOIN users u ON e.creator_id = u.id
       ORDER BY e.event_date ASC`
    );
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { title, description, lat, lng, event_date, category } = req.body;
  if (!title || lat == null || lng == null || !event_date)
    return res.status(400).json({ error: 'title, lat, lng, and event_date are required' });

  try {
    const [result] = await pool.execute(
      'INSERT INTO events (title, description, lat, lng, event_date, category, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description || '', lat, lng, event_date, category || 'general', req.user.id]
    );
    // Broadcast the full event to every connected client in real time
    const [rows] = await pool.execute(
      `SELECT e.*, u.username AS creator_name FROM events e JOIN users u ON e.creator_id = u.id WHERE e.id = ?`,
      [result.insertId]
    );
    getIO()?.emit('new_event', rows[0]);
    res.json({ id: result.insertId, message: 'Event created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { title, description, event_date, category } = req.body;
  try {
    const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Event not found' });
    if (rows[0].creator_id !== req.user.id)
      return res.status(403).json({ error: 'Not authorized' });

    await pool.execute(
      'UPDATE events SET title = ?, description = ?, event_date = ?, category = ? WHERE id = ?',
      [title, description, event_date, category, req.params.id]
    );
    res.json({ message: 'Event updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Event not found' });
    if (rows[0].creator_id !== req.user.id)
      return res.status(403).json({ error: 'Not authorized' });

    await pool.execute('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
