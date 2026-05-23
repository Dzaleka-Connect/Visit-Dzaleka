import { Link } from "wouter";
import {
  ArrowRight,
  Bus,
  Car,
  CheckCircle2,
  Compass,
  Clock,
  ExternalLink,
  Globe2,
  HeartHandshake,
  MapPin,
  Plane,
  Route,
  ShieldCheck,
  Waves,
} from "lucide-react";
import { SEO } from "@/components/seo";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TRANSPORT_PARTNERS, TRANSPORT_ROUTES } from "@/lib/transport";

const heroImage =
  "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhQC52NEfamRlqaUT7uLWcP8ZKNUDp3_opelPFqoO6E5hyphenhyphen09lp-zxRXXig5aEnaH3PbRsia1ciM8y-vOdzDe9RMvbQApON7rdM0SrBmtVVWAPIzmiId-jvcwSa46-Y-qRApCBTmozhIbWhNZWxcLFY3bp6Q4uNk_LFB5MpYFlXywwX7vYlUQeRoirJWm50/s16000-rw/533061219_1079243081018233_5344782622295089839_n.jpg";

const transportBookingHref = "/embed/booking?transport=true&route=lilongwe-dzaleka";

const packageHighlights = [
  {
    icon: Car,
    title: "Lilongwe - Dzaleka transfers",
    description: "Private, safe, flexible transport between Lilongwe and Dzaleka Refugee Camp.",
  },
  {
    icon: Plane,
    title: "Airport pickups",
    description: "Visitors can be met at Kamuzu International Airport and taken to Lilongwe accommodation or Dzaleka.",
  },
  {
    icon: Waves,
    title: "Lake Malawi add-on routes",
    description: "Extend the journey toward Lake Malawi, Senga Bay, Cape Maclear, Salima, or a custom route.",
  },
];

const handoffSteps = [
  "Visitor requests transport during or after booking a Visit Dzaleka experience.",
  "Visit Dzaleka confirms tour details, route, pickup timing, and visitor needs.",
  "A verified transport partner receives the booking request.",
  "The partner responds with driver, vehicle, timing, and quote details.",
  "Once confirmed, the visitor receives full travel details before the visit.",
];

const networkValues = [
  "Verified transport operators",
  "Professional tourism services",
  "Safe, reliable travel experiences",
  "Cultural tourism-linked journeys",
];

const networkStats = [
  {
    icon: ShieldCheck,
    label: "Verified operators",
    detail: "Partner network, not informal taxi guesswork",
  },
  {
    icon: MapPin,
    label: "Lilongwe based",
    detail: "Built around Dzaleka, airport, and Malawi routes",
  },
  {
    icon: Clock,
    label: "Tour aligned",
    detail: "Pickup timing follows confirmed visit plans",
  },
  {
    icon: Bus,
    label: "Private options",
    detail: "Flexible transfers for groups and special trips",
  },
];

const transportStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://visit.dzaleka.com/plan-your-trip/transport#webpage",
      "name": "Visit Dzaleka Transport Partners",
      "url": "https://visit.dzaleka.com/plan-your-trip/transport",
      "description": "Verified transport partners for Visit Dzaleka cultural tourism journeys between Lilongwe, Dzaleka, Kamuzu International Airport, Lake Malawi, and destinations across Malawi.",
      "isPartOf": {
        "@type": "WebSite",
        "@id": "https://visit.dzaleka.com/#website",
        "name": "Visit Dzaleka",
        "url": "https://visit.dzaleka.com"
      },
      "about": {
        "@type": "Service",
        "@id": "https://visit.dzaleka.com/plan-your-trip/transport#transport-service",
        "name": "Visit Dzaleka transport partner referrals",
        "serviceType": "Transport referral service",
        "areaServed": [
          { "@type": "Place", "name": "Lilongwe, Malawi" },
          { "@type": "Place", "name": "Dzaleka Refugee Camp, Malawi" },
          { "@type": "Airport", "name": "Kamuzu International Airport" },
          { "@type": "Place", "name": "Lake Malawi" }
        ],
        "provider": {
          "@type": "Organization",
          "@id": "https://visit.dzaleka.com/#organization",
          "name": "Visit Dzaleka",
          "url": "https://visit.dzaleka.com"
        }
      }
    },
    {
      "@type": "ItemList",
      "@id": "https://visit.dzaleka.com/plan-your-trip/transport#partners",
      "name": "Featured Visit Dzaleka transport partners",
      "itemListElement": TRANSPORT_PARTNERS.map((partner, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "LocalBusiness",
          "name": partner.name,
          "url": partner.website,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": partner.address,
            "addressCountry": "MW"
          },
          "description": partner.description,
          "areaServed": "Malawi",
          "serviceType": partner.strengths
        }
      }))
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://visit.dzaleka.com/plan-your-trip/transport#breadcrumbs",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://visit.dzaleka.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Plan Your Trip",
          "item": "https://visit.dzaleka.com/plan-your-trip"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Transport Partners",
          "item": "https://visit.dzaleka.com/plan-your-trip/transport"
        }
      ]
    }
  ]
};

