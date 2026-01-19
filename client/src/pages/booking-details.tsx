import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
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
import type { Booking, Guide, Zone, PointOfInterest, AnalyticsSetting, Itinerary } from "@shared/schema";
import { useEffect } from "react";
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

function ConversionTracker({ booking, html }: { booking: Booking, html: string }) {
    useEffect(() => {
        if (!html) return;

        const key = `tracked_booking_${booking.id}`;
        if (sessionStorage.getItem(key)) return;

        // Replace placeholders
        const firstName = booking.visitorName ? booking.visitorName.split(' ')[0] : "";
        const lastName = booking.visitorName && booking.visitorName.includes(' ') ? booking.visitorName.split(' ').slice(1).join(' ') : "";

        let processedHtml = html
            .replace(/{FIRSTNAME}/g, firstName)
            .replace(/{LASTNAME}/g, lastName)
            .replace(/{EMAIL}/g, booking.visitorEmail || "")
            .replace(/{TOTALPAID}/g, (booking.totalAmount || 0).toString())
            .replace(/{BOOKINGNUMBER}/g, booking.bookingReference || "");

        // 1. Create hidden div to load non-script elements (like img pixels)
        const trackerDiv = document.createElement("div");
        trackerDiv.style.display = "none";
        trackerDiv.innerHTML = processedHtml;
        document.body.appendChild(trackerDiv);

        // 2. Extract and execute scripts (innerHTML scripts don't run automatically)
        const embeddedScripts = trackerDiv.getElementsByTagName("script");
        Array.from(embeddedScripts).forEach(script => {
            const newScript = document.createElement("script");
            Array.from(script.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(script.innerHTML));
            document.body.appendChild(newScript);
        });

        sessionStorage.setItem(key, "true");

        // Cleanup? Tracking scripts usually need to stay.

    }, [booking, html]);

    return null;
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

import { generateQRCodeDataURL } from "@/lib/qrcode";

// Premium PDF Generator function (async to support QR code generation)
const generateBookingPDF = async (booking: BookingWithGuide, meetingPointName: string) => {
    const doc = new jsPDF();
    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Generate QR code for booking reference
    let qrCodeDataUrl: string | null = null;
    if (booking.bookingReference) {
        try {
            qrCodeDataUrl = await generateQRCodeDataURL(booking.bookingReference, 120);
        } catch (error) {
            console.error('Failed to generate QR code for PDF:', error);
        }
    }

    // ===== HEADER WITH GRADIENT EFFECT =====
    doc.setFillColor(2, 132, 199);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 45, pageWidth, 5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('DZALEKA VISIT', pageWidth / 2, 22, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Tour Booking Confirmation', pageWidth / 2, 35, { align: 'center' });

    // ===== BOOKING REFERENCE & STATUS BAR =====
    doc.setTextColor(0, 0, 0);
    let yPos = 60;

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('BOOKING REFERENCE', margin, yPos);
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(booking.bookingReference || 'Pending Confirmation', margin, yPos + 10);

    const statusColors: Record<string, [number, number, number]> = {
        confirmed: [34, 197, 94],
        pending: [234, 179, 8],
        cancelled: [239, 68, 68],
        completed: [59, 130, 246],
    };
    const [r, g, b] = statusColors[booking.status || 'pending'] || [107, 114, 128];
    const statusText = (booking.status || 'pending').toUpperCase();
    const statusWidth = doc.getTextWidth(statusText) + 16;
    doc.setFillColor(r, g, b);
    doc.roundedRect(pageWidth - margin - statusWidth, yPos - 5, statusWidth, 18, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, pageWidth - margin - statusWidth / 2, yPos + 5, { align: 'center' });

    yPos += 20;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    const leftColX = margin;
    const rightColX = 115;
    const colWidth = 75;

    // Helper function for section headers
    const drawSectionHeader = (text: string, x: number, y: number) => {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y - 5, colWidth, 10, 2, 2, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text(text.toUpperCase(), x + 3, y + 2);
        return y + 10;
    };

    // Helper for detail rows
    const drawDetail = (label: string, value: string, x: number, y: number) => {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(label, x, y);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(value || 'N/A', x, y + 5);
        return y + 12;
    };

    let leftY = yPos;
    leftY = drawSectionHeader('Visitor Details', leftColX, leftY);
    leftY = drawDetail('Full Name', booking.visitorName, leftColX, leftY);
    leftY = drawDetail('Email Address', booking.visitorEmail, leftColX, leftY);
    leftY = drawDetail('Phone Number', booking.visitorPhone || 'Not provided', leftColX, leftY);
    leftY += 5;

    leftY = drawSectionHeader('Tour Details', leftColX, leftY);
    leftY = drawDetail('Visit Date', formatDate(booking.visitDate), leftColX, leftY);
    leftY = drawDetail('Start Time', formatTime(booking.visitTime), leftColX, leftY);
    leftY = drawDetail('Tour Type', getTourTypeName(booking.tourType), leftColX, leftY);
    leftY = drawDetail('Group Size', `${booking.numberOfPeople || 1} ${(booking.numberOfPeople || 1) === 1 ? 'person' : 'people'}`, leftColX, leftY);
    leftY = drawDetail('Meeting Point', meetingPointName, leftColX, leftY);

    let rightY = yPos;
    rightY = drawSectionHeader('Payment Details', rightColX, rightY);
    rightY = drawDetail('Total Amount', formatCurrency(booking.totalAmount || 0), rightColX, rightY);
    rightY = drawDetail('Payment Status', (booking.paymentStatus || 'pending').charAt(0).toUpperCase() + (booking.paymentStatus || 'pending').slice(1), rightColX, rightY);
    rightY = drawDetail('Payment Method', booking.paymentMethod?.replace('_', ' ') || 'Cash on Arrival', rightColX, rightY);

    if (qrCodeDataUrl) {
        rightY = drawSectionHeader('Check-in QR Code', rightColX, rightY);
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(1);
        doc.roundedRect(rightColX + 10, rightY, 55, 55, 3, 3, 'S');
        doc.addImage(qrCodeDataUrl, 'PNG', rightColX + 12.5, rightY + 2.5, 50, 50);
        rightY += 58;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Present this code at check-in', rightColX + 37.5, rightY, { align: 'center' });
    }

    // ===== SPECIAL REQUESTS SECTION (Dynamic positioning) =====
    const specialY = Math.max(leftY, rightY) + 5;
    if (booking.specialRequests) {
        doc.setFillColor(254, 249, 195); // Light yellow
        doc.roundedRect(margin, specialY, contentWidth, 25, 3, 3, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(161, 98, 7);
        doc.text('SPECIAL REQUESTS', margin + 5, specialY + 8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(booking.specialRequests, contentWidth - 10);
        doc.text(splitText.slice(0, 2), margin + 5, specialY + 17);
    }


    doc.setFillColor(31, 41, 55);
    doc.rect(0, 265, pageWidth, 32, 'F');
    doc.setFillColor(2, 132, 199);
    doc.rect(0, 265, pageWidth, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Thank you for choosing Dzaleka Visit!', pageWidth / 2, 276, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Questions? Contact us at info@mail.dzaleka.com | +61 4989 56 715', pageWidth / 2, 285, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('visit.dzaleka.com', pageWidth / 2, 292, { align: 'center' });

    doc.save(`DzalekaVisit-${booking.bookingReference || booking.id}.pdf`);
};



export default function BookingDetails() {
    const { user } = useAuth();
    const [, params] = useRoute("/bookings/:id");
    const id = params?.id || "";
    const { toast } = useToast();

    const { data: booking, isLoading, error } = useQuery<BookingWithGuide>({
        queryKey: [`/api/bookings/${id}`],
        enabled: !!id,
    });

    const { data: itinerary } = useQuery<Itinerary>({
        queryKey: [`/api/bookings/${id}/itinerary`],
        retry: false,
        enabled: !!id
    });

    const { data: meetingPoints } = useQuery<{ id: string, name: string }[]>({
        queryKey: ["/api/public/meeting-points"],
    });

    const { data: zones } = useQuery<Zone[]>({
        queryKey: ["/api/public/zones"],
    });

    const { data: pointsOfInterest } = useQuery<PointOfInterest[]>({
        queryKey: ["/api/public/points-of-interest"],
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

    const getZoneName = (zoneId: string) => {
        if (zones) {
            const zone = zones.find((z) => z.id === zoneId);
            if (zone) return zone.name;
        }
        return "Unknown Zone";
    };

    const getPoiName = (poiId: string) => {
        if (pointsOfInterest) {
            const poi = pointsOfInterest.find((p) => p.id === poiId);
            if (poi) return poi.name;
        }
        return poiId;
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
                <SEO
                    title="Booking Not Found | Visit Dzaleka"
                    description="The booking you are looking for does not exist."
                    robots="noindex"
                />
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
                    {(user?.role === "admin" || user?.role === "coordinator") && (
                        <Button size="sm" variant="outline" asChild>
                            <Link href={`/itinerary-builder/${booking.id}`}>
                                <Mail className="mr-2 h-4 w-4" /> Send Proposal
                            </Link>
                        </Button>
                    )}
                    {itinerary && (
                        <Button size="sm" variant="outline" asChild>
                            <Link href={`/bookings/${booking.id}/itinerary`}>
                                <FileDown className="mr-2 h-4 w-4" /> View Itinerary
                            </Link>
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

                    {/* Selected Areas Card */}
                    {((booking.selectedZones && booking.selectedZones.length > 0) || (booking.selectedInterests && booking.selectedInterests.length > 0)) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Areas of Interest</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {booking.selectedZones && booking.selectedZones.length > 0 && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Camp Zones</Label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {(booking.selectedZones as string[]).map((zoneId) => (
                                                <Badge key={zoneId} variant="secondary">{getZoneName(zoneId)}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {booking.selectedInterests && booking.selectedInterests.length > 0 && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Points of Interest</Label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {(booking.selectedInterests as string[]).map((poiId) => (
                                                <Badge key={poiId} variant="outline">{getPoiName(poiId)}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

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
