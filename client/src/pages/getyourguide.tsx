import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, RefreshCw, ExternalLink, Globe, Clock } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface GetYourGuideBooking {
    id: string;
    bookingReference: string;
    numberOfPeople: number;
    tourDate: string;
    tourType: string;
    status: string;
    createdAt: string;
    visitorEmail: string | null;
}

export default function GetYourGuidePage() {
    const queryClient = useQueryClient();
    const [syncing, setSyncing] = useState(false);

    // Fetch GetYourGuide bookings
    const { data: bookings, isLoading } = useQuery<GetYourGuideBooking[]>({
        queryKey: ["/api/bookings/channel/getyourguide"],
    });

    // Sync availability mutation
    const syncMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch("/api/getyourguide/sync-availability", {
                method: "POST",
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error(await response.text());
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
            setSyncing(false);
        },
        onError: () => {
            setSyncing(false);
        },
    });

    const handleSyncAvailability = () => {
        setSyncing(true);
        syncMutation.mutate();
    };

    const integrationStatus = bookings !== undefined ? "active" : "pending";

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">GetYourGuide Integration</h1>
                    <p className="text-muted-foreground">
                        Manage GetYourGuide bookings and sync availability
                    </p>
                </div>
                <Badge variant={integrationStatus === "active" ? "default" : "secondary"} className="flex items-center gap-1">
                    {integrationStatus === "active" ? (
                        <>
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                        </>
                    ) : (
                        <>
                            <XCircle className="h-3 w-3" />
                            Pending
                        </>
                    )}
                </Badge>
            </div>

            {/* Integration Status Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Integration Status
                    </CardTitle>
                    <CardDescription>
                        Real-time sync with GetYourGuide booking platform
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Webhook Endpoint</p>
                            <p className="text-sm font-mono bg-muted p-2 rounded">/api/webhooks/getyourguide</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Authentication</p>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">Basic Auth</Badge>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                            <p className="text-2xl font-bold">{bookings?.length || 0}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <Button
                            onClick={handleSyncAvailability}
                            disabled={syncing || syncMutation.isPending}
                            className="w-full md:w-auto"
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                            {syncing ? "Syncing..." : "Sync Availability to GetYourGuide"}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                            Manually push current availability to GetYourGuide
                        </p>
                    </div>

                    {syncMutation.isSuccess && (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Availability successfully synced to GetYourGuide
                            </AlertDescription>
                        </Alert>
                    )}

                    {syncMutation.isError && (
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>
                                Failed to sync availability. Please try again.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent GetYourGuide Bookings</CardTitle>
                    <CardDescription>
                        Bookings received directly from GetYourGuide platform
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : bookings && bookings.length > 0 ? (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Tour Type</TableHead>
                                        <TableHead>Guests</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bookings.map((booking) => (
                                        <TableRow key={booking.id}>
                                            <TableCell className="font-mono text-sm">
                                                {booking.bookingReference}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {booking.visitorEmail || "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{booking.tourType}</Badge>
                                            </TableCell>
                                            <TableCell>{booking.numberOfPeople}</TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(booking.tourDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        booking.status === "confirmed"
                                                            ? "default"
                                                            : booking.status === "pending"
                                                                ? "secondary"
                                                                : "destructive"
                                                    }
                                                >
                                                    {booking.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg font-medium text-muted-foreground">No GetYourGuide bookings yet</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Bookings from GetYourGuide will appear here automatically
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Documentation Link */}
            <Card>
                <CardHeader>
                    <CardTitle>Documentation</CardTitle>
                    <CardDescription>Learn more about the GetYourGuide integration</CardDescription>
                </CardHeader>
                <CardContent>
                    <a
                        href="https://integrator.getyourguide.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                    >
                        GetYourGuide Integrator Portal
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </CardContent>
            </Card>
        </div>
    );
}
