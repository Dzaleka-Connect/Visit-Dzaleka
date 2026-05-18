import { type ReactNode } from "react";
import { Link, useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SEO } from "@/components/seo";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, formatTime } from "@/lib/constants";
import {
  Accessibility,
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Play,
  User,
  UserX,
  Users,
} from "lucide-react";
import type {
  Booking,
  Guide,
  MeetingPoint,
  PointOfInterest,
  TransportPartner,
  TransportRequest,
  Zone,
} from "@shared/schema";

type PublicTransportPartner = Pick<
  TransportPartner,
  "id" | "companyName" | "contactName" | "email" | "phone" | "whatsapp" | "baseLocation" | "preferredContactMethod" | "serviceAreas" | "publicNotes"
>;

type TransportRequestSummary = Pick<
  TransportRequest,
  | "id"
  | "bookingId"
  | "partnerId"
  | "route"
  | "pickupLocation"
  | "notes"
  | "status"
  | "quotedAmount"
  | "currency"
  | "quoteSentAt"
  | "quoteDecision"
  | "quoteDecisionAt"
  | "quoteDecisionNotes"
  | "estimatedPickupTime"
  | "requestedPickupTime"
  | "requestedVisitDate"
  | "rescheduleNotes"
  | "driverName"
  | "driverPhone"
  | "vehicleDetails"
  | "partnerNotes"
  | "cancellationReason"
  | "cancelledAt"
  | "partnerRespondedAt"
  | "createdAt"
  | "updatedAt"
> & {
  partner?: PublicTransportPartner | null;
};

type GuideBookingDetails = Booking & {
  guide?: Guide | null;
  meetingPoint?: MeetingPoint | null;
  transportRequest?: TransportRequestSummary | null;
};

type DetailItemProps = {
  label: string;
  value?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
};

