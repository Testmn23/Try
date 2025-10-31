/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import DodoPayments from 'dodopayments';

export const config = {
  runtime: 'edge',
};

// Map credit amounts to product IDs created in the Dodo Payments dashboard
const creditProductMap: Record<number, string> = {
    10: process.env.DODO_PRODUCT_ID_10_CREDITS || 'prod_starter_10',
    50: process.env.DODO_PRODUCT_ID_50_CREDITS || 'pdt_Gm7aZCezFkbsV7Y05fptD',
    100: process.env.DODO_PRODUCT_ID_100_CREDITS || 'prod_pro_100',
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { creditAmount, user } = await req.json();

        if (!user || !user.id || !user.email) {
            return new Response(JSON.stringify({ error: 'User information is required.' }), { status: 400 });
        }
        
        const productId = creditProductMap[creditAmount];
        if (!productId) {
            return new Response(JSON.stringify({ error: 'Invalid credit amount specified.' }), { status: 400 });
        }

        if (!process.env.DODO_PAYMENTS_API_KEY) {
            throw new Error("DODO_PAYMENTS_API_KEY environment variable not set.");
        }

        const client = new DodoPayments({
            bearerToken: process.env.DODO_PAYMENTS_API_KEY,
        });

        // Use the site's URL for the return path.
        const returnUrl = req.headers.get('origin') || 'http://localhost:3000';

        const session = await client.checkoutSessions.create({
            product_cart: [{ product_id: productId, quantity: 1 }],
            customer: { email: user.email, name: user.email },
            return_url: returnUrl,
            metadata: {
                userId: user.id,
                creditAmount: String(creditAmount), // Metadata values must be strings
            },
        });

        if (!session.checkout_url) {
            throw new Error("Failed to create a valid checkout session.");
        }

        return new Response(JSON.stringify({ checkoutUrl: session.checkout_url }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Checkout Session Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return new Response(JSON.stringify({ error: `Server error: ${errorMessage}` }), { status: 500 });
    }
}