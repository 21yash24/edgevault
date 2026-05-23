import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Example Real Implementation:
    /*
    const response = await fetch('https://demo-api.tradovate.com/v1/fill/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    return NextResponse.json(data);
    */

    console.log(`[Tradovate API] Fetching trades with token: ${token.substring(0, 10)}...`);

    // We will return a realistic, mocked payload of Tradovate Fills.
    // In Tradovate, you often need multiple sequential fills to represent a trade.
    
    const now = new Date();
    const earlier = new Date(now.getTime() - 15 * 60000); // 15 mins ago
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayExit = new Date(yesterday.getTime() + 45 * 60000);

    const mockPayload = {
      fills: [
        {
          id: 1001,
          orderId: 2001,
          contractId: 101,
          contractName: "ESM4",
          action: "Buy",
          qty: 2,
          price: 5200.25,
          timestamp: yesterday.toISOString()
        },
        {
          id: 1002,
          orderId: 2002,
          contractId: 101,
          contractName: "ESM4",
          action: "Sell",
          qty: 2,
          price: 5210.50,
          timestamp: yesterdayExit.toISOString()
        },
        {
          id: 1003,
          orderId: 2003,
          contractId: 102,
          contractName: "NQM4",
          action: "Sell",
          qty: 1,
          price: 18500.00,
          timestamp: earlier.toISOString()
        },
        {
          id: 1004,
          orderId: 2004,
          contractId: 102,
          contractName: "NQM4",
          action: "Buy",
          qty: 1,
          price: 18450.00,
          timestamp: now.toISOString()
        }
      ]
    };

    return NextResponse.json(mockPayload, { status: 200 });

  } catch (error) {
    console.error('[Tradovate Sync Route] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
