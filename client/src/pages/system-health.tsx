import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Activity, 
  Database, 
  Server, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  CircleSlash,
  RefreshCw,
  Mail,
  CreditCard,
  Globe2,
  HardDrive,
  CalendarClock,
  Webhook,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo";
import { formatDistanceToNow } from "date-fns";

type HealthComponentStatus = "operational" | "degraded" | "down" | "not_configured";

interface HealthComponent {
  status: HealthComponentStatus;
  checkedAt: string;
  message: string;
  remediationUrl?: string;
  metrics?: Record<string, unknown>;
}

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  database: "connected" | "disconnected";
  zonesCount?: number;
  integrations?: Record<string, HealthComponent>;
}

const integrationCards = [
  { key: "resend", title: "Resend (Email)", description: "Transactional email delivery", icon: Mail },
  { key: "stripe", title: "Stripe (Payments)", description: "Payment checkout and webhook configuration", icon: CreditCard },
  { key: "getyourguide", title: "GetYourGuide (OTA)", description: "Supplier API and availability sync", icon: Globe2 },
  { key: "supabaseStorage", title: "Supabase Storage", description: "Public file and media storage", icon: HardDrive },
  { key: "scheduledReports", title: "Scheduled Reports", description: "Automated report configuration and timing", icon: CalendarClock },
  { key: "webhookQueue", title: "Webhook Delivery Queue", description: "Outbound webhook delivery backlog and failures", icon: Webhook },
] as const;

export default function SystemHealth() {
  const { data: health, isLoading, isError, refetch, dataUpdatedAt } = useQuery<HealthStatus>({
    queryKey: ["/api/health"],
    refetchInterval: 30000,
  });

  const getStatusIcon = (status: HealthComponentStatus | "healthy" | "unhealthy" | "degraded" | "connected" | "disconnected") => {
    if (status === "operational" || status === "healthy" || status === "connected") {
      return <CheckCircle2 className="h-5 w-5 text-green-500" aria-hidden="true" />;
    }
    if (status === "degraded" || status === "not_configured") {
      return <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />;
    }
    if (status === "down" || status === "unhealthy" || status === "disconnected") {
      return <XCircle className="h-5 w-5 text-red-500" aria-hidden="true" />;
    }
    return <CircleSlash className="h-5 w-5 text-muted-foreground" aria-hidden="true" />;
  };

  const getStatusColor = (status: HealthComponentStatus | "healthy" | "unhealthy" | "degraded" | "connected" | "disconnected" | undefined) => {
    if (status === "operational" || status === "healthy" || status === "connected") {
      return "border-green-200 bg-green-50 dark:bg-green-950/20";
    }
    if (status === "degraded" || status === "not_configured") {
      return "border-amber-200 bg-amber-50 dark:bg-amber-950/20";
    }
    return "border-red-200 bg-red-50 dark:bg-red-950/20";
  };

  const formatStatus = (status?: string) => {
    if (!status) return "Unavailable";
    return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SEO title="System Health" robots="noindex" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <span className={`flex h-2 w-2 rounded-full ${isLoading ? 'bg-yellow-500' : isError || health?.status === 'unhealthy' ? 'bg-red-500' : health?.status === "degraded" ? "bg-amber-500" : 'bg-green-500'} animate-pulse`}></span>
            Monitoring core services and integrations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dataUpdatedAt > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              Last checked: {formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Core API Status */}
        <Card className={getStatusColor(isError ? "unhealthy" : health?.status)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Core API Server</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusIcon(isError ? "unhealthy" : health?.status || "unhealthy")}
              <div className="text-2xl font-bold">
                {!health && isLoading ? "Checking…" : isError ? "Unavailable" : formatStatus(health?.status)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Main application routing and logic
            </p>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card className={getStatusColor(health?.database)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">PostgreSQL Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusIcon(health?.database || "disconnected")}
              <div className="text-2xl font-bold">
                {!health && isLoading ? "Checking…" : health?.database === "connected" ? "Connected" : "Disconnected"}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {health?.zonesCount ? `Latency OK (${health.zonesCount} zones verified)` : "Database connectivity status"}
            </p>
          </CardContent>
        </Card>

        {/* Client App Status */}
        <Card className={getStatusColor(isError ? "degraded" : "operational")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Frontend Application</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusIcon(isError ? "degraded" : "operational")}
              <div className="text-2xl font-bold">{isError ? "Degraded" : "Operational"}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isError ? "The health API did not respond, so client status cannot be fully verified." : "Client-side rendering and UI"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Third Party Integrations */}
      <h2 className="text-xl font-bold mt-8 mb-4">Third-Party Integrations</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrationCards.map((card) => {
          const component = health?.integrations?.[card.key];
          const Icon = card.icon;
          return (
            <Card key={card.key} className={getStatusColor(component?.status)}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{card.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(component?.status || "down")}
                  <span className="text-sm font-medium">{isLoading && !component ? "Checking…" : formatStatus(component?.status)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {component?.message || card.description}
                </p>
                {component?.checkedAt && (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Checked {formatDistanceToNow(new Date(component.checkedAt), { addSuffix: true })}
                  </p>
                )}
                {component?.remediationUrl && component.status !== "operational" && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={component.remediationUrl}>Open remediation</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
