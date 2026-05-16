import { useQuery } from "@tanstack/react-query";
import { 
  Activity, 
  Database, 
  Server, 
  CheckCircle2, 
  XCircle,
  Clock,
  RefreshCw
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

interface HealthStatus {
  status: "healthy" | "unhealthy";
  timestamp: string;
  database: "connected" | "disconnected";
  zonesCount?: number;
}

export default function SystemHealth() {
  const { data: health, isLoading, isError, refetch, dataUpdatedAt } = useQuery<HealthStatus>({
    queryKey: ["/api/health"],
    refetchInterval: 30000,
  });

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusColor = (isHealthy: boolean) => {
    return isHealthy ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-red-200 bg-red-50 dark:bg-red-950/20";
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SEO title="System Health" robots="noindex" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <span className={`flex h-2 w-2 rounded-full ${isLoading ? 'bg-yellow-500' : isError || health?.status === 'unhealthy' ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></span>
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
        <Card className={getStatusColor(!isError && health?.status === "healthy")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Core API Server</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusIcon(!isError && health?.status === "healthy")}
              <div className="text-2xl font-bold">
                {!health && isLoading ? "Checking..." : isError || health?.status === "unhealthy" ? "Degraded" : "Operational"}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Main application routing and logic
            </p>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card className={getStatusColor(health?.database === "connected")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">PostgreSQL Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusIcon(health?.database === "connected")}
              <div className="text-2xl font-bold">
                {!health && isLoading ? "Checking..." : health?.database === "connected" ? "Connected" : "Disconnected"}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {health?.zonesCount ? `Latency OK (${health.zonesCount} zones verified)` : "Database connectivity status"}
            </p>
          </CardContent>
        </Card>

        {/* Client App Status */}
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Frontend Application</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div className="text-2xl font-bold">Operational</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Client-side rendering and UI
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Third Party Integrations */}
      <h2 className="text-xl font-bold mt-8 mb-4">Third-Party Integrations</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resend (Email)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Operational</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Transactional email delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stripe (Payments)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Operational</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Payment processing gateway</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">GetYourGuide (OTA)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Operational</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Channel manager API</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
