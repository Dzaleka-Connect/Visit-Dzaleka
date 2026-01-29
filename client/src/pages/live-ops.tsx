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
import { queryClient } from "@/lib/queryClient";
import { SEO } from "@/components/seo";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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

    const { data: stats, isLoading, refetch } = useQuery<LiveStats>({
        queryKey: ["/api/live-ops/stats"],
        refetchInterval: 30000,
    });

    // Fetch today's confirmed bookings that haven't started yet
    const { data: todaysTours } = useQuery<ActiveBooking[]>({
        queryKey: ["/api/bookings/today"],
        refetchInterval: 30000,
    });

    const pendingTours = todaysTours?.filter(
        (t) => t.status === "confirmed" && !t.checkInTime
    ) || [];

    const checkInMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            const res = await fetch(`/api/bookings/${bookingId}/check-in`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to check in");
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
            const res = await fetch(`/api/bookings/${bookingId}/check-out`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to check out");
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
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        Real-time overview • Auto-refreshes every 30s
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="self-start sm:self-auto gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Visitors on Site</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.visitorsOnSite || 0}</div>
                        <p className="text-xs text-muted-foreground">Currently checked-in</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tours</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeTours || 0}</div>
                        <p className="text-xs text-muted-foreground">In progress</p>
                    </CardContent>
                </Card>

                <Card className={stats?.openIncidents ? "border-red-200 bg-red-50 dark:bg-red-950/20" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
                        <AlertCircle className={`h-4 w-4 ${stats?.openIncidents ? "text-red-500" : "text-muted-foreground"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats?.openIncidents ? "text-red-600" : ""}`}>
                            {stats?.openIncidents || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.openIncidents ? "Requires attention" : "All clear"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Guides</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.availableGuides || 0}</div>
                        <p className="text-xs text-muted-foreground">Ready to deploy</p>
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
                        {stats?.activeBookings && stats.activeBookings.length > 0 ? (
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
                {pendingTours.length > 0 && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Ready to Start</CardTitle>
                                    <CardDescription>Confirmed tours waiting to check in</CardDescription>
                                </div>
                                <Badge variant="outline">{pendingTours.length} pending</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
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
                        </CardContent>
                    </Card>
                )}

                {/* Security Feed */}
                <Card>
                    <CardHeader>
                        <CardTitle>Security Feed</CardTitle>
                        <CardDescription>Recent incidents and alerts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.recentIncidents && stats.recentIncidents.length > 0 ? (
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
