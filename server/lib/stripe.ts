
import Stripe from 'stripe';
import { log } from "../app";

if (!process.env.STRIPE_SECRET_KEY) {
    log("STRIPE_SECRET_KEY is missing. Stripe payments will fail.", "warning");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2025-01-27.acacia', // Use latest API version or safe default
});

export async function createCheckoutSession(
    bookingId: string,
    amount: number, // Amount in MWK (or base currency)
    currency: string = 'mwk',
    successUrl: string,
    cancelUrl: string,
    customerEmail?: string,
    description?: string
) {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: currency.toLowerCase(),
                        product_data: {
                            name: 'Visit Dzaleka Tour Booking',
                            description: description || `Booking Reference: ${bookingId}`,
                        },
                        unit_amount: Math.round(amount * 100), // Stripe expects amounts in cents/smallest unit
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: customerEmail,
            client_reference_id: bookingId,
            metadata: {
                bookingId: bookingId,
            },
        });

        return { url: session.url, sessionId: session.id };
    } catch (error: any) {
        console.error("Stripe Checkout Error:", error);
        throw new Error(`Stripe Checkout creation failed: ${error.message}`);
    }
}

export function constructEvent(payload: string | Buffer, signature: string, endpointSecret: string) {
    try {
        return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        throw new Error(`Webhook Error: ${err.message}`);
    }
}

export default stripe;
