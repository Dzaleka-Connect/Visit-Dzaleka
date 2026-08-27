import * as dotenv from "dotenv";
dotenv.config();
import { storage } from "../server/storage";

async function listPendingBookings() {
    try {
        const bookings = await storage.getBookings();
        const pending = bookings.filter(b => b.paymentStatus === 'pending');

        console.log("Found " + pending.length + " pending bookings.");
        if (pending.length > 0) {
            console.log("Latest Pending Booking:", JSON.stringify(pending[pending.length - 1], null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listPendingBookings();
