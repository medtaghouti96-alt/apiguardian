// File: apps/web/app/api/proxy/[...slug]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../_lib/auth'; // Using the simplified co-located path

export async function POST(req: NextRequest) {
  try {
    // --- Step 1: Authentication ---
    const authResult = await authenticateRequest(req);

    // If authentication fails, immediately return the error
    if (!authResult.isValid) {
      return NextResponse.json(
        { error: authResult.errorMessage },
        { status: authResult.status }
      );
    }
    
    // Add the "guard clause" to satisfy TypeScript's strict null checks
    if (!authResult.project || !authResult.decryptedKey) {
        return NextResponse.json(
            { error: "Authentication successful but data is missing." },
            { status: 500 }
        );
    }
    
    const { project, decryptedKey } = authResult;
    
    // --- THIS IS THE PART WE ARE TESTING ---
    // If we get here, it means authentication and decryption worked.
    // We will replace this with the real forwarding logic in the next step.
    return NextResponse.json({
      message: "Authentication successful!",
      projectId: project.id,
    });

  } catch (error) {
    console.error("Error in APIGuardian Proxy:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405, headers: { 'Allow': 'POST' } });
}git add .
git commit -m "fix(proxy): ensure auth module is correctly called"
git push