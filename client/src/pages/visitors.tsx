import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
    Users,
    Search,
    Eye,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Star,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import type { User, Booking } from "@shared/schema";
import { SEO } from "@/components/seo";

interface VisitorWithStats {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    phone?: string | null;
    country?: string | null;
    profileImageUrl?: string | null;
    isActive?: boolean | null;
    isRegistered: boolean; // true = has user account, false = from booking only
    createdAt?: Date | string | null;
    totalBookings?: number;
    completedTours?: number;
    totalSpent?: number;
    lastVisit?: string;
}

type CustomerRecord = User & {
    stats?: {
        totalVisits?: number;
        totalSpend?: number;
        lastVisit?: string;
        bookingCount?: number;
    };
};

const getRecognizedBookingRevenue = (booking: Booking) =>
    booking.paymentStatus === "paid" && booking.status !== "cancelled"
        ? booking.totalAmount || 0
        : 0;

export default function VisitorsPage() {
    const [, setLocation] = useLocation();
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("recent");
    const [filterType, setFilterType] = useState("all"); // all, registered, unregistered

    // Fetch registered visitor CRM records
    const { data: registeredVisitors = [], isLoading: usersLoading } = useQuery<CustomerRecord[]>({
        queryKey: ["/api/customers"],
    });

    // Fetch all bookings for stats
    const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
        queryKey: ["/api/bookings"],
    });

    // Get unique visitors from bookings who are NOT in the users table
    const registeredEmails = new Set(registeredVisitors.map((v) => v.email?.toLowerCase()));

    const unregisteredVisitorsMap = new Map<string, VisitorWithStats>();
    bookings?.forEach((booking) => {
        const email = booking.visitorEmail?.toLowerCase();
        if (email && !registeredEmails.has(email) && !unregisteredVisitorsMap.has(email)) {
            // Parse name from visitorName field
            const nameParts = (booking.visitorName || "").split(" ");
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            unregisteredVisitorsMap.set(email, {
                id: `unregistered-${email}`,
                firstName,
                lastName,
                email: booking.visitorEmail,
                phone: booking.visitorPhone,
                country: booking.visitorCountry,
                profileImageUrl: null,
                isActive: null, // Not applicable for unregistered
                isRegistered: false,
                createdAt: booking.createdAt,
                totalBookings: 0,
                completedTours: 0,
                totalSpent: 0,
            });
        }
    });

    const unregisteredVisitors = Array.from(unregisteredVisitorsMap.values());

    // Combine all visitors
    const allVisitors: VisitorWithStats[] = [
        ...registeredVisitors.map((visitor) => ({
            ...visitor,
            isRegistered: true,
            totalBookings: visitor.stats?.bookingCount || 0,
            completedTours: visitor.stats?.totalVisits || 0,
            totalSpent: visitor.stats?.totalSpend || 0,
            lastVisit: visitor.stats?.lastVisit,
        })),
        ...unregisteredVisitors,
    ];

    // Enrich all visitors with booking stats
    const visitorsWithStats: VisitorWithStats[] = allVisitors.map((visitor) => {
        const visitorBookings = bookings?.filter(
            (b) => b.visitorUserId === visitor.id || b.visitorEmail?.toLowerCase() === visitor.email?.toLowerCase()
        ) || [];
        const completedBookings = visitorBookings.filter((b) => b.status === "completed");
        const totalSpent = visitorBookings.reduce((sum, b) => sum + getRecognizedBookingRevenue(b), 0);
        const lastBooking = [...visitorBookings].sort(
            (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
        )[0];
        const latestCountry = visitor.country || visitorBookings
            .filter((booking) => booking.visitorCountry)
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0]?.visitorCountry || null;

        // For unregistered visitors, use earliest booking date as createdAt
        const earliestBooking = [...visitorBookings].sort(
            (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        )[0];

        return {
            ...visitor,
            createdAt: visitor.isRegistered ? visitor.createdAt : earliestBooking?.createdAt,
            totalBookings: visitorBookings.length,
            completedTours: completedBookings.length,
            totalSpent,
            lastVisit: lastBooking?.visitDate,
            country: latestCountry,
        };
    });

    // Filter by type and search
    const filteredVisitors = visitorsWithStats
        .filter((v) => {
            // Type filter
            if (filterType === "registered" && !v.isRegistered) return false;
            if (filterType === "unregistered" && v.isRegistered) return false;

            // Search filter
            const query = searchQuery.toLowerCase();
            return (
                v.firstName?.toLowerCase().includes(query) ||
                v.lastName?.toLowerCase().includes(query) ||
                v.email?.toLowerCase().includes(query) ||
                v.phone?.toLowerCase().includes(query) ||
                v.country?.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            if (sortBy === "recent") {
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            }
            if (sortBy === "bookings") {
                return (b.totalBookings || 0) - (a.totalBookings || 0);
            }
            if (sortBy === "spent") {
                return (b.totalSpent || 0) - (a.totalSpent || 0);
            }
            return 0;
        });

    // Stats
    const totalVisitors = visitorsWithStats.length;
    const registeredCount = visitorsWithStats.filter((v) => v.isRegistered).length;
    const totalBookingsCount = visitorsWithStats.reduce((sum, v) => sum + (v.totalBookings || 0), 0);
    const totalRevenue = visitorsWithStats.reduce((sum, v) => sum + (v.totalSpent || 0), 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-MW", {
            style: "currency",
            currency: "MWK",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
            in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
            completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        };
        return (
            <Badge className={styles[status] || "bg-gray-100 text-gray-800"}>
                {status.replace("_", " ")}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            <SEO
                title="Visitors"
                description="View all visitors who have registered or booked tours at Visit Dzaleka."
            />
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Visitors</h1>
                <p className="text-muted-foreground">
                    View all visitors who have registered or booked tours.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalVisitors}</p>
                            <p className="text-sm text-muted-foreground">Total Visitors</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{registeredCount}</p>
                            <p className="text-sm text-muted-foreground">Registered</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                            <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalBookingsCount}</p>
                            <p className="text-sm text-muted-foreground">Total Bookings</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
                            <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                            <p className="text-sm text-muted-foreground">Total Revenue</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Visitors Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>All Visitors</CardTitle>
                        <div className="flex gap-4 flex-wrap">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search visitors..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Visitors</SelectItem>
                                    <SelectItem value="registered">Registered</SelectItem>
                                    <SelectItem value="unregistered">Unregistered</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="recent">Most Recent</SelectItem>
                                    <SelectItem value="bookings">Most Bookings</SelectItem>
                                    <SelectItem value="spent">Most Spent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {(usersLoading || bookingsLoading) ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : filteredVisitors.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title="No visitors found"
                            description={searchQuery || filterType !== "all" ? "Try adjusting your filters." : "No visitors have booked tours yet."}
                            className="py-8"
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Visitor</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Bookings</TableHead>
                                    <TableHead>Total Spent</TableHead>
                                    <TableHead>Last Visit</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredVisitors.map((visitor) => (
                                    <TableRow key={visitor.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={visitor.profileImageUrl || undefined} />
                                                    <AvatarFallback>
                                                        {visitor.firstName?.charAt(0) || "V"}
                                                        {visitor.lastName?.charAt(0) || ""}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <button
                                                        className="font-medium text-left hover:text-primary hover:underline cursor-pointer transition-colors"
                                                        onClick={() => setLocation(`/admin/visitors/${encodeURIComponent(visitor.id)}`)}
                                                    >
                                                        {visitor.firstName} {visitor.lastName}
                                                    </button>
                                                    <p className="text-xs text-muted-foreground">
                                                        Joined {visitor.createdAt
                                                            ? formatDistanceToNow(new Date(visitor.createdAt), { addSuffix: true })
                                                            : "unknown"}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    {visitor.email}
                                                </div>
                                                {visitor.phone && (
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Phone className="h-3 w-3" />
                                                        {visitor.phone}
                                                    </div>
                                                )}
                                                {visitor.country && (
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <MapPin className="h-3 w-3" />
                                                        {visitor.country}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{visitor.totalBookings || 0}</span>
                                                {visitor.completedTours ? (
                                                    <span className="text-xs text-green-600">
                                                        ({visitor.completedTours} completed)
                                                    </span>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {formatCurrency(visitor.totalSpent || 0)}
                                        </TableCell>
                                        <TableCell>
                                            {visitor.lastVisit ? (
                                                format(new Date(visitor.lastVisit), "MMM d, yyyy")
                                            ) : (
                                                <span className="text-muted-foreground">No visits yet</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={visitor.isRegistered ? "default" : "secondary"}
                                                className={
                                                    visitor.isRegistered
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                        : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                                                }
                                            >
                                                {visitor.isRegistered ? "Registered" : "Unregistered"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setLocation(`/admin/visitors/${encodeURIComponent(visitor.id)}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
