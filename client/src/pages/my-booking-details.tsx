import { type ReactNode } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SEO } from "@/components/seo";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentStatusBadge, StatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, formatTime } from "@/lib/constants";
import {
  Accessibility,
  Activity,
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Globe2,
  Loader2,
  Mail,
  MailCheck,
  MapPin,
  MessageSquare,
  Phone,
  Ticket,
  User,
  UserCheck,
  Users,
  Utensils,
} from "lucide-react";
import type { Booking, MeetingPoint, PointOfInterest, Zone } from "@shared/schema";

type VisitorGuideSummary = {
  id: string;
  userId?: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  profileImageUrl: string | null;
  languages: string[] | null;
  bio: string | null;
  specialties: string[] | null;
  rating: number | null;
};

type VisitorTransportPartnerProfile = {
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
};

type VisitorTransportRequest = {
  id: string;
  bookingId: string | null;
  partnerId: string | null;
  route: string | null;
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
};

type VisitorBookingDetails = Booking & {
  guide?: VisitorGuideSummary | null;
  meetingPoint?: MeetingPoint | null;
  transportRequest?: VisitorTransportRequest | null;
};

type TimelineEvent = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  occurredAt: string | Date | null;
  status?: string | null;
};

type MessageContactResponse = {
  room: { id: string };
  target: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string | null;
  };
};

function humanize(value?: string | null) {
  if (!value) return "Not provided";
  return value
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatOptionalTime(value?: string | null) {
  return value ? formatTime(value) : null;
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase() || "G";
}

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div className="min-w-0 rounded-md border bg-background p-3">
      <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
        <span className="break-words">{label}</span>
      </dt>
      <dd className="mt-1 min-w-0 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

function BadgeList({ values, getLabel }: { values?: string[] | null; getLabel: (value: string) => string }) {
  if (!values || values.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge key={value} variant="secondary" className="max-w-full whitespace-normal break-words text-left">
          {getLabel(value)}
        </Badge>
      ))}
    </div>
  );
}

function getTimelineIcon(type: string) {
  if (type.includes("email")) return MailCheck;
  if (type.includes("transport")) return Car;
  if (type.includes("guide") || type.includes("assigned")) return UserCheck;
  if (type.includes("payment")) return CreditCard;
  if (type.includes("created")) return Ticket;
  if (type.includes("completed") || type.includes("check")) return CheckCircle2;
  return Activity;
}

