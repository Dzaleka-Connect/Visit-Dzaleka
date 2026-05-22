import { useState } from "react";
import { Link, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  HeartHandshake,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  PlusCircle,
  Users,
} from "lucide-react";
import {
  insertCommunityExperienceRequestSchema,
  type Booking,
  type CommunityListing,
  type InsertCommunityExperienceRequest,
} from "@shared/schema";
import { SEO } from "@/components/seo";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

const SITE_URL = "https://visit.dzaleka.com";
const FALLBACK_IMAGE =
  "https://tumainiletu.org/wp-content/uploads/2021/07/Website-Entrepreneurship-and-innovation-2048x1536.jpg";

const defaultExperienceRequestValues: InsertCommunityExperienceRequest = {
  listingId: "",
  visitorName: "",
  visitorEmail: "",
  visitorPhone: "",
  preferredDate: "",
  preferredTime: "",
  groupSize: 1,
  message: "",
};

function listingTypeLabel(type?: string | null) {
  return type === "initiative" ? "Project / Initiative" : "Business / Artisan";
}

function formatExperiencePrice(listing: CommunityListing) {
  if (!listing.experiencePrice) return "Price confirmed after request";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: listing.experienceCurrency || "MWK",
    maximumFractionDigits: 0,
  }).format(listing.experiencePrice);
}

function formatDuration(minutes?: number | null) {
  if (!minutes) return "Duration varies";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
}

