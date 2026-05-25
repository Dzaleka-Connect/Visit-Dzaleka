
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Link, Redirect } from "wouter";
import { useState } from "react";
import {
  CalendarDays,
  Users,
  BookOpen,
  Clock,
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
  Calendar,
  MessageCircle,
  ListTodo,
  Ticket,
  FileDown,
  Phone,
  X,
  Play,
  ScanLine,
  UserX,
  Car,
  Compass,
  Bell,
  Heart,
  type LucideIcon,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Booking, CommunityExperienceRequest, CommunityListing, Guide, GuideTourReport, Incident, SupportTicket } from "@shared/schema";
import { SEO } from "@/components/seo";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { QRScannerDialog } from "@/components/qr-scanner-dialog";
import { QRCodeDisplay } from "@/components/qr-scanner-dialog";
import { getTransportRoute } from "@/lib/transport";
import { DataErrorState } from "@/components/data-error-state";

interface DashboardStats {
  totalBookings: number;
  pendingRequests: number;
  activeGuides: number;
  todaysTours: number;
  weeklyRevenue: number;
  monthlyGrowth: number;
}

interface VisitorCountryStats {
  countries: Array<{ country: string; count: number }>;
  knownCountries: number;
  bookingsWithCountry: number;
  totalBookings: number;
}

interface VisitorTransportPartnerProfile {
  companyName?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
}

interface VisitorTransportRequestSummary {
  route?: string | null;
  status?: string | null;
  quotedAmount?: number | null;
  currency?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  vehicleDetails?: string | null;
  estimatedPickupTime?: string | null;
  requestedPickupTime?: string | null;
  partner?: VisitorTransportPartnerProfile | null;
}

interface RecentBooking extends Booking {
  guide?: Guide;
  transportRequest?: VisitorTransportRequestSummary | null;
}

interface DashboardCommunityExperienceRequest extends CommunityExperienceRequest {
  listing?: CommunityListing | null;
}

interface GuideAvailabilitySummary {
  availability?: Record<string, boolean>;
  workingHours?: { start: string; end: string };
}

interface TrainingStatsSummary {
  completed: number;
  total: number;
  percentage: number;
}

interface GuideEarningsSummary {
  payoutSummary?: {
    pendingAmount: number;
    pendingCount: number;
    paidAmount: number;
    paidCount: number;
    lastPaidAt: string | null;
    status: "pending" | "paid" | "not_started";
  };
}

interface SavedItinerarySummary {
  id: string;
  name: string;
  tourType?: string | null;
  createdAt?: string | null;
}

interface FavoriteGuideSummary {
  id: string;
  guideId: string;
  guide?: Guide | null;
}

interface DashboardHealthSummary {
  status: "healthy" | "degraded" | "unhealthy";
}

type DashboardActionSeverity = "info" | "warning" | "critical";

interface DashboardActionItem {
  id: string;
  severity: DashboardActionSeverity;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  count?: number | string;
}

const quickActionButtonClass = "h-10 min-h-10 rounded-full gap-2 px-4";
const quickActionIconClass = "h-4 w-4";
const dashboardActionCardClass = "relative h-full min-h-24 w-full justify-start flex-col items-start gap-2 p-4 text-left";

const actionSeverityClasses: Record<DashboardActionSeverity, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-50",
  warning: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-50",
  critical: "border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/30 dark:text-red-50",
};

const actionIconClasses: Record<DashboardActionSeverity, string> = {
  info: "bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-200",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200",
};

function DashboardActionList({
  title = "Action Required",
  description = "Items that need attention now.",
  items,
}: {
  title?: string;
  description?: string;
  items: DashboardActionItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section aria-label={title} className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary" className="w-fit shrink-0 tabular-nums">
          {items.length}
        </Badge>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Button
              key={item.id}
              asChild
              variant="outline"
              className={`h-auto min-h-24 justify-start whitespace-normal rounded-lg p-0 text-left ${actionSeverityClasses[item.severity]}`}
            >
              <Link href={item.href}>
                <span className="flex w-full items-start gap-3 p-4">
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${actionIconClasses[item.severity]}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="break-words text-sm font-semibold leading-5">{item.title}</span>
                      {item.count !== undefined && (
                        <span className="shrink-0 rounded-full bg-background/80 px-2 py-0.5 text-xs font-semibold tabular-nums">
                          {item.count}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block break-words text-xs leading-5 opacity-80">{item.description}</span>
                  </span>
                </span>
              </Link>
            </Button>
          );
        })}
      </div>
    </section>
  );
}

const transportStatusLabels: Record<string, string> = {
  pending: "Requested",
  sent_to_partner: "Sent to partner",
  quote_sent: "Quote sent",
  accepted: "Accepted",
  visitor_approved: "Approved",
  visitor_declined: "Declined",
  confirmed: "Confirmed",
  reschedule_requested: "Reschedule requested",
  completed: "Completed",
  cancelled: "Cancelled",
};

function getTransportStatusLabel(status?: string | null) {
  const key = status || "pending";
  return transportStatusLabels[key] || key.replace(/_/g, " ");
}

function formatTransportQuote(request?: VisitorTransportRequestSummary | null) {
  if (!request || request.quotedAmount == null) return null;
  return formatCurrency(request.quotedAmount, request.currency || "MWK");
}

