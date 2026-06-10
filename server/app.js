import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import commentRoutes from './routes/comments.js';
import aiRoutes from './routes/ai.js';
import { initSocket } from './socket/chat.js';
import { setIO } from './socket/io.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDist = join(__dirname, '..', 'client', 'dist');
const isProd = existsSync(clientDist);

const app = express();
const httpServer = createServer(app);

// In production the frontend is served from the same origin, so no CORS needed.
// In development the Vite dev server runs separately and needs CORS.
const io = new Server(httpServer, {
  cors: isProd ? false : {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

if (!isProd) {
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
}

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ai', aiRoutes);

setIO(io);
initSocket(io);

// Serve the built React app in production
if (isProd) {
  app.use(express.static(clientDist));
  // SPA fallback — all non-API routes return index.html
  app.get('*', (req, res) => {
    res.sendFile(join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
});

