import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
    BarChart3,
    Monitor,
    Smartphone,
    Tablet,
    Globe,
    TrendingUp,
    Users,
    Eye,
    ArrowUpRight,
    Activity,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    Clock,
    Ban,
    RefreshCw,
    Ticket,
    CalendarDays,
    RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    BarChart,
    Bar,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { SEO } from "@/components/seo";

interface PageViewStats {
    totalPageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    pageBreakdown: { page: string; views: number }[];
    dailyViews: { date: string; views: number; uniqueVisitors: number }[];
    deviceBreakdown: { device: string; count: number }[];
    referrerBreakdown: { referrer: string; count: number }[];
    channelBreakdown: { channel: string; count: number }[];
}

interface BookingKPIs {
    period: { start: string; end: string };
    summary: {
        totalBookings: number;
        confirmedBookings: number;
        totalRevenue: number;
        averageTicketPrice: number;
        averageLeadTime: number;
        noShowRate: number;
        noShowCount: number;
        repeatBookingRate: number;
        uniqueVisitors: number;
        repeatVisitors: number;
    };
    revenueByChannel: { channel: string; count: number; revenue: number }[];
    statusBreakdown: { status: string; count: number }[];
    tourTypeBreakdown: { tourType: string; count: number; revenue: number }[];
    dailyTrends: { date: string; bookings: number; revenue: number }[];
}

const chartConfig = {
    views: {
        label: "Page Views",
        color: "var(--chart-1)",
    },
    uniqueVisitors: {
        label: "Unique Visitors",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig;

const DEVICE_ICONS: Record<string, any> = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet,
};

const COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
];

