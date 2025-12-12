import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Booking, Guide, Zone, MeetingPoint, BookingStatus } from "@shared/schema";
import { SEO } from "@/components/seo";

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

export default function Bookings() {
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
    visitTime: "",
    groupSize: "individual" as "individual" | "small_group" | "large_group" | "custom",
    numberOfPeople: 1,
    tourType: "standard" as "standard" | "extended" | "custom",
    paymentMethod: "cash" as "cash" | "airtel_money" | "tnm_mpamba",
    meetingPointId: "",
    specialRequests: "",
    selectedZones: [] as string[],
    selectedInterests: [] as string[],
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
        visitTime: "",
        groupSize: "individual",
        numberOfPeople: 1,
        tourType: "standard",
        paymentMethod: "cash",
        meetingPointId: "",
        specialRequests: "",
        selectedZones: [],
        selectedInterests: [],
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
        <h1 className="text-3xl font-semibold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground">
          Manage visitor booking requests and tour assignments.
        </p>
      </div>

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
          <div className="flex flex-wrap gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-44" data-testid="select-status-filter">
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
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36"
              placeholder="From"
              data-testid="input-date-from"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36"
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
                        <span className="font-medium">{booking.visitorName}</span>
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

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Complete information about this booking request.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedBooking.visitorName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Booking Ref: {selectedBooking.bookingReference || selectedBooking.id.slice(0, 8)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedBooking.status || "pending"} />
                  <PaymentStatusBadge
                    status={selectedBooking.paymentStatus || "pending"}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {selectedBooking.visitorEmail}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {selectedBooking.visitorPhone}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Tour Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(selectedBooking.visitDate)}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatTime(selectedBooking.visitTime)}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {selectedBooking.numberOfPeople}{" "}
                      {selectedBooking.numberOfPeople === 1
                        ? "person"
                        : "people"}{" "}
                      ({getTourTypeName(selectedBooking.tourType)})
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {getMeetingPointName(selectedBooking.meetingPointId)}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      {formatCurrency(selectedBooking.totalAmount || 0)} (
                      {selectedBooking.paymentMethod?.replace("_", " ")})
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedBooking.selectedZones &&
                selectedBooking.selectedZones.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Selected Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedBooking.selectedZones.map((zoneId) => (
                          <span
                            key={zoneId}
                            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                          >
                            {getZoneName(zoneId)}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {selectedBooking.specialRequests && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Special Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedBooking.specialRequests}</p>
                  </CardContent>
                </Card>
              )}

              {/* Booking Timeline */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BookingTimeline bookingId={selectedBooking.id} />
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="admin-notes">Admin Notes</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add internal notes about this booking..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="textarea-admin-notes"
                />
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Close
                </Button>
                {selectedBooking.paymentStatus !== "paid" && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      updatePaymentMutation.mutate({
                        id: selectedBooking.id,
                        paymentStatus: "paid",
                      })
                    }
                    disabled={updatePaymentMutation.isPending}
                    data-testid="button-mark-paid"
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </Button>
                )}
                <Button
                  onClick={() =>
                    updateNotesMutation.mutate({
                      id: selectedBooking.id,
                      notes: adminNotes,
                    })
                  }
                  disabled={updateNotesMutation.isPending}
                  data-testid="button-save-notes"
                >
                  Save Notes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="visit-time">Visit Time *</Label>
                <Input
                  id="visit-time"
                  type="time"
                  value={newBooking.visitTime}
                  onChange={(e) => setNewBooking({ ...newBooking, visitTime: e.target.value })}
                  data-testid="input-new-visit-time"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
              <Label>Meeting Point</Label>
              <Select
                value={newBooking.meetingPointId}
                onValueChange={(value) => setNewBooking({ ...newBooking, meetingPointId: value })}
              >
                <SelectTrigger data-testid="select-new-meeting-point">
                  <SelectValue placeholder="Select meeting point" />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_POINTS.map((mp) => (
                    <SelectItem key={mp.id} value={mp.id}>{mp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-3 gap-4">
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
            <div className="grid grid-cols-3 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-3 gap-4">
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
                <div className="grid grid-cols-3 gap-2">
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
    </div>
  );
}
