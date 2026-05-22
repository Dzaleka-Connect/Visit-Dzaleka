import { Link, useParams } from "wouter";
import type { ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Compass,
  HeartHandshake,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  XCircle,
} from "lucide-react";
import type { CommunityListing } from "@shared/schema";
import { SEO } from "@/components/seo";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const publicStatuses = new Set(["approved", "live", "published"]);

function statusBadge(status?: string | null) {
  if (publicStatuses.has(String(status || ""))) {
    return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">Live</Badge>;
  }
  if (status === "rejected") {
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200">Rejected</Badge>;
  }
  return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">Needs review</Badge>;
}

function listingTypeLabel(type?: string | null) {
  return type === "initiative" ? "Project or initiative" : "Business or artisan";
}

function formatDate(date?: string | Date | null) {
  if (!date) return "No date";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

function formatCurrency(amount?: number | null, currency = "MWK") {
  if (!amount) return "Not set";
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function DetailRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border bg-muted/25 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 break-words text-sm font-medium">{value || "Not set"}</div>
    </div>
  );
}

export default function AdminCommunityListingDetails() {
  const { listingId } = useParams<{ listingId: string }>();
  const { toast } = useToast();

  const { data: listing, isLoading, isError } = useQuery<CommunityListing>({
    queryKey: [`/api/admin/community-listings/${listingId}`],
    enabled: Boolean(listingId),
  });

  const statusMutation = useMutation({
    mutationFn: async (status: "approved" | "pending" | "rejected") => {
      const response = await apiRequest("PATCH", `/api/admin/community-listings/${listingId}`, { status });
      return response.json() as Promise<CommunityListing>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/community-listings/${listingId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/community-listings"] });
      toast({ title: "Listing updated", description: "The listing status has been saved." });
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

  if (isError || !listing) {
    return (
      <PageContainer>
        <SEO title="Community Listing Not Found | Visit Dzaleka Admin" robots="noindex" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-bold">Listing not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">This internal listing record could not be loaded.</p>
            <Button asChild className="mt-6">
              <Link href="/admin/community-listings">Back to listings</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const isLive = publicStatuses.has(String(listing.status || ""));

  return (
    <PageContainer>
      <SEO title={`${listing.name} | Community Listing Admin`} robots="noindex" />
      <PageHeader
        title={listing.name}
        description="Internal listing record, moderation status, public content, contact details, and experience setup."
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
                {statusBadge(listing.status)}
                <Badge variant="outline">{listingTypeLabel(listing.type)}</Badge>
                <Badge variant="secondary">{listing.category}</Badge>
              </div>
              <CardTitle className="break-words text-xl">Public content</CardTitle>
              <CardDescription>Exactly what staff should review before publishing or updating the directory.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {listing.imageUrl && (
                <div className="overflow-hidden rounded-md border bg-muted">
                  <img src={listing.imageUrl} alt={listing.name} className="aspect-[16/9] w-full object-cover" />
                </div>
              )}
              <p className="whitespace-pre-line break-words text-sm leading-7 text-muted-foreground">
                {listing.description}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label="Location" value={<span className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{listing.location}</span>} />
                <DetailRow label="Submitted by" value={listing.submittedBy || "Internal admin record"} />
                <DetailRow label="Created" value={formatDate(listing.createdAt)} />
                <DetailRow label="Updated" value={formatDate(listing.updatedAt)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                Needs and internal notes
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border bg-muted/25 p-4">
                <p className="text-sm font-semibold">Needs / material support</p>
                <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">
                  {listing.needs || "No needs listed."}
                </p>
              </div>
              <div className="rounded-md border bg-muted/25 p-4">
                <p className="text-sm font-semibold">Moderation notes</p>
                <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">
                  {listing.moderationNotes || "No internal notes."}
                </p>
              </div>
            </CardContent>
          </Card>

          {listing.offersExperience && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Compass className="h-5 w-5 text-primary" aria-hidden="true" />
                  Visitor experience setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-line break-words text-sm leading-7 text-muted-foreground">
                  {listing.experienceDetails || "Experience details not added."}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <DetailRow label="Price" value={formatCurrency(listing.experiencePrice, listing.experienceCurrency || "MWK")} />
                  <DetailRow label="Duration" value={listing.experienceDurationMinutes ? `${listing.experienceDurationMinutes} minutes` : "Not set"} />
                  <DetailRow label="Guests" value={listing.experienceMaxGuests ? `${listing.experienceMinGuests || 1}-${listing.experienceMaxGuests}` : `${listing.experienceMinGuests || 1}+`} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-md border bg-muted/25 p-4">
                    <p className="text-sm font-semibold">Booking notes</p>
                    <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">
                      {listing.experienceBookingNotes || "No booking notes."}
                    </p>
                  </div>
                  <div className="rounded-md border bg-muted/25 p-4">
                    <p className="text-sm font-semibold">Impact statement</p>
                    <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">
                      {listing.impactStatement || "No impact statement."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!isLive && (
                <Button className="w-full" onClick={() => statusMutation.mutate("approved")} disabled={statusMutation.isPending}>
                  <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  Publish listing
                </Button>
              )}
              {listing.status !== "pending" && (
                <Button className="w-full" variant="outline" onClick={() => statusMutation.mutate("pending")} disabled={statusMutation.isPending}>
                  Needs review
                </Button>
              )}
              {listing.status !== "rejected" && (
                <Button
                  className="w-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                  variant="outline"
                  onClick={() => statusMutation.mutate("rejected")}
                  disabled={statusMutation.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  Reject listing
                </Button>
              )}
              {isLive && (
                <Button asChild className="w-full" variant="outline">
                  <a href={`/community-hub/${listing.id}`} target="_blank" rel="noopener noreferrer">
                    <ArrowUpRight className="mr-2 h-4 w-4" aria-hidden="true" />
                    View public page
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {listing.type === "initiative" ? <HeartHandshake className="h-5 w-5 text-emerald-600" aria-hidden="true" /> : <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />}
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow label="Contact name" value={listing.contactName} />
              <DetailRow label="Phone / WhatsApp" value={<span className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{listing.contactPhone}</span>} />
              <DetailRow label="Email" value={listing.contactEmail ? <span className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{listing.contactEmail}</span> : "Not set"} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