export default function TransportPartners() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Visit Dzaleka Transport Partners | Verified Malawi Transfers"
        description="A trusted network of verified transport operators supporting cultural tourism journeys between Lilongwe, Dzaleka, Kamuzu International Airport, Lake Malawi, and destinations across Malawi."
        keywords="Visit Dzaleka transport partners, Lilongwe to Dzaleka taxi, Malawi transport operator, Kamuzu International Airport transfer, Lake Malawi transport, Ashraf Taxi Tours Malawi, Anake Taxi Tours"
        canonical="https://visit.dzaleka.com/plan-your-trip/transport"
        ogImage={heroImage}
        imageAlt="Visit Dzaleka guests and guides walking through Dzaleka"
        structuredData={transportStructuredData}
      />
      <PublicHeader activePath="/plan-your-trip/transport" />

      <main>
        <section className="relative min-h-[560px] overflow-hidden bg-black text-white">
          <img
            src={heroImage}
            alt="Visitors and community guides during a Visit Dzaleka walking tour"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="container relative mx-auto flex min-h-[560px] items-end px-4 pb-12 pt-28">
            <div className="max-w-3xl">
              <Badge className="mb-4 bg-white text-foreground hover:bg-white">Verified transport network</Badge>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Visit Dzaleka transport partners
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90">
                A trusted network of verified transport operators supporting cultural tourism journeys between Lilongwe, Dzaleka, and destinations across Malawi.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={transportBookingHref}>
                    Request transport with a tour
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white bg-white/10 text-white hover:bg-white hover:text-foreground">
                  <Link href="#featured-partners">View partners</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b bg-muted/30 py-6">
          <div className="container mx-auto grid gap-3 px-4 sm:grid-cols-2 lg:grid-cols-4">
            {networkStats.map(({ icon: Icon, label, detail }) => (
              <div key={label} className="flex items-center gap-3 rounded-lg border bg-background p-4">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="break-words font-semibold">{label}</div>
                  <div className="break-words text-sm text-muted-foreground">{detail}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto grid gap-10 px-4 py-14 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-10">
            <section id="featured-partners" aria-labelledby="partners-heading" className="scroll-mt-24 space-y-5">
              <div>
                <Badge variant="outline" className="mb-3">Featured transport partners</Badge>
                <h2 id="partners-heading" className="text-3xl font-bold tracking-tight">
                  Trusted operators for Dzaleka visitor journeys
                </h2>
                <p className="mt-3 max-w-3xl text-muted-foreground">
                  Each partner brings established Malawi transport experience, airport transfer capacity, and route knowledge that can support cultural tourism around Dzaleka.
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {TRANSPORT_PARTNERS.map((partner) => (
                  <Card key={partner.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <CardTitle className="break-words text-xl">{partner.name}</CardTitle>
                          <p className="mt-2 flex items-start gap-2 break-words text-sm text-muted-foreground">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                            <span>{partner.address}</span>
                          </p>
                        </div>
                        <Button asChild variant="outline" size="sm" className="shrink-0">
                          <a href={partner.website} target="_blank" rel="noopener noreferrer">
                            {partner.websiteLabel}
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </a>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <p className="break-words text-sm leading-relaxed text-muted-foreground">{partner.description}</p>
                      <div className="space-y-2">
                        {partner.strengths.map((item) => (
                          <div key={item} className="flex gap-3 text-sm">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                            <span className="min-w-0 break-words">{item}</span>
                          </div>
                        ))}
                      </div>
                      <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                        {partner.slug === "ashraf"
                          ? "A strong fit for connecting visitors from Lilongwe to Dzaleka and wider Malawi tourism destinations."
                          : "A strong fit for cultural travel routes that connect Dzaleka visits with structured Malawi tour itineraries."}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section aria-labelledby="transfer-heading" className="space-y-5">
              <div>
                <Badge variant="outline" className="mb-3">Transport services</Badge>
                <h2 id="transfer-heading" className="text-3xl font-bold tracking-tight">
                  Transfers and add-on routes
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {packageHighlights.map(({ icon: Icon, title, description }) => (
                  <Card key={title}>
                    <CardContent className="p-5">
                      <Icon className="mb-3 h-6 w-6 text-primary" aria-hidden="true" />
                      <h3 className="break-words font-semibold">{title}</h3>
                      <p className="mt-2 break-words text-sm text-muted-foreground">{description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section id="routes" aria-labelledby="routes-heading" className="scroll-mt-24 space-y-5">
              <div>
                <Badge variant="outline" className="mb-3">Route options</Badge>
                <h2 id="routes-heading" className="text-3xl font-bold tracking-tight">
                  Transport routes visitors can request
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {TRANSPORT_ROUTES.map((route) => (
                  <Card key={route.id}>
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                          <Route className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{route.label}</CardTitle>
                          <p className="mt-2 text-sm text-muted-foreground">{route.description}</p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </section>

            <section aria-labelledby="handoff-heading" className="rounded-lg border bg-muted/30 p-6">
              <Badge variant="outline" className="mb-3">How it works</Badge>
              <h2 id="handoff-heading" className="text-2xl font-bold tracking-tight">
                A simple referral flow
              </h2>
              <ol className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {handoffSteps.map((step, index) => (
                  <li key={step} className="rounded-lg border bg-background p-4">
                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                    <p className="break-words text-sm text-muted-foreground">{step}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="network-heading" className="space-y-5">
              <div>
                <Badge variant="outline" className="mb-3">What this network represents</Badge>
                <h2 id="network-heading" className="text-3xl font-bold tracking-tight">
                  A structured transport ecosystem for cultural tourism
                </h2>
                <p className="mt-3 max-w-3xl text-muted-foreground">
                  Visit Dzaleka connects visitors with professional transport services instead of leaving them to informal arrangements. The goal is safer movement, clearer accountability, and better-linked cultural tourism journeys across Malawi.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {networkValues.map((value) => (
                  <div key={value} className="flex items-center gap-3 rounded-lg border bg-background p-4">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0 break-words text-sm font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Request transport</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Add transport needs to a booking request so the team can match the route with an available verified partner.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Globe2 className="h-4 w-4 text-primary" aria-hidden="true" />
                    Partner network
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Requests can support Lilongwe, Dzaleka, airport, Lake Malawi, and custom Malawi travel routes.
                  </p>
                </div>
                {TRANSPORT_PARTNERS.map((partner) => (
                  <div key={partner.id} className="rounded-md border p-3">
                    <p className="break-words text-sm font-semibold">{partner.name}</p>
                    <p className="mt-1 break-words text-xs text-muted-foreground">{partner.address}</p>
                  </div>
                ))}
                <Button asChild className="w-full" size="lg">
                  <Link href={transportBookingHref}>
                    Start booking request
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/partner-with-us">
                    Partner with Visit Dzaleka
                    <HeartHandshake className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link href="#routes">
                    Compare route options
                    <Compass className="h-4 w-4" />
                  </Link>
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
