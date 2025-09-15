// File: apps/web/app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix' // <-- We are using the official library
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to your environment')
    }

    const headerPayload = headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', { status: 400 });
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    // --- Use the Svix library to perform verification ---
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent;

    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('Error verifying webhook:', err);
        // This is where the "Invalid signature" error is coming from.
        // Using the library will fix this.
        return new Response('Error occured', { status: 400 });
    }
    // --- End of library-based verification ---

    const eventType = evt.type;
    console.log(`Webhook of type ${eventType} received`);

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