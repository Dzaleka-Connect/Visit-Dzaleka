import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Loader2,
  Mail,
  MessageSquareText,
  Search,
  Send,
  Star,
  TrendingUp,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageContainer } from "@/components/page-container";
import { SEO } from "@/components/seo";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TourReview } from "@shared/schema";

type Priority = "high" | "medium" | "low";
type ReviewStatusFilter = "all" | "pending" | "published" | "hidden";

interface Opportunity {
  id: string;
  priority: Priority;
  title: string;
  description: string;
  metric: string;
  actionLabel: string;
  href: string;
}

interface ReviewCandidate {
  bookingId: string;
  bookingReference: string;
  visitorName: string;
  visitorEmail: string;
  visitDate: string;
  reviewLink: string;
}

interface ReviewsPerformanceData {
  stats: {
    listingViews: number;
    uniqueVisitors: number;
    bookingRequestsLast30: number;
    conversionRate: number;
    completedTours: number;
    totalReviews: number;
    publishedReviews: number;
    pendingModeration: number;
    averageRating: number;
    pendingReviewRequests: number;
    feedbackEmailsLast30: number;
    failedEmailsLast30: number;
  };
  opportunities: Opportunity[];
  reviews: TourReview[];
  reviewCandidates: ReviewCandidate[];
  setupIssues?: { key: string; label: string; message: string }[];
}

const REVIEW_PAGE_SIZE = 8;

const reviewStatusFilters: Array<{ value: ReviewStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "published", label: "Published" },
  { value: "hidden", label: "Hidden" },
];

const priorityStyles: Record<Priority, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

function formatDate(value?: string | Date | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat(undefined).format(value || 0);
}

function ratingStars(rating?: number | null) {
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      className={`h-4 w-4 ${rating && index < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`}
      aria-hidden="true"
    />
  ));
}

