import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    Users,
    AlertCircle,
    MapPin,
    Shield,
    Clock,
    UserCheck,
    RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { SEO } from "@/components/seo";

interface LiveStats {
    activeTours: number;
    visitorsOnSite: number;
    openIncidents: number;
    availableGuides: number;
    recentIncidents: any[];
    activeBookings: any[];
}

export default function LiveOperations() {
    const { data: stats, isLoading, refetch } = useQuery<LiveStats>({
        queryKey: ["/api/live-ops/stats"],
        refetchInterval: 30000, // Poll every 30 seconds
    });

    return (
        <div className="space-y-6">
            <SEO title="Live Operations" description="Real-time operational dashboard for Dzaleka tours." />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Live Operations</h1>
                    <p className="text-muted-foreground">Real-time overview of current camp activity.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-sm text-muted-foreground">Live</span>
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Visitors on Site</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.visitorsOnSite || 0}</div>
                        <p className="text-xs text-muted-foreground">Checked-in currently</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tours</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeTours || 0}</div>
                        <p className="text-xs text-muted-foreground">In progress now</p>
                    </CardContent>
                </Card>
                <Card className={stats?.openIncidents ? "border-red-200 bg-red-50 dark:bg-red-900/10" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
                        <AlertCircle className={`h-4 w-4 ${stats?.openIncidents ? "text-red-500" : "text-muted-foreground"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats?.openIncidents ? "text-red-600" : ""}`}>
                            {stats?.openIncidents || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Requires attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Guides</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.availableGuides || 0}</div>
                        <p className="text-xs text-muted-foreground">Ready for deployment</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Active Tours List */}
                <Card className="col-span-4 transition-all">
                    <CardHeader>
                        <CardTitle>Active Tours</CardTitle>
                        <CardDescription>
                            Currently ongoing tours and visits.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats?.activeBookings && stats.activeBookings.length > 0 ? (
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px]">Ref</TableHead>
                                            <TableHead className="min-w-[120px]">Visitor</TableHead>
                                            <TableHead className="min-w-[100px]">Group</TableHead>
                                            <TableHead className="min-w-[100px]">Guide</TableHead>
                                            <TableHead className="text-right">Started</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stats.activeBookings.map((booking) => (
                                            <TableRow key={booking.id}>
                                                <TableCell className="font-mono text-xs">{booking.bookingReference}</TableCell>
                                                <TableCell className="font-medium">{booking.visitorName}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                                        {booking.groupSize.replace("_", " ")} ({booking.numberOfPeople})
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{booking.assignedGuideId ? "Assigned" : "Unassigned"}</TableCell>
                                                <TableCell className="text-right whitespace-nowrap">
                                                    {booking.checkInTime ? format(new Date(booking.checkInTime), "HH:mm") : "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex h-40 items-center justify-center text-muted-foreground">
                                No tours currently in progress.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Incidents / Security Feed */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Security Feed</CardTitle>
                        <CardDescription>
                            Recent reported incidents and alerts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {stats?.recentIncidents && stats.recentIncidents.length > 0 ? (
                                stats.recentIncidents.map((incident) => (
                                    <div key={incident.id} className="flex items-start gap-4">
                                        <div className={`mt-1 rounded-full p-2 ${incident.severity === 'critical' ? 'bg-red-100 text-red-600' :
                                            incident.severity === 'high' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            <Shield className="h-4 w-4" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{incident.title}</p>
                                            <p className="text-sm text-muted-foreground">{incident.description}</p>
                                            <div className="flex items-center gap-2 pt-1">
                                                <Badge variant="outline" className="text-[10px] uppercase">
                                                    {incident.severity}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(incident.createdAt), "HH:mm")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex h-40 items-center justify-center text-muted-foreground">
                                    No open incidents. All clear.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