function humanize(value?: string | null) {
  if (!value) return "Not provided";
  return value
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatOptionalTime(value?: string | Date | null) {
  if (!value) return null;
  return formatTime(value);
}

function formatOptionalDate(value?: string | Date | null) {
  if (!value) return null;
  return formatDate(value);
}

function DetailItem({ label, value, icon: Icon }: DetailItemProps) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div className="min-w-0 space-y-1 rounded-md border bg-background p-3">
      <dt className="flex min-w-0 items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
        <span className="break-words">{label}</span>
      </dt>
      <dd className="min-w-0 break-words text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
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

export default function GuideTourDetails() {
  const [, params] = useRoute("/my-tours/:bookingId");
  const bookingId = params?.bookingId;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: booking,
    isLoading,
    error,
  } = useQuery<GuideBookingDetails>({
    queryKey: [`/api/bookings/${bookingId || ""}`],
    enabled: Boolean(bookingId),
  });

  const { data: zones = [] } = useQuery<Zone[]>({
    queryKey: ["/api/zones"],
  });

  const { data: pointsOfInterest = [] } = useQuery<PointOfInterest[]>({
    queryKey: ["/api/points-of-interest"],
  });

  const invalidateBooking = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/guides/me/tours"] });
    if (bookingId) {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}`] });
    }
  };

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/bookings/${bookingId}/guide-check-in`);
      return response.json();
    },
    onSuccess: () => {
      invalidateBooking();
      toast({ title: "Visitor checked in", description: "The tour is now in progress." });
    },
    onError: (mutationError: Error) => {
      toast({ title: "Check-in failed", description: mutationError.message, variant: "destructive" });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/bookings/${bookingId}/guide-check-out`);
      return response.json();
    },
    onSuccess: () => {
      invalidateBooking();
      queryClient.invalidateQueries({ queryKey: ["/api/guides/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guides/me/earnings"] });
      toast({ title: "Tour completed", description: "The visitor has been checked out." });
    },
    onError: (mutationError: Error) => {
      toast({ title: "Check-out failed", description: mutationError.message, variant: "destructive" });
    },
  });

  const noShowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/bookings/${bookingId}/guide-no-show`);
      return response.json();
    },
    onSuccess: () => {
      invalidateBooking();
      toast({ title: "Marked as no-show", description: "The visitor has been marked as a no-show." });
    },
    onError: (mutationError: Error) => {
      toast({ title: "No-show failed", description: mutationError.message, variant: "destructive" });
    },
  });

  const getZoneName = (zoneId: string) => zones.find((zone) => zone.id === zoneId)?.name || humanize(zoneId);
  const getInterestName = (interestId: string) =>
    pointsOfInterest.find((interest) => interest.id === interestId)?.name || humanize(interestId);

  if (!bookingId) {
    return (
      <PageContainer className="page-spacing overflow-x-hidden">
        <EmptyState icon={FileText} title="Tour not found" description="This assigned tour could not be opened." />
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
        <SEO title="Tour Details" description="View assigned tour details." />
        <PageHeader
          title="Tour details unavailable"
          description="This booking may no longer be assigned to you, or the details could not be loaded."
          actions={
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/my-tours">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to My Tours
              </Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const transport = booking.transportRequest;
  const peopleCount = booking.numberOfPeople || 1;
  const hasPreferences = (booking.selectedZones?.length || 0) > 0 || (booking.selectedInterests?.length || 0) > 0;

  return (
    <PageContainer className="page-spacing overflow-x-hidden">
      <SEO
        title={`${booking.visitorName} - Assigned Tour`}
        description="Visitor and booking details for an assigned guide tour."
        robots="noindex"
      />

      <PageHeader
        title="Visitor and booking details"
        description={`${booking.bookingReference || "Assigned booking"} - ${formatDate(booking.visitDate)} at ${formatTime(booking.visitTime)}`}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/my-tours">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            {booking.visitorEmail && (
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <a href={`mailto:${booking.visitorEmail}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </a>
              </Button>
            )}
            {booking.visitorPhone && (
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <a href={`tel:${booking.visitorPhone}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call
                </a>
              </Button>
            )}
          </div>
        }
      />

      <div className="rounded-md border bg-muted/40 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={booking.status || "pending"} />
              {booking.paymentStatus && (
                <Badge variant={booking.paymentStatus === "paid" ? "default" : "secondary"}>
                  {humanize(booking.paymentStatus)}
                </Badge>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-semibold tracking-tight">{booking.visitorName}</h1>
              <p className="break-words text-sm text-muted-foreground">
                {booking.visitorOrganization || "Individual visitor"}
                {booking.visitorCountry ? ` - ${booking.visitorCountry}` : ""}
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[360px]">
            <div className="rounded-md border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Date</p>
              <p className="break-words text-sm font-medium">{formatDate(booking.visitDate)}</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Time</p>
              <p className="break-words text-sm font-medium">{formatTime(booking.visitTime)}</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Visitors</p>
              <p className="break-words text-sm font-medium">
                {peopleCount} {peopleCount === 1 ? "person" : "people"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="min-w-0 space-y-6">
          <DetailSection title="Visitor">
            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Name" icon={User} value={booking.visitorName} />
              <DetailItem label="Country" icon={Globe2} value={booking.visitorCountry || "Not provided"} />
              <DetailItem
                label="Email"
                icon={Mail}
                value={
                  <a className="break-all text-primary underline-offset-4 hover:underline" href={`mailto:${booking.visitorEmail}`}>
                    {booking.visitorEmail}
                  </a>
                }
              />
              <DetailItem
                label="Phone"
                icon={Phone}
                value={
                  <a className="break-all text-primary underline-offset-4 hover:underline" href={`tel:${booking.visitorPhone}`}>
                    {booking.visitorPhone}
                  </a>
                }
              />
              <DetailItem label="Organization" icon={BadgeCheck} value={booking.visitorOrganization || "Individual visitor"} />
              <DetailItem label="Referral source" icon={MessageSquare} value={booking.referralSource || "Not provided"} />
            </dl>
          </DetailSection>

          <DetailSection title="Tour Plan">
            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Visit date" icon={Calendar} value={formatDate(booking.visitDate)} />
              <DetailItem label="Start time" icon={Clock} value={formatTime(booking.visitTime)} />
              <DetailItem label="Group size" icon={Users} value={humanize(booking.groupSize)} />
              <DetailItem
                label="Number of people"
                icon={Users}
                value={`${peopleCount} ${peopleCount === 1 ? "person" : "people"}`}
              />
              <DetailItem
                label="Tour type"
                icon={MapPin}
                value={`${humanize(booking.tourType)}${booking.customDuration ? ` - ${booking.customDuration} hours` : ""}`}
              />
              <DetailItem label="Booking reference" icon={FileText} value={booking.bookingReference || "Not provided"} />
            </dl>
          </DetailSection>

          <DetailSection title="Meeting Point">
            {booking.meetingPoint ? (
              <div className="rounded-md border bg-background p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0 space-y-2">
                    <h3 className="break-words text-sm font-semibold">{booking.meetingPoint.name}</h3>
                    {booking.meetingPoint.address && (
                      <p className="break-words text-sm text-muted-foreground">{booking.meetingPoint.address}</p>
                    )}
                    {booking.meetingPoint.meetingInstructions && (
                      <p className="break-words text-sm">{booking.meetingPoint.meetingInstructions}</p>
                    )}
                    {booking.meetingPoint.googleMapsUrl && (
                      <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                        <a href={booking.meetingPoint.googleMapsUrl} target="_blank" rel="noreferrer">
                          <Navigation className="mr-2 h-4 w-4" />
                          Open in Google Maps
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No meeting point has been linked to this booking.
              </div>
            )}
          </DetailSection>

          <DetailSection title="Preferences and Needs">
            <dl className="grid gap-3">
              {hasPreferences && (
                <>
                  {(booking.selectedZones?.length || 0) > 0 && (
                    <DetailItem
                      label="Selected zones"
                      icon={Navigation}
                      value={<BadgeList values={booking.selectedZones} getLabel={getZoneName} />}
                    />
                  )}
                  {(booking.selectedInterests?.length || 0) > 0 && (
                    <DetailItem
                      label="Selected interests"
                      icon={MapPin}
                      value={<BadgeList values={booking.selectedInterests} getLabel={getInterestName} />}
                    />
                  )}
                </>
              )}
              <DetailItem label="Special requests" icon={MessageSquare} value={booking.specialRequests || "None shared"} />
              <DetailItem label="Accessibility needs" icon={Accessibility} value={booking.accessibilityNeeds || "None shared"} />
            </dl>
          </DetailSection>
        </div>

        <aside className="min-w-0 space-y-6">
          <DetailSection title="Guide Actions">
            <div className="rounded-md border bg-background p-4">
              {booking.status === "confirmed" && (
                <div className="grid gap-2">
                  <Button
                    type="button"
                    onClick={() => checkInMutation.mutate()}
                    disabled={checkInMutation.isPending || noShowMutation.isPending}
                    className="w-full"
                  >
                    {checkInMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    Check in visitor
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => noShowMutation.mutate()}
                    disabled={checkInMutation.isPending || noShowMutation.isPending}
                    className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    {noShowMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserX className="mr-2 h-4 w-4" />
                    )}
                    Mark no-show
                  </Button>
                </div>
              )}
              {booking.status === "in_progress" && (
                <Button
                  type="button"
                  onClick={() => checkOutMutation.mutate()}
                  disabled={checkOutMutation.isPending}
                  className="w-full"
                >
                  {checkOutMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Check out visitor
                </Button>
              )}
              {booking.status === "completed" && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" aria-hidden="true" />
                  <p className="break-words">This tour has been completed. Submit or update the post-tour report from My Tours.</p>
                </div>
              )}
              {!["confirmed", "in_progress", "completed"].includes(booking.status || "") && (
                <p className="break-words text-sm text-muted-foreground">
                  No guide action is available while this booking is {humanize(booking.status)}.
                </p>
              )}
            </div>
          </DetailSection>

          <DetailSection title="Transport">
            {transport ? (
              <dl className="grid gap-3">
                <DetailItem label="Transport status" icon={Car} value={humanize(transport.status)} />
                <DetailItem label="Partner" icon={BadgeCheck} value={transport.partner?.companyName || "Not assigned"} />
                <DetailItem label="Route" icon={Navigation} value={humanize(transport.route)} />
                <DetailItem label="Pickup location" icon={MapPin} value={transport.pickupLocation || "Not provided"} />
                <DetailItem label="Requested pickup" icon={Clock} value={formatOptionalTime(transport.requestedPickupTime) || "Not provided"} />
                <DetailItem label="Estimated pickup" icon={Clock} value={formatOptionalTime(transport.estimatedPickupTime) || "Not provided"} />
                <DetailItem label="Requested date" icon={Calendar} value={formatOptionalDate(transport.requestedVisitDate) || "Same as tour date"} />
                <DetailItem
                  label="Quoted amount"
                  icon={CreditCard}
                  value={
                    transport.quotedAmount != null
                      ? formatCurrency(transport.quotedAmount, transport.currency || "MWK")
                      : "Not quoted"
                  }
                />
                <DetailItem label="Driver" icon={User} value={transport.driverName || "Not assigned"} />
                <DetailItem
                  label="Driver phone"
                  icon={Phone}
                  value={
                    transport.driverPhone ? (
                      <a className="break-all text-primary underline-offset-4 hover:underline" href={`tel:${transport.driverPhone}`}>
                        {transport.driverPhone}
                      </a>
                    ) : (
                      "Not provided"
                    )
                  }
                />
                <DetailItem label="Vehicle" icon={Car} value={transport.vehicleDetails || "Not provided"} />
                <DetailItem label="Partner notes" icon={MessageSquare} value={transport.partnerNotes || "None shared"} />
              </dl>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No transport request is linked to this assigned booking.
              </div>
            )}
          </DetailSection>
        </aside>
      </div>
    </PageContainer>
  );
}