function whatsappHref(listing: CommunityListing) {
  const phone = listing.contactPhone.replace(/[^\d]/g, "");
  const message = `Hello ${listing.contactName}, I saw your listing on Visit Dzaleka.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function findNearestUpcomingConfirmedBooking(bookings: Booking[] = []) {
  const now = new Date();
  return bookings
    .filter((booking) => booking.status === "confirmed")
    .filter((booking) => new Date(`${booking.visitDate}T${booking.visitTime || "00:00"}`).getTime() >= now.getTime())
    .sort((a, b) =>
      new Date(`${a.visitDate}T${a.visitTime || "00:00"}`).getTime() -
      new Date(`${b.visitDate}T${b.visitTime || "00:00"}`).getTime()
    )[0] || null;
}

export default function CommunityListingDetails() {
  const { listingId } = useParams<{ listingId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  const { data: listing, isLoading, isError } = useQuery<CommunityListing>({
    queryKey: [`/api/public/community-listings/${listingId}`],
    enabled: Boolean(listingId),
  });

  const { data: myBookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/my-bookings"],
    enabled: user?.role === "visitor",
  });

  const requestForm = useForm<InsertCommunityExperienceRequest>({
    resolver: zodResolver(insertCommunityExperienceRequestSchema),
    defaultValues: defaultExperienceRequestValues,
  });

  const requestMutation = useMutation({
    mutationFn: async (values: InsertCommunityExperienceRequest) => {
      const response = await fetch("/api/public/community-experience-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          listingId: listing?.id || values.listingId,
          visitorName: values.visitorName.trim(),
          visitorEmail: values.visitorEmail.trim(),
          visitorPhone: values.visitorPhone?.trim() || null,
          preferredTime: values.preferredTime?.trim() || null,
          groupSize: Number(values.groupSize) || 1,
          message: values.message?.trim() || null,
        }),
      });

      if (!response.ok) {
        const message = await response.json().catch(() => null);
        throw new Error(message?.message || "Failed to send experience request");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request sent",
        description: "We will check host availability and follow up with you.",
      });
      requestForm.reset(defaultExperienceRequestValues);
      setIsRequestOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const highlightTargetBooking = user?.role === "visitor"
    ? findNearestUpcomingConfirmedBooking(myBookings)
    : null;

  const isHighlighted = Boolean(
    listing && highlightTargetBooking?.selectedCommunityListings?.includes(listing.id)
  );

  const addHighlightMutation = useMutation({
    mutationFn: async () => {
      if (!listing || !highlightTargetBooking) throw new Error("No upcoming confirmed booking found");
      const currentIds = highlightTargetBooking.selectedCommunityListings || [];
      const selectedCommunityListings = currentIds.includes(listing.id)
        ? currentIds
        : [...currentIds, listing.id];
      const response = await apiRequest("PATCH", `/api/bookings/${highlightTargetBooking.id}/community-highlights`, {
        selectedCommunityListings,
      });
      return response.json() as Promise<Booking>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-bookings"] });
      toast({
        title: "Added to your tour highlights",
        description: "Your guide will see this as a suggestion while preparing the tour.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not add highlight",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PublicHeader activePath="/community-hub" />
        <main className="flex-1">
          <section className="border-b bg-muted/30 px-4 py-10">
            <div className="mx-auto max-w-6xl space-y-4">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SEO title="Listing Not Found | Visit Dzaleka" description="The Community Hub listing could not be found." robots="noindex" />
        <PublicHeader activePath="/community-hub" />
        <main className="flex flex-1 items-center justify-center px-4 py-16 text-center">
          <div className="max-w-md">
            <h1 className="text-2xl font-bold">Listing not found</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This listing may have been removed or is no longer public.
            </p>
            <Button asChild className="mt-6">
              <Link href="/community-hub">Back to Community Hub</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const imageUrl = listing.imageUrl || FALLBACK_IMAGE;
  const canonical = `${SITE_URL}/community-hub/${listing.id}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": listing.type === "initiative" ? "Organization" : "LocalBusiness",
    name: listing.name,
    description: listing.description,
    image: imageUrl,
    url: canonical,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dzaleka Refugee Camp",
      addressCountry: "MW",
    },
    telephone: listing.contactPhone,
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title={`${listing.name} | Dzaleka Community Hub`}
        description={listing.description}
        canonical={canonical}
        ogImage={imageUrl}
        imageAlt={listing.name}
        keywords={`${listing.name}, ${listing.category}, Dzaleka Community Hub, Visit Dzaleka`}
        structuredData={structuredData}
      />
      <PublicHeader activePath="/community-hub" />

      <main className="flex-1">
        <section className="border-b bg-muted/20 px-4 py-6 sm:py-8">
          <div className="mx-auto max-w-6xl">
            <Button asChild variant="ghost" className="-ml-3 mb-4 min-h-10">
              <Link href="/community-hub">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Back to Community Hub
              </Link>
            </Button>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{listing.category}</Badge>
                  <Badge variant="outline">{listingTypeLabel(listing.type)}</Badge>
                  {listing.offersExperience && <Badge variant="outline">Visitor experience</Badge>}
                  {listing.needs && <Badge variant="outline">Needs listed</Badge>}
                </div>

                <h1 className="mt-4 max-w-4xl break-words text-3xl font-bold tracking-tight sm:text-5xl">
                  {listing.name}
                </h1>
                <p className="mt-4 flex items-start gap-2 break-words text-base text-muted-foreground">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {listing.location}
                </p>
                <p className="mt-5 max-w-3xl break-words text-base leading-7 text-muted-foreground">
                  {listing.description}
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border bg-muted">
                <img
                  src={imageUrl}
                  alt={listing.name}
                  width={840}
                  height={620}
                  className="aspect-[4/3] h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:py-10">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About this listing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line break-words text-sm leading-7 text-muted-foreground">
                    {listing.description}
                  </p>
                </CardContent>
              </Card>

              {listing.needs && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                      Needs and material support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line break-words text-sm leading-7 text-muted-foreground">
                      {listing.needs}
                    </p>
                  </CardContent>
                </Card>
              )}

              {listing.offersExperience && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Compass className="h-5 w-5 text-primary" aria-hidden="true" />
                      Visitor experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {listing.experienceDetails && (
                      <p className="whitespace-pre-line break-words text-sm leading-7 text-muted-foreground">
                        {listing.experienceDetails}
                      </p>
                    )}

                    <div className="grid gap-3 text-sm sm:grid-cols-3">
                      <div className="rounded-md border bg-muted/30 p-3">
                        <span className="block text-xs font-medium text-muted-foreground">Price</span>
                        <span className="mt-1 block break-words font-semibold">{formatExperiencePrice(listing)}</span>
                      </div>
                      <div className="rounded-md border bg-muted/30 p-3">
                        <span className="block text-xs font-medium text-muted-foreground">Duration</span>
                        <span className="mt-1 block font-semibold">{formatDuration(listing.experienceDurationMinutes)}</span>
                      </div>
                      <div className="rounded-md border bg-muted/30 p-3">
                        <span className="block text-xs font-medium text-muted-foreground">Guests</span>
                        <span className="mt-1 flex items-center gap-1 font-semibold">
                          <Users className="h-4 w-4" aria-hidden="true" />
                          {listing.experienceMaxGuests
                            ? `${listing.experienceMinGuests || 1}-${listing.experienceMaxGuests}`
                            : `${listing.experienceMinGuests || 1}+`}
                        </span>
                      </div>
                    </div>

                    {listing.experienceBookingNotes && (
                      <div className="rounded-md border bg-muted/30 p-3 text-sm">
                        <p className="font-medium">Booking notes</p>
                        <p className="mt-1 whitespace-pre-line break-words leading-6 text-muted-foreground">
                          {listing.experienceBookingNotes}
                        </p>
                      </div>
                    )}

                    {listing.impactStatement && (
                      <div className="rounded-md border bg-muted/30 p-3 text-sm">
                        <p className="font-medium">Community impact</p>
                        <p className="mt-1 whitespace-pre-line break-words leading-6 text-muted-foreground">
                          {listing.impactStatement}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-20">
              <Card>
                <CardHeader>
                  <CardTitle>Contact and next steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border bg-muted/30 p-3 text-sm">
                    <span className="block text-xs font-medium text-muted-foreground">Contact person</span>
                    <span className="mt-1 block break-words font-semibold">{listing.contactName}</span>
                  </div>

                  <div className="space-y-2">
                    <Button asChild className="min-h-11 w-full">
                      <a href={whatsappHref(listing)} target="_blank" rel="noopener noreferrer">
                        <MessageSquare className="mr-2 h-4 w-4" aria-hidden="true" />
                        WhatsApp
                      </a>
                    </Button>

                    {listing.contactEmail ? (
                      <Button asChild variant="outline" className="min-h-11 w-full">
                        <a href={`mailto:${listing.contactEmail}`}>
                          <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                          Email
                        </a>
                      </Button>
                    ) : (
                      <Button asChild variant="outline" className="min-h-11 w-full">
                        <a href={`tel:${listing.contactPhone}`}>
                          <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                          Call
                        </a>
                      </Button>
                    )}

                    {listing.offersExperience && (
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 w-full"
                        onClick={() => {
                          requestForm.reset({
                            ...defaultExperienceRequestValues,
                            listingId: listing.id,
                            groupSize: listing.experienceMinGuests || 1,
                          });
                          setIsRequestOpen(true);
                        }}
                      >
                        <Compass className="mr-2 h-4 w-4" aria-hidden="true" />
                        Request experience
                      </Button>
                    )}

                    {highlightTargetBooking && (
                      <Button
                        type="button"
                        variant={isHighlighted ? "secondary" : "outline"}
                        className="min-h-11 w-full"
                        disabled={addHighlightMutation.isPending || isHighlighted}
                        onClick={() => addHighlightMutation.mutate()}
                      >
                        {isHighlighted ? (
                          <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                        ) : addHighlightMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                        )}
                        {isHighlighted ? "Added to tour highlights" : "Add to my tour"}
                      </Button>
                    )}
                  </div>

                  <p className="break-words text-xs leading-5 text-muted-foreground">
                    If you add this to your tour highlights, your guide will treat it as a suggestion and decide what fits based on timing, availability, and logistics.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex gap-3 p-4 text-sm">
                  <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <p className="break-words leading-6 text-muted-foreground">
                    The Community Hub is a directory. Prices, timing, meeting points, and availability should be confirmed before visiting.
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>
        </section>
      </main>

      <Dialog
        open={isRequestOpen}
        onOpenChange={(open) => {
          setIsRequestOpen(open);
          if (!open) requestForm.reset(defaultExperienceRequestValues);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Request {listing.name}</DialogTitle>
            <DialogDescription>
              Send your preferred date and group size. Visit Dzaleka will confirm host availability before anything is final.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-medium">{formatExperiencePrice(listing)}</p>
            <p className="mt-1 text-muted-foreground">
              {formatDuration(listing.experienceDurationMinutes)}
              {listing.experienceMaxGuests
                ? ` - ${listing.experienceMinGuests || 1}-${listing.experienceMaxGuests} guests`
                : ""}
            </p>
          </div>

          <Form {...requestForm}>
            <form
              className="space-y-4"
              onSubmit={requestForm.handleSubmit((values) => requestMutation.mutate(values))}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={requestForm.control}
                  name="visitorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name…" autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={requestForm.control}
                  name="visitorEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          inputMode="email"
                          placeholder="name@example.com…"
                          autoComplete="email"
                          spellCheck={false}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={requestForm.control}
                  name="preferredDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={requestForm.control}
                  name="preferredTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={requestForm.control}
                  name="groupSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guests</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          inputMode="numeric"
                          {...field}
                          onChange={(event) => field.onChange(Number(event.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={requestForm.control}
                name="visitorPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone / WhatsApp</FormLabel>
                    <FormControl>
                      <Input type="tel" inputMode="tel" placeholder="+265 999 000 000…" autoComplete="tel" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={requestForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us what you would like to do, accessibility needs, or timing constraints…"
                        className="min-h-24"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsRequestOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={requestMutation.isPending}>
                  {requestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                  Send request
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}
