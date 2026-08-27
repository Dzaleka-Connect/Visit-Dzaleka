
import "dotenv/config";
import { storage } from "./server/storage";

async function verify() {
    try {
        const bookings = await storage.getBookings();
        console.log(`Total Bookings: ${bookings.length}`);
        if (bookings.length > 0) {
            const b = bookings[0];
            console.log(`Sample Booking: ID=${b.id}, Date=${b.visitDate} (${typeof b.visitDate}), Time=${b.visitTime}`);
            const d = new Date(b.visitDate);
            console.log(`Parsed Date: ${d.toString()} | Valid: ${!isNaN(d.getTime())}`);
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

verify();
