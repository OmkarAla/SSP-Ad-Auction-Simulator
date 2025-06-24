// backend/src/controllers/adRequestController.ts
import { Request, Response } from "express";
import { Database } from "sqlite";

interface AdRequest {
  publisher_id: string;
  ad_slot_id: string;
  geo: string;
  device: string;
  time: string;
}

interface DSP {
  id: string;
  targeting_rules: string;
  base_bid_price: number;
  ad_creative_image_url: string;
  ad_creative_click_url: string;
}

interface Bid {
  dspId: string;
  bidPrice: number;
  creative: {
    image_url: string;
    click_url: string;
  };
}

export async function handleAdRequest(req: Request, res: Response) {
  const adRequest: AdRequest = req.body;
  const db: Database = req.app.get("db");

  // Validate input
  if (
    !adRequest.publisher_id ||
    !adRequest.geo ||
    !adRequest.device ||
    !adRequest.time
  ) {
    return res.status(400).json({ error: "Invalid input provided" });
  }

  try {
    // Store ad request
    const result = await db.run(
      `INSERT INTO ad_requests (
        publisher_id, ad_slot_id, geo, device, request_time, status
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        adRequest.publisher_id,
        adRequest.ad_slot_id || "unknown",
        adRequest.geo,
        adRequest.device,
        adRequest.time,
        "pending",
      ]
    );

    // Get all DSPs
    const dsps: DSP[] = await db.all("SELECT * FROM dsps");
    const bids: Bid[] = [];

    // Collect bids from DSPs
    for (const dsp of dsps) {
      try {
        const targeting = JSON.parse(dsp.targeting_rules);
        let bidPrice = 0;

        if (
          targeting.geo === adRequest.geo &&
          targeting.device === adRequest.device
        ) {
          bidPrice = dsp.base_bid_price;
        } else if (targeting.geo === adRequest.geo) {
          bidPrice = 1.0;
        }

        if (bidPrice > 0) {
          bids.push({
            dspId: dsp.id,
            bidPrice,
            creative: {
              image_url: dsp.ad_creative_image_url,
              click_url: dsp.ad_creative_click_url,
            },
          });
        }
      } catch (parseError) {
        console.error(`Error parsing targeting rules for DSP ${dsp.id}:`, parseError);
        continue;
      }
    }

    // Select winner
    if (bids.length === 0) {
      await db.run(
        "UPDATE ad_requests SET status = ? WHERE id = ?",
        ["no_winner", result.lastID]
      );
      return res
        .status(204)
        .json({ message: "No eligible bids found" });
    }

    const winningBid = bids.reduce(
      (max, bid) => (bid.bidPrice > max.bidPrice ? bid : max),
      bids[0]
    );

    // Update ad request with winner
    await db.run(
      "UPDATE ad_requests SET winner_dsp_id = ?, winning_bid_price = ?, status = ? WHERE id = ?",
      [winningBid.dspId, winningBid.bidPrice, "completed", result.lastID]
    );

    return res.status(200).json({
      winner_dsp: winningBid.dspId,
      bid_price: winningBid.bidPrice,
      creative: winningBid.creative,
    });
  } catch (error) {
    console.error("Error handling ad request:", error);
    return res
      .status(500)
      .json({ error: "Internal server error" });
  }
}