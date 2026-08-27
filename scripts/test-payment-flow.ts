
import * as dotenv from "dotenv";
dotenv.config();
import { storage } from "../server/storage";
import crypto from "crypto";

async function runTest() {
    try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test";
        if (!webhookSecret) {
            console.error("Error: STRIPE_WEBHOOK_SECRET is not set in .env");
            process.exit(1);
        }

        console.log("1. Fetching a user to assign booking to...");
        const users = await storage.getUsers();
        if (users.length === 0) {
            console.error("No users found. Create a user first.");
            process.exit(1);
        }
        const user = users[0];
        console.log(`   Using user: ${user.firstName} ${user.lastName} (${user.id})`);

        console.log("2. Creating a test booking...");
        const booking = await storage.createBooking({
            visitorUserId: user.id,
            visitorName: `${user.firstName} ${user.lastName}`,
            visitorEmail: user.email,
            visitorPhone: user.phone || "1234567890",
            visitDate: new Date().toISOString().split('T')[0], // Today
            visitTime: "10:00",
            groupSize: "individual",
            numberOfPeople: 1,
            tourType: "standard",
            totalAmount: 5000,
            paymentMethod: "card",
            status: "pending",
            paymentStatus: "pending",
            bookingReference: `TEST-${Date.now()}`,
        });
        console.log(`   Booking created. ID: ${booking.id}, Ref: ${booking.bookingReference}`);

        console.log("3. Simulating Stripe Webhook (checkout.session.completed)...");

        // Construct payload
        const payload = JSON.stringify({
            id: "evt_test_webhook",
            object: "event",
            type: "checkout.session.completed",
            data: {
                object: {
                    id: "cs_test_session_123",
                    object: "checkout.session",
                    client_reference_id: booking.id,
                    payment_status: "paid",
                    amount_total: 500000,
                    currency: "mwk",
                }
            }
        });

        // Generate Signature
        const timestamp = Math.floor(Date.now() / 1000);
        const signedPayload = `${timestamp}.${payload}`;
        const hmac = crypto.createHmac('sha256', webhookSecret);
        hmac.update(signedPayload);
        const signature = hmac.digest('hex');
        const signatureHeader = `t=${timestamp},v1=${signature}`;

        // Send Request
        console.log(`   Sending POST to http://localhost:3000/api/webhooks/stripe...`);
        const response = await fetch("http://localhost:3000/api/webhooks/stripe", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Stripe-Signature": signatureHeader,
            },
            body: payload,
        });

        if (!response.ok) {
            console.error(`   Webhook failed: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(`   Response: ${text}`);
            process.exit(1);
        }
        console.log("   Webhook sent successfully.");

        console.log("4. Verifying booking status in DB...");
        // Wait a moment for async processing
        await new Promise(r => setTimeout(r, 1000));

        const updatedBooking = await storage.getBooking(booking.id);
        if (updatedBooking?.paymentStatus === 'paid') {
            console.log("   SUCCESS! Booking payment status is 'paid'.");
            console.log(`   Payment Reference: ${updatedBooking.paymentReference}`);
            process.exit(0);
        } else {
            console.error(`   FAILURE. Booking status is still '${updatedBooking?.paymentStatus}'.`);
            process.exit(1);
        }

    } catch (err) {
        console.error("Test Error:", err);
        process.exit(1);
    }
}

runTest();
