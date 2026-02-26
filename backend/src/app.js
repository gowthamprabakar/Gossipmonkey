import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import identityRoutes from './routes/identityRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import channelRoutes from './routes/channelRoutes.js';
import privacyRoutes from './routes/privacyRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { createWebhookRoutes } from './routes/webhookRoutes.js';
import { backfillWebhookSecrets } from './controllers/webhookController.js';
import { recoverCronsOnStartup, getCronStats } from './services/monkeyScheduler.js';
import path from 'path';
import { configureSocket } from './socket/socketHandler.js';

export const createServerApp = () => {
  const app = express();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH']
    }
  });

  app.use(cors());
  app.use(express.json());

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Startup tasks — order matters: socket must be ready before cron recovery
  configureSocket(io);
  recoverCronsOnStartup(io);       // re-register crons for rooms with active members
  backfillWebhookSecrets();         // ensure all rooms have a webhook secret

  app.use('/api/identity', identityRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/channels', channelRoutes);
  app.use('/api/privacy', privacyRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api', createWebhookRoutes(io)); // POST /api/rooms/:id/webhook

  // Debug: cron registry status
  app.get('/api/monkey/crons/stats', (_req, res) => res.json(getCronStats()));

  app.get('/', (req, res) => {
    res.send('Chat Monkey API is running (Socket.io enabled)');
  });

  return { app, httpServer, io };
};
