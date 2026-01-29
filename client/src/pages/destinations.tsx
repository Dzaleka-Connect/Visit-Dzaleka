import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, MapPin, Mountain, Home, Building2, Users, Tent, ArrowRight, Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const destinations = [
    {
        name: "Kawale 1",
        description: "The central/main road area, considered the \"spine\" of the camp. Most organizations, shops, and social activity are concentrated here.",
        highlights: [
            "UNHCR office",
            "Plan International (Children's Library, Youth Centre)",
            "Jesuit Refugee Service (Adult Courses, Katudza School)",
            "Jesuit Worldwide Learning",
            "Community-based organizations (Salama Africa, Soferes)",
            "Markets and churches"
        ],
        icon: Building2,
        featured: true,
    },
    {
        name: "Katudza",
        description: "Upper part of the camp, newer and with more space. Home to Katudza Primary and Secondary School (JRS). Many CBOs/RLOs are based here.",
        highlights: [
            "Soferes",
            "Takenolab",
            "INUA",
            "Filling station",
            "Tuesday Market"
        ],
        icon: Home,
        featured: true,
    },
    {
        name: "Dzaleka Hill",
        description: "A natural landmark offering panoramic views of the Dzaleka Refugee Camp and the surrounding area. The hill provides a popular viewpoint and a way to see the large and growing settlement, including areas like \"New Katubza\".",
        highlights: [
            "Panoramic views",
            "Popular viewpoint",
            "Photography spot"
        ],
        icon: Mountain,
        featured: true,
    },
    {
        name: "New Katubza",
        description: "Newer and extended sections of the camp. Significant progress has been made in recent years to establish shelters and infrastructure in extension areas to accommodate more new arrivals and alleviate overcrowding in older zones.",
        highlights: [
            "Newer infrastructure",
            "Extended housing areas"
        ],
        icon: Home,
        featured: false,
    },
    {
        name: "Likuni 1 & 2",
        description: "Similar to Kawale, these zones serve as residential areas for asylum seekers and refugees.",
        highlights: [
            "Residential area",
            "Community housing"
        ],
        icon: Users,
        featured: false,
    },
    {
        name: "Blantyre",
        description: "A zone named after Malawi's commercial hub, a residential part of the camp's layout.",
        highlights: [
            "Residential zone",
            "Named after Malawi's commercial capital"
        ],
        icon: MapPin,
        featured: false,
    },
    {
        name: "Karonga",
        description: "Named after the Malawian city. A residential area within the camp.",
        highlights: [
            "Residential area"
        ],
        icon: MapPin,
        featured: false,
    },
    {
        name: "Zomba",
        description: "A zone named after Malawi's former capital city, serving as a section of the camp's housing and community areas.",
        highlights: [
            "Named after Malawi's former capital",
            "Residential zone"
        ],
        icon: MapPin,
        featured: false,
    },
    {
        name: "Lisungwi",
        description: "A residential zone within the camp.",
        highlights: [
            "Residential area"
        ],
        icon: MapPin,
        featured: false,
    },
    {
        name: "Quarantine/Tents Area",
        description: "Temporary housing, often for new arrivals or those awaiting processing.",
        highlights: [
            "Temporary housing",
            "New arrivals processing"
        ],
        icon: Tent,
        featured: false,
    },
];

export default function Destinations() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const featuredDestinations = destinations.filter(d => d.featured);
    const otherDestinations = destinations.filter(d => !d.featured);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Destinations | Explore Dzaleka Zones"
                description="Discover the different zones and neighborhoods of Dzaleka Refugee Camp. From the bustling Kawale area to the scenic Dzaleka Hill viewpoint."
                canonical="https://visit.dzaleka.com/destinations"
                keywords="Dzaleka zones, Kawale, Katudza, Dzaleka Hill, refugee camp areas, Dzaleka neighborhoods"
            />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        "itemListElement": destinations.map((dest, index) => ({
                            "@type": "ListItem",
                            "position": index + 1,
                            "item": {
                                "@type": "Place",
                                "name": dest.name,
                                "description": dest.description,
                                "address": {
                                    "@type": "PostalAddress",
                                    "addressLocality": "Dzaleka Refugee Camp",
                                    "addressRegion": "Dowa",
                                    "addressCountry": "MW"
                                }
                            }
                        }))
                    })
                }}
            />

            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/">
                        <div className="flex items-center gap-3 cursor-pointer">
                            <img src="https://services.dzaleka.com/images/dzaleka-digital-heritage.png" alt="Visit Dzaleka Logo" className="h-10 w-10 rounded-lg shadow-sm" />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold tracking-tight">Visit Dzaleka</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    Official Portal
                                </span>
                            </div>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-4">
                        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
                        <Link href="/destinations" className="text-sm font-medium text-primary transition-colors">Destinations</Link>
                        <Link href="/things-to-do" className="text-sm font-medium hover:text-primary transition-colors">Things To Do</Link>
                        <Link href="/blog" className="text-sm font-medium hover:text-primary transition-colors">Blog</Link>
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
                        <Link href="/destinations" className="block text-sm font-medium py-1 text-primary" onClick={() => setMobileMenuOpen(false)}>Destinations</Link>
                        <Link href="/things-to-do" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Things To Do</Link>
                        <Link href="/blog" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
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
                <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24 border-b">
                    <div className="container mx-auto px-4">
                        <Button asChild variant="ghost" size="sm" className="mb-8 -ml-4">
                            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
                        </Button>

                        <div className="max-w-3xl">
                            <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full uppercase tracking-widest font-semibold">
                                Explore the Camp
                            </Badge>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                                Destinations in Dzaleka
                            </h1>
                            <p className="text-xl text-muted-foreground leading-relaxed">
                                Dzaleka Refugee Camp is organized into distinct zones, each with its own character, history, and community.
                                Discover the neighborhoods that make up this vibrant settlement of over 57,000 residents.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Featured Destinations */}
                <section className="py-16">
                    <div className="container mx-auto px-4">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Featured Destinations</h2>
                        <p className="text-muted-foreground mb-8">Key areas to explore during your visit</p>

                        <div className="grid gap-6 md:grid-cols-3">
                            {featuredDestinations.map((dest) => (
                                <Card key={dest.name} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                                <dest.icon className="h-6 w-6 text-primary" />
                                            </div>
                                            <Badge variant="secondary" className="text-xs">Featured</Badge>
                                        </div>
                                        <CardTitle className="text-xl">{dest.name}</CardTitle>
                                        <CardDescription className="text-sm leading-relaxed">
                                            {dest.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <h4 className="text-sm font-semibold mb-2">Highlights:</h4>
                                        <ul className="space-y-1">
                                            {dest.highlights.map((highlight, idx) => (
                                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                                    <span className="text-primary mt-1">•</span>
                                                    {highlight}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* All Zones */}
                <section className="py-16 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">All Zones</h2>
                        <p className="text-muted-foreground mb-8">Complete list of neighborhoods in Dzaleka</p>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {otherDestinations.map((dest) => (
                                <Card key={dest.name} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                <dest.icon className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold mb-1">{dest.name}</h3>
                                                <p className="text-sm text-muted-foreground">{dest.description}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16">
                    <div className="container mx-auto px-4">
                        <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="p-8 md:p-12 text-center">
                                <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Explore?</h2>
                                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                                    Book a guided tour with a local guide who can take you through these destinations
                                    and share the stories, culture, and daily life of each neighborhood.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button asChild size="lg">
                                        <Link href="/login">
                                            Book a Tour <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg">
                                        <Link href="/things-to-do">
                                            View Experiences
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
