import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate, formatTime } from "@/lib/constants";
import { getTransportRoute } from "@/lib/transport";
import {
    Calendar,
    Car,
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
    FileText,
    Eye,
    Globe2,
    Accessibility,
} from "lucide-react";
import type { Booking, GuideTourReport } from "@shared/schema";
import { QRScannerDialog } from "@/components/qr-scanner-dialog";

interface GuideTransportPartnerProfile {
    companyName?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
}

interface GuideTransportRequestSummary {
    route?: string | null;
    status?: string | null;
    quotedAmount?: number | null;
    currency?: string | null;
    driverName?: string | null;
    driverPhone?: string | null;
    vehicleDetails?: string | null;
    estimatedPickupTime?: string | null;
    requestedPickupTime?: string | null;
    partner?: GuideTransportPartnerProfile | null;
}

interface GuideTourBooking extends Booking {
    transportRequest?: GuideTransportRequestSummary | null;
}

const transportStatusLabels: Record<string, string> = {
    pending: "Requested",
    sent_to_partner: "Sent to partner",
    quote_sent: "Quote sent",
    accepted: "Accepted",
    visitor_approved: "Quote approved",
    visitor_declined: "Quote declined",
    confirmed: "Confirmed",
    reschedule_requested: "Reschedule requested",
    completed: "Completed",
    cancelled: "Cancelled",
};

function getTransportStatusLabel(status?: string | null) {
    const key = status || "pending";
    return transportStatusLabels[key] || key.replace(/_/g, " ");
}

function formatTransportQuote(request?: GuideTransportRequestSummary | null) {
    if (!request || request.quotedAmount == null) return null;
    return formatCurrency(request.quotedAmount, request.currency || "MWK");
}

function GuideTransportSummary({ request }: { request?: GuideTransportRequestSummary | null }) {
    if (!request) return null;

    const route = getTransportRoute(request.route);
    const quote = formatTransportQuote(request);
    const pickupTime = request.estimatedPickupTime || request.requestedPickupTime;
    const driverLine = [request.driverName, request.driverPhone, request.vehicleDetails].filter(Boolean).join(" - ");

    return (
        <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm dark:border-sky-800 dark:bg-sky-950/30">
            <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 gap-2">
                    <Car className="mt-0.5 h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden="true" />
                    <div className="min-w-0">
                        <p className="font-medium text-sky-900 dark:text-sky-100">
                            Transport {getTransportStatusLabel(request.status)}
                        </p>
                        <p className="mt-1 break-words text-xs text-sky-700 dark:text-sky-300">
                            {[route.shortLabel, request.partner?.companyName, pickupTime ? `Pickup ${formatTime(pickupTime)}` : null]
                                .filter(Boolean)
                                .join(" - ")}
                        </p>
                        {driverLine && (
                            <p className="mt-2 break-words text-xs text-sky-800 dark:text-sky-200">
                                {driverLine}
                            </p>
                        )}
                    </div>
                </div>
                {quote && (
                    <Badge variant="outline" className="shrink-0 border-sky-300 bg-background/80 text-sky-800 dark:border-sky-700 dark:text-sky-200">
                        {quote}
                    </Badge>
                )}
            </div>
        </div>
    );
}

