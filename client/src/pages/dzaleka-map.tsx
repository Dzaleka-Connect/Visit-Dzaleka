import { Link } from "wouter";
import {
  Building2,
  Camera,
  Compass,
  Droplets,
  ExternalLink,
  GraduationCap,
  HeartPulse,
  Info,
  Layers,
  Map,
  MapPin,
  Navigation,
  Route,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { SEO } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const mapEmbedUrl =
  "https://www.openstreetmap.org/export/embed.html?bbox=33.86000%2C-13.67000%2C33.88500%2C-13.65500&layer=mapnik&marker=-13.661378%2C33.870569";
const fullMapUrl = "https://www.openstreetmap.org/#map=16/-13.6614/33.8706";
const directionsUrl =
  "https://www.google.com/maps/search/?api=1&query=UNHCR%20Plan%20International%20Compound%20Dzaleka%20Refugee%20Camp";

const mapStats = [
  { label: "Mapped structures", value: "10,000+", icon: Building2 },
  { label: "Water points recorded", value: "43", icon: Droplets },
  { label: "Primary use", value: "Orientation", icon: Compass },
  { label: "Data source", value: "OpenStreetMap", icon: Map },
];

const mappedLayers = [
  {
    icon: Building2,
    title: "Buildings and housing",
    description: "Mapped structures help show the density and layout of the settlement.",
  },
  {
    icon: GraduationCap,
    title: "Education spaces",
    description: "Schools and learning facilities help visitors understand access points for education.",
  },
  {
    icon: HeartPulse,
    title: "Health and services",
    description: "Public service locations give context for daily life and support systems.",
  },
  {
    icon: Droplets,
    title: "Water sources",
    description: "Mapped boreholes and water points support community planning and basic orientation.",
  },
];

const visitorGuidance = [
  {
    icon: Navigation,
    title: "Use it for orientation",
    description: "The map helps you understand Dzaleka's shape before arrival. Your guide confirms the actual route.",
  },
  {
    icon: Route,
    title: "Routes can change",
    description: "Tours adapt to weather, safety guidance, market days, and community availability.",
  },
  {
    icon: Camera,
    title: "Ask before photos",
    description: "Mapped places are not automatic photo zones. Please follow your guide's consent guidance.",
  },
  {
    icon: ShieldCheck,
    title: "Respect access limits",
    description: "Some organizations, homes, and facilities require permission or are not open to visitors.",
  },
];

const partners = [
  {
    name: "MapMalawi",
    detail: "Community mapping organization founded by Ndapile Mkuwu and Zola Manyungwa.",
  },
  {
    name: "Humanitarian OpenStreetMap Team",
    detail: "Supported the 2021 Community Impact Microgrant.",
  },
  {
    name: "TakenoLAB",
    detail: "Local technology lab that involved youth from the camp in mapping work.",
  },
  {
    name: "African Drone and Data Academy",
    detail: "Provided drone and geospatial skills through trained graduates.",
  },
];

export default function DzalekaMap() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Dzaleka Map"
        description="Explore Dzaleka Refugee Camp with OpenStreetMap, visitor orientation notes, meeting point guidance, and context from community-led mapping work."
        canonical="https://visit.dzaleka.com/plan-your-trip/dzaleka-map"
        keywords="Dzaleka map, Dzaleka Refugee Camp OpenStreetMap, Dzaleka visitor map, Dzaleka meeting point, MapMalawi, Dzaleka orientation"
      />
      <PublicHeader activePath="/plan-your-trip" />

      <main>
        <section className="border-b bg-muted/30">
          <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-14">
            <div className="flex flex-col justify-center">
              <Badge variant="outline" className="mb-4 w-fit gap-2">
                <Map className="h-3.5 w-3.5" />
                Visitor orientation map
              </Badge>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                Explore Dzaleka before you arrive
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                Use this map to understand the camp layout, key access areas, and the community-led OpenStreetMap work behind the data. Your final tour route is always confirmed by staff and your guide.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <a href={fullMapUrl} target="_blank" rel="noopener noreferrer">
                    Open full map
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                    Main meeting point
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick map facts</CardTitle>
                <CardDescription>Helpful context for visitors and staff planning visits.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {mapStats.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-muted-foreground">{label}</div>
                      <div className="truncate font-semibold tabular-nums">{value}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <Card className="overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Interactive OpenStreetMap
                    </CardTitle>
                    <CardDescription>Dzaleka Refugee Camp and surrounding access area.</CardDescription>
                  </div>
                  <Badge variant="secondary" className="w-fit">External map data</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative min-h-[420px] w-full md:min-h-[560px]">
                  <iframe
                    title="Dzaleka Refugee Camp on OpenStreetMap"
                    className="absolute inset-0 h-full w-full border-0"
                    src={mapEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Visitor note
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    The public map is useful for orientation, but it should not be used as permission to enter facilities, homes, or organization spaces.
                  </p>
                  <p>
                    Meet at the confirmed meeting point and follow your guide's route and safety instructions.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Planning actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-between">
                    <Link href="/things-to-do/dzaleka-refugee-camp-guided-walking-tour">
                      View guided tour
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link href="/plan-your-trip/visitor-essentials">
                      Visitor essentials
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <a href={fullMapUrl} target="_blank" rel="noopener noreferrer">
                      Open in OpenStreetMap
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/30 py-10">
          <div className="container mx-auto px-4">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">What the map helps show</h2>
                <p className="text-sm text-muted-foreground">Layers of community infrastructure and orientation context.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {mappedLayers.map(({ icon: Icon, title, description }) => (
                <Card key={title}>
                  <CardContent className="p-5">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div>
            <Badge variant="outline" className="mb-4 gap-2">
              <Users className="h-3.5 w-3.5" />
              Community mapping
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">Mapped by people connected to the place</h2>
            <p className="mt-4 text-muted-foreground">
              In 2021, MapMalawi received a Humanitarian OpenStreetMap Team Community Impact Microgrant to support detailed mapping of Dzaleka. The work involved local youth, TakenoLAB, and geospatial contributors who helped document infrastructure that is often missing from mainstream maps.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {partners.map((partner) => (
              <Card key={partner.name}>
                <CardHeader>
                  <CardTitle className="text-lg">{partner.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{partner.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-12">
          <Card>
            <CardHeader>
              <CardTitle>How to use this map respectfully</CardTitle>
              <CardDescription>Simple guidance for visitors, partners, and staff preparing a route.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {visitorGuidance.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-lg border p-4">
                  <Icon className="mb-3 h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
