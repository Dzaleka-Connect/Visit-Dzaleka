import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  EyeOff,
  Loader2,
  Mail,
  MessageSquareText,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { SEO } from "@/components/seo";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TourReview } from "@shared/schema";

function formatDate(value?: string | Date | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatStatus(value?: string | null) {
  return String(value || "pending").replace(/_/g, " ");
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

function statusBadge(status?: string | null) {
  if (status === "published") return <Badge>Published</Badge>;
  if (status === "hidden") return <Badge variant="outline">Hidden</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

function DetailTile({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border bg-muted/25 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 break-words text-sm font-medium">{value || "Not set"}</div>
    </div>
  );
}

function TextSection({ title, value }: { title: string; value?: string | null }) {
  if (!value) return null;

  return (
    <div className="rounded-md border p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{value}</p>
    </div>
  );
}

export default function ReviewDetails() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const { toast } = useToast();
  const [responseText, setResponseText] = useState("");

  const { data: review, isLoading, isError } = useQuery<TourReview>({
    queryKey: [`/api/reviews/${reviewId}`],
    enabled: Boolean(reviewId),
  });

  useEffect(() => {
    setResponseText(review?.responseText || "");
  }, [review?.responseText]);

  const updateReviewMutation = useMutation({
    mutationFn: async ({ status, responseText }: { status?: string; responseText?: string }) => {
      const response = await apiRequest("PATCH", `/api/reviews/${reviewId}`, { status, responseText });
      return response.json() as Promise<TourReview>;
    },
    onSuccess: (updatedReview) => {
      queryClient.setQueryData([`/api/reviews/${reviewId}`], updatedReview);
      queryClient.invalidateQueries({ queryKey: ["/api/reviews-performance"] });
      toast({ title: "Review updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not update review", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !review) {
    return (
      <PageContainer>
        <SEO title="Review Not Found | Visit Dzaleka Admin" robots="noindex" />
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <div>
              <h1 className="text-xl font-semibold">Review not found</h1>
              <p className="mt-1 text-sm text-muted-foreground">This review may have been removed or you may not have access.</p>
            </div>
            <Button asChild>
              <Link href="/reviews-performance">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Back to reviews
              </Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const canPublish = Boolean(review.consentTestimonial);

  return (
    <PageContainer className="min-w-0">
      <SEO title={`${review.visitorName} Review | Visit Dzaleka Admin`} robots="noindex" />
      <PageHeader
        title={review.title || "Visitor review"}
        description={`${review.visitorName} · ${review.bookingReference}`}
      >
        <Button asChild variant="outline">
          <Link href="/reviews-performance">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to reviews
          </Link>
        </Button>
      </PageHeader>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                {statusBadge(review.status)}
                <Badge variant="outline">{review.bookingReference}</Badge>
                <div className="flex" aria-label={`${review.rating || 0} out of 5 stars`}>
                  {ratingStars(review.rating)}
                </div>
              </div>
              <CardTitle>Visitor feedback</CardTitle>
              <CardDescription>Full submitted review and experience notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {review.comment ? (
                <div className="rounded-md bg-muted/40 p-4">
                  <p className="whitespace-pre-wrap break-words text-sm leading-7">{review.comment}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No written comment was submitted.</p>
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailTile label="Country" value={review.country} />
                <DetailTile label="Purpose" value={review.purposeOfVisit} />
                <DetailTile label="Group size" value={review.groupSize} />
                <DetailTile label="Heard via" value={review.referralSource} />
                <DetailTile label="Guide" value={review.tourGuideName} />
                <DetailTile label="Guide rating" value={review.guideExperience} />
                <DetailTile label="Recommend" value={review.wouldRecommend} />
                <DetailTile label="Visit again" value={review.wouldVisitAgain} />
              </div>

              <div className="grid min-w-0 gap-4 lg:grid-cols-3">
                <TextSection title="Enjoyed most" value={review.enjoyedMost} />
                <TextSection title="Suggested improvement" value={review.improvementSuggestions} />
                <TextSection title="Other comments" value={review.otherComments} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Public response</CardTitle>
              <CardDescription>Optional reply shown with the review when published.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                name="responseText"
                value={responseText}
                onChange={(event) => setResponseText(event.target.value)}
                placeholder="Write a short public response…"
                className="min-h-32 text-base md:text-sm"
              />
              <Button
                variant="outline"
                onClick={() => updateReviewMutation.mutate({ responseText: responseText.trim() })}
                disabled={updateReviewMutation.isPending || responseText.trim() === (review.responseText || "").trim()}
              >
                {updateReviewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Save response
              </Button>
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Moderation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                onClick={() => updateReviewMutation.mutate({ status: "published" })}
                disabled={!canPublish || updateReviewMutation.isPending}
                title={!canPublish ? "Visitor did not consent to public testimonial use" : undefined}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Publish review
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => updateReviewMutation.mutate({ status: "pending" })}
                disabled={updateReviewMutation.isPending || review.status === "pending"}
              >
                <MessageSquareText className="mr-2 h-4 w-4" aria-hidden="true" />
                Mark pending
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => updateReviewMutation.mutate({ status: "hidden" })}
                disabled={updateReviewMutation.isPending || review.status === "hidden"}
              >
                <EyeOff className="mr-2 h-4 w-4" aria-hidden="true" />
                Hide review
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visitor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailTile label="Name" value={review.visitorName} />
              <DetailTile label="Email" value={review.visitorEmail} />
              <Button asChild variant="outline" className="w-full">
                <a href={`mailto:${review.visitorEmail}`}>
                  <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                  Email visitor
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consent & timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant={review.consentTestimonial ? "default" : "outline"}>
                  {review.consentTestimonial ? "Testimonial ok" : "No testimonial consent"}
                </Badge>
                <Badge variant={review.consentPhotos ? "secondary" : "outline"}>
                  {review.consentPhotos ? "Photo ok" : "No photo consent"}
                </Badge>
              </div>
              <DetailTile label="Source" value={<span className="capitalize">{formatStatus(review.source)}</span>} />
              <DetailTile label="Requested" value={formatDate(review.requestedAt)} />
              <DetailTile label="Submitted" value={formatDate(review.submittedAt)} />
              <DetailTile label="Published" value={formatDate(review.publishedAt)} />
              <DetailTile label="Updated" value={formatDate(review.updatedAt)} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
