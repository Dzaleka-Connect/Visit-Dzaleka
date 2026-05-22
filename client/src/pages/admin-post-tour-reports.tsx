import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SEO } from "@/components/seo";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import type { Guide, GuideTourReport } from "@shared/schema";

interface AdminGuideTourReport extends GuideTourReport {
  guide?: Pick<Guide, "id" | "firstName" | "lastName" | "phone" | "email"> | null;
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

export default function PostTourReports() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: reports = [], isLoading, isError } = useQuery<AdminGuideTourReport[]>({
    queryKey: ["/api/admin/guide-tour-reports"],
  });

  const reviewTourReportMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: "reviewed" | "action_required";
      notes?: string;
    }) => {
      const response = await apiRequest("POST", `/api/admin/guide-tour-reports/${id}/review`, {
        status,
        notes,
      });
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guide-tour-reports"] });
      toast({
        title: variables.status === "reviewed" ? "Tour report reviewed" : "Tour report flagged",
        description: variables.status === "reviewed"
          ? "The report has been marked reviewed."
          : "The report has been marked for follow-up.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Report review failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredReports = reports.filter((report) => {
    // 1. Filter by Tab
    if (activeTab === "pending" && report.status !== "submitted") return false;
    if (activeTab === "reviewed" && report.status !== "reviewed") return false;
    if (activeTab === "followup" && !report.followUpNeeded) return false;

    // 2. Filter by Search Term
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const ref = report.booking?.bookingReference || "";
    const visitor = report.booking?.visitorName || "";
    const guideName = report.guide
      ? `${report.guide.firstName} ${report.guide.lastName}`
      : "";

    return (
      ref.toLowerCase().includes(term) ||
      visitor.toLowerCase().includes(term) ||
      guideName.toLowerCase().includes(term) ||
      report.summary.toLowerCase().includes(term)
    );
  });

  const formatDate = (value?: string | Date | null) => {
    if (!value) return "Not set";
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  };

  return (
    <PageContainer>
      <SEO title="Post-Tour Reports | Visit Dzaleka Admin" />
      
      <PageHeader
        title="Post-Tour Reports"
        description="Review guide submission notes, incidents, and post-tour details to ensure high-quality visitor experiences."
      />

      <div className="space-y-6">
        {/* Search & Tabs Controls */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All Reports</TabsTrigger>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
              <TabsTrigger value="followup">Follow-up Needed</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reference, visitor, guide..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Reports Content */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
            <CardContent className="flex items-center gap-3 p-6 text-red-900 dark:text-red-200">
              <AlertTriangle className="h-5 w-5" />
              <p>Failed to load tour reports. Please try again later.</p>
            </CardContent>
          </Card>
        ) : filteredReports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No reports found</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                No post-tour reports match your active tab or search criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredReports.map((report) => (
              <Card
                key={report.id}
                className="flex flex-col justify-between border shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-semibold">
                        {report.booking?.bookingReference || "N/A"} · {report.booking?.visitorName || "Guest"}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>
                          Guide: {report.guide ? `${report.guide.firstName} ${report.guide.lastName}` : "Unassigned"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Visit Date: {formatDate(report.booking?.visitDate)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {report.status === "submitted" ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          Pending Review
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Reviewed
                        </Badge>
                      )}
                      {report.followUpNeeded && (
                        <Badge variant="destructive" className="animate-pulse">
                          Follow-up Needed
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pb-4">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Summary</h4>
                    <p className="mt-1 text-sm text-foreground line-clamp-3 break-words">
                      {report.summary}
                    </p>
                  </div>

                  {report.visitorNeeds && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visitor Needs</h4>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2 break-words">
                        {report.visitorNeeds}
                      </p>
                    </div>
                  )}

                  {report.incidents && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-900/50 dark:bg-amber-950/20">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Incident / Safety Note</span>
                      </div>
                      <p className="mt-1 text-xs text-amber-900 dark:text-amber-200 break-words line-clamp-2">
                        {report.incidents}
                      </p>
                    </div>
                  )}

                  {report.reviewedBy && (
                    <div className="pt-2 text-xs text-muted-foreground border-t">
                      Reviewed by {report.reviewedBy.firstName || report.reviewedBy.email} on {formatDate(report.reviewedAt)}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Button size="sm" variant="outline" className="h-9 flex-1" asChild>
                      <Link href={`/admin/guide-tour-reports/${report.id}`}>
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Details
                      </Link>
                    </Button>
                    
                    {report.status === "submitted" && (
                      <Button
                        size="sm"
                        className="h-9 flex-1"
                        onClick={() => reviewTourReportMutation.mutate({ id: report.id, status: "reviewed" })}
                        disabled={reviewTourReportMutation.isPending}
                      >
                        {reviewTourReportMutation.isPending ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Mark Reviewed
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
