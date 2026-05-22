import { Link, useParams } from "wouter";
import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Compass,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Users,
  XCircle,
} from "lucide-react";
import type { CommunityExperienceRequest, CommunityListing } from "@shared/schema";
import { SEO } from "@/components/seo";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AdminCommunityExperienceRequest extends CommunityExperienceRequest {
  listing?: CommunityListing | null;
}

function formatDate(date?: string | Date | null) {
  if (!date) return "No date";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(date));
}

function statusBadge(status?: string | null) {
  if (status === "confirmed") return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">Confirmed</Badge>;
  if (status === "declined" || status === "cancelled") return <Badge className="bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200">{status}</Badge>;
  if (status === "contacted") return <Badge variant="secondary">Contacted</Badge>;
  return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">Submitted</Badge>;
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border bg-muted/25 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 break-words text-sm font-medium">{children || "Not set"}</div>
    </div>
  );
}

export default function AdminCommunityExperienceRequestDetails() {
  const { requestId } = useParams<{ requestId: string }>();
  const { toast } = useToast();
  const [adminNotes, setAdminNotes] = useState("");

  const { data: request, isLoading, isError } = useQuery<AdminCommunityExperienceRequest>({
    queryKey: [`/api/admin/community-experience-requests/${requestId}`],
    enabled: Boolean(requestId),
  });

  useEffect(() => {
    setAdminNotes(request?.adminNotes || "");
  }, [request?.adminNotes]);

  const requestMutation = useMutation({
    mutationFn: async (payload: {
      status?: "contacted" | "confirmed" | "declined" | "cancelled";
      adminNotes?: string | null;
    }) => {
      const response = await apiRequest("PATCH", `/api/admin/community-experience-requests/${requestId}`, payload);
      return response.json() as Promise<AdminCommunityExperienceRequest>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/community-experience-requests/${requestId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community-experience-requests"] });
      toast({ title: "Request updated", description: "The internal request record has been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !request) {
    return (
      <PageContainer>
        <SEO title="Community Experience Request Not Found | Visit Dzaleka Admin" robots="noindex" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Compass className="h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-bold">Request not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">This internal request record could not be loaded.</p>
            <Button asChild className="mt-6">
              <Link href="/admin/community-listings">Back to request queue</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SEO title={`${request.visitorName} | Community Experience Request`} robots="noindex" />
      <PageHeader
        title={request.listing?.name || "Community experience request"}
        description="Internal request record from a visitor using the public Community Hub directory."
      >
        <Button asChild variant="outline">
          <Link href="/admin/community-listings">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                {statusBadge(request.status)}
                <Badge variant="outline">{request.groupSize} guest{request.groupSize === 1 ? "" : "s"}</Badge>
              </div>
              <CardTitle>Visitor request</CardTitle>
              <CardDescription>Use this to contact the visitor, check host availability, and confirm or decline.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Visitor">
                {request.visitorName}
              </DetailRow>
              <DetailRow label="Email">
                <span className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {request.visitorEmail}
                </span>
              </DetailRow>
              <DetailRow label="Phone / WhatsApp">
                <span className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {request.visitorPhone || "Not provided"}
                </span>
              </DetailRow>
              <DetailRow label="Preferred date">
                <span className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {formatDate(request.preferredDate)}{request.preferredTime ? ` at ${request.preferredTime}` : ""}
                </span>
              </DetailRow>
              <DetailRow label="Group size">
                <span className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {request.groupSize}
                </span>
              </DetailRow>
              <DetailRow label="Submitted">
                {formatDate(request.createdAt)}
              </DetailRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
                Visitor message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line break-words text-sm leading-7 text-muted-foreground">
                {request.message || "No message was included with this request."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal handling</CardTitle>
              <CardDescription>
                Staff-only notes for follow-up, host availability, and coordination decisions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label="Current status">
                  <span className="capitalize">{request.status}</span>
                </DetailRow>
                <DetailRow label="Last updated">
                  {formatDate(request.updatedAt)}
                </DetailRow>
              </div>
              <div className="space-y-2">
                <label htmlFor="community-request-admin-notes" className="text-sm font-medium">
                  Admin notes
                </label>
                <Textarea
                  id="community-request-admin-notes"
                  name="adminNotes"
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  placeholder="Add internal follow-up notes…"
                  className="min-h-32"
                />
              </div>
              <Button
                onClick={() => requestMutation.mutate({ adminNotes: adminNotes.trim() || null })}
                disabled={requestMutation.isPending || adminNotes.trim() === (request.adminNotes || "").trim()}
              >
                {requestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Save internal notes
              </Button>
            </CardContent>
          </Card>

          {request.listing && (
            <Card>
              <CardHeader>
                <CardTitle>Requested listing</CardTitle>
                <CardDescription>Internal reference for the listing this visitor requested.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                  {request.listing.imageUrl && (
                    <img
                      src={request.listing.imageUrl}
                      alt={request.listing.name}
                      className="h-32 w-full rounded-md border object-cover sm:w-44"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{request.listing.category}</Badge>
                      <Badge variant="outline">{request.listing.type}</Badge>
                    </div>
                    <h2 className="mt-3 break-words text-lg font-semibold">{request.listing.name}</h2>
                    <p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-muted-foreground">
                      {request.listing.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link href={`/admin/community-listings/${request.listing.id}`}>
                      Internal listing
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={`/community-hub/${request.listing.id}`} target="_blank" rel="noopener noreferrer">
                      <ArrowUpRight className="mr-2 h-4 w-4" aria-hidden="true" />
                      Public page
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Request actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => requestMutation.mutate({ status: "contacted" })}
                disabled={requestMutation.isPending || request.status === "contacted"}
              >
                Mark contacted
              </Button>
              <Button
                className="w-full"
                onClick={() => requestMutation.mutate({ status: "confirmed" })}
                disabled={requestMutation.isPending || request.status === "confirmed"}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Confirm request
              </Button>
              <Button
                className="w-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                variant="outline"
                onClick={() => requestMutation.mutate({ status: "declined" })}
                disabled={requestMutation.isPending || request.status === "declined"}
              >
                <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                Decline request
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => requestMutation.mutate({ status: "cancelled" })}
                disabled={requestMutation.isPending || request.status === "cancelled"}
              >
                Cancel request
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Direct contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <a href={`mailto:${request.visitorEmail}`}>
                  <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                  Email visitor
                </a>
              </Button>
              {request.visitorPhone && (
                <Button asChild className="w-full" variant="outline">
                  <a href={`tel:${request.visitorPhone}`}>
                    <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                    Call visitor
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
