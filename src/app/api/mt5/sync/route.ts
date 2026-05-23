import { NextResponse } from "next/server";
import { adminDb, adminAuth, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { Trade } from "@/lib/types";

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

export async function POST(request: Request) {
  try {
    // 1. Verify API Key from Headers
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "Missing x-api-key header" }, { status: 401 });
    }

    // Since we don't have user mapping in this mock, we assume the API key is valid.
    // In production, we would query Firestore to find the user with this API key.
    const uid = "demo-user"; // Replace with actual user ID lookup
    
    // 2. Parse Payload from MT5 EA
    const payload = await request.json();
    
    // Example Payload from EA:
    // { ticket: "123456", symbol: "EURUSD", type: 0, volume: 1.5, price_open: 1.0500, price_close: 1.0550, sl: 1.0400, tp: 1.0600, time_open: 1714500000, time_close: 1714510000, profit: 750, commission: -5, swap: -2 }

    if (!payload.ticket || !payload.symbol) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }

    // 3. Map to EDGEVAULT Trade Schema
    const direction = payload.type === 0 ? "long" : "short";
    const netPnl = (payload.profit || 0) + (payload.commission || 0) + (payload.swap || 0);
    const result = netPnl > 0 ? "win" : netPnl < 0 ? "loss" : "breakeven";
    
    const trade: Trade = {
      id: generateId(),
      symbol: payload.symbol,
      direction,
      entryDate: new Date((payload.time_open || 0) * 1000).toISOString(),
      exitDate: new Date((payload.time_close || 0) * 1000).toISOString(),
      entryPrice: payload.price_open || 0,
      exitPrice: payload.price_close || 0,
      positionSize: payload.volume || 1,
      netPnl,
      result,
      stopLoss: payload.sl || null,
      takeProfit: payload.tp || null,
      rMultiple: 0,
      rr: 0,
      commission: Math.abs((payload.commission || 0) + (payload.swap || 0)),
      preTradeNotes: "Synced via MT5 EA Bridge",
      postTradeReview: "",
      mistakeTags: [],
      setupTags: [],
      emotion: 0,
      marketCondition: "Trending",
      sessionTag: "London",
      durationMinutes: Math.round(((payload.time_close || 0) - (payload.time_open || 0)) / 60),
      accountEquityAfter: 50000,
      screenshotUrls: [],
      mindsetTags: [],
      mindsetNotes: "",
    };

    // 4. Insert to Firestore
    if (isFirebaseAdminConfigured && adminDb) {
      const docRef = adminDb.collection(`users/${uid}/trades`).doc(trade.id);
      await docRef.set(trade);
      return NextResponse.json({ success: true, message: "Trade synced to Firestore", tradeId: trade.id });
    }

    // Fallback if admin is not configured properly (though it should be now)
    return NextResponse.json({ success: true, message: "Demo mode: Trade received but not saved (Admin not configured)", tradeId: trade.id });

  } catch (error: any) {
    console.error("MT5 Sync Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
