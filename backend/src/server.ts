// backend/src/server.ts
import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import { initDB } from './db';
import routes from './routes';

const app: Application = express();

// Configure CORS to allow frontend requests
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

async function startServer() {
  try {
    const db = await initDB();
    app.set('db', db);

    // Health check endpoint with explicit types
    app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'OK' });
    });

    // Mount all routes under /api
    app.use('/api', routes);

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();