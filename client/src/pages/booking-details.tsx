import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    Users,
    FileDown,
    Loader2,
    AlertCircle,
    Mail,
    Phone,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { SEO } from "@/components/seo";
import {
    formatDate,
    formatTime,
    formatCurrency,
    MEETING_POINTS,
    TOUR_TYPES
} from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Booking, Guide } from "@shared/schema";
import { jsPDF } from "jspdf";

interface BookingWithGuide extends Booking {
    guide?: Guide;
}

// Timeline component
function BookingTimeline({ bookingId }: { bookingId: string }) {
    const { data: activities, isLoading } = useQuery<{
        id: string;
        action: string;
        description: string | null;
        oldStatus: string | null;
        newStatus: string | null;
        createdAt: string;
    }[]>({
        queryKey: [`/api/bookings/${bookingId}/activity`],
        enabled: !!bookingId,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!activities || activities.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-2">
                No activity recorded yet.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {activities.map((activity, index) => (
                <div key={activity.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        {index < activities.length - 1 && (
                            <div className="w-0.5 h-full bg-border flex-1" />
                        )}
                    </div>
                    <div className="flex-1 pb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium capitalize">
                                {activity.action.replace(/_/g, " ")}
                            </span>
                            {activity.newStatus && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                    {activity.newStatus}
                                </span>
                            )}
                        </div>
                        {activity.description && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {activity.description}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

const getTourTypeName = (type: string) => {
    return type === "standard"
        ? "Standard Request"
        : type === "extended"
            ? "Extended Tour"
            : type === "custom"
                ? "Custom Tour"
                : type;
};

// PDF Generator function
const generateBookingPDF = (booking: BookingWithGuide, meetingPointName: string) => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Dzaleka Online Services', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Booking Confirmation', 105, 32, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Booking Reference heading
    doc.setFontSize(16);
    doc.text(`Reference: ${booking.bookingReference || 'Pending'}`, 20, 55);

    // Status badge
    const statusColors: Record<string, [number, number, number]> = {
        confirmed: [34, 197, 94],
        pending: [234, 179, 8],
        cancelled: [239, 68, 68],
        completed: [59, 130, 246],
    };
    const [r, g, b] = statusColors[booking.status || 'pending'] || [107, 114, 128];
    doc.setFillColor(r, g, b);
    doc.roundedRect(150, 48, 40, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text((booking.status || 'pending').toUpperCase(), 170, 56, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Visitor Details Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Visitor Details', 20, 75);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Name: ${booking.visitorName}`, 20, 85);
    doc.text(`Email: ${booking.visitorEmail}`, 20, 93);
    doc.text(`Phone: ${booking.visitorPhone || 'Not provided'}`, 20, 101);

    // Tour Details Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Tour Details', 20, 118);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Date: ${formatDate(booking.visitDate)}`, 20, 128);
    doc.text(`Time: ${formatTime(booking.visitTime)}`, 20, 136);
    doc.text(`Tour Type: ${getTourTypeName(booking.tourType)}`, 20, 144);
    doc.text(`Group Size: ${booking.numberOfPeople || 1} ${(booking.numberOfPeople || 1) === 1 ? 'person' : 'people'}`, 20, 152);
    doc.text(`Meeting Point: ${meetingPointName}`, 20, 160);

    // Payment Details Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Information', 20, 177);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Total Amount: ${formatCurrency(booking.totalAmount || 0)}`, 20, 187);
    doc.text(`Payment Status: ${(booking.paymentStatus || 'pending').charAt(0).toUpperCase() + (booking.paymentStatus || 'pending').slice(1)}`, 20, 195);
    doc.text(`Payment Method: ${booking.paymentMethod?.replace('_', ' ') || 'Cash'}`, 20, 203);

    // Footer
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 270, 210, 27, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Thank you for booking with Dzaleka Online Services', 105, 280, { align: 'center' });
    doc.setFontSize(8);
    doc.text('For questions, contact: info@mail.dzaleka.com | dzalekaconnect@gmail.com', 105, 288, { align: 'center' });

    // Save
    doc.save(`booking-${booking.bookingReference || booking.id}.pdf`);
};

export default function BookingDetails() {
    const [, params] = useRoute("/bookings/:id");
    const id = params?.id || "";
    const { toast } = useToast();

    const { data: booking, isLoading, error } = useQuery<BookingWithGuide>({
        queryKey: [`/api/bookings/${id}`],
        enabled: !!id,
    });

    const { data: meetingPoints } = useQuery<{ id: string, name: string }[]>({
        queryKey: ["/api/meeting-points"],
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ status }: { status: string }) => {
            await apiRequest("PATCH", `/api/bookings/${id}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/bookings/${id}`] });
            toast({
                title: "Status updated",
                description: "Booking status has been updated successfully.",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to update booking status.",
                variant: "destructive",
            });
        },
    });

    const getMeetingPointName = (mpId: string | null) => {
        if (!mpId) return "Not specified";
        if (meetingPoints) {
            const mp = meetingPoints.find((p) => p.id === mpId);
            if (mp) return mp.name;
        }
        return MEETING_POINTS.find((p) => p.id === mpId)?.name || "Meeting Point";
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Booking Not Found</h2>
                <p className="text-muted-foreground">The booking you're looking for doesn't exist.</p>
                <Button asChild>
                    <Link href="/bookings">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Bookings
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SEO
                title={`Booking #${booking.bookingReference || booking.id.slice(0, 8)}`}
                description="View booking details"
            />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/bookings">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            Booking #{booking.bookingReference || booking.id.slice(0, 8)}
                            <StatusBadge status={booking.status || "pending"} />
                        </h1>
                        <p className="text-muted-foreground">
                            Created on {booking.createdAt ? formatDate(booking.createdAt) : "N/A"}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {booking.status !== "cancelled" && (
                        <Button
                            variant="destructive"
                            onClick={() => updateStatusMutation.mutate({ status: "cancelled" })}
                        >
                            Cancel Booking
                        </Button>
                    )}
                    <Button size="sm" onClick={() => generateBookingPDF(booking, getMeetingPointName(booking.meetingPointId))}>
                        <FileDown className="mr-2 h-4 w-4" /> Export PDF
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Visitor Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Name</Label>
                                    <p className="font-medium">{booking.visitorName}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Email</Label>
                                    <p className="font-medium">{booking.visitorEmail}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Phone</Label>
                                    <p className="font-medium">{booking.visitorPhone || "N/A"}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Group Size</Label>
                                    <p className="font-medium">{booking.numberOfPeople} people</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tour Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Date</Label>
                                    <p className="flex items-center gap-2 font-medium">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        {formatDate(booking.visitDate)}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Time</Label>
                                    <p className="flex items-center gap-2 font-medium">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        {formatTime(booking.visitTime)}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Tour Type</Label>
                                    <p className="font-medium capitalize">{getTourTypeName(booking.tourType)}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Meeting Point</Label>
                                    <p className="flex items-center gap-2 font-medium">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        {getMeetingPointName(booking.meetingPointId)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {booking.guide ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Assigned Guide</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={booking.guide.profileImageUrl || undefined} />
                                        <AvatarFallback>{booking.guide.firstName[0]}{booking.guide.lastName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{booking.guide.firstName} {booking.guide.lastName}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Phone className="h-3 w-3" /> {booking.guide.phone}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="h-3 w-3" /> {booking.guide.email || "No email"}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Assigned Guide</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-100 dark:border-yellow-900/50">
                                    <AlertCircle className="h-5 w-5" />
                                    <p className="font-medium">No guide assigned yet</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm text-muted-foreground">Total Amount</span>
                                <span className="text-xl font-bold">{formatCurrency(booking.totalAmount || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm text-muted-foreground">Payment Status</span>
                                <PaymentStatusBadge status={booking.paymentStatus || "pending"} />
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-muted-foreground">Payment Method</span>
                                <span className="capitalize font-medium">{booking.paymentMethod?.replace(/_/g, " ") || "Cash"}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {(booking.specialRequests || booking.accessibilityNeeds) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {booking.specialRequests && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Special Requests</Label>
                                        <p className="text-sm mt-1 bg-muted p-2 rounded">{booking.specialRequests}</p>
                                    </div>
                                )}
                                {booking.accessibilityNeeds && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Accessibility Needs</Label>
                                        <p className="text-sm mt-1 bg-muted p-2 rounded">{booking.accessibilityNeeds}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <BookingTimeline bookingId={id} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
