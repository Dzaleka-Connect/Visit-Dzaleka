import type { ReactNode } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Info,
  MapPin,
  MessageSquare,
  Package,
  PlusCircle,
  Search,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { SEO } from "@/components/seo";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HERO_IMAGE =
  "https://tumainiletu.org/wp-content/uploads/2021/07/Website-Entrepreneurship-and-innovation-2048x1536.jpg";

/* ─────────────────────────────────────────────
   How the guide-led flow works (for visitors)
   ───────────────────────────────────────────── */
const visitorSteps = [
  {
    icon: CalendarCheck,
    title: "Book your tour",
    description:
      "Reserve a guided visit through Visit Dzaleka. Once your booking is confirmed, your assigned guide begins preparing your experience.",
  },
  {
    icon: Search,
    title: "Highlight listings you like",
    description:
      "From your booking page or the public directory, flag Community Hub listings that interest you. These highlights are suggestions for your guide.",
  },
  {
    icon: Users,
    title: "Your guide curates the visit",
    description:
      "Your guide reviews your highlights, the Community Hub directory, and the day\u2019s logistics before deciding what can realistically fit.",
  },
  {
    icon: MapPin,
    title: "Your guide takes you there",
    description:
      "On tour day, your guide personally introduces you to each provider, handles logistics, translates when needed, and ensures a respectful, meaningful visit.",
  },
];

/* ─────────────────────────────────────────────
   How the flow works (for providers / listers)
   ───────────────────────────────────────────── */
const providerSteps = [
  {
    icon: PlusCircle,
    title: "Submit your listing",
    description:
      "Share the name, category, location, contact person, image, description, and what visitors can support or purchase.",
  },
  {
    icon: ShieldCheck,
    title: "Wait for review",
    description:
      "Visit Dzaleka coordinators review public listings before publishing so the directory stays useful, respectful, and current.",
  },
  {
    icon: CheckCircle2,
    title: "Guides bring visitors to you",
    description:
      "Once approved, guides can include your listing in their tour itineraries. Keep your contact details and availability current so guides can coordinate smoothly.",
  },
];

/* ─────────────────────────────────────────────
   How hosted experience requests flow
   ───────────────────────────────────────────── */
const requestFlow = [
  "A visitor books a guided tour through Visit Dzaleka.",
  "The visitor can flag Community Hub listings they are interested in as tour highlights.",
  "The assigned guide reviews those highlights and selects stops that match logistics, timing, and availability.",
  "The guide coordinates directly with providers to confirm availability, timing, group size, and costs.",
  "On tour day, the guide takes the visitor to each stop, introduces them to the provider, and facilitates the experience.",
];

/* ─────────────────────────────────────────────
   Checklists
   ───────────────────────────────────────────── */
const visitorChecklist = [
  "Your tour booking is confirmed with an assigned guide",
  "You\u2019ve shared your interests and any Community Hub highlights you would like your guide to consider",
  "You understand that photography permissions vary by location",
  "You\u2019re prepared with cash (MWK) for any purchases or experience fees",
  "You\u2019ll follow your guide\u2019s lead on cultural etiquette and introductions",
  "You know what supplies to pack if your guide has flagged specific needs",
];

const providerChecklist = [
  "A clear description of what you offer or sell",
  "A reliable WhatsApp number or phone for guide coordination",
  "Opening days, availability, or preferred visiting times",
  "Experience price, duration, and group capacity if you host visitors",
  "A real photo that helps guides recognize your stall or workshop",
  "Practical needs such as materials, stock, volunteer skills, or donations",
];

const guideChecklist = [
  "Review approved Community Hub listings before each tour",
  "Select stops that match the visitor\u2019s interests and group size",
  "Contact providers in advance to confirm availability and pricing",
  "Brief visitors on cultural etiquette before each stop",
  "Facilitate introductions and translate if necessary",
  "Note any supply needs the visitor could help with on future visits",
];

/* ─────────────────────────────────────────────
   FAQ
   ───────────────────────────────────────────── */
