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
    Send,
    UserCheck,
    LogOut,
    UserPlus,
    Ban,
    ClipboardCheck,
    Compass,
    Play,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Booking, CommunityListing, Guide, Zone, PointOfInterest, AnalyticsSetting, Itinerary, EmailLog } from "@shared/schema";
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";

interface TransportRequestSummary {
    id: string;
    bookingId?: string | null;
    partnerId?: string | null;
    route?: string | null;
    pickupLocation?: string | null;
    notes?: string | null;
    status?: string | null;
    quotedAmount?: number | null;
    currency?: string | null;
    quoteSentAt?: string | Date | null;
    quoteDecision?: string | null;
    quoteDecisionAt?: string | Date | null;
    quoteDecisionNotes?: string | null;
    estimatedPickupTime?: string | null;
    requestedPickupTime?: string | null;
    requestedVisitDate?: string | Date | null;
    rescheduleNotes?: string | null;
    driverName?: string | null;
    driverPhone?: string | null;
    vehicleDetails?: string | null;
    partnerNotes?: string | null;
    adminNotes?: string | null;
    cancellationReason?: string | null;
    cancelledAt?: string | Date | null;
    assignedAt?: string | Date | null;
    assignedByUserId?: string | null;
    createdByUserId?: string | null;
    partnerRespondedAt?: string | Date | null;
    createdAt?: string | Date | null;
    updatedAt?: string | Date | null;
    partner?: {
        companyName?: string | null;
        contactName?: string | null;
        email?: string | null;
        phone?: string | null;
        whatsapp?: string | null;
        preferredContactMethod?: string | null;
    } | null;
}

interface BookingWithGuide extends Booking {
    guide?: Guide | null;
    transportRequest?: TransportRequestSummary | null;
    meetingPoint?: { id: string; name: string } | null;
}

const CANCELLATION_REASONS = [
    { value: "guide_unavailable", label: "Guide unavailable" },
    { value: "access_or_public_holiday", label: "Activity not accessible" },
    { value: "minimum_participants_not_met", label: "Minimum participants not reached" },
    { value: "weather_or_safety", label: "Weather or safety issue" },
    { value: "customer_requested", label: "Visitor requested cancellation" },
    { value: "other", label: "Other operational reason" },
];

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

