// app/api/scanner/route.ts

import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import axios from 'axios';

export const runtime = 'nodejs'; // Ensure Node.js runtime

// Custom HTTPS agent to ignore SSL for local dev (⚠️ don't use in prod)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text(); // Read plain text payload

    const response = await axios.post(
      'https://localhost:8443/SGIFPCapture',
      bodyText, // Already url-encoded from client
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        httpsAgent,
        responseType: 'text', // Important: because SecuGen returns XML
      }
    );

    return new NextResponse(response.data, {
      status: response.status,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error: any) {
    console.error('Proxy error:', error?.message || error);

    return new NextResponse(
      JSON.stringify({ error: 'Proxy failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
