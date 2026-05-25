import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    Users,
    AlertCircle,
    Shield,
    Clock,
    UserCheck,
    RefreshCw,
    LogOut,
    AlertTriangle,
    Timer,
    CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SEO } from "@/components/seo";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReportIncidentDialog } from "@/components/report-incident-dialog";
import { DataErrorState } from "@/components/data-error-state";

interface ActiveBooking {
    id: string;
    bookingReference: string;
    visitorName: string;
    groupSize: string;
    numberOfPeople: number;
    assignedGuideId: string | null;
    guideName: string | null;
    checkInTime: string | null;
    status: string;
}

interface LiveStats {
    activeTours: number;
    visitorsOnSite: number;
    openIncidents: number;
    availableGuides: number;
    recentIncidents: any[];
    activeBookings: ActiveBooking[];
}

function getTourDuration(checkInTime: string | null): string {
    if (!checkInTime) return "-";
    const checkIn = new Date(checkInTime);
    const now = new Date();
    const diffMs = now.getTime() - checkIn.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
        return `${diffMins}m`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
}

export default function LiveOperations() {
    const { toast } = useToast();
    const [checkOutBookingId, setCheckOutBookingId] = useState<string | null>(null);
    const [incidentBookingId, setIncidentBookingId] = useState<string | null>(null);

    const { data: stats, isLoading, isError: statsError, dataUpdatedAt, refetch } = useQuery<LiveStats>({
        queryKey: ["/api/live-ops/stats"],
        refetchInterval: 30000,
    });

    // Track refresh time — re-render every 10s so the "last refreshed" text stays current
    const [, setRefreshTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setRefreshTick(t => t + 1), 10000);
        return () => clearInterval(id);
    }, []);

    // Fetch today's confirmed bookings that haven't started yet
    const { data: todaysTours, isError: todaysToursError, refetch: refetchTodaysTours } = useQuery<ActiveBooking[]>({
        queryKey: ["/api/bookings/today"],
        refetchInterval: 30000,
    });

    const pendingTours = todaysTours?.filter(
        (t) => t.status === "confirmed" && !t.checkInTime
    ) || [];
    const hasLiveOpsError = statsError || todaysToursError;
    const metricValue = (value?: number) => statsError ? "Unavailable" : (value ?? 0);

    const checkInMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            const res = await apiRequest("POST", `/api/bookings/${bookingId}/check-in`);
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Tour Started", description: "Visitor checked in successfully." });
            queryClient.invalidateQueries({ queryKey: ["/api/live-ops/stats"] });
            queryClient.invalidateQueries({ queryKey: ["/api/bookings/today"] });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to start tour.", variant: "destructive" });
        },
    });

    const checkOutMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            const res = await apiRequest("POST", `/api/bookings/${bookingId}/check-out`);
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Visitor checked out successfully." });
            queryClient.invalidateQueries({ queryKey: ["/api/live-ops/stats"] });
            setCheckOutBookingId(null);
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to check out visitor.", variant: "destructive" });
        },
    });

    const handleCheckOut = (bookingId: string) => {
        setCheckOutBookingId(bookingId);
    };

    const confirmCheckOut = () => {
        if (checkOutBookingId) {
            checkOutMutation.mutate(checkOutBookingId);
        }
    };

    return (
        <div className="space-y-6">
            <SEO title="Live Operations" description="Real-time operational dashboard for Dzaleka tours." robots="noindex" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Live Operations</h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <span className={`flex h-2 w-2 rounded-full ${hasLiveOpsError ? "bg-red-500" : "bg-green-500"} animate-pulse`}></span>
                        Real-time overview • Auto-refreshes every 30s
                    </p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto">
                    {dataUpdatedAt > 0 && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                            Updated {formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true })}
                        </span>
                    )}
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {hasLiveOpsError && (
                <div className="grid gap-3 md:grid-cols-2">
                    {statsError && (
                        <DataErrorState
                            title="Live operations stats unavailable"
                            description="Visitor counts, active tours, incidents, and guide availability could not be loaded. Do not treat the zero values as all-clear."
                            onRetry={() => void refetch()}
                        />
                    )}
                    {todaysToursError && (
                        <DataErrorState
                            title="Today's tours unavailable"
                            description="Confirmed tours waiting to start could not be loaded. Retry before assuming there are no pending check-ins."
                            onRetry={() => void refetchTodaysTours()}
                        />
                    )}
                </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Visitors on Site</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tabular-nums">{metricValue(stats?.visitorsOnSite)}</div>
                        <p className="text-xs text-muted-foreground">{statsError ? "Stats API unavailable" : "Currently checked-in"}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tours</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tabular-nums">{metricValue(stats?.activeTours)}</div>
                        <p className="text-xs text-muted-foreground">{statsError ? "Stats API unavailable" : "In progress"}</p>
                    </CardContent>
                </Card>

                <Card className={statsError || stats?.openIncidents ? "border-red-200 bg-red-50 dark:bg-red-950/20" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
                        <AlertCircle className={`h-4 w-4 ${statsError || stats?.openIncidents ? "text-red-500" : "text-muted-foreground"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold tabular-nums ${statsError || stats?.openIncidents ? "text-red-600" : ""}`}>
                            {metricValue(stats?.openIncidents)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {statsError ? "Incident feed unavailable" : stats?.openIncidents ? "Requires attention" : "All clear"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Guides</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tabular-nums">{metricValue(stats?.availableGuides)}</div>
                        <p className="text-xs text-muted-foreground">{statsError ? "Stats API unavailable" : "Ready to deploy"}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                {/* Active Tours */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Active Tours</CardTitle>
                                <CardDescription>Currently ongoing tours and visits</CardDescription>
                            </div>
                            {stats?.activeBookings && stats.activeBookings.length > 0 && (
                                <Badge variant="secondary">{stats.activeBookings.length} active</Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {statsError ? (
                            <DataErrorState
                                title="Active tours unavailable"
                                description="Active tour data failed to load. Retry before assuming no tours are currently in progress."
                                onRetry={() => void refetch()}
                            />
                        ) : stats?.activeBookings && stats.activeBookings.length > 0 ? (
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[120px]">Ref</TableHead>
                                            <TableHead>Visitor</TableHead>
                                            <TableHead>Group</TableHead>
                                            <TableHead>Guide</TableHead>
                                            <TableHead>
                                                <div className="flex items-center gap-1">
                                                    <Timer className="h-3 w-3" />
                                                    Duration
                                                </div>
                                            </TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stats.activeBookings.map((booking) => (
                                            <TableRow key={booking.id}>
                                                <TableCell className="font-mono text-xs">{booking.bookingReference}</TableCell>
                                                <TableCell className="font-medium">{booking.visitorName}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {booking.numberOfPeople} pax
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {booking.guideName ? (
                                                        <span>{booking.guideName}</span>
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                                            Unassigned
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-sm">{getTourDuration(booking.checkInTime)}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => setIncidentBookingId(booking.id)}
                                                            title="Report Incident"
                                                        >
                                                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleCheckOut(booking.id)}
                                                            title="Check Out"
                                                        >
                                                            <LogOut className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <Activity className="h-10 w-10 mb-3 opacity-50" />
                                <p>No tours currently in progress</p>
                                <p className="text-sm">Tours will appear here once visitors check in</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pending Tours - Ready to Start */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Ready to Start</CardTitle>
                                <CardDescription>Confirmed tours waiting to check in</CardDescription>
                            </div>
                            {!todaysToursError && <Badge variant="outline">{pendingTours.length} pending</Badge>}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {todaysToursError ? (
                            <DataErrorState
                                title="Ready-to-start tours unavailable"
                                description="Today's confirmed bookings could not be loaded. Retry before assuming there are no pending check-ins."
                                onRetry={() => void refetchTodaysTours()}
                            />
                        ) : pendingTours.length > 0 ? (
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[120px]">Ref</TableHead>
                                            <TableHead>Visitor</TableHead>
                                            <TableHead>Group</TableHead>
                                            <TableHead>Guide</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingTours.map((booking) => (
                                            <TableRow key={booking.id}>
                                                <TableCell className="font-mono text-xs">{booking.bookingReference}</TableCell>
                                                <TableCell className="font-medium">{booking.visitorName}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {booking.numberOfPeople} pax
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {booking.guideName ? (
                                                        <span>{booking.guideName}</span>
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                                            Unassigned
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => checkInMutation.mutate(booking.id)}
                                                        disabled={checkInMutation.isPending}
                                                    >
                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                        Start Tour
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                                <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                                <p className="text-sm font-medium">No tours waiting to start</p>
                                <p className="text-xs">Confirmed tours will appear here before check-in.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Security Feed */}
                <Card>
                    <CardHeader>
                        <CardTitle>Security Feed</CardTitle>
                        <CardDescription>Recent incidents and alerts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {statsError ? (
                                <DataErrorState
                                    title="Security feed unavailable"
                                    description="Incident data could not be loaded. Retry before treating the feed as all-clear."
                                    onRetry={() => void refetch()}
                                />
                            ) : stats?.recentIncidents && stats.recentIncidents.length > 0 ? (
                                stats.recentIncidents.map((incident) => (
                                    <div key={incident.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                                        <div className={`mt-0.5 rounded-full p-1.5 ${incident.severity === 'critical' ? 'bg-red-100 text-red-600' :
                                            incident.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                            <Shield className="h-3 w-3" />
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <p className="text-sm font-medium truncate">{incident.title}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{incident.description}</p>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] uppercase">
                                                    {incident.severity}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {format(new Date(incident.createdAt), "HH:mm")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                    <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                                    <p className="text-sm font-medium">All Clear</p>
                                    <p className="text-xs">No open incidents</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Check-Out Confirmation Dialog */}
            <AlertDialog open={!!checkOutBookingId} onOpenChange={() => setCheckOutBookingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Check Out Visitor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will mark the tour as completed and record the check-out time.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCheckOut} disabled={checkOutMutation.isPending}>
                            {checkOutMutation.isPending ? "Processing…" : "Check Out"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Report Incident Dialog */}
            {incidentBookingId && (
                <ReportIncidentDialog
                    open={!!incidentBookingId}
                    onOpenChange={() => setIncidentBookingId(null)}
                    bookingId={incidentBookingId}
                    onSuccess={() => {
                        setIncidentBookingId(null);
                        refetch();
                    }}
                />
            )}
        </div>
    );
}