function EmailTimeline({ bookingId }: { bookingId: string }) {
    const { data: emails, isLoading } = useQuery<EmailLog[]>({
        queryKey: [`/api/bookings/${bookingId}/email-timeline`],
        enabled: !!bookingId,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!emails || emails.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-2">
                No email events recorded yet.
            </p>
        );
    }

    const statusVariant = (status?: string | null) =>
        ["failed", "bounced", "complaint"].includes(status || "") ? "destructive" : "secondary";

    return (
        <div className="space-y-3">
            {emails.map((email, index) => (
                <div key={email.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        {index < emails.length - 1 && (
                            <div className="w-0.5 h-full bg-border flex-1" />
                        )}
                    </div>
                    <div className="flex-1 pb-3 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium capitalize">
                                {(email.templateType || "custom").replace(/_/g, " ")}
                            </span>
                            <Badge variant={statusVariant(email.status)} className="capitalize">
                                {(email.status || "sent").replace(/_/g, " ")}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">
                            {email.subject}
                        </p>
                        {email.errorMessage && (
                            <p className="text-xs text-destructive mt-1 break-words">
                                {email.errorMessage}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            {email.createdAt ? new Date(email.createdAt).toLocaleString() : "Unknown"}
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

const formatDateTime = (value?: string | Date | null) => {
    if (!value) return "Not recorded";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not recorded";
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
};

const formatLabel = (value?: string | null) => {
    if (!value) return "Not provided";
    return value.replace(/[_-]/g, " ");
};

const paymentDetailsToRows = (details: unknown) => {
    if (!details || typeof details !== "object" || Array.isArray(details)) {
        return [];
    }

    return Object.entries(details as Record<string, unknown>)
        .filter(([, value]) => value !== null && value !== undefined && value !== "")
        .map(([key, value]) => ({
            key: formatLabel(key),
            value: typeof value === "object" ? JSON.stringify(value) : String(value),
        }));
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
        } catch {
            // QR code generation failed - PDF will be created without it
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
    doc.text('Thank you for choosing Visit Dzaleka!', pageWidth / 2, 276, { align: 'center' });
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
    const isAdminOrCoordinator = user?.role === "admin" || user?.role === "coordinator";
    const canCheckVisitors = isAdminOrCoordinator || user?.role === "security";
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [selectedGuideId, setSelectedGuideId] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const [paymentReference, setPaymentReference] = useState("");
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [emailSubject, setEmailSubject] = useState("");
    const [emailMessage, setEmailMessage] = useState("");
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isCommunityHighlightsOpen, setIsCommunityHighlightsOpen] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("customer_requested");
    const [cancellationNote, setCancellationNote] = useState("");

    const { data: booking, isLoading, error } = useQuery<BookingWithGuide>({
        queryKey: [`/api/bookings/${id}`],
        enabled: !!id,
    });

    const { data: guides = [] } = useQuery<Guide[]>({
        queryKey: ["/api/guides"],
        enabled: isAdminOrCoordinator,
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
        queryKey: ["/api/zones"],
    });

    const { data: pointsOfInterest } = useQuery<PointOfInterest[]>({
        queryKey: ["/api/points-of-interest"],
    });

    const { data: communityListings = [] } = useQuery<CommunityListing[]>({
        queryKey: ["/api/public/community-listings"],
    });

    useEffect(() => {
        if (!booking) return;
        setAdminNotes(booking.adminNotes || "");
        setPaymentReference(booking.paymentReference || "");
        setSelectedGuideId(booking.assignedGuideId || "");
    }, [booking?.id, booking?.adminNotes, booking?.paymentReference, booking?.assignedGuideId]);

    const invalidateBookingRecord = () => {
        queryClient.invalidateQueries({ queryKey: [`/api/bookings/${id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/bookings/${id}/activity`] });
        queryClient.invalidateQueries({ queryKey: [`/api/bookings/${id}/email-timeline`] });
        queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    };

    const updateStatusMutation = useMutation({
        mutationFn: async ({
            status,
            cancellationCategory,
            cancellationReason,
            cancellationNote,
        }: {
            status: string;
            cancellationCategory?: string;
            cancellationReason?: string;
            cancellationNote?: string;
        }) => {
            await apiRequest("PATCH", `/api/bookings/${id}/status`, {
                status,
                cancellationCategory,
                cancellationReason,
                cancellationNote,
            });
        },
        onSuccess: () => {
            invalidateBookingRecord();
            setIsCancelOpen(false);
            setCancellationReason("customer_requested");
            setCancellationNote("");
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

    const assignGuideMutation = useMutation({
        mutationFn: async (guideId: string) => {
            await apiRequest("PATCH", `/api/bookings/${id}/assign`, { guideId });
        },
        onSuccess: () => {
            invalidateBookingRecord();
            setIsAssignOpen(false);
            toast({
                title: "Guide assigned",
                description: "The booking guide has been updated.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to assign guide",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateNotesMutation = useMutation({
        mutationFn: async (notes: string) => {
            await apiRequest("PATCH", `/api/bookings/${id}/notes`, { adminNotes: notes });
        },
        onSuccess: () => {
            invalidateBookingRecord();
            toast({
                title: "Notes saved",
                description: "Internal booking notes have been updated.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to save notes",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updatePaymentMutation = useMutation({
        mutationFn: async ({
            paymentStatus,
            paymentReference,
            approvalConfirmed,
        }: {
            paymentStatus: string;
            paymentReference?: string;
            approvalConfirmed?: boolean;
        }) => {
            await apiRequest("PATCH", `/api/bookings/${id}/payment`, {
                paymentStatus,
                paymentReference,
                approvalConfirmed,
            });
        },
        onSuccess: () => {
            invalidateBookingRecord();
            toast({
                title: "Payment updated",
                description: "Payment details have been saved.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to update payment",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const checkInMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", `/api/bookings/${id}/check-in`);
        },
        onSuccess: () => {
            invalidateBookingRecord();
            toast({ title: "Visitor checked in", description: "The check-in time has been recorded." });
        },
        onError: (error: Error) => {
            toast({ title: "Check-in failed", description: error.message, variant: "destructive" });
        },
    });

    const checkOutMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", `/api/bookings/${id}/check-out`);
        },
        onSuccess: () => {
            invalidateBookingRecord();
            toast({ title: "Visitor checked out", description: "The check-out time has been recorded." });
        },
        onError: (error: Error) => {
            toast({ title: "Check-out failed", description: error.message, variant: "destructive" });
        },
    });

    const noShowMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", `/api/bookings/${id}/no-show`);
        },
        onSuccess: () => {
            invalidateBookingRecord();
            toast({ title: "Marked no-show", description: "The booking was marked as no-show." });
        },
        onError: (error: Error) => {
            toast({ title: "No-show failed", description: error.message, variant: "destructive" });
        },
    });

    const startTourMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", `/api/bookings/${id}/start`);
        },
        onSuccess: () => {
            invalidateBookingRecord();
            toast({ title: "Tour started", description: "The booking is now marked in progress." });
        },
        onError: (error: Error) => {
            toast({ title: "Start failed", description: error.message, variant: "destructive" });
        },
    });

    const completeMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", `/api/bookings/${id}/complete`);
        },
        onSuccess: () => {
            invalidateBookingRecord();
            toast({ title: "Booking completed", description: "The tour was marked completed." });
        },
        onError: (error: Error) => {
            toast({ title: "Completion failed", description: error.message, variant: "destructive" });
        },
    });

    const sendEmailMutation = useMutation({
        mutationFn: async ({
            recipientName,
            recipientEmail,
            subject,
            message,
        }: {
            recipientName: string;
            recipientEmail: string;
            subject: string;
            message: string;
        }) => {
            await apiRequest("POST", "/api/send-email", {
                recipientName,
                recipientEmail,
                subject,
                message,
            });
        },
        onSuccess: () => {
            setIsEmailOpen(false);
            setEmailSubject("");
            setEmailMessage("");
            queryClient.invalidateQueries({ queryKey: ["/api/email-logs"] });
            toast({ title: "Email sent", description: "Your email has been sent successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Failed to send email", description: error.message, variant: "destructive" });
        },
    });

    const resendBookingEmailMutation = useMutation({
        mutationFn: async (type: string) => {
            await apiRequest("POST", `/api/bookings/${id}/resend-email`, { type });
        },
        onSuccess: () => {
            invalidateBookingRecord();
            queryClient.invalidateQueries({ queryKey: ["/api/email-logs"] });
            toast({
                title: "Email resent",
                description: "The selected booking email has been queued again.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to resend email",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateCommunityHighlightsMutation = useMutation({
        mutationFn: async (selectedCommunityListings: string[]) => {
            await apiRequest("PATCH", `/api/bookings/${id}/community-highlights`, {
                selectedCommunityListings,
            });
        },
        onSuccess: () => {
            invalidateBookingRecord();
            toast({
                title: "Community highlights updated",
                description: "The visitor's Community Hub suggestions have been saved.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to update highlights",
                description: error.message,
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
        // Fallback: format snake_case IDs
        return zoneId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };

    const getPoiName = (poiId: string) => {
        if (pointsOfInterest) {
            const poi = pointsOfInterest.find((p) => p.id === poiId);
            if (poi) return poi.name;
        }
        // Fallback: format snake_case IDs
        return poiId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };

    const getCommunityListing = (listingId: string) => communityListings.find((listing) => listing.id === listingId);

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

    const selectedCommunityListingIds = booking.selectedCommunityListings || [];
    const toggleCommunityListing = (listingId: string) => {
        const nextIds = selectedCommunityListingIds.includes(listingId)
            ? selectedCommunityListingIds.filter((selectedId) => selectedId !== listingId)
            : [...selectedCommunityListingIds, listingId];
        updateCommunityHighlightsMutation.mutate(nextIds);
    };

	    const voucherChecklist = [
        {
            label: "Tour title",
            done: Boolean(booking.tourType),
            detail: getTourTypeName(booking.tourType),
        },
        {
            label: "Date and time",
            done: Boolean(booking.visitDate && booking.visitTime),
            detail: `${formatDate(booking.visitDate)} at ${formatTime(booking.visitTime)}`,
        },
        {
            label: "Meeting point",
            done: Boolean(booking.meetingPointId),
            detail: getMeetingPointName(booking.meetingPointId),
        },
        {
            label: "Visitor contact",
            done: Boolean(booking.visitorEmail || booking.visitorPhone),
            detail: booking.visitorEmail || booking.visitorPhone || "Missing visitor contact",
        },
        {
            label: "Guide contact",
            done: Boolean(booking.guide?.phone || booking.guide?.email),
            detail: booking.guide ? `${booking.guide.firstName} ${booking.guide.lastName}` : "No guide assigned",
        },
        {
            label: "Payment state",
            done: booking.paymentStatus === "paid",
            detail: booking.paymentStatus || "pending",
        },
    ];
    const voucherReadyCount = voucherChecklist.filter((item) => item.done).length;
    const guideName = booking.guide
        ? `${booking.guide.firstName} ${booking.guide.lastName}`.trim()
        : "";
    const workflowNextStep = (() => {
        if (booking.status === "cancelled") return "Review cancellation and refund/support follow-up";
        if (booking.status === "pending") return "Confirm or cancel the booking request";
        if (!booking.assignedGuideId) return "Assign a guide";
        if (booking.paymentStatus !== "paid") return "Follow up payment verification";
        if (voucherReadyCount < voucherChecklist.length) return "Complete voucher details";
        if (booking.status === "confirmed") return "Ready for check-in";
        if (booking.status === "in_progress") return "Check visitor out when the tour ends";
        if (booking.status === "completed") return "Send feedback request or review follow-up";
        return "Review booking details";
    })();
    const workflowStateItems = [
        {
            label: "Booking status",
            value: (booking.status || "pending").replace(/_/g, " "),
            detail: booking.status === "cancelled"
                ? booking.cancellationReason || "Cancelled"
                : `Visit ${formatDate(booking.visitDate)} at ${formatTime(booking.visitTime)}`,
        },
        {
            label: "Payment",
            value: (booking.paymentStatus || "pending").replace(/_/g, " "),
            detail: booking.paymentReference
                ? `Reference ${booking.paymentReference}`
                : booking.paymentStatus === "paid"
                    ? "Payment marked paid"
                    : "No payment reference yet",
        },
        {
            label: "Guide",
            value: guideName || "Unassigned",
            detail: booking.guide?.phone || booking.guide?.email || "Assign or confirm guide contact",
        },
        {
            label: "Voucher readiness",
            value: `${voucherReadyCount}/${voucherChecklist.length} ready`,
            detail: voucherReadyCount === voucherChecklist.length
                ? "Ready to export"
                : "Complete missing visitor-facing details",
        },
    ];
    const paymentDetailRows = paymentDetailsToRows(booking.paymentDetails);
    const transportRequest = booking.transportRequest;
    const canManageBooking = isAdminOrCoordinator;
    const anyActionPending =
        updateStatusMutation.isPending ||
        checkInMutation.isPending ||
        checkOutMutation.isPending ||
        noShowMutation.isPending ||
        startTourMutation.isPending ||
        completeMutation.isPending;
    const submitCancellation = () => {
        const reason = CANCELLATION_REASONS.find((item) => item.value === cancellationReason);
        updateStatusMutation.mutate({
            status: "cancelled",
            cancellationCategory: cancellationReason,
            cancellationReason: reason?.label || "Cancellation",
            cancellationNote: cancellationNote.trim() || undefined,
        });
    };
    const savePayment = (paymentStatus: string = booking.paymentStatus || "pending") => {
        if (paymentStatus === "paid" && booking.paymentStatus !== "paid") {
            const confirmed = window.confirm("Confirm payment approval: mark this booking as paid and send the visitor a receipt if applicable.");
            if (!confirmed) return;
            updatePaymentMutation.mutate({
                paymentStatus,
                paymentReference,
                approvalConfirmed: true,
            });
            return;
        }

        updatePaymentMutation.mutate({ paymentStatus, paymentReference });
    };

    return (
        <div className="space-y-6">
            <SEO
                title={`Booking #${booking.bookingReference || booking.id.slice(0, 8)}`}
                description="View booking details"
            />

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
                    <Button variant="ghost" size="icon" aria-label="Back to bookings" asChild>
                        <Link href="/bookings">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="min-w-0">
                        <h1 className="flex flex-wrap items-center gap-2 break-words text-xl font-bold sm:text-2xl">
                            <span className="min-w-0 break-all">Booking #{booking.bookingReference || booking.id.slice(0, 8)}</span>
                            <StatusBadge status={booking.status || "pending"} />
                        </h1>
                        <p className="text-muted-foreground">
                            Created on {booking.createdAt ? formatDate(booking.createdAt) : "N/A"}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
                    {canManageBooking && booking.status === "pending" && (
                        <Button
                            className="w-full sm:w-auto"
                            disabled={updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ status: "confirmed" })}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirm
                        </Button>
                    )}
                    {canManageBooking && booking.status !== "cancelled" && (
                        <Button
                            variant="destructive"
                            className="w-full sm:w-auto"
                            disabled={updateStatusMutation.isPending}
                            onClick={() => setIsCancelOpen(true)}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Booking
                        </Button>
                    )}
                    {canManageBooking && (
                        <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => setIsAssignOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            {booking.assignedGuideId ? "Change Guide" : "Assign Guide"}
                        </Button>
                    )}
                    {canManageBooking && (
                        <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => setIsEmailOpen(true)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Email Visitor
                        </Button>
                    )}
                    {canManageBooking && (
                        <Button size="sm" variant="outline" className="w-full sm:w-auto" asChild>
                            <Link href={`/itinerary-builder/${booking.id}`}>
                                <Mail className="mr-2 h-4 w-4" /> Send Proposal
                            </Link>
                        </Button>
                    )}
                    {itinerary && (
                        <Button size="sm" variant="outline" className="w-full sm:w-auto" asChild>
                            <Link href={`/bookings/${booking.id}/itinerary`}>
                                <FileDown className="mr-2 h-4 w-4" /> View Itinerary
                            </Link>
                        </Button>
                    )}
                    <Button size="sm" className="w-full sm:w-auto" onClick={() => generateBookingPDF(booking, getMeetingPointName(booking.meetingPointId))}>
                        <FileDown className="mr-2 h-4 w-4" /> Export PDF
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <CardTitle>Booking Workflow Snapshot</CardTitle>
                        <CardDescription>Current state, next operational action, and details that affect visitor communication.</CardDescription>
                    </div>
                    <Badge variant={booking.status === "cancelled" ? "destructive" : "secondary"} className="w-fit">
                        Next: {workflowNextStep}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {workflowStateItems.map((item) => (
                            <div key={item.label} className="rounded-lg border p-4">
                                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                                <p className="mt-1 break-words text-sm font-semibold capitalize">{item.value}</p>
                                <p className="mt-2 break-words text-xs text-muted-foreground">{item.detail}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {(canManageBooking || canCheckVisitors) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Operational Actions</CardTitle>
                        <CardDescription>Manage confirmation, guide assignment, visitor movement, payment, and follow-up from this record.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {canManageBooking && booking.status === "pending" && (
                            <Button disabled={anyActionPending} onClick={() => updateStatusMutation.mutate({ status: "confirmed" })}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Confirm Booking
                            </Button>
                        )}
                        {canCheckVisitors && booking.status === "confirmed" && !booking.checkInTime && (
                            <Button disabled={checkInMutation.isPending} onClick={() => checkInMutation.mutate()}>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Check In Visitor
                            </Button>
                        )}
                        {canCheckVisitors && booking.checkInTime && !booking.checkOutTime && booking.status !== "completed" && (
                            <Button variant="secondary" disabled={checkOutMutation.isPending} onClick={() => checkOutMutation.mutate()}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Check Out Visitor
                            </Button>
                        )}
                        {canManageBooking && booking.status === "confirmed" && (
                            <Button variant="outline" disabled={startTourMutation.isPending} onClick={() => startTourMutation.mutate()}>
                                <Play className="mr-2 h-4 w-4" />
                                Start Tour
                            </Button>
                        )}
                        {canManageBooking && booking.status === "in_progress" && (
                            <Button variant="outline" disabled={completeMutation.isPending} onClick={() => completeMutation.mutate()}>
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                Mark Completed
                            </Button>
                        )}
                        {canCheckVisitors && booking.status !== "cancelled" && booking.status !== "completed" && (
                            <Button
                                variant="outline"
                                disabled={noShowMutation.isPending}
                                onClick={() => {
                                    if (window.confirm("Mark this booking as no-show?")) {
                                        noShowMutation.mutate();
                                    }
                                }}
                            >
                                <Ban className="mr-2 h-4 w-4" />
                                Mark No-show
                            </Button>
                        )}
                        {canManageBooking && (
                            <Button variant="outline" onClick={() => setIsAssignOpen(true)}>
                                <Users className="mr-2 h-4 w-4" />
                                {booking.guide ? "Change Guide" : "Assign Guide"}
                            </Button>
                        )}
                        {canManageBooking && (
                            <Button variant="outline" onClick={() => setIsEmailOpen(true)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Email Visitor
                            </Button>
                        )}
                        {canManageBooking && booking.status !== "cancelled" && (
                            <Button variant="destructive" disabled={updateStatusMutation.isPending} onClick={() => setIsCancelOpen(true)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel Booking
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

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
                                <div className="min-w-0">
                                    <Label className="text-xs text-muted-foreground">Email</Label>
                                    <p className="break-all font-medium">{booking.visitorEmail}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Phone</Label>
                                    <p className="font-medium">{booking.visitorPhone || "N/A"}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Country</Label>
                                    <p className="font-medium">{booking.visitorCountry || "Not provided"}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Organization</Label>
                                    <p className="font-medium">{booking.visitorOrganization || "Not provided"}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Group Size</Label>
                                    <p className="font-medium">
                                        {booking.numberOfPeople || 1} {(booking.numberOfPeople || 1) === 1 ? "person" : "people"}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Visitor Account</Label>
                                    <p className="break-all font-medium">{booking.visitorUserId || "Not linked"}</p>
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
                                    <Label className="text-xs text-muted-foreground">Group Category</Label>
                                    <p className="font-medium capitalize">{formatLabel(booking.groupSize)}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Custom Duration</Label>
                                    <p className="font-medium">
                                        {booking.customDuration ? `${booking.customDuration} hours` : "Not requested"}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Meeting Point</Label>
                                    <p className="flex items-center gap-2 font-medium">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        {getMeetingPointName(booking.meetingPointId)}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Source</Label>
                                    <p className="font-medium capitalize">{formatLabel(booking.source || "direct")}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Referral Source</Label>
                                    <p className="font-medium capitalize">{formatLabel(booking.referralSource)}</p>
                                </div>
                                <div className="min-w-0">
                                    <Label className="text-xs text-muted-foreground">External Reference</Label>
                                    <p className="break-all font-medium">{booking.externalReferenceId || "Not provided"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selected Areas Card */}
	                    {((booking.selectedZones && booking.selectedZones.length > 0) || (booking.selectedInterests && booking.selectedInterests.length > 0) || selectedCommunityListingIds.length > 0 || canManageBooking) && (
	                        <Card>
	                            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
	                                <div>
	                                    <CardTitle>Areas of Interest</CardTitle>
	                                    <CardDescription>Visitor preferences and Community Hub suggestions for planning.</CardDescription>
	                                </div>
	                                {canManageBooking && (
	                                    <Button
	                                        type="button"
	                                        variant="outline"
	                                        size="sm"
	                                        onClick={() => setIsCommunityHighlightsOpen(true)}
	                                    >
	                                        <Compass className="mr-2 h-4 w-4" />
	                                        Manage Highlights
	                                    </Button>
	                                )}
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
	                                {selectedCommunityListingIds.length > 0 ? (
	                                    <div>
	                                        <Label className="text-xs text-muted-foreground">Community Hub Highlights</Label>
	                                        <div className="mt-2 flex flex-wrap gap-2">
	                                            {selectedCommunityListingIds.map((listingId) => {
	                                                const listing = getCommunityListing(listingId);
	                                                return (
	                                                    <Link
	                                                        key={listingId}
	                                                        href={`/community-hub/${listingId}`}
	                                                        className="inline-flex max-w-full items-center gap-1 rounded-md border bg-background px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
	                                                    >
	                                                        <span className="truncate">{listing?.name || getPoiName(listingId)}</span>
	                                                        {listing?.category && <span className="text-muted-foreground">- {listing.category}</span>}
	                                                    </Link>
	                                                );
	                                            })}
	                                        </div>
	                                    </div>
	                                ) : canManageBooking ? (
	                                    <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
	                                        No Community Hub highlights selected yet.
	                                    </div>
	                                ) : null}
	                            </CardContent>
	                        </Card>
	                    )}

                    {booking.guide ? (
                        <Card>
                            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <CardTitle>Assigned Guide</CardTitle>
                                    <CardDescription>Visible to staff and used for guide notifications.</CardDescription>
                                </div>
                                {canManageBooking && (
                                    <Button variant="outline" size="sm" onClick={() => setIsAssignOpen(true)}>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Change Guide
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="flex min-w-0 items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={booking.guide.profileImageUrl || undefined} />
                                        <AvatarFallback>{booking.guide.firstName[0]}{booking.guide.lastName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
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
                            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <CardTitle>Assigned Guide</CardTitle>
                                    <CardDescription>No guide assignment has been recorded yet.</CardDescription>
                                </div>
                                {canManageBooking && (
                                    <Button variant="outline" size="sm" onClick={() => setIsAssignOpen(true)}>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Assign Guide
                                    </Button>
                                )}
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
                    {booking.status === "cancelled" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Cancellation Details</CardTitle>
                                <CardDescription>Reason captured for staff follow-up and visitor support.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Category</Label>
                                        <p className="break-words text-sm font-medium">
                                            {booking.cancellationCategory?.replace(/_/g, " ") || "Not recorded"}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Cancelled At</Label>
                                        <p className="break-words text-sm font-medium">
                                            {booking.cancelledAt ? formatDate(booking.cancelledAt) : "Not recorded"}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Reason</Label>
                                    <p className="mt-1 break-words rounded-md bg-muted p-2 text-sm">
                                        {booking.cancellationReason || "No reason recorded."}
                                    </p>
                                </div>
                                {booking.cancellationNote && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Staff Note</Label>
                                        <p className="mt-1 break-words rounded-md bg-muted p-2 text-sm">
                                            {booking.cancellationNote}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Details</CardTitle>
                            <CardDescription>Track visitor payment state, verification, fees, and card details where available.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center gap-3 py-2 border-b">
                                <span className="text-sm text-muted-foreground">Total Amount</span>
                                <span className="text-xl font-bold">{formatCurrency(booking.totalAmount || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center gap-3 py-2 border-b">
                                <span className="text-sm text-muted-foreground">Payment Status</span>
                                <PaymentStatusBadge status={booking.paymentStatus || "pending"} />
                            </div>
                            <div className="flex justify-between items-center gap-3 py-2 border-b">
                                <span className="text-sm text-muted-foreground">Payment Method</span>
                                <span className="capitalize font-medium">{booking.paymentMethod?.replace(/_/g, " ") || "Cash"}</span>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Payment Reference</Label>
                                    {canManageBooking ? (
                                        <Input
                                            className="mt-1"
                                            value={paymentReference}
                                            onChange={(event) => setPaymentReference(event.target.value)}
                                            placeholder="Stripe session, receipt, or cash reference…"
                                        />
                                    ) : (
                                        <p className="break-all text-sm font-medium">{booking.paymentReference || "Not recorded"}</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Verified At</Label>
                                    <p className="text-sm font-medium">{formatDateTime(booking.paymentVerifiedAt)}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Payment Fees</Label>
                                    <p className="text-sm font-medium">{formatCurrency(booking.paymentFees || 0)}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Net Amount</Label>
                                    <p className="text-sm font-medium">{formatCurrency(booking.netAmount || 0)}</p>
                                </div>
                            </div>
                            {canManageBooking && (
                                <div className="grid gap-2 border-t pt-4 sm:grid-cols-[1fr_auto]">
                                    <Select
                                        value={booking.paymentStatus || "pending"}
                                        onValueChange={(value) => savePayment(value)}
                                    >
                                        <SelectTrigger aria-label="Update payment status">
                                            <SelectValue placeholder="Update payment status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="refunded">Refunded</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        disabled={updatePaymentMutation.isPending}
                                        onClick={() => savePayment()}
                                    >
                                        {updatePaymentMutation.isPending ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : null}
                                        Save Payment
                                    </Button>
                                </div>
                            )}
                            {paymentDetailRows.length > 0 && (
                                <div className="rounded-lg border p-3">
                                    <p className="text-sm font-medium">Processor Details</p>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                        {paymentDetailRows.map((row) => (
                                            <div key={row.key} className="min-w-0">
                                                <Label className="text-xs capitalize text-muted-foreground">{row.key}</Label>
                                                <p className="break-all text-sm font-medium">{row.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {canManageBooking && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Internal Admin Notes</CardTitle>
                                <CardDescription>Private operational notes for staff only.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Textarea
                                    value={adminNotes}
                                    onChange={(event) => setAdminNotes(event.target.value)}
                                    placeholder="Add internal booking notes…"
                                    className="min-h-[140px]"
                                />
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    disabled={updateNotesMutation.isPending}
                                    onClick={() => updateNotesMutation.mutate(adminNotes)}
                                >
                                    {updateNotesMutation.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    Save Notes
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {!canManageBooking && booking.adminNotes && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Internal Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-sm">{booking.adminNotes}</p>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Transport Request</CardTitle>
                            <CardDescription>Partner, quote, pickup, and driver details linked to this booking.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {transportRequest ? (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary" className="capitalize">
                                            {formatLabel(transportRequest.status)}
                                        </Badge>
                                        {transportRequest.quoteDecision && (
                                            <Badge variant={transportRequest.quoteDecision === "approved" ? "default" : "destructive"} className="capitalize">
                                                Quote {transportRequest.quoteDecision}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Partner</Label>
                                            <p className="break-words text-sm font-medium">
                                                {transportRequest.partner?.companyName || "Not assigned"}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Partner Contact</Label>
                                            <p className="break-words text-sm font-medium">
                                                {[transportRequest.partner?.contactName, transportRequest.partner?.phone || transportRequest.partner?.whatsapp || transportRequest.partner?.email].filter(Boolean).join(" - ") || "Not provided"}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Route</Label>
                                            <p className="break-words text-sm font-medium">{formatLabel(transportRequest.route)}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Pickup Location</Label>
                                            <p className="break-words text-sm font-medium">{transportRequest.pickupLocation || "Not provided"}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Requested Pickup</Label>
                                            <p className="text-sm font-medium">{transportRequest.requestedPickupTime || "Not recorded"}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Estimated Pickup</Label>
                                            <p className="text-sm font-medium">{transportRequest.estimatedPickupTime || "Not recorded"}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Quote</Label>
                                            <p className="text-sm font-medium">
                                                {transportRequest.quotedAmount != null
                                                    ? formatCurrency(transportRequest.quotedAmount, transportRequest.currency || "MWK")
                                                    : "Not quoted"}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Quote Sent</Label>
                                            <p className="text-sm font-medium">{formatDateTime(transportRequest.quoteSentAt)}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Assigned At</Label>
                                            <p className="text-sm font-medium">{formatDateTime(transportRequest.assignedAt)}</p>
                                        </div>
                                        <div className="min-w-0">
                                            <Label className="text-xs text-muted-foreground">Assigned By</Label>
                                            <p className="break-all text-sm font-medium">{transportRequest.assignedByUserId || "Not recorded"}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Driver</Label>
                                            <p className="break-words text-sm font-medium">{transportRequest.driverName || "Not assigned"}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Driver Phone</Label>
                                            <p className="break-words text-sm font-medium">{transportRequest.driverPhone || "Not provided"}</p>
                                        </div>
                                    </div>
                                    {transportRequest.vehicleDetails && (
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Vehicle</Label>
                                            <p className="mt-1 break-words rounded-md bg-muted p-2 text-sm">{transportRequest.vehicleDetails}</p>
                                        </div>
                                    )}
                                    {(transportRequest.notes || transportRequest.partnerNotes || transportRequest.adminNotes || transportRequest.rescheduleNotes || transportRequest.quoteDecisionNotes) && (
                                        <div className="grid gap-3">
                                            {transportRequest.notes && (
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Transport Notes</Label>
                                                    <p className="mt-1 break-words rounded-md bg-muted p-2 text-sm">{transportRequest.notes}</p>
                                                </div>
                                            )}
                                            {transportRequest.partnerNotes && (
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Partner Notes</Label>
                                                    <p className="mt-1 break-words rounded-md bg-muted p-2 text-sm">{transportRequest.partnerNotes}</p>
                                                </div>
                                            )}
                                            {transportRequest.adminNotes && (
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Private Admin Notes</Label>
                                                    <p className="mt-1 break-words rounded-md bg-muted p-2 text-sm">{transportRequest.adminNotes}</p>
                                                </div>
                                            )}
                                            {transportRequest.rescheduleNotes && (
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Reschedule Notes</Label>
                                                    <p className="mt-1 break-words rounded-md bg-muted p-2 text-sm">{transportRequest.rescheduleNotes}</p>
                                                </div>
                                            )}
                                            {transportRequest.quoteDecisionNotes && (
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Quote Decision Notes</Label>
                                                    <p className="mt-1 break-words rounded-md bg-muted p-2 text-sm">{transportRequest.quoteDecisionNotes}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                    No transport request is linked to this booking.
                                </div>
                            )}
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

                    {(user?.role === "admin" || user?.role === "coordinator") && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Resend Booking Emails</CardTitle>
                                <CardDescription>Send a fresh copy of common booking emails.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-2 sm:grid-cols-2">
                                {[
                                    ["request_received", "Request Received"],
                                    ["booking_confirmation", "Booking Confirmed"],
                                    ["status_update", "Status Update"],
                                    ["booking_cancelled", "Cancellation"],
                                    ["reminder", "Reminder"],
                                    ["payment_receipt", "Payment Receipt"],
                                    ["feedback_request", "Feedback Request"],
                                    ["guide_assignment", "Guide Assigned"],
                                    ["guide_tour_assignment", "Guide Tour Assignment"],
                                    ["check_in", "Check-in"],
                                    ["itinerary", "Itinerary"],
                                ].map(([type, label]) => (
                                    <Button
                                        key={type}
                                        type="button"
                                        variant="outline"
                                        className="justify-start gap-2"
                                        disabled={resendBookingEmailMutation.isPending}
                                        onClick={() => resendBookingEmailMutation.mutate(type)}
                                    >
                                        {resendBookingEmailMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                        {label}
                                    </Button>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Visitor Voucher Readiness</CardTitle>
                            <CardDescription>Checks the details visitors need before arrival.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {voucherChecklist.map((item) => (
                                <div key={item.label} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">{item.label}</p>
                                        <p className="mt-1 break-words text-sm text-muted-foreground">{item.detail}</p>
                                    </div>
                                    <Badge variant={item.done ? "default" : "destructive"} className="shrink-0">
                                        {item.done ? "Ready" : "Needs update"}
                                    </Badge>
                                </div>
                            ))}
                            <p className="text-xs text-muted-foreground">
                                Use Export PDF after these checks are ready, especially for mobile voucher and print workflows.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Operational Timestamps</CardTitle>
                            <CardDescription>Record history for check-in, check-out, cancellation, reminders, and updates.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <Label className="text-xs text-muted-foreground">Check-in Time</Label>
                                <p className="text-sm font-medium">{formatDateTime(booking.checkInTime)}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Check-out Time</Label>
                                <p className="text-sm font-medium">{formatDateTime(booking.checkOutTime)}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Cancelled At</Label>
                                <p className="text-sm font-medium">{formatDateTime(booking.cancelledAt)}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Reminder Sent</Label>
                                <p className="text-sm font-medium">{formatDateTime(booking.reminderSentAt)}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Created</Label>
                                <p className="text-sm font-medium">{formatDateTime(booking.createdAt)}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Updated</Label>
                                <p className="text-sm font-medium">{formatDateTime(booking.updatedAt)}</p>
                            </div>
                            <div className="min-w-0 sm:col-span-2">
                                <Label className="text-xs text-muted-foreground">Booking ID</Label>
                                <p className="break-all text-sm font-medium">{booking.id}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <BookingTimeline bookingId={id} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Email Timeline</CardTitle>
                            <CardDescription>Visitor email sends, failures, and delivery events for this booking.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EmailTimeline bookingId={id} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{booking.guide ? "Change Assigned Guide" : "Assign Guide"}</DialogTitle>
                        <DialogDescription>
                            Select the guide responsible for this visitor booking.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="guide-select">Guide</Label>
                        <Select value={selectedGuideId} onValueChange={setSelectedGuideId}>
                            <SelectTrigger id="guide-select">
                                <SelectValue placeholder="Choose a guide…" />
                            </SelectTrigger>
                            <SelectContent>
                                {guides.map((guide) => (
                                    <SelectItem key={guide.id} value={guide.id}>
                                        {guide.firstName} {guide.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAssignOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={!selectedGuideId || assignGuideMutation.isPending}
                            onClick={() => assignGuideMutation.mutate(selectedGuideId)}
                        >
                            {assignGuideMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Save Guide
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Email Visitor</DialogTitle>
                        <DialogDescription>
                            Send a direct email to {booking.visitorName}. Template emails remain available in the resend panel.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="visitor-email">Recipient</Label>
                            <Input id="visitor-email" value={booking.visitorEmail} readOnly />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email-subject">Subject</Label>
                            <Input
                                id="email-subject"
                                value={emailSubject}
                                onChange={(event) => setEmailSubject(event.target.value)}
                                placeholder="Booking update…"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email-message">Message</Label>
                            <Textarea
                                id="email-message"
                                value={emailMessage}
                                onChange={(event) => setEmailMessage(event.target.value)}
                                placeholder="Write your message…"
                                className="min-h-[160px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsEmailOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={!emailSubject.trim() || !emailMessage.trim() || sendEmailMutation.isPending}
                            onClick={() => sendEmailMutation.mutate({
                                recipientName: booking.visitorName,
                                recipientEmail: booking.visitorEmail,
                                subject: emailSubject.trim(),
                                message: emailMessage.trim(),
                            })}
                        >
                            {sendEmailMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" />
                            )}
                            Send Email
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Booking</DialogTitle>
                        <DialogDescription>
                            This will update the booking status and notify the visitor using the cancellation email workflow.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cancellation-reason">Reason</Label>
                            <Select value={cancellationReason} onValueChange={setCancellationReason}>
                                <SelectTrigger id="cancellation-reason">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CANCELLATION_REASONS.map((reason) => (
                                        <SelectItem key={reason.value} value={reason.value}>
                                            {reason.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cancellation-note">Internal Note</Label>
                            <Textarea
                                id="cancellation-note"
                                value={cancellationNote}
                                onChange={(event) => setCancellationNote(event.target.value)}
                                placeholder="Add context for the cancellation…"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCancelOpen(false)}>
                            Keep Booking
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={updateStatusMutation.isPending}
                            onClick={submitCancellation}
                        >
                            {updateStatusMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Cancel Booking
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCommunityHighlightsOpen} onOpenChange={setIsCommunityHighlightsOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Manage Community Hub Highlights</DialogTitle>
                        <DialogDescription>
                            Choose listings the visitor is interested in. These stay as suggestions for the guide, not confirmed stops.
                        </DialogDescription>
                    </DialogHeader>

                    {communityListings.length === 0 ? (
                        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                            No approved Community Hub listings are available yet.
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {communityListings.map((listing) => {
                                const checked = selectedCommunityListingIds.includes(listing.id);
                                return (
                                    <label
                                        key={listing.id}
                                        className="flex min-w-0 cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors hover:bg-muted/40"
                                    >
                                        <Checkbox
                                            checked={checked}
                                            disabled={updateCommunityHighlightsMutation.isPending}
                                            onCheckedChange={() => toggleCommunityListing(listing.id)}
                                            aria-label={`${checked ? "Remove" : "Add"} ${listing.name}`}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block break-words text-sm font-semibold">{listing.name}</span>
                                            <span className="mt-1 block break-words text-xs text-muted-foreground">
                                                {listing.category} - {listing.location}
                                            </span>
                                            <span className="mt-2 line-clamp-2 break-words text-sm leading-6 text-muted-foreground">
                                                {listing.description}
                                            </span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
