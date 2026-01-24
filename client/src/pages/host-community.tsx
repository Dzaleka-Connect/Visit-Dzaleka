import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Radio, Menu, X, Globe, Users, Music, Handshake, Store, Share2, Heart, Trees, Church, Home } from "lucide-react";
import { useState } from "react";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";

// Structured Data for Article (Host Community)
const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Article",
            "headline": "The Host Community of Dowa: Culture & Coexistence",
            "description": "Explore the Chewa culture of Dowa District and the symbiotic relationship between Dzaleka refugees and their Malawian hosts.",
            "author": {
                "@type": "Organization",
                "name": "Visit Dzaleka"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Visit Dzaleka",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://services.dzaleka.com/images/dzaleka-digital-heritage.png"
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": "https://visit.dzaleka.com/things-to-do/host-community"
            }
        }
    ]
};

export default function HostCommunity() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const culturePoints = [
        {
            icon: Heart,
            title: "Alendo ndi Mame",
            description: "A Chewa proverb meaning 'Visitors are like dew'—precious but temporary. It reflects the deep value placed on hospitality.",
        },
        {
            icon: Handshake,
            title: "Greetings: 'Moni'",
            description: "Respect is paramount. Always greet with 'Moni' (Hello) or 'Wawa' (to elders). Handshakes are soft and prolonged.",
        },
        {
            icon: Music,
            title: "Gule Wamkulu",
            description: "The 'Great Dance' of the Chewa people involves masked dancers and is a UNESCO Intangible Cultural Heritage.",
        },
        {
            icon: Home,
            title: "'Odi, Odi'",
            description: "The traditional way to knock. Visitors call out 'Odi, Odi!' at the gate and wait for a welcoming 'Odini!' before entering.",
        }
    ];

    const integrationPoints = [
        {
            icon: Store,
            title: "Economic Symbiosis",
            description: "Dzaleka is a massive market. Refugees buy local produce, while Malawians patronize camp businesses for goods and services.",
        },
        {
            icon: Share2,
            title: "Cultural Exchange",
            description: "Events like the Tumaini Festival see thousands of Malawians celebrating alongside refugees, breaking down social barriers.",
        },
        {
            icon: Trees,
            title: "Shared Challenges",
            description: "Both communities face resource scarcity, but this often drives cooperation in agriculture and environmental management.",
        },
        {
            icon: Radio,
            title: "Radio for Inclusion",
            description: "Yetu Community Radio features presenters from both communities, bridging gaps and dispelling myths through dialogue.",
        }
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Host Community & Culture around Dzaleka"
                description="Discover the Malawian host community around Dzaleka. Learn about Chewa traditions, the proverb 'Alendo ndi mame', and the economic partnership between locals and refugees."
                keywords="Dzaleka host community, Chewa culture, Alendo ndi mame, Gule Wamkulu, Dowa district economy, refugee integration Malawi"
                canonical="https://visit.dzaleka.com/things-to-do/host-community"
                ogImage="https://i.kickstarter.com/assets/035/136/436/b82196f7bef5b7747e77183fdcf1f5c1_original.JPG?anim=false&fit=cover&gravity=auto&height=873&origin=ugc&q=92&v=1633523591&width=1552&sig=oBKQ45RRC9IUlKPnSJGhyCyHZg%2BjcVijIqChC8sXsSs%3D"
            />
            {/* Inject Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

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

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-4">
                        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
                        <Link href="/blog" className="text-sm font-medium hover:text-primary transition-colors">Blog</Link>
                        <div className="relative group">
                            <button className="text-sm font-medium text-primary transition-colors flex items-center gap-1">
                                Things To Do
                                <svg className="h-3 w-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div className="absolute left-0 top-full mt-1 w-48 rounded-md border bg-background shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                <div className="py-1">
                                    <Link href="/things-to-do" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">All Experiences</Link>
                                    <Link href="/things-to-do/arts-culture" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Arts & Culture</Link>
                                    <Link href="/things-to-do/shopping" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Shopping & Markets</Link>
                                    <Link href="/things-to-do/sports-recreation" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Sports & Recreation</Link>
                                    <Link href="/things-to-do/host-community" className="block px-4 py-2 text-sm bg-muted/50 text-primary font-medium">Host Community</Link>
                                </div>
                            </div>
                        </div>
                        <Link href="/accommodation" className="text-sm font-medium hover:text-primary transition-colors">Accommodation</Link>
                        <Link href="/whats-on" className="text-sm font-medium hover:text-primary transition-colors">What's On</Link>
                        <div className="relative group">
                            <Link href="/plan-your-trip" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                                Plan Your Trip
                                <svg className="h-3 w-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </Link>
                            <div className="absolute left-0 top-full mt-1 w-48 rounded-md border bg-background shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                <div className="py-1">
                                    <Link href="/plan-your-trip" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Trip Planner</Link>
                                    <Link href="/plan-your-trip/visitor-essentials" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Visitor Essentials</Link>
                                    <Link href="/plan-your-trip/public-holidays" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Public Holidays</Link>
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
                        <Link href="/things-to-do" className="block text-sm font-medium py-1 text-primary" onClick={() => setMobileMenuOpen(false)}>Things To Do</Link>
                        <Link href="/things-to-do/arts-culture" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Arts & Culture</Link>
                        <Link href="/things-to-do/shopping" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Shopping & Markets</Link>
                        <Link href="/things-to-do/sports-recreation" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Sports & Recreation</Link>
                        <Link href="/things-to-do/host-community" className="block text-sm font-medium py-1 pl-4 text-primary" onClick={() => setMobileMenuOpen(false)}>↳ Host Community</Link>
                        <Link href="/accommodation" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Accommodation</Link>
                        <Link href="/whats-on" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>What's On</Link>
                        <Link href="/plan-your-trip" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Plan Your Trip</Link>
                        <Link href="/plan-your-trip/visitor-essentials" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Visitor Essentials</Link>
                        <Link href="/plan-your-trip/public-holidays" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Public Holidays</Link>
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
                <div className="relative py-24 overflow-hidden">
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: 'url(https://i.kickstarter.com/assets/035/136/091/fa85f28e74de5419717601c4d3ffd08d_original.JPG?fit=scale-down&origin=ugc&q=92&v=1633521126&width=680&sig=Hxu%2BVokRArUbcgSYPb06e5QGOTXuOBwCBYlag1TYvqY%3D)' }}
                    />
                    <div className="absolute inset-0 bg-black/60" />

                    <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-white/30 bg-white/10 text-white rounded-full uppercase tracking-widest font-semibold flex items-center justify-center w-fit mx-auto backdrop-blur-sm">
                            <Handshake className="mr-2 h-3.5 w-3.5" />
                            Coexistence & Culture
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-white">
                            Host Community & Culture
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
                            The surrounding Dowa district is home to the Chewa people. Explore the rich traditions and the vital economic partnership shared between refugees and their Malawian neighbors.
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-16 space-y-24">

                    {/* Intro */}
                    <section className="max-w-3xl mx-auto text-center">
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            The host communities, primarily of the Chewa ethnic group, are known for their warmth. The local philosophy is best captured by the proverb <strong className="text-primary text-xl font-medium">"Alendo ndi mame"</strong> (Visitors are like dew)—signifying that a guest's presence is precious and should be cherished.
                        </p>
                    </section>

                    {/* Malawian Culture Grid */}
                    <section>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Malawian Traditions & Etiquette</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Understanding these cultural pillars will deepen your connection with the local community in Dowa.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {culturePoints.map((item, index) => (
                                <Card key={index} className="overflow-hidden hover:shadow-lg transition-all border-none bg-muted/30">
                                    <CardContent className="p-6 text-center">
                                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                            <item.icon className="h-7 w-7 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                                        <p className="text-muted-foreground text-sm">{item.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Interaction & Integration Detail */}
                    <section className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-1 relative">
                            <div className="aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-muted">
                                <img
                                    src="https://i.kickstarter.com/assets/035/136/436/b82196f7bef5b7747e77183fdcf1f5c1_original.JPG?anim=false&fit=cover&gravity=auto&height=873&origin=ugc&q=92&v=1633523591&width=1552&sig=oBKQ45RRC9IUlKPnSJGhyCyHZg%2BjcVijIqChC8sXsSs%3D"
                                    alt="Malawian village life near Dzaleka"
                                    className="w-full h-full object-cover"
                                />
                                {/* Placeholder logic */}
                            </div>
                            <div className="absolute -bottom-6 -left-6 -z-10 w-full h-full border-2 border-primary/10 rounded-2xl" />
                        </div>
                        <div className="order-2 space-y-6">
                            <div className="flex items-center gap-3 text-primary font-semibold">
                                <Heart className="h-5 w-5" />
                                <span>Integration & Economy</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight">A Symbiotic Relationship</h2>
                            <p className="text-muted-foreground text-lg">
                                The relationship between Dzaleka and Dowa is complex but vital. The camp acts as a major economic engine, creating a market for local farmers and businesses, while hosting a diverse workforce that contributes to the district's development.
                            </p>
                            <div className="space-y-4">
                                {integrationPoints.map((point, idx) => (
                                    <div key={idx} className="flex gap-4 items-start p-4 rounded-lg bg-background border shadow-sm">
                                        <point.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-semibold block text-foreground">{point.title}</span>
                                            <span className="text-muted-foreground text-sm">{point.description}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
