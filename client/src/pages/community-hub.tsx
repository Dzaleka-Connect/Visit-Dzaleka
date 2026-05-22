import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Compass,
  HeartHandshake,
  Info,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  PlusCircle,
  Search,
  Sparkles,
} from "lucide-react";
import {
  insertCommunityExperienceRequestSchema,
  insertCommunityListingSchema,
  type CommunityListing,
  type Booking,
  type InsertCommunityExperienceRequest,
  type InsertCommunityListing,
} from "@shared/schema";
import { SEO } from "@/components/seo";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

const HERO_IMAGE =
  "https://tumainiletu.org/wp-content/uploads/2021/07/Website-Entrepreneurship-and-innovation-2048x1536.jpg";

const defaultListingValues: InsertCommunityListing = {
  name: "",
  type: "business",
  category: "",
  description: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  location: "",
  imageUrl: "",
  needs: "",
  offersExperience: false,
  experienceDetails: "",
};

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

const supportHighlights = [
  {
    icon: Sparkles,
    title: "Handmade Art & Crafts",
    description: "Find paintings, jewelry, tailoring, and other work made by Dzaleka creators.",
  },
  {
    icon: Compass,
    title: "Resident-Led Experiences",
    description: "Discover workshops, cooking sessions, and hands-on activities hosted by local residents.",
  },
  {
    icon: HeartHandshake,
    title: "Community Needs",
    description: "See vetted supply needs from community projects before you visit.",
  },
];

const directoryGuideNotes = [
  {
    title: "For visitors",
    description: "Browse listings, contact providers directly, and confirm prices, timing, meeting points, and availability before arriving.",
  },
  {
    title: "For providers",
    description: "Submit clear details for your business, project, workshop, or supply need. The Visit Dzaleka team reviews listings before publishing.",
  },
  {
    title: "For hosted experiences",
    description: "Requests are not instant bookings. They depend on provider availability, group size, date, time, and activity type.",
  },
];

function trimSubmissionValues(values: InsertCommunityListing): InsertCommunityListing {
  const offersExperience = Boolean(values.offersExperience);

  return {
    ...values,
    name: values.name.trim(),
    type: values.type.trim(),
    category: values.category.trim(),
    description: values.description.trim(),
    contactName: values.contactName.trim(),
    contactPhone: values.contactPhone.trim(),
    contactEmail: values.contactEmail?.trim() || null,
    location: values.location.trim(),
    imageUrl: values.imageUrl?.trim() || null,
    needs: values.needs?.trim() || null,
    offersExperience,
    experienceDetails: offersExperience ? values.experienceDetails?.trim() || null : null,
  };
}

function listingIcon(type: string) {
  return type === "business" ? (
    <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
  ) : (
    <HeartHandshake className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
  );
}