export default function Analytics() {
    const { user } = useAuth();

    const { data: liveData } = useQuery<{ count: number }>({
        queryKey: ["/api/analytics/live"],
        refetchInterval: 30000,
    });

    const { data, isLoading, refetch: refetchPageviews } = useQuery<PageViewStats>({
        queryKey: ["/api/analytics/pageviews"],
        staleTime: 60 * 1000, // 1 minute
    });

    const { data: bookingKpis, isLoading: kpisLoading, refetch: refetchKpis } = useQuery<BookingKPIs>({
        queryKey: ["/api/analytics/booking-kpis"],
        staleTime: 60 * 1000, // 1 minute
    });

    const handleRefresh = () => {
        refetchPageviews();
        refetchKpis();
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Only admins can view analytics - placed after hooks to comply with React rules
    if (user?.role !== "admin") {
        return <Redirect to="/dashboard" />;
    }

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    const stats = data || {
        totalPageViews: 0,
        uniqueVisitors: 0,
        bounceRate: 0,
        pageBreakdown: [],
        dailyViews: [],
        deviceBreakdown: [],
        referrerBreakdown: [],
        channelBreakdown: [],
    };

    const formatCompactNumber = (num: number) => {
        return new Intl.NumberFormat("en-US", {
            notation: "compact",
            maximumFractionDigits: 1,
        }).format(num);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-MW", {
            style: "currency",
            currency: "MWK",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const kpis = bookingKpis?.summary;

    return (
        <div className="space-y-4 sm:space-y-6">
            <SEO
                title="Website Analytics"
                description="Track page views, visitor behavior, device usage, and conversion metrics for Visit Dzaleka."
            />
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Website Analytics</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Track page views, visitor behavior, and conversion metrics.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading || kpisLoading}>
                    <RefreshCcw className={`mr-2 h-4 w-4 ${(isLoading || kpisLoading) ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <Card className="col-span-2 lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Live Visitors</CardTitle>
                        <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCompactNumber(liveData?.count ?? 0)}</div>
                        <p className="text-xs text-muted-foreground">Active in last 5 min</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCompactNumber(stats.totalPageViews)}</div>
                        <p className="text-xs text-muted-foreground">All tracked page views</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCompactNumber(stats.uniqueVisitors)}</div>
                        <p className="text-xs text-muted-foreground">Unique browser sessions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pages per Visit</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.uniqueVisitors > 0
                                ? (stats.totalPageViews / stats.uniqueVisitors).toFixed(1)
                                : "0"}
                        </div>
                        <p className="text-xs text-muted-foreground">Average pages per session</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(stats.bounceRate ?? 0).toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">Single page visits</p>
                    </CardContent>
                </Card>
            </div>

            {/* Booking & Revenue KPIs */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h2 className="text-lg sm:text-xl font-semibold">Booking & Revenue KPIs</h2>
                </div>

                <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                            <CalendarDays className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpis?.totalBookings ?? 0}</div>
                            <p className="text-xs text-muted-foreground">Last 30 days</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(kpis?.totalRevenue ?? 0)}</div>
                            <p className="text-xs text-muted-foreground">Last 30 days</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Tour Price</CardTitle>
                            <DollarSign className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(kpis?.averageTicketPrice ?? 0)}</div>
                            <p className="text-xs text-muted-foreground">Per booking</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Lead Time</CardTitle>
                            <Clock className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpis?.averageLeadTime ?? 0} days</div>
                            <p className="text-xs text-muted-foreground">Avg booking to visit</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
                            <Ban className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpis?.noShowRate ?? 0}%</div>
                            <p className="text-xs text-muted-foreground">{kpis?.noShowCount ?? 0} no-shows</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Repeat Rate</CardTitle>
                            <RefreshCw className="h-4 w-4 text-teal-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpis?.repeatBookingRate ?? 0}%</div>
                            <p className="text-xs text-muted-foreground">{kpis?.repeatVisitors ?? 0} return visitors</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Revenue by Channel & Status Breakdown */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base sm:text-lg">Revenue by Channel</CardTitle>
                            <CardDescription>Booking sources and revenue</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {(bookingKpis?.revenueByChannel?.length ?? 0) > 0 ? (
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={bookingKpis?.revenueByChannel} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} horizontal={false} />
                                            <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} />
                                            <YAxis type="category" dataKey="channel" width={60} tick={{ fontSize: 12 }} />
                                            <ChartTooltip
                                                content={({ active, payload }: { active: boolean; payload: any[] }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-background border rounded-lg shadow-lg p-3">
                                                                <p className="font-medium capitalize">{data.channel}</p>
                                                                <p className="text-sm text-muted-foreground">Bookings: {data.count}</p>
                                                                <p className="text-sm font-medium">{formatCurrency(data.revenue)}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="revenue" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                                    No channel data yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base sm:text-lg">Status Breakdown</CardTitle>
                            <CardDescription>Booking statuses distribution</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {(bookingKpis?.statusBreakdown?.length ?? 0) > 0 ? (
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={bookingKpis?.statusBreakdown}
                                                dataKey="count"
                                                nameKey="status"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                fill="var(--chart-1)"
                                                label={({ status, count }) => `${status}: ${count}`}
                                            >
                                                {bookingKpis?.statusBreakdown.map((entry, index) => (
                                                    <Cell key={entry.status} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <ChartTooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                                    No status data yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Website Analytics Section */}
            <div className="flex items-center gap-2 pt-4">
                <Globe className="h-5 w-5 text-primary" />
                <h2 className="text-lg sm:text-xl font-semibold">Website Traffic</h2>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Daily Views Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2 sm:pb-6">
                        <CardTitle className="text-base sm:text-lg">Traffic Over Time</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Page views and unique visitors per day</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 sm:px-6 sm:pb-6">
                        {stats.dailyViews.length > 0 ? (
                            <ChartContainer config={chartConfig} className="h-[200px] sm:h-[350px] w-full">
                                <AreaChart
                                    data={stats.dailyViews}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 9 }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        width={30}
                                        tick={{ fontSize: 9 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Area
                                        type="monotone"
                                        dataKey="views"
                                        fill="var(--chart-1)"
                                        fillOpacity={0.3}
                                        stroke="var(--chart-1)"
                                        strokeWidth={2}
                                        name="Page Views"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="uniqueVisitors"
                                        fill="var(--chart-2)"
                                        fillOpacity={0.3}
                                        stroke="var(--chart-2)"
                                        strokeWidth={2}
                                        name="Unique Visitors"
                                    />
                                </AreaChart>
                            </ChartContainer>
                        ) : (
                            <div className="flex h-[200px] sm:h-[350px] items-center justify-center text-muted-foreground text-center text-xs sm:text-sm px-4">
                                No traffic data yet. Visitors will appear as they browse the site.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Device Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Device Breakdown</CardTitle>
                        <CardDescription>Visitors by device type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.deviceBreakdown.length > 0 ? (
                            <div className="space-y-4">
                                {stats.deviceBreakdown.map((item, index) => {
                                    const DeviceIcon = DEVICE_ICONS[item.device] || Monitor;
                                    const percentage = stats.totalPageViews > 0
                                        ? ((item.count / stats.totalPageViews) * 100).toFixed(1)
                                        : 0;
                                    return (
                                        <div key={item.device} className="flex items-center gap-4">
                                            <DeviceIcon className="h-5 w-5 text-muted-foreground" />
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium capitalize">{item.device}</span>
                                                    <span className="text-sm text-muted-foreground">{item.count} ({percentage}%)</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${percentage}%`,
                                                            backgroundColor: COLORS[index % COLORS.length]
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                                No device data yet.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Traffic Channels */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base sm:text-lg">Traffic Channels</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Categorized traffic sources</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(stats.channelBreakdown?.length ?? 0) > 0 ? (
                            <div className="space-y-4">
                                {stats.channelBreakdown.map((item, index) => {
                                    const percentage = stats.totalPageViews > 0
                                        ? ((item.count / stats.totalPageViews) * 100).toFixed(1)
                                        : 0;
                                    return (
                                        <div key={item.channel} className="flex items-center gap-4">
                                            <Globe className="h-5 w-5 text-muted-foreground" />
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium">{item.channel}</span>
                                                    <span className="text-sm text-muted-foreground">{item.count} ({percentage}%)</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${percentage}%`,
                                                            backgroundColor: COLORS[index % COLORS.length]
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                                No channel data yet.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Top Pages Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Pages</CardTitle>
                    <CardDescription>Most visited pages on your site</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.pageBreakdown.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Page</TableHead>
                                    <TableHead className="text-right">Views</TableHead>
                                    <TableHead className="text-right hidden sm:table-cell">% of Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.pageBreakdown
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((page) => (
                                        <TableRow key={page.page}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <ArrowUpRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                                                    <span className="truncate max-w-[120px] sm:max-w-none" title={page.page}>{page.page}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">{page.views.toLocaleString()}</TableCell>
                                            <TableCell className="text-right hidden sm:table-cell">
                                                {stats.totalPageViews > 0
                                                    ? ((page.views / stats.totalPageViews) * 100).toFixed(1)
                                                    : 0}%
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                            No page data yet. Visit some pages to see analytics.
                        </div>
                    )}

                    {stats.pageBreakdown.length > itemsPerPage && (
                        <div className="flex items-center justify-between space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Previous
                            </Button>
                            <div className="text-sm text-muted-foreground">
                                Page {currentPage} of {Math.ceil(stats.pageBreakdown.length / itemsPerPage)}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.min(Math.ceil(stats.pageBreakdown.length / itemsPerPage), p + 1))}
                                disabled={currentPage >= Math.ceil(stats.pageBreakdown.length / itemsPerPage)}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
