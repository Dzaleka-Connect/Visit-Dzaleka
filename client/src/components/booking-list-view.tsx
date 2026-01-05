"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status-badge";
import {
    ChevronDown,
    ChevronUp,
    ArrowUpDown,
    Clock,
    Users,
    MapPin,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { formatTime, formatCurrency } from "@/lib/constants";
import type { Booking, Guide } from "@shared/schema";

interface BookingWithGuide extends Booking {
    guide?: Guide;
}

interface BookingListViewProps {
    bookings: BookingWithGuide[];
    onSelectBooking: (booking: BookingWithGuide) => void;
    selectedBookingId?: string;
    onConfirm?: (id: string) => void;
    onCancel?: (id: string) => void;
}

type SortField = "visitDate" | "visitorName" | "status" | "numberOfPeople" | "totalAmount";
type SortDirection = "asc" | "desc";

export function BookingListView({
    bookings,
    onSelectBooking,
    selectedBookingId,
    onConfirm,
    onCancel,
}: BookingListViewProps) {
    const [sortField, setSortField] = React.useState<SortField>("visitDate");
    const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");
    const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const sortedBookings = React.useMemo(() => {
        return [...bookings].sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case "visitDate":
                    comparison = a.visitDate.localeCompare(b.visitDate);
                    break;
                case "visitorName":
                    comparison = a.visitorName.localeCompare(b.visitorName);
                    break;
                case "status":
                    comparison = (a.status || "").localeCompare(b.status || "");
                    break;
                case "numberOfPeople":
                    comparison = (a.numberOfPeople || 0) - (b.numberOfPeople || 0);
                    break;
                case "totalAmount":
                    comparison = (a.totalAmount || 0) - (b.totalAmount || 0);
                    break;
            }
            return sortDirection === "asc" ? comparison : -comparison;
        });
    }, [bookings, sortField, sortDirection]);

    const toggleRowExpansion = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const SortButton = ({ field, label }: { field: SortField; label: string }) => (
        <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => handleSort(field)}
        >
            {label}
            {sortField === field ? (
                sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-3 w-3" />
                ) : (
                    <ChevronDown className="ml-1 h-3 w-3" />
                )
            ) : (
                <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
            )}
        </Button>
    );

    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead><SortButton field="visitDate" label="Date & Time" /></TableHead>
                        <TableHead><SortButton field="visitorName" label="Visitor" /></TableHead>
                        <TableHead><SortButton field="status" label="Status" /></TableHead>
                        <TableHead>Guide</TableHead>
                        <TableHead className="text-center"><SortButton field="numberOfPeople" label="People" /></TableHead>
                        <TableHead className="text-right"><SortButton field="totalAmount" label="Amount" /></TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedBookings.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                No bookings found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        sortedBookings.map((booking) => (
                            <React.Fragment key={booking.id}>
                                <TableRow
                                    className={`cursor-pointer transition-colors ${selectedBookingId === booking.id ? "bg-muted" : "hover:bg-muted/50"
                                        }`}
                                    onClick={() => onSelectBooking(booking)}
                                >
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleRowExpansion(booking.id);
                                            }}
                                        >
                                            {expandedRows.has(booking.id) ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {format(parseISO(booking.visitDate), "MMM d, yyyy")}
                                            </span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatTime(booking.visitTime)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{booking.visitorName}</span>
                                            <span className="text-xs text-muted-foreground">{booking.visitorEmail}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={booking.status || "pending"} />
                                    </TableCell>
                                    <TableCell>
                                        {booking.guide ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={booking.guide.profileImageUrl || undefined} />
                                                    <AvatarFallback className="text-[10px]">
                                                        {booking.guide.firstName?.[0]}{booking.guide.lastName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">{booking.guide.firstName}</span>
                                            </div>
                                        ) : (
                                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                                Unassigned
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Users className="h-3 w-3 text-muted-foreground" />
                                            {booking.numberOfPeople}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(booking.totalAmount || 0)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            {booking.status === "pending" && onConfirm && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onConfirm(booking.id);
                                                    }}
                                                    title="Confirm"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {booking.status !== "cancelled" && booking.status !== "completed" && onCancel && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCancel(booking.id);
                                                    }}
                                                    title="Cancel"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                                {expandedRows.has(booking.id) && (
                                    <TableRow className="bg-muted/30">
                                        <TableCell colSpan={8} className="py-4">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="text-xs text-muted-foreground">Phone</span>
                                                    <p className="font-medium">{booking.visitorPhone || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-muted-foreground">Tour Type</span>
                                                    <p className="font-medium capitalize">{booking.tourType}</p>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-muted-foreground">Payment</span>
                                                    <p className="font-medium capitalize">{booking.paymentStatus || "Pending"}</p>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-muted-foreground">Reference</span>
                                                    <p className="font-medium">{booking.bookingReference || booking.id.slice(0, 8)}</p>
                                                </div>
                                                {booking.specialRequests && (
                                                    <div className="col-span-2 md:col-span-4">
                                                        <span className="text-xs text-muted-foreground">Special Requests</span>
                                                        <p className="font-medium">{booking.specialRequests}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
