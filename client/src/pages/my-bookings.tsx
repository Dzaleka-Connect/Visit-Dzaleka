import { startTransition, useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  Calendar,
  Clock,
  Users,
  MapPin,
  CreditCard,
  Ticket,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileDown,
  Star,
  Phone,
  Car,
  Mail,
  Wallet,
  ShieldCheck,
  Languages,
  CalendarClock,
  MessageSquare,
  Ban,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { StatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { QRCodeDisplay } from "@/components/qr-scanner-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDate, formatTime, formatCurrency, GROUP_SIZES } from "@/lib/constants";
import { TransportRequestFields } from "@/components/transport-request-fields";
import { buildTransportSpecialRequests, createTransportRequestFromSearch, getTransportRoute } from "@/lib/transport";
import type { Booking, MeetingPoint, Zone, PointOfInterest, Guide } from "@shared/schema";
import { SEO } from "@/components/seo";

interface VisitorTransportPartnerProfile {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  baseLocation: string | null;
  preferredContactMethod: string | null;
  serviceAreas: string[] | null;
  publicNotes: string | null;
}

interface VisitorTransportRequest {
  id: string;
  bookingId: string | null;
  partnerId: string | null;
  route: string;
  pickupLocation: string | null;
  notes: string | null;
  status: string | null;
  quotedAmount: number | null;
  currency: string | null;
  quoteSentAt: string | Date | null;
  quoteDecision: string | null;
  quoteDecisionAt: string | Date | null;
  quoteDecisionNotes: string | null;
  estimatedPickupTime: string | null;
  requestedPickupTime: string | null;
  requestedVisitDate: string | null;
  rescheduleNotes: string | null;
  driverName: string | null;
  driverPhone: string | null;
  vehicleDetails: string | null;
  partnerNotes: string | null;
  cancellationReason: string | null;
  cancelledAt: string | Date | null;
  partnerRespondedAt: string | Date | null;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
  partner: VisitorTransportPartnerProfile | null;
}

interface BookingWithGuide extends Booking {
  guide?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    profileImageUrl: string | null;
    languages: string[] | null;
    bio: string | null;
    specialties: string[] | null;
    rating: number | null;
  } | null;
  transportRequest?: VisitorTransportRequest | null;
}

const canPayOnline = (booking: Booking) =>
  (booking.paymentStatus === "pending" || !booking.paymentStatus) && booking.paymentMethod === "card";


import { generateQRCodeDataURL } from "@/lib/qrcode";

// Premium PDF Generator function (async to support QR code generation)
const generateBookingPDF = async (booking: Booking, meetingPointName: string) => {
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
  // Primary gradient bar
  doc.setFillColor(2, 132, 199); // Sky blue
  doc.rect(0, 0, pageWidth, 45, 'F');
  // Accent stripe
  doc.setFillColor(14, 165, 233); // Lighter accent
  doc.rect(0, 45, pageWidth, 5, 'F');

  // Header text
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

  // Reference number (large, prominent)
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text('BOOKING REFERENCE', margin, yPos);
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.bookingReference || 'Pending Confirmation', margin, yPos + 10);

  // Status badge (right aligned)
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

  // Horizontal divider
  yPos += 20;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // ===== TWO COLUMN LAYOUT =====
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

  // ===== LEFT COLUMN: VISITOR & TOUR DETAILS =====
  let leftY = yPos;

  // Visitor Details Section
  leftY = drawSectionHeader('Visitor Details', leftColX, leftY);
  leftY = drawDetail('Full Name', booking.visitorName, leftColX, leftY);
  leftY = drawDetail('Email Address', booking.visitorEmail, leftColX, leftY);
  leftY = drawDetail('Phone Number', booking.visitorPhone || 'Not provided', leftColX, leftY);
  leftY = drawDetail('Country/Region', booking.visitorCountry || 'Not provided', leftColX, leftY);

  // Tour Details Section
  leftY = drawSectionHeader('Tour Details', leftColX, leftY);
  leftY = drawDetail('Visit Date', formatDate(booking.visitDate), leftColX, leftY);
  leftY = drawDetail('Start Time', formatTime(booking.visitTime), leftColX, leftY);
  const tourTypeLabel = booking.tourType === 'standard' ? 'Standard Tour (2 hours)' :
    booking.tourType === 'extended' ? 'Extended Tour (3-4 hours)' : 'Custom Tour';
  leftY = drawDetail('Tour Type', tourTypeLabel, leftColX, leftY);
  leftY = drawDetail('Group Size', `${booking.numberOfPeople || 1} ${(booking.numberOfPeople || 1) === 1 ? 'person' : 'people'}`, leftColX, leftY);
  leftY = drawDetail('Meeting Point', meetingPointName, leftColX, leftY);

  // ===== RIGHT COLUMN: PAYMENT & QR CODE =====
  let rightY = yPos;

  // Payment Details Section
  rightY = drawSectionHeader('Payment Details', rightColX, rightY);
  rightY = drawDetail('Total Amount', formatCurrency(booking.totalAmount || 0), rightColX, rightY);
  const paymentStatusLabel = (booking.paymentStatus || 'pending').charAt(0).toUpperCase() + (booking.paymentStatus || 'pending').slice(1);
  rightY = drawDetail('Payment Status', paymentStatusLabel, rightColX, rightY);
  const paymentMethodLabel = booking.paymentMethod === 'card' ? 'Credit Card' :
    booking.paymentMethod === 'airtel_money' ? 'Airtel Money' :
      booking.paymentMethod === 'tnm_mpamba' ? 'TNM Mpamba' : 'Cash on Arrival';
  rightY = drawDetail('Payment Method', paymentMethodLabel, rightColX, rightY);

  // QR Code Section
  if (qrCodeDataUrl) {
    rightY = drawSectionHeader('Check-in QR Code', rightColX, rightY);
    // QR code with border
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


  // ===== FOOTER =====
  doc.setFillColor(31, 41, 55);
  doc.rect(0, 265, pageWidth, 32, 'F');
  // Accent line
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

  // Save
  doc.save(`DzalekaVisit-${booking.bookingReference || booking.id}.pdf`);
};

const TRANSPORT_STATUS_LABELS: Record<string, string> = {
  pending: "Requested",
  sent_to_partner: "Sent to partner",
  quote_sent: "Quote sent",
  accepted: "Partner accepted",
  visitor_approved: "Quote approved",
  visitor_declined: "Quote declined",
  confirmed: "Confirmed",
  reschedule_requested: "Reschedule requested",
  completed: "Completed",
  cancelled: "Cancelled",
};

function getTransportStatusLabel(status?: string | null) {
  if (!status) return "Requested";
  return TRANSPORT_STATUS_LABELS[status] || status.replace(/_/g, " ");
}

function formatOptionalTime(time?: string | null) {
  return time ? formatTime(time) : null;
}

function formatTransportAmount(request: VisitorTransportRequest) {
  return request.quotedAmount != null
    ? formatCurrency(request.quotedAmount, request.currency || "MWK")
    : null;
}

function getWhatsappHref(value?: string | null) {
  const digits = (value || "").replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

function TransportSummaryButton({
  request,
  onClick,
}: {
  request: VisitorTransportRequest;
  onClick: () => void;
}) {
  const route = getTransportRoute(request.route);
  const amount = formatTransportAmount(request);
  const driverLine = [request.driverName, request.driverPhone].filter(Boolean).join(" • ");

  return (
    <button
      type="button"
      className="mt-2 w-full rounded-lg border border-sky-200 bg-sky-50 p-3 text-left text-sm transition-colors hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-sky-800 dark:bg-sky-950/30 dark:hover:bg-sky-950/50"
      onClick={onClick}
      aria-label={`View transport details for ${route.shortLabel}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <Car className="mt-0.5 h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-medium text-sky-900 dark:text-sky-100">
              Transport: {getTransportStatusLabel(request.status)}
            </p>
            <p className="truncate text-xs text-sky-700 dark:text-sky-300">
              {route.shortLabel}{request.partner?.companyName ? ` • ${request.partner.companyName}` : ""}
            </p>
          </div>
        </div>
        {amount && (
          <Badge variant="outline" className="shrink-0 border-sky-300 bg-background/80 text-sky-800 dark:border-sky-700 dark:text-sky-200">
            {amount}
          </Badge>
        )}
      </div>
      {driverLine && (
        <p className="mt-2 truncate text-xs text-sky-700 dark:text-sky-300">
          Driver: {driverLine}
        </p>
      )}
      <p className="mt-2 text-xs font-medium text-sky-800 dark:text-sky-200">
        View transport details
      </p>
    </button>
  );
}

function TransportDetailsCard({
  request,
  onQuoteDecision,
  isQuoteDecisionPending = false,
}: {
  request: VisitorTransportRequest;
  onQuoteDecision?: (request: VisitorTransportRequest, decision: "approved" | "declined", notes?: string) => void;
  isQuoteDecisionPending?: boolean;
}) {
  const [quoteNotes, setQuoteNotes] = useState("");
  const route = getTransportRoute(request.route);
  const amount = formatTransportAmount(request);
  const pickupTime = formatOptionalTime(request.estimatedPickupTime || request.requestedPickupTime);
  const whatsappHref = getWhatsappHref(request.partner?.whatsapp || request.partner?.phone);
  const partnerPhone = request.partner?.phone || request.partner?.whatsapp;
  const transportPending = ["pending", "sent_to_partner"].includes(request.status || "pending");
  const canAnswerQuote = Boolean(
    onQuoteDecision
    && !request.quoteDecision
    && request.quotedAmount != null
    && ["quote_sent", "accepted"].includes(request.status || "")
  );

  return (
    <Card className="border-sky-200 bg-sky-50/60 dark:border-sky-800 dark:bg-sky-950/20">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Car className="h-5 w-5 text-sky-700 dark:text-sky-300" aria-hidden="true" />
              Transport Details
            </CardTitle>
            <CardDescription className="mt-1 break-words">{route.label}</CardDescription>
          </div>
          <Badge variant={request.status === "cancelled" || request.status === "visitor_declined" ? "destructive" : "outline"}>
            {getTransportStatusLabel(request.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {transportPending && (
          <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="min-w-0 break-words">
              This transport request is not guaranteed yet. We will update this section when a partner confirms availability.
            </p>
          </div>
        )}

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          {request.pickupLocation && (
            <div className="min-w-0">
              <Label className="text-xs text-muted-foreground">Pickup or drop-off</Label>
              <p className="mt-1 break-words font-medium">{request.pickupLocation}</p>
            </div>
          )}
          {pickupTime && (
            <div className="min-w-0">
              <Label className="text-xs text-muted-foreground">Pickup time</Label>
              <p className="mt-1 font-medium">{pickupTime}</p>
            </div>
          )}
          {amount && (
            <div className="min-w-0">
              <Label className="text-xs text-muted-foreground">Quoted amount</Label>
              <p className="mt-1 flex items-center gap-2 font-medium">
                <Wallet className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {amount}
              </p>
            </div>
          )}
          {request.quoteDecision && (
            <div className="min-w-0">
              <Label className="text-xs text-muted-foreground">Quote decision</Label>
              <p className="mt-1 font-medium capitalize">{request.quoteDecision.replace(/_/g, " ")}</p>
            </div>
          )}
        </div>

        {request.partner && (
          <div className="rounded-md border bg-background/80 p-3">
            <Label className="text-xs text-muted-foreground">Transport partner</Label>
            <p className="mt-1 break-words font-medium">{request.partner.companyName}</p>
            <div className="mt-3 grid gap-2 text-sm">
              {partnerPhone && (
                <a href={`tel:${partnerPhone}`} className="flex min-w-0 items-center gap-2 text-sky-700 hover:underline dark:text-sky-300">
                  <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{partnerPhone}</span>
                </a>
              )}
              {request.partner.email && (
                <a href={`mailto:${request.partner.email}`} className="flex min-w-0 items-center gap-2 text-sky-700 hover:underline dark:text-sky-300">
                  <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{request.partner.email}</span>
                </a>
              )}
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline dark:text-sky-300">
                  Open WhatsApp chat
                </a>
              )}
            </div>
          </div>
        )}

        {(request.driverName || request.driverPhone || request.vehicleDetails) && (
          <div className="rounded-md border bg-background/80 p-3">
            <Label className="text-xs text-muted-foreground">Driver and vehicle</Label>
            <div className="mt-2 grid gap-2 text-sm">
              {request.driverName && <p className="break-words font-medium">{request.driverName}</p>}
              {request.driverPhone && (
                <a href={`tel:${request.driverPhone}`} className="flex min-w-0 items-center gap-2 text-sky-700 hover:underline dark:text-sky-300">
                  <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{request.driverPhone}</span>
                </a>
              )}
              {request.vehicleDetails && <p className="break-words text-muted-foreground">{request.vehicleDetails}</p>}
            </div>
          </div>
        )}

        {(request.notes || request.partnerNotes || request.quoteDecisionNotes || request.rescheduleNotes || request.cancellationReason) && (
          <div className="space-y-3 text-sm">
            {request.notes && (
              <div>
                <Label className="text-xs text-muted-foreground">Your transport notes</Label>
                <p className="mt-1 break-words">{request.notes}</p>
              </div>
            )}
            {request.partnerNotes && (
              <div>
                <Label className="text-xs text-muted-foreground">Partner message</Label>
                <p className="mt-1 break-words">{request.partnerNotes}</p>
              </div>
            )}
            {request.quoteDecisionNotes && (
              <div>
                <Label className="text-xs text-muted-foreground">Quote response note</Label>
                <p className="mt-1 break-words">{request.quoteDecisionNotes}</p>
              </div>
            )}
            {request.rescheduleNotes && (
              <div>
                <Label className="text-xs text-muted-foreground">Reschedule note</Label>
                <p className="mt-1 break-words">{request.rescheduleNotes}</p>
              </div>
            )}
            {request.cancellationReason && (
              <div>
                <Label className="text-xs text-muted-foreground">Cancellation reason</Label>
                <p className="mt-1 break-words">{request.cancellationReason}</p>
              </div>
            )}
          </div>
        )}

        {canAnswerQuote && (
          <div className="rounded-md border bg-background/90 p-3">
            <Label htmlFor={`quote-notes-${request.id}`} className="text-xs text-muted-foreground">
              Optional note to transport partner
            </Label>
            <Textarea
              id={`quote-notes-${request.id}`}
              value={quoteNotes}
              onChange={(event) => setQuoteNotes(event.target.value)}
              placeholder="Add a short note…"
              rows={3}
              className="mt-2"
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                onClick={() => onQuoteDecision?.(request, "approved", quoteNotes)}
                disabled={isQuoteDecisionPending}
              >
                {isQuoteDecisionPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                Approve quote
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                onClick={() => onQuoteDecision?.(request, "declined", quoteNotes)}
                disabled={isQuoteDecisionPending}
              >
                {isQuoteDecisionPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                Decline quote
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



export default function MyBookings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<BookingWithGuide['guide'] | null>(null);

  // Self-service states
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithGuide | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleNote, setRescheduleNote] = useState("");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const initialTransportRequest = createTransportRequestFromSearch(window.location.search);

  const [newBooking, setNewBooking] = useState({
    visitorName: "",
    visitorEmail: "",
    visitorPhone: "",
    visitorCountry: "",
    visitDate: "",
    visitTime: "",
    groupSize: "individual" as "individual" | "small_group" | "large_group" | "custom",
    numberOfPeople: 1,
    tourType: "standard" as "standard" | "extended" | "custom",
    paymentMethod: "cash" as "cash" | "airtel_money" | "tnm_mpamba" | "card",
    meetingPointId: "",
    specialRequests: "",
    selectedZones: [] as string[],
    selectedInterests: [] as string[],
    referralSource: "",
    transportRequested: initialTransportRequest.transportRequested || false,
    transportRoute: initialTransportRequest.transportRoute,
    transportPartnerId: initialTransportRequest.transportPartnerId,
    transportPartnerName: initialTransportRequest.transportPartnerName || "",
    transportPickup: initialTransportRequest.transportPickup || "",
    transportNotes: initialTransportRequest.transportNotes || "",
  });

  // Auto-populate form with logged-in user's data
  useEffect(() => {
    if (user) {
      setNewBooking(prev => ({
        ...prev,
        visitorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || prev.visitorName,
        visitorEmail: user.email || prev.visitorEmail,
        visitorPhone: user.phone || prev.visitorPhone,
        visitorCountry: user.country || prev.visitorCountry,
      }));
    }
  }, [user]);

  // Auto-open booking form if URL has ?book=true
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('book') === 'true') {
      setIsCreateOpen(true);
      // Clean up the URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const { data: bookings, isLoading } = useQuery<BookingWithGuide[]>({
    queryKey: ["/api/bookings/my-bookings"],
  });

  const { data: itineraries } = useQuery<{ bookingId: string }[]>({
    queryKey: ["/api/my-itineraries"],
  });

  const { data: meetingPoints } = useQuery<MeetingPoint[]>({
    queryKey: ["/api/public/meeting-points"],
  });

  const { data: zones } = useQuery<Zone[]>({
    queryKey: ["/api/public/zones"],
  });

  const { data: pointsOfInterest } = useQuery<PointOfInterest[]>({
    queryKey: ["/api/public/points-of-interest"],
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: typeof newBooking) => {
      const {
        transportRequested,
        transportRoute,
        transportPartnerId,
        transportPartnerName,
        transportPickup,
        transportNotes,
        ...bookingFields
      } = data;

      await apiRequest("POST", "/api/bookings", {
        ...bookingFields,
        transportRequested,
        transportRoute,
        transportPartnerId,
        transportPickup,
        transportNotes,
        specialRequests: buildTransportSpecialRequests(data.specialRequests, {
          transportRequested,
          transportRoute,
          transportPartnerId,
          transportPartnerName,
          transportPickup,
          transportNotes,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-bookings"] });
      setIsCreateOpen(false);
      setNewBooking({
        visitorName: "",
        visitorEmail: "",
        visitorPhone: "",
        visitorCountry: "",
        visitDate: "",
        visitTime: "",
        groupSize: "individual",
        numberOfPeople: 1,
        tourType: "standard",
        paymentMethod: "cash",
        meetingPointId: "",
        specialRequests: "",
        selectedZones: [],
        selectedInterests: [],
        referralSource: "",
        transportRequested: false,
        transportRoute: initialTransportRequest.transportRoute,
        transportPartnerId: initialTransportRequest.transportPartnerId,
        transportPartnerName: initialTransportRequest.transportPartnerName || "",
        transportPickup: "",
        transportNotes: "",
      });
      toast({
        title: "Booking submitted",
        description: "Your booking request has been submitted. You will receive a confirmation email shortly.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, visitDate, visitTime, note }: { id: string; visitDate: string; visitTime: string; note?: string }) => {
      return apiRequest("POST", `/api/bookings/${id}/visitor-reschedule-request`, { visitDate, visitTime, note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-bookings"] });
      setRescheduleDialogOpen(false);
      setSelectedBooking(null);
      setRescheduleDate("");
      setRescheduleTime("");
      setRescheduleNote("");
      toast({
        title: "Reschedule request sent",
        description: "Our team will review availability and confirm the new date with you.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to reschedule",
        description: "Could not reschedule your booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const transportQuoteDecisionMutation = useMutation({
    mutationFn: async ({
      bookingId,
      decision,
      notes,
    }: {
      bookingId: string;
      decision: "approved" | "declined";
      notes?: string;
    }) => {
      const response = await apiRequest("POST", `/api/bookings/${bookingId}/transport-quote-decision`, {
        decision,
        notes,
      });
      return response.json() as Promise<VisitorTransportRequest>;
    },
    onSuccess: (updatedRequest, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-bookings"] });
      setSelectedBooking((current) => {
        if (!current || current.id !== variables.bookingId || !current.transportRequest) return current;
        return {
          ...current,
          transportRequest: {
            ...current.transportRequest,
            ...updatedRequest,
          },
        };
      });
      toast({
        title: variables.decision === "approved" ? "Transport quote approved" : "Transport quote declined",
        description: variables.decision === "approved"
          ? "The transport partner and admin team have been notified."
          : "The transport partner and admin team will follow up if needed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Transport quote update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/bookings/${id}/visitor-cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-bookings"] });
      setCancelDialogOpen(false);
      setSelectedBooking(null);
      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to cancel",
        description: "Could not cancel your booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Rate guide mutation
  const rateMutation = useMutation({
    mutationFn: async ({ id, rating }: { id: string; rating: number }) => {
      return apiRequest("POST", `/api/bookings/${id}/rate-guide`, { rating });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-bookings"] });
      setRatingDialogOpen(false);
      setSelectedBooking(null);
      setRating(0);
      setFeedback("");
      toast({
        title: "Thank you for your feedback!",
        description: "Your rating helps us improve our services.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to submit rating",
        description: "Could not submit your rating. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Online Payment Mutation (Stripe)
  const payOnlineMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await apiRequest("POST", `/api/bookings/${bookingId}/pay`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        // Redirect to Stripe Checkout.
        window.location.href = data.checkoutUrl;
      } else {
        toast({
          title: "Payment initiation failed",
          description: "Could not start payment process. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Ticket className="h-4 w-4 text-blue-600" />;
    }
  };

  const getMeetingPointName = (id: string | null) => {
    if (!id) return "Not specified";
    const mp = meetingPoints?.find((m) => m.id === id);
    return mp?.name || "Unknown";
  };

  const getZoneName = (zoneId: string) => {
    const zone = zones?.find((z) => z.id === zoneId);
    return zone?.name || zoneId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const getPoiName = (poiId: string) => {
    const poi = pointsOfInterest?.find((p) => p.id === poiId);
    return poi?.name || poiId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const isFormValid =
    newBooking.visitorName &&
    newBooking.visitorEmail &&
    newBooking.visitorPhone &&
    newBooking.visitDate &&
    newBooking.visitTime;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SEO
        title="My Bookings"
        description="View and manage your tour bookings at Dzaleka Refugee Camp. Request new visits, reschedule, or cancel existing bookings."
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
            {isDetailOpen ? "Booking Details" : "My Bookings"}
          </h1>
          <p className="break-words text-muted-foreground">
            {isDetailOpen
              ? `Reference: ${selectedBooking?.bookingReference || 'Pending'}`
              : "View your tour bookings and request new visits to Dzaleka."}
          </p>
        </div>
        {!isDetailOpen ? (
          <Button className="w-full sm:w-auto" onClick={() => setIsCreateOpen(true)} data-testid="button-new-booking">
            <Plus className="mr-2 h-4 w-4" />
            Book a Tour
          </Button>
        ) : (
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsDetailOpen(false)}>
            Back to Bookings
          </Button>
        )}
      </div>

      {isDetailOpen && selectedBooking ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Detail View Container */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column: Main Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Visitor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <Label className="text-xs text-muted-foreground">Name</Label>
                      <p className="break-words font-medium">{selectedBooking.visitorName}</p>
                    </div>
                    <div className="min-w-0">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="break-all font-medium">{selectedBooking.visitorEmail}</p>
                    </div>
                    <div className="min-w-0">
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="break-words font-medium">{selectedBooking.visitorPhone}</p>
                    </div>
                    <div className="min-w-0">
                      <Label className="text-xs text-muted-foreground">Country / region</Label>
                      <p className="break-words font-medium">{selectedBooking.visitorCountry || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="mt-1"><StatusBadge status={selectedBooking.status || "pending"} /></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tour Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <Label className="text-xs text-muted-foreground">Date</Label>
                      <p className="flex min-w-0 items-center gap-2 break-words font-medium">
                        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {formatDate(selectedBooking.visitDate)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <Label className="text-xs text-muted-foreground">Time</Label>
                      <p className="flex min-w-0 items-center gap-2 break-words font-medium">
                        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {formatTime(selectedBooking.visitTime)}
                      </p>
                    </div>
                    <div className="min-w-0 sm:col-span-2">
                      <Label className="text-xs text-muted-foreground">Meeting Point</Label>
                      <p className="flex min-w-0 items-center gap-2 break-words font-medium">
                        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {getMeetingPointName(selectedBooking.meetingPointId)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <Label className="text-xs text-muted-foreground">Tour Type</Label>
                      <p className="break-words font-medium capitalize">{selectedBooking.tourType}</p>
                    </div>
                    <div className="min-w-0">
                      <Label className="text-xs text-muted-foreground">Group Size</Label>
                      <p className="break-words font-medium">{selectedBooking.numberOfPeople || 1} people</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedBooking.specialRequests && (
                <Card>
                  <CardHeader>
                    <CardTitle>Special Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="break-words text-sm text-muted-foreground">{selectedBooking.specialRequests}</p>
                  </CardContent>
                </Card>
              )}

              {/* Areas of Interest Card */}
              {((selectedBooking.selectedZones && selectedBooking.selectedZones.length > 0) || (selectedBooking.selectedInterests && selectedBooking.selectedInterests.length > 0)) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Areas of Interest</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedBooking.selectedZones && selectedBooking.selectedZones.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Camp Zones</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(selectedBooking.selectedZones as string[]).map((zoneId) => (
                            <Badge key={zoneId} variant="secondary">{getZoneName(zoneId)}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedBooking.selectedInterests && selectedBooking.selectedInterests.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Points of Interest</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(selectedBooking.selectedInterests as string[]).map((poiId) => (
                            <Badge key={poiId} variant="outline">{getPoiName(poiId)}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Guide & Payment */}
            <div className="space-y-6">
              {selectedBooking.guide ? (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle>Assigned Guide</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex min-w-0 items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                        <AvatarImage src={selectedBooking.guide.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xl">
                          {selectedBooking.guide.firstName.charAt(0)}{selectedBooking.guide.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="break-words text-lg font-bold">{selectedBooking.guide.firstName} {selectedBooking.guide.lastName}</h4>
                        {selectedBooking.guide.rating && (
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="font-medium">{selectedBooking.guide.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedBooking.guide.bio && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">About the Guide</Label>
                        <p className="break-words text-sm leading-relaxed">{selectedBooking.guide.bio}</p>
                      </div>
                    )}

                    {selectedBooking.guide.languages && selectedBooking.guide.languages.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Languages</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedBooking.guide.languages.map((lang, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-background/80 backdrop-blur-sm">{lang}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedBooking.guide.phone && (
                      <div className="pt-2 border-t border-primary/10">
                        <Label className="text-xs text-muted-foreground">Contact</Label>
                        <p className="mt-1 flex min-w-0 items-center gap-2 break-words font-medium">
                          <Phone className="h-4 w-4 shrink-0" /> {selectedBooking.guide.phone}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mb-3 opacity-20" />
                    <p>No guide assigned yet.</p>
                    <p className="text-xs">A guide will be assigned once your booking is confirmed.</p>
                  </CardContent>
                </Card>
              )}

              {selectedBooking.transportRequest && (
                <TransportDetailsCard
                  request={selectedBooking.transportRequest}
                  isQuoteDecisionPending={transportQuoteDecisionMutation.isPending}
                  onQuoteDecision={(_request, decision, notes) => {
                    transportQuoteDecisionMutation.mutate({
                      bookingId: selectedBooking.id,
                      decision,
                      notes,
                    });
                  }}
                />
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="text-xl font-bold">{formatCurrency(selectedBooking.totalAmount || 0)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Method</Label>
                      <p className="capitalize font-medium">{(selectedBooking.paymentMethod || "cash").replace("_", " ")}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="mt-1"><PaymentStatusBadge status={selectedBooking.paymentStatus || "pending"} /></div>
                    </div>
                  </div>
                  {canPayOnline(selectedBooking) && (
                      <div className="pt-4 mt-4 border-t border-dashed">
                        <Button
                          className="w-full bg-emerald-600/80 hover:bg-emerald-600 text-white"
                          onClick={() => payOnlineMutation.mutate(selectedBooking.id)}
                          disabled={payOnlineMutation.isPending}
                        >
                          {payOnlineMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing…
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Pay online
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          You will be redirected to Stripe Checkout for secure card payment.
                        </p>
                      </div>
                    )}
                </CardContent>
              </Card>

              {/* QR Code for Check-in */}
              {(selectedBooking.status === "confirmed" || selectedBooking.status === "pending") && selectedBooking.bookingReference && (
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader>
                    <CardTitle className="text-lg">Your Check-in QR Code</CardTitle>
                    <CardDescription>Show this to your guide at check-in</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <QRCodeDisplay value={selectedBooking.bookingReference} size={180} />
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      Present this QR code when you arrive for quick check-in
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-col justify-end gap-2 sm:flex-row">
                {itineraries?.some((i) => i.bookingId === selectedBooking.id) && (
                  <Button variant="default" asChild className="w-full sm:w-auto">
                    <Link href={`/bookings/${selectedBooking.id}/itinerary`}>
                      <FileDown className="mr-2 h-4 w-4" /> View Itinerary
                    </Link>
                  </Button>
                )}

                <Button className="w-full sm:w-auto" variant="outline" onClick={() => generateBookingPDF(selectedBooking, getMeetingPointName(selectedBooking.meetingPointId))} >
                  <FileDown className="mr-2 h-4 w-4" /> Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>

          {!bookings || bookings.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <EmptyState
                  icon={Ticket}
                  title="No bookings yet"
                  description="You haven't made any tour bookings. Book your first visit to Dzaleka Refugee Camp!"
                  action={
                    <Button onClick={() => setIsCreateOpen(true)} data-testid="button-first-booking">
                      <Plus className="mr-2 h-4 w-4" />
                      Book Your First Tour
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bookings.map((booking) => (
                <Card key={booking.id} className="hover-elevate" data-testid={`card-booking-${booking.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {getStatusIcon(booking.status || "pending")}
                        <CardTitle className="break-words text-base">
                          {booking.tourType === "standard"
                            ? "Standard Tour"
                            : booking.tourType === "extended"
                              ? "Extended Tour"
                              : "Custom Tour"}
                        </CardTitle>
                      </div>
                      <StatusBadge status={booking.status || "pending"} />
                    </div>
                    <CardDescription className="break-words text-xs">
                      Ref: {booking.bookingReference || "Pending"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(booking.visitDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatTime(booking.visitTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.numberOfPeople || 1} {(booking.numberOfPeople || 1) === 1 ? "person" : "people"}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="break-words">{getMeetingPointName(booking.meetingPointId)}</span>
                    </div>

                    {/* Assigned Guide Section */}
                    {booking.guide && (
                      <div
                        className="flex items-center gap-3 p-3 mt-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        onClick={() => setSelectedGuide(booking.guide)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={booking.guide.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200">
                            {booking.guide.firstName.charAt(0)}{booking.guide.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-blue-800 dark:text-blue-200">
                            Your Guide: {booking.guide.firstName} {booking.guide.lastName}
                          </p>
                          {booking.guide.rating && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {booking.guide.rating.toFixed(1)} rating
                            </p>
                          )}
                          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                            Tap to view profile →
                          </p>
                        </div>
                      </div>
                    )}

                    {!booking.guide && booking.status === "confirmed" && (
                      <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                        A guide will be assigned to you soon. You'll see their details here.
                      </div>
                    )}

                    {booking.transportRequest && (
                      <TransportSummaryButton
                        request={booking.transportRequest}
                        onClick={() => {
                          setSelectedBooking(booking);
                          setIsDetailOpen(true);
                        }}
                      />
                    )}

                    {/* Show visitor's rating if they've rated this tour */}
                    {booking.visitorRating && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-green-700 dark:text-green-300">
                          You rated this tour: {booking.visitorRating}/5
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span>{formatCurrency(booking.totalAmount || 0)}</span>
                      </div>
                      <PaymentStatusBadge status={booking.paymentStatus || "pending"} />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => generateBookingPDF(booking, getMeetingPointName(booking.meetingPointId))}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Download Confirmation
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      asChild
                    >
                      <Link href={`/my-bookings/${booking.id}`}>
                        <Ticket className="mr-2 h-4 w-4" />
                        View Full Details
                      </Link>
                    </Button>

                    {canPayOnline(booking) && (
                        <Button
                          size="sm"
                          className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            payOnlineMutation.mutate(booking.id);
                          }}
                          disabled={payOnlineMutation.isPending}
                        >
                          {payOnlineMutation.isPending ? "Processing…" : "Pay online"}
                        </Button>
                      )}

                    {/* Self-service action buttons */}
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {/* Reschedule - only for pending or confirmed */}
                      {(booking.status === "pending" || booking.status === "confirmed") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setRescheduleDate(booking.visitDate);
                            setRescheduleTime(booking.visitTime || "");
                            setRescheduleNote("");
                            setRescheduleDialogOpen(true);
                          }}
                        >
                          <CalendarClock className="mr-1 h-4 w-4" />
                          Reschedule
                        </Button>
                      )}

                      {/* Cancel - only for pending or confirmed */}
                      {(booking.status === "pending" || booking.status === "confirmed") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setCancelDialogOpen(true);
                          }}
                        >
                          <Ban className="mr-1 h-4 w-4" />
                          Cancel
                        </Button>
                      )}

                      {/* Rate - only for completed without rating */}
                      {booking.status === "completed" && !booking.visitorRating && booking.guide && (
                        <Button
                          size="sm"
                          className="col-span-2"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setRatingDialogOpen(true);
                          }}
                        >
                          <Star className="mr-1 h-4 w-4" />
                          Rate Your Experience
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Book a Tour</DialogTitle>
                <DialogDescription>
                  Request a guided tour of Dzaleka Refugee Camp. Our team will review your request and confirm your booking.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="visitor-name">Your Name *</Label>
                    <Input
                      id="visitor-name"
                      placeholder="Full name"
                      value={newBooking.visitorName}
                      onChange={(e) => setNewBooking({ ...newBooking, visitorName: e.target.value })}
                      data-testid="input-visitor-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visitor-phone">Phone Number *</Label>
                    <Input
                      id="visitor-phone"
                      placeholder="+265…"
                      value={newBooking.visitorPhone}
                      onChange={(e) => setNewBooking({ ...newBooking, visitorPhone: e.target.value })}
                      data-testid="input-visitor-phone"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visitor-email">Email Address *</Label>
                  <Input
                    id="visitor-email"
                    type="email"
                    placeholder="your@email.com"
                    value={newBooking.visitorEmail}
                    onChange={(e) => setNewBooking({ ...newBooking, visitorEmail: e.target.value })}
                    data-testid="input-visitor-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visitor-country">Country / region</Label>
                  <Input
                    id="visitor-country"
                    name="country"
                    autoComplete="country-name"
                    placeholder="Malawi, United States, Kenya…"
                    value={newBooking.visitorCountry}
                    onChange={(e) => setNewBooking({ ...newBooking, visitorCountry: e.target.value })}
                    data-testid="input-visitor-country"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="visit-date">Preferred Date *</Label>
                    <Input
                      id="visit-date"
                      type="date"
                      value={newBooking.visitDate}
                      onChange={(e) => setNewBooking({ ...newBooking, visitDate: e.target.value })}
                      data-testid="input-visit-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visit-time">Preferred Time *</Label>
                    <Input
                      id="visit-time"
                      type="time"
                      value={newBooking.visitTime}
                      onChange={(e) => setNewBooking({ ...newBooking, visitTime: e.target.value })}
                      data-testid="input-visit-time"
                    />
                    <p className="break-words text-xs text-muted-foreground">Standard start times: 10:00 AM and 2:00 PM. Standard tours are 2 hours. Additional hours at MWK 10,000/hr.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tour Type *</Label>
                    <Select
                      value={newBooking.tourType}
                      onValueChange={(value: "standard" | "extended" | "custom") =>
                        setNewBooking({ ...newBooking, tourType: value })
                      }
                    >
                      <SelectTrigger data-testid="select-tour-type">
                        <SelectValue placeholder="Select tour type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Tour (2 hours) - MWK 15,000</SelectItem>
                        <SelectItem value="extended">Extended Tour (3-4 hours) - MWK 25,000</SelectItem>
                        <SelectItem value="custom">Custom Tour - Contact for pricing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Group Size *</Label>
                    <Select
                      value={newBooking.groupSize}
                      onValueChange={(value: "individual" | "small_group" | "large_group" | "custom") =>
                        setNewBooking({ ...newBooking, groupSize: value })
                      }
                    >
                      <SelectTrigger data-testid="select-group-size">
                        <SelectValue placeholder="Select group size" />
                      </SelectTrigger>
                      <SelectContent>
                        {GROUP_SIZES.map((size) => (
                          <SelectItem key={size.id} value={size.id}>
                            {size.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="number-of-people">Number of People</Label>
                    <Input
                      id="number-of-people"
                      type="number"
                      min="1"
                      value={newBooking.numberOfPeople}
                      onChange={(e) => setNewBooking({ ...newBooking, numberOfPeople: parseInt(e.target.value) || 1 })}
                      data-testid="input-number-people"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method *</Label>
                    <Select
                      value={newBooking.paymentMethod}
                      onValueChange={(value: "airtel_money" | "tnm_mpamba" | "card" | "cash") =>
                        setNewBooking({ ...newBooking, paymentMethod: value })
                      }
                    >
                      <SelectTrigger data-testid="select-payment-method">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash (on arrival)</SelectItem>
                        <SelectItem value="card">Credit Card (Online)</SelectItem>
                        <SelectItem value="airtel_money">Airtel Money</SelectItem>
                        <SelectItem value="tnm_mpamba">TNM Mpamba</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Meeting Point</Label>
                  <Select
                    value={newBooking.meetingPointId}
                    onValueChange={(value) => setNewBooking({ ...newBooking, meetingPointId: value })}
                  >
                    <SelectTrigger data-testid="select-meeting-point">
                      <SelectValue placeholder="Select where to meet" />
                    </SelectTrigger>
                    <SelectContent>
                      {meetingPoints?.map((mp) => (
                        <SelectItem key={mp.id} value={mp.id}>{mp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>How Did You Hear About Us?</Label>
                  <Select
                    value={newBooking.referralSource}
                    onValueChange={(value) => setNewBooking({ ...newBooking, referralSource: value })}
                  >
                    <SelectTrigger data-testid="select-referral-source">
                      <SelectValue placeholder="Please select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social-media">Social Media</SelectItem>
                      <SelectItem value="word-of-mouth">Word of Mouth</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="other">Other (Please Specify)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Zones of Interest (optional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {zones?.map((zone) => (
                      <Badge
                        key={zone.id}
                        variant={newBooking.selectedZones.includes(zone.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const selected = newBooking.selectedZones.includes(zone.id)
                            ? newBooking.selectedZones.filter((z) => z !== zone.id)
                            : [...newBooking.selectedZones, zone.id];
                          setNewBooking({ ...newBooking, selectedZones: selected });
                        }}
                        data-testid={`badge-zone-${zone.id}`}
                      >
                        {zone.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                {pointsOfInterest && pointsOfInterest.length > 0 && (
                  <div className="space-y-2">
                    <Label>Points of Interest ({pointsOfInterest.length} available)</Label>
                    <div className="max-h-40 overflow-y-auto border rounded-md p-3 bg-muted/20">
                      <div className="flex flex-wrap gap-2">
                        {pointsOfInterest.map((poi) => (
                          <Badge
                            key={poi.id}
                            variant={newBooking.selectedInterests.includes(poi.id) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const selected = newBooking.selectedInterests.includes(poi.id)
                                ? newBooking.selectedInterests.filter((p) => p !== poi.id)
                                : [...newBooking.selectedInterests, poi.id];
                              setNewBooking({ ...newBooking, selectedInterests: selected });
                            }}
                            data-testid={`badge-poi-${poi.id}`}
                          >
                            {poi.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="special-requests">Special Requests or Accessibility Needs</Label>
                  <Textarea
                    id="special-requests"
                    placeholder="Any special requirements, interests, or accessibility needs…"
                    value={newBooking.specialRequests}
                    onChange={(e) => setNewBooking({ ...newBooking, specialRequests: e.target.value })}
                    data-testid="textarea-special-requests"
                  />
                </div>

                <TransportRequestFields
                  idPrefix="visitor-booking"
                  transportRequested={newBooking.transportRequested}
                  transportRoute={newBooking.transportRoute}
                  transportPartnerId={newBooking.transportPartnerId}
                  transportPartnerName={newBooking.transportPartnerName}
                  transportPickup={newBooking.transportPickup}
                  transportNotes={newBooking.transportNotes}
                  onChange={(updates) => setNewBooking({ ...newBooking, ...updates })}
                />

                <div className="space-y-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-md border">
                  <h4 className="font-semibold mb-1">Privacy & Data Protection</h4>
                  <p>
                    Your information will only be used to process your booking request and communicate tour details. We respect your privacy and will never share your personal data with third parties. By submitting this form, you consent to our processing of your information for booking purposes. <a href="https://services.dzaleka.com/privacy/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Read our Privacy Policy</a>.
                  </p>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createBookingMutation.mutate(newBooking)}
                  disabled={!isFormValid || createBookingMutation.isPending}
                  data-testid="button-submit-booking"
                >
                  {createBookingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Submit Booking Request
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>



          {/* Guide Profile Dialog */}
          <Dialog open={!!selectedGuide} onOpenChange={(open) => !open && setSelectedGuide(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Your Tour Guide</DialogTitle>
                <DialogDescription>
                  Contact your assigned guide for any questions about your visit.
                </DialogDescription>
              </DialogHeader>
              {selectedGuide && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedGuide.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                        {selectedGuide.firstName.charAt(0)}{selectedGuide.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {selectedGuide.firstName} {selectedGuide.lastName}
                      </h3>
                      {selectedGuide.rating && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{selectedGuide.rating.toFixed(1)} rating</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedGuide.bio && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">About</h4>
                      <p className="text-sm text-muted-foreground">{selectedGuide.bio}</p>
                    </div>
                  )}

                  {selectedGuide.specialties && selectedGuide.specialties.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedGuide.specialties.map((specialty, idx) => (
                          <Badge key={idx} variant="secondary">{specialty}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedGuide.languages && selectedGuide.languages.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedGuide.languages.join(", ")}</span>
                    </div>
                  )}

                  {selectedGuide.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedGuide.phone}`} className="text-sm text-blue-600 hover:underline">
                        {selectedGuide.phone}
                      </a>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedGuide(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reschedule Dialog */}
          <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request a Reschedule</DialogTitle>
                <DialogDescription>
                  Choose a preferred new date and time. Our team will confirm once guide and transport availability is checked.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>New Date</Label>
                  <Input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>New Time</Label>
                  <Input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reschedule-note">Note</Label>
                  <Textarea
                    id="reschedule-note"
                    value={rescheduleNote}
                    onChange={(e) => setRescheduleNote(e.target.value)}
                    placeholder="Share why you need the change or any flexible times…"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedBooking && rescheduleDate && rescheduleTime) {
                      rescheduleMutation.mutate({
                        id: selectedBooking.id,
                        visitDate: rescheduleDate,
                        visitTime: rescheduleTime,
                        note: rescheduleNote,
                      });
                    }
                  }}
                  disabled={!rescheduleDate || !rescheduleTime || rescheduleMutation.isPending}
                >
                  {rescheduleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rescheduling…
                    </>
                  ) : (
                    <>
                      <CalendarClock className="mr-2 h-4 w-4" />
                      Send request
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Cancel Dialog */}
          <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Booking</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel this booking?
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Note:</strong> Cancellations within 24 hours of your scheduled visit may affect future bookings.
                  </p>
                </div>
                {selectedBooking && (
                  <div className="mt-4 space-y-2 text-sm">
                    <p><strong>Tour:</strong> {selectedBooking.tourType === "standard" ? "Standard Tour" : selectedBooking.tourType === "extended" ? "Extended Tour" : "Custom Tour"}</p>
                    <p><strong>Date:</strong> {formatDate(selectedBooking.visitDate)}</p>
                    <p><strong>Time:</strong> {formatTime(selectedBooking.visitTime)}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                  Keep Booking
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedBooking) {
                      cancelMutation.mutate(selectedBooking.id);
                    }
                  }}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling…
                    </>
                  ) : (
                    <>
                      <Ban className="mr-2 h-4 w-4" />
                      Yes, Cancel Booking
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Rating Dialog */}
          <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rate Your Experience</DialogTitle>
                <DialogDescription>
                  How was your visit to Dzaleka? Your feedback helps us improve.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6">
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`h-10 w-10 ${star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                          }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground mb-4">
                  {rating === 0 && "Select a rating"}
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent!"}
                </p>
                {selectedBooking?.guide && (
                  <p className="text-center text-sm">
                    Rating for guide: <strong>{selectedBooking.guide.firstName} {selectedBooking.guide.lastName}</strong>
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRatingDialogOpen(false)}>
                  Maybe Later
                </Button>
                <Button
                  onClick={() => {
                    if (selectedBooking && rating > 0) {
                      rateMutation.mutate({ id: selectedBooking.id, rating });
                    }
                  }}
                  disabled={rating === 0 || rateMutation.isPending}
                >
                  {rateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Star className="mr-2 h-4 w-4" />
                      Submit Rating
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
