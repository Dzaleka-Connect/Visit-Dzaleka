
import * as dotenv from "dotenv";
dotenv.config();
import { storage } from "../server/storage";

async function checkPaidBookings() {
    try {
        console.log("Checking for paid bookings...");
        const bookings = await storage.getBookings();
        console.log(`Total bookings found: ${bookings.length}`);

        const paid = bookings.filter(b => b.paymentStatus === 'paid');
        console.log(`Paid bookings found: ${paid.length}`);

        if (paid.length > 0) {
            console.log("Sample Paid Booking:");
            console.log(JSON.stringify(paid[0], null, 2));
        } else {
            console.log("No paid bookings found. Listing first 3 bookings to check status:");
            bookings.slice(0, 3).forEach(b => {
                console.log(`- ID: ${b.id}, Status: ${b.paymentStatus}, Method: ${b.paymentMethod}`);
            });
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPaidBookings();
