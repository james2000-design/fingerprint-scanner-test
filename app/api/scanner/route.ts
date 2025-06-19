// app/api/scanner/route.ts

import { NextRequest, NextResponse } from "next/server";
import https from "https";
import axios from "axios";

export const runtime = "nodejs"; // Ensure Node.js runtime

// Custom HTTPS agent to ignore SSL for local dev (⚠️ don't use in prod)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();

    const response = await axios.post(
      "https://localhost:8443/SGIFPCapture",
      bodyText,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        httpsAgent,
        responseType: "text", // Important: because SecuGen returns XML
      }
    );

    return new NextResponse(response.data, {
      status: response.status,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "message" in error) {
      console.error("Proxy error:", (error as { message: string }).message);
    } else {
      console.error("Proxy error:", error);
    }

    return new NextResponse(JSON.stringify({ error: "Proxy failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
