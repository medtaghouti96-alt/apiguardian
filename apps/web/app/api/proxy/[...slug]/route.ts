// File: apps/web/app/api/proxy/[...slug]/route.ts

// This tells Vercel to use the Edge Runtime, which is faster and better for proxies.
//export const runtime = 'edge';
import { authenticateRequest } from '../../_lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// Import all our new and existing _lib modules

import { getProviderAdapter } from '../../_lib/provider-factory';
import { forwardRequestToProvider } from '../../_lib/forwarder';

export async function POST(req: NextRequest) {
  try {
    // --- Step 1: Authentication & Decryption ---
    // This part remains the same.
    const authResult = await authenticateRequest(req);

    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.errorMessage }, { status: authResult.status });
    }
    if (!authResult.project || !authResult.decryptedKey) {
        return NextResponse.json({ error: "Authentication successful but data is missing." }, { status: 500 });
    }
    
    const { project, decryptedKey } = authResult;

    // --- Step 2: Provider Selection ---
    // We get the correct "adapter" for the provider (e.g., OpenAI).
    const adapter = getProviderAdapter(req);
    if (!adapter) {
      return NextResponse.json({ error: "Invalid AI provider specified in URL." }, { status: 400 });
    }

    // --- Step 3: Forward Request ---
    // We call our forwarder module to send the request to the real AI provider.
    const upstreamResponse = await forwardRequestToProvider({
      request: req,
      decryptedKey: decryptedKey,
      adapter: adapter
    });
    
    // --- Step 4 (Future): Asynchronous Analytics will go here ---
    // e.g., processAnalyticsInBackground({ ... });

    // --- Step 5: Stream Response Back to User ---
    // We return the upstream response directly. This is the most efficient
    // way to handle streaming and ensures all headers are passed correctly.
    return upstreamResponse;

  } catch (error) {
    // Gracefully handle any unexpected errors.
    console.error("CRITICAL ERROR in proxy handler:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405, headers: { 'Allow': 'POST' } });
}