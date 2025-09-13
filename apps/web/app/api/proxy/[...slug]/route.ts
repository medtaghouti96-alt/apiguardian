// File: apps/web/app/api/proxy/[...slug]/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
// Note: Ensure this import path correctly resolves to your shared-logic package
import { authenticateRequest } from '../../_lib/auth'; 

export async function POST(req: NextRequest) {
  console.log("--- PROXY HANDLER STARTED ---");
  console.log(`Incoming request URL: ${req.url}`);
  
  try {
    console.log("Attempting authentication...");

    // This function will now work correctly because of the fix in `auth.ts`
    const authResult = await authenticateRequest(req);

    console.log(`Authentication result: isValid=${authResult.isValid}`);

    if (!authResult.isValid) {
      console.error(`Authentication failed: ${authResult.errorMessage}`);
      return NextResponse.json(
        { error: authResult.errorMessage },
        { status: authResult.status }
      );
    }
    
    if (!authResult.project || !authResult.decryptedKey) {
        console.error("Authentication successful but data is missing.");
        return NextResponse.json(
            { error: "Internal Authentication Error: Data missing after validation." },
            { status: 500 }
        );
    }
    
    const { project, decryptedKey } = authResult;
    
    // For now, we return the success message. The forwarding logic will go here.
    return NextResponse.json({
      message: "Authentication successful!",
      projectId: project.id,
    });

  } catch (error) {
    console.error("CRITICAL ERROR in proxy handler try/catch block:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
    console.log("--- GET request received and blocked ---");
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405, headers: { 'Allow': 'POST' } });
}