
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Link } from "wouter";
import { useState } from "react";
import {
  CalendarDays,
  Users,
  BookOpen,
  Clock,
  TrendingUp,
  ArrowRight,
  MapPin,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  Star,
  ExternalLink,
  FileText,
  Mail,
  Send,
  Loader2,
  XCircle,
  Globe,
  Plus,
  BarChart3,
  UserPlus,
  Bell,
  Calendar,
  MessageCircle,
  ListTodo,
  Ticket,
  Download,
  FileDown,
  Phone,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { StatCard } from "@/components/stat-card";
import { ReportIncidentDialog } from "@/components/report-incident-dialog";
import { IncidentsList } from "@/components/incidents-list";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import { formatDate, formatTime, formatCurrency } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { WeeklyBookingTrends, PopularZonesChart, GuidePerformanceChart, BookingTimeHeatmap, SeasonalTrendsChart, GuideComparisonChart, RevenueByChannelChart, ReferralSourceChart, ConversionRateChart } from "@/components/dashboard-charts";
import type { Booking, Guide, Incident } from "@shared/schema";
import { SEO } from "@/components/seo";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";

interface DashboardStats {
  totalBookings: number;
  pendingRequests: number;
  activeGuides: number;
  todaysTours: number;
  weeklyRevenue: number;
  monthlyGrowth: number;
}

interface RecentBooking extends Booking {
  guide?: Guide;
}

interface GuideStats {
  totalTours: number;
  completedTours: number;
  averageRating: number;
  upcomingTours: number;
}

interface SecurityStats {
  activeVisitors: number;
  todaysCheckIns: number;
  todaysCheckOuts: number;
  pendingVerifications: number;
  openIncidents: number;
}

interface VisitorStats {
  totalBookings: number;
  upcomingBookings: number;
  completedTours: number;
}

function AdminDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipientName: "",
    recipientEmail: "",
    subject: "",
    message: "",
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: recentBookings, isLoading: bookingsLoading } = useQuery<RecentBooking[]>({
    queryKey: ["/api/bookings/recent"],
  });

  const { data: todaysTours, isLoading: toursLoading } = useQuery<RecentBooking[]>({
    queryKey: ["/api/bookings/today"],
  });

  const { data: itineraries } = useQuery<{ bookingId: string }[]>({
    queryKey: ["/api/my-itineraries"],
    enabled: !!user,
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: typeof emailForm) => {
      const response = await apiRequest("POST", "/api/send-email", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Your email has been sent successfully.",
      });
      setEmailDialogOpen(false);
      setEmailForm({ recipientName: "", recipientEmail: "", subject: "", message: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send",
        description: error.message || "There was an error sending the email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const queryClientDashboard = useQueryClient();

  const quickConfirmMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await apiRequest("PATCH", `/api/bookings/${bookingId}/status`, { status: "confirmed" });
    },
    onSuccess: () => {
      queryClientDashboard.invalidateQueries({ queryKey: ["/api/bookings/recent"] });
      queryClientDashboard.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Booking Confirmed",
        description: "The booking has been confirmed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Confirm",
        description: error.message || "Failed to confirm booking.",
        variant: "destructive",
      });
    },
  });

  const isLoading = statsLoading || bookingsLoading || toursLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const dashboardStats = stats || {
    totalBookings: 0,
    pendingRequests: 0,
    activeGuides: 0,
    todaysTours: 0,
    weeklyRevenue: 0,
    monthlyGrowth: 0,
  };

  // Check if there are any tours currently in progress
  const hasActiveTours = todaysTours?.some(t => t.status === "in_progress") || false;

  return (
    <PageContainer className="page-spacing overflow-x-hidden">
      <SEO
        title="Dashboard"
        description="Manage your Dzaleka tours, bookings, guides, and analytics from your admin dashboard."
      />
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.firstName}. Here is your daily overview.`}
      />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {user?.role === "admin" && (
          <>
            <Link href="/bookings">
              <Button variant="secondary" size="sm" className="rounded-full gap-1.5 h-8 px-3">
                <Plus className="h-3.5 w-3.5" />
                <span>Booking</span>
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="secondary" size="sm" className="rounded-full gap-1.5 h-8 px-3">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Analytics</span>
              </Button>
            </Link>
            <Link href="/guides">
              <Button variant="secondary" size="sm" className="rounded-full gap-1.5 h-8 px-3">
                <UserPlus className="h-3.5 w-3.5" />
                <span>Guides</span>
              </Button>
            </Link>
            <Link href="/send-email">
              <Button variant="secondary" size="sm" className="rounded-full gap-1.5 h-8 px-3">
                <Mail className="h-3.5 w-3.5" />
                <span>Email</span>
              </Button>
            </Link>
            <Link href="/revenue">
              <Button variant="secondary" size="sm" className="rounded-full gap-1.5 h-8 px-3">
                <DollarSign className="h-3.5 w-3.5" />
                <span>Revenue</span>
              </Button>
            </Link>
          </>
        )}
        {user?.role === "guide" && (
          <>
            <Link href="/calendar">
              <Button variant="secondary" size="sm" className="rounded-full gap-1.5 h-8 px-3">
                <Calendar className="h-3.5 w-3.5" />
                <span>Schedule</span>
              </Button>
            </Link>
            <Link href="/tasks">
              <Button variant="secondary" size="sm" className="rounded-full gap-1.5 h-8 px-3">
                <ListTodo className="h-3.5 w-3.5" />
                <span>Tasks</span>
              </Button>
            </Link>
            <Link href="/messages">
              <Button variant="secondary" size="sm" className="rounded-full gap-1.5 h-8 px-3">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Messages</span>
              </Button>
            </Link>
            <Link href="/guide-training">
              <Button variant="secondary" size="sm" className="rounded-full gap-1.5 h-8 px-3">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Training</span>
              </Button>
            </Link>
          </>
        )}
        {user?.role === "visitor" && (
          <>
            <Link href="/bookings">
              <Button variant="secondary" size="sm" className="rounded-full gap-1.5 h-8 px-3">
                <Ticket className="h-3.5 w-3.5" />
                <span>Book</span>
              </Button>
            </Link>
            <Link href="/my-bookings">
              <Button variant="secondary" size="sm" className="rounded-full gap-1.5 h-8 px-3">
                <Calendar className="h-3.5 w-3.5" />
                <span>Bookings</span>
              </Button>
            </Link>
            <Link href="/messages">
              <Button variant="secondary" size="sm" className="rounded-full gap-1.5 h-8 px-3">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Messages</span>
              </Button>
            </Link>
            <Link href="/resources">
              <Button variant="secondary" size="sm" className="rounded-full gap-1.5 h-8 px-3">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Resources</span>
              </Button>
            </Link>
          </>
        )}
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Bookings"
          value={dashboardStats.totalBookings}
          subtitle="All time"
          icon={BookOpen}
          trend={{
            value: dashboardStats.monthlyGrowth,
            isPositive: dashboardStats.monthlyGrowth > 0,
          }}
        />
        <StatCard
          title="Pending Requests"
          value={dashboardStats.pendingRequests}
          subtitle="Awaiting confirmation"
          icon={Clock}
        />
        <StatCard
          title="Active Guides"
          value={dashboardStats.activeGuides}
          subtitle="Available this week"
          icon={Users}
        />
        <StatCard
          title="Today's Tours"
          value={dashboardStats.todaysTours}
          subtitle={hasActiveTours ? "Tour in progress" : formatDate(new Date())}
          icon={CalendarDays}
          highlight={hasActiveTours}
          pulse={hasActiveTours}
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 items-stretch [&>*]:h-full">
        <WeeklyBookingTrends />
        <ConversionRateChart />
        <SeasonalTrendsChart />
        <RevenueByChannelChart />
        <ReferralSourceChart />
        <BookingTimeHeatmap />
        <PopularZonesChart />
        <GuidePerformanceChart />
        <GuideComparisonChart />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendar" data-testid="link-view-calendar">
                View Calendar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!todaysTours || todaysTours.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No tours today"
                description="There are no scheduled tours for today."
                className="py-8"
              />
            ) : (
              <div className="space-y-4">
                {todaysTours.slice(0, 4).map((tour) => (
                  <div
                    key={tour.id}
                    className="flex items-center gap-4 rounded-lg border p-4 hover-elevate"
                    data-testid={`tour-card-${tour.id}`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tour.visitorName}</span>
                        <StatusBadge status={tour.status || "pending"} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(tour.visitTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {tour.numberOfPeople} {tour.numberOfPeople === 1 ? "person" : "people"}
                        </span>
                      </div>
                    </div>
                    {tour.guide && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={tour.guide.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {tour.guide.firstName?.[0]}{tour.guide.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Recent Booking Requests</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/bookings" data-testid="link-view-bookings">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!recentBookings || recentBookings.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No booking requests"
                description="New booking requests will appear here."
                className="py-8"
              />
            ) : (
              <div className="space-y-4">
                {recentBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex flex-wrap items-center gap-4" data-testid={`booking-row-${booking.id}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {booking.visitorName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{booking.visitorName}</span>
                        <StatusBadge status={booking.status || "pending"} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(booking.visitDate)} at {formatTime(booking.visitTime)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {booking.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => quickConfirmMutation.mutate(booking.id)}
                          disabled={quickConfirmMutation.isPending}
                          className="h-8"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Confirm
                        </Button>
                      )}
                      <div className="text-right min-w-[60px]">
                        <div className="text-sm font-medium">{formatCurrency(booking.totalAmount || 0)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
                <Link href="/bookings" data-testid="action-manage-bookings">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">Manage Bookings</div>
                    <div className="text-xs text-muted-foreground">View and process requests</div>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
                <Link href="/guides" data-testid="action-manage-guides">
                  <Users className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">Manage Guides</div>
                    <div className="text-xs text-muted-foreground">Update availability</div>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
                <Link href="/users" data-testid="action-manage-users">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">User Management</div>
                    <div className="text-xs text-muted-foreground">Manage user accounts</div>
                  </div>
                </Link>
              </Button>
              <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" data-testid="action-send-email">
                    <Mail className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">Send Email</div>
                      <div className="text-xs text-muted-foreground">Compose a message</div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Compose Email</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!e.currentTarget.checkValidity()) {
                        e.currentTarget.reportValidity();
                        return;
                      }
                      if (!emailForm.recipientEmail || !emailForm.subject || !emailForm.message) {
                        toast({
                          title: "Validation Error",
                          description: "Please fill in all required fields.",
                          variant: "destructive",
                        });
                        return;
                      }
                      sendEmailMutation.mutate(emailForm);
                    }}
                    className="space-y-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="recipientName">Recipient Name</Label>
                        <Input
                          id="recipientName"
                          placeholder="John Doe"
                          value={emailForm.recipientName}
                          onChange={(e) => setEmailForm({ ...emailForm, recipientName: e.target.value })}
                          data-testid="input-recipient-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recipientEmail">Recipient Email *</Label>
                        <Input
                          id="recipientEmail"
                          type="email"
                          placeholder="john@example.com"
                          required
                          value={emailForm.recipientEmail}
                          onChange={(e) => setEmailForm({ ...emailForm, recipientEmail: e.target.value })}
                          data-testid="input-recipient-email"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        placeholder="Email subject..."
                        required
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                        data-testid="input-email-subject"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        placeholder="Write your message here..."
                        required
                        rows={6}
                        value={emailForm.message}
                        onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                        data-testid="input-email-message"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEmailDialogOpen(false)}
                        data-testid="button-cancel-email"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={sendEmailMutation.isPending}
                        data-testid="button-send-email"
                      >
                        {sendEmailMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Email
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Weekly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatCurrency(dashboardStats.weeklyRevenue)}</div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>+12% from last week</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function CoordinatorDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: todaysTours, isLoading: toursLoading } = useQuery<RecentBooking[]>({
    queryKey: ["/api/bookings/today"],
  });

  const { data: recentBookings, isLoading: bookingsLoading } = useQuery<RecentBooking[]>({
    queryKey: ["/api/bookings/recent"],
  });

  const isLoading = statsLoading || toursLoading || bookingsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const dashboardStats = stats || {
    totalBookings: 0,
    pendingRequests: 0,
    activeGuides: 0,
    todaysTours: 0,
    weeklyRevenue: 0,
    monthlyGrowth: 0,
  };

  const hasActiveTours = todaysTours?.some(t => t.status === "in_progress") || false;

  return (
    <PageContainer className="page-spacing">
      <PageHeader
        title="Coordinator Dashboard"
        description="Manage bookings, guides, and tour scheduling."
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Requests"
          value={dashboardStats.pendingRequests}
          subtitle="Need confirmation"
          icon={Clock}
        />
        <StatCard
          title="Today's Tours"
          value={dashboardStats.todaysTours}
          subtitle={hasActiveTours ? "Tour in progress" : formatDate(new Date())}
          icon={CalendarDays}
          highlight={hasActiveTours}
          pulse={hasActiveTours}
        />
        <StatCard
          title="Active Guides"
          value={dashboardStats.activeGuides}
          subtitle="Available now"
          icon={Users}
        />
        <StatCard
          title="Total Bookings"
          value={dashboardStats.totalBookings}
          subtitle="All time"
          icon={BookOpen}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendar" data-testid="link-view-calendar">
                View Calendar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!todaysTours || todaysTours.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No tours scheduled"
                description="No tours are scheduled for today."
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {todaysTours.slice(0, 5).map((tour) => (
                  <div key={tour.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{tour.visitorName}</span>
                        <StatusBadge status={tour.status || "pending"} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(tour.visitTime)} - {tour.numberOfPeople} people
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Pending Bookings</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/bookings" data-testid="link-view-bookings">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!recentBookings || recentBookings.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No pending bookings"
                description="All bookings have been processed."
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {recentBookings.filter(b => b.status === "pending").slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {booking.visitorName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{booking.visitorName}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(booking.visitDate)} - {booking.numberOfPeople} people
                      </div>
                    </div>
                    <div className="text-sm font-medium">{formatCurrency(booking.totalAmount || 0)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href="/bookings">
                <BookOpen className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Manage Bookings</div>
                  <div className="text-xs text-muted-foreground">Confirm requests</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href="/guides">
                <Users className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Assign Guides</div>
                  <div className="text-xs text-muted-foreground">Tour assignments</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href="/calendar">
                <CalendarDays className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">View Calendar</div>
                  <div className="text-xs text-muted-foreground">Schedule overview</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href="/zones">
                <MapPin className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">View Zones</div>
                  <div className="text-xs text-muted-foreground">Camp areas</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function GuideDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: myTours, isLoading } = useQuery<RecentBooking[]>({
    queryKey: ["/api/bookings/my-tours"],
  });

  const { data: todaysTours } = useQuery<RecentBooking[]>({
    queryKey: ["/api/bookings/today"],
  });

  const { data: guideProfile } = useQuery<Guide>({
    queryKey: ["/api/guides/me"],
  });

  const startTourMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest("POST", `/api/bookings/${bookingId}/start`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-tours"] });
      toast({ title: "Tour Started", description: "The tour has been marked as in progress." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to start tour", description: error.message, variant: "destructive" });
    },
  });

  const completeTourMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest("POST", `/api/bookings/${bookingId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-tours"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guides/me"] });
      toast({ title: "Tour Completed", description: "The tour has been marked as completed." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to complete tour", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const upcomingTours = todaysTours?.filter(t => t.status === "confirmed" || t.status === "in_progress") || [];
  const averageRating = guideProfile?.totalRatings && guideProfile.totalRatings > 0
    ? (guideProfile.rating || 0) / guideProfile.totalRatings
    : 0;

  return (
    <PageContainer className="page-spacing">
      <PageHeader
        title="Guide Dashboard"
        description={`Welcome back, ${user?.firstName}! Here are your assigned tours.`}
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Tours"
          value={upcomingTours.length}
          subtitle={formatDate(new Date())}
          icon={CalendarDays}
        />
        <StatCard
          title="Completed Tours"
          value={guideProfile?.completedTours || 0}
          subtitle="All time"
          icon={CheckCircle2}
        />
        <StatCard
          title="Average Rating"
          value={averageRating > 0 ? averageRating.toFixed(1) : "N/A"}
          subtitle={guideProfile?.totalRatings ? `${guideProfile.totalRatings} reviews` : "No reviews yet"}
          icon={Star}
        />
        <StatCard
          title="Total Earnings"
          value={formatCurrency(guideProfile?.totalEarnings || 0)}
          subtitle="All time"
          icon={DollarSign}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Today's Assigned Tours</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingTours.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No tours assigned today"
              description="You don't have any tours scheduled for today. Check back later!"
              className="py-8"
            />
          ) : (
            <div className="space-y-4">
              {upcomingTours.map((tour) => (
                <div key={tour.id} className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tour.visitorName}</span>
                      <StatusBadge status={tour.status || "pending"} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(tour.visitTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {tour.numberOfPeople} {tour.numberOfPeople === 1 ? "person" : "people"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {tour.tourType?.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  {tour.status === "confirmed" && (
                    <Button
                      size="sm"
                      data-testid={`start-tour-${tour.id}`}
                      onClick={() => startTourMutation.mutate(tour.id)}
                      disabled={startTourMutation.isPending}
                    >
                      {startTourMutation.isPending && startTourMutation.variables === tour.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Start Tour
                    </Button>
                  )}
                  {tour.status === "in_progress" && (
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`complete-tour-${tour.id}`}
                      onClick={() => completeTourMutation.mutate(tour.id)}
                      disabled={completeTourMutation.isPending}
                    >
                      {completeTourMutation.isPending && completeTourMutation.variables === tour.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Complete
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg border p-4 text-center">
              <div className="text-3xl font-bold text-primary">{guideProfile?.totalTours || 0}</div>
              <div className="text-sm text-muted-foreground">Total Tours</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{guideProfile?.completedTours || 0}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-3xl font-bold text-yellow-500">
                {averageRating > 0 ? averageRating.toFixed(1) : "-"} <Star className="h-6 w-6 fill-current" />
              </div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-3xl font-bold text-primary">{formatCurrency(guideProfile?.totalEarnings || 0)}</div>
              <div className="text-sm text-muted-foreground">Total Earnings</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function SecurityDashboard() {
  const { data: activeVisits, isLoading: visitsLoading } = useQuery<RecentBooking[]>({
    queryKey: ["/api/bookings/active"],
  });

  const { data: incidents, isLoading: incidentsLoading } = useQuery<Incident[]>({
    queryKey: ["/api/incidents"],
  });

  const { data: todaysTours } = useQuery<RecentBooking[]>({
    queryKey: ["/api/bookings/today"],
  });

  const isLoading = visitsLoading || incidentsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const openIncidents = incidents?.filter(i => i.status === "reported" || i.status === "investigating") || [];
  const checkedInVisitors = activeVisits?.filter(v => v.checkInTime && !v.checkOutTime) || [];
  const pendingVerifications = todaysTours?.filter(t => t.status === "confirmed" && !t.checkInTime) || [];

  return (
    <PageContainer className="page-spacing">
      <PageHeader
        title="Security Dashboard"
        description="Monitor visitor check-ins, verify bookings, and manage incidents."
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Visitors"
          value={checkedInVisitors.length}
          subtitle="Currently in camp"
          icon={UserCheck}
        />
        <StatCard
          title="Pending Check-ins"
          value={pendingVerifications.length}
          subtitle="Awaiting arrival"
          icon={Clock}
        />
        <StatCard
          title="Today's Check-ins"
          value={todaysTours?.filter(t => t.checkInTime).length || 0}
          subtitle={formatDate(new Date())}
          icon={CheckCircle2}
        />
        <StatCard
          title="Open Incidents"
          value={openIncidents.length}
          subtitle="Need attention"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Active Visitors</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/security" data-testid="link-security">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {checkedInVisitors.length === 0 ? (
              <EmptyState
                icon={UserCheck}
                title="No active visitors"
                description="No visitors are currently checked in."
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {checkedInVisitors.slice(0, 5).map((visitor) => (
                  <div key={visitor.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{visitor.visitorName}</div>
                      <div className="text-xs text-muted-foreground">
                        Checked in: {visitor.checkInTime ? formatTime(visitor.checkInTime) : "N/A"}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Open Incidents</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/security?tab=incidents" data-testid="link-incidents">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {openIncidents.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No open incidents"
                description="All clear! No incidents require attention."
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {openIncidents.slice(0, 5).map((incident) => (
                  <div key={incident.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${incident.severity === "critical" ? "bg-red-100 text-red-600" :
                      incident.severity === "high" ? "bg-orange-100 text-orange-600" :
                        "bg-yellow-100 text-yellow-600"
                      }`}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{incident.title}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {incident.severity} priority - {incident.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href="/security">
                <UserCheck className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Check-In Visitor</div>
                  <div className="text-xs text-muted-foreground">Verify and check in</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href="/security?tab=verification">
                <Shield className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Verify Booking</div>
                  <div className="text-xs text-muted-foreground">Check booking details</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href="/security?tab=incidents">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Report Incident</div>
                  <div className="text-xs text-muted-foreground">Log new incident</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href="/security?tab=active">
                <Users className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Active Visitors</div>
                  <div className="text-xs text-muted-foreground">View current visitors</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function VisitorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: myBookings, isLoading } = useQuery<RecentBooking[]>({
    queryKey: ["/api/bookings/my-bookings"],
  });

  const { data: itineraries } = useQuery<{ bookingId: string }[]>({
    queryKey: ["/api/my-itineraries"],
    enabled: !!user,
  });

  const { data: guides } = useQuery<Guide[]>({
    queryKey: ["/api/guides"],
  });

  const { data: zones } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/zones"],
  });

  const { data: meetingPoints } = useQuery<{ id: string; name: string; address?: string }[]>({
    queryKey: ["/api/meeting-points"],
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ bookingId, paymentStatus }: { bookingId: string; paymentStatus: string }) => {
      return apiRequest("PATCH", `/api/bookings/${bookingId}/visitor-payment`, { paymentStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-bookings"] });
      toast({ title: "Payment status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update payment", description: error.message, variant: "destructive" });
    },
  });

  const rateGuideMutation = useMutation({
    mutationFn: async ({ bookingId, rating }: { bookingId: string; rating: number }) => {
      return apiRequest("POST", `/api/bookings/${bookingId}/rate-guide`, { rating });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-bookings"] });
      toast({ title: "Thank you!", description: "Your rating has been submitted." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to rate guide", description: error.message, variant: "destructive" });
    },
  });

  const [selectedRating, setSelectedRating] = useState<{ bookingId: string; rating: number } | null>(null);
  const [showAllPastVisits, setShowAllPastVisits] = useState(false);
  const [showBookingCTA, setShowBookingCTA] = useState(() => {
    // Initialize from localStorage to prevent flash of content
    const dismissed = localStorage.getItem('dismiss_booking_cta');
    return !dismissed;
  });

  const handleRateGuide = (bookingId: string, rating: number) => {
    rateGuideMutation.mutate({ bookingId, rating });
  };

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest("POST", `/api/bookings/${bookingId}/visitor-cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-bookings"] });
      toast({ title: "Booking cancelled", description: "Your booking has been cancelled." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to cancel", description: error.message, variant: "destructive" });
    },
  });

  const getGuideName = (guideId: string | null | undefined) => {
    if (!guideId || !guides) return null;
    const guide = guides.find(g => g.id === guideId || g.userId === guideId);
    return guide ? `${guide.firstName} ${guide.lastName}` : null;
  };

  const getGuidePhone = (guideId: string | null | undefined) => {
    if (!guideId || !guides) return null;
    const guide = guides.find(g => g.id === guideId || g.userId === guideId);
    return guide?.phone || null;
  };

  const getZoneNames = (zoneIds: string[] | null | undefined) => {
    if (!zoneIds || !zones || zoneIds.length === 0) return null;
    return zoneIds
      .map(id => zones.find(z => z.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  const getMeetingPointName = (meetingPointId: string | null | undefined) => {
    if (!meetingPointId) return null;
    if (meetingPoints) {
      const mp = meetingPoints.find(p => p.id === meetingPointId);
      if (mp) return mp.name;
    }
    // Fallback for common meeting points
    const fallbacks: Record<string, string> = {
      "main_gate": "Main Gate Entrance",
      "community_center": "Community Center",
      "market_entrance": "Market Entrance"
    };
    return fallbacks[meetingPointId] || "Meeting Point";
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const upcomingBookings = myBookings?.filter(b =>
    b.status === "pending" || b.status === "confirmed"
  ) || [];
  const completedBookings = myBookings?.filter(b => b.status === "completed") || [];

  return (
    <PageContainer className="page-spacing">
      <PageHeader
        title={`Welcome, ${user?.firstName}!`}
        description="Manage your visit bookings and explore Dzaleka Refugee Camp."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Bookings"
          value={myBookings?.length || 0}
          subtitle="All time"
          icon={BookOpen}
        />
        <StatCard
          title="Upcoming Visits"
          value={upcomingBookings.length}
          subtitle="Scheduled"
          icon={CalendarDays}
        />
        <StatCard
          title="Completed Tours"
          value={completedBookings.length}
          subtitle="Enjoyed"
          icon={CheckCircle2}
        />
      </div>

      {/* Book Your Tour CTA - Show prominently if no upcoming bookings and not dismissed */}
      {upcomingBookings.length === 0 && showBookingCTA && (
        <Card className="relative">
          <button
            onClick={() => {
              localStorage.setItem('dismiss_booking_cta', 'true');
              setShowBookingCTA(false);
            }}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>

          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="shrink-0">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-primary" />
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <h3 className="font-semibold text-lg">Ready to Book Your Tour?</h3>
                <p className="text-sm text-muted-foreground">
                  Experience Dzaleka with a local refugee guide. Choose your date, group size, and tour type to get started.
                </p>
              </div>

              <Button asChild size="default" className="shrink-0 w-full sm:w-auto">
                <Link href="/my-bookings?book=true">
                  Book Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Community Hub Promotion */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-semibold text-base">Dzaleka Online Community</h3>
              <p className="text-sm text-muted-foreground max-w-lg">
                Connect with essential services, stay informed on local news, and support the refugee-led initiatives driving economic empowerment and self-reliance in Dzaleka.
              </p>
            </div>
          </div>
          <Button asChild size="default" className="shrink-0 w-full sm:w-auto">
            <Link href="/community">
              Visit Community Hub <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Your Upcoming Visits</CardTitle>
          <Button asChild data-testid="button-book-visit">
            <Link href="/my-bookings">
              Book a Visit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming visits"
              description="You don't have any scheduled visits. Book a tour to explore Dzaleka!"
              className="py-8"
              action={
                <Button asChild className="mt-4">
                  <Link href="/my-bookings">
                    Book Your First Visit
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => {
                const guideName = getGuideName(booking.assignedGuideId);
                const guidePhone = getGuidePhone(booking.assignedGuideId);
                const zoneNames = getZoneNames(booking.selectedZones as string[]);
                const meetingPointName = getMeetingPointName(booking.meetingPointId);
                const isConfirmed = booking.status === "confirmed";

                return (
                  <div key={booking.id} className="rounded-lg border p-4 space-y-3">
                    {/* Header Row */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {booking.tourType?.replace("_", " ")} Tour
                          </span>
                          <StatusBadge status={booking.status || "pending"} />
                          <Badge variant={booking.paymentStatus === "paid" ? "default" : "outline"}
                            className={booking.paymentStatus === "paid" ? "bg-green-600" : ""}>
                            {booking.paymentStatus === "paid" ? "Paid" : "Payment Pending"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {formatDate(booking.visitDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(booking.visitTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {booking.numberOfPeople} {booking.numberOfPeople === 1 ? "person" : "people"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(booking.totalAmount || 0)}</div>
                        <div className="text-xs text-muted-foreground">Ref: {booking.bookingReference}</div>
                      </div>
                    </div>

                    {/* Guide Info */}
                    {guideName && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <UserCheck className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-green-700 dark:text-green-400">Your Guide: {guideName}</div>
                          {guidePhone && (
                            <div className="text-xs text-green-600 dark:text-green-500">Phone: {guidePhone}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Selected Zones */}
                    {zoneNames && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>Areas: {zoneNames}</span>
                      </div>
                    )}

                    {/* Meeting Point */}
                    {meetingPointName && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-700 dark:text-blue-400">
                          <strong>Meeting Point:</strong> {meetingPointName}
                        </span>
                      </div>
                    )}

                    {/* Special Requests */}
                    {booking.specialRequests && (
                      <div className="p-2 rounded-lg bg-muted/50 border">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Your Special Requests:</div>
                        <div className="text-sm">{booking.specialRequests}</div>
                      </div>
                    )}

                    {/* Check-in Instructions for Confirmed Bookings */}
                    {isConfirmed && (
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                          <div className="text-sm text-amber-800 dark:text-amber-300">
                            <strong>Check-in Instructions:</strong>
                            <ul className="mt-1 ml-4 list-disc text-xs space-y-1">
                              <li>Arrive 10 minutes before your scheduled time</li>
                              <li>Bring a valid ID for verification</li>
                              <li>Meet your guide at the designated meeting point</li>
                              <li>Contact your guide if running late</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Toggle */}
                    {booking.paymentStatus !== "paid" && (
                      <div className="flex justify-end pt-2 border-t gap-2">
                        {itineraries?.some((i) => i.bookingId === booking.id) && (
                          <Button size="sm" variant="default" asChild>
                            <Link href={`/bookings/${booking.id}/itinerary`}>
                              <FileDown className="mr-2 h-4 w-4" /> View Itinerary
                            </Link>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updatePaymentMutation.mutate({ bookingId: booking.id, paymentStatus: "paid" })}
                          disabled={updatePaymentMutation.isPending}
                        >
                          {updatePaymentMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <DollarSign className="mr-2 h-4 w-4" />
                          )}
                          Mark as Paid
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive hover:bg-destructive/10"
                          onClick={() => cancelBookingMutation.mutate(booking.id)}
                          disabled={cancelBookingMutation.isPending}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    )}
                    {booking.paymentStatus === "paid" && (
                      <div className="flex justify-end pt-2 border-t gap-2">
                        {itineraries?.some((i) => i.bookingId === booking.id) && (
                          <Button size="sm" variant="default" asChild>
                            <Link href={`/bookings/${booking.id}/itinerary`}>
                              <FileDown className="mr-2 h-4 w-4" /> View Itinerary
                            </Link>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive hover:bg-destructive/10"
                          onClick={() => cancelBookingMutation.mutate(booking.id)}
                          disabled={cancelBookingMutation.isPending}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Booking
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {completedBookings.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Your Travel Memories</CardTitle>
              <Badge variant="secondary" className="rounded-full">{completedBookings.length}</Badge>
            </div>
            {completedBookings.length > 2 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await apiRequest("GET", "/api/visitors/export-history");
                      const data = await res.json();

                      // Convert JSON to formatted string for download
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `visit-history-${formatDate(new Date())}.json`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);

                      toast({ title: "History Exported", description: "Your visit history has been downloaded." });
                    } catch (error) {
                      toast({ title: "Export Failed", description: "Could not export visit history.", variant: "destructive" });
                    }
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export History
                </Button>
                {completedBookings.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllPastVisits(!showAllPastVisits)}
                  >
                    {showAllPastVisits ? "Show Less" : "View All"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(showAllPastVisits ? completedBookings : completedBookings.slice(0, 2)).map((booking) => (
                <div key={booking.id} className="rounded-lg border p-4 space-y-3">

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Main Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium">
                              {booking.tourType?.replace("_", " ")} Tour
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(booking.visitDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(booking.visitTime)}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            Completed
                          </Badge>
                        </div>

                        {booking.assignedGuideId && getGuideName(booking.assignedGuideId) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <UserCheck className="h-4 w-4" />
                            <span>
                              Guided by <span className="font-medium text-foreground">{getGuideName(booking.assignedGuideId)}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-3 border-t">
                        {itineraries?.some((i) => i.bookingId === booking.id) && (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/bookings/${booking.id}/itinerary`}>
                              <FileDown className="mr-2 h-4 w-4" /> Itinerary
                            </Link>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/bookings">
                            Book Again
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Rating Section */}
                    {booking.assignedGuideId && (
                      <div className="pt-3 border-t">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="text-sm text-muted-foreground">
                            Rate your guide
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleRateGuide(booking.id, star)}
                                disabled={rateGuideMutation.isPending}
                                className="p-1 focus:outline-none"
                                title={`Rate ${star} stars`}
                              >
                                <Star
                                  className={`h-5 w-5 transition-colors ${selectedRating?.bookingId === booking.id && star <= selectedRating.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground hover:text-yellow-400"
                                    }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Safety & Support Card */}
      <Card className="mt-6 border-l-4 border-l-orange-500 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            Safety & Support
          </CardTitle>
          <CardDescription>
            We prioritize your safety. If you encounter any issues or need assistance, please report it immediately or contact our team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="bg-primary/10 p-2 rounded-full mt-0.5">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Emergency Contacts</h4>
                  <p className="text-sm text-foreground/80 mt-1">Admin: <a href="tel:+61498956715" className="text-primary hover:underline font-medium">+61 498 956 715</a></p>
                  <p className="text-sm text-foreground/80">Email: <a href="mailto:dzalekaconnect@gmail.com" className="text-primary hover:underline font-medium">dzalekaconnect@gmail.com</a></p>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center items-start border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
              <h4 className="font-semibold text-sm mb-2">Report an Incident</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Witnessed something concerning? Let us know so we can address it.
              </p>
              <ReportIncidentDialog />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Reports History - Only for visitors */}
      {
        user?.role === "visitor" && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-primary" />
                My Reported Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IncidentsList />
            </CardContent>
          </Card>
        )
      }

      {/* Explore Dzaleka Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Explore Dzaleka</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <a href="https://services.dzaleka.com/visit/travel-guide/" target="_blank" rel="noopener noreferrer">
                <MapPin className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Travel Guide</div>
                  <div className="text-xs text-muted-foreground">Getting to Dzaleka</div>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground absolute top-2 right-2" />
              </a>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <a href="https://services.dzaleka.com/visit/guidelines/" target="_blank" rel="noopener noreferrer">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">Visitor Guidelines</div>
                  <div className="text-xs text-muted-foreground">What to know before you go</div>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground absolute top-2 right-2" />
              </a>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <a href="https://services.dzaleka.com/dzaleka-time-capsule/" target="_blank" rel="noopener noreferrer">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">Time Capsule</div>
                  <div className="text-xs text-muted-foreground">Dzaleka's history & stories</div>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground absolute top-2 right-2" />
              </a>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <a href="https://services.dzaleka.com" target="_blank" rel="noopener noreferrer">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">Dzaleka Online Services</div>
                  <div className="text-xs text-muted-foreground">Full platform & resources</div>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground absolute top-2 right-2" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const role = user?.role || "visitor";

  switch (role) {
    case "admin":
      return <AdminDashboard />;
    case "coordinator":
      return <CoordinatorDashboard />;
    case "guide":
      return <GuideDashboard />;
    case "security":
      return <SecurityDashboard />;
    case "visitor":
    default:
      return <VisitorDashboard />;
  }
}
