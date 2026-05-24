import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, CheckCircle2, ClipboardCheck, Clock, ExternalLink, Globe, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface GetYourGuideBooking {
    id: string;
    bookingReference: string;
    numberOfPeople: number;
    tourDate: string;
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

function readinessVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    if (status === "Ready to configure" || status === "Admin push wired" || status === "Wired") return "default";
    if (status === "Partially wired") return "secondary";
    if (status === "Not wired yet") return "destructive";
    return "outline";
}

export default function GetYourGuidePage() {
    const queryClient = useQueryClient();
    const [syncing, setSyncing] = useState(false);

    // Fetch GetYourGuide bookings
    const { data: bookings, isLoading } = useQuery<GetYourGuideBooking[]>({
        queryKey: ["/api/bookings/channel/getyourguide"],
    });

    const { data: readiness, isLoading: readinessLoading } = useQuery<GetYourGuideSelfTestReadiness>({
        queryKey: ["/api/getyourguide/self-test-readiness"],
    });

    // Sync availability mutation
    const syncMutation = useMutation<SyncAvailabilityResult, Error>({
        mutationFn: async () => {
            const response = await apiRequest("POST", "/api/getyourguide/sync-availability", {});
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
            setSyncing(false);
        },
        onError: () => {
            setSyncing(false);
        },
    });

    const handleSyncAvailability = () => {
        setSyncing(true);
        syncMutation.mutate();
    };

    const integrationStatus = bookings !== undefined ? "active" : "pending";
    const syncError = syncMutation.error?.message || "Failed to sync availability.";
    const syncResult = syncMutation.data;
    const syncDisabled = syncing
        || syncMutation.isPending
        || (readiness ? !readiness.outboundCredentialsConfigured || !readiness.availabilityPushConfigured : false);
    const setupChecklist = readiness
        ? [
            {
                label: "Supplier API credentials",
                ready: readiness.credentialsConfigured,
                detail: readiness.credentialsConfigured ? "Basic Auth is configured for self-testing." : "Set Supplier API Basic Auth credentials.",
            },
            {
                label: "Endpoint prefix",
                ready: Boolean(readiness.supplierApiBaseUrl),
                detail: readiness.supplierApiBaseUrl || "Use the public /1/ Supplier API prefix.",
            },
            {
                label: "Product mapping",
                ready: Boolean(readiness.productId),
                detail: `Self-test product ID: ${readiness.productId}`,
            },
            {
                label: "Availability push",
                ready: readiness.outboundCredentialsConfigured && readiness.availabilityPushConfigured,
                detail: readiness.availabilityPushConfigured
                    ? `Push product: ${readiness.availabilityPushProductId}`
                    : "Set GETYOURGUIDE_AVAILABILITY_PRODUCT_ID after GYG maps the connected product.",
            },
        ]
        : [];
    const setupCompleteCount = setupChecklist.filter((step) => step.ready).length;

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold text-foreground sm:text-3xl">GetYourGuide Integration</h1>
                    <p className="text-muted-foreground">
                        Manage GetYourGuide bookings and sync availability
                    </p>
                </div>
                <Badge variant={integrationStatus === "active" ? "default" : "secondary"} className="flex w-fit items-center gap-1">
                    {integrationStatus === "active" ? (
                        <>
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                        </>
                    ) : (
                        <>
                            <XCircle className="h-3 w-3" />
                            Pending
                        </>
                    )}
                </Badge>
            </div>

            <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardCheck className="h-5 w-5" />
                            Setup & Testing Command Center
                        </CardTitle>
                        <CardDescription>
                            Track the pieces GetYourGuide needs before self-testing and availability push can pass reliably.
                        </CardDescription>
                    </div>
                    <Badge variant={setupCompleteCount === setupChecklist.length && setupChecklist.length > 0 ? "default" : "secondary"} className="w-fit">
                        {setupCompleteCount}/{setupChecklist.length || 4} ready
                    </Badge>
                </CardHeader>
                <CardContent>
                    {readinessLoading ? (
                        <div className="flex items-center py-4 text-sm text-muted-foreground">
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Checking setup…
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {setupChecklist.map((step) => (
                                <div key={step.label} className="rounded-lg border p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold">{step.label}</p>
                                            <p className="mt-2 break-words text-xs text-muted-foreground">{step.detail}</p>
                                        </div>
                                        {step.ready ? (
                                            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-label="Ready" />
                                        ) : (
                                            <XCircle className="h-5 w-5 shrink-0 text-amber-600" aria-label="Needs setup" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Integration Status Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Integration Status
                    </CardTitle>
                    <CardDescription>
                        Real-time sync with GetYourGuide booking platform
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Webhook Endpoint</p>
                            <p className="break-all rounded bg-muted p-2 font-mono text-sm">/api/webhooks/getyourguide</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Authentication</p>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">Basic Auth</Badge>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                            <p className="text-2xl font-bold">{bookings?.length || 0}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <Button
                            onClick={handleSyncAvailability}
                            disabled={syncDisabled}
                            className="w-full md:w-auto"
                            aria-label="Sync current availability to GetYourGuide"
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                            {syncing ? "Syncing…" : "Sync Availability to GetYourGuide"}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                            {readiness?.outboundCredentialsConfigured === false
                                ? "Add GetYourGuide outbound API credentials before pushing availability."
                                : readiness?.availabilityPushConfigured === false
                                    ? "Add the mapped GetYourGuide availability product ID before pushing availability."
                                : "Manually push current availability for the configured GetYourGuide product"}
                        </p>
                    </div>

                    {syncMutation.isSuccess && syncResult && (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                {syncResult.message}: {syncResult.availabilityCount} availability records for {syncResult.productId}.
                            </AlertDescription>
                        </Alert>
                    )}

                    {syncMutation.isError && (
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>
                                {syncError}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5" />
                        Self-testing Readiness
                    </CardTitle>
                    <CardDescription>
                        Use these values in the GetYourGuide Integrator Portal before running the mandatory tests.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {readinessLoading ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                            Loading readiness…
                        </div>
                    ) : readiness ? (
                        <>
                            <Alert>
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertDescription className="break-words">
                                    Supplier API endpoints are now wired at /1/ for availability, reservation, booking, cancellation, product details, and product lists. Configure Basic Auth credentials before running the GetYourGuide self-testing tool.
                                </AlertDescription>
                            </Alert>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                                <div className="rounded-lg border p-4">
                                    <p className="text-xs font-medium text-muted-foreground">Testing Config URL</p>
                                    <p className="mt-1 break-words font-mono text-sm">{readiness.testingConfigurationBaseUrl}</p>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <p className="text-xs font-medium text-muted-foreground">Endpoint prefix</p>
                                    <p className="mt-1 break-words font-mono text-sm">{readiness.supplierApiBaseUrl}</p>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <p className="text-xs font-medium text-muted-foreground">Timezone</p>
                                    <p className="mt-1 font-mono text-sm">{readiness.productTimezone}</p>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <p className="text-xs font-medium text-muted-foreground">Basic Auth</p>
                                    <Badge className="mt-1" variant={readiness.credentialsConfigured ? "default" : "destructive"}>
                                        {readiness.credentialsConfigured ? "Configured" : "Missing credentials"}
                                    </Badge>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <p className="text-xs font-medium text-muted-foreground">Availability Push</p>
                                    <Badge className="mt-1" variant={readiness.outboundCredentialsConfigured && readiness.availabilityPushConfigured ? "default" : "destructive"}>
                                        {readiness.outboundCredentialsConfigured && readiness.availabilityPushConfigured ? "Configured" : "Needs setup"}
                                    </Badge>
                                    <p className="mt-2 break-words font-mono text-xs text-muted-foreground">
                                        {readiness.availabilityPushProductId || "Set GETYOURGUIDE_AVAILABILITY_PRODUCT_ID"}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                    <h2 className="text-base font-semibold">Portal Test Setup</h2>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {readiness.recommendedSelfTests.map((test) => (
                                        <div key={test.key} className="rounded-lg border p-4">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="min-w-0">
                                                    <h3 className="font-medium">{test.label}</h3>
                                                    <p className="mt-1 text-sm text-muted-foreground">{test.timeAvailable}</p>
                                                </div>
                                                <Badge variant={readinessVariant(test.status)} className="shrink-0">
                                                    {test.status}
                                                </Badge>
                                            </div>
                                            <div className="mt-3 grid gap-2 text-sm">
                                                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                                                    <span className="text-muted-foreground">Product ID</span>
                                                    <span className="break-all font-mono text-xs sm:text-right">{test.productId}</span>
                                                </div>
                                                {test.byCategoryProductId && (
                                                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                                                        <span className="text-muted-foreground">Ticket-category ID</span>
                                                        <span className="break-all font-mono text-xs sm:text-right">{test.byCategoryProductId}</span>
                                                    </div>
                                                )}
                                                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                                                    <span className="text-muted-foreground">Price setup</span>
                                                    <span className="font-medium sm:text-right">{test.priceSetup}</span>
                                                </div>
                                                {test.sampleTimes && (
                                                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                                                        <span className="text-muted-foreground">Sample times</span>
                                                        <span className="font-medium sm:text-right">{test.sampleTimes.join(", ")}</span>
                                                    </div>
                                                )}
                                                {typeof test.samplePrice === "number" && (
                                                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                                                        <span className="text-muted-foreground">Sample price</span>
                                                        <span className="font-medium sm:text-right">{formatGygMoney(test.samplePrice, test.currency)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-lg border p-4">
                                    <p className="text-sm font-medium">Available date range</p>
                                    <p className="mt-1 font-mono text-sm">
                                        {readiness.suggestedAvailabilityWindow.from} to {readiness.suggestedAvailabilityWindow.to}
                                    </p>
                                    <p className="mt-2 text-sm text-muted-foreground">{readiness.suggestedAvailabilityWindow.note}</p>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <p className="text-sm font-medium">Unavailable date</p>
                                    <p className="mt-1 font-mono text-sm">
                                        {readiness.suggestedUnavailableWindow.from} to {readiness.suggestedUnavailableWindow.to}
                                    </p>
                                    <p className="mt-2 text-sm text-muted-foreground">{readiness.suggestedUnavailableWindow.note}</p>
                                </div>
                            </div>

                            <div className="rounded-lg border p-4">
                                <h2 className="text-base font-semibold">Integrator Portal Rules</h2>
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
                                <h2 className="mb-3 text-base font-semibold">Mandatory Endpoint Coverage</h2>
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
                                                    <TableCell className="font-medium">{endpoint.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={readinessVariant(endpoint.status)}>
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

            {/* Recent Bookings */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent GetYourGuide Bookings</CardTitle>
                    <CardDescription>
                        Bookings received directly from GetYourGuide platform
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : bookings && bookings.length > 0 ? (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Tour Type</TableHead>
                                        <TableHead>Guests</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bookings.map((booking) => (
                                        <TableRow key={booking.id}>
                                            <TableCell className="font-mono text-sm">
                                                {booking.bookingReference}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {booking.visitorEmail || "Not available"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{booking.tourType}</Badge>
                                            </TableCell>
                                            <TableCell>{booking.numberOfPeople}</TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(booking.tourDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        booking.status === "confirmed"
                                                            ? "default"
                                                            : booking.status === "pending"
                                                                ? "secondary"
                                                                : "destructive"
                                                    }
                                                >
                                                    {booking.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg font-medium text-muted-foreground">No GetYourGuide bookings yet</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Bookings from GetYourGuide will appear here automatically
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Documentation Link */}
            <Card>
                <CardHeader>
                    <CardTitle>Documentation</CardTitle>
                    <CardDescription>Learn more about the GetYourGuide integration</CardDescription>
                </CardHeader>
                <CardContent>
                    <a
                        href="https://integrator.getyourguide.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                    >
                        GetYourGuide Integrator Portal
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </CardContent>
            </Card>
        </div>
    );
}
