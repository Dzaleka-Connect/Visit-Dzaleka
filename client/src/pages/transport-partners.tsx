import { Link } from "wouter";
import {
  ArrowRight,
  Bus,
  Car,
  CheckCircle2,
  Clock,
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
import { DEFAULT_TRANSPORT_PARTNER_ID, TRANSPORT_PARTNERS, TRANSPORT_ROUTES } from "@/lib/transport";

const heroImage =
  "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhQC52NEfamRlqaUT7uLWcP8ZKNUDp3_opelPFqoO6E5hyphenhyphen09lp-zxRXXig5aEnaH3PbRsia1ciM8y-vOdzDe9RMvbQApON7rdM0SrBmtVVWAPIzmiId-jvcwSa46-Y-qRApCBTmozhIbWhNZWxcLFY3bp6Q4uNk_LFB5MpYFlXywwX7vYlUQeRoirJWm50/s16000-rw/533061219_1079243081018233_5344782622295089839_n.jpg";

const partner = TRANSPORT_PARTNERS.find((item) => item.id === DEFAULT_TRANSPORT_PARTNER_ID) || TRANSPORT_PARTNERS[0];
const transportBookingHref = "/embed/booking?transport=ashraf&route=lilongwe-dzaleka-lake-malawi";

const packageHighlights = [
  {
    icon: Car,
    title: "Lilongwe transfers",
    description: "A private taxi option for visitors who want a simpler trip from Lilongwe to Dzaleka and back.",
  },
  {
    icon: Plane,
    title: "Airport pickups",
    description: "A smoother arrival path for travelers landing at Kamuzu International Airport before their visit.",
  },
  {
    icon: Waves,
    title: "Lake Malawi add-on",
    description: "A partner-led day route that can combine Dzaleka with Lake Malawi or Senga Bay.",
  },
];

const handoffSteps = [
  "Visitor requests transport while booking a Dzaleka tour.",
  "Visit Dzaleka confirms guide availability and transport needs.",
  "The trusted transport partner receives the referral details for follow-up.",
];

export default function TransportPartners() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Trusted Transport Partners | Visit Dzaleka"
        description="Request trusted transport for Visit Dzaleka tours, including Lilongwe transfers, airport pickups, and Dzaleka plus Lake Malawi day-trip packages."
        keywords="Dzaleka transport, Lilongwe to Dzaleka taxi, Dzaleka Lake Malawi day trip, Senga Bay tour, Visit Dzaleka transport partner"
        canonical="https://visit.dzaleka.com/plan-your-trip/transport"
        ogImage={heroImage}
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
              <Badge className="mb-4 bg-white text-foreground hover:bg-white">Transport referrals</Badge>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Trusted transport for Visit Dzaleka
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90">
                Make the journey easier with vetted transport partners for Lilongwe transfers, airport pickups, and Dzaleka plus Lake Malawi day-trip routes.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={transportBookingHref}>
                    Request transport with a tour
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white bg-white/10 text-white hover:bg-white hover:text-foreground">
                  <Link href="#routes">View routes</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b bg-muted/30 py-6">
          <div className="container mx-auto grid gap-3 px-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg border bg-background p-4">
              <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
              <div>
                <div className="font-semibold">45&nbsp;km from Lilongwe</div>
                <div className="text-sm text-muted-foreground">Usually about one hour by car</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-background p-4">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              <div>
                <div className="font-semibold">Trusted partner handoff</div>
                <div className="text-sm text-muted-foreground">Coordinated after booking</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-background p-4">
              <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
              <div>
                <div className="font-semibold">Day-trip friendly</div>
                <div className="text-sm text-muted-foreground">Dzaleka plus nearby routes</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-background p-4">
              <Bus className="h-5 w-5 text-primary" aria-hidden="true" />
              <div>
                <div className="font-semibold">Private taxi preferred</div>
                <div className="text-sm text-muted-foreground">Simpler than minibus travel</div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-10 px-4 py-14 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-10">
            <section aria-labelledby="partner-heading" className="space-y-5">
              <div>
                <Badge variant="outline" className="mb-3">Featured partner</Badge>
                <h2 id="partner-heading" className="text-3xl font-bold tracking-tight">
                  {partner.name}
                </h2>
                <p className="mt-3 max-w-3xl text-muted-foreground">
                  Ashraf already runs Lake Malawi and Senga Bay day trips from Lilongwe, which makes him a natural fit for visitor packages that include Dzaleka before continuing onward.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {packageHighlights.map(({ icon: Icon, title, description }) => (
                  <Card key={title}>
                    <CardContent className="p-5">
                      <Icon className="mb-3 h-6 w-6 text-primary" aria-hidden="true" />
                      <h3 className="font-semibold">{title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
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
              <ol className="mt-6 grid gap-4 md:grid-cols-3">
                {handoffSteps.map((step, index) => (
                  <li key={step} className="rounded-lg border bg-background p-4">
                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                    <p className="text-sm text-muted-foreground">{step}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Request transport</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Add transport needs to a booking request so the team can coordinate with the right partner.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {partner.strengths.map((item) => (
                  <div key={item} className="flex gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <span>{item}</span>
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
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
