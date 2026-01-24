import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Menu, X, Leaf, Mountain, Trees, ShieldCheck, Sun, Star, ExternalLink, ArrowRight } from "lucide-react";
import { useState } from "react";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";

export default function NatureOutdoors() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const withinCamp = [
        {
            title: "Dzaleka Hill Trails",
            icon: Mountain,
            description: "The area around the camp and the specific zone of Dzaleka Hill offers a neighborhood with trails popular for hiking, running, and general nature exploration among residents and local scout groups."
        },
        {
            title: "Community Gardens",
            icon: Leaf,
            description: "Projects such as Dzaleka Life Gardens empower refugees through organic farming, nutrition education, and permaculture practices, providing hands-on opportunities to connect with nature and grow food."
        },
        {
            title: "Conservation Efforts",
            icon: ShieldCheck,
            description: "Various community and NGO-led initiatives focus on the protection and restoration of natural ecosystems within and surrounding the camp, offering insight into local conservation and natural resource regeneration efforts."
        }
    ];

    const nearbyAttractions = [
        {
            title: "Kuti Wildlife Reserve",
            description: "Situated approximately 1.5 hours away, this reserve has no dangerous predators, making it safe for walking and cycling safaris to see animals like zebra, giraffe, and various birds up close.",
            type: "Wildlife park",
            image: "https://lh3.googleusercontent.com/p/AF1QipNnh8kZX37TfUOWiEY9IiCkA_It7C-XvU2vRYhp=s1360-w1360-h1020-rw",
            location: "Salima Road",
            distance: "~1.5 hrs",
            mapUrl: "https://www.google.com/maps/place/Kuti+Wildlife+Reserve/@-13.7277254,34.4190763,17z",
            externalUrl: "https://www.kuti-wildlife.org/"
        },
        {
            title: "Lake Malawi National Park",
            description: "A UNESCO World Heritage site and the world's first freshwater national park, it features stunningly clear water and diverse cichlid fish. Visitors can enjoy swimming, snorkeling, and boat trips to islands like Domwe or Mumbo.",
            type: "Nature preserve",
            image: "https://lh3.googleusercontent.com/gps-cs-s/AG0ilSwx6SWe1FOG6X5Wk4fRe7083JjzVHHgXlVf9c7IBWFzTwBLUEI0KnZt8wiMY0APGvy76Il4wFhJ6lAHSykojNoQSr0GlkA-FTswuH0PMv-QHfL3DUVMm3GAYGeB8E8-3inb_yTGbA=s1360-w1360-h1020-rw",
            location: "Monkey Bay",
            distance: "~2.5 hrs",
            mapUrl: "https://www.google.com/maps/search/?api=1&query=-14.0333,34.8833",
            externalUrl: "https://visitmalawi.mw/destinations/lakeshore/lake-malawi-national-park/"
        },
        {
            title: "Dzalanyama Forest Reserve",
            description: "About 60 km southwest of Lilongwe, this vast miombo woodland is a haven for birdwatchers (over 300 species) and offers various hiking and mountain biking trails. Accommodation is available at the Dzalanyama Forest Lodge.",
            type: "Nature preserve",
            image: "https://malawitravel.org/images/2740b6ea1c9985b0dc5c6f8505b85edc_XL.jpg#joomlaImage://local-images/2740b6ea1c9985b0dc5c6f8505b85edc_XL.jpg",
            location: "Southwest of Lilongwe",
            distance: "~1.5 hrs",
            mapUrl: "https://www.google.com/maps/search/?api=1&query=-14.25,33.4167",
            externalUrl: "https://visitmalawi.mw/destinations/central-region/dzalanyama-forest-reserve/"
        },
        {
            title: "Zomba Massif",
            description: "Known for its serene forests, waterfalls, and panoramic views, the plateau offers a great spot for hiking, mountain biking, or simply enjoying the scenery from numerous viewpoints.",
            type: "Mountain peak",
            image: "https://www.malawitourism.com/wp-content/uploads/2018/12/IMG_1105-e1544902005659-1920x720.jpg",
            location: "Zomba",
            distance: "~4 hrs",
            mapUrl: "https://www.google.com/maps/search/?api=1&query=-15.394363,35.341534",
            externalUrl: "https://visitmalawi.mw/destinations/southern-region/zomba-plateau/"
        }
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Nature & Outdoors | Dzaleka Visit"
                description="Explore Dzaleka's community gardens and hill trails, or plan a trip to nearby natural wonders like Kuti Wildlife Reserve and Lake Malawi."
                keywords="Dzaleka nature, Dzaleka hiking, conservation Dzaleka, Kuti Wildlife Reserve, Lake Malawi National Park, Dzalanyama Forest, eco-tourism Malawi"
                canonical="https://visit.dzaleka.com/things-to-do/nature-outdoors"
                ogImage="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgrD6IJOwKvW4B6_DoAvUXdT626EBOZUmO-sUEoTLCT2eKTXEkoG1PoKOw6KCSQTv6kRFWEpsP8RABiT9eiloslAQvZaUhWGEXBoTrtm-LHss5d6mElH4soP0VGsOFOHx7FDHB-dOV2qL5zoPaW2lTZNvUgadMm3nAzZwg1RSXLRwSUJm_f8cuMPoY3Nq8/s16000-rw/499921791_707873301994236_4215838024027037896_n.jpg"
            />

            {/* Header (Reused/Inline) */}
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
                            <Link href="/things-to-do" className="text-sm font-medium text-primary transition-colors flex items-center gap-1">
                                Things To Do
                                <svg className="h-3 w-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </Link>
                            <div className="absolute left-0 top-full mt-1 w-48 rounded-md border bg-background shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                <div className="py-1">
                                    <Link href="/things-to-do" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">All Experiences</Link>
                                    <Link href="/things-to-do/arts-culture" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Arts & Culture</Link>
                                    <Link href="/things-to-do/shopping" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Shopping & Markets</Link>
                                    <Link href="/things-to-do/nature-outdoors" className="block px-4 py-2 text-sm bg-muted/50 text-primary font-medium">Nature & Outdoors</Link>
                                    <Link href="/things-to-do/dining-nightlife" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Dining & Nightlife</Link>
                                    <Link href="/things-to-do/sports-recreation" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Sports & Recreation</Link>
                                    <Link href="/things-to-do/host-community" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Host Community</Link>
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
                        <Link href="/things-to-do/nature-outdoors" className="block text-sm font-medium py-1 pl-4 text-primary" onClick={() => setMobileMenuOpen(false)}>↳ Nature & Outdoors</Link>
                        <Link href="/things-to-do/dining-nightlife" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Dining & Nightlife</Link>
                        <Link href="/plan-your-trip" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Plan Your Trip</Link>
                        <Link href="/plan-your-trip/visitor-essentials" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Visitor Essentials</Link>
                        <Link href="/plan-your-trip/public-holidays" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Public Holidays</Link>
                        <Link href="/accommodation" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Accommodation</Link>
                        {/* ... other links */}
                    </div>
                )}
            </header>

            <main className="flex-1">
                {/* Hero */}
                <div className="relative py-24 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: 'url(https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgrD6IJOwKvW4B6_DoAvUXdT626EBOZUmO-sUEoTLCT2eKTXEkoG1PoKOw6KCSQTv6kRFWEpsP8RABiT9eiloslAQvZaUhWGEXBoTrtm-LHss5d6mElH4soP0VGsOFOHx7FDHB-dOV2qL5zoPaW2lTZNvUgadMm3nAzZwg1RSXLRwSUJm_f8cuMPoY3Nq8/s16000-rw/499921791_707873301994236_4215838024027037896_n.jpg)' }} // Using Lake Malawi as hero for impact
                    />
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-white/30 bg-white/10 text-white rounded-full uppercase tracking-widest font-semibold flex items-center justify-center w-fit mx-auto backdrop-blur-sm">
                            <Trees className="mr-2 h-3.5 w-3.5" />
                            Eco-Tourism
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-white">
                            Nature & Outdoors
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
                            From community gardens within Dzaleka to world-class wildlife reserves nearby, discover the natural beauty of Malawi.
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-16 space-y-24">

                    {/* Within the Camp */}
                    <section>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Within Dzaleka Refugee Camp</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                                Outdoor activities here revolve around community resilience, sustainability, and connecting with the land.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {withinCamp.map((item, index) => (
                                <Card key={index} className="border-none shadow-md bg-muted/40 hover:bg-muted/60 transition-colors">
                                    <CardContent className="p-8 space-y-4 text-center">
                                        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                                            <item.icon className="h-7 w-7" />
                                        </div>
                                        <h3 className="text-xl font-bold">{item.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {item.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Nearby Attractions */}
                    <section>
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                            <div className="max-w-2xl">
                                <h2 className="text-3xl font-bold tracking-tight mb-4">Nearby Natural Attractions</h2>
                                <p className="text-muted-foreground text-lg">
                                    Dzaleka operates as a great base for exploring Malawi's "Warm Heart" natural wonders.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-8">
                            {nearbyAttractions.map((attraction, index) => (
                                <div key={index} className="flex flex-col md:flex-row bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="md:w-1/3 relative overflow-hidden">
                                        <img
                                            src={attraction.image}
                                            alt={attraction.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <Badge className="bg-background/90 text-foreground hover:bg-background/100 backdrop-blur-sm border-none">
                                                {attraction.type}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="md:w-2/3 p-6 md:p-8 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="text-2xl font-bold mb-1">{attraction.title}</h3>
                                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                                                    <MapPin className="h-4 w-4" />
                                                    <a href={attraction.mapUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline transition-colors flex items-center gap-1">
                                                        {attraction.location} <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                    • {attraction.distance} from Dzaleka
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-muted-foreground leading-relaxed mb-6 flex-grow">
                                            {attraction.description}
                                        </p>

                                        <div className="mt-auto">
                                            <Button asChild variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                <a href={attraction.externalUrl} target="_blank" rel="noopener noreferrer">
                                                    Visit Official Site <ExternalLink className="ml-2 h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="bg-primary text-primary-foreground rounded-3xl p-12 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                            <Sun className="h-12 w-12 mx-auto text-yellow-300" />
                            <h2 className="text-3xl font-bold">Ready to Explore?</h2>
                            <p className="text-lg text-primary-foreground/90">
                                Whether you're looking for a quiet hike in the hills or a weekend safari, our local guides can help facilitate your travel plans and connect you with trusted transport.
                            </p>
                            <Button asChild size="lg" variant="secondary" className="px-8 font-semibold">
                                <Link href="/contact">Contact for Travel Advice</Link>
                            </Button>
                        </div>
                    </section>

                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
