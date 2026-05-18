import { useState } from "react";
import { Link, useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { SEO } from "@/components/seo";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatTime } from "@/lib/constants";
import type { GuideTourReport } from "@shared/schema";

interface AdminGuideTourReport extends GuideTourReport {
  guide?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    email?: string | null;
  } | null;
  booking?: {
    id: string;
    bookingReference: string | null;
    visitorName: string;
    visitorEmail: string;
    visitDate: string;
    visitTime: string;
    status: string | null;
  } | null;
  reviewedBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status?: string | null) {
  return String(status || "submitted").replace(/_/g, " ");
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1 break-words text-sm font-medium">{value}</div>
    </div>
  );
}

function TextBlock({ label, value, muted = false }: { label: string; value?: string | null; muted?: boolean }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className={`mt-2 whitespace-pre-wrap break-words rounded-lg border p-3 text-sm ${muted ? "bg-muted/50 text-muted-foreground" : "bg-background"}`}>
        {value || "Not provided."}
      </p>
    </div>
  );
}

export default function GuideTourReportDetails() {
  const [, params] = useRoute("/admin/guide-tour-reports/:id");
  const reportId = params?.id || "";
  const { toast } = useToast();
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: report, isLoading, error } = useQuery<AdminGuideTourReport>({
    queryKey: [`/api/admin/guide-tour-reports/${reportId}`],
    enabled: Boolean(reportId),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: "reviewed" | "action_required"; notes?: string }) => {
      const response = await apiRequest("POST", `/api/admin/guide-tour-reports/${reportId}/review`, {
        status,
        notes: notes?.trim() || null,
      });
      return response.json();
    },
    onSuccess: (updatedReport: AdminGuideTourReport) => {
      queryClient.setQueryData([`/api/admin/guide-tour-reports/${reportId}`], updatedReport);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guide-tour-reports?status=submitted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guide-tour-reports"] });
      toast({
        title: "Report reviewed",
        description: "The post-tour report review status has been updated.",
      });
    },
    onError: (mutationError: Error) => {
      toast({
        title: "Review failed",
        description: mutationError.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  if (error || !report) {
    return (
      <PageContainer>
        <SEO title="Post-Tour Report Not Found" robots="noindex" />
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground" />
            <div>
              <h1 className="text-xl font-semibold">Report not found</h1>
              <p className="mt-1 text-sm text-muted-foreground">This post-tour report may have been removed or you may not have access.</p>
            </div>
            <Button asChild>
              <Link href="/guides">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Guides
              </Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const guideName = report.guide ? `${report.guide.firstName} ${report.guide.lastName}` : "Guide";
  const bookingReference = report.booking?.bookingReference || report.booking?.id || report.bookingId;
  const reviewedByName = report.reviewedBy
    ? [report.reviewedBy.firstName, report.reviewedBy.lastName].filter(Boolean).join(" ") || report.reviewedBy.email
    : "Not reviewed";

  return (
    <PageContainer className="page-spacing">
      <SEO
        title={`Post-Tour Report ${bookingReference}`}
        description="Review guide post-tour report details, visitor needs, incidents, and follow-up notes."
        robots="noindex"
      />
      <PageHeader
        title="Post-Tour Report"
        description={`${bookingReference} · ${guideName}`}
      >
        <Button variant="outline" asChild>
          <Link href="/guides">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Guides
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                  Report Summary
                </CardTitle>
                <CardDescription>Guide-submitted notes from the completed tour.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={report.status === "action_required" ? "destructive" : report.status === "reviewed" ? "default" : "secondary"} className="capitalize">
                  {statusLabel(report.status)}
                </Badge>
                {report.followUpNeeded && <Badge variant="destructive">Follow-up needed</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextBlock label="Summary" value={report.summary} />
              <TextBlock label="Visitor Needs" value={report.visitorNeeds} muted />
              <TextBlock label="Incidents" value={report.incidents} muted />
              <TextBlock label="Private Guide Notes" value={report.privateNotes} muted />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Review</CardTitle>
              <CardDescription>Record whether this report is reviewed or needs follow-up action.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <DetailRow label="Current Status" value={<span className="capitalize">{statusLabel(report.status)}</span>} />
                <DetailRow label="Reviewed By" value={reviewedByName} />
                <DetailRow label="Reviewed At" value={formatDateTime(report.reviewedAt)} />
              </div>
              <TextBlock label="Existing Review Notes" value={report.adminReviewNotes} muted />
              <div className="space-y-2">
                <Label htmlFor="review-notes">Review Notes</Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  placeholder="Add internal review notes or follow-up action…"
                  className="min-h-[120px]"
                />
              </div>
              <div className="grid gap-2 sm:flex sm:flex-wrap">
                <Button
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate({ status: "reviewed", notes: reviewNotes })}
                >
                  {reviewMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Mark Reviewed
                </Button>
                <Button
                  variant="outline"
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate({ status: "action_required", notes: reviewNotes })}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Needs Action
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
                Booking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow label="Reference" value={bookingReference} />
              <DetailRow label="Visitor" value={report.booking?.visitorName || "Visitor not linked"} />
              <DetailRow label="Visitor Email" value={report.booking?.visitorEmail || "Not provided"} />
              <DetailRow
                label="Visit Date"
                value={report.booking?.visitDate ? `${formatDate(report.booking.visitDate)} at ${formatTime(report.booking.visitTime)}` : "Not recorded"}
              />
              <DetailRow label="Booking Status" value={<span className="capitalize">{statusLabel(report.booking?.status)}</span>} />
              {report.booking?.id && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/bookings/${report.booking.id}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Booking
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" aria-hidden="true" />
                Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow label="Name" value={guideName} />
              <DetailRow label="Phone" value={report.guide?.phone || "Not provided"} />
              <DetailRow label="Email" value={report.guide?.email || "Not provided"} />
              <div className="grid gap-2">
                {report.guide?.phone && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`tel:${report.guide.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call Guide
                    </a>
                  </Button>
                )}
                {report.guide?.email && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`mailto:${report.guide.email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Email Guide
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow label="Submitted" value={formatDateTime(report.createdAt)} />
              <DetailRow label="Updated" value={formatDateTime(report.updatedAt)} />
              <DetailRow label="Reviewed" value={formatDateTime(report.reviewedAt)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
