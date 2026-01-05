"use client";

import * as React from "react";
import {
    format,
    parseISO,
    startOfDay,
    endOfDay,
    addDays,
    differenceInDays,
    isSameDay,
    isWithinInterval,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatTime } from "@/lib/constants";
import type { Booking, Guide } from "@shared/schema";

interface BookingWithGuide extends Booking {
    guide?: Guide;
}

interface BookingTimelineViewProps {
    bookings: BookingWithGuide[];
    guides: Guide[];
    onSelectBooking: (booking: BookingWithGuide) => void;
    selectedBookingId?: string;
    onReschedule?: (id: string, newDate: string) => void;
}

type TimelineZoom = "day" | "week" | "month";

const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    in_progress: "bg-purple-500",
    checked_in: "bg-purple-500",
    completed: "bg-green-500",
    cancelled: "bg-gray-400",
};

export function BookingTimelineView({
    bookings,
    guides,
    onSelectBooking,
    selectedBookingId,
    onReschedule,
}: BookingTimelineViewProps) {
    const [zoom, setZoom] = React.useState<TimelineZoom>("week");
    const [viewDate, setViewDate] = React.useState(new Date());
    const [groupBy, setGroupBy] = React.useState<"date" | "guide">("guide");

    // Get date range based on zoom level
    const getDateRange = React.useCallback(() => {
        switch (zoom) {
            case "day":
                return {
                    start: startOfDay(viewDate),
                    end: endOfDay(viewDate),
                };
            case "week":
                return {
                    start: startOfWeek(viewDate, { weekStartsOn: 1 }),
                    end: endOfWeek(viewDate, { weekStartsOn: 1 }),
                };
            case "month":
                return {
                    start: startOfMonth(viewDate),
                    end: endOfMonth(viewDate),
                };
        }
    }, [zoom, viewDate]);

    const dateRange = getDateRange();
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });

    // Get column width based on zoom
    const columnWidth = zoom === "day" ? 120 : zoom === "week" ? 100 : 40;

    // Navigate timeline
    const navigate = (direction: "prev" | "next") => {
        const offset = direction === "next" ? 1 : -1;
        switch (zoom) {
            case "day":
                setViewDate(addDays(viewDate, offset));
                break;
            case "week":
                setViewDate(addDays(viewDate, offset * 7));
                break;
            case "month":
                setViewDate(addDays(viewDate, offset * 30));
                break;
        }
    };

    // Get bookings grouped by guide
    const groupedByGuide = React.useMemo(() => {
        const groups = new Map<string, { guide: Guide | null; bookings: BookingWithGuide[] }>();

        // Add unassigned group
        groups.set("unassigned", { guide: null, bookings: [] });

        // Add guide groups
        guides.filter(g => g.isActive).forEach((guide) => {
            groups.set(guide.id, { guide, bookings: [] });
        });

        // Assign bookings
        bookings.forEach((booking) => {
            const bookingDate = parseISO(booking.visitDate);
            if (isWithinInterval(bookingDate, { start: dateRange.start, end: dateRange.end })) {
                const guideId = booking.assignedGuideId || "unassigned";
                const group = groups.get(guideId);
                if (group) {
                    group.bookings.push(booking);
                } else {
                    // Guide not found, add to unassigned
                    groups.get("unassigned")?.bookings.push(booking);
                }
            }
        });

        return Array.from(groups.values()).filter(g => g.bookings.length > 0 || g.guide !== null);
    }, [bookings, guides, dateRange]);

    // Calculate bar position for a booking
    const getBarStyle = (booking: BookingWithGuide) => {
        const bookingDate = parseISO(booking.visitDate);
        const dayIndex = differenceInDays(bookingDate, dateRange.start);
        const left = dayIndex * columnWidth;

        // For day view, use time-based positioning
        if (zoom === "day") {
            const [hours, minutes] = booking.visitTime.split(":").map(Number);
            const hourOffset = hours - 8; // Assume 8am start
            return {
                left: hourOffset * (columnWidth / 2),
                width: columnWidth / 2 - 4,
            };
        }

        return {
            left: left + 4,
            width: columnWidth - 8,
        };
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate("prev")}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setViewDate(new Date())}>
                        Today
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate("next")}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="text-sm font-medium">
                    {format(dateRange.start, "MMM d")} - {format(dateRange.end, "MMM d, yyyy")}
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "date" | "guide")}>
                        <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="guide">By Guide</SelectItem>
                            <SelectItem value="date">By Date</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex border rounded-lg overflow-hidden">
                        {(["day", "week", "month"] as TimelineZoom[]).map((z) => (
                            <Button
                                key={z}
                                variant={zoom === z ? "default" : "ghost"}
                                size="sm"
                                className="rounded-none h-8 px-3"
                                onClick={() => setZoom(z)}
                            >
                                {z.charAt(0).toUpperCase() + z.slice(1)}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <ScrollArea className="w-full border rounded-lg">
                <div className="min-w-max">
                    {/* Header Row - Days/Hours */}
                    <div className="flex border-b bg-muted/50 sticky top-0 z-10">
                        <div className="w-[150px] shrink-0 p-2 border-r font-medium text-sm">
                            {groupBy === "guide" ? "Guide" : "Date"}
                        </div>
                        <div className="flex">
                            {zoom === "day" ? (
                                // Hours for day view
                                Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                                    <div
                                        key={hour}
                                        className="text-center text-xs text-muted-foreground p-2 border-r"
                                        style={{ width: columnWidth / 2 }}
                                    >
                                        {format(new Date().setHours(hour, 0), "ha")}
                                    </div>
                                ))
                            ) : (
                                // Days for week/month view
                                days.map((day) => {
                                    const isToday = isSameDay(day, new Date());
                                    return (
                                        <div
                                            key={day.toISOString()}
                                            className={`text-center p-2 border-r ${isToday ? "bg-primary/10" : ""
                                                }`}
                                            style={{ width: columnWidth }}
                                        >
                                            <div className={`text-xs font-medium ${isToday ? "text-primary" : ""}`}>
                                                {format(day, zoom === "month" ? "d" : "EEE")}
                                            </div>
                                            {zoom === "week" && (
                                                <div className="text-[10px] text-muted-foreground">
                                                    {format(day, "MMM d")}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Rows */}
                    {groupBy === "guide" ? (
                        groupedByGuide.map(({ guide, bookings: guideBookings }) => (
                            <div key={guide?.id || "unassigned"} className="flex border-b hover:bg-muted/20">
                                {/* Row Label */}
                                <div className="w-[150px] shrink-0 p-2 border-r flex items-center gap-2">
                                    {guide ? (
                                        <>
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={guide.profileImageUrl || undefined} />
                                                <AvatarFallback className="text-[10px]">
                                                    {guide.firstName?.[0]}{guide.lastName?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium truncate">
                                                {guide.firstName} {guide.lastName?.[0]}.
                                            </span>
                                        </>
                                    ) : (
                                        <Badge variant="outline" className="text-xs">Unassigned</Badge>
                                    )}
                                </div>

                                {/* Row Content - Booking Bars */}
                                <div className="flex-1 relative h-14">
                                    <div className="absolute inset-0 flex">
                                        {days.map((day) => (
                                            <div
                                                key={day.toISOString()}
                                                className={`border-r ${isSameDay(day, new Date()) ? "bg-primary/5" : ""}`}
                                                style={{ width: columnWidth }}
                                            />
                                        ))}
                                    </div>
                                    {guideBookings.map((booking) => {
                                        const style = getBarStyle(booking);
                                        return (
                                            <div
                                                key={booking.id}
                                                className={`absolute top-2 h-10 rounded cursor-pointer transition-all hover:scale-105 hover:z-10 ${statusColors[booking.status || "pending"]
                                                    } ${selectedBookingId === booking.id ? "ring-2 ring-offset-1 ring-primary" : ""}`}
                                                style={{
                                                    left: style.left,
                                                    width: style.width,
                                                }}
                                                onClick={() => onSelectBooking(booking)}
                                                title={`${booking.visitorName} - ${formatTime(booking.visitTime)}`}
                                            >
                                                <div className="px-1.5 py-1 h-full flex flex-col justify-center overflow-hidden">
                                                    <span className="text-[10px] text-white font-medium truncate">
                                                        {booking.visitorName}
                                                    </span>
                                                    <span className="text-[9px] text-white/80 truncate">
                                                        {formatTime(booking.visitTime)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        // Group by date (show all bookings per row = per day)
                        days.map((day) => {
                            const dayBookings = bookings.filter((b) =>
                                isSameDay(parseISO(b.visitDate), day)
                            );
                            return (
                                <div key={day.toISOString()} className="flex border-b hover:bg-muted/20">
                                    <div className="w-[150px] shrink-0 p-2 border-r">
                                        <div className="text-sm font-medium">{format(day, "EEE, MMM d")}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""}
                                        </div>
                                    </div>
                                    <div className="flex-1 p-2 flex flex-wrap gap-1">
                                        {dayBookings.map((booking) => (
                                            <Badge
                                                key={booking.id}
                                                variant="outline"
                                                className={`cursor-pointer ${selectedBookingId === booking.id ? "ring-2 ring-primary" : ""
                                                    }`}
                                                onClick={() => onSelectBooking(booking)}
                                            >
                                                <div className={`h-2 w-2 rounded-full mr-1 ${statusColors[booking.status || "pending"]}`} />
                                                {booking.visitorName} - {formatTime(booking.visitTime)}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
