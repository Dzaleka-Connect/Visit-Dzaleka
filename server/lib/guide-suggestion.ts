import { storage } from "../storage";
import type { Guide, GuideAvailability, Booking } from "@shared/schema";

/**
 * Smart Guide Assignment Algorithm
 * 
 * Suggests the best guide for a booking based on:
 * - Zone expertise (30 points)
 * - Availability (25 points)
 * - Current workload (25 points)
 * - Rating (20 points)
 */

export interface GuideSuggestion {
    guide: Guide;
    score: number;
    breakdown: {
        zoneExpertise: number;    // 0-30 points
        availability: number;     // 0-25 points  
        workload: number;         // 0-25 points
        rating: number;           // 0-20 points
    };
    reasons: string[];
}

export interface SuggestGuidesParams {
    visitDate: string;           // YYYY-MM-DD
    visitTime: string;           // HH:MM
    selectedZones: string[];     // Zone IDs
    excludeGuideIds?: string[];  // Guides to exclude
}

/**
 * Get suggested guides for a booking, ranked by score
 */
export async function suggestGuides(params: SuggestGuidesParams): Promise<GuideSuggestion[]> {
    const { visitDate, visitTime, selectedZones, excludeGuideIds = [] } = params;

    // Get all active guides
    const allGuides = await storage.getGuides();
    const activeGuides = allGuides.filter(g => g.isActive && !excludeGuideIds.includes(g.id));

    // Get all bookings for workload calculation
    const allBookings = await storage.getBookings();

    // Calculate the week range for workload
    const visitDateObj = new Date(visitDate);
    const weekStart = new Date(visitDateObj);
    weekStart.setDate(visitDateObj.getDate() - visitDateObj.getDay()); // Sunday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Saturday

    // Get guide availability for the date
    const guideAvailabilityMap = new Map<string, GuideAvailability[]>();
    for (const guide of activeGuides) {
        const availability = await storage.getGuideAvailability(guide.id);
        guideAvailabilityMap.set(guide.id, availability);
    }

    // Score each guide
    const suggestions: GuideSuggestion[] = [];

    for (const guide of activeGuides) {
        const breakdown = {
            zoneExpertise: calculateZoneExpertiseScore(guide, selectedZones),
            availability: calculateAvailabilityScore(guide, guideAvailabilityMap.get(guide.id) || [], visitDate, visitTime),
            workload: calculateWorkloadScore(guide, allBookings, weekStart, weekEnd),
            rating: calculateRatingScore(guide),
        };

        const score = breakdown.zoneExpertise + breakdown.availability + breakdown.workload + breakdown.rating;
        const reasons = generateReasons(guide, breakdown, selectedZones);

        suggestions.push({
            guide,
            score,
            breakdown,
            reasons,
        });
    }

    // Sort by score (highest first)
    return suggestions.sort((a, b) => b.score - a.score);
}

/**
 * Zone Expertise Score (0-30 points)
 * Based on how many of the selected zones match the guide's assigned zones
 */
function calculateZoneExpertiseScore(guide: Guide, selectedZones: string[]): number {
    if (selectedZones.length === 0) {
        // No specific zones requested, give partial credit to all
        return 15;
    }

    const guideZones = guide.assignedZones || [];
    if (guideZones.length === 0) {
        // Guide has no zone assignments, give minimal credit
        return 5;
    }

    const matchingZones = selectedZones.filter(zone => guideZones.includes(zone));
    const matchPercentage = matchingZones.length / selectedZones.length;

    return Math.round(matchPercentage * 30);
}

/**
 * Availability Score (0-25 points)
 * Checks if guide is available on the requested date/time
 */
function calculateAvailabilityScore(
    guide: Guide,
    availability: GuideAvailability[],
    visitDate: string,
    visitTime: string
): number {
    const visitDateObj = new Date(visitDate);
    const dayOfWeek = visitDateObj.getDay(); // 0 = Sunday, 6 = Saturday
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayNames[dayOfWeek];

    // Check if guide works on this day of week
    const availableDays = guide.availableDays || [];
    if (availableDays.length > 0 && !availableDays.includes(dayName)) {
        return 0; // Not available on this day
    }

    // Check for specific date availability entries
    const dateAvailability = availability.find(a => a.date === visitDate);
    if (dateAvailability) {
        if (!dateAvailability.isAvailable) {
            return 0; // Explicitly marked as not available
        }
        // Check time range
        if (isTimeInRange(visitTime, dateAvailability.startTime, dateAvailability.endTime)) {
            return 25; // Perfect match
        }
        return 10; // Available on date but not at the exact time
    }

    // Check recurring availability for this day of week
    const recurringAvailability = availability.filter(a => a.isRecurring && a.dayOfWeek === dayOfWeek);
    if (recurringAvailability.length > 0) {
        const timeMatch = recurringAvailability.find(a =>
            isTimeInRange(visitTime, a.startTime, a.endTime)
        );
        if (timeMatch) {
            return 25; // Perfect match
        }
        return 15; // Available on day but not at exact time
    }

    // No specific availability data - assume generally available if availableDays matches
    if (availableDays.length === 0 || availableDays.includes(dayName)) {
        return 20; // Likely available
    }

    return 0;
}

