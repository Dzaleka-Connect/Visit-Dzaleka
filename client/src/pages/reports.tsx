import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    FileText,
    Download,
    Filter,
    Calendar,
    Users,
    DollarSign,
    CalendarDays,
    Loader2,
    Search,
    ChevronDown,
    Mail,
    AlertTriangle,
    Lightbulb,
    UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { StatusBadge } from "@/components/status-badge";
import { SEO } from "@/components/seo";
import { formatDate, formatTime, formatCurrency, TOUR_TYPES } from "@/lib/constants";
import { StatusBreakdownChart, POIFrequencyChart, GuideUtilizationChart, ParticipantsChart, SeasonalTrendsChart, BookingTimeHeatmap, RevenueByTourChart, EmailStatsChart } from "@/components/dashboard-charts";
import type { StatusBreakdownData, POIFrequencyData, GuideUtilizationData, ParticipantsData, MonthlyTrendData, HeatmapData, RevenueByTourData, EmailStatsData } from "@/components/dashboard-charts";
import type { Booking, Guide, Zone, PointOfInterest } from "@shared/schema";

interface BookingWithGuide extends Booking {
    guide?: Guide;
}

export default function Reports() {
    const [activeTab, setActiveTab] = useState("bookings");
    const [filtersOpen, setFiltersOpen] = useState(true);

    // Filters state
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date();
        d.setDate(1); // First of month
        return d.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
    const [tourType, setTourType] = useState<string>("all");
    const [status, setStatus] = useState<string>("all");
    const [paymentStatus, setPaymentStatus] = useState<string>("all");
    const [guideId, setGuideId] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch data
    const { data: bookings, isLoading: bookingsLoading } = useQuery<BookingWithGuide[]>({
        queryKey: ["/api/bookings"],
    });

    const { data: guides } = useQuery<Guide[]>({
        queryKey: ["/api/guides"],
    });

    const { data: zones } = useQuery<Zone[]>({
        queryKey: ["/api/zones"],
    });

    const { data: pointsOfInterest } = useQuery<PointOfInterest[]>({
        queryKey: ["/api/points-of-interest"],
    });

    // Filter bookings
    const filteredBookings = useMemo(() => {
        if (!bookings) return [];

        return bookings.filter(booking => {
            // Date filter
            const bookingDate = new Date(booking.visitDate);
            const from = new Date(dateFrom);
            const to = new Date(dateTo);
            to.setHours(23, 59, 59);
            if (bookingDate < from || bookingDate > to) return false;

            // Tour type filter
            if (tourType !== "all" && booking.tourType !== tourType) return false;

            // Status filter
            if (status !== "all" && booking.status !== status) return false;

            // Payment filter
            if (paymentStatus !== "all" && booking.paymentStatus !== paymentStatus) return false;

            // Guide filter
            if (guideId !== "all" && booking.assignedGuideId !== guideId) return false;

            // Search query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (
                    !booking.visitorName.toLowerCase().includes(query) &&
                    !booking.visitorEmail.toLowerCase().includes(query) &&
                    !(booking.bookingReference || "").toLowerCase().includes(query)
                ) {
                    return false;
                }
            }

            return true;
        });
    }, [bookings, dateFrom, dateTo, tourType, status, paymentStatus, guideId, searchQuery]);

    // Calculate summary stats & Chart Data
    const summaryStats = useMemo(() => {
        const stats = {
            totalBookings: filteredBookings.length,
            totalParticipants: filteredBookings.reduce((sum, b) => sum + (b.numberOfPeople || 1), 0),
            totalRevenue: filteredBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
            confirmedCount: filteredBookings.filter(b => b.status === "confirmed").length,
            cancelledCount: filteredBookings.filter(b => b.status === "cancelled").length,
            completedCount: filteredBookings.filter(b => b.status === "completed").length,
            pendingCount: filteredBookings.filter(b => b.status === "pending").length,
        };
        return stats;
    }, [filteredBookings]);

    const statusBreakdownData = useMemo<StatusBreakdownData>(() => {
        const total = filteredBookings.length;
        if (total === 0) return { total: 0, breakdown: [], cancellationRate: 0, completionRate: 0 };

        const counts: Record<string, number> = {};
        let cancelled = 0;
        let completed = 0;

        filteredBookings.forEach(b => {
            const s = b.status || "pending";
            counts[s] = (counts[s] || 0) + 1;
            if (s === "cancelled") cancelled++;
            if (s === "completed") completed++;
        });

        const breakdown = Object.entries(counts).map(([status, count]) => ({
            status,
            count,
            percentage: Math.round((count / total) * 100),
        }));

        return {
            total,
            breakdown,
            cancellationRate: Math.round((cancelled / total) * 100),
            completionRate: Math.round((completed / total) * 100),
        };
    }, [filteredBookings]);

    const participantsData = useMemo<ParticipantsData>(() => {
        const totalParticipants = filteredBookings.reduce((sum, b) => sum + (b.numberOfPeople || 1), 0);
        const totalBookings = filteredBookings.length;
        const confirmedBookings = filteredBookings.filter(b => b.status === "confirmed");
        const confirmedParticipants = confirmedBookings.reduce((sum, b) => sum + (b.numberOfPeople || 1), 0);

        const monthlyCounts: Record<string, number> = {};
        filteredBookings.forEach(b => {
            const date = new Date(b.visitDate);
            const key = date.toLocaleDateString("en-US", { month: "short" });
            monthlyCounts[key] = (monthlyCounts[key] || 0) + (b.numberOfPeople || 1);
        });

        const monthlyBreakdown = Object.entries(monthlyCounts).map(([month, participants]) => ({
            month,
            participants
        }));

        return {
            totalParticipants,
            confirmedParticipants,
            averageGroupSize: totalBookings > 0 ? Math.round(totalParticipants / totalBookings) : 0,
            totalBookings,
            monthlyBreakdown
        };
    }, [filteredBookings]);

    const guideUtilizationData = useMemo<GuideUtilizationData>(() => {
        if (!guides) return { guides: [], summary: { totalGuides: 0, activeGuides: 0, totalAssignedTours: 0, averageToursPerGuide: 0 } };

        const guideStats = new Map<string, { assigned: number, completed: number, cancelled: number }>();

        // Initialize
        guides.forEach(g => guideStats.set(g.id, { assigned: 0, completed: 0, cancelled: 0 }));

        // Count
        filteredBookings.forEach(b => {
            if (b.assignedGuideId && guideStats.has(b.assignedGuideId)) {
                const s = guideStats.get(b.assignedGuideId)!;
                s.assigned++;
                if (b.status === "completed") s.completed++;
                if (b.status === "cancelled") s.cancelled++;
            }
        });

        const guidesList = guides.map(g => {
            const s = guideStats.get(g.id)!;
            return {
                id: g.id,
                name: `${g.firstName} ${g.lastName}`,
                assignedTours: s.assigned,
                completedTours: s.completed,
                cancelledTours: s.cancelled,
                completionRate: s.assigned > 0 ? Math.round((s.completed / s.assigned) * 100) : 0,
                isActive: s.assigned > 0
            };
        }).filter(g => g.assignedTours > 0 || g.completedTours > 0); // Only show relevant guides

        const activeGuides = guidesList.filter(g => g.isActive).length;
        const totalAssigned = guidesList.reduce((sum, g) => sum + g.assignedTours, 0);

        return {
            guides: guidesList,
            summary: {
                totalGuides: guides.length,
                activeGuides,
                totalAssignedTours: totalAssigned,
                averageToursPerGuide: activeGuides > 0 ? Math.round(totalAssigned / activeGuides) : 0
            }
        };
    }, [filteredBookings, guides]);

    const poiFrequencyData = useMemo<POIFrequencyData>(() => {
        const zoneCounts: Record<string, number> = {};
        const poiCounts: Record<string, number> = {};
        let bookingsWithZones = 0;
        let bookingsWithPois = 0;

        filteredBookings.forEach(b => {
            if (b.selectedZones && b.selectedZones.length > 0) {
                bookingsWithZones++;
                b.selectedZones.forEach(zId => zoneCounts[zId] = (zoneCounts[zId] || 0) + 1);
            }
            if (b.selectedInterests && b.selectedInterests.length > 0) {
                bookingsWithPois++;
                b.selectedInterests.forEach(pId => poiCounts[pId] = (poiCounts[pId] || 0) + 1);
            }
        });

        const mapToData = (counts: Record<string, number>, lookup: any[]) => {
            return Object.entries(counts).map(([id, count]) => {
                const item = lookup?.find(i => i.id === id);
                return {
                    id,
                    name: item?.name || id,
                    count,
                    percentage: Math.round((count / filteredBookings.length) * 100)
                };
            }).sort((a, b) => b.count - a.count);
        };

        return {
            zones: mapToData(zoneCounts, zones || []),
            pointsOfInterest: mapToData(poiCounts, pointsOfInterest || []),
            bookingsWithZones,
            bookingsWithPois,
            totalBookings: filteredBookings.length
        };
    }, [filteredBookings, zones, pointsOfInterest]);

    const seasonalData = useMemo<MonthlyTrendData[]>(() => {
        const monthsMap = new Map<string, { bookings: number; revenue: number }>();

        filteredBookings.forEach(b => {
            const date = new Date(b.visitDate);
            const monthKey = date.toLocaleDateString("en-US", { month: "short" });

            const current = monthsMap.get(monthKey) || { bookings: 0, revenue: 0 };
            monthsMap.set(monthKey, {
                bookings: current.bookings + 1,
                revenue: current.revenue + (b.totalAmount || 0)
            });
        });

        const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        return Array.from(monthsMap.entries()).map(([month, data]) => ({
            month,
            bookings: data.bookings,
            revenue: data.revenue
        })).sort((a, b) => monthsOrder.indexOf(a.month) - monthsOrder.indexOf(b.month));
    }, [filteredBookings]);

    const heatmapData = useMemo<HeatmapData[]>(() => {
        const counts = new Map<string, number>();
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        filteredBookings.forEach(b => {
            const date = new Date(b.visitDate);
            const day = days[date.getDay()];

            let hour = 9; // default fallback
            if (b.visitTime) {
                // Try parsing "14:00" or "14:00:00"
                const part = parseInt(b.visitTime.toString().split(':')[0]);
                if (!isNaN(part)) hour = part;
            }

            const key = `${day}-${hour}`;
            counts.set(key, (counts.get(key) || 0) + 1);
        });

        const result: HeatmapData[] = [];
        Array.from(counts.entries()).forEach(([key, value]) => {
            const [day, hourStr] = key.split('-');
            result.push({
                day,
                hour: parseInt(hourStr),
                value
            });
        });

        return result;
    }, [filteredBookings]);

    const revenueByTourData = useMemo<RevenueByTourData[]>(() => {
        const counts: Record<string, number> = {};
        const revenue: Record<string, number> = {};

        filteredBookings.forEach(b => {
            const t = b.tourType || 'unknown';
            counts[t] = (counts[t] || 0) + 1;
            revenue[t] = (revenue[t] || 0) + (b.totalAmount || 0);
        });

        return Object.keys(counts).map(t => ({
            tourType: t,
            revenue: revenue[t],
            count: counts[t]
        })).sort((a, b) => b.revenue - a.revenue);
    }, [filteredBookings]);

    const { data: emailStats } = useQuery<EmailStatsData[]>({
        queryKey: [`/api/reports/email-stats?startDate=${dateFrom}&endDate=${dateTo}`],
    });

    // Export to CSV
    const exportToCSV = () => {
        const headers = [
            "Booking Ref",
            "Visitor Name",
            "Email",
            "Phone",
            "Visit Date",
            "Visit Time",
            "Tour Type",
            "Participants",
            "Status",
            "Payment Status",
            "Total Amount",
            "Guide",
        ];

        const rows = filteredBookings.map(b => [
            b.bookingReference || b.id.slice(0, 8),
            b.visitorName,
            b.visitorEmail,
            b.visitorPhone || "",
            b.visitDate,
            b.visitTime,
            b.tourType,
            b.numberOfPeople || 1,
            b.status || "pending",
            b.paymentStatus || "pending",
            b.totalAmount || 0,
            b.guide ? `${b.guide.firstName} ${b.guide.lastName}` : "",
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bookings-report-${dateFrom}-to-${dateTo}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getGuideName = (guideId: string | null) => {
        if (!guideId || !guides) return "Unassigned";
        const guide = guides.find(g => g.id === guideId);
        return guide ? `${guide.firstName} ${guide.lastName}` : "Unknown";
    };

    const recommendedActions = useMemo(() => {
        const actions: Array<{
            title: string;
            detail: string;
            status: "Act now" | "Monitor" | "Good";
            icon: typeof AlertTriangle;
        }> = [];
        const unassignedCount = filteredBookings.filter(
            b => b.status !== "cancelled" && b.status !== "completed" && !b.assignedGuideId
        ).length;
        const pendingPaymentCount = filteredBookings.filter(
            b => b.status !== "cancelled" && b.paymentStatus !== "paid"
        ).length;

        if (statusBreakdownData.cancellationRate >= 10) {
            actions.push({
                title: "Review cancellation reasons",
                detail: `${statusBreakdownData.cancellationRate}% of filtered bookings are cancelled. Capture a reason before cancelling and offer reschedule alternatives where possible.`,
                status: "Act now",
                icon: AlertTriangle,
            });
        }

        if (unassignedCount > 0) {
            actions.push({
                title: "Assign guides earlier",
                detail: `${unassignedCount} active booking${unassignedCount === 1 ? "" : "s"} still need a guide. Earlier assignment improves visitor confidence and guide readiness.`,
                status: "Act now",
                icon: UserPlus,
            });
        }

        if (pendingPaymentCount > 0) {
            actions.push({
                title: "Follow up on unpaid bookings",
                detail: `${pendingPaymentCount} active booking${pendingPaymentCount === 1 ? "" : "s"} still show pending or partial payment.`,
                status: "Monitor",
                icon: DollarSign,
            });
        }

        if (participantsData.averageGroupSize <= 2 && summaryStats.totalBookings >= 3) {
            actions.push({
                title: "Promote group visits",
                detail: `Average group size is ${participantsData.averageGroupSize}. Consider school, university, NGO, and organization packages.`,
                status: "Monitor",
                icon: Users,
            });
        }

        if (actions.length === 0) {
            actions.push({
                title: "Performance looks steady",
                detail: "No urgent action was detected for the current filters. Keep monitoring cancellations, guide assignments, payment follow-up, and visitor feedback.",
                status: "Good",
                icon: Lightbulb,
            });
        }

        return actions.slice(0, 4);
    }, [filteredBookings, participantsData.averageGroupSize, statusBreakdownData.cancellationRate, summaryStats.totalBookings]);
    const unassignedActiveCount = filteredBookings.filter((booking) =>
        !booking.assignedGuideId && ["pending", "confirmed"].includes(booking.status || "pending")
    ).length;
    const unpaidActiveCount = filteredBookings.filter((booking) =>
        booking.paymentStatus !== "paid" && booking.status !== "cancelled" && booking.status !== "completed"
    ).length;
    const reportSnapshot = [
        {
            label: "Cancellation rate",
            value: `${statusBreakdownData.cancellationRate}%`,
            detail: `${summaryStats.cancelledCount} cancelled in current filters`,
        },
        {
            label: "Unassigned active bookings",
            value: unassignedActiveCount,
            detail: "Pending or confirmed bookings without a guide",
        },
        {
            label: "Payment follow-up",
            value: unpaidActiveCount,
            detail: "Active bookings not yet marked paid",
        },
        {
            label: "Average group size",
            value: participantsData.averageGroupSize,
            detail: "Useful for guide allocation and pricing review",
        },
    ];

    return (
        <div className="space-y-6">
            <SEO title="Reports" description="Monitor your business with detailed reports and analytics." />

            <div className="flex flex-col gap-1 sm:gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Reports</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Monitor your business with detailed reports and data exports.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {reportSnapshot.map((item) => (
                    <div key={item.label} className="rounded-lg border p-4">
                        <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
                        <TabsTrigger value="bookings" className="gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="hidden sm:inline">Bookings</span>
                        </TabsTrigger>
                        <TabsTrigger value="payments" className="gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span className="hidden sm:inline">Payments</span>
                        </TabsTrigger>
                        <TabsTrigger value="visitors" className="gap-2">
                            <Users className="h-4 w-4" />
                            <span className="hidden sm:inline">Visitors</span>
                        </TabsTrigger>
                        <TabsTrigger value="schedule" className="gap-2">
                            <CalendarDays className="h-4 w-4" />
                            <span className="hidden sm:inline">Schedule</span>
                        </TabsTrigger>
                        <TabsTrigger value="communications" className="gap-2">
                            <Mail className="h-4 w-4" />
                            <span className="hidden sm:inline">Communications</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Filters */}
                <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="mt-4">
                    <Card>
                        <CollapsibleTrigger asChild>
                            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4" />
                                        <CardTitle className="text-base">Filters</CardTitle>
                                    </div>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
                                </div>
                            </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <CardContent className="pt-0">
                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label>From Date</Label>
                                        <Input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>To Date</Label>
                                        <Input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tour Type</Label>
                                        <Select value={tourType} onValueChange={setTourType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Any" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Any</SelectItem>
                                                {TOUR_TYPES.map(t => (
                                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Any" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Any</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                                <SelectItem value="no_show">No-show</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Payment Status</Label>
                                        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Any" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Any</SelectItem>
                                                <SelectItem value="paid">Fully Paid</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="partial">Partial</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Guide</Label>
                                        <Select value={guideId} onValueChange={setGuideId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Any" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Any</SelectItem>
                                                {guides?.map(g => (
                                                    <SelectItem key={g.id} value={g.id}>
                                                        {g.firstName} {g.lastName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Search</Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by name, email, or reference…"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>

                {/* Summary Stats */}
                <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mt-4">
                    <Card>
                        <CardContent className="p-3 sm:pt-4 sm:p-6">
                            <div className="text-xl sm:text-2xl font-bold">{summaryStats.totalBookings}</div>
                            <p className="text-xs text-muted-foreground">Total Bookings</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 sm:pt-4 sm:p-6">
                            <div className="text-xl sm:text-2xl font-bold">{summaryStats.totalParticipants}</div>
                            <p className="text-xs text-muted-foreground">Participants</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 sm:pt-4 sm:p-6">
                            <div className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(summaryStats.totalRevenue)}</div>
                            <p className="text-xs text-muted-foreground">Total Revenue</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 sm:pt-4 sm:p-6">
                            <div className="flex flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm">
                                <Badge variant="secondary">{summaryStats.confirmedCount} confirmed</Badge>
                                <Badge variant="destructive">{summaryStats.cancelledCount} cancelled</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Status Breakdown</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mt-4">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base sm:text-lg">Recommended Actions</CardTitle>
                        </div>
                        <CardDescription>
                            Performance prompts based on the current report filters.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2">
                            {recommendedActions.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <div key={action.title} className="rounded-lg border p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                                                <div className="min-w-0">
                                                    <h2 className="text-sm font-semibold">{action.title}</h2>
                                                    <p className="mt-1 text-sm text-muted-foreground">{action.detail}</p>
                                                </div>
                                            </div>
                                            <Badge
                                                variant={action.status === "Act now" ? "destructive" : action.status === "Good" ? "default" : "secondary"}
                                                className="w-fit shrink-0"
                                            >
                                                {action.status}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Bookings Tab */}
                <TabsContent value="bookings" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-base sm:text-lg">Bookings Report</CardTitle>
                                <CardDescription className="text-xs sm:text-sm">
                                    {filteredBookings.length} bookings from {dateFrom} to {dateTo}
                                </CardDescription>
                            </div>
                            <Button onClick={exportToCSV} variant="outline" size="sm" className="w-full sm:w-auto">
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {bookingsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : filteredBookings.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No bookings found for the selected filters.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-xs">Reference</TableHead>
                                                <TableHead className="text-xs">Visitor</TableHead>
                                                <TableHead className="text-xs hidden sm:table-cell">Date & Time</TableHead>
                                                <TableHead className="text-xs hidden md:table-cell">Tour</TableHead>
                                                <TableHead className="text-xs text-center hidden lg:table-cell">Guests</TableHead>
                                                <TableHead className="text-xs">Status</TableHead>
                                                <TableHead className="text-xs hidden lg:table-cell">Guide</TableHead>
                                                <TableHead className="text-xs text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredBookings.slice(0, 50).map((booking) => (
                                                <TableRow key={booking.id}>
                                                    <TableCell className="font-mono text-xs">
                                                        {booking.bookingReference || booking.id.slice(0, 8)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-sm truncate max-w-[100px] sm:max-w-none">{booking.visitorName}</div>
                                                        <div className="text-xs text-muted-foreground truncate max-w-[100px] sm:max-w-none">{booking.visitorEmail}</div>
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <div className="text-xs sm:text-sm">{formatDate(booking.visitDate)}</div>
                                                        <div className="text-xs text-muted-foreground">{formatTime(booking.visitTime)}</div>
                                                    </TableCell>
                                                    <TableCell className="capitalize text-xs hidden md:table-cell">{booking.tourType}</TableCell>
                                                    <TableCell className="text-center hidden lg:table-cell">{booking.numberOfPeople || 1}</TableCell>
                                                    <TableCell>
                                                        <StatusBadge status={booking.status || "pending"} />
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell text-xs">{getGuideName(booking.assignedGuideId)}</TableCell>
                                                    <TableCell className="text-right font-medium text-xs sm:text-sm">
                                                        {formatCurrency(booking.totalAmount || 0)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {filteredBookings.length > 50 && (
                                        <p className="text-center text-sm text-muted-foreground mt-4">
                                            Showing first 50 of {filteredBookings.length} bookings. Export to CSV for full data.
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Payments Tab */}
                <TabsContent value="payments" className="mt-4 space-y-4 sm:space-y-6">
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue Summary</CardTitle>
                                <CardDescription>Payment breakdown for selected period</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                        <span>Total Revenue</span>
                                        <span className="text-2xl font-bold text-green-600">{formatCurrency(summaryStats.totalRevenue)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Paid Bookings</span>
                                        <span className="font-medium">
                                            {filteredBookings.filter(b => b.paymentStatus === "paid").length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Pending Payments</span>
                                        <span className="font-medium">
                                            {filteredBookings.filter(b => b.paymentStatus !== "paid").length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Average Order Value</span>
                                        <span className="font-medium">
                                            {formatCurrency(summaryStats.totalBookings > 0 ? summaryStats.totalRevenue / summaryStats.totalBookings : 0)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <SeasonalTrendsChart customData={seasonalData} />
                        <RevenueByTourChart data={revenueByTourData} />
                    </div>
                </TabsContent>

                {/* Visitors Tab */}
                <TabsContent value="visitors" className="mt-4 space-y-4 sm:space-y-6">
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                        <ParticipantsChart customData={participantsData} />
                        <StatusBreakdownChart customData={statusBreakdownData} />
                        <POIFrequencyChart customData={poiFrequencyData} />
                    </div>
                </TabsContent>

                {/* Schedule Tab */}
                <TabsContent value="schedule" className="mt-4 space-y-4 sm:space-y-6">
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                        <GuideUtilizationChart customData={guideUtilizationData} />
                        <BookingTimeHeatmap customData={heatmapData} />
                    </div>
                </TabsContent>

                {/* Communications Tab */}
                <TabsContent value="communications" className="mt-4 space-y-6">
                    <EmailStatsChart data={emailStats || []} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
