"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Clock, Users, GripVertical } from "lucide-react";
import { formatTime, formatCurrency } from "@/lib/constants";
import type { Booking, Guide } from "@shared/schema";

interface BookingWithGuide extends Booking {
    guide?: Guide;
}

interface BookingBoardViewProps {
    bookings: BookingWithGuide[];
    onSelectBooking: (booking: BookingWithGuide) => void;
    selectedBookingId?: string;
    onStatusChange?: (id: string, newStatus: string) => void;
}

const statusColumns = [
    { id: "pending", label: "Pending", color: "bg-yellow-500" },
    { id: "confirmed", label: "Confirmed", color: "bg-blue-500" },
    { id: "in_progress", label: "In Progress", color: "bg-purple-500" },
    { id: "completed", label: "Completed", color: "bg-green-500" },
];

export function BookingBoardView({
    bookings,
    onSelectBooking,
    selectedBookingId,
    onStatusChange,
}: BookingBoardViewProps) {
    const [draggedBooking, setDraggedBooking] = React.useState<BookingWithGuide | null>(null);
    const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null);

    const getBookingsByStatus = (status: string) => {
        return bookings.filter((b) => {
            return b.status === status;
        });
    };

    const handleDragStart = (e: React.DragEvent, booking: BookingWithGuide) => {
        setDraggedBooking(booking);
        e.dataTransfer.effectAllowed = "move";
        // Set transform to prevent image dragging
        const target = e.target as HTMLElement;
        target.style.opacity = "0.5";
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.target as HTMLElement;
        target.style.opacity = "1";
        setDraggedBooking(null);
        setDragOverColumn(null);
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverColumn(columnId);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        if (draggedBooking && onStatusChange && draggedBooking.status !== columnId) {
            onStatusChange(draggedBooking.id, columnId);
        }
        setDraggedBooking(null);
        setDragOverColumn(null);
    };

    return (
        <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4 min-w-max">
                {statusColumns.map((column) => {
                    const columnBookings = getBookingsByStatus(column.id);
                    const isDropTarget = dragOverColumn === column.id;

                    return (
                        <div
                            key={column.id}
                            className={`flex-shrink-0 w-[300px] sm:w-[320px] rounded-lg border bg-muted/30 ${isDropTarget ? "ring-2 ring-primary bg-primary/5" : ""
                                }`}
                            onDragOver={(e) => handleDragOver(e, column.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, column.id)}
                        >
                            {/* Column Header */}
                            <div className="flex items-center gap-2 p-3 border-b bg-muted/50">
                                <div className={`h-2 w-2 rounded-full ${column.color}`} />
                                <h3 className="font-semibold text-sm">{column.label}</h3>
                                <Badge variant="secondary" className="ml-auto h-5 min-w-5 flex items-center justify-center text-xs">
                                    {columnBookings.length}
                                </Badge>
                            </div>

                            {/* Column Content */}
                            <div className="p-2 space-y-2 min-h-[200px]">
                                {columnBookings.length === 0 ? (
                                    <div className="flex items-center justify-center h-24 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                                        No bookings
                                    </div>
                                ) : (
                                    columnBookings.map((booking) => (
                                        <Card
                                            key={booking.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, booking)}
                                            onDragEnd={handleDragEnd}
                                            className={`cursor-pointer transition-all hover:shadow-md ${selectedBookingId === booking.id
                                                    ? "ring-2 ring-primary"
                                                    : ""
                                                } ${draggedBooking?.id === booking.id ? "opacity-50" : ""
                                                }`}
                                            onClick={() => onSelectBooking(booking)}
                                        >
                                            <CardContent className="p-3">
                                                {/* Drag Handle */}
                                                <div className="flex items-start gap-2">
                                                    <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 cursor-grab" />
                                                    <div className="flex-1 min-w-0">
                                                        {/* Visitor Name */}
                                                        <p className="font-medium text-sm truncate">
                                                            {booking.visitorName}
                                                        </p>

                                                        {/* Date & Time */}
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                            <span>{format(parseISO(booking.visitDate), "MMM d")}</span>
                                                            <span className="flex items-center gap-0.5">
                                                                <Clock className="h-3 w-3" />
                                                                {formatTime(booking.visitTime)}
                                                            </span>
                                                        </div>

                                                        {/* Bottom Row */}
                                                        <div className="flex items-center justify-between mt-2">
                                                            {/* Guide */}
                                                            {booking.guide ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Avatar className="h-5 w-5">
                                                                        <AvatarImage src={booking.guide.profileImageUrl || undefined} />
                                                                        <AvatarFallback className="text-[8px]">
                                                                            {booking.guide.firstName?.[0]}{booking.guide.lastName?.[0]}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {booking.guide.firstName}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px] h-5">
                                                                    Unassigned
                                                                </Badge>
                                                            )}

                                                            {/* People & Amount */}
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <span className="flex items-center gap-0.5 text-muted-foreground">
                                                                    <Users className="h-3 w-3" />
                                                                    {booking.numberOfPeople}
                                                                </span>
                                                                <span className="font-medium">
                                                                    {formatCurrency(booking.totalAmount || 0)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}
