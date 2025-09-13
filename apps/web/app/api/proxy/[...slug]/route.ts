import { NextRequest, NextResponse } from 'next/server';
// Use the new, corrected relative path
import { authenticateRequest } from '../../_lib/auth';

export async function POST(req: NextRequest) {
  try {
    // --- Step 1: Authentication ---
    const authResult = await authenticateRequest(req);

    if (!authResult.isValid) {
      return NextResponse.json(
        { error: authResult.errorMessage },
        { status: authResult.status }
      );
    }
    
    // --- FIX: Add a "guard clause" to satisfy TypeScript's strict null checks ---
    if (!authResult.project || !authResult.decryptedKey) {
        return NextResponse.json(
            { error: "Authentication successful but data is missing." },
            { status: 500 }
        );
    }
    
    // Now that we've checked, we can safely de-structure the variables.
    const { project, decryptedKey } = authResult;
    
    // --- Future steps will go here ---
    // 2. Forwarding
    // 3. Streaming the response
    
    // For now, let's return a success message with the project ID to prove it worked.
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
}