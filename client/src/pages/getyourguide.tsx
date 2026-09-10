import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Globe,
  RefreshCw,
  Search,
  Settings2,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation, useSearch } from "wouter";
import { SEO } from "@/components/seo";
import { apiRequest } from "@/lib/queryClient";

interface GetYourGuideBooking {
  id: string;
  bookingReference: string;
  numberOfPeople: number;
  visitDate: string;
  externalReferenceId: string | null;
  tourType: string;
  status: string;
  createdAt: string;
  visitorEmail: string | null;
}

interface SelfTestCombination {
  key: string;
  label: string;
  productId: string;
  byCategoryProductId?: string;
  status: string;
  timeAvailable: string;
  priceSetup: string;
  sampleTimes?: string[];
  samplePrice?: number;
  currency?: string;
}

interface MandatoryEndpoint {
  name: string;
  status: string;
  detail: string;
}

interface GetYourGuideSelfTestReadiness {
  productId: string;
  persistenceReady: boolean;
  activity: {
    lastAvailabilityRequest: string | null;
    lastBookingRequest: string | null;
    lastSuccessfulPush: string | null;
    lastFailedPush: string | null;
    lastFailedPushError: string | null;
    recent: Array<{
      endpoint: string;
      productId: string | null;
      success: boolean;
      errorCode: string | null;
      diagnostic: boolean;
      createdAt: string;
    }>;
  } | null;
  activityId: string;
  listingUrl: string;
  publicBaseUrl: string;
  webhookEndpoint: string;
  testingConfigurationBaseUrl: string;
  supplierApiBaseUrl: string;
  supplierId: string;
  credentialsConfigured: boolean;
  availabilityPushProductId: string | null;
  outboundCredentialsConfigured: boolean;
  availabilityPushConfigured: boolean;
  selfTestProductIds: Record<string, string>;
  productTimezone: string;
  recommendedSelfTests: SelfTestCombination[];
  suggestedAvailabilityWindow: {
    from: string;
    to: string;
    note: string;
  };
  suggestedUnavailableWindow: {
    from: string;
    to: string;
    note: string;
  };
  portalRules: string[];
  mandatoryEndpoints: MandatoryEndpoint[];
}

interface SyncAvailabilityResult {
  success: boolean;
  message: string;
  productId: string;
  availabilityCount: number;
  useSandbox: boolean;
}

function formatGygMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat(currency === "MWK" ? "en-MW" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(currency === "USD" ? amount / 100 : amount);
}

function readinessVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (
    status === "Ready to configure" ||
    status === "Admin push wired" ||
    status === "Wired"
  )
    return "default";
  if (status === "Partially wired") return "secondary";
  if (status === "Not wired yet") return "destructive";
  return "outline";
}

