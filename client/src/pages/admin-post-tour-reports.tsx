import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search,
  FileText,
  ExternalLink,
  CheckCircle2,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const PAGE_SIZE = 20;

export default function PostTourReports() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);

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

  const filteredReports = useMemo(() => reports.filter((report) => {
    // 1. Filter by Tab
    if (activeTab === "pending" && report.status !== "submitted") return false;
    if (activeTab === "reviewed" && report.status !== "reviewed") return false;
    if (activeTab === "followup" && !report.followUpNeeded && report.status !== "action_required") return false;

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
  }), [activeTab, reports, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const paginatedReports = filteredReports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showingFrom = filteredReports.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const showingTo = Math.min(page * PAGE_SIZE, filteredReports.length);

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
            <TabsList className="h-auto w-full flex-wrap justify-start md:w-auto">
              <TabsTrigger value="all">All Reports</TabsTrigger>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
              <TabsTrigger value="followup">Follow-up Needed</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reference, visitor, guide…"
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
          <Card>
            <CardContent className="p-0">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead className="hidden md:table-cell">Guide</TableHead>
                    <TableHead className="hidden lg:table-cell">Visit</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReports.map((report) => {
                    const guideName = report.guide ? `${report.guide.firstName || ""} ${report.guide.lastName || ""}`.trim() : "Unassigned";
                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/guide-tour-reports/${report.id}`}
                              className="line-clamp-1 font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              {report.booking?.bookingReference || "No reference"} · {report.booking?.visitorName || "Guest"}
                            </Link>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{report.summary}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex min-w-0 items-center gap-2 text-sm">
                            <User className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <span className="line-clamp-1">{guideName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex min-w-0 items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <span className="line-clamp-1">{formatDate(report.booking?.visitDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {report.incidents && (
                              <Badge variant="outline" className="border-amber-200 text-amber-800 dark:border-amber-900 dark:text-amber-300">
                                Incident
                              </Badge>
                            )}
                            {(report.followUpNeeded || report.status === "action_required") && (
                              <Badge variant="destructive">Follow-up</Badge>
                            )}
                            {!report.incidents && !report.followUpNeeded && report.status !== "action_required" && (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {report.status === "submitted" ? (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                              Pending
                            </Badge>
                          ) : report.status === "action_required" ? (
                            <Badge variant="destructive">Needs action</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              Reviewed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/admin/guide-tour-reports/${report.id}`}>
                                <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                                Details
                              </Link>
                            </Button>
                            {report.status === "submitted" && (
                              <Button
                                size="sm"
                                onClick={() => reviewTourReportMutation.mutate({ id: report.id, status: "reviewed" })}
                                disabled={reviewTourReportMutation.isPending}
                              >
                                {reviewTourReportMutation.isPending ? (
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                ) : (
                                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                                )}
                                Mark reviewed
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex flex-col gap-3 border-t p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing {showingFrom}-{showingTo} of {filteredReports.length} reports
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