const faqItems = [
  {
    question: "Can visitors browse the hub and go on their own?",
    answer:
      "The directory is publicly visible, but all in-person visits to community listings happen through a guided tour. Your guide handles coordination, introductions, and logistics so that both visitors and providers have a smooth experience.",
  },
  {
    question: "Are hosted experiences confirmed automatically?",
    answer:
      "No. The guide contacts the provider before the tour to confirm availability, timing, group size, and costs. Nothing is final until the guide has coordinated with both sides.",
  },
  {
    question: "How do providers get visitors?",
    answer:
      "Once a listing is approved, guides can include it in their tour routes. Providers don\u2019t need to manage visitor bookings directly \u2014 the guide handles all coordination.",
  },
  {
    question: "If I highlight a listing, is it guaranteed to be included?",
    answer:
      "No. Highlights are suggestions. Your guide decides what to include based on route timing, provider availability, group size, safety, and the overall tour plan.",
  },
  {
    question: "Can visitors contact providers directly?",
    answer:
      "Contact details are shown publicly for simple questions, but all on-site visits are coordinated through the assigned guide to ensure safety, respect, and proper introductions.",
  },
];

/* ─────────────────────────────────────────────
   Structured data (Schema.org)
   ───────────────────────────────────────────── */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: "Community Hub Guide",
      url: "https://visit.dzaleka.com/community-hub/guide",
      description:
        "Learn how guides use the Visit Dzaleka Community Hub to connect visitors with local businesses, artisans, and community projects during guided tours.",
      isPartOf: {
        "@type": "WebSite",
        name: "Visit Dzaleka",
        url: "https://visit.dzaleka.com",
      },
    },
    {
      "@type": "HowTo",
      name: "How Guided Tours Connect You with the Community Hub",
      step: visitorSteps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.title,
        text: step.description,
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ],
};

