import ical, { ICalCalendarMethod } from 'ical-generator';
import nodeIcal from 'node-ical';
import { Booking, type ExternalCalendar } from '@shared/schema';

// Generate an iCal feed for our bookings
export function generateIcalFeed(bookings: Booking[], calendarName: string = "Dzaleka Booking System"): string {
    const calendar = ical({
        name: calendarName,
        method: ICalCalendarMethod.PUBLISH
    });

    bookings.forEach(booking => {
        // Determine end time (default to 2 hours if not specified)
        if (booking.status === 'cancelled' || booking.status === 'pending') return;

        const start = new Date(`${booking.visitDate}T${booking.visitTime}`);
        let end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

        if (booking.checkOutTime) {
            end = new Date(booking.checkOutTime);
        } else if (booking.customDuration) {
            end = new Date(start.getTime() + booking.customDuration * 60 * 1000);
        }

        calendar.createEvent({
            start,
            end,
            summary: `Booking: ${booking.visitorName} (${booking.groupSize})`,
            description: `Reference: ${booking.bookingReference}\nTour: ${booking.tourType}\nPeople: ${booking.numberOfPeople}`,
            location: 'Dzaleka Refugee Camp',
            id: booking.id,
        });
    });

    return calendar.toString();
}

// Parse an incoming iCal feed
export async function parseIcalFeed(url: string, sourceName: string) {
    try {
        const data = await nodeIcal.async.fromURL(url);
        const events: any[] = [];

        // node-ical returns an object where keys are UIDs
        for (const k in data) {
            if (data.hasOwnProperty(k)) {
                const ev = data[k];
                if (ev.type === 'VEVENT') {
                    events.push({
                        uid: ev.uid,
                        summary: ev.summary,
                        description: ev.description,
                        start: ev.start,
                        end: ev.end,
                        location: ev.location,
                        source: sourceName
                    });
                }
            }
        }
        return events;
    } catch (error) {
        throw error;
    }
}
