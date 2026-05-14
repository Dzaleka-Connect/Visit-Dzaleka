
import Stripe from 'stripe';
import { log } from "../app";

const STRIPE_API_VERSION = '2026-01-28.clover';
const DEFAULT_CHECKOUT_CURRENCY = "mwk";

const ZERO_DECIMAL_CURRENCIES = new Set([
    "bif",
    "clp",
    "djf",
    "gnf",
    "jpy",
    "kmf",
    "krw",
    "mga",
    "pyg",
    "rwf",
    "vnd",
    "vuv",
    "xaf",
    "xof",
    "xpf",
]);

let stripeClient: Stripe | null = null;
let stripeClientKey: string | null = null;

function getSecretKey() {
    return process.env.STRIPE_SECRET_KEY?.trim() || "";
}

export function getConfiguredCheckoutCurrency() {
    return (process.env.STRIPE_CHECKOUT_CURRENCY || process.env.STRIPE_CURRENCY || DEFAULT_CHECKOUT_CURRENCY)
        .trim()
        .toLowerCase();
}

export function isZeroDecimalCurrency(currency: string) {
    return ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase());
}

export function amountToMinorUnits(amount: number, currency: string) {
    if (!Number.isFinite(amount) || amount < 0) {
        throw new Error("Invalid payment amount");
    }

    const multiplier = isZeroDecimalCurrency(currency) ? 1 : 100;
    return Math.round(amount * multiplier);
}

export function amountFromMinorUnits(amount: number, currency: string) {
    const multiplier = isZeroDecimalCurrency(currency) ? 1 : 100;
    return amount / multiplier;
}

function getUsdConversionRate() {
    const mwkPerUsd = Number(process.env.STRIPE_MWK_PER_USD || "");
    if (Number.isFinite(mwkPerUsd) && mwkPerUsd > 0) {
        return {
            source: "STRIPE_MWK_PER_USD",
            mwkPerUsd,
            usdPerMwk: 1 / mwkPerUsd,
        };
    }

    const usdPerMwk = Number(process.env.STRIPE_MWK_TO_USD_RATE || process.env.MWK_TO_USD_RATE || "");
    if (Number.isFinite(usdPerMwk) && usdPerMwk > 0) {
        return {
            source: process.env.STRIPE_MWK_TO_USD_RATE ? "STRIPE_MWK_TO_USD_RATE" : "MWK_TO_USD_RATE",
            mwkPerUsd: 1 / usdPerMwk,
            usdPerMwk,
        };
    }

    return null;
}

export function buildCheckoutAmount(amountMwk: number, currency = getConfiguredCheckoutCurrency()) {
    const checkoutCurrency = currency.toLowerCase();

    if (!Number.isFinite(amountMwk) || amountMwk <= 0) {
        throw new Error("Invalid booking amount");
    }

    if (checkoutCurrency === "mwk") {
        const amountMinor = amountToMinorUnits(amountMwk, checkoutCurrency);
        return {
            bookingAmountMwk: Math.round(amountMwk),
            currency: checkoutCurrency,
            amount: amountMwk,
            amountMinor,
            conversionRate: null as number | null,
            conversionSource: null as string | null,
        };
    }

    if (checkoutCurrency === "usd") {
        const conversion = getUsdConversionRate();
        if (!conversion) {
            throw new Error("STRIPE_MWK_PER_USD is required when STRIPE_CHECKOUT_CURRENCY is usd");
        }

        const amount = amountMwk * conversion.usdPerMwk;
        const amountMinor = amountToMinorUnits(amount, checkoutCurrency);
        if (amountMinor < 50) {
            throw new Error("Converted USD amount is below Stripe's minimum card charge");
        }

        return {
            bookingAmountMwk: Math.round(amountMwk),
            currency: checkoutCurrency,
            amount,
            amountMinor,
            conversionRate: conversion.mwkPerUsd,
            conversionSource: conversion.source,
        };
    }

    throw new Error(`Unsupported Stripe checkout currency: ${checkoutCurrency.toUpperCase()}`);
}

export function getStripePaymentConfig() {
    const secretKey = getSecretKey();
    const currency = getConfiguredCheckoutCurrency();
    const usdConversion = currency === "usd" ? getUsdConversionRate() : null;

    return {
        provider: "stripe",
        currency: currency.toUpperCase(),
        isLiveMode: secretKey.startsWith("sk_live_"),
        secretKeyConfigured: Boolean(secretKey),
        webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
        usdConversionConfigured: currency !== "usd" || Boolean(usdConversion),
        usdConversionRate: usdConversion?.mwkPerUsd || null,
    };
}

export function getStripeClient() {
    const secretKey = getSecretKey();
    if (!secretKey) {
        log("STRIPE_SECRET_KEY is missing. Stripe payments are not configured.", "warning");
        throw new Error("Stripe secret key is not configured");
    }

    if (!stripeClient || stripeClientKey !== secretKey) {
        stripeClient = new Stripe(secretKey, {
            apiVersion: STRIPE_API_VERSION,
        });
        stripeClientKey = secretKey;
    }

    return stripeClient;
}

export async function createCheckoutSession(
    bookingId: string,
    amountMwk: number,
    successUrl: string,
    cancelUrl: string,
    customerEmail?: string,
    description?: string
) {
    try {
        const stripe = getStripeClient();
        const checkoutAmount = buildCheckoutAmount(amountMwk);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: checkoutAmount.currency,
                        product_data: {
                            name: 'Visit Dzaleka Tour Booking',
                            description: description || `Booking Reference: ${bookingId}`,
                        },
                        unit_amount: checkoutAmount.amountMinor,
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
                bookingId,
                bookingAmountMwk: String(checkoutAmount.bookingAmountMwk),
                checkoutCurrency: checkoutAmount.currency,
                checkoutAmountMinor: String(checkoutAmount.amountMinor),
                checkoutAmount: checkoutAmount.amount.toFixed(2),
                conversionRate: checkoutAmount.conversionRate ? String(checkoutAmount.conversionRate) : "",
                conversionSource: checkoutAmount.conversionSource || "",
            },
        });

        return { url: session.url, sessionId: session.id, checkoutAmount };
    } catch (error: any) {
        console.error("Stripe Checkout Error:", error);
        throw new Error(`Stripe Checkout creation failed: ${error.message}`);
    }
}

export function constructEvent(payload: string | Buffer, signature: string, endpointSecret: string) {
    try {
        return getStripeClient().webhooks.constructEvent(payload, signature, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        throw new Error(`Webhook Error: ${err.message}`);
    }
}

export default getStripeClient;