/**
 * Check if a time is within a range
 */
function isTimeInRange(checkTime: string, startTime: string, endTime: string): boolean {
    const check = timeToMinutes(checkTime);
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    return check >= start && check <= end;
}

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + (minutes || 0);
}

/**
 * Workload Score (0-25 points)
 * Lower workload in the same week = higher score
 */
function calculateWorkloadScore(
    guide: Guide,
    allBookings: Booking[],
    weekStart: Date,
    weekEnd: Date
): number {
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    // Count bookings assigned to this guide in the week
    const weekBookings = allBookings.filter(b =>
        b.assignedGuideId === guide.id &&
        b.visitDate >= weekStartStr &&
        b.visitDate <= weekEndStr &&
        b.status !== "cancelled"
    );

    const bookingCount = weekBookings.length;

    // Scoring: 0 bookings = 25 points, 1-2 = 20, 3-4 = 15, 5-6 = 10, 7+ = 5
    if (bookingCount === 0) return 25;
    if (bookingCount <= 2) return 20;
    if (bookingCount <= 4) return 15;
    if (bookingCount <= 6) return 10;
    return 5;
}

/**
 * Rating Score (0-20 points)
 * Normalized from guide's rating (0-5 scale)
 */
function calculateRatingScore(guide: Guide): number {
    const rating = guide.rating || 0;
    const totalRatings = guide.totalRatings || 0;

    // If no ratings yet, give average score
    if (totalRatings === 0) {
        return 10;
    }

    // Rating is stored as 0-5, normalize to 0-20
    return Math.round((rating / 5) * 20);
}

/**
 * Generate human-readable reasons for the suggestion
 */
function generateReasons(guide: Guide, breakdown: GuideSuggestion["breakdown"], selectedZones: string[]): string[] {
    const reasons: string[] = [];

    // Zone expertise
    if (breakdown.zoneExpertise >= 25) {
        reasons.push("Expert in all selected zones");
    } else if (breakdown.zoneExpertise >= 15) {
        reasons.push("Familiar with most selected zones");
    } else if (breakdown.zoneExpertise > 0) {
        reasons.push("Some zone experience");
    }

    // Availability
    if (breakdown.availability >= 25) {
        reasons.push("Fully available at requested time");
    } else if (breakdown.availability >= 15) {
        reasons.push("Available on requested date");
    } else if (breakdown.availability === 0) {
        reasons.push("May not be available");
    }

    // Workload
    if (breakdown.workload >= 25) {
        reasons.push("No other bookings this week");
    } else if (breakdown.workload >= 20) {
        reasons.push("Light schedule this week");
    } else if (breakdown.workload <= 10) {
        reasons.push("Busy week—consider backup");
    }

    // Rating
    if (breakdown.rating >= 18) {
        reasons.push("Highly rated by visitors");
    } else if (breakdown.rating >= 10 && (guide.totalRatings || 0) === 0) {
        reasons.push("New guide—no ratings yet");
    }

    return reasons;
}

/**
 * Get a quick summary of why this guide was suggested
 */
export function getTopReason(suggestion: GuideSuggestion): string {
    const { breakdown } = suggestion;

    // Find the highest scoring category
    const categories = [
        { name: "zone expertise", score: breakdown.zoneExpertise, max: 30 },
        { name: "availability", score: breakdown.availability, max: 25 },
        { name: "light workload", score: breakdown.workload, max: 25 },
        { name: "high rating", score: breakdown.rating, max: 20 },
    ];

    const best = categories.reduce((prev, curr) =>
        (curr.score / curr.max) > (prev.score / prev.max) ? curr : prev
    );

    return `Best for ${best.name}`;
}
