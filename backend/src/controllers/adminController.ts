// backend/src/controllers/adminController.ts
import { Request, Response } from 'express';
import { Database } from 'sqlite';

interface AdRequest {
  id: number;
  publisher_id: string;
  ad_slot_id: string;
  geo: string;
  device: string;
  request_time: string;
  winner_dsp_id: string | null;
  winning_bid_price: number | null;
  status: string;
}

interface DSP {
  id: string;
  name: string;
  targeting_rules: string;
  base_bid_price: number;
  ad_creative_image_url: string;
  ad_creative_click_url: string;
}

export async function getAdRequests(req: Request, res: Response) {
  const db: Database = req.app.get('db');
  try {
    console.log('Fetching ad requests'); // Debug log
    const requests: AdRequest[] = await db.all('SELECT * FROM ad_requests');
    return res.json(requests);
  } catch (error) {
    console.error('Error fetching ad requests:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getDSPs(req: Request, res: Response) {
  const db: Database = req.app.get('db');
  try {
    console.log('Fetching DSPs'); // Debug log
    const dsps: DSP[] = await db.all('SELECT * FROM dsps');
    return res.json(dsps);
  } catch (error) {
    console.error('Error fetching DSPs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAnalytics(req: Request, res: Response) {
  const db: Database = req.app.get('db');
  try {
    console.log('Fetching analytics'); // Debug log
    const totalRequestsResult = await db.get('SELECT COUNT(*) as count FROM ad_requests');
    const total_requests = totalRequestsResult?.count || 0;

    const dsp_performance = await db.all(`
      SELECT 
        d.id as dsp_id,
        d.name,
        COUNT(a.id) as win_count,
        CASE 
          WHEN (SELECT COUNT(*) FROM ad_requests WHERE status = 'completed') = 0 
          THEN 0 
          ELSE ROUND(COUNT(a.id) * 1.0 / (SELECT COUNT(*) FROM ad_requests WHERE status = 'completed'), 4)
        END as win_rate,
        ROUND(AVG(a.winning_bid_price), 2) as average_cpm
      FROM dsps d
      LEFT JOIN ad_requests a ON d.id = a.winner_dsp_id AND a.status = 'completed'
      GROUP BY d.id
    `);

    const cpm_trend = await db.all(`
      SELECT 
        strftime('%Y-%m-%dT%H:00:00Z', request_time) as time_period,
        ROUND(AVG(winning_bid_price), 2) as average_cpm
      FROM ad_requests
      WHERE status = 'completed' AND request_time >= datetime('now', '-24 hours')
      GROUP BY strftime('%Y-%m-%dT%H', request_time)
      ORDER BY time_period
    `);

    return res.json({
      total_requests,
      dsp_performance: dsp_performance || [],
      cpm_trend: cpm_trend || []
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}