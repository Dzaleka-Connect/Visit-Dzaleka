import { useState } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, ExternalLink, MapPin, Users, Building, Droplets, GraduationCap, Heart, Menu, X } from "lucide-react";

export default function DzalekaMap() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const mappingHighlights = [
        {
            icon: Building,
            title: "Buildings & Housing",
            description: "Over 10,000 structures mapped, providing visibility into the camp's infrastructure and housing density."
        },
        {
            icon: GraduationCap,
            title: "Education Centers",
            description: "Schools and learning facilities mapped to assess educational access for the refugee population."
        },
        {
            icon: Heart,
            title: "Health Facilities",
            description: "Health centers within and around the camp that provide care to refugees."
        },
        {
            icon: Droplets,
            title: "Water Sources",
            description: "43 boreholes mapped, serving as the main water source for over 43,000 residents."
        }
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Helmet>
                <title>Dzaleka Map - Interactive OpenStreetMap | Dzaleka Visit</title>
                <meta
                    name="description"
                    content="Explore the interactive OpenStreetMap of Dzaleka Refugee Camp. View mapped facilities, infrastructure, and learn about the community-led mapping project."
                />
            </Helmet>

            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/">
                        <div className="flex items-center gap-3 cursor-pointer">
                            <img src="https://services.dzaleka.com/images/dzaleka-digital-heritage.png" alt="Dzaleka Visit Logo" className="h-10 w-10 rounded-lg shadow-sm" />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold tracking-tight">Dzaleka Visit</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    Official Portal
                                </span>
                            </div>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-4">
                        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
                        <Link href="/blog" className="text-sm font-medium hover:text-primary transition-colors">Blog</Link>
                        <Link href="/life-in-dzaleka" className="text-sm font-medium hover:text-primary transition-colors">Life in Dzaleka</Link>
                        <div className="relative group">
                            <Link href="/plan-your-trip" className="text-sm font-medium text-primary transition-colors flex items-center gap-1">
                                Plan Your Trip
                                <svg className="h-3 w-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </Link>
                            <div className="absolute left-0 top-full mt-1 w-48 rounded-md border bg-background shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                <div className="py-1">
                                    <Link href="/plan-your-trip" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Trip Planner</Link>
                                    <Link href="/plan-your-trip/visitor-essentials" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Visitor Essentials</Link>
                                    <Link href="/plan-your-trip/safe-travel" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Safe Travel</Link>
                                    <Link href="/plan-your-trip/public-holidays" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Public Holidays</Link>
                                    <Link href="/plan-your-trip/dzaleka-map" className="block px-4 py-2 text-sm hover:bg-muted transition-colors font-medium">Dzaleka Map</Link>
                                    <Link href="/accommodation" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Accommodation</Link>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                            <Button asChild size="sm">
                                <Link href="/login">Book Now</Link>
                            </Button>
                        </div>
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Nav */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t bg-background p-4 space-y-3">
                        <Link href="/" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                        <Link href="/blog" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
                        <Link href="/life-in-dzaleka" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Life in Dzaleka</Link>
                        <Link href="/plan-your-trip" className="block text-sm font-medium py-1 text-primary" onClick={() => setMobileMenuOpen(false)}>Plan Your Trip</Link>
                        <Link href="/plan-your-trip/visitor-essentials" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Visitor Essentials</Link>
                        <Link href="/plan-your-trip/public-holidays" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Public Holidays</Link>
                        <Link href="/plan-your-trip/dzaleka-map" className="block text-sm font-medium py-1 pl-4 text-primary" onClick={() => setMobileMenuOpen(false)}>↳ Dzaleka Map</Link>
                        <Link href="/accommodation" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Accommodation</Link>
                        <div className="flex gap-2 pt-2">
                            <Button asChild className="flex-1">
                                <Link href="/login">Book Now</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage:
                                "url('https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Openstreetmap_logo.svg/1200px-Openstreetmap_logo.svg.png')",
                            backgroundSize: "contain",
                            backgroundColor: "#f0f0f0"
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/60" />
                    </div>
                    <div className="relative container mx-auto h-full flex items-center justify-center text-center text-white">
                        <div className="max-w-2xl px-4 animate-fade-up">
                            <Badge variant="outline" className="mb-4 border-white/30 bg-white/10 text-white">
                                <Map className="mr-2 h-3.5 w-3.5" />
                                Interactive Map
                            </Badge>
                            <h1 className="text-4xl md:text-6xl font-bold mb-4">
                                Dzaleka Map
                            </h1>
                            <p className="text-lg md:text-xl text-gray-200">
                                Explore Dzaleka Refugee Camp on OpenStreetMap — a community-led mapping initiative
                            </p>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto py-12 space-y-12 px-4">
                    {/* Intro Section */}
                    <div className="max-w-3xl mx-auto text-center space-y-4">
                        <h2 className="text-3xl font-bold text-foreground">
                            The Dzaleka Mapping Project
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            In 2021, <strong>MapMalawi</strong> — founded by Ndapile Mkuwu and Zola Manyungwa —
                            received a Humanitarian OpenStreetMap Team (HOT) Community Impact Microgrant to
                            create detailed, open-source maps of Dzaleka Refugee Camp. Working with local
                            youth from <strong>TakenoLAB</strong> and graduates from the African Drone and
                            Data Academy (ADDA), the project used drones and community mapping to document
                            the camp's infrastructure.
                        </p>
                    </div>

                    {/* Interactive Map Embed */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Interactive Map</h2>
                        </div>

                        <Card className="overflow-hidden border-2">
                            <CardContent className="p-0">
                                <iframe
                                    title="Dzaleka Refugee Camp on OpenStreetMap"
                                    width="100%"
                                    height="500"
                                    frameBorder="0"
                                    scrolling="no"
                                    marginHeight={0}
                                    marginWidth={0}
                                    src="https://www.openstreetmap.org/export/embed.html?bbox=33.86000%2C-13.67000%2C33.88500%2C-13.65500&layer=mapnik&marker=-13.661378%2C33.870569"
                                    style={{ border: "1px solid #ccc", borderRadius: "8px" }}
                                />
                            </CardContent>
                        </Card>

                        <div className="flex flex-wrap gap-4 justify-center">
                            <Button asChild variant="outline">
                                <a
                                    href="https://www.openstreetmap.org/#map=19/-13.661378/33.870569"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View Full Map <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                            <Button asChild variant="outline">
                                <a
                                    href="https://www.openstreetmap.org/search?query=Dzaleka%20Refugee%20Camp"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Search on OSM <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    </div>

                    {/* What Was Mapped */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Map className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">What Was Mapped</h2>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {mappingHighlights.map((item, index) => (
                                <Card key={index} className="border-border hover:border-primary/50 transition-colors">
                                    <CardHeader className="pb-2">
                                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                            <item.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <CardTitle className="text-lg font-semibold">
                                            {item.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* About the Project */}
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-bold">Community-Led Mapping</h2>
                            </div>
                            <p className="text-muted-foreground">
                                The project was driven by community involvement, particularly youth from
                                within and around the refugee camp. Working with <strong>TakenoLAB</strong>,
                                a local tech lab, young people learned to use OpenStreetMap and geospatial
                                technologies to document their own community.
                            </p>
                            <p className="text-muted-foreground">
                                Drones captured high-resolution imagery (3cm/pixel) at 90m altitude,
                                which was then used for detailed digitization on OpenStreetMap. The
                                imagery has been shared with UNHCR to support decongestion efforts.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Button asChild>
                                    <a
                                        href="https://www.hotosm.org/en/news/mapmalawis-dzaleka-mapping-project-osm-mapping-for-people-living-in-protracted-crisis/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Read Full Story <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                                <Button asChild variant="outline">
                                    <a
                                        href="https://wiki.openstreetmap.org/wiki/Humanitarian_OSM_Team/HOT_Microgrants/Community_Impact_Microgrants_2021/Proposal/Dzaleka_Mapping"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Project Proposal <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                        <div className="bg-muted/30 rounded-2xl p-8 space-y-4">
                            <h3 className="text-xl font-bold">Key Partners</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                                    <div>
                                        <span className="font-semibold">MapMalawi</span>
                                        <p className="text-sm text-muted-foreground">Founded by Ndapile Mkuwu and Zola Manyungwa</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                                    <div>
                                        <span className="font-semibold">Humanitarian OpenStreetMap Team (HOT)</span>
                                        <p className="text-sm text-muted-foreground">Community Impact Microgrant funder</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                                    <div>
                                        <span className="font-semibold">TakenoLAB</span>
                                        <p className="text-sm text-muted-foreground">Local tech lab with youth from the camp</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                                    <div>
                                        <span className="font-semibold">African Drone and Data Academy (ADDA)</span>
                                        <p className="text-sm text-muted-foreground">Provided drone expertise and graduates</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-12 text-center">
                        <h2 className="text-3xl font-bold mb-4">Contribute to the Map</h2>
                        <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto mb-6">
                            OpenStreetMap is a collaborative project. You can help improve the map
                            of Dzaleka by adding details, correcting information, or just exploring
                            what the community has created.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Button asChild variant="secondary" size="lg">
                                <a
                                    href="https://www.openstreetmap.org/#map=19/-13.661378/33.870569"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Explore on OpenStreetMap <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                                <a
                                    href="https://www.hotosm.org/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Learn About HOT
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
