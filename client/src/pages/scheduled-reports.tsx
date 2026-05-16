import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Mail,
  PauseCircle,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { SEO } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ScheduledReportRecord {
  id: string;
  name: string;
  type: "visitors" | "revenue" | "incidents";
  frequency: "daily" | "weekly" | "monthly";
  recipients: string;
  nextRunAt: string | Date;
  lastRunAt?: string | Date | null;
  status?: "active" | "paused" | string | null;
}

const reportTypeLabels: Record<ScheduledReportRecord["type"], string> = {
  visitors: "Visitor Summary",
  revenue: "Revenue Summary",
  incidents: "Security Incidents",
};

const reportTypeStyles: Record<ScheduledReportRecord["type"], string> = {
  visitors: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300",
  revenue: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
  incidents: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDateTime(value?: string | Date | null) {
  if (!value) return "Not run yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return dateFormatter.format(date);
}

function toLocalDateTimeInputValue(value?: string | Date | null) {
  const date = value ? new Date(value) : new Date(Date.now() + 60 * 60 * 1000);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function recipientCount(recipients?: string | null) {
  return (recipients || "").split(",").map((email) => email.trim()).filter(Boolean).length;
}

function nextRunStatus(value?: string | Date | null) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not scheduled";
  return date.getTime() <= Date.now() ? "Due now" : formatDateTime(date);
}

function ScheduledReportForm({
  report,
  isSaving,
  onSubmit,
}: {
  report: ScheduledReportRecord | null;
  isSaving: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Report name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={report?.name || ""}
            placeholder="Weekly visitor summary…"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Report type</Label>
          <Select name="type" defaultValue={report?.type || "visitors"}>
            <SelectTrigger id="type">
              <SelectValue placeholder="Select type…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visitors">Visitor Summary</SelectItem>
              <SelectItem value="revenue">Revenue Summary</SelectItem>
              <SelectItem value="incidents">Security Incidents</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Select name="frequency" defaultValue={report?.frequency || "weekly"}>
            <SelectTrigger id="frequency">
              <SelectValue placeholder="Select frequency…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nextRunAt">Next run</Label>
          <Input
            id="nextRunAt"
            name="nextRunAt"
            type="datetime-local"
            required
            defaultValue={toLocalDateTimeInputValue(report?.nextRunAt)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={report?.status || "active"}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="recipients">Recipients</Label>
          <Textarea
            id="recipients"
            name="recipients"
            required
            rows={3}
            defaultValue={report?.recipients || ""}
            placeholder="admin@example.com, finance@example.com…"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
        {isSaving ? "Saving…" : "Save report"}
      </Button>
    </form>
  );
}

export default function ScheduledReports() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReportRecord | null>(null);

  const { data: reports = [], isLoading } = useQuery<ScheduledReportRecord[]>({
    queryKey: ["/api/scheduled-reports"],
  });

  const stats = useMemo(() => {
    const now = new Date();
    const active = reports.filter((report) => report.status === "active").length;
    const paused = reports.filter((report) => report.status === "paused").length;
    const ranThisMonth = reports.filter((report) => {
      if (!report.lastRunAt) return false;
      const date = new Date(report.lastRunAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    const recipientTotal = reports.reduce((sum, report) => sum + recipientCount(report.recipients), 0);

    return { active, paused, ranThisMonth, recipientTotal };
  }, [reports]);

  const saveMutation = useMutation({
    mutationFn: async (data: {
      name: FormDataEntryValue | null;
      type: FormDataEntryValue | null;
      frequency: FormDataEntryValue | null;
      recipients: FormDataEntryValue | null;
      nextRunAt: string;
      status: FormDataEntryValue | null;
    }) => {
      const res = await apiRequest(
        editingReport ? "PATCH" : "POST",
        `/api/scheduled-reports${editingReport ? `/${editingReport.id}` : ""}`,
        data,
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-reports"] });
      toast({ title: "Report saved", description: "The scheduled report is ready." });
      setIsDialogOpen(false);
      setEditingReport(null);
    },
    onError: (error: Error) => {
      toast({ title: "Could not save report", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/scheduled-reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-reports"] });
      toast({ title: "Report deleted", description: "The scheduled report was removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Could not delete report", description: error.message, variant: "destructive" });
    },
  });

  const runMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/scheduled-reports/${id}/run`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-reports"] });
      toast({ title: "Report sent", description: "The email report was generated and delivered." });
    },
    onError: (error: Error) => {
      toast({ title: "Could not send report", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    saveMutation.mutate({
      name: formData.get("name"),
      type: formData.get("type"),
      frequency: formData.get("frequency"),
      recipients: formData.get("recipients"),
      nextRunAt: formData.get("nextRunAt")
        ? new Date(formData.get("nextRunAt") as string).toISOString()
        : new Date().toISOString(),
      status: formData.get("status") || "active",
    });
  };

  return (
    <PageContainer className="page-spacing">
      <SEO title="Scheduled Reports" robots="noindex" />

      <PageHeader
        title="Scheduled Reports"
        description="Control automated visitor, revenue, and security email reports."
        actions={
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingReport(null);
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingReport(null)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingReport ? "Edit scheduled report" : "Create scheduled report"}</DialogTitle>
                <DialogDescription>
                  Set the report type, timing, and recipients.
                </DialogDescription>
              </DialogHeader>
              <ScheduledReportForm
                report={editingReport}
                isSaving={saveMutation.isPending}
                onSubmit={handleSubmit}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">{stats.active}</div>
            <p className="text-xs text-muted-foreground">{stats.paused} paused</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ran This Month</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">{stats.ranThisMonth}</div>
            <p className="text-xs text-muted-foreground">Based on last run</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recipients</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">{stats.recipientTotal}</div>
            <p className="text-xs text-muted-foreground">Across all reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">3</div>
            <p className="text-xs text-muted-foreground">Visitors, revenue, security</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Reports</CardTitle>
          <CardDescription>Review timing, recipients, and delivery status.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex min-h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              Loading scheduled reports…
            </div>
          ) : reports.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No scheduled reports"
              description="Create a report to start sending admin summaries."
              className="py-12"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Last sent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => {
                    const isRunningReport = runMutation.isPending && runMutation.variables === report.id;
                    const isDeletingReport = deleteMutation.isPending && deleteMutation.variables === report.id;

                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <div className="font-medium">{report.name}</div>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <Badge variant="outline" className={reportTypeStyles[report.type]}>
                                {reportTypeLabels[report.type]}
                              </Badge>
                              <Badge variant="secondary" className="capitalize">
                                {report.frequency}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-44 items-start gap-2 text-sm">
                            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <span>{nextRunStatus(report.nextRunAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-64">
                            <div className="text-sm tabular-nums">{recipientCount(report.recipients)} recipient{recipientCount(report.recipients) === 1 ? "" : "s"}</div>
                            <div className="truncate text-xs text-muted-foreground">{report.recipients}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatDateTime(report.lastRunAt)}</TableCell>
                        <TableCell>
                          <Badge variant={report.status === "active" ? "default" : "secondary"}>
                            {report.status === "active" ? (
                              <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                            ) : (
                              <PauseCircle className="mr-1 h-3 w-3" aria-hidden="true" />
                            )}
                            {report.status || "active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Run ${report.name}`}
                              title="Run now"
                              disabled={runMutation.isPending}
                              onClick={() => runMutation.mutate(report.id)}
                            >
                              {isRunningReport ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Edit ${report.name}`}
                              title="Edit"
                              onClick={() => {
                                setEditingReport(report);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${report.name}`}
                              title="Delete"
                              className="text-destructive hover:bg-destructive/10"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (window.confirm(`Delete ${report.name}?`)) {
                                  deleteMutation.mutate(report.id);
                                }
                              }}
                            >
                              {isDeletingReport ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