export default function MyTours() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("upcoming");
    const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
    const [reportDialogTour, setReportDialogTour] = useState<GuideTourBooking | null>(null);
    const [reportForm, setReportForm] = useState({
        summary: "",
        visitorNeeds: "",
        incidents: "",
        followUpNeeded: false,
        privateNotes: "",
    });

    const { data: tours = [], isLoading } = useQuery<GuideTourBooking[]>({
        queryKey: ["/api/guides/me/tours"],
    });

    const { data: tourReports = [] } = useQuery<GuideTourReport[]>({
        queryKey: ["/api/guides/me/tour-reports"],
    });

    const checkInMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            const response = await apiRequest("POST", `/api/bookings/${bookingId}/guide-check-in`);
            return response.json();
        },
        onSuccess: (_data, bookingId) => {
            queryClient.invalidateQueries({ queryKey: ["/api/guides/me/tours"] });
            queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}`] });
            toast({ title: "Visitor checked in", description: "The tour is now in progress." });
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
        onSuccess: (_data, bookingId) => {
            queryClient.invalidateQueries({ queryKey: ["/api/guides/me/tours"] });
            queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}`] });
            queryClient.invalidateQueries({ queryKey: ["/api/guides/me"] });
            queryClient.invalidateQueries({ queryKey: ["/api/guides/me/earnings"] });
            toast({ title: "Tour completed", description: "The visitor has been checked out." });
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
        onSuccess: (_data, bookingId) => {
            queryClient.invalidateQueries({ queryKey: ["/api/guides/me/tours"] });
            queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}`] });
            toast({ title: "Marked as No-Show", description: "The visitor has been marked as a no-show." });
        },
        onError: (error: Error) => {
            toast({ title: "Failed", description: error.message, variant: "destructive" });
        },
    });

    const reportMutation = useMutation({
        mutationFn: async ({ bookingId, report }: { bookingId: string; report: typeof reportForm }) => {
            const response = await apiRequest("POST", `/api/bookings/${bookingId}/guide-report`, {
                summary: report.summary.trim(),
                visitorNeeds: report.visitorNeeds.trim() || null,
                incidents: report.incidents.trim() || null,
                followUpNeeded: report.followUpNeeded,
                privateNotes: report.privateNotes.trim() || null,
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/guides/me/tour-reports"] });
            setReportDialogTour(null);
            setReportForm({
                summary: "",
                visitorNeeds: "",
                incidents: "",
                followUpNeeded: false,
                privateNotes: "",
            });
            toast({ title: "Tour report saved", description: "Admin can now review your post-tour notes." });
        },
        onError: (error: Error) => {
            toast({ title: "Report failed", description: error.message, variant: "destructive" });
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

    const getReportForTour = (bookingId: string) =>
        tourReports.find(report => report.bookingId === bookingId);

    const openReportDialog = (tour: GuideTourBooking) => {
        const existingReport = getReportForTour(tour.id);
        setReportDialogTour(tour);
        setReportForm({
            summary: existingReport?.summary || "",
            visitorNeeds: existingReport?.visitorNeeds || "",
            incidents: existingReport?.incidents || "",
            followUpNeeded: existingReport?.followUpNeeded || false,
            privateNotes: existingReport?.privateNotes || "",
        });
    };

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

    const renderTourCard = (tour: GuideTourBooking) => {
        const report = getReportForTour(tour.id);

        return (
        <Card key={tour.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="break-words font-semibold">{tour.visitorName}</h3>
                                <p className="break-words text-sm text-muted-foreground">{tour.visitorOrganization || "Individual"}</p>
                            </div>
                        </div>
                        <div className="shrink-0">
                            <StatusBadge status={tour.status || "pending"} />
                        </div>
                    </div>

                    {/* Tour Details */}
                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
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
                        {tour.visitorCountry && (
                            <div className="flex min-w-0 items-center gap-2 text-muted-foreground sm:col-span-2">
                                <Globe2 className="h-4 w-4 shrink-0" />
                                <span className="break-words">{tour.visitorCountry}</span>
                            </div>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div className="border-t pt-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact Info</p>
                        <div className="flex flex-wrap gap-2">
                            {tour.visitorEmail && (
                                <a
                                    href={`mailto:${tour.visitorEmail}`}
                                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline max-w-[200px]"
                                >
                                    <Mail className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{tour.visitorEmail}</span>
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
                            <p className="break-words text-sm">{tour.specialRequests}</p>
                        </div>
                    )}

                    {tour.accessibilityNeeds && (
                        <div className="border-t pt-3">
                            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Accessibility Needs</p>
                            <p className="break-words text-sm">{tour.accessibilityNeeds}</p>
                        </div>
                    )}

                    <GuideTransportSummary request={tour.transportRequest} />

                    {/* Actions */}
                    <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:flex-wrap">
                        <Button
                            type="button"
                            variant="outline"
                            className="sm:flex-1"
                            asChild
                        >
                            <Link href={`/my-tours/${tour.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Visitor details
                            </Link>
                        </Button>
                        {tour.status === "confirmed" && (
                            <>
                                <Button
                                    onClick={() => checkInMutation.mutate(tour.id)}
                                    disabled={checkInMutation.isPending}
                                    className="sm:flex-1"
                                >
                                    {checkInMutation.isPending && checkInMutation.variables === tour.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Play className="mr-2 h-4 w-4" />
                                    )}
                                    Check in visitor
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => noShowMutation.mutate(tour.id)}
                                    disabled={noShowMutation.isPending}
                                    className="border-orange-200 text-orange-600 hover:bg-orange-50 sm:flex-1"
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
                                className="sm:flex-1"
                            >
                                {checkOutMutation.isPending && checkOutMutation.variables === tour.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                )}
                                Check out
                            </Button>
                        )}
                        {tour.status === "completed" && (
                            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    Completed on {formatDate(tour.checkOutTime || tour.visitDate)}
                                    {report && (
                                        <Badge variant={report.status === "action_required" ? "destructive" : "secondary"}>
                                            {report.status.replace(/_/g, " ")}
                                        </Badge>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant={report ? "outline" : "default"}
                                    size="sm"
                                    onClick={() => openReportDialog(tour)}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    {report ? "Update report" : "Submit report"}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
        );
    };

    const renderReportCard = (report: GuideTourReport) => {
        const booking = tours.find(t => t.id === report.bookingId);
        
        return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <h3 className="font-semibold truncate">
                                {booking?.visitorName || "Visitor"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {booking?.bookingReference || "Reference N/A"} · {booking ? formatDate(booking.visitDate) : (report.createdAt ? formatDate(report.createdAt) : "N/A")}
                            </p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                            {report.status === "submitted" ? (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                    Pending Review
                                </Badge>
                            ) : report.status === "reviewed" ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    Reviewed
                                </Badge>
                            ) : (
                                <Badge variant="destructive">
                                    Action Required
                                </Badge>
                            )}
                            {report.followUpNeeded && (
                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                                    Follow-up
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 border-t pt-3">
                        <div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Summary</span>
                            <p className="mt-0.5 text-sm text-foreground line-clamp-3 break-words">{report.summary}</p>
                        </div>

                        {report.visitorNeeds && (
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visitor Needs</span>
                                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 break-words">{report.visitorNeeds}</p>
                            </div>
                        )}

                        {report.incidents && (
                            <div className="rounded-md border border-amber-200 bg-amber-50 p-2 dark:border-amber-900/50 dark:bg-amber-950/20 text-xs">
                                <span className="font-semibold text-amber-800 dark:text-amber-300">Incidents/Concerns:</span>
                                <p className="mt-0.5 text-amber-900 dark:text-amber-200 break-words line-clamp-2">{report.incidents}</p>
                            </div>
                        )}

                        {report.privateNotes && (
                            <div className="rounded-md border p-2 bg-muted/40 text-xs">
                                <span className="font-semibold text-muted-foreground">Private Notes (Admin only):</span>
                                <p className="mt-0.5 text-muted-foreground break-words line-clamp-2">{report.privateNotes}</p>
                            </div>
                        )}

                        {report.adminReviewNotes && (
                            <div className="rounded-md border border-primary/20 bg-primary/5 p-2 text-xs">
                                <span className="font-semibold text-primary">Admin Feedback:</span>
                                <p className="mt-0.5 text-foreground italic break-words line-clamp-2">{report.adminReviewNotes}</p>
                            </div>
                        )}
                    </div>

                    {booking && (
                        <div className="flex items-center gap-2 pt-3 border-t">
                            <Button size="sm" variant="outline" className="h-8 flex-1" asChild>
                                <Link href={`/my-tours/${booking.id}`}>
                                    Visitor details
                                </Link>
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 flex-1"
                                onClick={() => openReportDialog(booking)}
                            >
                                <FileText className="mr-1.5 h-3.5 w-3.5" />
                                Edit report
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">My Tours</h1>
                    <Button
                        variant="outline"
                        onClick={() => setIsQRScannerOpen(true)}
                        className="w-full sm:w-auto"
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
            <div className="grid gap-4 sm:grid-cols-4">
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
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-blue-500">{tourReports.length}</div>
                        <div className="text-sm text-muted-foreground">Reports Submitted</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="min-h-10 w-full justify-start overflow-x-auto sm:w-auto">
                    <TabsTrigger value="upcoming">
                        Upcoming ({upcomingTours.length})
                    </TabsTrigger>
                    <TabsTrigger value="in_progress">
                        In Progress ({inProgressTours.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                        Completed ({completedTours.length})
                    </TabsTrigger>
                    <TabsTrigger value="reports">
                        Reports History ({tourReports.length})
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

                <TabsContent value="reports" className="mt-4">
                    {tourReports.length === 0 ? (
                        <EmptyState
                            icon={FileText}
                            title="No reports submitted"
                            description="You haven't submitted any post-tour reports yet."
                            className="py-12"
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {tourReports.map(renderReportCard)}
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

            <Dialog open={!!reportDialogTour} onOpenChange={(open) => !open && setReportDialogTour(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Post-Tour Report</DialogTitle>
                        <DialogDescription>
                            Record anything admin should know after the visit.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {reportDialogTour && (
                            <div className="rounded-md border bg-muted/40 p-3 text-sm">
                                <p className="font-medium">{reportDialogTour.visitorName}</p>
                                <p className="text-muted-foreground">
                                    {formatDate(reportDialogTour.visitDate)} at {formatTime(reportDialogTour.visitTime)}
                                </p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="tour-report-summary">Tour summary</Label>
                            <Textarea
                                id="tour-report-summary"
                                value={reportForm.summary}
                                onChange={(event) => setReportForm((current) => ({ ...current, summary: event.target.value }))}
                                placeholder="Summarize how the tour went, visitor engagement, and main outcomes…"
                                rows={5}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tour-report-needs">Visitor needs or follow-up</Label>
                            <Textarea
                                id="tour-report-needs"
                                value={reportForm.visitorNeeds}
                                onChange={(event) => setReportForm((current) => ({ ...current, visitorNeeds: event.target.value }))}
                                placeholder="Accessibility, interests, questions, or support the visitor requested…"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tour-report-incidents">Incidents or concerns</Label>
                            <Textarea
                                id="tour-report-incidents"
                                value={reportForm.incidents}
                                onChange={(event) => setReportForm((current) => ({ ...current, incidents: event.target.value }))}
                                placeholder="Safety concerns, delays, no-shows, transport issues, or anything unusual…"
                                rows={3}
                            />
                        </div>
                        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border p-3 text-sm">
                            <Checkbox
                                checked={reportForm.followUpNeeded}
                                onCheckedChange={(checked) => setReportForm((current) => ({ ...current, followUpNeeded: checked === true }))}
                            />
                            <span>Admin follow-up is needed</span>
                        </label>
                        <div className="space-y-2">
                            <Label htmlFor="tour-report-private">Private admin notes</Label>
                            <Textarea
                                id="tour-report-private"
                                value={reportForm.privateNotes}
                                onChange={(event) => setReportForm((current) => ({ ...current, privateNotes: event.target.value }))}
                                placeholder="Internal notes for the Visit Dzaleka team…"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setReportDialogTour(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={!reportForm.summary.trim() || reportForm.summary.trim().length < 10 || reportMutation.isPending}
                            onClick={() => {
                                if (!reportDialogTour) return;
                                reportMutation.mutate({ bookingId: reportDialogTour.id, report: reportForm });
                            }}
                        >
                            {reportMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <FileText className="mr-2 h-4 w-4" />
                            )}
                            Save report
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
