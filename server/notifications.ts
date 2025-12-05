import { storage } from "./storage";
import type { NotificationType, Notification } from "@shared/schema";

interface CreateNotificationOptions {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    relatedId?: string;
}

/**
 * Helper to create notifications for users
 */
export async function createNotification(options: CreateNotificationOptions): Promise<Notification | null> {
    try {
        const notification = await storage.createNotification({
            userId: options.userId,
            type: options.type,
            title: options.title,
            message: options.message,
            link: options.link,
            relatedId: options.relatedId,
        });
        return notification;
    } catch (error) {
        console.error("Failed to create notification:", error);
        return null;
    }
}

/**
 * Notify admins and coordinators about a new booking
 */
export async function notifyBookingCreated(bookingId: string, visitorName: string, visitDate: string): Promise<void> {
    try {
        const users = await storage.getUsers();
        const recipients = users.filter((u) => u.role === "admin" || u.role === "coordinator");

        for (const user of recipients) {
            await createNotification({
                userId: user.id,
                type: "booking_created",
                title: "New Booking Request",
                message: `${visitorName} has requested a visit on ${visitDate}`,
                link: "/bookings",
                relatedId: bookingId,
            });
        }
    } catch (error) {
        console.error("Failed to notify booking created:", error);
    }
}

/**
 * Notify visitor about booking status change
 */
export async function notifyBookingStatusChanged(
    bookingId: string,
    visitorUserId: string | null,
    status: string,
    bookingRef: string
): Promise<void> {
    if (!visitorUserId) return;

    try {
        const statusMessages: Record<string, { title: string; message: string; type: NotificationType }> = {
            confirmed: {
                title: "Booking Confirmed!",
                message: `Your booking ${bookingRef} has been confirmed.`,
                type: "booking_confirmed",
            },
            cancelled: {
                title: "Booking Cancelled",
                message: `Your booking ${bookingRef} has been cancelled.`,
                type: "booking_cancelled",
            },
            completed: {
                title: "Tour Completed",
                message: `Your visit ${bookingRef} has been marked as completed. Thank you!`,
                type: "booking_completed",
            },
            in_progress: {
                title: "Tour Started",
                message: `Your visit ${bookingRef} is now in progress. Enjoy your tour!`,
                type: "booking_confirmed",
            },
        };

        const notif = statusMessages[status];
        if (notif) {
            await createNotification({
                userId: visitorUserId,
                type: notif.type,
                title: notif.title,
                message: notif.message,
                link: "/my-bookings",
                relatedId: bookingId,
            });
        }
    } catch (error) {
        console.error("Failed to notify booking status change:", error);
    }
}

/**
 * Notify guide about assignment
 */
export async function notifyGuideAssigned(
    bookingId: string,
    guideUserId: string,
    visitorName: string,
    visitDate: string
): Promise<void> {
    try {
        await createNotification({
            userId: guideUserId,
            type: "guide_assigned",
            title: "New Tour Assignment",
            message: `You've been assigned to guide ${visitorName} on ${visitDate}`,
            link: "/calendar",
            relatedId: bookingId,
        });
    } catch (error) {
        console.error("Failed to notify guide assigned:", error);
    }
}

/**
 * Notify admins/coordinators about visitor check-in
 */
export async function notifyCheckIn(
    bookingId: string,
    visitorName: string,
    bookingRef: string
): Promise<void> {
    try {
        const users = await storage.getUsers();
        const recipients = users.filter((u) => u.role === "admin" || u.role === "coordinator");

        for (const user of recipients) {
            await createNotification({
                userId: user.id,
                type: "check_in",
                title: "Visitor Checked In",
                message: `${visitorName} (${bookingRef}) has checked in`,
                link: "/security",
                relatedId: bookingId,
            });
        }
    } catch (error) {
        console.error("Failed to notify check-in:", error);
    }
}

/**
 * Notify admins/coordinators about payment received
 */
export async function notifyPaymentReceived(
    bookingId: string,
    visitorName: string,
    amount: number,
    paymentMethod: string
): Promise<void> {
    try {
        const users = await storage.getUsers();
        const recipients = users.filter((u) => u.role === "admin" || u.role === "coordinator");

        const formattedAmount = new Intl.NumberFormat("en-MW", {
            style: "currency",
            currency: "MWK",
            minimumFractionDigits: 0,
        }).format(amount);

        for (const user of recipients) {
            await createNotification({
                userId: user.id,
                type: "payment_received",
                title: "Payment Received",
                message: `${formattedAmount} received from ${visitorName} via ${paymentMethod}`,
                link: "/revenue",
                relatedId: bookingId,
            });
        }
    } catch (error) {
        console.error("Failed to notify payment received:", error);
    }
}