function dateLabel(value: string | null | undefined, includeTime = false) {
  if (!value) return "Not recorded";
  const date = new Date(
    value.length === 10 ? `${value}T12:00:00+02:00` : value,
  );
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    timeZone: "Africa/Blantyre",
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime ? ({ hour: "numeric", minute: "2-digit" } as const) : {}),
  }).format(date);
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={status === "cancelled" ? "destructive" : "outline"}
      className="capitalize"
    >
      {status.replaceAll("_", " ")}
    </Badge>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-4 py-2" role="status" aria-label="Loading data">
      {[1, 2, 3].map((row) => (
        <div key={row} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GetYourGuidePage() {
  const queryClient = useQueryClient();
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const tab = ["overview", "bookings", "setup"].includes(
    params.get("tab") || "",
  )
    ? params.get("tab")!
    : "overview";
  const filter = params.get("q") || "";
  const statusFilter = params.get("status") || "all";
  const [refreshing, setRefreshing] = useState(false);
  const setParams = (values: Record<string, string>, replace = false) => {
    const next = new URLSearchParams(search);
    Object.entries(values).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    navigate(`/getyourguide${next.size ? `?${next}` : ""}`, { replace });
  };
  const {
    data: bookings,
    isLoading,
    isError: bookingsError,
    refetch: reloadBookings,
  } = useQuery<GetYourGuideBooking[]>({
    queryKey: ["/api/bookings/channel/getyourguide"],
  });
  const {
    data: readiness,
    isLoading: readinessLoading,
    isError: readinessError,
    refetch: reloadReadiness,
  } = useQuery<GetYourGuideSelfTestReadiness>({
    queryKey: ["/api/getyourguide/self-test-readiness"],
    refetchInterval: 60000,
  });
  const syncMutation = useMutation<SyncAvailabilityResult, Error>({
    mutationFn: async () =>
      (
        await apiRequest("POST", "/api/getyourguide/sync-availability", {})
      ).json(),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/getyourguide/self-test-readiness"],
      });
    },
  });
  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([reloadBookings(), reloadReadiness()]);
    } finally {
      setRefreshing(false);
    }
  };
  const requestsObserved = Boolean(
    readiness?.activity?.lastAvailabilityRequest ||
    readiness?.activity?.lastBookingRequest,
  );
  const integrationLabel = readinessLoading
    ? "Checking…"
    : readinessError
      ? "Status unavailable"
      : !readiness?.credentialsConfigured || !readiness?.persistenceReady
        ? "Setup required"
        : requestsObserved
          ? "API requests observed"
          : "Awaiting API requests";
  const pushAccepted = Boolean(readiness?.activity?.lastSuccessfulPush);
  const lastFailedPush = readiness?.activity?.lastFailedPush;
  const lastFailedPushError = readiness?.activity?.lastFailedPushError;
  const pushRejected = !pushAccepted && Boolean(lastFailedPush);
  const syncDisabled =
    readinessError ||
    readinessLoading ||
    syncMutation.isPending ||
    !readiness?.persistenceReady ||
    !readiness?.outboundCredentialsConfigured ||
    !readiness?.availabilityPushConfigured;
  const syncHelp = !readiness?.persistenceReady
    ? "Reservation storage must be configured before syncing."
    : !readiness?.outboundCredentialsConfigured
      ? "Add outbound API credentials in deployment settings."
      : !readiness?.availabilityPushConfigured
        ? "Add the mapped availability product ID after connecting the product in GetYourGuide."
        : pushAccepted
          ? "Automatic refresh runs every 15 minutes after an accepted production push."
          : lastFailedPushError === "INVALID_PRODUCT"
            ? `GetYourGuide rejected product ${readiness?.availabilityPushProductId || "ID"}. Connect that supplier product ID to the live tour option in the supplier portal, then sync again. Sandbox accepts any ID; production only accepts a mapped product.`
            : pushRejected
              ? "The last production push was not accepted. Review the error, then try again."
              : "Send the first production sync after GetYourGuide confirms the product mapping.";
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Blantyre",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const upcoming = (bookings || []).filter(
    (b) =>
      b.visitDate.slice(0, 10) >= today &&
      !["cancelled", "completed", "no_show"].includes(b.status),
  );
  const filtered = (bookings || []).filter(
    (b) =>
      (statusFilter === "all" || b.status === statusFilter) &&
      [
        b.bookingReference,
        b.externalReferenceId,
        b.visitorEmail,
        b.tourType,
      ].some((value) =>
        value?.toLowerCase().includes(filter.toLowerCase().trim()),
      ),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const pageNumber = Math.min(
    pageCount,
    Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1),
  );
  const recent = readiness?.activity?.recent || [];
  const steps = [
    {
      label: "Receive reservations",
      ready: readiness?.credentialsConfigured && readiness?.persistenceReady,
      detail: "Supplier credentials and durable reservation storage.",
    },
    {
      label: "Verify the portal connection",
      ready: requestsObserved,
      detail:
        "Run certification and map your product in GetYourGuide. API traffic alone does not confirm production mapping.",
    },
    {
      label: "Start availability updates",
      ready: pushAccepted,
      detail: syncHelp,
    },
  ];
  const bookingRows = (rows: GetYourGuideBooking[]) => (
    <ul className="divide-y">
      {rows.map((booking) => (
        <li key={booking.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <Link
                href={`/bookings/${booking.id}`}
                className="inline-flex min-h-11 items-center gap-1 rounded-sm font-medium underline-offset-4 hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="break-all">
                  {booking.bookingReference || "View booking"}
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
              <p className="break-all text-xs text-muted-foreground">
                {booking.externalReferenceId || "No GetYourGuide reference"}
              </p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {dateLabel(booking.visitDate.slice(0, 10))}
            </span>
            <span className="inline-flex items-center gap-2 tabular-nums">
              <Users className="h-4 w-4" aria-hidden="true" />
              {booking.numberOfPeople}{" "}
              {booking.numberOfPeople === 1 ? "guest" : "guests"}
            </span>
            <span className="capitalize">
              {booking.tourType.replaceAll("_", " ")}
            </span>
          </div>
          {tab === "bookings" && (
            <p className="mt-2 break-all text-sm text-muted-foreground">
              {booking.visitorEmail || "Email unavailable"}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
  const emptyBookings = (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <CalendarDays
        className="mb-3 h-8 w-8 text-muted-foreground"
        aria-hidden="true"
      />
      <h3 className="font-semibold">No GetYourGuide bookings yet</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        New bookings appear after the supplier connection is active. Older
        supplier bookings need to be linked separately.
      </p>
      <Button
        variant="outline"
        className="mt-4 min-h-11"
        onClick={() => setParams({ tab: "setup" })}
      >
        Review connection setup
      </Button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-6 lg:p-8 [&_button]:touch-manipulation [&_a]:touch-manipulation">
      <SEO
        title="GetYourGuide Dashboard"
        description="Manage GetYourGuide bookings, availability, and connection activity."
      />
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300">
            <Globe className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Booking channels
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              GetYourGuide
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="min-h-11"
            onClick={refresh}
            disabled={refreshing}
            aria-busy={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`}
              aria-hidden="true"
            />
            Refresh
          </Button>
          <Button variant="outline" className="min-h-11" asChild>
            <a
              href="https://supplier.getyourguide.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Supplier portal
              <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </header>

      <section
        aria-label="Connection summary"
        className="overflow-hidden rounded-xl border bg-card shadow-sm"
      >
        <div className="flex flex-col justify-between gap-4 border-b px-5 py-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">Channel status</h2>
              <Badge variant="outline" aria-live="polite" className="gap-1.5">
                {requestsObserved ? (
                  <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {integrationLabel}
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {readinessError
                ? "Connection details could not be loaded. Refresh to try again."
                : requestsObserved
                  ? "Requests are reaching your API. Check the supplier portal to confirm the product is connected."
                  : "Finish portal certification and connect your product to receive new reservations."}
            </p>
          </div>
          <Button
            className="min-h-11 shrink-0"
            variant="secondary"
            onClick={() => setParams({ tab: "setup" })}
          >
            <Settings2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Connection setup
          </Button>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-3">
          {[
            {
              label: "Upcoming bookings",
              value:
                isLoading || bookingsError
                  ? "—"
                  : upcoming.length.toLocaleString(),
              detail: "From the latest 50 channel bookings",
            },
            {
              label: "Expected guests",
              value:
                isLoading || bookingsError
                  ? "—"
                  : upcoming
                      .reduce((sum, b) => sum + b.numberOfPeople, 0)
                      .toLocaleString(),
              detail: "Across those upcoming bookings",
            },
            {
              label: "Last accepted sync",
              value:
                readinessError || readinessLoading
                  ? "—"
                  : pushAccepted
                    ? dateLabel(readiness?.activity?.lastSuccessfulPush)
                    : pushRejected
                      ? "Last sync failed"
                      : "Not yet synced",
              detail: pushAccepted
                ? dateLabel(readiness?.activity?.lastSuccessfulPush, true) +
                  " · Malawi time"
                : pushRejected
                  ? `${lastFailedPushError || "SYNC_FAILED"} · ${dateLabel(lastFailedPush, true)}`
                  : "Production availability updates",
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="min-w-0 px-5 py-4 first:border-r last:col-span-2 last:border-t sm:last:col-span-1 sm:last:border-l sm:last:border-t-0"
            >
              <dt className="min-h-10 text-sm text-muted-foreground sm:min-h-0">
                {metric.label}
              </dt>
              <dd className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                {metric.value}
              </dd>
              <p className="mt-1 text-xs text-muted-foreground">
                {metric.detail}
              </p>
            </div>
          ))}
        </dl>
      </section>

      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value })}>
        <TabsList
          className="mb-4 grid h-auto w-full grid-cols-3 sm:w-fit"
          aria-label="GetYourGuide dashboard sections"
        >
          <TabsTrigger value="overview" className="min-h-11">
            Overview
          </TabsTrigger>
          <TabsTrigger value="bookings" className="min-h-11">
            Bookings
          </TabsTrigger>
          <TabsTrigger value="setup" className="min-h-11">
            Setup & testing
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Card className="min-w-0">
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    Recent bookings
                  </h2>
                  <CardDescription className="mt-1">
                    Your latest reservations and linked bookings.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  className="min-h-11 shrink-0"
                  onClick={() => setParams({ tab: "bookings" })}
                >
                  View all
                  <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingRows />
                ) : bookingsError ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Could not load bookings.
                      <Button
                        variant="outline"
                        className="ml-2 min-h-11"
                        onClick={() => reloadBookings()}
                      >
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : bookings?.length ? (
                  bookingRows(bookings.slice(0, 4))
                ) : (
                  emptyBookings
                )}
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader>
                <h2 className="text-lg font-semibold tracking-tight">
                  Availability sync
                </h2>
                <CardDescription>
                  Keep bookable spaces up to date on GetYourGuide.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {pushAccepted
                      ? "Automatic updates started"
                      : pushRejected
                        ? "Production sync rejected"
                        : "First production sync pending"}
                  </div>
                  <p
                    id="sync-help"
                    className="mt-2 text-sm text-muted-foreground"
                  >
                    {syncHelp}
                  </p>
                </div>
                <Button
                  className="min-h-11 w-full"
                  disabled={syncDisabled}
                  onClick={() => syncMutation.mutate()}
                  aria-describedby="sync-help"
                  aria-busy={syncMutation.isPending}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin motion-reduce:animate-none" : ""}`}
                    aria-hidden="true"
                  />
                  Sync availability
                </Button>
                <div aria-live="polite">
                  {syncMutation.isSuccess && (
                    <p className="flex gap-2 break-words text-sm">
                      <CheckCircle2
                        className="h-4 w-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      {syncMutation.data.message} ·{" "}
                      {syncMutation.data.availabilityCount.toLocaleString()}{" "}
                      records.
                    </p>
                  )}
                  {syncMutation.isError && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {syncMutation.error.message}
                      </AlertDescription>
                    </Alert>
                  )}
                  {!syncMutation.isError && pushRejected && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {lastFailedPushError === "INVALID_PRODUCT"
                          ? `GetYourGuide does not have an active product mapped to ${readiness?.availabilityPushProductId}.`
                          : `Last production push failed${lastFailedPushError ? ` (${lastFailedPushError})` : ""}.`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold tracking-tight">
                API activity
              </h2>
              <CardDescription>
                Recent authenticated requests. Diagnostic and sandbox traffic is
                labeled separately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {readinessLoading ? (
                <LoadingRows />
              ) : readinessError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Activity could not be loaded.
                    <Button
                      variant="outline"
                      className="ml-2 min-h-11"
                      onClick={() => reloadReadiness()}
                    >
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : !recent.length ? (
                <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  {readiness?.persistenceReady
                    ? "No requests recorded yet. Run the connection tests from Setup & testing."
                    : "Activity will appear after reservation storage is configured."}
                </div>
              ) : (
                <ul className="divide-y">
                  {recent.slice(0, 8).map((event, index) => (
                    <li
                      key={`${event.createdAt}-${index}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="mt-1 shrink-0">
                          {event.success ? (
                            <CheckCircle2
                              className="h-4 w-4 text-primary"
                              aria-hidden="true"
                            />
                          ) : (
                            <XCircle
                              className="h-4 w-4 text-destructive"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="break-all font-mono text-sm">
                            {event.endpoint}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {dateLabel(event.createdAt, true)} · Malawi time
                            {event.diagnostic ? " · Diagnostic / sandbox" : ""}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={event.success ? "outline" : "destructive"}
                        className="max-w-full whitespace-normal break-all"
                      >
                        {event.success
                          ? "Succeeded"
                          : event.errorCode || "Failed"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold tracking-tight">
                Channel bookings
              </h2>
              <CardDescription>
                Latest 50 bookings attributed to GetYourGuide, including
                manually linked reservations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="gyg-search"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Search bookings
                  </label>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="gyg-search"
                      name="q"
                      type="search"
                      autoComplete="off"
                      placeholder="Reference or email…"
                      className="min-h-11 pl-9 text-base"
                      value={filter}
                      onChange={(event) =>
                        setParams({ q: event.target.value, page: "" }, true)
                      }
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="gyg-status"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Status
                  </label>
                  <select
                    id="gyg-status"
                    name="status"
                    value={statusFilter}
                    onChange={(event) =>
                      setParams({ status: event.target.value, page: "" })
                    }
                    className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:w-44"
                  >
                    {[
                      "all",
                      "pending",
                      "confirmed",
                      "completed",
                      "cancelled",
                      "no_show",
                    ].map((status) => (
                      <option key={status} value={status}>
                        {status === "all"
                          ? "All statuses"
                          : status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {isLoading ? (
                <LoadingRows />
              ) : bookingsError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Could not load bookings.
                    <Button
                      className="ml-2 min-h-11"
                      variant="outline"
                      onClick={() => reloadBookings()}
                    >
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : !bookings?.length ? (
                emptyBookings
              ) : !filtered.length ? (
                <div className="py-8 text-center">
                  <p className="font-medium">No matching bookings</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try a different reference, email, or status.
                  </p>
                  <Button
                    className="mt-3 min-h-11"
                    variant="outline"
                    onClick={() => setParams({ q: "", status: "", page: "" })}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <>
                  {bookingRows(
                    filtered.slice((pageNumber - 1) * 10, pageNumber * 10),
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <p
                      className="text-sm tabular-nums text-muted-foreground"
                      aria-live="polite"
                    >
                      {filtered.length} bookings · Page {pageNumber} of{" "}
                      {pageCount}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="min-h-11"
                        disabled={pageNumber === 1}
                        onClick={() =>
                          setParams({ page: String(pageNumber - 1) })
                        }
                      >
                        <ChevronLeft
                          className="mr-1 h-4 w-4"
                          aria-hidden="true"
                        />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        className="min-h-11"
                        disabled={pageNumber === pageCount}
                        onClick={() =>
                          setParams({ page: String(pageNumber + 1) })
                        }
                      >
                        Next
                        <ChevronRight
                          className="ml-1 h-4 w-4"
                          aria-hidden="true"
                        />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Connection checklist
                </h2>
                <CardDescription className="mt-1">
                  Finish these steps in order to receive bookings.
                </CardDescription>
              </div>
              <Button variant="outline" className="min-h-11" asChild>
                <a
                  href="https://integrator.getyourguide.com/setup"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Integrator portal
                  <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              {readinessLoading ? (
                <LoadingRows />
              ) : readinessError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Setup status could not be loaded.
                    <Button
                      variant="outline"
                      className="ml-2 min-h-11"
                      onClick={() => reloadReadiness()}
                    >
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <ol className="grid gap-5 md:grid-cols-3">
                  {steps.map((step, index) => (
                    <li key={step.label} className="flex min-w-0 gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-semibold">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold">{step.label}</h3>
                        <p className="mt-1 text-xs font-medium text-primary">
                          {step.ready
                            ? ["Ready", "Requests observed", "Push accepted"][
                                index
                              ]
                            : "Pending"}
                        </p>
                        <p className="mt-2 break-words text-sm text-muted-foreground">
                          {step.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <ClipboardCheck className="h-5 w-5" />
                Portal configuration
              </h2>
              <CardDescription>
                Use these values in the GetYourGuide Integrator Portal before
                running the mandatory tests.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {readinessLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin motion-reduce:animate-none" />
                  Loading readiness…
                </div>
              ) : readiness ? (
                <>
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription className="break-words">
                      Supplier API endpoints are now wired at /1/ for
                      availability, reservation, booking, cancellation, product
                      details, and product lists. Configure Basic Auth
                      credentials before running the GetYourGuide self-testing
                      tool.
                    </AlertDescription>
                  </Alert>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-xs font-medium text-muted-foreground">
                        Testing Config URL
                      </p>
                      <p className="mt-1 break-words font-mono text-sm">
                        {readiness.testingConfigurationBaseUrl}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs font-medium text-muted-foreground">
                        Endpoint prefix
                      </p>
                      <p className="mt-1 break-words font-mono text-sm">
                        {readiness.supplierApiBaseUrl}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs font-medium text-muted-foreground">
                        Timezone
                      </p>
                      <p className="mt-1 font-mono text-sm">
                        {readiness.productTimezone}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs font-medium text-muted-foreground">
                        Basic Auth
                      </p>
                      <Badge
                        className="mt-1"
                        variant={
                          readiness.credentialsConfigured
                            ? "default"
                            : "destructive"
                        }
                      >
                        {readiness.credentialsConfigured
                          ? "Configured"
                          : "Missing credentials"}
                      </Badge>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs font-medium text-muted-foreground">
                        Availability Push
                      </p>
                      <Badge
                        className="mt-1"
                        variant={
                          readiness.outboundCredentialsConfigured &&
                          readiness.availabilityPushConfigured
                            ? "default"
                            : "destructive"
                        }
                      >
                        {readiness.outboundCredentialsConfigured &&
                        readiness.availabilityPushConfigured
                          ? "Configured"
                          : "Needs setup"}
                      </Badge>
                      <p className="mt-2 break-words font-mono text-xs text-muted-foreground">
                        {readiness.availabilityPushProductId ||
                          "Set GETYOURGUIDE_AVAILABILITY_PRODUCT_ID"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-base font-semibold">
                        Portal Test Setup
                      </h3>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {readiness.recommendedSelfTests.map((test) => (
                        <div key={test.key} className="rounded-lg border p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <h3 className="font-medium">{test.label}</h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {test.timeAvailable}
                              </p>
                            </div>
                            <Badge
                              variant={readinessVariant(test.status)}
                              className="shrink-0"
                            >
                              {test.status}
                            </Badge>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm">
                            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                              <span className="text-muted-foreground">
                                Product ID
                              </span>
                              <span className="break-all font-mono text-xs sm:text-right">
                                {test.productId}
                              </span>
                            </div>
                            {test.byCategoryProductId && (
                              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                                <span className="text-muted-foreground">
                                  Ticket-category ID
                                </span>
                                <span className="break-all font-mono text-xs sm:text-right">
                                  {test.byCategoryProductId}
                                </span>
                              </div>
                            )}
                            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                              <span className="text-muted-foreground">
                                Price setup
                              </span>
                              <span className="font-medium sm:text-right">
                                {test.priceSetup}
                              </span>
                            </div>
                            {test.sampleTimes && (
                              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                                <span className="text-muted-foreground">
                                  Sample times
                                </span>
                                <span className="font-medium sm:text-right">
                                  {test.sampleTimes.join(", ")}
                                </span>
                              </div>
                            )}
                            {typeof test.samplePrice === "number" && (
                              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                                <span className="text-muted-foreground">
                                  Sample price
                                </span>
                                <span className="font-medium sm:text-right">
                                  {formatGygMoney(
                                    test.samplePrice,
                                    test.currency,
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm font-medium">
                        Available date range
                      </p>
                      <p className="mt-1 font-mono text-sm">
                        {readiness.suggestedAvailabilityWindow.from} to{" "}
                        {readiness.suggestedAvailabilityWindow.to}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {readiness.suggestedAvailabilityWindow.note}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm font-medium">Unavailable date</p>
                      <p className="mt-1 font-mono text-sm">
                        {readiness.suggestedUnavailableWindow.from} to{" "}
                        {readiness.suggestedUnavailableWindow.to}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {readiness.suggestedUnavailableWindow.note}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="text-base font-semibold">
                      Integrator Portal Rules
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {readiness.portalRules.map((rule) => (
                        <li key={rule} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="mb-3 text-base font-semibold">
                      Mandatory Endpoint Coverage
                    </h3>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Endpoint</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {readiness.mandatoryEndpoints.map((endpoint) => (
                            <TableRow key={endpoint.name}>
                              <TableCell className="font-medium">
                                {endpoint.name}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={readinessVariant(endpoint.status)}
                                >
                                  {endpoint.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xl text-sm text-muted-foreground">
                                {endpoint.detail}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Could not load GetYourGuide self-testing readiness.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
