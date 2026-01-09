import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  UserPlus,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Users,
  Clock,
  DollarSign,
  BookOpen,
  Plus,
  UserCheck,
  LogOut,
  Download,
  RefreshCw,
  History,
  Loader2,
  ArrowLeft,
  FileDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  formatDate,
  formatTime,
  formatCurrency,
  MEETING_POINTS,
  TOUR_TYPES,
} from "@/lib/constants";
import type { Booking, Guide, Zone, MeetingPoint, PointOfInterest, BookingStatus } from "@shared/schema";
import { SEO } from "@/components/seo";
import { jsPDF } from "jspdf";

interface BookingWithGuide extends Booking {
  guide?: Guide;
}

// Timeline component for booking activity history
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
  // doc.setFillColor(2, 132, 199); // Primary color
  doc.setFillColor(31, 41, 55); // Dark gray
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

export default function Bookings() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirect visitors to their own bookings page
  if (user?.role === "visitor") {
    setLocation("/my-bookings");
    return null;
  }

  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());
  const [selectedBooking, setSelectedBooking] = useState<BookingWithGuide | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isCreateBookingOpen, setIsCreateBookingOpen] = useState(false);
  const [isHistoricalOpen, setIsHistoricalOpen] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [historicalBooking, setHistoricalBooking] = useState({
    visitorName: "",
    visitorEmail: "",
    visitorPhone: "",
    visitDate: "",
    visitTime: "09:00",
    groupSize: "individual" as "individual" | "small_group" | "large_group",
    numberOfPeople: 1,
    tourType: "standard" as "standard" | "extended" | "custom",
    paymentMethod: "cash" as "cash" | "airtel_money" | "tnm_mpamba",
    paymentStatus: "paid" as "paid" | "pending",
    meetingPointId: "",
    assignedGuideId: "",
    totalAmount: 0,
    adminNotes: "",
    selectedZones: [] as string[],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<BookingWithGuide[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: guides } = useQuery<Guide[]>({
    queryKey: ["/api/guides"],
  });

  const { data: zones } = useQuery<Zone[]>({
    queryKey: ["/api/zones"],
  });

  const { data: meetingPoints } = useQuery<MeetingPoint[]>({
    queryKey: ["/api/meeting-points"],
  });

  const { data: pointsOfInterest } = useQuery<PointOfInterest[]>({
    queryKey: ["/api/points-of-interest"],
  });

  const { data: selectedItinerary } = useQuery({
    queryKey: [`/api/bookings/${selectedBooking?.id}/itinerary`],
    enabled: !!selectedBooking,
    retry: false,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: BookingStatus;
    }) => {
      await apiRequest("PATCH", `/api/bookings/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Status updated",
        description: "Booking status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update booking status.",
        variant: "destructive",
      });
    },
  });

  const assignGuideMutation = useMutation({
    mutationFn: async ({
      bookingId,
      guideId,
    }: {
      bookingId: string;
      guideId: string;
    }) => {
      await apiRequest("PATCH", `/api/bookings/${bookingId}/assign`, {
        guideId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setIsAssignOpen(false);
      setSelectedGuideId("");
      toast({
        title: "Guide assigned",
        description: "Guide has been assigned to the booking.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to assign guide.",
        variant: "destructive",
      });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({
      id,
      notes,
    }: {
      id: string;
      notes: string;
    }) => {
      await apiRequest("PATCH", `/api/bookings/${id}/notes`, { adminNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Notes saved",
        description: "Admin notes have been saved.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save notes.",
        variant: "destructive",
      });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({
      id,
      paymentStatus,
    }: {
      id: string;
      paymentStatus: string;
    }) => {
      await apiRequest("PATCH", `/api/bookings/${id}/payment`, { paymentStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setIsDetailOpen(false);
      toast({
        title: "Payment status updated",
        description: "Booking payment has been marked as paid.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update payment status.",
        variant: "destructive",
      });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/bookings/${id}/check-in`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Visitor checked in",
        description: "Visitor has been successfully checked in.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "You are logged out.", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to check in visitor.", variant: "destructive" });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/bookings/${id}/check-out`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Visitor checked out",
        description: "Visitor has been successfully checked out.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "You are logged out.", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to check out visitor.", variant: "destructive" });
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
      toast({
        title: "Email sent",
        description: "Your email has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const [newBooking, setNewBooking] = useState({
    visitorName: "",
    visitorEmail: "",
    visitorPhone: "",
    visitDate: "",
    visitTime: "10:00",
    groupSize: "individual" as "individual" | "small_group" | "large_group" | "custom",
    numberOfPeople: 1,
    tourType: "standard" as "standard" | "extended" | "custom",
    paymentMethod: "cash" as "cash" | "airtel_money" | "tnm_mpamba",
    meetingPointId: "",
    specialRequests: "",
    selectedZones: [] as string[],
    selectedInterests: [] as string[],
    referralSource: "",
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: typeof newBooking) => {
      await apiRequest("POST", "/api/bookings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setIsCreateBookingOpen(false);
      setNewBooking({
        visitorName: "",
        visitorEmail: "",
        visitorPhone: "",
        visitDate: "",
        visitTime: "10:00",
        groupSize: "individual",
        numberOfPeople: 1,
        tourType: "standard",
        paymentMethod: "cash",
        meetingPointId: "",
        specialRequests: "",
        selectedZones: [],
        selectedInterests: [],
        referralSource: "",
      });

      toast({
        title: "Booking created",
        description: "New booking has been created successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Historical booking mutation - for recording past visits
  const historicalBookingMutation = useMutation({
    mutationFn: async (data: typeof historicalBooking) => {
      return await apiRequest("POST", "/api/bookings/historical", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guides"] });
      setIsHistoricalOpen(false);
      setHistoricalBooking({
        visitorName: "",
        visitorEmail: "",
        visitorPhone: "",
        visitDate: "",
        visitTime: "09:00",
        groupSize: "individual",
        numberOfPeople: 1,
        tourType: "standard",
        paymentMethod: "cash",
        paymentStatus: "paid",
        meetingPointId: "",
        assignedGuideId: "",
        totalAmount: 0,
        adminNotes: "",
        selectedZones: [],
      });
      toast({
        title: "Historical Visit Recorded",
        description: "The past tour visit has been added to the system.",
      });
    },
    onError: (error: Error) => {
      console.error("Historical booking error:", error);
      toast({
        title: "Error Recording Visit",
        description: error.message || "Failed to record historical visit. Check console for details.",
        variant: "destructive",
      });
    },
  });

  const filteredBookings = bookings?.filter((booking) => {
    const matchesSearch =
      booking.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.visitorEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilters.length === 0 || statusFilters.includes(booking.status || "pending");
    const matchesDateFrom = !dateFrom || booking.visitDate >= dateFrom;
    const matchesDateTo = !dateTo || booking.visitDate <= dateTo;
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const handleViewDetails = (booking: BookingWithGuide) => {
    setSelectedBooking(booking);
    setAdminNotes(booking.adminNotes || "");
    setIsDetailOpen(true);
  };

  const handleAssignGuide = (booking: BookingWithGuide) => {
    setSelectedBooking(booking);
    setSelectedGuideId(booking.assignedGuideId || "");
    setIsAssignOpen(true);
  };

  const handleSendEmail = (booking: BookingWithGuide) => {
    setSelectedBooking(booking);
    setEmailSubject(`Regarding your Visit Dzaleka booking - ${booking.bookingReference}`);
    setEmailMessage("");
    setIsEmailOpen(true);
  };

  const getMeetingPointName = (id: string | null) => {
    if (!id) return "Not specified";
    // First try database meeting points
    if (meetingPoints) {
      const mp = meetingPoints.find((p) => p.id === id);
      if (mp) return mp.name;
    }
    // Fallback to constants
    return MEETING_POINTS.find((p) => p.id === id)?.name || "Meeting Point";
  };

  const getZoneName = (zoneId: string) => {
    if (!zones) return zoneId;
    const zone = zones.find((z) => z.id === zoneId);
    return zone?.name || zoneId;
  };

  const getTourTypeName = (id: string) => {
    return TOUR_TYPES.find((t) => t.id === id)?.name || id;
  };

  if (bookingsLoading) {
    return <TableSkeleton rows={8} />;
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Book a Tour"
        description="Schedule your visit to Dzaleka. Choose your tour type, group size, and preferred guide."
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {isDetailOpen ? "Booking Details" : "Bookings"}
        </h1>
        <p className="text-muted-foreground">
          {isDetailOpen
            ? `Managing booking #${selectedBooking?.bookingReference || selectedBooking?.id.slice(0, 8) || "..."}`
            : "Manage visitor booking requests and tour assignments."}
        </p>
      </div>

      {isDetailOpen && selectedBooking ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between pb-4 border-b">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
            <div className="flex gap-2">
              {selectedBooking.status !== "cancelled" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => updateStatusMutation.mutate({ id: selectedBooking.id, status: "cancelled" })}
                >
                  Cancel Booking
                </Button>
              )}
              <Button size="sm" onClick={() => generateBookingPDF(selectedBooking, getMeetingPointName(selectedBooking.meetingPointId))}>
                <FileDown className="mr-2 h-4 w-4" /> Export PDF
              </Button>
              {selectedItinerary && (
                <Button size="sm" variant="outline" asChild>
                  <a href={`/bookings/${selectedBooking.id}/itinerary`} target="_blank" rel="noopener noreferrer">
                    <FileDown className="mr-2 h-4 w-4" /> View Itinerary
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column: Visitor & Tour Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Visitor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Name</Label>
                      <p className="font-medium">{selectedBooking.visitorName}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedBooking.visitorEmail}</p>
                      <Button variant="ghost" className="p-0 h-auto text-xs" onClick={() => handleSendEmail(selectedBooking)}>
                        Send Email
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="font-medium">{selectedBooking.visitorPhone}</p>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Date</Label>
                      <p className="flex items-center gap-2 font-medium">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(selectedBooking.visitDate)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Time</Label>
                      <p className="flex items-center gap-2 font-medium">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatTime(selectedBooking.visitTime)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Meeting Point</Label>
                      <p className="flex items-center gap-2 font-medium">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {getMeetingPointName(selectedBooking.meetingPointId)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tour Type</Label>
                      <p className="font-medium capitalize">{getTourTypeName(selectedBooking.tourType)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Group Size</Label>
                      <p className="font-medium">{selectedBooking.numberOfPeople} {selectedBooking.numberOfPeople === 1 ? "person" : "people"}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Selected Areas</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedBooking.selectedZones && selectedBooking.selectedZones.length > 0 ? (
                          selectedBooking.selectedZones.map((zoneId) => (
                            <Badge key={zoneId} variant="secondary">{getZoneName(zoneId)}</Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">None specified</span>
                        )}
                      </div>
                    </div>
                    {selectedBooking.referralSource && (
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Referral Source</Label>
                        <p className="font-medium capitalize">{selectedBooking.referralSource.replace("-", " ")}</p>
                      </div>
                    )}
                    {selectedBooking.source && selectedBooking.source !== "direct" && (
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Booking Source</Label>
                        <p className="font-medium capitalize">{selectedBooking.source}</p>
                      </div>
                    )}
                    {selectedBooking.groupSize && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Group Type</Label>
                        <p className="font-medium capitalize">{selectedBooking.groupSize.replace("_", " ")}</p>
                      </div>
                    )}
                    {selectedBooking.customDuration && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Custom Duration</Label>
                        <p className="font-medium">{selectedBooking.customDuration} hours</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Interests Card */}
              {selectedBooking.selectedInterests && selectedBooking.selectedInterests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Visitor Interests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedBooking.selectedInterests.map((interest, idx) => (
                        <Badge key={idx} variant="outline" className="capitalize">{interest.replace(/_/g, " ")}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Special Requests & Accessibility */}
              {(selectedBooking.specialRequests || selectedBooking.accessibilityNeeds) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Special Requests & Accessibility</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedBooking.specialRequests && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Special Requests</Label>
                        <p className="text-sm mt-1">{selectedBooking.specialRequests}</p>
                      </div>
                    )}
                    {selectedBooking.accessibilityNeeds && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Accessibility Needs</Label>
                        <p className="text-sm mt-1">{selectedBooking.accessibilityNeeds}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <BookingTimeline bookingId={selectedBooking.id} />
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Management (Guide, Payment, Notes) */}
            <div className="space-y-6">
              {/* Assigned Guide Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Assigned Guide</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => handleAssignGuide(selectedBooking)}>
                    <Users className="h-4 w-4 mr-2" />
                    {selectedBooking.assignedGuideId ? "Change Guide" : "Assign Guide"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {selectedBooking.guide ? (
                    <div className="flex items-center gap-4 py-2">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedBooking.guide.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {selectedBooking.guide.firstName.charAt(0)}{selectedBooking.guide.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold">{selectedBooking.guide.firstName} {selectedBooking.guide.lastName}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {selectedBooking.guide.phone}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground border-dashed border-2 rounded-md">
                      <p className="mb-2">No guide assigned yet</p>
                      <Button size="sm" variant="secondary" onClick={() => handleAssignGuide(selectedBooking)}>
                        Select Guide
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="text-xl font-bold">{formatCurrency(selectedBooking.totalAmount || 0)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Method</Label>
                      <p className="capitalize font-medium">{(selectedBooking.paymentMethod || "cash").replace("_", " ")}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <PaymentStatusBadge status={selectedBooking.paymentStatus || "pending"} />
                        {selectedBooking.paymentStatus !== "paid" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            title="Mark as Paid"
                            onClick={() => updatePaymentMutation.mutate({ id: selectedBooking.id, paymentStatus: "paid" })}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Workflow Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Status-based actions */}
                  {selectedBooking.status === "pending" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button className="w-full" onClick={() => updateStatusMutation.mutate({ id: selectedBooking.id, status: "confirmed" })}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Confirm
                      </Button>
                      <Button className="w-full" variant="destructive" onClick={() => updateStatusMutation.mutate({ id: selectedBooking.id, status: "cancelled" })}>
                        <XCircle className="mr-2 h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )}

                  {selectedBooking.status === "confirmed" && !selectedBooking.checkInTime && (
                    <Button className="w-full" onClick={() => checkInMutation.mutate(selectedBooking.id)}>
                      <UserCheck className="mr-2 h-4 w-4" /> Check In Visitor
                    </Button>
                  )}

                  {selectedBooking.checkInTime && !selectedBooking.checkOutTime && (
                    <Button className="w-full" variant="secondary" onClick={() => checkOutMutation.mutate(selectedBooking.id)}>
                      <LogOut className="mr-2 h-4 w-4" /> Check Out Visitor
                    </Button>
                  )}

                  {/* Common actions always available */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t">
                    <Button variant="outline" className="w-full" onClick={() => handleAssignGuide(selectedBooking)}>
                      <Users className="mr-2 h-4 w-4" /> {selectedBooking.guide ? "Change Guide" : "Assign Guide"}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => handleSendEmail(selectedBooking)}>
                      <Mail className="mr-2 h-4 w-4" /> Send Email
                    </Button>
                  </div>

                  {/* Status info for completed/cancelled */}
                  {selectedBooking.status === "completed" && (
                    <div className="text-center py-2 bg-green-50 dark:bg-green-950/20 rounded-md">
                      <p className="text-sm text-green-700 dark:text-green-400">✓ This booking has been completed</p>
                      {selectedBooking.checkOutTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Checked out at {new Date(selectedBooking.checkOutTime).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedBooking.status === "cancelled" && (
                    <div className="text-center py-2 bg-red-50 dark:bg-red-950/20 rounded-md">
                      <p className="text-sm text-red-700 dark:text-red-400">✗ This booking was cancelled</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Admin Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Textarea
                    placeholder="Internal notes..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => updateNotesMutation.mutate({ id: selectedBooking.id, notes: adminNotes })}
                    disabled={updateNotesMutation.isPending}
                  >
                    Save Notes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-bookings"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-44" data-testid="select-status-filter">
                      <Filter className="mr-2 h-4 w-4" />
                      {statusFilters.length === 0
                        ? "All Status"
                        : statusFilters.length === 1
                          ? statusFilters[0].charAt(0).toUpperCase() + statusFilters[0].slice(1)
                          : `${statusFilters.length} selected`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="start">
                    <div className="space-y-2">
                      {["pending", "confirmed", "completed", "cancelled"].map((status) => (
                        <div key={status} className="flex items-center gap-2">
                          <Checkbox
                            id={`status-${status}`}
                            checked={statusFilters.includes(status)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setStatusFilters([...statusFilters, status]);
                              } else {
                                setStatusFilters(statusFilters.filter((s) => s !== status));
                              }
                            }}
                          />
                          <label
                            htmlFor={`status-${status}`}
                            className="text-sm capitalize cursor-pointer"
                          >
                            {status}
                          </label>
                        </div>
                      ))}
                      {statusFilters.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => setStatusFilters([])}
                        >
                          Clear all
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full sm:w-36"
                    placeholder="From"
                    data-testid="input-date-from"
                  />
                  <span className="text-muted-foreground hidden sm:inline">to</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full sm:w-36"
                    placeholder="To"
                    data-testid="input-date-to"
                  />
                  {(dateFrom || dateTo) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setDateFrom(""); setDateTo(""); }}
                      title="Clear dates"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/bookings"] })}
                title="Refresh bookings"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (!filteredBookings || filteredBookings.length === 0) return;

                  // Define CSV headers
                  const headers = [
                    "Reference",
                    "Visitor Name",
                    "Visitor Email",
                    "Visitor Phone",
                    "Visit Date",
                    "Visit Time",
                    "Status",
                    "Tour Type",
                    "Group Size",
                    "Number of People",
                    "Total Amount",
                    "Payment Method",
                    "Payment Status",
                    "Created At"
                  ];

                  // Map booking data to rows
                  const rows = filteredBookings.map(b => {
                    return [
                      b.bookingReference || b.id.slice(0, 8),
                      `"${b.visitorName.replace(/"/g, '""')}"`, // Escape quotes
                      b.visitorEmail,
                      b.visitorPhone || "",
                      b.visitDate,
                      b.visitTime || "",
                      b.status || "pending",
                      b.tourType || "",
                      b.groupSize || "",
                      b.numberOfPeople || 1,
                      b.totalAmount || 0,
                      b.paymentMethod || "",
                      b.paymentStatus || "pending",
                      b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : ""
                    ].join(",");
                  });

                  // Combine headers and rows
                  const csvContent = [headers.join(","), ...rows].join("\n");

                  // Create download link
                  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute("download", `bookings-export-${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                disabled={!filteredBookings || filteredBookings.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsHistoricalOpen(true)}
                data-testid="button-historical-booking"
              >
                <Clock className="mr-2 h-4 w-4" />
                Record Past Visit
              </Button>
              <Button
                onClick={() => setIsCreateBookingOpen(true)}
                data-testid="button-create-booking"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Booking
              </Button>
            </div>
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedBookingIds.size > 0 && (
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedBookingIds.size} booking{selectedBookingIds.size > 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2 ml-auto">
                <Select
                  onValueChange={(status) => {
                    if (status) {
                      Array.from(selectedBookingIds).forEach((id) => {
                        updateStatusMutation.mutate({ id, status: status as BookingStatus });
                      });
                      setSelectedBookingIds(new Set());
                    }
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Update status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Set Pending</SelectItem>
                    <SelectItem value="confirmed">Set Confirmed</SelectItem>
                    <SelectItem value="completed">Set Completed</SelectItem>
                    <SelectItem value="cancelled">Set Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBookingIds(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          <Card>
            {!filteredBookings || filteredBookings.length === 0 ? (
              <CardContent className="p-6">
                <EmptyState
                  icon={BookOpen}
                  title="No bookings found"
                  description={
                    searchQuery || statusFilters.length > 0
                      ? "Try adjusting your search or filters."
                      : "New booking requests will appear here when visitors submit them."
                  }
                />
              </CardContent>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={filteredBookings?.length > 0 && selectedBookingIds.size === filteredBookings?.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedBookingIds(new Set(filteredBookings?.map(b => b.id) || []));
                            } else {
                              setSelectedBookingIds(new Set());
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Visitor</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Tour Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Guide</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        className="hover-elevate"
                        data-testid={`booking-row-${booking.id}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedBookingIds.has(booking.id)}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(selectedBookingIds);
                              if (checked) {
                                newSet.add(booking.id);
                              } else {
                                newSet.delete(booking.id);
                              }
                              setSelectedBookingIds(newSet);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <button
                              className="font-medium text-left hover:text-primary hover:underline cursor-pointer transition-colors"
                              onClick={() => handleViewDetails(booking)}
                            >
                              {booking.visitorName}
                            </button>
                            <span className="text-xs text-muted-foreground">
                              {booking.visitorEmail}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(booking.visitDate)}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(booking.visitTime)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {booking.numberOfPeople}{" "}
                            {booking.numberOfPeople === 1 ? "person" : "people"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {getTourTypeName(booking.tourType)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(booking.totalAmount || 0)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={booking.status || "pending"} />
                        </TableCell>
                        <TableCell>
                          {booking.guide ? (
                            <span className="text-sm">
                              {booking.guide.firstName} {booking.guide.lastName}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-actions-${booking.id}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(booking)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleAssignGuide(booking)}
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Assign Guide
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSendEmail(booking)}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {booking.status === "pending" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: booking.id,
                                      status: "confirmed",
                                    })
                                  }
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                  Confirm Booking
                                </DropdownMenuItem>
                              )}
                              {booking.status !== "completed" && booking.status !== "cancelled" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: booking.id,
                                      status: "completed",
                                    })
                                  }
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                                  Mark Completed
                                </DropdownMenuItem>
                              )}
                              {booking.status !== "cancelled" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: booking.id,
                                      status: "cancelled",
                                    })
                                  }
                                  className="text-destructive"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel Booking
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {booking.status === "confirmed" && !booking.checkInTime && (
                                <DropdownMenuItem onClick={() => checkInMutation.mutate(booking.id)}>
                                  <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                                  Check In
                                </DropdownMenuItem>
                              )}
                              {booking.checkInTime && !booking.checkOutTime && (
                                <DropdownMenuItem onClick={() => checkOutMutation.mutate(booking.id)}>
                                  <LogOut className="mr-2 h-4 w-4 text-orange-600" />
                                  Check Out
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

          </Card>
        </>
      )}



      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Guide</DialogTitle>
            <DialogDescription>
              Select a guide to assign to this booking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedGuideId} onValueChange={setSelectedGuideId}>
              <SelectTrigger data-testid="select-guide">
                <SelectValue placeholder="Select a guide" />
              </SelectTrigger>
              <SelectContent>
                {guides?.filter((g) => g.isActive).map((guide) => (
                  <SelectItem key={guide.id} value={guide.id}>
                    {guide.firstName} {guide.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedBooking &&
                assignGuideMutation.mutate({
                  bookingId: selectedBooking.id,
                  guideId: selectedGuideId,
                })
              }
              disabled={!selectedGuideId || assignGuideMutation.isPending}
              data-testid="button-confirm-assign"
            >
              Assign Guide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send an email to {selectedBooking?.visitorName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-recipient">To</Label>
              <Input
                id="email-recipient"
                value={selectedBooking?.visitorEmail || ""}
                disabled
                data-testid="input-email-recipient"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                placeholder="Email subject..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                data-testid="input-email-subject"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                placeholder="Type your message here..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="min-h-[150px]"
                data-testid="textarea-email-message"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedBooking &&
                sendEmailMutation.mutate({
                  recipientName: selectedBooking.visitorName,
                  recipientEmail: selectedBooking.visitorEmail,
                  subject: emailSubject,
                  message: emailMessage,
                })
              }
              disabled={!emailSubject || !emailMessage || sendEmailMutation.isPending}
              data-testid="button-send-email"
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Booking Dialog */}
      <Dialog open={isCreateBookingOpen} onOpenChange={setIsCreateBookingOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
            <DialogDescription>
              Manually create a booking for a visitor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visitor-name">Visitor Name *</Label>
                <Input
                  id="visitor-name"
                  placeholder="Full name"
                  value={newBooking.visitorName}
                  onChange={(e) => setNewBooking({ ...newBooking, visitorName: e.target.value })}
                  data-testid="input-new-visitor-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visitor-phone">Phone Number *</Label>
                <Input
                  id="visitor-phone"
                  placeholder="+265..."
                  value={newBooking.visitorPhone}
                  onChange={(e) => setNewBooking({ ...newBooking, visitorPhone: e.target.value })}
                  data-testid="input-new-visitor-phone"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitor-email">Email Address *</Label>
              <Input
                id="visitor-email"
                type="email"
                placeholder="visitor@example.com"
                value={newBooking.visitorEmail}
                onChange={(e) => setNewBooking({ ...newBooking, visitorEmail: e.target.value })}
                data-testid="input-new-visitor-email"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visit-date">Visit Date *</Label>
                <Input
                  id="visit-date"
                  type="date"
                  value={newBooking.visitDate}
                  onChange={(e) => setNewBooking({ ...newBooking, visitDate: e.target.value })}
                  data-testid="input-new-visit-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visit-time">Preferred Start Time *</Label>
                <Input
                  id="visit-time"
                  type="time"
                  value={newBooking.visitTime}
                  onChange={(e) => setNewBooking({ ...newBooking, visitTime: e.target.value })}
                  data-testid="input-new-visit-time"
                />
                <p className="text-xs text-muted-foreground">💡 Standard start times: 10:00 AM and 2:00 PM. Standard tours are 2 hours. Additional hours at MWK 10,000/hr.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Group Size *</Label>
                <Select
                  value={newBooking.groupSize}
                  onValueChange={(value: "individual" | "small_group" | "large_group" | "custom") =>
                    setNewBooking({ ...newBooking, groupSize: value })
                  }
                >
                  <SelectTrigger data-testid="select-new-group-size">
                    <SelectValue placeholder="Select group size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual (1 person)</SelectItem>
                    <SelectItem value="small_group">Small Group (2-5 people)</SelectItem>
                    <SelectItem value="large_group">Large Group (6-15 people)</SelectItem>
                    <SelectItem value="custom">Custom (16+ people)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="number-of-people">Number of People *</Label>
                <Input
                  id="number-of-people"
                  type="number"
                  min="1"
                  value={newBooking.numberOfPeople}
                  onChange={(e) => setNewBooking({ ...newBooking, numberOfPeople: parseInt(e.target.value) || 1 })}
                  data-testid="input-new-number-people"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tour Type *</Label>
                <Select
                  value={newBooking.tourType}
                  onValueChange={(value: "standard" | "extended" | "custom") =>
                    setNewBooking({ ...newBooking, tourType: value })
                  }
                >
                  <SelectTrigger data-testid="select-new-tour-type">
                    <SelectValue placeholder="Select tour type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (2 hours)</SelectItem>
                    <SelectItem value="extended">Extended (3-4 hours)</SelectItem>
                    <SelectItem value="custom">Custom Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select
                  value={newBooking.paymentMethod}
                  onValueChange={(value: "airtel_money" | "tnm_mpamba" | "cash") =>
                    setNewBooking({ ...newBooking, paymentMethod: value })
                  }
                >
                  <SelectTrigger data-testid="select-new-payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="airtel_money">Airtel Money</SelectItem>
                    <SelectItem value="tnm_mpamba">TNM Mpamba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>How Did You Hear About Us?</Label>
              <Select
                value={newBooking.referralSource}
                onValueChange={(value) => setNewBooking({ ...newBooking, referralSource: value })}
              >
                <SelectTrigger data-testid="select-new-referral-source">
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
              <Label>Meeting Point</Label>
              <Select
                value={newBooking.meetingPointId}
                onValueChange={(value) => setNewBooking({ ...newBooking, meetingPointId: value })}
              >
                <SelectTrigger data-testid="select-new-meeting-point">
                  <SelectValue placeholder="Select meeting point" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_specified">Not specified</SelectItem>
                  {meetingPoints?.map((mp) => (
                    <SelectItem key={mp.id} value={mp.id}>{mp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Areas of Interest Section */}
            {((zones && zones.length > 0) || (pointsOfInterest && pointsOfInterest.length > 0)) && (
              <div className="space-y-3">
                <Label>Areas of Interest (Select all that apply)</Label>
                {zones && zones.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Camp Zones</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {zones.map((zone) => (
                        <div key={zone.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`zone-${zone.id}`}
                            checked={newBooking.selectedZones?.includes(zone.id) || false}
                            onCheckedChange={(checked) => {
                              const currentZones = newBooking.selectedZones || [];
                              const newZones = checked
                                ? [...currentZones, zone.id]
                                : currentZones.filter((z: string) => z !== zone.id);
                              setNewBooking({ ...newBooking, selectedZones: newZones });
                            }}
                          />
                          <label htmlFor={`zone-${zone.id}`} className="text-sm cursor-pointer">
                            {zone.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {pointsOfInterest && pointsOfInterest.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Points of Interest ({pointsOfInterest.length} available)
                    </p>
                    <div className="max-h-48 overflow-y-auto border rounded-md p-3 bg-muted/20">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {pointsOfInterest.map((poi) => (
                          <div key={poi.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`poi-${poi.id}`}
                              checked={newBooking.selectedInterests?.includes(poi.id) || false}
                              onCheckedChange={(checked) => {
                                const currentInterests = newBooking.selectedInterests || [];
                                const newInterests = checked
                                  ? [...currentInterests, poi.id]
                                  : currentInterests.filter((p: string) => p !== poi.id);
                                setNewBooking({ ...newBooking, selectedInterests: newInterests });
                              }}
                            />
                            <label htmlFor={`poi-${poi.id}`} className="text-sm cursor-pointer">
                              {poi.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="special-requests">Special Requests</Label>
              <Textarea
                id="special-requests"
                placeholder="Any special requirements or notes..."
                value={newBooking.specialRequests}
                onChange={(e) => setNewBooking({ ...newBooking, specialRequests: e.target.value })}
                data-testid="textarea-new-special-requests"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateBookingOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createBookingMutation.mutate(newBooking)}
              disabled={
                !newBooking.visitorName ||
                !newBooking.visitorEmail ||
                !newBooking.visitorPhone ||
                !newBooking.visitDate ||
                !newBooking.visitTime ||
                createBookingMutation.isPending
              }
              data-testid="button-submit-booking"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Historical Booking Dialog */}
      <Dialog open={isHistoricalOpen} onOpenChange={setIsHistoricalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Past Visit</DialogTitle>
            <DialogDescription>
              Enter details for a tour that was completed before this system was in use.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Row 1: Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hist-name">Visitor Name *</Label>
                <Input
                  id="hist-name"
                  value={historicalBooking.visitorName}
                  onChange={(e) => setHistoricalBooking({ ...historicalBooking, visitorName: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hist-email">Email *</Label>
                <Input
                  id="hist-email"
                  type="email"
                  value={historicalBooking.visitorEmail}
                  onChange={(e) => setHistoricalBooking({ ...historicalBooking, visitorEmail: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            {/* Row 2: Phone & Date/Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hist-phone">Phone</Label>
                <Input
                  id="hist-phone"
                  value={historicalBooking.visitorPhone}
                  onChange={(e) => setHistoricalBooking({ ...historicalBooking, visitorPhone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hist-date">Visit Date *</Label>
                <Input
                  id="hist-date"
                  type="date"
                  value={historicalBooking.visitDate}
                  onChange={(e) => setHistoricalBooking({ ...historicalBooking, visitDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hist-time">Visit Time</Label>
                <Input
                  id="hist-time"
                  type="time"
                  value={historicalBooking.visitTime}
                  onChange={(e) => setHistoricalBooking({ ...historicalBooking, visitTime: e.target.value })}
                />
              </div>
            </div>

            {/* Row 3: Tour Type & Group Size & Number */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hist-tour">Tour Type</Label>
                <Select
                  value={historicalBooking.tourType}
                  onValueChange={(v) => setHistoricalBooking({ ...historicalBooking, tourType: v as any })}
                >
                  <SelectTrigger id="hist-tour">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Tour</SelectItem>
                    <SelectItem value="extended">Extended Tour</SelectItem>
                    <SelectItem value="custom">Custom Tour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hist-group">Group Size</Label>
                <Select
                  value={historicalBooking.groupSize}
                  onValueChange={(v) => setHistoricalBooking({ ...historicalBooking, groupSize: v as any })}
                >
                  <SelectTrigger id="hist-group">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="small_group">Small Group (2-5)</SelectItem>
                    <SelectItem value="large_group">Large Group (6+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hist-people">Number of People</Label>
                <Input
                  id="hist-people"
                  type="number"
                  min="1"
                  value={historicalBooking.numberOfPeople}
                  onChange={(e) => setHistoricalBooking({ ...historicalBooking, numberOfPeople: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            {/* Row 4: Meeting Point & Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hist-meeting">Meeting Point</Label>
                <Select
                  value={historicalBooking.meetingPointId || "none"}
                  onValueChange={(v) => setHistoricalBooking({ ...historicalBooking, meetingPointId: v === "none" ? "" : v })}
                >
                  <SelectTrigger id="hist-meeting">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {meetingPoints?.map((mp) => (
                      <SelectItem key={mp.id} value={mp.id}>
                        {mp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hist-guide">Assigned Guide</Label>
                <Select
                  value={historicalBooking.assignedGuideId || "none"}
                  onValueChange={(v) => setHistoricalBooking({ ...historicalBooking, assignedGuideId: v === "none" ? "" : v })}
                >
                  <SelectTrigger id="hist-guide">
                    <SelectValue placeholder="Select guide" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No guide assigned</SelectItem>
                    {guides?.map((guide) => (
                      <SelectItem key={guide.id} value={guide.id}>
                        {guide.firstName} {guide.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 5: Payment Method, Status & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hist-payment-method">Payment Method</Label>
                <Select
                  value={historicalBooking.paymentMethod}
                  onValueChange={(v) => setHistoricalBooking({ ...historicalBooking, paymentMethod: v as any })}
                >
                  <SelectTrigger id="hist-payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="airtel_money">Airtel Money</SelectItem>
                    <SelectItem value="tnm_mpamba">TNM Mpamba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hist-payment-status">Payment Status</Label>
                <Select
                  value={historicalBooking.paymentStatus}
                  onValueChange={(v) => setHistoricalBooking({ ...historicalBooking, paymentStatus: v as any })}
                >
                  <SelectTrigger id="hist-payment-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hist-amount">Total Amount (MWK)</Label>
                <Input
                  id="hist-amount"
                  type="number"
                  min="0"
                  value={historicalBooking.totalAmount}
                  onChange={(e) => setHistoricalBooking({ ...historicalBooking, totalAmount: parseInt(e.target.value) || 0 })}
                  placeholder="Leave 0 to auto-calculate"
                />
              </div>
            </div>

            {/* Row 6: Selected Zones */}
            {zones && zones.length > 0 && (
              <div className="space-y-2">
                <Label>Visited Zones</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {zones.map((zone) => (
                    <div key={zone.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`hist-zone-${zone.id}`}
                        checked={(historicalBooking as any).selectedZones?.includes(zone.id) || false}
                        onCheckedChange={(checked) => {
                          const currentZones = (historicalBooking as any).selectedZones || [];
                          const newZones = checked
                            ? [...currentZones, zone.id]
                            : currentZones.filter((z: string) => z !== zone.id);
                          setHistoricalBooking({ ...historicalBooking, selectedZones: newZones } as any);
                        }}
                      />
                      <label htmlFor={`hist-zone-${zone.id}`} className="text-sm cursor-pointer">
                        {zone.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Row 7: Notes */}
            <div className="space-y-2">
              <Label htmlFor="hist-notes">Notes</Label>
              <Textarea
                id="hist-notes"
                value={historicalBooking.adminNotes}
                onChange={(e) => setHistoricalBooking({ ...historicalBooking, adminNotes: e.target.value })}
                placeholder="Any additional details about this historical visit"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoricalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => historicalBookingMutation.mutate(historicalBooking)}
              disabled={historicalBookingMutation.isPending || !historicalBooking.visitorName || !historicalBooking.visitorEmail || !historicalBooking.visitDate}
            >
              {historicalBookingMutation.isPending ? "Recording..." : "Record Visit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
