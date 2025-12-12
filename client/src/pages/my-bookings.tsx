import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDate, formatTime, formatCurrency } from "@/lib/constants";
import type { Booking, MeetingPoint, Zone, Guide } from "@shared/schema";

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
}


// PDF Generator function
const generateBookingPDF = (booking: Booking, meetingPointName: string) => {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(2, 132, 199);
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
  doc.text(`Tour Type: ${booking.tourType === 'standard' ? 'Standard (2 hours)' : booking.tourType === 'extended' ? 'Extended (3-4 hours)' : 'Custom'}`, 20, 144);
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
  doc.text(`Payment Method: ${booking.paymentMethod === 'airtel_money' ? 'Airtel Money' : booking.paymentMethod === 'tnm_mpamba' ? 'TNM Mpamba' : 'Cash'}`, 20, 203);

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
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

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

  // Auto-populate form with logged-in user's data
  useEffect(() => {
    if (user) {
      setNewBooking(prev => ({
        ...prev,
        visitorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || prev.visitorName,
        visitorEmail: user.email || prev.visitorEmail,
        visitorPhone: user.phone || prev.visitorPhone,
      }));
    }
  }, [user]);

  const { data: bookings, isLoading } = useQuery<BookingWithGuide[]>({
    queryKey: ["/api/bookings/my-bookings"],
  });

  const { data: meetingPoints } = useQuery<MeetingPoint[]>({
    queryKey: ["/api/meeting-points"],
  });

  const { data: zones } = useQuery<Zone[]>({
    queryKey: ["/api/zones"],
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: typeof newBooking) => {
      await apiRequest("POST", "/api/bookings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-bookings"] });
      setIsCreateOpen(false);
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
    mutationFn: async ({ id, visitDate, visitTime }: { id: string; visitDate: string; visitTime: string }) => {
      return apiRequest("PATCH", `/api/bookings/${id}/reschedule`, { visitDate, visitTime });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-bookings"] });
      setRescheduleDialogOpen(false);
      setSelectedBooking(null);
      setRescheduleDate("");
      setRescheduleTime("");
      toast({
        title: "Booking rescheduled",
        description: "Your booking has been moved to the new date and time.",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
            My Bookings
          </h1>
          <p className="text-muted-foreground">
            View your tour bookings and request new visits to Dzaleka.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} data-testid="button-new-booking">
          <Plus className="mr-2 h-4 w-4" />
          Book a Tour
        </Button>
      </div>

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
                  <div className="flex items-center gap-2">
                    {getStatusIcon(booking.status || "pending")}
                    <CardTitle className="text-base">
                      {booking.tourType === "standard"
                        ? "Standard Tour"
                        : booking.tourType === "extended"
                          ? "Extended Tour"
                          : "Custom Tour"}
                    </CardTitle>
                  </div>
                  <StatusBadge status={booking.status || "pending"} />
                </div>
                <CardDescription className="text-xs">
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
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{getMeetingPointName(booking.meetingPointId)}</span>
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

                {/* Self-service action buttons */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {/* Reschedule - only for pending or confirmed */}
                  {(booking.status === "pending" || booking.status === "confirmed") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setRescheduleDate(booking.visitDate);
                        setRescheduleTime(booking.visitTime || "");
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book a Tour</DialogTitle>
            <DialogDescription>
              Request a guided tour of Dzaleka Refugee Camp. Our team will review your request and confirm your booking.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
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
                  placeholder="+265..."
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
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="individual">Individual (1 person)</SelectItem>
                    <SelectItem value="small_group">Small Group (2-5 people)</SelectItem>
                    <SelectItem value="large_group">Large Group (6-15 people)</SelectItem>
                    <SelectItem value="custom">Custom (16+ people)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                  onValueChange={(value: "airtel_money" | "tnm_mpamba" | "cash") =>
                    setNewBooking({ ...newBooking, paymentMethod: value })
                  }
                >
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash (on arrival)</SelectItem>
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
            <div className="space-y-2">
              <Label htmlFor="special-requests">Special Requests or Accessibility Needs</Label>
              <Textarea
                id="special-requests"
                placeholder="Any special requirements, interests, or accessibility needs..."
                value={newBooking.specialRequests}
                onChange={(e) => setNewBooking({ ...newBooking, specialRequests: e.target.value })}
                data-testid="textarea-special-requests"
              />
            </div>
          </div>
          <DialogFooter>
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
                  Submitting...
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
            <DialogTitle>Reschedule Your Booking</DialogTitle>
            <DialogDescription>
              Choose a new date and time for your visit.
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
                  });
                }
              }}
              disabled={!rescheduleDate || !rescheduleTime || rescheduleMutation.isPending}
            >
              {rescheduleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rescheduling...
                </>
              ) : (
                <>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Confirm New Date
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
                  Cancelling...
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
                  Submitting...
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
    </div>
  );
}
