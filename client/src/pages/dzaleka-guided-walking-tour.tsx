import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgePercent,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  Droplets,
  ExternalLink,
  Footprints,
  Globe2,
  HeartHandshake,
  Info,
  MapPin,
  MapPinned,
  ShieldCheck,
  Star,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/seo";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import type { SpecialOffer } from "@shared/schema";

interface PublicReview {
  id: string;
  rating: number | null;
  title: string | null;
  comment: string | null;
  visitorName: string;
  source: string | null;
  submittedAt: string | null;
  responseText: string | null;
}

const heroImage =
  "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhQC52NEfamRlqaUT7uLWcP8ZKNUDp3_opelPFqoO6E5hyphenhyphen09lp-zxRXXig5aEnaH3PbRsia1ciM8y-vOdzDe9RMvbQApON7rdM0SrBmtVVWAPIzmiId-jvcwSa46-Y-qRApCBTmozhIbWhNZWxcLFY3bp6Q4uNk_LFB5MpYFlXywwX7vYlUQeRoirJWm50/s16000-rw/533061219_1079243081018233_5344782622295089839_n.jpg";
const tourUrl = "https://visit.dzaleka.com/things-to-do/dzaleka-refugee-camp-guided-walking-tour";
const servicesDirectoryUrl = "https://services.dzaleka.com/services/";

const highlights = [
  "Visit Dzaleka with a trained resident guide",
  "Meet local entrepreneurs or community organizations when available",
  "Walk through Kawale and visit Mardi Marché when the market is active",
  "Ascend Dzaleka Hill for context and panoramic views of the settlement",
  "Learn how Congolese, Burundian, Rwandan, Malawian, and other communities shape daily life",
];

const options = [
  { title: "Individual", price: "MWK 15,000", detail: "One visitor, personal pace" },
  { title: "Small group", price: "MWK 50,000", detail: "2-5 visitors" },
  { title: "Medium group", price: "MWK 80,000", detail: "6-10 visitors" },
  { title: "Large group", price: "MWK 100,000", detail: "10+ visitors or organizations" },
];

const includes = [
  "Local guide speaking English, French, or Swahili",
  "Walking tour of key zones: Kawale, Katudza, and Dzaleka Hill",
  "Contribution to community projects",
  "Guidance on how to connect with local organizations after the tour",
];

const whatToBring = [
  { label: "Comfortable shoes", icon: Footprints },
  { label: "Camera", icon: Camera },
  { label: "Water", icon: Droplets },
];

const beforeYouGo = [
  "Dress code: Modest clothing is recommended out of respect for the community.",
  "Photography: Please ask for permission before taking photos of individuals. Your guide will advise on photo-friendly zones.",
  "Duration: 2-3 hours.",
];

const tourStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://visit.dzaleka.com/#organization",
      "name": "Visit Dzaleka",
      "url": "https://visit.dzaleka.com",
      "logo": "https://services.dzaleka.com/images/dzaleka-digital-heritage.png",
      "sameAs": [
        "https://www.facebook.com/DzalekaOnline",
        "https://x.com/Dzalekaconnect",
        "https://www.instagram.com/dzalekaonline"
      ]
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${tourUrl}#breadcrumb`,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://visit.dzaleka.com" },
        { "@type": "ListItem", "position": 2, "name": "Things to Do", "item": "https://visit.dzaleka.com/things-to-do" },
        { "@type": "ListItem", "position": 3, "name": "Dzaleka Refugee Camp Guided Walking Tour", "item": tourUrl }
      ]
    },
    {
      "@type": "Product",
      "@id": `${tourUrl}#tour`,
      "name": "Dzaleka Refugee Camp Guided Walking Tour",
      "description": "Resident-led guided walking tour of Dzaleka Refugee Camp, including Kawale, Katudza, Dzaleka Hill, community markets, and local organizations or project spaces when available.",
      "image": [heroImage],
      "brand": { "@id": "https://visit.dzaleka.com/#organization" },
      "category": "Guided walking tour",
      "sku": "visit-dzaleka-guided-walking-tour",
      "mainEntityOfPage": tourUrl,
      "offers": [
        {
          "@type": "Offer",
          "name": "Individual guided walking tour",
          "price": "15000",
          "priceCurrency": "MWK",
          "availability": "https://schema.org/InStock",
          "priceValidUntil": "2026-12-31",
          "url": tourUrl,
          "seller": { "@id": "https://visit.dzaleka.com/#organization" }
        },
        {
          "@type": "Offer",
          "name": "Small group guided walking tour",
          "price": "50000",
          "priceCurrency": "MWK",
          "availability": "https://schema.org/InStock",
          "priceValidUntil": "2026-12-31",
          "url": tourUrl,
          "seller": { "@id": "https://visit.dzaleka.com/#organization" }
        },
        {
          "@type": "Offer",
          "name": "Medium group guided walking tour",
          "price": "80000",
          "priceCurrency": "MWK",
          "availability": "https://schema.org/InStock",
          "priceValidUntil": "2026-12-31",
          "url": tourUrl,
          "seller": { "@id": "https://visit.dzaleka.com/#organization" }
        },
        {
          "@type": "Offer",
          "name": "Large group guided walking tour",
          "price": "100000",
          "priceCurrency": "MWK",
          "availability": "https://schema.org/InStock",
          "priceValidUntil": "2026-12-31",
          "url": tourUrl,
          "seller": { "@id": "https://visit.dzaleka.com/#organization" }
        }
      ]
    }
  ]
};

