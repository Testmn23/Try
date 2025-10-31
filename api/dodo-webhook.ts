/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Webhook } from "standardwebhooks";
import { createClient } from '@supabase/supabase-js';
import type { DodoWebhookPayload } from '../types';

export const config = {
  runtime: 'edge',
};

const relevantEvents = new Set(['checkout.session.completed']);

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    if (!process.env.DODO_WEBHOOK_KEY) {
        console.error("DODO_WEBHOOK_KEY is not set.");
        return new Response('Webhook secret not configured', { status: 500 });
    }
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Supabase environment variables are not set.");
        return new Response('Database configuration error', { status: 500 });
    }

    const webhook = new Webhook(process.env.DODO_WEBHOOK_KEY);
    const rawBody = await req.text();
    const headers = req.headers;

    let payload: DodoWebhookPayload;
    try {
        const webhookHeaders = {
            "webhook-id": headers.get("webhook-id") || "",
            "webhook-signature": headers.get("webhook-signature") || "",
            "webhook-timestamp": headers.get("webhook-timestamp") || "",
        };
        await webhook.verify(rawBody, webhookHeaders);
        payload = JSON.parse(rawBody);
    } catch (err) {
        console.error('Webhook verification failed:', err);
        return new Response('Webhook Error: Signature verification failed.', { status: 400 });
    }
    
    // Process only relevant events
    if (relevantEvents.has(payload.type)) {
        console.log(`Processing event: ${payload.type}`);

        try {
            const { userId, creditAmount } = payload.data.object.metadata;
            const creditsToAdd = parseInt(creditAmount, 10);

            if (!userId || isNaN(creditsToAdd) || creditsToAdd <= 0) {
                console.error('Invalid metadata in webhook payload:', payload.data.object.metadata);
                return new Response('Invalid metadata', { status: 400 });
            }

            // Initialize Supabase admin client
            const supabaseAdmin = createClient(
              process.env.SUPABASE_URL,
              process.env.SUPABASE_SERVICE_ROLE_KEY
            );

            // Call the RPC function to add credits securely
            const { error } = await supabaseAdmin.rpc('add_credits', {
                p_user_id: userId,
                p_amount: creditsToAdd,
            });

            if (error) {
                throw new Error(`Supabase RPC error: ${error.message}`);
            }

            console.log(`Successfully added ${creditsToAdd} credits to user ${userId}.`);
        } catch (error) {
            console.error('Error processing webhook:', error);
            return new Response(`Webhook processing error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
        }
    } else {
        console.log(`Ignoring irrelevant event: ${payload.type}`);
    }

    // Return a 200 OK response to acknowledge receipt of the event
    return new Response('Webhook processed successfully', { status: 200 });
}