import { useState } from "react";
import { Link, useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  UserCheck,
  XCircle,
} from "lucide-react";
import { SEO } from "@/components/seo";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Guide, GuideProfileChangeRequest } from "@shared/schema";

interface AdminGuideProfileChangeRequest extends GuideProfileChangeRequest {
  guide?: Pick<Guide, "id" | "firstName" | "lastName" | "email" | "phone" | "profileImageUrl"> | null;
  submittedBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  reviewedBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

function createGuideSlug(firstName: string, lastName: string) {
  return `${firstName}-${lastName}`
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
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

function formatStatusLabel(status?: string | null) {
  return String(status || "pending").replace(/_/g, " ");
}

function formatFieldLabel(field: string) {
  return field.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function formatProfileValue(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "None";
  if (value === null || value === undefined || value === "") return "None";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function personName(person?: { firstName: string | null; lastName: string | null; email: string } | null) {
  if (!person) return "Not recorded";
  return [person.firstName, person.lastName].filter(Boolean).join(" ") || person.email;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1 break-words text-sm font-medium">{value}</div>
    </div>
  );
}

function ProfileValue({ field, value }: { field: string; value: unknown }) {
  const display = formatProfileValue(value);
  const isImage = field === "profileImageUrl" && typeof value === "string" && value.length > 0;

  if (isImage) {
    return (
      <div className="space-y-2">
        <img
          src={value}
          alt=""
          width={64}
          height={64}
          className="h-16 w-16 rounded-md border object-cover"
        />
        <a href={value} className="break-all text-xs text-primary underline-offset-4 hover:underline">
          {value}
        </a>
      </div>
    );
  }

  return <p className="whitespace-pre-wrap break-words text-sm">{display}</p>;
}

export default function GuideProfileReviewDetails() {
  const [, params] = useRoute("/admin/guide-profile-reviews/:id");
  const requestId = params?.id || "";
  const { toast } = useToast();
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: request, isLoading, error } = useQuery<AdminGuideProfileChangeRequest>({
    queryKey: [`/api/admin/guide-profile-change-requests/${requestId}`],
    enabled: Boolean(requestId),
  });

  const decisionMutation = useMutation({
    mutationFn: async ({ decision, notes }: { decision: "approved" | "rejected"; notes?: string }) => {
      const response = await apiRequest("POST", `/api/admin/guide-profile-change-requests/${requestId}/decision`, {
        decision,
        notes: notes?.trim() || null,
      });
      return response.json();
    },
    onSuccess: (payload: { request: AdminGuideProfileChangeRequest | null }) => {
      if (payload.request) {
        queryClient.setQueryData([`/api/admin/guide-profile-change-requests/${requestId}`], payload.request);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guide-profile-change-requests?status=pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guides"] });
      toast({
        title: "Profile review saved",
        description: "The guide profile review status has been updated.",
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

  if (error || !request) {
    return (
      <PageContainer>
        <SEO title="Guide Profile Review Not Found" robots="noindex" />
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground" />
            <div>
              <h1 className="text-xl font-semibold">Review not found</h1>
              <p className="mt-1 text-sm text-muted-foreground">This guide profile review may have been removed or you may not have access.</p>
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

  const proposedData = (request.proposedData || {}) as Record<string, unknown>;
  const currentData = (request.currentData || {}) as Record<string, unknown>;
  const changedFields = Object.keys(proposedData);
  const guideName = request.guide ? `${request.guide.firstName} ${request.guide.lastName}` : "Guide profile";
  const guideInitials = request.guide ? `${request.guide.firstName?.[0] || ""}${request.guide.lastName?.[0] || ""}` : "G";
  const isPending = request.status === "pending";

  return (
    <PageContainer className="page-spacing">
      <SEO
        title={`Guide Profile Review ${guideName}`}
        description="Review guide profile change requests before publishing public guide details."
        robots="noindex"
      />
      <PageHeader title="Guide Profile Review" description={`${guideName} · ${changedFields.length} proposed change${changedFields.length === 1 ? "" : "s"}`}>
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
                  <UserCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                  Proposed Changes
                </CardTitle>
                <CardDescription>Compare the current public guide profile against the guide-submitted update.</CardDescription>
              </div>
              <Badge variant={request.status === "rejected" ? "destructive" : request.status === "approved" ? "default" : "secondary"} className="capitalize">
                {formatStatusLabel(request.status)}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {changedFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No profile fields were included in this request.</p>
              ) : (
                changedFields.map((field) => (
                  <div key={field} className="rounded-lg border p-4">
                    <h2 className="break-words text-sm font-semibold">{formatFieldLabel(field)}</h2>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-md bg-muted/50 p-3">
                        <Label className="text-xs text-muted-foreground">Current</Label>
                        <div className="mt-2">
                          <ProfileValue field={field} value={currentData[field]} />
                        </div>
                      </div>
                      <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                        <Label className="text-xs text-muted-foreground">Proposed</Label>
                        <div className="mt-2">
                          <ProfileValue field={field} value={proposedData[field]} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Decision</CardTitle>
              <CardDescription>Approve to publish these changes, or reject with a note for the guide.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <DetailRow label="Current Status" value={<span className="capitalize">{formatStatusLabel(request.status)}</span>} />
                <DetailRow label="Reviewed By" value={personName(request.reviewedBy)} />
                <DetailRow label="Reviewed At" value={formatDateTime(request.reviewedAt)} />
              </div>
              {request.reviewNotes && (
                <div className="rounded-md border bg-muted/50 p-3">
                  <Label className="text-xs text-muted-foreground">Existing Review Notes</Label>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm">{request.reviewNotes}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="review-notes">Review Notes</Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  placeholder="Add a short approval note or explain what needs changing…"
                  className="min-h-[120px]"
                  disabled={!isPending || decisionMutation.isPending}
                />
              </div>
              <div className="grid gap-2 sm:flex sm:flex-wrap">
                <Button
                  disabled={!isPending || decisionMutation.isPending}
                  onClick={() => decisionMutation.mutate({ decision: "approved", notes: reviewNotes })}
                >
                  {decisionMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Approve Changes
                </Button>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                  disabled={!isPending || decisionMutation.isPending}
                  onClick={() => decisionMutation.mutate({ decision: "rejected", notes: reviewNotes })}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={request.guide?.profileImageUrl || undefined} alt={guideName} />
                  <AvatarFallback>{guideInitials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold">{guideName}</p>
                  <p className="break-words text-xs text-muted-foreground">{request.guide?.email || "No email recorded"}</p>
                </div>
              </div>
              <DetailRow label="Phone" value={request.guide?.phone || "Not provided"} />
              <DetailRow label="Submitted By" value={personName(request.submittedBy)} />
              <DetailRow label="Submitted At" value={formatDateTime(request.createdAt)} />
              <div className="grid gap-2">
                {request.guide && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/guide/${createGuideSlug(request.guide.firstName, request.guide.lastName)}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Public Profile
                    </Link>
                  </Button>
                )}
                {request.guide?.phone && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`tel:${request.guide.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call Guide
                    </a>
                  </Button>
                )}
                {request.guide?.email && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`mailto:${request.guide.email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Email Guide
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
