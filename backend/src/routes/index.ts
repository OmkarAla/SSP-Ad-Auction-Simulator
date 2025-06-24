// backend/src/routes/index.ts
import { Router, Request, Response, NextFunction } from 'express';
import { handleAdRequest } from '../controllers/adRequestController';
import { getAdRequests, getDSPs, getAnalytics } from '../controllers/adminController';

const router = Router();

// Public endpoint for receiving ad requests
router.post('/ad-request', async (req, res, next) => {
  try {
    await handleAdRequest(req, res);
  } catch (error) {
    console.error('Error in /ad-request:', error);
    next(error);
  }
});

// Admin endpoints for dashboard analytics
router.get('/admin/ad-requests', async (req, res, next) => {
  try {
    await getAdRequests(req, res);
  } catch (error) {
    console.error('Error in /admin/ad-requests:', error);
    next(error);
  }
});

router.get('/admin/dsps', async (req, res, next) => {
  try {
    await getDSPs(req, res);
  } catch (error) {
    console.error('Error in /admin/dsps:', error);
    next(error);
  }
});

router.get('/admin/analytics', async (req, res, next) => {
  try {
    await getAnalytics(req, res);
  } catch (error) {
    console.error('Error in /admin/analytics:', error);
    next(error);
  }
});

// Error handling middleware
router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: 'Internal server error' });
});

export default router;