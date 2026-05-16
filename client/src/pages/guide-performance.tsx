import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, DollarSign, Users, Star, CheckCircle, Clock, Loader2, GitCompare, Wallet, UserCheck, Eye, FileText, AlertTriangle, Receipt, Save, Pencil, XCircle, Globe2, CalendarDays, type LucideIcon } from "lucide-react";
import { formatCurrency, formatDate, formatTime } from "@/lib/constants";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Guide, Booking, GuideAvailability, GuidePayout, GuideTourReport } from "@shared/schema";
import { SEO } from "@/components/seo";
import { queryClient } from "@/lib/queryClient";

interface GuideEarnings {
    month: string;
    earnings: number;
    tours: number;
}

interface GuideWithStats extends Guide {
    totalEarnings: number;
    totalTours: number;
    completedTours: number;
    cancelledTours: number;
    completionRate: number;
    cancellationRate: number;
}

// Generate months for the chart
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const monthlyEarningsConfig = {
    earnings: {
        label: "Earnings",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig;

// Chart colors for comparison
const COMPARE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

interface GuideCompareData {
    guide: {
        id: string;
        firstName: string;
        lastName: string;
        profileImageUrl: string | null;
        languages: string[] | null;
        specialties: string[] | null;
        assignedZones: string[] | null;
    };
    stats: {
        totalTours: number;
        completedTours: number;
        totalEarnings: number;
        rating: number;
        totalRatings: number;
        avgVisitorRating: number | null;
        completionRate: number;
        cancellationRate: number;
    };
    monthlyTrends: { month: string; tours: number; earnings: number }[];
}

interface GuidePerformanceDetail {
    guide: Guide;
    stats: {
        totalTours: number;
        completedTours: number;
        cancelledTours: number;
        upcomingTours: number;
        completionRate: number;
        cancellationRate: number;
        totalRevenue: number;
        totalEarnings: number;
        payableEarnings: number;
        pendingPaymentEarnings: number;
        paidPayoutAmount: number;
        pendingPayoutAmount: number;
        outstandingAmount: number;
        averageVisitorRating: number | null;
        totalRatings: number;
        reportsSubmitted: number;
        reportsPendingReview: number;
        followUpsNeeded: number;
        bookingsWithCountry: number;
    };
    visitorCountries: { country: string; count: number; percentage: number }[];
    upcomingBookings: Booking[];
    recentBookings: Booking[];
    payouts: GuidePayout[];
    reports: Array<GuideTourReport & {
        booking?: {
            id: string;
            bookingReference: string | null;
            visitorName: string;
            visitDate: string;
            status: string | null;
        } | null;
    }>;
    availability: GuideAvailability[];
}

const getGuideEarnings = (booking: Pick<Booking, "guidePayment" | "totalAmount">) => {
    const guidePayment = Number(booking.guidePayment || 0);
    return guidePayment > 0 ? guidePayment : Number(booking.totalAmount || 0);
};

const yearOptions = Array.from({ length: 6 }, (_, index) => String(new Date().getFullYear() - index));

const formatStatusLabel = (status: string | null | undefined) =>
    String(status || "unknown").replace(/_/g, " ");

const formatList = (items: string[] | null | undefined, fallback = "Not set") =>
    items && items.length > 0 ? items.join(", ") : fallback;

export default function GuidePerformance() {
    const [activeTab, setActiveTab] = useState("earnings");
    const [selectedGuideId, setSelectedGuideId] = useState<string>("");
    const [selectedDetailGuideId, setSelectedDetailGuideId] = useState<string>("");
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedGuidesToCompare, setSelectedGuidesToCompare] = useState<string[]>([]);
    const [editingBookingId, setEditingBookingId] = useState("");
    const [guidePaymentDraft, setGuidePaymentDraft] = useState("");

    const { data: guides, isLoading: guidesLoading } = useQuery<Guide[]>({
        queryKey: ["/api/guides"],
    });

    const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
        queryKey: ["/api/bookings"],
    });

    const { data: guideDetail, isLoading: detailLoading } = useQuery<GuidePerformanceDetail>({
        queryKey: ["/api/guides", selectedDetailGuideId, "performance-detail"],
        queryFn: async () => {
            const res = await fetch(`/api/guides/${selectedDetailGuideId}/performance-detail`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch guide performance detail");
            return res.json();
        },
        enabled: Boolean(selectedDetailGuideId),
    });

    const isLoading = guidesLoading || bookingsLoading;

    // Calculate guide statistics
    const guideStats: GuideWithStats[] = (guides || []).map(guide => {
        const guideBookings = (bookings || []).filter(b => b.assignedGuideId === guide.id || (!!guide.userId && b.assignedGuideId === guide.userId));
        const countedTours = guideBookings.filter(b => b.status !== "cancelled");
        const completedTours = guideBookings.filter(b => b.status === "completed");
        const cancelledTours = guideBookings.filter(b => b.status === "cancelled" || b.status === "no_show");
        const totalEarnings = completedTours.reduce((sum, b) => sum + getGuideEarnings(b), 0);
        const completionRate = countedTours.length > 0
            ? Math.round((completedTours.length / countedTours.length) * 100)
            : 0;
        const cancellationRate = guideBookings.length > 0
            ? Math.round((cancelledTours.length / guideBookings.length) * 100)
            : 0;

        return {
            ...guide,
            totalEarnings,
            totalTours: countedTours.length,
            completedTours: completedTours.length,
            cancelledTours: cancelledTours.length,
            completionRate,
            cancellationRate,
        };
    }).sort((a, b) => b.totalEarnings - a.totalEarnings);

    // Payout State
    const [isPayoutOpen, setIsPayoutOpen] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState("");
    const [payoutToursCount, setPayoutToursCount] = useState("");
    const [payoutStatus, setPayoutStatus] = useState("pending");
    const [payoutMethod, setPayoutMethod] = useState("cash");
    const [payoutReference, setPayoutReference] = useState("");
    const [payoutNotes, setPayoutNotes] = useState("");
    const { toast } = useToast();

    const { mutate: recordPayout, isPending: isPayoutPending } = useMutation({
        mutationFn: async () => {
            if (!selectedDetailGuideId) throw new Error("Select a guide first");
            return apiRequest("POST", "/api/payouts", {
                guideId: selectedDetailGuideId,
                amount: Number(payoutAmount),
                toursCount: Number(payoutToursCount || 0),
                status: payoutStatus,
                paymentMethod: payoutMethod,
                paymentReference: payoutReference.trim() || null,
                notes: payoutNotes.trim() || null,
                paidAt: payoutStatus === "paid" ? new Date().toISOString() : null,
            });
        },
        onSuccess: () => {
            setIsPayoutOpen(false);
            setPayoutAmount("");
            setPayoutToursCount("");
            setPayoutReference("");
            setPayoutNotes("");
            queryClient.invalidateQueries({ queryKey: ["/api/payouts"] });
            queryClient.invalidateQueries({ queryKey: ["/api/payouts/summary"] });
            queryClient.invalidateQueries({ queryKey: ["/api/guides", selectedDetailGuideId, "performance-detail"] });
            toast({
                title: "Payout recorded",
                description: "The guide payout record has been saved.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Failed to record payout",
                description: error.message || "Please check the amount and try again.",
                variant: "destructive",
            });
        }
    });

    const updateGuidePaymentMutation = useMutation({
        mutationFn: async ({ bookingId, guidePayment }: { bookingId: string; guidePayment: number }) => {
            const res = await apiRequest("PATCH", `/api/bookings/${bookingId}/guide-payment`, { guidePayment });
            return res.json();
        },
        onSuccess: () => {
            setEditingBookingId("");
            setGuidePaymentDraft("");
            queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
            queryClient.invalidateQueries({ queryKey: ["/api/guides", selectedDetailGuideId, "performance-detail"] });
            toast({ title: "Guide earnings updated" });
        },
        onError: (error: any) => {
            toast({
                title: "Could not update guide earnings",
                description: error.message || "Please try again.",
                variant: "destructive",
            });
        },
    });

    const handlePayoutOpen = (guideId?: string) => {
        const nextGuideId = guideId || selectedDetailGuideId || selectedGuideId;
        if (nextGuideId) {
            setSelectedDetailGuideId(nextGuideId);
            const detailMatches = guideDetail?.guide.id === nextGuideId;
            const fallbackGuide = guideStats.find(g => g.id === nextGuideId);
            const suggestedAmount = detailMatches
                ? guideDetail?.stats.outstandingAmount || guideDetail?.stats.totalEarnings || 0
                : fallbackGuide?.totalEarnings || 0;

            setPayoutAmount(suggestedAmount > 0 ? String(suggestedAmount) : "");
            setPayoutToursCount(detailMatches ? String(guideDetail?.stats.completedTours || 0) : String(fallbackGuide?.completedTours || 0));
            setPayoutStatus("pending");
            setPayoutMethod("cash");
            setPayoutReference("");
            setPayoutNotes("");
            setIsPayoutOpen(true);
        }
    };

    // Calculate monthly earnings for selected guide
    const getMonthlyEarnings = (guideId: string): GuideEarnings[] => {
        const guide = guideStats.find(g => g.id === guideId);
        const guideBookings = (bookings || []).filter(
            b => (b.assignedGuideId === guideId || (!!guide?.userId && b.assignedGuideId === guide.userId)) && b.status === "completed"
        );

        return MONTHS.map((month, index) => {
            const monthBookings = guideBookings.filter(b => {
                if (!b.visitDate) return false;
                const date = new Date(b.visitDate);
                return date.getMonth() === index && date.getFullYear() === selectedYear;
            });

            return {
                month,
                earnings: monthBookings.reduce((sum, b) => sum + getGuideEarnings(b), 0),
                tours: monthBookings.length,
            };
        });
    };

    // Generate availability calendar data
    const getAvailabilityData = () => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
        const days = [];

        // Get bookings for the month
        const monthBookings = (bookings || []).filter(b => {
            if (!b.visitDate) return false;
            const date = new Date(b.visitDate);
            return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
        });

        // Count bookings per guide per day
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayBookings = monthBookings.filter(b => b.visitDate === dateStr);

            days.push({
                day: i,
                bookings: dayBookings.length,
                guides: Array.from(new Set(dayBookings.map(b => b.assignedGuideId).filter(Boolean))),
            });
        }

        return { days, firstDayOfMonth, daysInMonth };
    };

    const selectedGuide = guideStats.find(g => g.id === selectedGuideId);
    const monthlyData = selectedGuideId ? getMonthlyEarnings(selectedGuideId) : [];
    const calendarData = getAvailabilityData();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SEO
                title="Guide Performance"
                description="Track guide earnings, tour completion rates, and availability at Visit Dzaleka."
            />
            <div className="flex flex-col gap-2 max-w-full">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight break-words">Guide Performance</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                    Track guide earnings, tour completion rates, and availability.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <TabsList className="w-max sm:w-auto">
                        <TabsTrigger value="earnings">
                            <DollarSign className="mr-2 h-4 w-4" />
                            Earnings
                        </TabsTrigger>
                        <TabsTrigger value="detail">
                            <UserCheck className="mr-2 h-4 w-4" />
                            Guide Detail
                        </TabsTrigger>
                        <TabsTrigger value="compare">
                            <GitCompare className="mr-2 h-4 w-4" />
                            Compare Guides
                        </TabsTrigger>
                        <TabsTrigger value="calendar">
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule Calendar
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Earnings Tab */}
                <TabsContent value="earnings" className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Guides</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{guideStats.filter(g => g.isActive).length}</div>
                                <p className="text-xs text-muted-foreground">Active guides</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Guide Earnings</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(guideStats.reduce((sum, g) => sum + g.totalEarnings, 0))}
                                </div>
                                <p className="text-xs text-muted-foreground">Completed tour guide pay</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Completed Tours</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {guideStats.reduce((sum, g) => sum + g.completedTours, 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">Across active guides</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                                <Star className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {(guideStats.filter(g => g.rating).reduce((sum, g) => sum + (g.rating || 0), 0) /
                                        Math.max(1, guideStats.filter(g => g.rating).length)).toFixed(1)}
                                </div>
                                <p className="text-xs text-muted-foreground">Average guide rating</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Guide Leaderboard */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Guide Leaderboard</CardTitle>
                            <CardDescription>Top performing guides by earnings</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {guideStats.filter(g => g.isActive).slice(0, 5).map((guide, index) => (
                                    <div key={guide.id} className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <Avatar className="h-10 w-10">
                                            {guide.profileImageUrl && (
                                                <AvatarImage src={guide.profileImageUrl} alt={`${guide.firstName} ${guide.lastName}`} />
                                            )}
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {guide.firstName[0]}{guide.lastName[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <div className="break-words font-medium">{guide.firstName} {guide.lastName}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {guide.completedTours}/{guide.totalTours} completed · {guide.completionRate}% completion
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <div className="font-bold text-green-600">{formatCurrency(guide.totalEarnings)}</div>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                {(guide.rating || 0).toFixed(1)}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="shrink-0 gap-2"
                                            onClick={() => {
                                                setSelectedDetailGuideId(guide.id);
                                                setSelectedGuideId(guide.id);
                                                setActiveTab("detail");
                                            }}
                                        >
                                            <Eye className="h-4 w-4" aria-hidden="true" />
                                            Details
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Monthly Earnings Chart */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Monthly Earnings</CardTitle>
                                    <CardDescription>Select a guide to view their earnings trend</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Select
                                        value={selectedGuideId}
                                        onValueChange={(value) => {
                                            setSelectedGuideId(value);
                                            setSelectedDetailGuideId(value);
                                        }}
                                    >
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Select guide" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {guideStats.filter(g => g.isActive).map(guide => (
                                                <SelectItem key={guide.id} value={guide.id}>
                                                    {guide.firstName} {guide.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                                        <SelectTrigger className="w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {yearOptions.map(year => (
                                                <SelectItem key={year} value={year}>{year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {selectedGuideId ? (
                                <div className="h-80 w-full min-w-0">
                                    <ChartContainer config={monthlyEarningsConfig} className="h-full w-full aspect-auto">
                                        <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis
                                                dataKey="month"
                                                tick={{ fontSize: 12 }}
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={8}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 12 }}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
                                            />
                                            <ChartTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                                            />
                                            <Bar dataKey="earnings" fill="var(--color-earnings)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ChartContainer>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-80 text-muted-foreground">
                                    Select a guide to view their monthly earnings chart
                                </div>
                            )}
                            {selectedGuide && (
                                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold text-green-600">
                                            {formatCurrency(selectedGuide.totalEarnings)}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Total Earnings</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{selectedGuide.totalTours}</div>
                                        <div className="text-sm text-muted-foreground">Total Tours</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{selectedGuide.completionRate}%</div>
                                        <div className="text-sm text-muted-foreground">Completion Rate</div>
                                    </div>
                                    <div className="col-span-1 sm:col-span-3 flex flex-wrap justify-center gap-2 mt-4 pt-4 border-t">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-2"
                                            onClick={() => {
                                                setSelectedDetailGuideId(selectedGuide.id);
                                                setActiveTab("detail");
                                            }}
                                        >
                                            <UserCheck className="h-4 w-4" />
                                            Open Detail
                                        </Button>
                                        <Button size="sm" className="gap-2" onClick={() => handlePayoutOpen(selectedGuide.id)}>
                                            <Wallet className="h-4 w-4" />
                                            Record Payout
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Guide Detail Tab */}
                <TabsContent value="detail" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <CardTitle>Guide Admin Detail</CardTitle>
                                    <CardDescription>Profile, earnings, payouts, reports, availability, and recent tour history.</CardDescription>
                                </div>
                                <Select
                                    value={selectedDetailGuideId}
                                    onValueChange={(value) => {
                                        setSelectedDetailGuideId(value);
                                        setSelectedGuideId(value);
                                    }}
                                >
                                    <SelectTrigger className="w-full lg:w-64">
                                        <SelectValue placeholder="Select guide" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {guideStats.filter(g => g.isActive).map(guide => (
                                            <SelectItem key={guide.id} value={guide.id}>
                                                {guide.firstName} {guide.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                    </Card>

                    {selectedDetailGuideId ? (
                        <GuideDetailPanel
                            detail={guideDetail}
                            isLoading={detailLoading}
                            editingBookingId={editingBookingId}
                            guidePaymentDraft={guidePaymentDraft}
                            isSavingGuidePayment={updateGuidePaymentMutation.isPending}
                            onOpenPayout={() => handlePayoutOpen(selectedDetailGuideId)}
                            onStartEditPayment={(booking) => {
                                setEditingBookingId(booking.id);
                                setGuidePaymentDraft(String(getGuideEarnings(booking)));
                            }}
                            onCancelEditPayment={() => {
                                setEditingBookingId("");
                                setGuidePaymentDraft("");
                            }}
                            onGuidePaymentDraftChange={setGuidePaymentDraft}
                            onSaveGuidePayment={(bookingId) => {
                                updateGuidePaymentMutation.mutate({
                                    bookingId,
                                    guidePayment: Number(guidePaymentDraft || 0),
                                });
                            }}
                        />
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
                                <UserCheck className="h-12 w-12 opacity-50" aria-hidden="true" />
                                <p>Select a guide to view their full admin record.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Compare Guides Tab */}
                <TabsContent value="compare" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Compare Guides</CardTitle>
                            <CardDescription>
                                Select 2-4 guides to compare their performance side-by-side
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4 mb-6">
                                {guideStats.filter(g => g.isActive).map(guide => (
                                    <div
                                        key={guide.id}
                                        role="checkbox"
                                        aria-checked={selectedGuidesToCompare.includes(guide.id)}
                                        tabIndex={0}
                                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${selectedGuidesToCompare.includes(guide.id)
                                            ? "border-primary bg-primary/5"
                                            : "border-muted hover:border-primary/50"
                                            }`}
                                        onClick={() => {
                                            if (selectedGuidesToCompare.includes(guide.id)) {
                                                setSelectedGuidesToCompare(prev => prev.filter(id => id !== guide.id));
                                            } else if (selectedGuidesToCompare.length < 4) {
                                                setSelectedGuidesToCompare(prev => [...prev, guide.id]);
                                            }
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key !== "Enter" && event.key !== " ") return;
                                            event.preventDefault();
                                            if (selectedGuidesToCompare.includes(guide.id)) {
                                                setSelectedGuidesToCompare(prev => prev.filter(id => id !== guide.id));
                                            } else if (selectedGuidesToCompare.length < 4) {
                                                setSelectedGuidesToCompare(prev => [...prev, guide.id]);
                                            }
                                        }}
                                    >
                                        <Checkbox
                                            checked={selectedGuidesToCompare.includes(guide.id)}
                                            disabled={!selectedGuidesToCompare.includes(guide.id) && selectedGuidesToCompare.length >= 4}
                                        />
                                        <Avatar className="h-8 w-8">
                                            {guide.profileImageUrl && (
                                                <AvatarImage src={guide.profileImageUrl} alt={`${guide.firstName} ${guide.lastName}`} />
                                            )}
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                {guide.firstName[0]}{guide.lastName[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">{guide.firstName} {guide.lastName}</span>
                                    </div>
                                ))}
                            </div>

                            {selectedGuidesToCompare.length >= 2 ? (
                                <CompareGuidesContent guideIds={selectedGuidesToCompare} />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <GitCompare className="h-12 w-12 mb-4 opacity-50" />
                                    <p>Select at least 2 guides to compare</p>
                                    <p className="text-sm">{selectedGuidesToCompare.length} of 2-4 selected</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Calendar Tab */}
                <TabsContent value="calendar" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <CardTitle>Guide Schedule Calendar</CardTitle>
                                    <CardDescription>View scheduled tours by day.</CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MONTHS.map((month, index) => (
                                                <SelectItem key={month} value={String(index)}>{month}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                                        <SelectTrigger className="w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {yearOptions.map(year => (
                                                <SelectItem key={year} value={year}>{year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {/* Empty cells for days before the first of the month */}
                                {Array.from({ length: calendarData.firstDayOfMonth }).map((_, i) => (
                                    <div key={`empty-${i}`} className="h-20 bg-muted/30 rounded-lg" />
                                ))}
                                {/* Calendar days */}
                                {calendarData.days.map(day => {
                                    const isToday =
                                        day.day === new Date().getDate() &&
                                        selectedMonth === new Date().getMonth() &&
                                        selectedYear === new Date().getFullYear();

                                    return (
                                        <div
                                            key={day.day}
                                            className={`h-20 p-2 rounded-lg border ${isToday ? "border-primary bg-primary/5" : "border-transparent bg-muted/30"
                                                } ${day.bookings > 0 ? "bg-green-50 dark:bg-green-950/20" : ""}`}
                                        >
                                            <div className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>
                                                {day.day}
                                            </div>
                                            {day.bookings > 0 && (
                                                <div className="mt-1">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {day.bookings} tour{day.bookings > 1 ? "s" : ""}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="mt-4 flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-muted/30 border" />
                                    <span className="text-muted-foreground">No scheduled tours</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-green-50 dark:bg-green-950/20 border border-green-200" />
                                    <span className="text-muted-foreground">Has bookings</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-primary/5 border border-primary" />
                                    <span className="text-muted-foreground">Today</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Guide Availability Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Guide Schedule Summary</CardTitle>
                            <CardDescription>Tours scheduled for {MONTHS[selectedMonth]} {selectedYear}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {guideStats.filter(g => g.isActive).map(guide => {
                                    const monthTours = (bookings || []).filter(b => {
                                        if (!b.visitDate || (b.assignedGuideId !== guide.id && (!guide.userId || b.assignedGuideId !== guide.userId))) return false;
                                        const date = new Date(b.visitDate);
                                        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
                                    });

                                    return (
                                        <div key={guide.id} className="flex flex-wrap items-center gap-4">
                                            <Avatar className="h-10 w-10">
                                                {guide.profileImageUrl && (
                                                    <AvatarImage src={guide.profileImageUrl} alt={`${guide.firstName} ${guide.lastName}`} />
                                                )}
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {guide.firstName[0]}{guide.lastName[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <div className="break-words font-medium">{guide.firstName} {guide.lastName}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {monthTours.length} tour{monthTours.length !== 1 ? "s" : ""} scheduled
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                {monthTours.length === 0 ? (
                                                    <Badge variant="outline" className="text-green-600 border-green-200">
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        No tours
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        {monthTours.filter(t => t.status === "confirmed").length} confirmed
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isPayoutOpen} onOpenChange={setIsPayoutOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Record Guide Payout</DialogTitle>
                        <DialogDescription>
                            Save a payout record after confirming the amount with the guide.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="guide-payout-amount">Amount</Label>
                            <Input
                                id="guide-payout-amount"
                                name="amount"
                                type="number"
                                min="0"
                                inputMode="numeric"
                                value={payoutAmount}
                                onChange={(event) => setPayoutAmount(event.target.value)}
                                placeholder="Amount in MWK…"
                            />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="guide-payout-tours">Tours covered</Label>
                                <Input
                                    id="guide-payout-tours"
                                    name="toursCount"
                                    type="number"
                                    min="0"
                                    inputMode="numeric"
                                    value={payoutToursCount}
                                    onChange={(event) => setPayoutToursCount(event.target.value)}
                                    placeholder="0…"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select value={payoutStatus} onValueChange={setPayoutStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Payment method</Label>
                                <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="airtel_money">Airtel Money</SelectItem>
                                        <SelectItem value="tnm_mpamba">TNM Mpamba</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="guide-payout-reference">Reference</Label>
                                <Input
                                    id="guide-payout-reference"
                                    name="paymentReference"
                                    value={payoutReference}
                                    onChange={(event) => setPayoutReference(event.target.value)}
                                    placeholder="Receipt or transaction ID…"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="guide-payout-notes">Notes</Label>
                            <Textarea
                                id="guide-payout-notes"
                                name="notes"
                                value={payoutNotes}
                                onChange={(event) => setPayoutNotes(event.target.value)}
                                placeholder="Internal payout notes…"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setIsPayoutOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => recordPayout()}
                            disabled={isPayoutPending || !Number(payoutAmount)}
                        >
                            {isPayoutPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                            Record payout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

interface GuideDetailPanelProps {
    detail?: GuidePerformanceDetail;
    isLoading: boolean;
    editingBookingId: string;
    guidePaymentDraft: string;
    isSavingGuidePayment: boolean;
    onOpenPayout: () => void;
    onStartEditPayment: (booking: Booking) => void;
    onCancelEditPayment: () => void;
    onGuidePaymentDraftChange: (value: string) => void;
    onSaveGuidePayment: (bookingId: string) => void;
}

function GuideDetailPanel({
    detail,
    isLoading,
    editingBookingId,
    guidePaymentDraft,
    isSavingGuidePayment,
    onOpenPayout,
    onStartEditPayment,
    onCancelEditPayment,
    onGuidePaymentDraftChange,
    onSaveGuidePayment,
}: GuideDetailPanelProps) {
    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!detail) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                    Guide details are not available.
                </CardContent>
            </Card>
        );
    }

    const { guide, stats } = detail;
    const guideName = `${guide.firstName} ${guide.lastName}`;
    const workingHours = (guide.workingHours || {}) as { start?: string; end?: string };
    const weeklyAvailability = (guide.availability || {}) as Record<string, boolean>;
    const selfManagedDays = Object.entries(weeklyAvailability)
        .filter(([, isAvailable]) => Boolean(isAvailable))
        .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1));
    const recentReports = detail.reports.slice(0, 5);
    const recentPayouts = detail.payouts.slice(0, 5);
    const recentBookings = detail.recentBookings.slice(0, 8);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                            <Avatar className="h-16 w-16">
                                {guide.profileImageUrl && (
                                    <AvatarImage src={guide.profileImageUrl} alt={guideName} />
                                )}
                                <AvatarFallback className="bg-primary/10 text-lg text-primary">
                                    {guide.firstName[0]}{guide.lastName[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <CardTitle className="break-words text-xl">{guideName}</CardTitle>
                                    <Badge variant={guide.isActive ? "default" : "secondary"}>
                                        {guide.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <p className="break-words text-sm text-muted-foreground">{guide.email || "No email"} · {guide.phone || "No phone"}</p>
                            </div>
                        </div>
                        <Button className="w-full gap-2 sm:w-auto" onClick={onOpenPayout}>
                            <Receipt className="h-4 w-4" aria-hidden="true" />
                            Record Payout
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MiniMetric label="Completed" value={`${stats.completedTours}/${stats.totalTours}`} icon={CheckCircle} />
                        <MiniMetric label="Guide earnings" value={formatCurrency(stats.totalEarnings)} icon={DollarSign} />
                        <MiniMetric label="Outstanding" value={formatCurrency(stats.outstandingAmount)} icon={Wallet} />
                        <MiniMetric label="Avg rating" value={stats.averageVisitorRating ? `${stats.averageVisitorRating.toFixed(1)} ★` : "No ratings"} icon={Star} />
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <DollarSign className="h-5 w-5 text-primary" aria-hidden="true" />
                            Earnings & Payouts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <StatRow label="Tour revenue" value={formatCurrency(stats.totalRevenue)} />
                            <StatRow label="Guide earnings" value={formatCurrency(stats.totalEarnings)} />
                            <StatRow label="Paid payouts" value={formatCurrency(stats.paidPayoutAmount)} />
                            <StatRow label="Pending payouts" value={formatCurrency(stats.pendingPayoutAmount)} />
                            <StatRow label="Paid bookings earnings" value={formatCurrency(stats.payableEarnings)} />
                            <StatRow label="Unpaid booking earnings" value={formatCurrency(stats.pendingPaymentEarnings)} />
                        </div>
                        <div className="rounded-md border">
                            {recentPayouts.length === 0 ? (
                                <p className="p-4 text-sm text-muted-foreground">No payout records yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentPayouts.map((payout) => (
                                                <TableRow key={payout.id}>
                                                    <TableCell>{payout.createdAt ? formatDate(payout.createdAt) : "No date"}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={payout.status === "paid" ? "default" : "secondary"}>
                                                            {formatStatusLabel(payout.status)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium tabular-nums">
                                                        {formatCurrency(payout.amount || 0)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
                            Profile & Availability
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3">
                            <StatRow label="Languages" value={formatList(guide.languages)} />
                            <StatRow label="Specialties" value={formatList(guide.specialties)} />
                            <StatRow label="Assigned zones" value={formatList(guide.assignedZones)} />
                            <StatRow label="Available days" value={formatList(selfManagedDays.length ? selfManagedDays : guide.availableDays)} />
                            <StatRow label="Preferred times" value={formatList(guide.preferredTimes)} />
                            <StatRow
                                label="Working hours"
                                value={workingHours.start && workingHours.end ? `${workingHours.start} - ${workingHours.end}` : "Not set"}
                            />
                        </div>
                        <div className="rounded-md border p-3">
                            <p className="text-sm font-medium">Structured availability</p>
                            {detail.availability.length === 0 ? (
                                <p className="mt-1 text-sm text-muted-foreground">No date-specific availability records.</p>
                            ) : (
                                <div className="mt-2 space-y-2">
                                    {detail.availability.slice(0, 4).map((item) => (
                                        <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                            <span className="text-muted-foreground">
                                                {item.date ? formatDate(item.date) : `Day ${item.dayOfWeek ?? "-"}`}
                                            </span>
                                            <span className="font-medium">
                                                {item.startTime} - {item.endTime}
                                            </span>
                                            <Badge variant={item.isAvailable ? "outline" : "secondary"}>
                                                {item.isAvailable ? "Available" : "Unavailable"}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Globe2 className="h-5 w-5 text-primary" aria-hidden="true" />
                            Visitor Countries
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {detail.visitorCountries.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No country data recorded for this guide yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {detail.visitorCountries.slice(0, 8).map((country) => (
                                    <div key={country.country} className="flex items-center justify-between gap-4 text-sm">
                                        <span className="min-w-0 break-words font-medium">{country.country}</span>
                                        <span className="shrink-0 text-muted-foreground">
                                            {country.count} · {country.percentage}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                            Post-Tour Reports
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <MiniMetric label="Submitted" value={stats.reportsSubmitted} icon={FileText} />
                            <MiniMetric label="Pending review" value={stats.reportsPendingReview} icon={Clock} />
                            <MiniMetric label="Follow-up" value={stats.followUpsNeeded} icon={AlertTriangle} />
                        </div>
                        {recentReports.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No guide reports submitted yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {recentReports.map((report) => (
                                    <div key={report.id} className="rounded-md border p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="min-w-0 break-words text-sm font-medium">
                                                {report.booking?.bookingReference || "Booking"} · {report.booking?.visitorName || "Visitor"}
                                            </p>
                                            <Badge variant={report.followUpNeeded ? "destructive" : "secondary"}>
                                                {report.followUpNeeded ? "Follow-up" : formatStatusLabel(report.status)}
                                            </Badge>
                                        </div>
                                        <p className="mt-2 line-clamp-3 break-words text-sm text-muted-foreground">{report.summary}</p>
                                        {report.incidents && (
                                            <p className="mt-2 break-words rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                                                Incident note: {report.incidents}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Tours</CardTitle>
                    <CardDescription>Admin can review tour outcomes and adjust guide earnings when needed.</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentBookings.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tours assigned to this guide yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Visit</TableHead>
                                        <TableHead>Booking</TableHead>
                                        <TableHead>Visitor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead className="text-right">Guide Earnings</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentBookings.map((booking) => (
                                        <TableRow key={booking.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {booking.visitDate ? formatDate(booking.visitDate) : "No date"}
                                                {booking.visitTime && (
                                                    <div className="text-xs text-muted-foreground">{formatTime(booking.visitTime)}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{booking.bookingReference}</TableCell>
                                            <TableCell>
                                                <div className="min-w-44">
                                                    <p className="break-words font-medium">{booking.visitorName}</p>
                                                    <p className="break-words text-xs text-muted-foreground">{booking.visitorCountry || "Country not set"}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{formatStatusLabel(booking.status)}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={booking.paymentStatus === "paid" ? "default" : "outline"}>
                                                    {formatStatusLabel(booking.paymentStatus)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {editingBookingId === booking.id ? (
                                                    <div className="flex min-w-56 justify-end gap-2">
                                                        <Label htmlFor={`guide-payment-${booking.id}`} className="sr-only">
                                                            Guide earnings
                                                        </Label>
                                                        <Input
                                                            id={`guide-payment-${booking.id}`}
                                                            type="number"
                                                            min="0"
                                                            inputMode="numeric"
                                                            value={guidePaymentDraft}
                                                            onChange={(event) => onGuidePaymentDraftChange(event.target.value)}
                                                            className="h-9 w-28 text-right"
                                                            placeholder="0…"
                                                        />
                                                        <Button
                                                            size="icon"
                                                            type="button"
                                                            aria-label="Save guide earnings"
                                                            disabled={isSavingGuidePayment}
                                                            onClick={() => onSaveGuidePayment(booking.id)}
                                                        >
                                                            {isSavingGuidePayment ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                                            ) : (
                                                                <Save className="h-4 w-4" aria-hidden="true" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            type="button"
                                                            variant="outline"
                                                            aria-label="Cancel guide earnings edit"
                                                            onClick={onCancelEditPayment}
                                                        >
                                                            <XCircle className="h-4 w-4" aria-hidden="true" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="font-medium tabular-nums">{formatCurrency(getGuideEarnings(booking))}</span>
                                                        <Button
                                                            size="icon"
                                                            type="button"
                                                            variant="ghost"
                                                            aria-label={`Edit guide earnings for ${booking.bookingReference}`}
                                                            onClick={() => onStartEditPayment(booking)}
                                                        >
                                                            <Pencil className="h-4 w-4" aria-hidden="true" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function MiniMetric({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
    return (
        <div className="rounded-md border p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="break-words">{label}</span>
            </div>
            <div className="mt-2 break-words text-lg font-semibold tabular-nums">{value}</div>
        </div>
    );
}

// Separate component for guide comparison content
function CompareGuidesContent({ guideIds }: { guideIds: string[] }) {
    const { data: compareData, isLoading } = useQuery<GuideCompareData[]>({
        queryKey: ["/api/guides/compare", ...guideIds],
        queryFn: async () => {
            const params = new URLSearchParams();
            guideIds.forEach(id => params.append("guideIds", id));
            const res = await fetch(`/api/guides/compare?${params.toString()}`, {
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to fetch comparison data");
            return res.json();
        },
        enabled: guideIds.length >= 2,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!compareData || compareData.length === 0) {
        return <div className="text-muted-foreground text-center py-12">No data available</div>;
    }

    // Prepare radar chart data
    const radarData = [
        {
            metric: "Tours",
            ...Object.fromEntries(compareData.map((d, i) => [`guide${i}`, d.stats.completedTours])),
        },
        {
            metric: "Rating",
            ...Object.fromEntries(compareData.map((d, i) => [`guide${i}`, (d.stats.rating || 0) * 20])), // Scale to 100
        },
        {
            metric: "Completion",
            ...Object.fromEntries(compareData.map((d, i) => [`guide${i}`, d.stats.completionRate])),
        },
        {
            metric: "Earnings",
            ...Object.fromEntries(compareData.map((d, i) => [`guide${i}`, Math.min(100, (d.stats.totalEarnings / 500000) * 100)])), // Scale to 100
        },
    ];

    // Prepare monthly trend data
    const trendData = compareData[0]?.monthlyTrends.map((_, monthIndex) => {
        const monthData: any = { month: compareData[0].monthlyTrends[monthIndex].month };
        compareData.forEach((d, guideIndex) => {
            monthData[`earnings${guideIndex}`] = d.monthlyTrends[monthIndex]?.earnings || 0;
        });
        return monthData;
    }) || [];

    return (
        <div className="space-y-6">
            {/* Side-by-side Stats Cards */}
            <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${compareData.length >= 3 ? "lg:grid-cols-3" : ""} ${compareData.length === 4 ? "xl:grid-cols-4" : ""}`}>
                {compareData.map((data, index) => (
                    <Card key={data.guide.id} style={{ borderTopColor: COMPARE_COLORS[index], borderTopWidth: 3 }}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-10 w-10">
                                    {data.guide.profileImageUrl && (
                                        <AvatarImage src={data.guide.profileImageUrl} alt={`${data.guide.firstName} ${data.guide.lastName}`} />
                                    )}
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {data.guide.firstName[0]}{data.guide.lastName[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-base">{data.guide.firstName} {data.guide.lastName}</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <StatRow label="Total Tours" value={data.stats.totalTours.toString()} />
                            <StatRow label="Completed" value={data.stats.completedTours.toString()} />
                            <StatRow label="Completion Rate" value={`${data.stats.completionRate}%`} isHighlight={data.stats.completionRate >= 90} />
                            <StatRow label="Total Earnings" value={formatCurrency(data.stats.totalEarnings)} />
                            <StatRow label="Rating" value={`${(data.stats.rating || 0).toFixed(1)} ★`} isHighlight={(data.stats.rating || 0) >= 4.5} />
                            <StatRow label="Total Ratings" value={data.stats.totalRatings.toString()} />
                            {data.stats.avgVisitorRating && (
                                <StatRow label="Avg. Visitor Rating" value={`${data.stats.avgVisitorRating.toFixed(1)} ★`} />
                            )}
                            <StatRow
                                label="Cancellation Rate"
                                value={`${data.stats.cancellationRate}%`}
                                isWarning={data.stats.cancellationRate > 10}
                            />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Monthly Earnings Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Earnings Trend</CardTitle>
                    <CardDescription>Last 6 months comparison</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                <YAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                <ChartTooltip
                                    content={({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
                                        if (!active || !payload) return null;
                                        return (
                                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                                                <p className="font-medium mb-2">{label}</p>
                                                {payload.map((entry: any, i: number) => (
                                                    <p key={i} style={{ color: entry.color }} className="text-sm">
                                                        {compareData[i]?.guide.firstName}: {formatCurrency(entry.value)}
                                                    </p>
                                                ))}
                                            </div>
                                        );
                                    }}
                                />
                                {compareData.map((_, index) => (
                                    <Line
                                        key={index}
                                        type="monotone"
                                        dataKey={`earnings${index}`}
                                        name={compareData[index]?.guide.firstName || `Guide ${index + 1}`}
                                        stroke={COMPARE_COLORS[index]}
                                        strokeWidth={2}
                                        dot={{ fill: COMPARE_COLORS[index], strokeWidth: 0, r: 4 }}
                                    />
                                ))}
                                <Legend />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Performance Radar Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                    <CardDescription>Normalized comparison across key metrics</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                                {compareData.map((data, index) => (
                                    <Radar
                                        key={data.guide.id}
                                        name={data.guide.firstName}
                                        dataKey={`guide${index}`}
                                        stroke={COMPARE_COLORS[index]}
                                        fill={COMPARE_COLORS[index]}
                                        fillOpacity={0.15}
                                        strokeWidth={2}
                                    />
                                ))}
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}

// Helper component for stat rows
function StatRow({ label, value, isHighlight, isWarning }: { label: string; value: string; isHighlight?: boolean; isWarning?: boolean }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={`font-medium ${isHighlight ? "text-green-600" : isWarning ? "text-red-500" : ""}`}>
                {value}
            </span>
        </div>
    );
}