function buildTourStructuredData(reviews: PublicReview[]) {
  const structuredData = JSON.parse(JSON.stringify(tourStructuredData)) as Record<string, any>;
  const product = (structuredData["@graph"] as Array<Record<string, any>>).find(
    (item) => item["@id"] === `${tourUrl}#tour`
  );
  const ratedReviews = reviews.filter((review) => review.rating);

  if (product && ratedReviews.length > 0) {
    const averageRating = ratedReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / ratedReviews.length;
    product.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": averageRating.toFixed(1),
      "reviewCount": ratedReviews.length,
    };
    product.review = ratedReviews.slice(0, 5).map((review) => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.visitorName || "Visit Dzaleka visitor",
      },
      "datePublished": review.submittedAt || undefined,
      "name": review.title || "Verified visitor review",
      "reviewBody": review.comment || review.title || "Verified visitor review of the Visit Dzaleka guided walking tour.",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": "5",
        "worstRating": "1",
      },
    }));
  }

  return structuredData;
}

function formatOfferDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date));
}

function offerScope(offer: SpecialOffer) {
  const tourTypes = offer.tourTypes?.length
    ? offer.tourTypes.map((type) => type.replace("_", " ")).join(", ")
    : "all tour types";
  const groupSizes = offer.groupSizes?.length
    ? offer.groupSizes.map((size) => size.replace("_", " ")).join(", ")
    : "all group sizes";
  return `${tourTypes} · ${groupSizes}`;
}

function formatReviewDate(date?: string | null) {
  if (!date) return "Recent visit";
  return new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(new Date(date));
}

