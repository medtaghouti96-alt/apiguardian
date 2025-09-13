// File: apps/web/app/api/proxy/[...slug]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../_lib/auth';

export async function POST(req: NextRequest) {
  // --- TRACER LOG 1 ---
  console.log("--- PROXY HANDLER STARTED ---");
  console.log(`Incoming request URL: ${req.url}`);
  
  try {
    // --- TRACER LOG 2 ---
    console.log("Attempting authentication...");

    const authResult = await authenticateRequest(req);

    // --- TRACER LOG 3 ---
    console.log(`Authentication result: isValid=${authResult.isValid}`);

    if (!authResult.isValid) {
      console.error(`Authentication failed: ${authResult.errorMessage}`);
      return NextResponse.json(
        { error: authResult.errorMessage },
        { status: authResult.status }
      );
    }
    
    // --- THE CRITICAL FIX FOR THE TYPESCRIPT ERROR ---
    // This "guard clause" ensures that project and decryptedKey are not undefined.
    if (!authResult.project || !authResult.decryptedKey) {
        console.error("Authentication successful but data is missing.");
        return NextResponse.json(
            { error: "Internal Authentication Error: Data missing after validation." },
            { status: 500 }
        );
    }
    
    // After the guard clause, TypeScript knows these are safe to use.
    const { project, decryptedKey } = authResult;
    
    // For now, we return the success message. The forwarding logic will go here.
    return NextResponse.json({
      message: "Authentication successful!",
      projectId: project.id, // This line will no longer have an error.
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