import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  MessageSquareText,
  Send,
  Star,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { SEO } from "@/components/seo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { TourReview } from "@shared/schema";
import { useState } from "react";

type Priority = "high" | "medium" | "low";

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

const priorityStyles: Record<Priority, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

function formatDate(value?: string | Date | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function ratingStars(rating?: number | null) {
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      className={`h-4 w-4 ${rating && index < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
    />
  ));
}

function reviewDetailItems(review: TourReview) {
  return [
    ["Country", review.country],
    ["Purpose", review.purposeOfVisit],
    ["Group size", review.groupSize],
    ["Heard via", review.referralSource],
    ["Guide", review.tourGuideName],
    ["Guide rating", review.guideExperience],
    ["Recommend", review.wouldRecommend],
    ["Visit again", review.wouldVisitAgain],
  ].filter(([, value]) => Boolean(value));
}

export default function ReviewsPerformance() {
  const { toast } = useToast();
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({});
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

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading reviews and opportunities…</div>;
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <SEO title="Reviews + Opportunities" description="Review collection and performance opportunities." />
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p>Could not load reviews and opportunities. Check whether the review migration has been applied.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    { label: "Listing views", value: data.stats.listingViews, icon: TrendingUp },
    { label: "Booking requests", value: data.stats.bookingRequestsLast30, icon: CheckCircle2 },
    { label: "Published reviews", value: data.stats.publishedReviews, icon: MessageSquareText },
    { label: "Average rating", value: data.stats.averageRating || "—", icon: Star },
    { label: "Pending requests", value: data.stats.pendingReviewRequests, icon: Mail },
    { label: "Failed emails", value: data.stats.failedEmailsLast30, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <SEO title="Reviews + Opportunities" description="Collect tour reviews and act on performance opportunities." />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Reviews + Performance Opportunities</h1>
        <p className="text-muted-foreground">
          Collect verified visitor reviews, publish the best feedback, and spot practical fixes that improve booking confidence.
        </p>
      </div>

      {data.setupIssues && data.setupIssues.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Some review dashboard data could not load</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {data.setupIssues.map((issue) => (
                <p key={issue.key}>
                  <span className="font-medium">{issue.label}:</span> {issue.message}
                </p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <Icon className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance opportunities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.opportunities.map((opportunity) => (
              <div key={opportunity.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{opportunity.title}</h2>
                      <Badge className={priorityStyles[opportunity.priority]}>{opportunity.priority}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{opportunity.description}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">{opportunity.metric}</Badge>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href={opportunity.href}>
                    {opportunity.actionLabel}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed tours needing review requests</CardTitle>
          </CardHeader>
          <CardContent>
            {data.reviewCandidates.length === 0 ? (
              <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                Every completed tour already has a submitted review or request record.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visitor</TableHead>
                      <TableHead>Visit</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.reviewCandidates.map((candidate) => (
                      <TableRow key={candidate.bookingId}>
                        <TableCell>
                          <div className="font-medium">{candidate.visitorName}</div>
                          <div className="text-xs text-muted-foreground">{candidate.visitorEmail}</div>
                        </TableCell>
                        <TableCell>{formatDate(candidate.visitDate)}</TableCell>
                        <TableCell>{candidate.bookingReference}</TableCell>
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
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => sendRequestMutation.mutate(candidate.bookingId)}
                              disabled={sendRequestMutation.isPending}
                            >
                              {sendRequestMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="mr-2 h-4 w-4" />
                              )}
                              Send
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Review inbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.reviews.length === 0 ? (
            <div className="rounded-lg border p-6 text-sm text-muted-foreground">
              No reviews yet. Send review requests after completed tours to start collecting feedback.
            </div>
          ) : (
            data.reviews.map((review) => (
              <div key={review.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex">{ratingStars(review.rating)}</div>
                      <Badge variant={review.status === "published" ? "default" : "secondary"}>{review.status}</Badge>
                      <span className="text-sm text-muted-foreground">{review.bookingReference}</span>
                    </div>
                    <h2 className="mt-2 font-semibold">{review.title || "Untitled review"}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {review.visitorName} · {formatDate(review.submittedAt || review.createdAt)}
                    </p>
                    {review.comment && <p className="mt-3 whitespace-pre-wrap text-sm">{review.comment}</p>}
                    {reviewDetailItems(review).length > 0 && (
                      <div className="mt-3 grid gap-2 rounded-lg bg-muted/40 p-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                        {reviewDetailItems(review).map(([label, value]) => (
                          <div key={`${label}-${value}`} className="min-w-0">
                            <div className="text-muted-foreground">{label}</div>
                            <div className="truncate font-medium">{value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {(review.enjoyedMost || review.improvementSuggestions || review.otherComments) && (
                      <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                        {review.enjoyedMost && (
                          <div className="rounded-lg border p-3">
                            <div className="font-medium">Enjoyed most</div>
                            <p className="mt-1 text-muted-foreground">{review.enjoyedMost}</p>
                          </div>
                        )}
                        {review.improvementSuggestions && (
                          <div className="rounded-lg border p-3">
                            <div className="font-medium">Improve</div>
                            <p className="mt-1 text-muted-foreground">{review.improvementSuggestions}</p>
                          </div>
                        )}
                        {review.otherComments && (
                          <div className="rounded-lg border p-3">
                            <div className="font-medium">Other comments</div>
                            <p className="mt-1 text-muted-foreground">{review.otherComments}</p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant={review.consentTestimonial ? "default" : "outline"}>
                        {review.consentTestimonial ? "Testimonial consent" : "No testimonial consent"}
                      </Badge>
                      {review.consentPhotos && <Badge variant="secondary">Photo consent</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateReviewMutation.mutate({ id: review.id, status: "published" })}
                      disabled={!review.consentTestimonial}
                      title={!review.consentTestimonial ? "Visitor did not consent to public testimonial use" : undefined}
                    >
                      Publish
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateReviewMutation.mutate({ id: review.id, status: "hidden" })}>
                      Hide
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateReviewMutation.mutate({ id: review.id, status: "pending" })}>
                      Pending
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto]">
                  <Textarea
                    value={responseDrafts[review.id] ?? review.responseText ?? ""}
                    onChange={(event) => setResponseDrafts((drafts) => ({ ...drafts, [review.id]: event.target.value }))}
                    placeholder="Optional public response…"
                    className="text-base md:text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateReviewMutation.mutate({ id: review.id, responseText: responseDrafts[review.id] ?? review.responseText ?? "" })}
                    disabled={updateReviewMutation.isPending}
                  >
                    Save response
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
