import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/seo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatTime, formatCurrency } from "@/lib/constants";
import {
    Calendar,
    Clock,
    Users,
    MapPin,
    Phone,
    Mail,
    Play,
    CheckCircle,
    Loader2,
    User,
    ScanLine,
    UserX,
} from "lucide-react";
import type { Booking } from "@shared/schema";
import { QRScannerDialog } from "@/components/qr-scanner-dialog";

export default function MyTours() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("upcoming");
    const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

    const { data: tours = [], isLoading } = useQuery<Booking[]>({
        queryKey: ["/api/guides/me/tours"],
    });

    const checkInMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            const response = await apiRequest("POST", `/api/bookings/${bookingId}/guide-check-in`);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/guides/me/tours"] });
            toast({ title: "Visitor Checked In", description: "The tour is now in progress." });
        },
        onError: (error: Error) => {
            toast({ title: "Check-in Failed", description: error.message, variant: "destructive" });
        },
    });

    const checkOutMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            const response = await apiRequest("POST", `/api/bookings/${bookingId}/guide-check-out`);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/guides/me/tours"] });
            queryClient.invalidateQueries({ queryKey: ["/api/guides/me"] });
            queryClient.invalidateQueries({ queryKey: ["/api/guides/me/earnings"] });
            toast({ title: "Tour Completed", description: "The tour has been marked as completed." });
        },
        onError: (error: Error) => {
            toast({ title: "Check-out Failed", description: error.message, variant: "destructive" });
        },
    });

    const noShowMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            const response = await apiRequest("POST", `/api/bookings/${bookingId}/guide-no-show`);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/guides/me/tours"] });
            toast({ title: "Marked as No-Show", description: "The visitor has been marked as a no-show." });
        },
        onError: (error: Error) => {
            toast({ title: "Failed", description: error.message, variant: "destructive" });
        },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingTours = tours.filter(t => {
        const visitDate = new Date(t.visitDate);
        return visitDate >= today && (t.status === "confirmed" || t.status === "pending");
    });

    const inProgressTours = tours.filter(t => t.status === "in_progress");

    const completedTours = tours.filter(t => t.status === "completed");

    const handleQRScan = (result: string) => {
        // Find the matching booking by reference
        const reference = result.trim().toUpperCase();
        const matchingTour = tours.find(
            t => t.bookingReference?.toUpperCase() === reference && t.status === "confirmed"
        );
        if (matchingTour) {
            checkInMutation.mutate(matchingTour.id);
        } else {
            toast({
                title: "Booking Not Found",
                description: `No matching tour found for reference: ${reference}`,
                variant: "destructive",
            });
        }
    };

    const renderTourCard = (tour: Booking) => (
        <Card key={tour.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{tour.visitorName}</h3>
                                <p className="text-sm text-muted-foreground">{tour.visitorOrganization || "Individual"}</p>
                            </div>
                        </div>
                        <StatusBadge status={tour.status || "pending"} />
                    </div>

                    {/* Tour Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(tour.visitDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(tour.visitTime)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{tour.numberOfPeople} {tour.numberOfPeople === 1 ? "person" : "people"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="capitalize">{tour.tourType?.replace("_", " ")}</span>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="border-t pt-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact Info</p>
                        <div className="flex flex-wrap gap-2">
                            {tour.visitorEmail && (
                                <a
                                    href={`mailto:${tour.visitorEmail}`}
                                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                                >
                                    <Mail className="h-3.5 w-3.5" />
                                    {tour.visitorEmail}
                                </a>
                            )}
                            {tour.visitorPhone && (
                                <a
                                    href={`tel:${tour.visitorPhone}`}
                                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                                >
                                    <Phone className="h-3.5 w-3.5" />
                                    {tour.visitorPhone}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Special Requests */}
                    {tour.specialRequests && (
                        <div className="border-t pt-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Special Requests</p>
                            <p className="text-sm">{tour.specialRequests}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="border-t pt-3 flex gap-2">
                        {tour.status === "confirmed" && (
                            <>
                                <Button
                                    onClick={() => checkInMutation.mutate(tour.id)}
                                    disabled={checkInMutation.isPending}
                                    className="flex-1"
                                >
                                    {checkInMutation.isPending && checkInMutation.variables === tour.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Play className="mr-2 h-4 w-4" />
                                    )}
                                    Check In Visitor
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => noShowMutation.mutate(tour.id)}
                                    disabled={noShowMutation.isPending}
                                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                >
                                    {noShowMutation.isPending && noShowMutation.variables === tour.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <UserX className="mr-2 h-4 w-4" />
                                    )}
                                    No-Show
                                </Button>
                            </>
                        )}
                        {tour.status === "in_progress" && (
                            <Button
                                onClick={() => checkOutMutation.mutate(tour.id)}
                                disabled={checkOutMutation.isPending}
                                variant="outline"
                                className="flex-1"
                            >
                                {checkOutMutation.isPending && checkOutMutation.variables === tour.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                )}
                                Complete Tour
                            </Button>
                        )}
                        {tour.status === "completed" && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                Completed on {formatDate(tour.checkOutTime || tour.visitDate)}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SEO
                title="My Tours"
                description="View and manage your assigned tours."
            />

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">My Tours</h1>
                    <Button
                        variant="outline"
                        onClick={() => setIsQRScannerOpen(true)}
                    >
                        <ScanLine className="mr-2 h-4 w-4" />
                        Scan QR
                    </Button>
                </div>
                <p className="text-muted-foreground">
                    View and manage all your assigned tours.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-3">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-primary">{upcomingTours.length}</div>
                        <div className="text-sm text-muted-foreground">Upcoming</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-orange-500">{inProgressTours.length}</div>
                        <div className="text-sm text-muted-foreground">In Progress</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-green-500">{completedTours.length}</div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="upcoming">
                        Upcoming ({upcomingTours.length})
                    </TabsTrigger>
                    <TabsTrigger value="in_progress">
                        In Progress ({inProgressTours.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                        Completed ({completedTours.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="mt-4">
                    {upcomingTours.length === 0 ? (
                        <EmptyState
                            icon={Calendar}
                            title="No upcoming tours"
                            description="You don't have any upcoming tours assigned."
                            className="py-12"
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {upcomingTours.map(renderTourCard)}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="in_progress" className="mt-4">
                    {inProgressTours.length === 0 ? (
                        <EmptyState
                            icon={Play}
                            title="No tours in progress"
                            description="No tours are currently in progress."
                            className="py-12"
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {inProgressTours.map(renderTourCard)}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="completed" className="mt-4">
                    {completedTours.length === 0 ? (
                        <EmptyState
                            icon={CheckCircle}
                            title="No completed tours"
                            description="You haven't completed any tours yet."
                            className="py-12"
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {completedTours.map(renderTourCard)}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* QR Scanner Dialog */}
            <QRScannerDialog
                open={isQRScannerOpen}
                onOpenChange={setIsQRScannerOpen}
                onScan={handleQRScan}
                title="Scan Visitor QR Code"
                description="Scan the visitor's QR code to quickly check them in for their tour."
            />
        </div>
    );
}