function reviewStars(rating?: number | null) {
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      aria-hidden="true"
      className={`h-4 w-4 ${rating && index < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
    />
  ));
}

export default function DzalekaGuidedWalkingTour() {
  const { data: specialOffers = [] } = useQuery<SpecialOffer[]>({
    queryKey: ["/api/public/special-offers"],
  });
  const { data: publicReviews = [] } = useQuery<PublicReview[]>({
    queryKey: ["/api/public/reviews?limit=6"],
  });

  const featuredOffer = specialOffers[0];
  const structuredData = buildTourStructuredData(publicReviews);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Dzaleka Refugee Camp Guided Walking Tour"
        description="Book the official Visit Dzaleka resident-led walking tour with Kawale, Dzaleka Hill, Katudza, Mardi Marché, local organizations, and transparent pricing."
        canonical={tourUrl}
        type="product"
        ogImage={heroImage}
        keywords="Dzaleka guided walking tour, Visit Dzaleka tour, Dzaleka Refugee Camp tour, Kawale Dzaleka, Dzaleka Hill, Katudza, Mardi Marche, Dzaleka organizations, Dzaleka services directory, Malawi responsible tourism"
        structuredData={structuredData}
      />
      <PublicHeader activePath="/things-to-do" />

      <main>
        <section className="relative min-h-[640px] overflow-hidden bg-black text-white">
          <img
            src={heroImage}
            alt="Resident-led guided walking tour in Dzaleka Refugee Camp"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/55" />
          <div className="container relative mx-auto flex min-h-[640px] items-end px-4 pb-12 pt-28">
            <div className="max-w-4xl">
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge className="bg-white text-foreground hover:bg-white">Official Visit Dzaleka listing</Badge>
                <Badge variant="outline" className="border-white/50 bg-black/20 text-white">Guided walking tour</Badge>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Dzaleka Refugee Camp Guided Walking Tour
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90">
                A resident-led cultural walking tour through Kawale, Katudza, Dzaleka Hill, local markets, and community-led spaces when available.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/login">Check availability</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white bg-white/10 text-white hover:bg-white hover:text-foreground">
                  <Link href="#details">View details</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="details" className="border-b bg-muted/30 py-6">
          <div className="container mx-auto grid gap-3 px-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg border bg-background p-4">
              <Clock className="h-5 w-5 text-primary" />
              <div><div className="font-semibold">2-3 hours</div><div className="text-sm text-muted-foreground">Route may change by day</div></div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-background p-4">
              <Users className="h-5 w-5 text-primary" />
              <div><div className="font-semibold">1-10+ visitors</div><div className="text-sm text-muted-foreground">Individuals and groups</div></div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-background p-4">
              <Globe2 className="h-5 w-5 text-primary" />
              <div><div className="font-semibold">English, French, Swahili</div><div className="text-sm text-muted-foreground">Guide availability varies</div></div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-background p-4">
              <MapPin className="h-5 w-5 text-primary" />
              <div><div className="font-semibold">Dzaleka, Dowa District</div><div className="text-sm text-muted-foreground">Meeting point confirmed after booking</div></div>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-8 px-4 py-14 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-8">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p>For reference only. Itineraries are subject to change based on safety guidance, weather, market days, and community availability.</p>
              </div>
            </div>

            {featuredOffer && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <Badge className="w-fit gap-1">
                    <BadgePercent className="h-3.5 w-3.5" />
                    {featuredOffer.discountPercent}% off
                  </Badge>
                  <CardTitle>{featuredOffer.description || "Limited-time Visit Dzaleka offer"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>{offerScope(featuredOffer)}</p>
                  <p>
                    Eligible visit dates: {formatOfferDate(featuredOffer.activityStartDate)} – {formatOfferDate(featuredOffer.activityEndDate)}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3">
                  {highlights.map((item) => (
                    <li key={item} className="flex gap-3 text-sm">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Full description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Meet your local guide and begin your walking tour of Dzaleka Refugee Camp. Walk through Kawale, one of the camp's main movement and market areas. Ascend Dzaleka Hill for wider context and views of the settlement, then visit the Katudza zone when access and timing allow.
                </p>
                <p>
                  Depending on the route and availability, your guide may introduce you to entrepreneurs, schools, arts groups, health or wellbeing initiatives, technology programs, faith-based services, or other community organizations. No single organization is treated as the default stop; visits are arranged around consent, timing, and visitor interests.
                </p>
                <p>
                  Explore Mardi Marché, also known as the Tuesday Market, when it is active, and support local artisans or traders directly. All tours follow Visit Dzaleka's photography, privacy, and dignity guidelines.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connect with organizations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Dzaleka has a wider services network beyond any single stop on the tour. If you want to contact an organization before or after your visit, use the Dzaleka Online Services directory and your guide can help you understand what is practical to arrange.
                </p>
                <Button asChild variant="outline">
                  <a href={servicesDirectoryUrl} target="_blank" rel="noopener noreferrer">
                    Browse Dzaleka services
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {publicReviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Verified visitor reviews</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {publicReviews.slice(0, 4).map((review) => (
                    <article key={review.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex">
                          <span className="sr-only">{review.rating || 0} out of 5 stars</span>
                          {reviewStars(review.rating)}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatReviewDate(review.submittedAt)}</span>
                      </div>
                      <h3 className="mt-3 font-semibold">{review.title || "Verified visitor review"}</h3>
                      {review.comment && (
                        <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">{review.comment}</p>
                      )}
                      {review.responseText && (
                        <div className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Visit Dzaleka response: </span>
                          {review.responseText}
                        </div>
                      )}
                      <p className="mt-3 text-xs font-medium text-muted-foreground">
                        {review.visitorName || "Visit Dzaleka visitor"}
                      </p>
                    </article>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Includes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {includes.map((item) => (
                      <li key={item} className="flex gap-3 text-sm">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Not suitable for</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3 text-sm">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <span>People with mobility impairments</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Meeting point</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 text-sm text-muted-foreground">
                  <MapPinned className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p>
                    Meet at the main gate of the UNHCR/Plan International Compound. Look for your guide wearing a Visit Dzaleka badge or t-shirt. It is the most recognizable secure entry point.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=UNHCR%20Plan%20International%20Compound%20Dzaleka%20Refugee%20Camp"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Google Maps
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Important information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-3 font-semibold">What to bring</h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {whatToBring.map(({ label, icon: Icon }) => (
                      <div key={label} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                        <Icon className="h-5 w-5 text-primary" />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 font-semibold">Know before you go</h3>
                  <ul className="space-y-3">
                    {beforeYouGo.map((item) => (
                      <li key={item} className="flex gap-3 text-sm text-muted-foreground">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-5">
                  <ShieldCheck className="mb-3 h-6 w-6 text-primary" />
                  <h3 className="font-semibold">Respectful access</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Tours follow privacy, photography, and camp safety expectations.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <HeartHandshake className="mb-3 h-6 w-6 text-primary" />
                  <h3 className="font-semibold">Community benefit</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Tour income supports resident guides and community-led work.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <CalendarDays className="mb-3 h-6 w-6 text-primary" />
                  <h3 className="font-semibold">Confirmed manually</h3>
                  <p className="mt-2 text-sm text-muted-foreground">The team confirms guide availability and final meeting details.</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <aside id="tour-options" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Tour options</CardTitle>
                <p className="text-sm text-muted-foreground">Transparent pricing before any eligible special offer.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {options.map((option) => (
                  <div key={option.title} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{option.title}</div>
                        <div className="text-sm text-muted-foreground">{option.detail}</div>
                      </div>
                      <div className="text-right font-bold">{option.price}</div>
                    </div>
                  </div>
                ))}
                <Button asChild className="w-full" size="lg">
                  <Link href="/login">Check availability</Link>
                </Button>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/help?support=true">Ask a question</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