function reviewStatusBadge(status?: string | null) {
  if (status === "published") return <Badge>Published</Badge>;
  if (status === "hidden") return <Badge variant="outline">Hidden</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

function reviewDateValue(review: TourReview) {
  const value = review.submittedAt || review.createdAt;
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function searchableReviewText(review: TourReview) {
  return [
    review.visitorName,
    review.visitorEmail,
    review.bookingReference,
    review.title,
    review.comment,
    review.country,
    review.purposeOfVisit,
    review.groupSize,
    review.referralSource,
    review.tourGuideName,
    review.guideExperience,
    review.enjoyedMost,
    review.improvementSuggestions,
    review.otherComments,
    review.status,
    review.source,
  ].filter(Boolean).join(" ").toLowerCase();
}

function MetricTile({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: typeof Star;
}) {
  return (
    <div className="min-w-0 rounded-md border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 break-words text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      </div>
      {detail && <p className="mt-2 break-words text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export default function ReviewsPerformance() {
  const { toast } = useToast();
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatusFilter>("all");
  const [reviewSearch, setReviewSearch] = useState("");

  const { data, isLoading, isError } = useQuery<ReviewsPerformanceData>({
    queryKey: ["/api/reviews-performance"],
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest("POST", `/api/reviews/request/${bookingId}`);
      return response.json() as Promise<{ success: boolean; reviewLink: string; emailError?: string }>;
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/reviews-performance"] });
      toast({
        title: result.success ? "Review request sent" : "Review link created",
        description: result.success ? "The visitor was emailed a feedback link." : result.emailError || "Copy the review link and send it manually.",
      });
      if (navigator.clipboard && result.reviewLink) {
        await navigator.clipboard.writeText(result.reviewLink).catch(() => undefined);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Could not send review request", description: error.message, variant: "destructive" });
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: async ({ id, status, responseText }: { id: string; status?: string; responseText?: string }) => {
      const response = await apiRequest("PATCH", `/api/reviews/${id}`, { status, responseText });
      return response.json() as Promise<TourReview>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews-performance"] });
      toast({ title: "Review updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not update review", description: error.message, variant: "destructive" });
    },
  });

  const allReviews = data?.reviews ?? [];
  const reviewCounts = useMemo(() => ({
    all: allReviews.length,
    pending: allReviews.filter((review) => !review.status || review.status === "pending").length,
    published: allReviews.filter((review) => review.status === "published").length,
    hidden: allReviews.filter((review) => review.status === "hidden").length,
  }), [allReviews]);

  const filteredReviews = useMemo(() => {
    const term = reviewSearch.trim().toLowerCase();
    const statusRank: Record<string, number> = { pending: 0, published: 1, hidden: 2 };

    return allReviews
      .filter((review) => {
        const status = (review.status || "pending") as ReviewStatusFilter;
        if (reviewStatus !== "all" && status !== reviewStatus) return false;
        if (!term) return true;
        return searchableReviewText(review).includes(term);
      })
      .sort((a, b) => {
        const statusA = statusRank[a.status || "pending"] ?? 3;
        const statusB = statusRank[b.status || "pending"] ?? 3;
        if (statusA !== statusB) return statusA - statusB;
        return reviewDateValue(b) - reviewDateValue(a);
      });
  }, [allReviews, reviewSearch, reviewStatus]);

  useEffect(() => {
    setReviewPage(1);
  }, [reviewSearch, reviewStatus]);

  if (isLoading) {
    return (
      <PageContainer>
        <SEO title="Reviews & Visitor Feedback" description="Review collection and performance opportunities." />
        <div className="p-8 text-sm text-muted-foreground">Loading reviews and feedback…</div>
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer>
        <SEO title="Reviews & Visitor Feedback" description="Review collection and performance opportunities." />
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <p className="min-w-0 break-words">Could not load reviews and opportunities. Check whether the review migration has been applied.</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const totalReviews = data.stats.totalReviews || 0;
  const reviewTotalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEW_PAGE_SIZE));
  const currentReviewPage = Math.min(reviewPage, reviewTotalPages);
  const visibleReviews = filteredReviews.slice((currentReviewPage - 1) * REVIEW_PAGE_SIZE, currentReviewPage * REVIEW_PAGE_SIZE);
  const showingReviewsFrom = filteredReviews.length ? (currentReviewPage - 1) * REVIEW_PAGE_SIZE + 1 : 0;
  const showingReviewsTo = Math.min(currentReviewPage * REVIEW_PAGE_SIZE, filteredReviews.length);
  const publishedPercent = totalReviews ? Math.round((data.stats.publishedReviews / totalReviews) * 100) : 0;

  return (
    <PageContainer className="min-w-0">
      <SEO title="Reviews & Visitor Feedback" description="Collect tour reviews and act on performance opportunities." />

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">Reviews & Visitor Feedback</h1>
          <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-muted-foreground sm:text-base">
            Collect verified feedback, follow up completed tours, and decide which reviews are ready to publish.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full shrink-0 md:w-auto">
          <Link href="/email-history">
            <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
            Email history
          </Link>
        </Button>
      </div>

      {data.setupIssues && data.setupIssues.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Some review dashboard data could not load</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {data.setupIssues.map((issue) => (
                <p key={issue.key} className="break-words">
                  <span className="font-medium">{issue.label}:</span> {issue.message}
                </p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Review health</CardTitle>
            <CardDescription>Public proof, moderation status, and follow-up work.</CardDescription>
          </CardHeader>
          <CardContent className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="min-w-0 rounded-md border bg-muted/25 p-4 sm:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Average rating</p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <span className="text-4xl font-semibold tabular-nums">{data.stats.averageRating || "—"}</span>
                <div className="pb-1">
                  <div className="flex" aria-label={`${data.stats.averageRating || 0} out of 5 stars`}>
                    {ratingStars(data.stats.averageRating)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatNumber(totalReviews)} submitted review{totalReviews === 1 ? "" : "s"}</p>
                </div>
              </div>
            </div>
            <MetricTile label="Published" value={formatNumber(data.stats.publishedReviews)} detail={`${publishedPercent}% of submitted feedback`} icon={Eye} />
            <MetricTile label="Pending moderation" value={formatNumber(data.stats.pendingModeration)} detail="Needs publish, hide, or response decision" icon={MessageSquareText} />
            <MetricTile label="Pending requests" value={formatNumber(data.stats.pendingReviewRequests)} detail="Completed tours still waiting for feedback" icon={Mail} />
            <MetricTile label="Failed emails" value={formatNumber(data.stats.failedEmailsLast30)} detail="Last 30 days" icon={AlertTriangle} />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Booking signal</CardTitle>
            <CardDescription>Last 30 days and public listing activity.</CardDescription>
          </CardHeader>
          <CardContent className="grid min-w-0 gap-3 sm:grid-cols-2">
            <MetricTile label="Listing views" value={formatNumber(data.stats.listingViews)} detail={`${formatNumber(data.stats.uniqueVisitors)} unique visitors`} icon={TrendingUp} />
            <MetricTile label="Booking requests" value={formatNumber(data.stats.bookingRequestsLast30)} detail={`${data.stats.conversionRate || 0}% view-to-request rate`} icon={CheckCircle2} />
            <MetricTile label="Completed tours" value={formatNumber(data.stats.completedTours)} detail="Eligible for review requests" icon={Star} />
            <MetricTile label="Feedback emails" value={formatNumber(data.stats.feedbackEmailsLast30)} detail="Sent in the last 30 days" icon={Send} />
          </CardContent>
        </Card>
      </section>

      <section className="grid min-w-0 gap-4">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Performance opportunities</CardTitle>
            <CardDescription>Sorted by the work most likely to improve trust and bookings.</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            {data.opportunities.length === 0 ? (
              <EmptyState>No current opportunities. Keep collecting fresh visitor feedback.</EmptyState>
            ) : (
              <div className="divide-y rounded-md border">
                {data.opportunities.map((opportunity) => (
                  <div key={opportunity.id} className="grid min-w-0 gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-sm font-semibold">{opportunity.title}</h2>
                        <Badge className={priorityStyles[opportunity.priority]}>{opportunity.priority}</Badge>
                      </div>
                      <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">{opportunity.description}</p>
                    </div>
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
                      <Badge variant="outline" className="max-w-full justify-center break-words">{opportunity.metric}</Badge>
                      <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                        <Link href={opportunity.href}>
                          {opportunity.actionLabel}
                          <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Request queue</CardTitle>
            <CardDescription>Completed tours that still need a feedback request.</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            {data.reviewCandidates.length === 0 ? (
              <EmptyState>Every completed tour already has a submitted review or request record.</EmptyState>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {data.reviewCandidates.map((candidate) => (
                    <div key={candidate.bookingId} className="rounded-md border p-3">
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium">{candidate.visitorName}</p>
                        <p className="line-clamp-1 break-all text-xs text-muted-foreground">{candidate.visitorEmail}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {candidate.bookingReference} · {formatDate(candidate.visitDate)}
                        </p>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard?.writeText(candidate.reviewLink);
                            toast({ title: "Review link copied" });
                          }}
                          aria-label={`Copy review link for ${candidate.bookingReference}`}
                        >
                          <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                          Copy
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => sendRequestMutation.mutate(candidate.bookingId)}
                          disabled={sendRequestMutation.isPending}
                        >
                          {sendRequestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                          Send request
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden min-w-0 overflow-x-auto md:block">
                  <Table className="min-w-[680px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visitor</TableHead>
                        <TableHead>Visit</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.reviewCandidates.map((candidate) => (
                        <TableRow key={candidate.bookingId}>
                          <TableCell>
                            <div className="line-clamp-1 font-medium">{candidate.visitorName}</div>
                            <div className="line-clamp-1 break-all text-xs text-muted-foreground">{candidate.visitorEmail}</div>
                          </TableCell>
                          <TableCell>{formatDate(candidate.visitDate)}</TableCell>
                          <TableCell>
                            <span className="line-clamp-1 break-all">{candidate.bookingReference}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard?.writeText(candidate.reviewLink);
                                  toast({ title: "Review link copied" });
                                }}
                                aria-label={`Copy review link for ${candidate.bookingReference}`}
                              >
                                <Copy className="h-4 w-4" aria-hidden="true" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => sendRequestMutation.mutate(candidate.bookingId)}
                                disabled={sendRequestMutation.isPending}
                              >
                                {sendRequestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                                Send request
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="min-w-0">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Moderation inbox</CardTitle>
              <CardDescription>Read the visitor feedback, check consent, respond, then publish or hide.</CardDescription>
            </div>
            <Badge variant="outline">
              {formatNumber(filteredReviews.length)} shown / {formatNumber(data.reviews.length)} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4">
          <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                name="reviewSearch"
                value={reviewSearch}
                onChange={(event) => setReviewSearch(event.target.value)}
                placeholder="Search visitor, reference, guide, country, comment…"
                className="pl-9"
              />
            </div>
            <Tabs value={reviewStatus} onValueChange={(value) => setReviewStatus(value as ReviewStatusFilter)}>
              <TabsList className="h-auto w-full flex-wrap justify-start xl:w-auto">
                {reviewStatusFilters.map((filter) => (
                  <TabsTrigger key={filter.value} value={filter.value}>
                    {filter.label} ({formatNumber(reviewCounts[filter.value])})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {visibleReviews.length === 0 ? (
            <EmptyState>
              {data.reviews.length === 0
                ? "No reviews yet. Send review requests after completed tours to start collecting feedback."
                : "No reviews match the current search or status filter."}
            </EmptyState>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {visibleReviews.map((review) => (
                  <div key={review.id} className="rounded-md border p-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex shrink-0" aria-label={`${review.rating || 0} out of 5 stars`}>
                          {ratingStars(review.rating)}
                        </div>
                        {reviewStatusBadge(review.status)}
                      </div>
                      <Link
                        href={`/reviews-performance/${review.id}`}
                        className="mt-2 line-clamp-1 font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {review.title || "Untitled review"}
                      </Link>
                      <p className="mt-1 line-clamp-1 break-words text-sm text-muted-foreground">
                        {review.visitorName} · {review.bookingReference}
                      </p>
                      {review.comment && (
                        <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-muted-foreground">{review.comment}</p>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant={review.consentTestimonial ? "default" : "outline"}>
                        {review.consentTestimonial ? "Testimonial ok" : "No testimonial"}
                      </Badge>
                      {review.responseText && <Badge variant="secondary">Response added</Badge>}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/reviews-performance/${review.id}`}>Details</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateReviewMutation.mutate({ id: review.id, status: review.status === "hidden" ? "pending" : "hidden" })}
                        disabled={updateReviewMutation.isPending}
                      >
                        {review.status === "hidden" ? "Mark pending" : "Hide"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden min-w-0 overflow-x-auto lg:block">
                <Table className="min-w-[920px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Review</TableHead>
                      <TableHead>Visitor</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Consent</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <Link
                              href={`/reviews-performance/${review.id}`}
                              className="line-clamp-1 font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              {review.title || "Untitled review"}
                            </Link>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                              {review.comment || "No written comment."}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0 text-sm">
                            <p className="line-clamp-1 font-medium">{review.visitorName}</p>
                            <p className="line-clamp-1 break-all text-xs text-muted-foreground">{review.bookingReference}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex" aria-label={`${review.rating || 0} out of 5 stars`}>
                            {ratingStars(review.rating)}
                          </div>
                        </TableCell>
                        <TableCell>{reviewStatusBadge(review.status)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant={review.consentTestimonial ? "default" : "outline"}>
                              {review.consentTestimonial ? "Testimonial" : "No testimonial"}
                            </Badge>
                            {review.responseText && <Badge variant="secondary">Response</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/reviews-performance/${review.id}`}>Details</Link>
                            </Button>
                            {review.status !== "published" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateReviewMutation.mutate({ id: review.id, status: "published" })}
                                disabled={!review.consentTestimonial || updateReviewMutation.isPending}
                              >
                                Publish
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateReviewMutation.mutate({ id: review.id, status: review.status === "hidden" ? "pending" : "hidden" })}
                              disabled={updateReviewMutation.isPending}
                            >
                              {review.status === "hidden" ? "Mark pending" : "Hide"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {filteredReviews.length > REVIEW_PAGE_SIZE && (
            <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {showingReviewsFrom}-{showingReviewsTo} of {filteredReviews.length} matching reviews
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReviewPage((page) => Math.max(1, page - 1))}
                  disabled={currentReviewPage === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReviewPage((page) => Math.min(reviewTotalPages, page + 1))}
                  disabled={currentReviewPage === reviewTotalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