/* ═══════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════ */
export default function CommunityHubGuide() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Community Hub Guide | Visit Dzaleka"
        description="Learn how your guide uses the Community Hub to curate your tour stops — connecting you with local businesses, artisans, workshops, and community projects in Dzaleka."
        canonical="https://visit.dzaleka.com/community-hub/guide"
        ogImage={HERO_IMAGE}
        imageAlt="Dzaleka community entrepreneurship and innovation session"
        keywords="Dzaleka guided tour, community hub guide, refugee-led businesses Malawi, Dzaleka artisans, guided community visits, Dzaleka workshops"
        structuredData={structuredData}
      />
      <PublicHeader activePath="/community-hub/guide" />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <img
            src={HERO_IMAGE}
            alt="Dzaleka community entrepreneurship and innovation session"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            width={2048}
            height={1536}
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-slate-950/60" aria-hidden="true" />
          <div className="container relative mx-auto px-4 py-10 sm:py-12 lg:py-14">
            <div className="max-w-3xl">
              <Button asChild variant="ghost" className="mb-5 min-h-11 px-0 text-white hover:bg-white/10 hover:text-white">
                <Link href="/community-hub">
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                  Back to Community Hub
                </Link>
              </Button>
              <Badge className="mb-3 bg-white/15 text-white hover:bg-white/20">
                Public guide
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                How the Community Hub works
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
                Your assigned guide uses this directory to curate meaningful stops during your tour — introducing you to local businesses, artisans, community projects, and workshops first-hand.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" variant="secondary" className="min-h-11">
                  <Link href="/community-hub#community-directory">
                    Browse Listings
                    <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="min-h-11 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                  <Link href="/community-hub">
                    Submit a Listing
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Purpose strip ── */}
        <section className="border-b bg-muted/20">
          <div className="container mx-auto grid gap-4 px-4 py-8 sm:grid-cols-2 md:grid-cols-3">
            <div className="min-w-0 rounded-lg border bg-background p-5">
              <Compass className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2 className="mt-4 text-base font-semibold">Guide-led discovery</h2>
              <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
                Your guide selects community stops from the directory based on your interests, then takes you there personally during your tour.
              </p>
            </div>
            <div className="min-w-0 rounded-lg border bg-background p-5">
              <Building2 className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2 className="mt-4 text-base font-semibold">Who can list</h2>
              <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
                Local businesses, artisans, community initiatives, educators, and creatives can submit listings. Guides then include them in tour routes.
              </p>
            </div>
            <div className="min-w-0 rounded-lg border bg-background p-5 sm:col-span-2 md:col-span-1">
              <ClipboardCheck className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2 className="mt-4 text-base font-semibold">How coordination works</h2>
              <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
                Guides contact providers before the tour to confirm availability, costs, and logistics. The visitor simply follows their guide.
              </p>
            </div>
          </div>
        </section>

        {/* ── Step by step ── */}
        <section className="container mx-auto px-4 py-10 sm:py-12">
          <div className="mb-7 max-w-3xl">
            <Badge variant="outline" className="mb-3">Step by step</Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How each role fits in</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Visitors book a tour. Guides curate the route. Providers keep their listings accurate. Everyone has a clear role.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Visitor column */}
            <div className="min-w-0 rounded-lg border bg-muted/20 p-5 sm:p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Compass className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold">For visitors</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Book your tour and let your guide handle the rest. They'll select relevant stops and introduce you personally.
                  </p>
                </div>
              </div>
              <div className="grid gap-3">
                {visitorSteps.map((step, index) => (
                  <GuideStep key={step.title} index={index} tone="primary" {...step} />
                ))}
              </div>
            </div>

            {/* Provider column */}
            <div className="min-w-0 rounded-lg border bg-muted/20 p-5 sm:p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="rounded-md bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold">For providers</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Submit your listing with accurate details. Guides will coordinate with you before bringing visitors.
                  </p>
                </div>
              </div>
              <div className="grid gap-3">
                {providerSteps.map((step, index) => (
                  <GuideStep key={step.title} index={index} tone="emerald" {...step} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Request flow ── */}
        <section className="border-y bg-muted/20">
          <div className="container mx-auto px-4 py-10 sm:py-12">
            <div className="mb-7 max-w-3xl">
              <Badge variant="outline" className="mb-3">Tour coordination</Badge>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How a community stop happens</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                Your guide coordinates everything behind the scenes so each community stop feels natural and well-prepared.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {requestFlow.map((item, index) => (
                <Card key={item} className="min-w-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-primary">Step {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="break-words text-sm leading-6 text-muted-foreground">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── Checklists ── */}
        <section className="container mx-auto px-4 py-10 sm:py-12">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Visitor checklist */}
            <div className="min-w-0 rounded-lg border p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                <Compass className="h-5 w-5 text-primary" aria-hidden="true" />
                Visitors should
              </h2>
              <ul className="mt-5 grid gap-3">
                {visitorChecklist.map((item) => (
                  <ChecklistItem key={item}>{item}</ChecklistItem>
                ))}
              </ul>
            </div>

            {/* Guide checklist */}
            <div className="min-w-0 rounded-lg border border-primary/20 bg-primary/5 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                Guides should
              </h2>
              <ul className="mt-5 grid gap-3">
                {guideChecklist.map((item) => (
                  <ChecklistItem key={item}>{item}</ChecklistItem>
                ))}
              </ul>
            </div>

            {/* Provider checklist */}
            <div className="min-w-0 rounded-lg border p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                <Package className="h-5 w-5 text-primary" aria-hidden="true" />
                Providers should include
              </h2>
              <ul className="mt-5 grid gap-3">
                {providerChecklist.map((item) => (
                  <ChecklistItem key={item}>{item}</ChecklistItem>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="flex items-start gap-3 text-sm leading-6">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              The hub helps people connect, but all visits are guide-led. Visitors should follow their guide's lead on introductions, photography permissions, and cultural etiquette. Guides ensure providers are comfortable and prepared before any visit.
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="border-t bg-muted/20">
          <div className="container mx-auto px-4 py-10 sm:py-12">
            <div className="mb-7 max-w-3xl">
              <Badge variant="outline" className="mb-3">Questions</Badge>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Quick answers</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {faqItems.map((item) => (
                <Card key={item.question} className="min-w-0">
                  <CardHeader>
                    <CardTitle className="break-words text-base">{item.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="break-words text-sm leading-6 text-muted-foreground">{item.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="min-h-11">
                <Link href="/community-hub#community-directory">Browse Listings</Link>
              </Button>
              <Button asChild variant="outline" className="min-h-11">
                <Link href="/contact">Contact Visit Dzaleka</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────── */

type GuideStepProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
  tone: "primary" | "emerald";
};

function GuideStep({ icon: Icon, title, description, index, tone }: GuideStepProps) {
  const numberClass =
    tone === "primary"
      ? "bg-primary text-primary-foreground"
      : "bg-emerald-600 text-white";
  const iconClass =
    tone === "primary"
      ? "text-primary"
      : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="flex min-w-0 gap-3 rounded-md border bg-background p-4">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${numberClass}`}>
        {index + 1}
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-2 break-words text-sm font-semibold">
          <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} aria-hidden="true" />
          {title}
        </p>
        <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ChecklistItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex min-w-0 items-start gap-3 text-sm leading-6 text-muted-foreground">
      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      <span className="break-words">{children}</span>
    </li>
  );
}
