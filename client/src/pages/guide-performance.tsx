import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Calendar, DollarSign, Users, Star, CheckCircle, Clock, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/constants";
import type { Guide, Booking } from "@shared/schema";
import { SEO } from "@/components/seo";

interface GuideEarnings {
    month: string;
    earnings: number;
    tours: number;
}

interface GuideWithStats extends Guide {
    totalEarnings: number;
    totalTours: number;
    completionRate: number;
}

// Generate months for the chart
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const monthlyEarningsConfig = {
    earnings: {
        label: "Earnings",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig;

export default function GuidePerformance() {
    const [selectedGuideId, setSelectedGuideId] = useState<string>("");
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    const { data: guides, isLoading: guidesLoading } = useQuery<Guide[]>({
        queryKey: ["/api/guides"],
    });

    const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
        queryKey: ["/api/bookings"],
    });

    const isLoading = guidesLoading || bookingsLoading;

    // Calculate guide statistics
    const guideStats: GuideWithStats[] = (guides || []).map(guide => {
        const guideBookings = (bookings || []).filter(b => b.assignedGuideId === guide.id);
        const completedTours = guideBookings.filter(b => b.status === "completed");
        const totalEarnings = completedTours.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const completionRate = guideBookings.length > 0
            ? Math.round((completedTours.length / guideBookings.length) * 100)
            : 0;

        return {
            ...guide,
            totalEarnings,
            totalTours: guideBookings.length,
            completionRate,
        };
    }).sort((a, b) => b.totalEarnings - a.totalEarnings);

    // Calculate monthly earnings for selected guide
    const getMonthlyEarnings = (guideId: string): GuideEarnings[] => {
        const guideBookings = (bookings || []).filter(
            b => b.assignedGuideId === guideId && b.status === "completed"
        );

        return MONTHS.map((month, index) => {
            const monthBookings = guideBookings.filter(b => {
                if (!b.visitDate) return false;
                const date = new Date(b.visitDate);
                return date.getMonth() === index && date.getFullYear() === selectedYear;
            });

            return {
                month,
                earnings: monthBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
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
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Guide Performance</h1>
                <p className="text-muted-foreground">
                    Track guide earnings, tour completion rates, and availability.
                </p>
            </div>

            <Tabs defaultValue="earnings" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="earnings">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Earnings
                    </TabsTrigger>
                    <TabsTrigger value="calendar">
                        <Calendar className="mr-2 h-4 w-4" />
                        Availability Calendar
                    </TabsTrigger>
                </TabsList>

                {/* Earnings Tab */}
                <TabsContent value="earnings" className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
                                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(guideStats.reduce((sum, g) => sum + g.totalEarnings, 0))}
                                </div>
                                <p className="text-xs text-muted-foreground">All time revenue</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Tours</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {guideStats.reduce((sum, g) => sum + g.totalTours, 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">Completed tours</p>
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
                                    <div key={guide.id} className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {guide.firstName[0]}{guide.lastName[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="font-medium">{guide.firstName} {guide.lastName}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {guide.totalTours} tours · {guide.completionRate}% completion
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-green-600">{formatCurrency(guide.totalEarnings)}</div>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                {(guide.rating || 0).toFixed(1)}
                                            </div>
                                        </div>
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
                                    <Select value={selectedGuideId} onValueChange={setSelectedGuideId}>
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
                                            <SelectItem value="2024">2024</SelectItem>
                                            <SelectItem value="2025">2025</SelectItem>
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
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Calendar Tab */}
                <TabsContent value="calendar" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Guide Availability Calendar</CardTitle>
                                    <CardDescription>View scheduled tours and guide availability</CardDescription>
                                </div>
                                <div className="flex gap-2">
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
                                            <SelectItem value="2024">2024</SelectItem>
                                            <SelectItem value="2025">2025</SelectItem>
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
                                    <span className="text-muted-foreground">Available</span>
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
                                        if (!b.visitDate || b.assignedGuideId !== guide.id) return false;
                                        const date = new Date(b.visitDate);
                                        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
                                    });

                                    return (
                                        <div key={guide.id} className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {guide.firstName[0]}{guide.lastName[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="font-medium">{guide.firstName} {guide.lastName}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {monthTours.length} tour{monthTours.length !== 1 ? "s" : ""} scheduled
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                {monthTours.length === 0 ? (
                                                    <Badge variant="outline" className="text-green-600 border-green-200">
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        Available
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
        </div>
    );
}
