import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, appId, appVersion, cid, sec, env } = body;

    // In a real scenario, you would securely send these credentials to:
    // https://demo-api.tradovate.com/v1/auth/accesstokenrequest
    // OR https://live-api.tradovate.com/v1/auth/accesstokenrequest
    
    // Example Real Implementation:
    /*
    const url = env === 'Live' ? 'https://live-api.tradovate.com/v1/auth/accesstokenrequest' : 'https://demo-api.tradovate.com/v1/auth/accesstokenrequest';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: username,
        password: password,
        appId: appId,
        appVersion: appVersion,
        cid: cid,
        sec: sec
      })
    });
    const data = await response.json();
    */

    console.log(`[Tradovate API] Received auth request for user: ${username} on ${env} environment.`);

    // Mock Validation:
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Return a mocked successful access token payload
    const mockAccessToken = "eyMockTradovateToken.12345.Signature";

    return NextResponse.json({ 
      accessToken: mockAccessToken,
      expirationTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      userId: 12345,
      name: username,
      userStatus: "Active"
    }, { status: 200 });

  } catch (error) {
    console.error('[Tradovate Auth Route] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
