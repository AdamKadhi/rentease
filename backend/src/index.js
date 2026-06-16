import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import houseRoutes from './routes/houses.js';
import bookingRoutes from './routes/bookings.js';
import statsRoutes from './routes/stats.js';
import uploadRoutes from './routes/upload.js';
import publicRoutes from './routes/public.js';
import { setIo } from './socket.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, credentials: true },
});
setIo(io);

io.on('connection', socket => {
  const { userId } = socket.handshake.auth;
  socket.join('public'); // all clients join public room for house updates
  if (userId) {
    socket.join(`owner:${userId}`);
  }
});

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
const uploadsDir = process.env.UPLOADS_DIR || join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/houses', houseRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/public', publicRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

httpServer.listen(PORT, () => {
  console.log(`RentEase backend running on http://localhost:${PORT}`);
});