export default function MyBookingDetails() {
  const [, params] = useRoute("/my-bookings/:bookingId");
  const bookingId = params?.bookingId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const {
    data: booking,
    isLoading,
    error,
  } = useQuery<VisitorBookingDetails>({
    queryKey: [`/api/bookings/${bookingId || ""}`],
    enabled: Boolean(bookingId),
  });

  const { data: timeline = [], isLoading: timelineLoading } = useQuery<TimelineEvent[]>({
    queryKey: [`/api/bookings/${bookingId || ""}/visitor-timeline`],
    enabled: Boolean(bookingId),
  });

  const { data: zones = [] } = useQuery<Zone[]>({
    queryKey: ["/api/public/zones"],
  });

  const { data: pointsOfInterest = [] } = useQuery<PointOfInterest[]>({
    queryKey: ["/api/public/points-of-interest"],
  });

  const openMessageMutation = useMutation({
    mutationFn: async (target: "admin" | "guide") => {
      const response = await apiRequest("POST", `/api/bookings/${bookingId}/message-contact`, { target });
      return response.json() as Promise<MessageContactResponse>;
    },
    onSuccess: (data) => {
      const bookingReference = encodeURIComponent(booking?.bookingReference || booking?.id || "");
      setLocation(`/messages?room=${data.room.id}&booking=${bookingReference}`);
    },
    onError: (mutationError: Error) => {
      toast({
        title: "Message could not be opened",
        description: mutationError.message,
        variant: "destructive",
      });
    },
  });

  const getZoneName = (zoneId: string) => zones.find((zone) => zone.id === zoneId)?.name || humanize(zoneId);
  const getInterestName = (interestId: string) =>
    pointsOfInterest.find((point) => point.id === interestId)?.name || humanize(interestId);

  if (!bookingId) {
    return (
      <PageContainer className="page-spacing overflow-x-hidden">
        <EmptyState icon={FileText} title="Booking not found" description="This booking could not be opened." />
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer className="page-spacing overflow-x-hidden">
        <div className="flex min-h-[360px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  if (error || !booking) {
    return (
      <PageContainer className="page-spacing overflow-x-hidden">
        <SEO title="Booking Details" description="View your Visit Dzaleka booking details." robots="noindex" />
        <PageHeader
          title="Booking details unavailable"
          description="This booking may no longer be linked to your account, or it could not be loaded."
          actions={
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/my-bookings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to bookings
              </Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const guide = booking.guide;
  const transport = booking.transportRequest;
  const meetingPointName = booking.meetingPoint?.name || humanize(booking.meetingPointId);
  const peopleCount = booking.numberOfPeople || 1;
  const hasNeeds =
    Boolean(booking.accessibilityNeeds) ||
    Boolean(booking.specialRequests) ||
    Boolean((booking as any).dietaryNotes);

  return (
    <PageContainer className="page-spacing overflow-x-hidden">
      <SEO
        title={`${booking.bookingReference || "Booking"} | Your Booking`}
        description="View your Visit Dzaleka booking details, guide, transport, timeline, and messages."
        robots="noindex"
      />

      <PageHeader
        title="Booking details"
        description={`${booking.bookingReference || "Booking request"} - ${formatDate(booking.visitDate)} at ${formatTime(booking.visitTime)}`}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/my-bookings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => openMessageMutation.mutate("admin")}
              disabled={openMessageMutation.isPending}
            >
              {openMessageMutation.isPending && openMessageMutation.variables === "admin" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="mr-2 h-4 w-4" />
              )}
              Message Visit Dzaleka
            </Button>
            {guide && (
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => openMessageMutation.mutate("guide")}
                disabled={openMessageMutation.isPending}
              >
                {openMessageMutation.isPending && openMessageMutation.variables === "guide" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="mr-2 h-4 w-4" />
                )}
                Message guide
              </Button>
            )}
          </div>
        }
      />

      <section className="rounded-md border bg-muted/40 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={booking.status || "pending"} />
              <PaymentStatusBadge status={booking.paymentStatus || "pending"} />
              {booking.bookingReference && (
                <Badge variant="outline" className="max-w-full break-all">
                  {booking.bookingReference}
                </Badge>
              )}
            </div>
            <div>
              <h1 className="break-words text-2xl font-semibold tracking-tight">{booking.tourType ? humanize(booking.tourType) : "Dzaleka tour"}</h1>
              <p className="break-words text-sm text-muted-foreground">
                {formatDate(booking.visitDate)} at {formatTime(booking.visitTime)}
              </p>
            </div>
          </div>

          <dl className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
            <DetailItem label="Visitors" value={`${peopleCount} ${peopleCount === 1 ? "person" : "people"}`} icon={Users} />
            <DetailItem label="Meeting point" value={meetingPointName} icon={MapPin} />
            <DetailItem label="Total" value={formatCurrency(Number(booking.totalAmount || 0))} icon={CreditCard} />
          </dl>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Visit</CardTitle>
              <CardDescription>Core details for this booking.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailItem label="Visitor name" value={booking.visitorName} icon={User} />
                <DetailItem label="Country" value={booking.visitorCountry || "Not provided"} icon={Globe2} />
                <DetailItem label="Email" value={<span className="break-all">{booking.visitorEmail}</span>} icon={Mail} />
                <DetailItem label="Phone" value={booking.visitorPhone || "Not provided"} icon={Phone} />
                <DetailItem label="Date" value={formatDate(booking.visitDate)} icon={Calendar} />
                <DetailItem label="Time" value={formatTime(booking.visitTime)} icon={Clock} />
              </dl>

              {(booking.selectedZones?.length || booking.selectedInterests?.length) ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="min-w-0 space-y-2">
                    <h2 className="text-sm font-semibold">Selected areas</h2>
                    <BadgeList values={booking.selectedZones || []} getLabel={getZoneName} />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <h2 className="text-sm font-semibold">Interests</h2>
                    <BadgeList values={booking.selectedInterests || []} getLabel={getInterestName} />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Guide</CardTitle>
              <CardDescription>Your assigned guide appears here once confirmed.</CardDescription>
            </CardHeader>
            <CardContent>
              {guide ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <Avatar className="h-16 w-16 shrink-0">
                    <AvatarImage src={guide.profileImageUrl || undefined} alt={`${guide.firstName} ${guide.lastName}`} />
                    <AvatarFallback>{getInitials(guide.firstName, guide.lastName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <h2 className="break-words text-lg font-semibold">{guide.firstName} {guide.lastName}</h2>
                      {guide.bio && <p className="mt-1 break-words text-sm text-muted-foreground">{guide.bio}</p>}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailItem label="Phone" value={guide.phone || "Shared after confirmation"} icon={Phone} />
                      <DetailItem label="Rating" value={guide.rating ? `${guide.rating}/5` : "New guide"} icon={BadgeCheck} />
                    </div>
                    <BadgeList values={guide.languages || []} getLabel={humanize} />
                    <BadgeList values={guide.specialties || []} getLabel={humanize} />
                  </div>
                </div>
              ) : (
                <EmptyState icon={UserCheck} title="Guide not assigned yet" description="Our team will assign a guide and update this booking." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transport</CardTitle>
              <CardDescription>Transport depends on partner availability and is confirmed separately.</CardDescription>
            </CardHeader>
            <CardContent>
              {transport ? (
                <dl className="grid gap-3 sm:grid-cols-2">
                  <DetailItem label="Status" value={humanize(transport.status)} icon={Car} />
                  <DetailItem label="Partner" value={transport.partner?.companyName || "Awaiting partner"} icon={UserCheck} />
                  <DetailItem label="Pickup" value={transport.pickupLocation || "Not provided"} icon={MapPin} />
                  <DetailItem label="Requested pickup time" value={formatOptionalTime(transport.requestedPickupTime) || "Not set"} icon={Clock} />
                  <DetailItem
                    label="Quote"
                    value={transport.quotedAmount != null ? formatCurrency(Number(transport.quotedAmount), transport.currency || "MWK") : "Not quoted yet"}
                    icon={CreditCard}
                  />
                  <DetailItem label="Quote decision" value={humanize(transport.quoteDecision)} icon={CheckCircle2} />
                  <DetailItem label="Driver" value={transport.driverName || "Not assigned yet"} icon={User} />
                  <DetailItem label="Driver phone" value={transport.driverPhone || "Not shared yet"} icon={Phone} />
                  <DetailItem label="Vehicle" value={transport.vehicleDetails || "Not shared yet"} icon={Car} />
                  <DetailItem label="Partner notes" value={transport.partnerNotes || transport.notes || "No notes"} icon={FileText} />
                </dl>
              ) : (
                <EmptyState icon={Car} title="No transport request" description="Transport can be requested from your booking form when needed." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes And Needs</CardTitle>
              <CardDescription>Preparation details linked to this booking.</CardDescription>
            </CardHeader>
            <CardContent>
              {hasNeeds ? (
                <dl className="grid gap-3 sm:grid-cols-2">
                  <DetailItem label="Accessibility" value={booking.accessibilityNeeds || "Not provided"} icon={Accessibility} />
                  <DetailItem label="Dietary notes" value={(booking as any).dietaryNotes || "Not provided"} icon={Utensils} />
                  <DetailItem label="Special requests" value={booking.specialRequests || "Not provided"} icon={FileText} />
                </dl>
              ) : (
                <EmptyState icon={Accessibility} title="No special notes yet" description="Add any important details by messaging Visit Dzaleka from this booking." />
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment</CardTitle>
              <CardDescription>Current payment state for this booking.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3">
                <DetailItem label="Payment status" value={humanize(booking.paymentStatus)} icon={CreditCard} />
                <DetailItem label="Payment method" value={humanize(booking.paymentMethod)} icon={CreditCard} />
                <DetailItem label="Reference" value={booking.paymentReference || "Not reported"} icon={Ticket} />
                <DetailItem label="Total amount" value={formatCurrency(Number(booking.totalAmount || 0))} icon={CreditCard} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Booking Timeline</CardTitle>
              <CardDescription>Key updates for this booking.</CardDescription>
            </CardHeader>
            <CardContent>
              {timelineLoading ? (
                <div className="flex min-h-36 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : timeline.length > 0 ? (
                <ol className="space-y-4">
                  {timeline.map((event) => {
                    const Icon = getTimelineIcon(event.type);
                    return (
                      <li key={event.id} className="flex gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <p className="break-words text-sm font-medium">{event.title}</p>
                            {event.status && (
                              <Badge variant="outline" className="w-fit max-w-full break-words text-[10px]">
                                {humanize(event.status)}
                              </Badge>
                            )}
                          </div>
                          {event.description && (
                            <p className="mt-1 break-words text-xs text-muted-foreground">{event.description}</p>
                          )}
                          <time className="mt-1 block text-xs text-muted-foreground">
                            {formatDateTime(event.occurredAt)}
                          </time>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <EmptyState icon={Activity} title="No updates yet" description="Booking updates will appear here as they happen." />
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