function GuideDashboardTransportSummary({ request }: { request?: VisitorTransportRequestSummary | null }) {
  if (!request) return null;

  const route = getTransportRoute(request.route);
  const quote = formatTransportQuote(request);
  const pickupTime = request.estimatedPickupTime || request.requestedPickupTime;
  const driverLine = [request.driverName, request.driverPhone, request.vehicleDetails].filter(Boolean).join(" - ");

  return (
    <div className="mt-3 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm dark:border-sky-800 dark:bg-sky-950/30">
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

function formatTourType(type?: string | null) {
  if (!type) return "Tour";
  return type.replace(/_/g, " ");
}

function isTransportQuoteAwaitingVisitor(request?: VisitorTransportRequestSummary | null) {
  if (!request) return false;
  const status = request.status || "";
  return request.quotedAmount != null && ["quote_sent", "accepted"].includes(status);
}

function getBookingTimestamp(booking: RecentBooking) {
  const value = booking.updatedAt || booking.visitDate || booking.createdAt;
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function buildVisitorActionItems({
  bookings,
  supportTickets,
  unreadNotifications,
}: {
  bookings: RecentBooking[];
  supportTickets: SupportTicket[];
  unreadNotifications: number;
}): DashboardActionItem[] {
  const activeBookings = bookings.filter((booking) => booking.status !== "cancelled" && booking.status !== "completed");
  const paymentBooking = activeBookings.find((booking) => booking.paymentStatus !== "paid" && !booking.paymentReference);
  const pendingPaymentVerification = activeBookings.find((booking) => booking.paymentStatus !== "paid" && !!booking.paymentReference);
  const quoteBooking = activeBookings.find((booking) => isTransportQuoteAwaitingVisitor(booking.transportRequest));
  const latestTicket = [...supportTickets]
    .filter((ticket) => ticket.status === "open" || ticket.status === "in_progress")
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())[0];
  const ratingBooking = bookings
    .filter((booking) => booking.status === "completed" && booking.assignedGuideId && !booking.visitorRating)
    .sort((a, b) => getBookingTimestamp(b) - getBookingTimestamp(a))[0];
  const cancellationBooking = bookings
    .filter((booking) =>
      booking.status === "cancelled"
      && booking.paymentStatus !== "refunded"
      && (booking.paymentStatus === "paid" || !!booking.paymentReference)
    )
    .sort((a, b) => getBookingTimestamp(b) - getBookingTimestamp(a))[0];
  const upcomingBooking = activeBookings[0];

  return [
    paymentBooking && {
      id: `payment-${paymentBooking.id}`,
      severity: "critical" as const,
      title: "Payment needed",
      description: `${formatTourType(paymentBooking.tourType)} on ${formatDate(paymentBooking.visitDate)} still needs payment reporting.`,
      href: `/my-bookings/${paymentBooking.id}`,
      icon: DollarSign,
    },
    pendingPaymentVerification && {
      id: `payment-verification-${pendingPaymentVerification.id}`,
      severity: "warning" as const,
      title: "Payment verification pending",
      description: "Staff are checking the payment reference you submitted.",
      href: `/my-bookings/${pendingPaymentVerification.id}`,
      icon: Clock,
    },
    quoteBooking && {
      id: `transport-quote-${quoteBooking.id}`,
      severity: "critical" as const,
      title: "Transport quote waiting",
      description: `${formatTransportQuote(quoteBooking.transportRequest) || "A quote"} is ready for approval or decline.`,
      href: `/my-bookings/${quoteBooking.id}`,
      icon: Car,
    },
    unreadNotifications > 0 && {
      id: "unread-notifications",
      severity: "warning" as const,
      title: "Unread notifications",
      description: "Open notifications to review booking, payment, guide, or system updates.",
      href: "/messages",
      icon: Bell,
      count: unreadNotifications,
    },
    latestTicket && {
      id: `support-${latestTicket.id}`,
      severity: latestTicket.priority === "urgent" ? "critical" as const : "info" as const,
      title: "Support ticket updated",
      description: `${latestTicket.subject} is ${latestTicket.status?.replace(/_/g, " ") || "open"}.`,
      href: "/help?support=true",
      icon: MessageCircle,
    },
    ratingBooking && {
      id: `rating-${ratingBooking.id}`,
      severity: "info" as const,
      title: "Rate your guide",
      description: `Share feedback for your ${formatTourType(ratingBooking.tourType)} tour.`,
      href: "/my-bookings",
      icon: Star,
    },
    upcomingBooking && {
      id: `resources-${upcomingBooking.id}`,
      severity: "info" as const,
      title: "Complete pre-visit learning",
      description: "Review visitor resources before arrival.",
      href: "/resources",
      icon: BookOpen,
    },
    cancellationBooking && {
      id: `cancel-refund-${cancellationBooking.id}`,
      severity: "warning" as const,
      title: "Cancellation follow-up",
      description: "Check refund or credit next steps for a cancelled visit.",
      href: "/help?support=true&subject=Question%20about%20a%20cancelled%20booking",
      icon: XCircle,
    },
  ].filter(Boolean) as DashboardActionItem[];
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
  const displayName = user?.firstName || "there";

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsQueryError,
    refetch: refetchStats,
  } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const {
    data: recentBookings,
    isLoading: bookingsLoading,
    isError: bookingsError,
    error: bookingsQueryError,
    refetch: refetchBookings,
  } = useQuery<RecentBooking[]>({
    queryKey: ["/api/bookings/recent"],
  });

  const {
    data: todaysTours,
    isLoading: toursLoading,
    isError: toursError,
    error: toursQueryError,
    refetch: refetchTours,
  } = useQuery<RecentBooking[]>({
    queryKey: ["/api/bookings/today"],
  });

  const { data: dashboardHealth } = useQuery<DashboardHealthSummary>({
    queryKey: ["/api/health"],
    refetchInterval: 60000,
  });

  const { data: visitorCountryStats } = useQuery<VisitorCountryStats>({
    queryKey: ["/api/stats/visitor-countries"],
  });

  const { data: communityExperienceRequests = [] } = useQuery<DashboardCommunityExperienceRequest[]>({
    queryKey: ["/api/admin/community-experience-requests"],
    enabled: user?.role === "admin",
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: typeof emailForm) => {
      const response = await apiRequest("POST", "/api/send-email", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Email sent",
        description: "Your email has been sent successfully.",
      });
      setEmailDialogOpen(false);
      setEmailForm({ recipientName: "", recipientEmail: "", subject: "", message: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send email",
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
        title: "Booking confirmed",
        description: "The booking has been confirmed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to confirm booking",
        description: error.message || "Failed to confirm booking.",
        variant: "destructive",
      });
    },
  });

  const isLoading = statsLoading || bookingsLoading || toursLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (statsError || bookingsError || toursError) {
    const error = statsQueryError || bookingsQueryError || toursQueryError;

    return (
      <PageContainer className="page-spacing">
        <SEO title="Dashboard" description="Manage your Dzaleka tours, bookings, guides, and analytics from your admin dashboard." />
        <PageHeader
          title="Dashboard"
          description={`Welcome back, ${displayName}. Dashboard data could not be loaded.`}
        />
        <DataErrorState
          title="Dashboard unavailable"
          description={error instanceof Error ? error.message : "Could not load dashboard data."}
          onRetry={() => {
            void refetchStats();
            void refetchBookings();
            void refetchTours();
          }}
          className="py-16"
        />
      </PageContainer>
    );
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
  const openCommunityExperienceRequests = communityExperienceRequests.filter((request) =>
    request.status === "submitted" || request.status === "contacted"
  );
  const adminOperationalActions: DashboardActionItem[] = [
    dashboardStats.pendingRequests > 0 && {
      id: "pending-bookings",
      severity: "critical" as const,
      title: "Pending bookings",
      description: "Booking requests need confirmation or follow-up.",
      href: "/bookings",
      icon: BookOpen,
      count: dashboardStats.pendingRequests,
    },
    (recentBookings || []).filter((booking) => booking.status === "confirmed" && !booking.assignedGuideId).length > 0 && {
      id: "unassigned-bookings",
      severity: "warning" as const,
      title: "Confirmed bookings need guides",
      description: "Assign guides before visitor arrival.",
      href: "/bookings",
      icon: UserCheck,
      count: (recentBookings || []).filter((booking) => booking.status === "confirmed" && !booking.assignedGuideId).length,
    },
    (recentBookings || []).filter((booking) => booking.paymentStatus !== "paid" && !!booking.paymentReference).length > 0 && {
      id: "payment-verification",
      severity: "warning" as const,
      title: "Payment verification pending",
      description: "Visitors have submitted payment references for staff review.",
      href: "/payments",
      icon: DollarSign,
      count: (recentBookings || []).filter((booking) => booking.paymentStatus !== "paid" && !!booking.paymentReference).length,
    },
    (recentBookings || []).filter((booking) => isTransportQuoteAwaitingVisitor(booking.transportRequest)).length > 0 && {
      id: "transport-quotes",
      severity: "info" as const,
      title: "Transport quotes awaiting visitors",
      description: "Visitors need to approve or decline transport quotes.",
      href: "/transport-partner?tab=requests",
      icon: Car,
      count: (recentBookings || []).filter((booking) => isTransportQuoteAwaitingVisitor(booking.transportRequest)).length,
    },
    openCommunityExperienceRequests.length > 0 && {
      id: "community-requests",
      severity: "warning" as const,
      title: "Community requests open",
      description: "Community Hub experience requests need coordinator follow-up.",
      href: "/admin/community-listings",
      icon: Compass,
      count: openCommunityExperienceRequests.length,
    },
    dashboardHealth && dashboardHealth.status !== "healthy" && {
      id: "system-health",
      severity: dashboardHealth.status === "unhealthy" ? "critical" as const : "warning" as const,
      title: "System health needs review",
      description: `System health is ${dashboardHealth.status}. Review integrations and queues.`,
      href: "/admin/system-health",
      icon: AlertTriangle,
    },
  ].filter(Boolean) as DashboardActionItem[];

  return (
    <PageContainer className="page-spacing overflow-x-hidden">
      <SEO
        title="Dashboard"
        description="Manage your Dzaleka tours, bookings, guides, and analytics from your admin dashboard."
      />
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${displayName}. Here is what needs attention today.`}
      />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {user?.role === "admin" && (
          <>
            <Link href="/bookings">
              <Button variant="secondary" size="sm" className={quickActionButtonClass}>
                <Plus className={quickActionIconClass} />
                <span>New booking</span>
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="secondary" size="sm" className={quickActionButtonClass}>
                <BarChart3 className={quickActionIconClass} />
                <span>Analytics</span>
              </Button>
            </Link>
            <Link href="/guides">
              <Button variant="secondary" size="sm" className={quickActionButtonClass}>
                <UserPlus className={quickActionIconClass} />
                <span>Guides</span>
              </Button>
            </Link>
            <Link href="/send-email">
              <Button variant="secondary" size="sm" className={quickActionButtonClass}>
                <Mail className={quickActionIconClass} />
                <span>Send email</span>
              </Button>
            </Link>
            <Link href="/revenue">
              <Button variant="secondary" size="sm" className={quickActionButtonClass}>
                <DollarSign className={quickActionIconClass} />
                <span>Revenue</span>
              </Button>
            </Link>
            <Link href="/transport-partner?tab=requests">
              <Button variant="secondary" size="sm" className={quickActionButtonClass}>
                <Car className={quickActionIconClass} />
                <span>Transport ops</span>
              </Button>
            </Link>
            <Link href="/admin/community-listings">
              <Button variant="secondary" size="sm" className={quickActionButtonClass}>
                <Compass className={quickActionIconClass} />
                <span>Community requests</span>
                {openCommunityExperienceRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 tabular-nums">
                    {openCommunityExperienceRequests.length}
                  </Badge>
                )}
              </Button>
            </Link>
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <DashboardActionList
        title="Operational Action Center"
        description="Queues that can affect visitor confirmation, payments, transport, community experiences, or system health."
        items={adminOperationalActions}
      />

      {user?.role === "admin" && openCommunityExperienceRequests.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="tabular-nums">
                  {openCommunityExperienceRequests.length} open
                </Badge>
                <span className="text-sm font-semibold">Community Hub experience requests</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                Latest: {openCommunityExperienceRequests.slice(0, 3).map((request) =>
                  `${request.visitorName} for ${request.listing?.name || "a community experience"}`
                ).join("; ")}
              </p>
            </div>
            <Button asChild className="min-h-10 shrink-0">
              <Link href="/admin/community-listings">
                Open request queue
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Globe className="h-5 w-5 text-primary" aria-hidden="true" />
              Visitor Countries
            </CardTitle>
            <CardDescription>
              Countries captured on booking requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!visitorCountryStats || visitorCountryStats.countries.length === 0 ? (
              <EmptyState
                icon={Globe}
                title="No countries yet"
                description="Country data will appear after it is captured on bookings."
                className="py-8"
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-3xl font-semibold tabular-nums">{visitorCountryStats.knownCountries}</div>
                    <p className="text-sm text-muted-foreground">Countries / regions</p>
                  </div>
                  <Badge variant="secondary">
                    {visitorCountryStats.bookingsWithCountry}/{visitorCountryStats.totalBookings} bookings
                  </Badge>
                </div>
                <div className="space-y-2">
                  {visitorCountryStats.countries.slice(0, 5).map((item) => (
                    <div key={item.country} className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm">
                      <span className="min-w-0 truncate font-medium">{item.country}</span>
                      <span className="tabular-nums text-muted-foreground">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendar" data-testid="link-view-calendar">
                View calendar
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
                    className="flex flex-col gap-4 rounded-lg border p-4 hover-elevate sm:flex-row sm:items-center"
                    data-testid={`tour-card-${tour.id}`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="break-words font-medium">{tour.visitorName}</span>
                        <StatusBadge status={tour.status || "pending"} />
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
                      <Avatar className="h-8 w-8 self-start sm:self-auto">
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
                View all
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
                  <div key={booking.id} className="flex flex-col gap-4 rounded-lg border p-3 sm:flex-row sm:items-center" data-testid={`booking-row-${booking.id}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {booking.visitorName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="break-words text-sm font-medium">{booking.visitorName}</span>
                        <StatusBadge status={booking.status || "pending"} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(booking.visitDate)} at {formatTime(booking.visitTime)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {booking.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => quickConfirmMutation.mutate(booking.id)}
                          disabled={quickConfirmMutation.isPending}
                          className="h-10"
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
              <Button variant="outline" className={dashboardActionCardClass} asChild>
                <Link href="/bookings" data-testid="action-manage-bookings">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div className="min-w-0">
                    <div className="font-medium">Manage bookings</div>
                    <div className="text-xs text-muted-foreground">View and process requests</div>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" className={dashboardActionCardClass} asChild>
                <Link href="/guides" data-testid="action-manage-guides">
                  <Users className="h-5 w-5 text-primary" />
                  <div className="min-w-0">
                    <div className="font-medium">Manage guides</div>
                    <div className="text-xs text-muted-foreground">Update availability</div>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" className={dashboardActionCardClass} asChild>
                <Link href="/users" data-testid="action-manage-users">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <div className="min-w-0">
                    <div className="font-medium">User management</div>
                    <div className="text-xs text-muted-foreground">Manage user accounts</div>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" className={dashboardActionCardClass} asChild>
                <Link href="/transport-partner?tab=requests" data-testid="action-transport-ops">
                  <Car className="h-5 w-5 text-primary" />
                  <div className="min-w-0">
                    <div className="font-medium">Transport ops</div>
                    <div className="text-xs text-muted-foreground">Quotes, drivers, pickups</div>
                  </div>
                </Link>
              </Button>
              <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className={dashboardActionCardClass} data-testid="action-send-email">
                    <Mail className="h-5 w-5 text-primary" />
                    <div className="min-w-0">
                      <div className="font-medium">Send email</div>
                      <div className="text-xs text-muted-foreground">Compose a message</div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Compose email</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!e.currentTarget.checkValidity()) {
                        e.currentTarget.reportValidity();
                        return;
                      }
                      const trimmedForm = {
                        recipientName: emailForm.recipientName.trim(),
                        recipientEmail: emailForm.recipientEmail.trim(),
                        subject: emailForm.subject.trim(),
                        message: emailForm.message.trim(),
                      };
                      if (!trimmedForm.recipientEmail || !trimmedForm.subject || !trimmedForm.message) {
                        toast({
                          title: "Missing required fields",
                          description: "Please fill in all required fields.",
                          variant: "destructive",
                        });
                        return;
                      }
                      sendEmailMutation.mutate(trimmedForm);
                    }}
                    className="space-y-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="recipientName">Recipient name</Label>
                        <Input
                          id="recipientName"
                          name="recipientName"
                          autoComplete="name"
                          placeholder="Recipient name…"
                          value={emailForm.recipientName}
                          onChange={(e) => setEmailForm({ ...emailForm, recipientName: e.target.value })}
                          data-testid="input-recipient-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recipientEmail">Recipient email *</Label>
                        <Input
                          id="recipientEmail"
                          name="recipientEmail"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          spellCheck={false}
                          placeholder="name@example.com"
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
                        name="subject"
                        placeholder="Subject…"
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
                        name="message"
                        placeholder="Write your message…"
                        required
                        rows={6}
                        value={emailForm.message}
                        onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                        onKeyDown={(event) => {
                          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                            event.preventDefault();
                            event.currentTarget.form?.requestSubmit();
                          }
                        }}
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
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Send email
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle className="text-lg font-semibold">Weekly Revenue</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/revenue">
                Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="break-words text-2xl font-bold tabular-nums">{formatCurrency(dashboardStats.weeklyRevenue)}</div>
                <div className="text-sm text-muted-foreground">Confirmed revenue this week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function CoordinatorDashboard() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsQueryError,
    refetch: refetchStats,
  } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const {
    data: todaysTours,
    isLoading: toursLoading,
    isError: toursError,
    error: toursQueryError,
    refetch: refetchTours,
  } = useQuery<RecentBooking[]>({
    queryKey: ["/api/bookings/today"],
  });

  const {
    data: recentBookings,
    isLoading: bookingsLoading,
    isError: bookingsError,
    error: bookingsQueryError,
    refetch: refetchBookings,
  } = useQuery<RecentBooking[]>({
    queryKey: ["/api/bookings/recent"],
  });

  const { data: dashboardHealth } = useQuery<DashboardHealthSummary>({
    queryKey: ["/api/health"],
    refetchInterval: 60000,
  });

  const isLoading = statsLoading || toursLoading || bookingsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (statsError || bookingsError || toursError) {
    const error = statsQueryError || bookingsQueryError || toursQueryError;

    return (
      <PageContainer className="page-spacing">
        <PageHeader
          title="Coordinator Dashboard"
          description="Dashboard data could not be loaded."
        />
        <DataErrorState
          title="Coordinator dashboard unavailable"
          description={error instanceof Error ? error.message : "Could not load dashboard data."}
          onRetry={() => {
            void refetchStats();
            void refetchBookings();
            void refetchTours();
          }}
          className="py-16"
        />
      </PageContainer>
    );
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
  const pendingBookings = (recentBookings || []).filter((booking) => booking.status === "pending");
  const unassignedConfirmed = (recentBookings || []).filter((booking) => booking.status === "confirmed" && !booking.assignedGuideId);
  const paymentVerifications = (recentBookings || []).filter((booking) => booking.paymentStatus !== "paid" && !!booking.paymentReference);
  const coordinatorActions: DashboardActionItem[] = [
    pendingBookings.length > 0 && {
      id: "pending-bookings",
      severity: "critical" as const,
      title: "Pending bookings",
      description: "Confirm or follow up on visitor booking requests.",
      href: "/bookings",
      icon: BookOpen,
      count: pendingBookings.length,
    },
    unassignedConfirmed.length > 0 && {
      id: "unassigned-confirmed",
      severity: "warning" as const,
      title: "Guides need assignment",
      description: "Confirmed visits should have guides before arrival.",
      href: "/bookings",
      icon: UserCheck,
      count: unassignedConfirmed.length,
    },
    paymentVerifications.length > 0 && {
      id: "payment-verifications",
      severity: "warning" as const,
      title: "Payment checks pending",
      description: "Review visitor payment references.",
      href: "/payments",
      icon: DollarSign,
      count: paymentVerifications.length,
    },
    (todaysTours || []).filter((tour) => tour.status === "in_progress").length > 0 && {
      id: "active-tours",
      severity: "info" as const,
      title: "Tours in progress",
      description: "Monitor active tours and live support needs.",
      href: "/live-ops",
      icon: Play,
      count: (todaysTours || []).filter((tour) => tour.status === "in_progress").length,
    },
    dashboardHealth && dashboardHealth.status !== "healthy" && {
      id: "system-health",
      severity: dashboardHealth.status === "unhealthy" ? "critical" as const : "warning" as const,
      title: "System health needs review",
      description: `System health is ${dashboardHealth.status}.`,
      href: "/admin/system-health",
      icon: AlertTriangle,
    },
  ].filter(Boolean) as DashboardActionItem[];

  return (
    <PageContainer className="page-spacing overflow-x-hidden">
      <PageHeader
        title="Coordinator Dashboard"
        description="Manage bookings, guides, and tour scheduling."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <DashboardActionList
        title="Operational Action Center"
        description="Coordinator queues that need booking, payment, assignment, or live-ops attention."
        items={coordinatorActions}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendar" data-testid="link-view-calendar">
                View calendar
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
                  <div key={tour.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="break-words font-medium">{tour.visitorName}</span>
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
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingBookings.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No pending bookings"
                description="All bookings have been processed."
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {pendingBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {booking.visitorName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="break-words font-medium">{booking.visitorName}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(booking.visitDate)} - {booking.numberOfPeople} people
                      </div>
                    </div>
                    <div className="text-sm font-medium tabular-nums sm:text-right">{formatCurrency(booking.totalAmount || 0)}</div>
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
            <Button variant="outline" className={dashboardActionCardClass} asChild>
              <Link href="/bookings">
                <BookOpen className="h-5 w-5 text-primary" />
                <div className="min-w-0">
                  <div className="font-medium">Manage bookings</div>
                  <div className="text-xs text-muted-foreground">Confirm requests</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className={dashboardActionCardClass} asChild>
              <Link href="/guides">
                <Users className="h-5 w-5 text-primary" />
                <div className="min-w-0">
                  <div className="font-medium">Assign guides</div>
                  <div className="text-xs text-muted-foreground">Tour assignments</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className={dashboardActionCardClass} asChild>
              <Link href="/calendar">
                <CalendarDays className="h-5 w-5 text-primary" />
                <div className="min-w-0">
                  <div className="font-medium">View calendar</div>
                  <div className="text-xs text-muted-foreground">Schedule overview</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className={dashboardActionCardClass} asChild>
              <Link href="/zones">
                <MapPin className="h-5 w-5 text-primary" />
                <div className="min-w-0">
                  <div className="font-medium">View zones</div>
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
  const displayName = user?.firstName || "there";
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const {
    data: myTours,
    isLoading,
    isError: myToursError,
    error: myToursQueryError,
    refetch: refetchMyTours,
  } = useQuery<RecentBooking[]>({
    queryKey: ["/api/bookings/my-tours"],
  });

  const {
    data: guideProfile,
    isError: guideProfileError,
    refetch: refetchGuideProfile,
  } = useQuery<Guide>({
    queryKey: ["/api/guides/me"],
  });

  const {
    data: guideAvailability,
    isError: guideAvailabilityError,
    refetch: refetchGuideAvailability,
  } = useQuery<GuideAvailabilitySummary>({
    queryKey: ["/api/guides/me/availability"],
  });

  const {
    data: trainingStats,
    isError: trainingStatsError,
    refetch: refetchTrainingStats,
  } = useQuery<TrainingStatsSummary>({
    queryKey: ["/api/training/stats"],
    retry: false,
  });

  const {
    data: guideEarnings,
    isError: guideEarningsError,
    refetch: refetchGuideEarnings,
  } = useQuery<GuideEarningsSummary>({
    queryKey: ["/api/guides/me/earnings"],
  });

  const { data: tourReports } = useQuery<GuideTourReport[]>({
    queryKey: ["/api/guides/me/tour-reports"],
  });

  const { data: guideUnreadNotifications } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  const startTourMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest("POST", `/api/bookings/${bookingId}/guide-check-in`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-tours"] });
      toast({ title: "Visitor checked in", description: "The tour is now in progress." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to start tour", description: error.message, variant: "destructive" });
    },
  });

  const completeTourMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest("POST", `/api/bookings/${bookingId}/guide-check-out`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-tours"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guides/me"] });
      toast({ title: "Tour completed", description: "The visitor has been checked out." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to complete tour", description: error.message, variant: "destructive" });
    },
  });

  const noShowMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest("POST", `/api/bookings/${bookingId}/guide-no-show`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-tours"] });
      toast({ title: "Marked as no-show", description: "The visitor has been marked as a no-show." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to mark no-show", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (myToursError) {
    return (
      <PageContainer className="page-spacing">
        <PageHeader
          title="Guide Dashboard"
          description={`Welcome back, ${displayName}. Your assignments could not be loaded.`}
        />
        <DataErrorState
          title="Guide dashboard unavailable"
          description={myToursQueryError instanceof Error ? myToursQueryError.message : "Could not load your assigned tours."}
          onRetry={() => refetchMyTours()}
          className="py-16"
        />
      </PageContainer>
    );
  }

  const todayKey = new Date().toDateString();
  const upcomingTours = myTours?.filter((tour) =>
    new Date(tour.visitDate).toDateString() === todayKey
    && (tour.status === "confirmed" || tour.status === "in_progress")
  ) || [];
  const activeTour = upcomingTours.find((tour) => tour.status === "in_progress") || null;
  const nextConfirmedTour = upcomingTours.find((tour) => tour.status === "confirmed") || null;
  const currentTour = activeTour || nextConfirmedTour;
  const averageRating = guideProfile?.totalRatings && guideProfile.totalRatings > 0
    ? guideProfile.rating || 0
    : 0;
  const todayKeyName = new Intl.DateTimeFormat("en-US", { weekday: "long" })
    .format(new Date())
    .toLowerCase();
  const availableToday = guideAvailability?.availability?.[todayKeyName] ?? true;
  const trainingPercentage = trainingStats?.percentage ?? 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);
  const nextAssignment = (myTours || [])
    .filter((tour) => {
      const tourDate = new Date(tour.visitDate);
      const status = tour.status || "pending";
      return tourDate >= tomorrowStart && ["pending", "confirmed", "in_progress"].includes(status);
    })
    .sort((a, b) => {
      const aTime = `${a.visitDate}T${a.visitTime || "00:00"}`;
      const bTime = `${b.visitDate}T${b.visitTime || "00:00"}`;
      return new Date(aTime).getTime() - new Date(bTime).getTime();
    })[0];
  const payoutSummary = guideEarnings?.payoutSummary;
  const payoutLabel = payoutSummary?.pendingCount
    ? `${formatCurrency(payoutSummary.pendingAmount)} pending`
    : payoutSummary?.lastPaidAt
      ? `Last paid ${formatDate(payoutSummary.lastPaidAt)}`
      : "No payout records yet";
  const reportsByBookingId = new Set((tourReports || []).map((report) => report.bookingId));
  const postTourReportsDue = (myTours || []).filter((tour) => tour.status === "completed" && !reportsByBookingId.has(tour.id));
  const guideActionItems: DashboardActionItem[] = [
    postTourReportsDue.length > 0 && {
      id: "post-tour-reports",
      severity: "critical" as const,
      title: "Post-tour reports due",
      description: "Submit reports for completed tours so coordinators can review follow-ups.",
      href: "/my-tours?tab=completed",
      icon: FileText,
      count: postTourReportsDue.length,
    },
    trainingStats && trainingPercentage < 100 && {
      id: "training-incomplete",
      severity: "warning" as const,
      title: "Training incomplete",
      description: `${trainingStats.completed} of ${trainingStats.total} modules complete.`,
      href: "/guide-training",
      icon: BookOpen,
      count: `${trainingPercentage}%`,
    },
    guideAvailabilityError && {
      id: "availability-unavailable",
      severity: "warning" as const,
      title: "Availability needs review",
      description: "Availability could not be loaded. Reopen it before accepting new work.",
      href: "/my-availability",
      icon: Calendar,
    },
    guideAvailability && !availableToday && {
      id: "availability-off-today",
      severity: "info" as const,
      title: "You are marked off today",
      description: "Update availability if you can accept work today.",
      href: "/my-availability",
      icon: Calendar,
    },
    payoutSummary?.pendingCount && {
      id: "payout-pending",
      severity: "info" as const,
      title: "Payout pending",
      description: `${formatCurrency(payoutSummary.pendingAmount)} across ${payoutSummary.pendingCount} payout item${payoutSummary.pendingCount === 1 ? "" : "s"}.`,
      href: "/my-earnings",
      icon: DollarSign,
      count: payoutSummary.pendingCount,
    },
    (guideUnreadNotifications?.count || 0) > 0 && {
      id: "guide-notifications",
      severity: "warning" as const,
      title: "Unread updates",
      description: "Review assignment, message, and system notifications.",
      href: "/messages",
      icon: Bell,
      count: guideUnreadNotifications?.count || 0,
    },
  ].filter(Boolean) as DashboardActionItem[];
  const availabilityPreview = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const key = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date).toLowerCase();
    return {
      label: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date),
      available: guideAvailability?.availability?.[key] ?? true,
    };
  });

  const handleQRScan = (result: string) => {
    const reference = result.trim().toUpperCase();
    const matchingTour = myTours?.find(
      (tour) => tour.bookingReference?.toUpperCase() === reference && tour.status === "confirmed"
    );

    if (matchingTour) {
      startTourMutation.mutate(matchingTour.id);
      setIsQRScannerOpen(false);
      return;
    }

    toast({
      title: "Booking not found",
      description: `No confirmed assigned tour matched ${reference}.`,
      variant: "destructive",
    });
  };

  return (
    <PageContainer className="page-spacing">
      <PageHeader
        title="Guide Dashboard"
        description={`Welcome back, ${displayName}. Here are your assigned tours.`}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" className={quickActionButtonClass} onClick={() => setIsQRScannerOpen(true)}>
          <ScanLine className={quickActionIconClass} />
          <span>Scan QR</span>
        </Button>
        <Link href="/my-tours">
          <Button variant="secondary" size="sm" className={quickActionButtonClass}>
            <CalendarDays className={quickActionIconClass} />
            <span>My Tours</span>
          </Button>
        </Link>
        <Link href="/calendar">
          <Button variant="secondary" size="sm" className={quickActionButtonClass}>
            <Calendar className={quickActionIconClass} />
            <span>Schedule</span>
          </Button>
        </Link>
        <Link href="/tasks">
          <Button variant="secondary" size="sm" className={quickActionButtonClass}>
            <ListTodo className={quickActionIconClass} />
            <span>Tasks</span>
          </Button>
        </Link>
        <Link href="/messages">
          <Button variant="secondary" size="sm" className={quickActionButtonClass}>
            <MessageCircle className={quickActionIconClass} />
            <span>Messages</span>
          </Button>
        </Link>
        <Link href="/my-availability">
          <Button variant="secondary" size="sm" className={quickActionButtonClass}>
            <Clock className={quickActionIconClass} />
            <span>Availability</span>
          </Button>
        </Link>
        <Link href="/guide-training">
          <Button variant="secondary" size="sm" className={quickActionButtonClass}>
            <BookOpen className={quickActionIconClass} />
            <span>Training</span>
          </Button>
        </Link>
        <Link href="/my-earnings">
          <Button variant="secondary" size="sm" className={quickActionButtonClass}>
            <DollarSign className={quickActionIconClass} />
            <span>Earnings</span>
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Tours"
          value={upcomingTours.length}
          subtitle={formatDate(new Date())}
          icon={CalendarDays}
        />
        <StatCard
          title="Completed Tours"
          value={guideProfileError ? "Unavailable" : (guideProfile?.completedTours || 0)}
          subtitle={guideProfileError ? "Profile unavailable" : "All time"}
          icon={CheckCircle2}
        />
        <StatCard
          title="Average Rating"
          value={guideProfileError ? "Unavailable" : averageRating > 0 ? averageRating.toFixed(1) : "Not rated"}
          subtitle={guideProfileError ? "Profile unavailable" : guideProfile?.totalRatings ? `${guideProfile.totalRatings} reviews` : "No reviews yet"}
          icon={Star}
        />
        <StatCard
          title="Total Earnings"
          value={guideProfileError ? "Unavailable" : formatCurrency(guideProfile?.totalEarnings || 0)}
          subtitle={guideProfileError ? "Profile unavailable" : "All time"}
          icon={DollarSign}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Guide Readiness</CardTitle>
          <CardDescription>Quick checks before accepting or starting assigned tours.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Availability</div>
                  <div className="text-xs text-muted-foreground">
                    {guideAvailabilityError
                      ? "Availability unavailable"
                      : guideAvailability?.workingHours
                      ? `${guideAvailability.workingHours.start} - ${guideAvailability.workingHours.end}`
                      : "Default hours"}
                  </div>
                </div>
                <Badge variant={guideAvailabilityError ? "destructive" : availableToday ? "default" : "secondary"}>
                  {guideAvailabilityError ? "Unavailable" : availableToday ? "Available today" : "Off today"}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1" aria-label="Next 7 days availability">
                {availabilityPreview.map((day) => (
                  <div
                    key={day.label}
                    className={`rounded-md border px-1 py-1.5 text-center text-[11px] ${day.available ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}
                  >
                    <div>{day.label}</div>
                    <div className="mt-0.5 font-semibold">{day.available ? "On" : "Off"}</div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link href="/my-availability">Update availability</Link>
              </Button>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Training</div>
                  <div className="text-xs text-muted-foreground">
                    {trainingStatsError
                      ? "Training unavailable"
                      : trainingStats
                        ? `${trainingStats.completed} of ${trainingStats.total} modules complete`
                        : "Progress not loaded"}
                  </div>
                </div>
                <Badge variant={trainingStatsError ? "destructive" : trainingPercentage >= 100 ? "default" : "outline"}>
                  {trainingStatsError ? "Unavailable" : `${trainingPercentage}% complete`}
                </Badge>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link href="/guide-training">Open training</Link>
              </Button>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Payout status</div>
                  <div className="text-xs text-muted-foreground">{guideEarningsError ? "Earnings unavailable" : payoutLabel}</div>
                </div>
                <Badge variant={guideEarningsError ? "destructive" : payoutSummary?.pendingCount ? "secondary" : "outline"}>
                  {guideEarningsError ? "Unavailable" : payoutSummary?.pendingCount ? "Pending" : payoutSummary?.paidCount ? "Paid" : "Not started"}
                </Badge>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link href="/my-earnings">Open earnings</Link>
              </Button>
            </div>
            <div className="rounded-lg border p-4">
              <div>
                <div className="text-sm font-medium">Full tour workflow</div>
                <div className="text-xs text-muted-foreground">Use My Tours for all assignments, past tours, and QR scan tools.</div>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link href="/my-tours">Open My Tours</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DashboardActionList
        title="Guide Action Required"
        description="Reports, training, availability, payout, and notification items that need attention."
        items={guideActionItems}
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Current Tour Mode</CardTitle>
            <CardDescription>Focused controls for the active or next confirmed tour today.</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={() => setIsQRScannerOpen(true)}>
            <ScanLine className="mr-2 h-4 w-4" />
            Scan QR
          </Button>
        </CardHeader>
        <CardContent>
          {currentTour ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-lg font-semibold">{currentTour.visitorName}</h3>
                      <StatusBadge status={currentTour.status || "confirmed"} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatTourType(currentTour.tourType)} · {formatTime(currentTour.visitTime)} · {currentTour.numberOfPeople} {currentTour.numberOfPeople === 1 ? "person" : "people"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/my-tours/${currentTour.id}`}>Open tour</Link>
                  </Button>
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Meeting point</p>
                    <p className="mt-1 break-words font-medium">{currentTour.meetingPointId || "Confirm in tour details"}</p>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Visitor contact</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {currentTour.visitorPhone && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={`tel:${currentTour.visitorPhone}`}>
                            <Phone className="mr-2 h-3.5 w-3.5" />
                            Call
                          </a>
                        </Button>
                      )}
                      {currentTour.visitorEmail && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={`mailto:${currentTour.visitorEmail}`}>
                            <Mail className="mr-2 h-3.5 w-3.5" />
                            Email
                          </a>
                        </Button>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/messages">
                          <MessageCircle className="mr-2 h-3.5 w-3.5" />
                          Message
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
                <GuideDashboardTransportSummary request={currentTour.transportRequest} />
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-semibold">Tour controls</p>
                <div className="mt-3 grid gap-2">
                  {currentTour.status === "confirmed" && (
                    <>
                      <Button
                        onClick={() => startTourMutation.mutate(currentTour.id)}
                        disabled={startTourMutation.isPending}
                      >
                        {startTourMutation.isPending && startTourMutation.variables === currentTour.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="mr-2 h-4 w-4" />
                        )}
                        Start tour
                      </Button>
                      <Button
                        variant="outline"
                        className="border-orange-200 text-orange-700 hover:bg-orange-50"
                        onClick={() => noShowMutation.mutate(currentTour.id)}
                        disabled={noShowMutation.isPending}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Mark no-show
                      </Button>
                    </>
                  )}
                  {currentTour.status === "in_progress" && (
                    <Button
                      onClick={() => completeTourMutation.mutate(currentTour.id)}
                      disabled={completeTourMutation.isPending}
                    >
                      {completeTourMutation.isPending && completeTourMutation.variables === currentTour.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Complete tour
                    </Button>
                  )}
                  <Button variant="outline" asChild>
                    <Link href={`/my-tours/${currentTour.id}/itinerary`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Open itinerary
                    </Link>
                  </Button>
                  <ReportIncidentDialog bookingId={currentTour.id} triggerButton />
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No current tour"
              description="When a confirmed or in-progress tour is scheduled for today, focused controls will appear here."
              className="py-8"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Next Assignment After Today</CardTitle>
          <CardDescription>Your next scheduled tour beyond today’s active assignments.</CardDescription>
        </CardHeader>
        <CardContent>
          {nextAssignment ? (
            <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="break-words font-medium">{nextAssignment.visitorName}</span>
                  <StatusBadge status={nextAssignment.status || "pending"} />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(nextAssignment.visitDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(nextAssignment.visitTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {nextAssignment.numberOfPeople} {nextAssignment.numberOfPeople === 1 ? "person" : "people"}
                  </span>
                </div>
                <GuideDashboardTransportSummary request={nextAssignment.transportRequest} />
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/my-tours/${nextAssignment.id}`}>View assignment</Link>
              </Button>
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No later assignment scheduled"
              description="When staff assign a future tour, it will appear here."
              className="py-8"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Today's Assigned Tours</CardTitle>
            <CardDescription>Check visitors in, mark no-shows, or complete active tours.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsQRScannerOpen(true)}
            className="gap-2"
          >
            <ScanLine className="h-4 w-4" />
            Scan QR
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingTours.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No tours assigned today"
              description="You do not have any tours scheduled for today."
              className="py-8"
            />
          ) : (
            <div className="space-y-4">
              {upcomingTours.map((tour) => (
                <div key={tour.id} className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-words font-medium">{tour.visitorName}</span>
                      <StatusBadge status={tour.status || "pending"} />
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
                        {formatTourType(tour.tourType)}
                      </span>
                    </div>
                    <GuideDashboardTransportSummary request={tour.transportRequest} />
                  </div>
                  {tour.status === "confirmed" && (
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <Button
                        size="sm"
                        data-testid={`start-tour-${tour.id}`}
                        onClick={() => startTourMutation.mutate(tour.id)}
                        disabled={startTourMutation.isPending}
                        className="w-full gap-2 sm:w-auto"
                      >
                        {startTourMutation.isPending && startTourMutation.variables === tour.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        Check in visitor
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`no-show-tour-${tour.id}`}
                        onClick={() => noShowMutation.mutate(tour.id)}
                        disabled={noShowMutation.isPending}
                        className="w-full gap-2 text-orange-700 border-orange-200 hover:bg-orange-50 sm:w-auto"
                      >
                        {noShowMutation.isPending && noShowMutation.variables === tour.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserX className="h-4 w-4" />
                        )}
                        No-show
                      </Button>
                    </div>
                  )}
                  {tour.status === "in_progress" && (
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`complete-tour-${tour.id}`}
                      onClick={() => completeTourMutation.mutate(tour.id)}
                      disabled={completeTourMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {completeTourMutation.isPending && completeTourMutation.variables === tour.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Check out
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

      <QRScannerDialog
        open={isQRScannerOpen}
        onOpenChange={setIsQRScannerOpen}
        onScan={handleQRScan}
        title="Scan Visitor QR Code"
        description="Scan the visitor's booking QR code to check them in for an assigned confirmed tour."
      />
    </PageContainer>
  );
}

function SecurityDashboard() {
  const {
    data: activeVisits,
    isLoading: visitsLoading,
    isError: activeVisitsError,
    error: activeVisitsQueryError,
    refetch: refetchActiveVisits,
  } = useQuery<RecentBooking[]>({
    queryKey: ["/api/bookings/active"],
  });

  const {
    data: incidents,
    isLoading: incidentsLoading,
    isError: incidentsError,
    error: incidentsQueryError,
    refetch: refetchIncidents,
  } = useQuery<Incident[]>({
    queryKey: ["/api/incidents"],
  });

  const {
    data: todaysTours,
    isLoading: todaysToursLoading,
    isError: todaysToursError,
    refetch: refetchTodaysTours,
  } = useQuery<RecentBooking[]>({
    queryKey: ["/api/bookings/today"],
  });

  const isLoading = visitsLoading || incidentsLoading || todaysToursLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (activeVisitsError || incidentsError) {
    const error = activeVisitsQueryError || incidentsQueryError;

    return (
      <PageContainer className="page-spacing">
        <PageHeader
          title="Security Dashboard"
          description="Security dashboard data could not be loaded."
        />
        <DataErrorState
          title="Security dashboard unavailable"
          description={error instanceof Error ? error.message : "Could not load active visits or incident data."}
          onRetry={() => {
            void refetchActiveVisits();
            void refetchIncidents();
          }}
          className="py-16"
        />
      </PageContainer>
    );
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Visitors"
          value={checkedInVisitors.length}
          subtitle="Currently in camp"
          icon={UserCheck}
        />
        <StatCard
          title="Pending Check-ins"
          value={todaysToursError ? "Unavailable" : pendingVerifications.length}
          subtitle={todaysToursError ? "Booking feed unavailable" : "Awaiting arrival"}
          icon={Clock}
        />
        <StatCard
          title="Today's Check-ins"
          value={todaysToursError ? "Unavailable" : todaysTours?.filter(t => t.checkInTime).length || 0}
          subtitle={todaysToursError ? "Booking feed unavailable" : formatDate(new Date())}
          icon={CheckCircle2}
        />
        <StatCard
          title="Open Incidents"
          value={openIncidents.length}
          subtitle="Need attention"
          icon={AlertTriangle}
        />
      </div>

      {todaysToursError && (
        <DataErrorState
          title="Booking verification feed unavailable"
          description="Today's booking feed could not be loaded. Retry before assuming there are no pending check-ins."
          onRetry={() => refetchTodaysTours()}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Active Visitors</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/security" data-testid="link-security">
                View all
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
                        Checked in: {visitor.checkInTime ? formatTime(visitor.checkInTime) : "Not recorded"}
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
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {openIncidents.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No open incidents"
                description="No incidents require attention."
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
            <Button variant="outline" className={dashboardActionCardClass} asChild>
              <Link href="/security">
                <UserCheck className="h-5 w-5 text-primary" />
                <div className="min-w-0">
                  <div className="font-medium">Check in visitor</div>
                  <div className="text-xs text-muted-foreground">Verify and check in</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className={dashboardActionCardClass} asChild>
              <Link href="/security?tab=verify">
                <Shield className="h-5 w-5 text-primary" />
                <div className="min-w-0">
                  <div className="font-medium">Verify booking</div>
                  <div className="text-xs text-muted-foreground">Check booking details</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className={dashboardActionCardClass} asChild>
              <Link href="/security?tab=incidents">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <div className="min-w-0">
                  <div className="font-medium">Report incident</div>
                  <div className="text-xs text-muted-foreground">Log new incident</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className={dashboardActionCardClass} asChild>
              <Link href="/security?tab=active">
                <Users className="h-5 w-5 text-primary" />
                <div className="min-w-0">
                  <div className="font-medium">Active visitors</div>
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
  const displayName = user?.firstName || "there";

  const {
    data: myBookings,
    isLoading,
    isError: myBookingsError,
    error: myBookingsQueryError,
    refetch: refetchMyBookings,
  } = useQuery<RecentBooking[]>({
    queryKey: ["/api/bookings/my-bookings"],
  });

  const { data: itineraries } = useQuery<{ bookingId: string }[]>({
    queryKey: ["/api/my-itineraries"],
    enabled: !!user,
  });

  const { data: savedItinerariesData } = useQuery<SavedItinerarySummary[]>({
    queryKey: ["/api/visitors/saved-itineraries"],
    enabled: !!user,
  });

  const { data: favoriteGuidesData } = useQuery<FavoriteGuideSummary[]>({
    queryKey: ["/api/visitors/favorite-guides"],
    enabled: !!user,
  });

  const { data: supportTicketsData } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support/tickets"],
    enabled: !!user,
  });

  const { data: unreadNotificationsData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: zones } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/public/zones"],
  });

  const { data: meetingPoints } = useQuery<{ id: string; name: string; address?: string }[]>({
    queryKey: ["/api/public/meeting-points"],
  });

  const [paymentDialogBooking, setPaymentDialogBooking] = useState<RecentBooking | null>(null);
  const [paymentReportForm, setPaymentReportForm] = useState({
    paymentMethod: "cash",
    paymentReference: "",
    note: "",
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: { bookingId: string; paymentMethod: string; paymentReference: string; note: string }) => {
      return apiRequest("PATCH", `/api/bookings/${data.bookingId}/visitor-payment`, {
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
        note: data.note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-bookings"] });
      setPaymentDialogBooking(null);
      setPaymentReportForm({ paymentMethod: "cash", paymentReference: "", note: "" });
      toast({
        title: "Payment reported",
        description: "Staff will verify it before marking your booking as paid.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to report payment", description: error.message, variant: "destructive" });
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

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ guideId, isFavorite }: { guideId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/visitors/favorite-guides/${guideId}`);
      } else {
        await apiRequest("POST", `/api/visitors/favorite-guides/${guideId}`);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitors/favorite-guides"] });
      toast({
        title: variables.isFavorite ? "Removed from Favorites" : "Added to Favorites",
        description: variables.isFavorite
          ? "Guide has been removed from your favorites."
          : "Guide has been added to your favorites.",
      });
    },
    onError: (error: Error, variables) => {
      toast({
        title: variables.isFavorite ? "Failed to Remove" : "Failed to Add",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isGuideFavorite = (guideId?: string | null) => {
    if (!guideId || !favoriteGuidesData) return false;
    return favoriteGuidesData.some((fav) => fav.guideId === guideId);
  };

  const [selectedRating, setSelectedRating] = useState<{ bookingId: string; rating: number } | null>(null);
  const [showAllPastVisits, setShowAllPastVisits] = useState(false);
  const [showBookingCTA, setShowBookingCTA] = useState(() => {
    // Initialize from localStorage to prevent flash of content
    const dismissed = localStorage.getItem('dismiss_booking_cta');
    return !dismissed;
  });

  const handleRateGuide = (bookingId: string, rating: number) => {
    setSelectedRating({ bookingId, rating });
    rateGuideMutation.mutate({ bookingId, rating });
  };

  const openPaymentReportDialog = (booking: RecentBooking) => {
    setPaymentDialogBooking(booking);
    setPaymentReportForm({
      paymentMethod: booking.paymentMethod || "cash",
      paymentReference: booking.paymentReference || "",
      note: "",
    });
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

  const getGuideName = (booking: RecentBooking) => {
    if (!booking.guide) return null;
    return `${booking.guide.firstName} ${booking.guide.lastName}`.trim();
  };

  const getGuidePhone = (booking: RecentBooking) => {
    return booking.guide?.phone || null;
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

  if (myBookingsError) {
    return (
      <PageContainer className="page-spacing">
        <PageHeader
          title={`Welcome, ${displayName}`}
          description="Your visitor dashboard could not be loaded."
        />
        <DataErrorState
          title="Visitor dashboard unavailable"
          description={myBookingsQueryError instanceof Error ? myBookingsQueryError.message : "Could not load your bookings."}
          onRetry={() => refetchMyBookings()}
          className="py-16"
        />
      </PageContainer>
    );
  }

  const upcomingBookings = myBookings?.filter(b =>
    b.status === "pending" || b.status === "confirmed"
  ) || [];
  const completedBookings = myBookings?.filter(b => b.status === "completed") || [];
  const savedItineraries = savedItinerariesData || [];
  const favoriteGuides = (favoriteGuidesData || []).filter((favorite) => favorite.guide);
  const supportTickets = supportTicketsData || [];
  const unreadNotifications = unreadNotificationsData?.count || 0;
  const cancellationOrRefundBookings = (myBookings || [])
    .filter((booking) => booking.status === "cancelled" || booking.paymentStatus === "refunded")
    .sort((a, b) => new Date(b.updatedAt || b.visitDate).getTime() - new Date(a.updatedAt || a.visitDate).getTime())
    .slice(0, 3);

  const getCancellationResolution = (booking: RecentBooking) => {
    if (booking.paymentStatus === "refunded") {
      return {
        label: "Refunded",
        detail: "Payment has been refunded for this booking.",
        variant: "default" as const,
      };
    }

    if (booking.paymentStatus === "paid") {
      return {
        label: "Refund review",
        detail: "This booking was paid before cancellation. Staff will confirm refund or credit next steps.",
        variant: "secondary" as const,
      };
    }

    return {
      label: "Cancelled",
      detail: "No payment was marked as collected for this booking.",
      variant: "outline" as const,
    };
  };
  const nextVisit = [...upcomingBookings].sort((a, b) => {
    const aTime = `${a.visitDate}T${a.visitTime || "00:00"}`;
    const bTime = `${b.visitDate}T${b.visitTime || "00:00"}`;
    return new Date(aTime).getTime() - new Date(bTime).getTime();
  })[0];
  const nextVisitMeetingPoint = nextVisit ? getMeetingPointName(nextVisit.meetingPointId) : null;
  const nextVisitMeetingPointAddress = nextVisit?.meetingPointId && meetingPoints
    ? meetingPoints.find((point) => point.id === nextVisit.meetingPointId)?.address
    : null;
  const nextVisitPaymentLabel = nextVisit?.paymentStatus === "paid"
    ? "Paid"
    : nextVisit?.paymentReference
      ? "Payment verification pending"
      : "Payment not reported";
  const nextVisitTransport = nextVisit?.transportRequest || null;
  const nextVisitTransportRoute = nextVisitTransport ? getTransportRoute(nextVisitTransport.route) : null;
  const nextVisitTransportQuote = formatTransportQuote(nextVisitTransport);
  const nextVisitTransportPartner = nextVisitTransport?.partner?.companyName || null;
  const nextVisitTransportDetail = nextVisitTransport
    ? [
        nextVisitTransportRoute?.shortLabel,
        nextVisitTransportPartner,
        nextVisitTransportQuote,
      ].filter(Boolean).join(" • ")
    : "Request transport from your booking form when needed.";
  const nextVisitItems = [
    {
      label: "Next visit",
      value: nextVisit ? `${formatDate(nextVisit.visitDate)} at ${formatTime(nextVisit.visitTime)}` : "No visit scheduled",
      detail: nextVisit ? `${formatTourType(nextVisit.tourType)} tour` : "Book a visit when you are ready.",
    },
    {
      label: "Payment",
      value: nextVisitPaymentLabel,
      detail: nextVisit?.totalAmount ? formatCurrency(nextVisit.totalAmount) : "No upcoming payment due",
    },
    {
      label: "Transport",
      value: nextVisitTransport ? getTransportStatusLabel(nextVisitTransport.status) : "Not requested",
      detail: nextVisitTransportDetail,
    },
    {
      label: "Support",
      value: cancellationOrRefundBookings.length > 0 ? "Recent cancellation/refund" : "Help available",
      detail: cancellationOrRefundBookings.length > 0
        ? "Ask support if you need refund or reschedule help."
        : "Contact support from the Help Center.",
    },
  ];
  const visitorActionItems = buildVisitorActionItems({
    bookings: myBookings || [],
    supportTickets,
    unreadNotifications,
  });
  const latestSupportTicket = [...supportTickets]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())[0];
  const latestUpdates = [
    nextVisit?.assignedGuideId && {
      id: `guide-${nextVisit.id}`,
      icon: UserCheck,
      title: "Guide assigned",
      detail: getGuideName(nextVisit) || "Your assigned guide is visible in booking details.",
      href: `/my-bookings/${nextVisit.id}`,
    },
    nextVisitTransport && {
      id: `transport-${nextVisit.id}`,
      icon: Car,
      title: `Transport ${getTransportStatusLabel(nextVisitTransport.status)}`,
      detail: nextVisitTransportDetail,
      href: `/my-bookings/${nextVisit.id}`,
    },
    nextVisit && nextVisit.paymentStatus !== "paid" && {
      id: `payment-${nextVisit?.id || "next"}`,
      icon: DollarSign,
      title: nextVisit?.paymentReference ? "Payment verification pending" : "Payment not reported",
      detail: nextVisit ? nextVisitPaymentLabel : "No upcoming payment due.",
      href: nextVisit ? `/my-bookings/${nextVisit.id}` : "/my-bookings",
    },
    nextVisit && itineraries?.some((i) => i.bookingId === nextVisit.id) && {
      id: `itinerary-${nextVisit.id}`,
      icon: FileDown,
      title: "Itinerary ready",
      detail: "Open your generated itinerary before arrival.",
      href: `/my-bookings/${nextVisit.id}/itinerary`,
    },
    latestSupportTicket && {
      id: `support-${latestSupportTicket.id}`,
      icon: MessageCircle,
      title: "Support status",
      detail: `${latestSupportTicket.subject} is ${latestSupportTicket.status?.replace(/_/g, " ") || "open"}.`,
      href: "/help?support=true",
    },
  ].filter(Boolean) as Array<{ id: string; icon: LucideIcon; title: string; detail: string; href: string }>;

  return (
    <PageContainer className="page-spacing overflow-x-hidden">
      <PageHeader
        title={`Welcome, ${displayName}`}
        description="Review your visits, tour details, payments, and support options."
      />

      <DashboardActionList
        title="Action Required"
        description="Payment, transport, support, messages, ratings, and pre-visit tasks that may need your attention."
        items={visitorActionItems}
      />

      <div className="flex flex-wrap gap-2">
        <Link href="/my-bookings?book=true">
          <Button variant="secondary" size="sm" className={quickActionButtonClass}>
            <Ticket className={quickActionIconClass} />
            <span>Book visit</span>
          </Button>
        </Link>
        <Link href={nextVisit ? `/my-bookings/${nextVisit.id}` : "/my-bookings"}>
          <Button variant="secondary" size="sm" className={quickActionButtonClass}>
            <Calendar className={quickActionIconClass} />
            <span>{nextVisit ? "Next booking" : "Bookings"}</span>
          </Button>
        </Link>
        <Button variant="secondary" size="sm" className={quickActionButtonClass} asChild>
          <a href="#arrival-pass">
            <ScanLine className={quickActionIconClass} />
            <span>Arrival pass</span>
          </a>
        </Button>
        <Link href="/messages">
          <Button variant="secondary" size="sm" className={quickActionButtonClass}>
            <MessageCircle className={quickActionIconClass} />
            <span>Messages</span>
          </Button>
        </Link>
        <Link href="/help?support=true">
          <Button variant="secondary" size="sm" className={quickActionButtonClass}>
            <Shield className={quickActionIconClass} />
            <span>Support</span>
          </Button>
        </Link>
        <Link href="/saved-itineraries">
          <Button variant="secondary" size="sm" className={quickActionButtonClass}>
            <MapPin className={quickActionIconClass} />
            <span>Saved plans</span>
          </Button>
        </Link>
        <Link href="/favorite-guides">
          <Button variant="secondary" size="sm" className={quickActionButtonClass}>
            <Heart className={quickActionIconClass} />
            <span>Favorite guides</span>
          </Button>
        </Link>
        <Link href="/resources">
          <Button variant="secondary" size="sm" className={quickActionButtonClass}>
            <BookOpen className={quickActionIconClass} />
            <span>Resources</span>
          </Button>
        </Link>
      </div>

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
          subtitle="Finished"
          icon={CheckCircle2}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="break-words text-lg font-semibold">Next Visit</CardTitle>
            <CardDescription className="break-words">Date, payment, transport, and support for your next booking.</CardDescription>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/my-bookings?book=true">
              Book a visit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {nextVisitItems.map((item) => (
                <div key={item.label} className="rounded-lg border p-4">
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  <p className="mt-1 break-words text-sm font-semibold">{item.value}</p>
                  <p className="mt-2 break-words text-xs text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
            <div id="arrival-pass" className="rounded-lg border p-4 scroll-mt-24">
              <p className="text-sm font-semibold">Arrival Pass</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {nextVisit
                  ? "Keep these arrival details ready for check-in."
                  : "Your arrival pass will appear when you have a booking."}
              </p>
              {nextVisit?.bookingReference && (nextVisit.status === "confirmed" || nextVisit.status === "pending") && (
                <div className="mt-3 rounded-md border bg-background p-3">
                  <QRCodeDisplay value={nextVisit.bookingReference} size={128} />
                </div>
              )}
              <div className="mt-3 grid gap-2 text-sm">
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Meeting point</p>
                  <p className="mt-1 break-words font-medium">{nextVisitMeetingPoint || "Confirm in booking details"}</p>
                  {nextVisitMeetingPointAddress && (
                    <p className="mt-1 break-words text-xs text-muted-foreground">{nextVisitMeetingPointAddress}</p>
                  )}
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Guide</p>
                  <p className="mt-1 break-words font-medium">{nextVisit ? getGuideName(nextVisit) || "Not assigned yet" : "No upcoming visit"}</p>
                  {nextVisit && getGuidePhone(nextVisit) && (
                    <Button variant="link" className="h-auto p-0 text-xs" asChild>
                      <a href={`tel:${getGuidePhone(nextVisit)}`}>Call guide</a>
                    </Button>
                  )}
                </div>
              </div>
              {nextVisitTransport && (
                <div className="mt-3 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm dark:border-sky-800 dark:bg-sky-950/30">
                  <div className="flex gap-2">
                    <Car className="mt-0.5 h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-medium text-sky-900 dark:text-sky-100">
                        Transport {getTransportStatusLabel(nextVisitTransport.status)}
                      </p>
                      <p className="mt-1 break-words text-xs text-sky-700 dark:text-sky-300">
                        {nextVisitTransportDetail}
                      </p>
                      {(nextVisitTransport.driverName || nextVisitTransport.driverPhone || nextVisitTransport.vehicleDetails) && (
                        <p className="mt-2 break-words text-xs text-sky-800 dark:text-sky-200">
                          {[nextVisitTransport.driverName, nextVisitTransport.driverPhone, nextVisitTransport.vehicleDetails]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      )}
                      {nextVisitTransport.driverPhone && (
                        <Button variant="link" className="mt-2 h-auto p-0 text-xs" asChild>
                          <a href={`tel:${nextVisitTransport.driverPhone}`}>Call driver</a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-4 grid gap-2">
                {nextVisit && itineraries?.some((i) => i.bookingId === nextVisit.id) && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/my-bookings/${nextVisit.id}/itinerary`}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Open itinerary
                    </Link>
                  </Button>
                )}
                {nextVisit && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/my-bookings/${nextVisit.id}`}>
                      <ScanLine className="mr-2 h-4 w-4" />
                      Open full pass
                    </Link>
                  </Button>
                )}
                {nextVisitTransport && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={nextVisit ? `/my-bookings/${nextVisit.id}` : "/my-bookings"}>
                      <Car className="mr-2 h-4 w-4" />
                      View transport details
                    </Link>
                  </Button>
                )}
                {nextVisit && nextVisit.paymentStatus !== "paid" && (
                  <Button type="button" variant="outline" className="w-full justify-start" onClick={() => openPaymentReportDialog(nextVisit)}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Report payment
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/help?support=true">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact support
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="tel:+61498956715">
                    <Phone className="mr-2 h-4 w-4" />
                    Emergency contact
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/resources">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Before you visit
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Latest Updates</CardTitle>
            <CardDescription>Recent booking, transport, payment, itinerary, and support signals.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/my-bookings">
              View bookings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {latestUpdates.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No updates yet"
              description="Your booking and support updates will appear here."
              className="py-8"
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {latestUpdates.slice(0, 6).map((update) => {
                const Icon = update.icon;
                return (
                  <Button key={update.id} variant="outline" className="h-auto justify-start p-0 text-left" asChild>
                    <Link href={update.href}>
                      <span className="flex w-full items-start gap-3 p-4">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block break-words text-sm font-semibold">{update.title}</span>
                          <span className="mt-1 block break-words text-xs text-muted-foreground">{update.detail}</span>
                        </span>
                      </span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
                <h3 className="font-semibold text-lg">Ready to book your tour?</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a date, group size, and tour type. A local guide will confirm the details with you.
                </p>
              </div>

              <Button asChild size="default" className="shrink-0 w-full sm:w-auto">
                <Link href="/my-bookings?book=true">
                  Book now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dzaleka Online Services promotion */}
      <Card>
        <CardContent className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
          <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 space-y-1">
              <h3 className="break-words text-base font-semibold">Dzaleka Online Services</h3>
              <p className="max-w-lg break-words text-sm text-muted-foreground">
                Find local services, news, events, and community-led projects in one place.
              </p>
            </div>
          </div>
          <Button asChild size="default" className="shrink-0 w-full sm:w-auto">
            <a href="https://services.dzaleka.com" target="_blank" rel="noopener noreferrer">
              Open services <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-4 space-y-0 pb-4 sm:flex-row sm:items-center">
          <CardTitle className="text-lg font-semibold">Your Upcoming Visits</CardTitle>
          <Button asChild className="w-full sm:w-auto" data-testid="button-book-visit">
            <Link href="/my-bookings?book=true">
              Book a visit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming visits"
              description="You do not have any scheduled visits."
              className="py-8"
              action={
                <Button asChild className="mt-4">
                  <Link href="/my-bookings?book=true">
                    Book your first visit
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => {
                const guideName = getGuideName(booking);
                const guidePhone = getGuidePhone(booking);
                const zoneNames = getZoneNames(booking.selectedZones as string[]);
                const meetingPointName = getMeetingPointName(booking.meetingPointId);
                const isConfirmed = booking.status === "confirmed";
                const paymentLabel = booking.paymentStatus === "paid"
                  ? "Paid"
                  : booking.paymentReference
                    ? "Verification pending"
                    : "Payment pending";

                return (
                  <div key={booking.id} className="rounded-lg border p-4 space-y-3">
                    {/* Header Row */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="break-words font-medium">
                            {formatTourType(booking.tourType)} Tour
                          </span>
                          <StatusBadge status={booking.status || "pending"} />
                          <Badge variant={booking.paymentStatus === "paid" ? "default" : "outline"}
                            className={booking.paymentStatus === "paid" ? "bg-green-600" : ""}>
                            {paymentLabel}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
                      <div className="min-w-0 sm:text-right">
                        <div className="text-sm font-medium">{formatCurrency(booking.totalAmount || 0)}</div>
                        <div className="break-all text-xs text-muted-foreground">Ref: {booking.bookingReference}</div>
                      </div>
                    </div>

                    {/* Guide Info */}
                    {guideName && (
                      <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <UserCheck className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="break-words text-sm font-medium text-green-700 dark:text-green-400">Your guide: {guideName}</div>
                            {guidePhone && (
                              <div className="break-words text-xs text-green-600 dark:text-green-500">Phone: {guidePhone}</div>
                            )}
                          </div>
                        </div>
                        {booking.assignedGuideId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 hover:bg-green-100 dark:hover:bg-green-950/40 text-green-700 dark:text-green-400"
                            onClick={() => {
                              const isFav = isGuideFavorite(booking.assignedGuideId);
                              toggleFavoriteMutation.mutate({ guideId: booking.assignedGuideId!, isFavorite: isFav });
                            }}
                            disabled={toggleFavoriteMutation.isPending}
                            aria-label={isGuideFavorite(booking.assignedGuideId) ? "Remove guide from favorites" : "Add guide to favorites"}
                          >
                            <Heart
                              className={`h-4 w-4 ${
                                isGuideFavorite(booking.assignedGuideId)
                                  ? "fill-current text-red-500"
                                  : "text-green-700 dark:text-green-400"
                              }`}
                            />
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Selected Zones */}
                    {zoneNames && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                        <span className="break-words">Areas: {zoneNames}</span>
                      </div>
                    )}

                    {/* Meeting Point */}
                    {meetingPointName && (
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <span className="break-words text-sm text-blue-700 dark:text-blue-400">
                          <strong>Meeting point:</strong> {meetingPointName}
                        </span>
                      </div>
                    )}

                    {/* Special Requests */}
                    {booking.specialRequests && (
                      <div className="p-2 rounded-lg bg-muted/50 border">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Your special requests:</div>
                        <div className="break-words text-sm">{booking.specialRequests}</div>
                      </div>
                    )}

                    {/* Check-in Instructions for Confirmed Bookings */}
                    {isConfirmed && (
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                          <div className="text-sm text-amber-800 dark:text-amber-300">
                            <strong>Check-in instructions:</strong>
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
                      <div className="flex flex-wrap justify-end pt-2 border-t gap-2">
                        {itineraries?.some((i) => i.bookingId === booking.id) && (
                          <Button size="sm" variant="default" asChild>
                            <Link href={`/my-bookings/${booking.id}/itinerary`}>
                              <FileDown className="mr-2 h-4 w-4" /> View itinerary
                            </Link>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPaymentReportDialog(booking)}
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Report payment
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
                      <div className="flex flex-wrap justify-end pt-2 border-t gap-2">
                        {itineraries?.some((i) => i.bookingId === booking.id) && (
                          <Button size="sm" variant="default" asChild>
                            <Link href={`/my-bookings/${booking.id}/itinerary`}>
                              <FileDown className="mr-2 h-4 w-4" /> View itinerary
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
                          Cancel booking
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

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Your Saved Plans</CardTitle>
            <CardDescription>Reuse saved itineraries or request a guide you liked.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/saved-itineraries">Saved itineraries</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/favorite-guides">Favorite guides</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {savedItineraries.length === 0 && favoriteGuides.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="No saved plans yet"
              description="Save an itinerary or favorite a guide after a visit to make repeat bookings faster."
              className="py-8"
              action={
                <Button asChild className="mt-4">
                  <Link href="/my-bookings?book=true">
                    Book a visit
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Saved itineraries</p>
                    <p className="mt-1 text-xs text-muted-foreground">{savedItineraries.length} plan{savedItineraries.length === 1 ? "" : "s"} saved</p>
                  </div>
                  <Badge variant="secondary" className="tabular-nums">{savedItineraries.length}</Badge>
                </div>
                <div className="mt-4 space-y-2">
                  {savedItineraries.slice(0, 2).map((itinerary) => (
                    <div key={itinerary.id} className="rounded-md bg-muted/40 p-3">
                      <p className="break-words text-sm font-medium">{itinerary.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatTourType(itinerary.tourType)}</p>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-4 w-full justify-start" asChild>
                  <Link href="/saved-itineraries">
                    Book from saved itinerary
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Favorite guides</p>
                    <p className="mt-1 text-xs text-muted-foreground">{favoriteGuides.length} guide{favoriteGuides.length === 1 ? "" : "s"} saved</p>
                  </div>
                  <Badge variant="secondary" className="tabular-nums">{favoriteGuides.length}</Badge>
                </div>
                <div className="mt-4 space-y-2">
                  {favoriteGuides.slice(0, 2).map((favorite) => (
                    <div key={favorite.id} className="rounded-md bg-muted/40 p-3">
                      <p className="break-words text-sm font-medium">
                        {favorite.guide ? `${favorite.guide.firstName} ${favorite.guide.lastName}`.trim() : "Saved guide"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Available for future requests</p>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-4 w-full justify-start" asChild>
                  <Link href="/favorite-guides">
                    Request a favorite guide
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {cancellationOrRefundBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Cancellation & Refund Status</CardTitle>
            <CardDescription>Recent cancelled visits and payment resolution status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cancellationOrRefundBookings.map((booking) => {
                const resolution = getCancellationResolution(booking);

                return (
                  <div key={booking.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <XCircle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="break-words font-medium">{formatTourType(booking.tourType)} Tour</span>
                        <Badge variant={resolution.variant}>{resolution.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(booking.visitDate)} at {formatTime(booking.visitTime)} · Ref: {booking.bookingReference}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{resolution.detail}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/help?support=true&subject=Question%20about%20a%20cancelled%20booking">
                        Ask support
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!paymentDialogBooking} onOpenChange={(open) => !open && setPaymentDialogBooking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Payment Made</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Staff will verify this payment before your booking is marked as paid.
            </p>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment method</Label>
              <Select
                value={paymentReportForm.paymentMethod}
                onValueChange={(value) => setPaymentReportForm((current) => ({ ...current, paymentMethod: value }))}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="airtel_money">Airtel Money</SelectItem>
                  <SelectItem value="tnm_mpamba">TNM Mpamba</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-reference">Reference or receipt number</Label>
              <Input
                id="payment-reference"
                name="paymentReference"
                value={paymentReportForm.paymentReference}
                onChange={(event) => setPaymentReportForm((current) => ({ ...current, paymentReference: event.target.value }))}
                placeholder="Mobile money or receipt reference…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-note">Note</Label>
              <Textarea
                id="payment-note"
                name="paymentNote"
                value={paymentReportForm.note}
                onChange={(event) => setPaymentReportForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Anything staff should know…"
                rows={3}
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setPaymentDialogBooking(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={updatePaymentMutation.isPending || !paymentDialogBooking}
                onClick={() => {
                  if (!paymentDialogBooking) return;
                  updatePaymentMutation.mutate({
                    bookingId: paymentDialogBooking.id,
                    paymentMethod: paymentReportForm.paymentMethod,
                    paymentReference: paymentReportForm.paymentReference.trim(),
                    note: paymentReportForm.note.trim(),
                  });
                }}
              >
                {updatePaymentMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <DollarSign className="mr-2 h-4 w-4" />
                )}
                Report payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {completedBookings.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Past Visits</CardTitle>
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

                      toast({ title: "History exported", description: "Your visit history has been downloaded." });
                    } catch (error) {
                      toast({ title: "Export failed", description: "Could not export visit history.", variant: "destructive" });
                    }
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export history
                </Button>
                {completedBookings.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllPastVisits(!showAllPastVisits)}
                  >
                    {showAllPastVisits ? "Show less" : "View all"}
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
                              {formatTourType(booking.tourType)} Tour
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

                        {getGuideName(booking) && (
                          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 shrink-0" />
                              <span>
                                Guided by <span className="font-medium text-foreground">{getGuideName(booking)}</span>
                              </span>
                            </div>
                            {booking.assignedGuideId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 hover:bg-muted"
                                onClick={() => {
                                  const isFav = isGuideFavorite(booking.assignedGuideId);
                                  toggleFavoriteMutation.mutate({ guideId: booking.assignedGuideId!, isFavorite: isFav });
                                }}
                                disabled={toggleFavoriteMutation.isPending}
                                aria-label={isGuideFavorite(booking.assignedGuideId) ? "Remove guide from favorites" : "Add guide to favorites"}
                              >
                                <Heart
                                  className={`h-4 w-4 ${
                                    isGuideFavorite(booking.assignedGuideId)
                                      ? "fill-current text-red-500"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-3 border-t">
                        {itineraries?.some((i) => i.bookingId === booking.id) && (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/my-bookings/${booking.id}/itinerary`}>
                              <FileDown className="mr-2 h-4 w-4" /> Itinerary
                            </Link>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/my-bookings?book=true">
                            Book again
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
                                className="rounded-md p-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                title={`Rate ${star} stars`}
                                aria-label={`Rate ${star} ${star === 1 ? "star" : "stars"}`}
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
            Need help during a visit? Report an issue or contact the team.
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
              <h4 className="font-semibold text-sm mb-2">Support & Incidents</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Open a support ticket for booking questions, or report urgent safety concerns.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" asChild>
                  <Link href="/help?support=true">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Open support ticket
                  </Link>
                </Button>
                <ReportIncidentDialog triggerButton />
              </div>
              <div className="mt-4 rounded-lg border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Support status</p>
                    {latestSupportTicket ? (
                      <>
                        <p className="mt-1 break-words text-sm">{latestSupportTicket.subject}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Last updated {formatDate(latestSupportTicket.updatedAt || latestSupportTicket.createdAt || new Date())}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">No support tickets yet.</p>
                    )}
                  </div>
                  {latestSupportTicket ? (
                    <Badge variant="outline" className="capitalize">
                      {latestSupportTicket.status?.replace(/_/g, " ") || "open"}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/help?support=true">Open support ticket</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/help">View all tickets</Link>
                  </Button>
                </div>
              </div>
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
          <CardTitle className="text-lg font-semibold">Plan Your Visit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className={dashboardActionCardClass} asChild>
              <Link href="/plan-your-trip">
                <MapPin className="h-5 w-5 text-primary" />
                <div className="min-w-0">
                  <div className="font-medium">Travel guide</div>
                  <div className="text-xs text-muted-foreground">Getting to Dzaleka</div>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground absolute top-2 right-2" />
              </Link>
            </Button>
            <Button variant="outline" className={dashboardActionCardClass} asChild>
              <Link href="/plan-your-trip/visitor-essentials">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="font-medium">Visitor guidelines</div>
                  <div className="text-xs text-muted-foreground">What to know before you go</div>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground absolute top-2 right-2" />
              </Link>
            </Button>
            <Button variant="outline" className={dashboardActionCardClass} asChild>
              <Link href="/life-in-dzaleka">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="font-medium">Time capsule</div>
                  <div className="text-xs text-muted-foreground">Dzaleka's history & stories</div>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground absolute top-2 right-2" />
              </Link>
            </Button>
            <Button variant="outline" className={dashboardActionCardClass} asChild>
              <a href="https://services.dzaleka.com" target="_blank" rel="noopener noreferrer">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="font-medium">Dzaleka Online Services</div>
                  <div className="text-xs text-muted-foreground">Services and community updates</div>
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
    case "transport_partner":
      return <Redirect to="/transport-partner/dashboard" />;
    case "visitor":
    default:
      return <VisitorDashboard />;
  }
}
