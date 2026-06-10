import jwt from 'jsonwebtoken';
import pool from '../db/index.js';

export function initSocket(io) {
  // Auth is optional — anonymous sockets can receive broadcasts but cannot chat
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        socket.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      } catch {
        return next(new Error('Invalid token'));
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    socket.on('join_event', async (eventId) => {
      socket.join(`event_${eventId}`);
      try {
        const [messages] = await pool.execute(
          `SELECT m.id, m.event_id, m.user_id, m.message, m.created_at, u.username
           FROM chat_messages m
           JOIN users u ON m.user_id = u.id
           WHERE m.event_id = ?
           ORDER BY m.created_at ASC
           LIMIT 100`,
          [eventId]
        );
        socket.emit('chat_history', messages);
      } catch (err) {
        console.error('chat history error:', err.message);
      }
    });

    socket.on('leave_event', (eventId) => {
      socket.leave(`event_${eventId}`);
    });

    socket.on('send_message', async ({ eventId, message }) => {
      if (!socket.user || !message?.trim()) return;
      try {
        const [result] = await pool.execute(
          'INSERT INTO chat_messages (event_id, user_id, message) VALUES (?, ?, ?)',
          [eventId, socket.user.id, message.trim()]
        );
        const chatMsg = {
          id: result.insertId,
          event_id: eventId,
          user_id: socket.user.id,
          username: socket.user.username,
          message: message.trim(),
          created_at: new Date().toISOString(),
        };
        io.to(`event_${eventId}`).emit('new_message', chatMsg);
      } catch (err) {
        console.error('send_message error:', err.message);
      }
    });
  });
}