function listingTypeLabel(type: string) {
  return type === "business" ? "Business / Artisan" : "Project / Initiative";
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

export default function CommunityHub() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [requestListing, setRequestListing] = useState<CommunityListing | null>(null);

  const { data: listings = [], isLoading } = useQuery<CommunityListing[]>({
    queryKey: ["/api/public/community-listings"],
  });

  const { data: myBookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/my-bookings"],
    enabled: user?.role === "visitor",
  });

  const form = useForm<InsertCommunityListing>({
    resolver: zodResolver(insertCommunityListingSchema),
    defaultValues: defaultListingValues,
  });

  const watchOffersExperience = form.watch("offersExperience");

  const requestForm = useForm<InsertCommunityExperienceRequest>({
    resolver: zodResolver(insertCommunityExperienceRequestSchema),
    defaultValues: defaultExperienceRequestValues,
  });

  const submitMutation = useMutation({
    mutationFn: async (values: InsertCommunityListing) => {
      const response = await fetch("/api/public/community-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trimSubmissionValues(values)),
      });

      if (!response.ok) {
        const message = await response.json().catch(() => null);
        throw new Error(message?.message || "Failed to submit listing");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Listing submitted",
        description: "Thanks. The Visit Dzaleka team will review it before it appears publicly.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/public/community-listings"] });
      form.reset(defaultListingValues);
      setIsSubmitOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const requestMutation = useMutation({
    mutationFn: async (values: InsertCommunityExperienceRequest) => {
      const response = await fetch("/api/public/community-experience-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          listingId: requestListing?.id || values.listingId,
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
      setRequestListing(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addHighlightMutation = useMutation({
    mutationFn: async ({ booking, listingId }: { booking: Booking; listingId: string }) => {
      const currentIds = booking.selectedCommunityListings || [];
      const selectedCommunityListings = currentIds.includes(listingId)
        ? currentIds
        : [...currentIds, listingId];
      const response = await apiRequest("PATCH", `/api/bookings/${booking.id}/community-highlights`, {
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

	  const filteredListings = listings.filter((item) => {
    const tabMatches =
      activeTab === "all" ||
      (activeTab === "business" && item.type === "business") ||
      (activeTab === "initiative" && item.type === "initiative");

    const term = searchQuery.trim().toLowerCase();
    const searchMatches =
      term.length === 0 ||
      item.name.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.location.toLowerCase().includes(term) ||
      Boolean(item.needs?.toLowerCase().includes(term));

	    return tabMatches && searchMatches;
	  });

  const highlightTargetBooking = user?.role === "visitor"
    ? findNearestUpcomingConfirmedBooking(myBookings)
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Dzaleka Community Listings | Visit Dzaleka"
        description="Browse refugee-led businesses, artisans, eateries, workshops, and community initiatives in Dzaleka."
        canonical="https://visit.dzaleka.com/community-hub"
        ogImage={HERO_IMAGE}
        imageAlt="Dzaleka community entrepreneurship and innovation session"
        keywords="Dzaleka community listings, refugee-led businesses, Dzaleka artisans, Malawi community tourism, Dzaleka workshops"
      />
      <PublicHeader activePath="/community-hub" />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <img
            src={HERO_IMAGE}
            alt="Dzaleka community entrepreneurship and innovation session"
            className="absolute inset-0 h-full w-full object-cover opacity-45"
            width={2048}
            height={1536}
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-slate-950/55" aria-hidden="true" />
          <div className="container relative mx-auto px-4 py-10 sm:py-12 lg:py-16">
            <div className="max-w-2xl">
              <Badge className="mb-3 bg-white/15 text-white hover:bg-white/20">
                Community listings
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Support Dzaleka makers, businesses, and projects
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
                Browse resident-led shops, artisans, eateries, workshops, and vetted supply needs. Every direct connection helps local people earn, teach, build, and keep community projects moving.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" variant="secondary" className="min-h-11">
                  <a href="#community-directory">
                    <Search className="mr-2 h-5 w-5" aria-hidden="true" />
                    Browse Listings
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="min-h-11 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                  <Link href="/community-hub/guide">
                    <Info className="mr-2 h-5 w-5" aria-hidden="true" />
                    How It Works
                  </Link>
                </Button>
                <Dialog
                  open={isSubmitOpen}
                  onOpenChange={(open) => {
                    setIsSubmitOpen(open);
                    if (!open) form.reset(defaultListingValues);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="lg" className="min-h-11">
                      <PlusCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                      Submit a Listing
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Submit a Business or Initiative</DialogTitle>
                      <DialogDescription>
                        Share the details below. The Visit Dzaleka team reviews listings before they appear publicly.
                      </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit((values) => submitMutation.mutate(values))} className="space-y-5">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business or Initiative Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Example: Sunrise Tailors…" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type…" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="business">Local business / artisan</SelectItem>
                                    <SelectItem value="initiative">Community project / initiative</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <FormControl>
                                  <Input placeholder="Tailoring, dining, education…" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe what you do, sell, teach, or support…"
                                  className="min-h-24"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="contactName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Person</FormLabel>
                                <FormControl>
                                  <Input placeholder="Full name…" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="contactPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>WhatsApp / Phone</FormLabel>
                                <FormControl>
                                  <Input type="tel" inputMode="tel" placeholder="+265 999 123 456…" {...field} />
                                </FormControl>
                                <FormDescription>Visitors may use this to contact you directly.</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="contactEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    inputMode="email"
                                    placeholder="name@example.com…"
                                    spellCheck={false}
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location in Dzaleka</FormLabel>
                                <FormControl>
                                  <Input placeholder="Market area, Zone 2…" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Image URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com/image.jpg…" {...field} value={field.value ?? ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="needs"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Supply or Volunteering Needs</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Books, notebooks, fabric, volunteer skills…"
                                  className="min-h-20"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormDescription>Use this for practical items visitors can pack, buy, or help source.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="offersExperience"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border bg-muted/40 p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value ?? false}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Offers a visitor experience</FormLabel>
                                <FormDescription>
                                  Choose this for workshops, cooking classes, art lessons, or hosted sessions.
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        {watchOffersExperience && (
                          <FormField
                            control={form.control}
                            name="experienceDetails"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Experience Details</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe duration, capacity, expected cost, and what visitors will do…"
                                    className="min-h-20"
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsSubmitOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={submitMutation.isPending}>
                            {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                            Submit Listing
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b bg-muted/20">
          <div className="container mx-auto grid gap-4 px-4 py-8 sm:grid-cols-3">
            {supportHighlights.map((item) => (
              <Card key={item.title}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="community-directory" className="container mx-auto scroll-mt-20 px-4 py-8 sm:py-12">
          <div className="mb-6 flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Community Directory</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Browse approved listings and contact hosts directly. Availability, prices, and supply needs may change, so confirm details before your visit.
              </p>
            </div>

            <div className="flex w-full min-w-0 flex-col gap-3 lg:w-auto lg:min-w-[34rem]">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="overflow-x-auto pb-1">
                  <TabsList className="inline-grid min-w-max grid-cols-3">
                    <TabsTrigger value="all" className="min-w-24">All</TabsTrigger>
                    <TabsTrigger value="business" className="min-w-28">Businesses</TabsTrigger>
                    <TabsTrigger value="initiative" className="min-w-28">Projects</TabsTrigger>
                  </TabsList>
                </div>
              </Tabs>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="search"
                  name="community-search"
                  placeholder="Search name, category, location, or needs…"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="aspect-[4/3] animate-pulse bg-muted" />
                  <CardContent className="space-y-3 p-5">
                    <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                    <div className="h-6 w-4/5 animate-pulse rounded bg-muted" />
                    <div className="h-16 animate-pulse rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <Info className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold">No listings found</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Try a different search term or switch categories.
                </p>
              </CardContent>
            </Card>
	          ) : (
	            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
	              {filteredListings.map((item) => (
	                <Card key={item.id} id={`listing-${item.id}`} className="flex min-w-0 scroll-mt-24 flex-col overflow-hidden">
                  <Link href={`/community-hub/${item.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <div className="aspect-[4/3] bg-muted">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          width={640}
                          height={480}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/5">
                          {listingIcon(item.type)}
                        </div>
                      )}
                    </div>
                  </Link>

                  <CardHeader className="space-y-3 p-5 pb-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="max-w-full">
                        <span className="mr-1">{listingIcon(item.type)}</span>
                        <span className="truncate">{item.category}</span>
                      </Badge>
                      <Badge variant="outline">{listingTypeLabel(item.type)}</Badge>
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="break-words text-xl">
                        <Link href={`/community-hub/${item.id}`} className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                          {item.name}
                        </Link>
                      </CardTitle>
                      <p className="mt-2 flex min-w-0 items-start gap-2 break-words text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        {item.location}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col gap-4 p-5 pt-0">
                    <p className="line-clamp-3 break-words text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {item.offersExperience && (
                        <Badge variant="outline" className="max-w-full">
                          <Compass className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                          Visitor experience
                        </Badge>
                      )}
                      {item.needs && (
                        <Badge variant="outline" className="max-w-full">
                          <Package className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                          Needs listed
                        </Badge>
                      )}
                    </div>

                    <div className={`mt-auto grid gap-2 ${highlightTargetBooking ? "sm:grid-cols-2" : ""}`}>
                      <Button asChild className="min-h-11">
                        <Link href={`/community-hub/${item.id}`}>
                          View details
                          <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
	                    {highlightTargetBooking && (
	                      <Button
	                        type="button"
	                        variant={(highlightTargetBooking.selectedCommunityListings || []).includes(item.id) ? "secondary" : "outline"}
	                        className="min-h-10 w-full"
	                        disabled={
	                          addHighlightMutation.isPending ||
	                          (highlightTargetBooking.selectedCommunityListings || []).includes(item.id)
	                        }
	                        onClick={() => addHighlightMutation.mutate({ booking: highlightTargetBooking, listingId: item.id })}
	                      >
	                        {(highlightTargetBooking.selectedCommunityListings || []).includes(item.id) ? (
	                          <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
	                        ) : addHighlightMutation.isPending && addHighlightMutation.variables?.listingId === item.id ? (
	                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
	                        ) : (
	                          <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
	                        )}
	                        {(highlightTargetBooking.selectedCommunityListings || []).includes(item.id) ? "Added to tour highlights" : "Add to my tour"}
	                      </Button>
	                    )}
                    </div>
	                  </CardContent>
	                </Card>
	              ))}
            </div>
          )}

          <div className="mt-10 rounded-lg border bg-muted/25 p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 max-w-2xl">
                <Badge variant="outline" className="mb-3">Using the directory</Badge>
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Know what happens next</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The hub is a public directory, not an instant marketplace. Listings help visitors and providers connect, then details are confirmed directly or with support from Visit Dzaleka.
                </p>
              </div>
              <Button asChild variant="outline" className="min-h-11 w-full shrink-0 sm:w-auto">
                <Link href="/community-hub/guide">
                  Read Full Guide
                </Link>
              </Button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {directoryGuideNotes.map((note) => (
                <div key={note.title} className="min-w-0 rounded-md border bg-background p-4">
                  <p className="break-words text-sm font-semibold">{note.title}</p>
                  <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">{note.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Dialog
        open={Boolean(requestListing)}
        onOpenChange={(open) => {
          if (!open) {
            setRequestListing(null);
            requestForm.reset(defaultExperienceRequestValues);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Request {requestListing?.name}</DialogTitle>
            <DialogDescription>
              Send your preferred date and group size. Visit Dzaleka will confirm host availability before anything is final.
            </DialogDescription>
          </DialogHeader>

          {requestListing && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{formatExperiencePrice(requestListing)}</p>
              <p className="mt-1 text-muted-foreground">
                {formatDuration(requestListing.experienceDurationMinutes)}
                {requestListing.experienceMaxGuests
                  ? ` · ${requestListing.experienceMinGuests || 1}-${requestListing.experienceMaxGuests} guests`
                  : ""}
              </p>
            </div>
          )}

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
                      <FormLabel>Your Name</FormLabel>
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
                          min={requestListing?.experienceMinGuests || 1}
                          max={requestListing?.experienceMaxGuests || undefined}
                          inputMode="numeric"
                          {...field}
                          value={field.value || 1}
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
                      <Input type="tel" inputMode="tel" placeholder="+265 999 123 456…" autoComplete="tel" {...field} value={field.value || ""} />
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
                        placeholder="Share your interests, questions, or timing flexibility…"
                        className="min-h-24"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Please avoid sharing sensitive personal information. The team will contact you to confirm details.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRequestListing(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={requestMutation.isPending}>
                  {requestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                  Send Request
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
