// File: apps/web/app/api/webhooks/clerk/route.ts
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto'; // Import the native crypto module

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    // --- FIX FOR PROBLEM 2 ---
    // Guard clause to ensure the webhook secret is present and valid
    if (!WEBHOOK_SECRET || !WEBHOOK_SECRET.startsWith('whsec_')) {
        return new Response('Error: Missing or invalid Clerk webhook secret.', { status: 500 });
    }

    // --- FIX FOR PROBLEM 1 ---
    // Get the headers. It's an async operation, so we must `await` it.
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', { status: 400 });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // --- MANUAL WEBHOOK VERIFICATION (No svix) ---
    const signedContent = `${svix_id}.${svix_timestamp}.${body}`;
    
    // The secret part is the string after "whsec_"
    const secret = WEBHOOK_SECRET.split('_')[1];

    // This check satisfies TypeScript, ensuring `secret` is not undefined.
    if(!secret) {
        return new Response('Error: Invalid webhook secret format.', { status: 500 });
    }
    
    const secretBytes = Buffer.from(secret, 'base64');
    
    const signature = createHmac('sha256', secretBytes)
        .update(signedContent)
        .digest('base64');
        
    const expectedSignature = svix_signature.split(' ')[1];

    if (signature !== expectedSignature) {
        console.error('Webhook verification failed: Signatures do not match.');
        return new Response('Invalid signature', { status: 401 });
    }
    // --- END OF MANUAL VERIFICATION ---

    const evt: WebhookEvent = payload;
    const eventType = evt.type;
    console.log(`Webhook of type ${eventType} received and verified.`);

    if (eventType === 'user.created') {
        const { id, email_addresses } = evt.data;
        const primaryEmail = email_addresses[0]?.email_address;
        
        if (!id || !primaryEmail) {
            return new Response('Error: Missing user ID or email', { status: 400 });
        }

        const { error } = await supabase
            .from('users')
            .insert({ id: id, email: primaryEmail });
        
        if (error) {
            console.error('Error inserting user into Supabase:', error);
            return new Response('Error occured while creating user', { status: 500 });
        }
        
        console.log(`Successfully created user ${id} in Supabase.`);
    }
    
    return new Response('', { status: 200 });
}