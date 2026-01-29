import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowRight, Menu, X, Bed, Users, DollarSign, Mail, Shield, MapPin, ExternalLink, Hotel, Star, Wifi, Car } from "lucide-react";
import { useState } from "react";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";

// Structured Data for Lodging
const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "LodgingBusiness",
            "name": "Dzaleka Homestay Program",
            "description": "A community-based tourism initiative offering stays with refugee families in Dzaleka.",
            "priceRange": "$20",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Dowa District",
                "addressCountry": "MW"
            },
            "url": "https://tumainiletu.org/the-dzaleka-homestay-program/"
        },
        {
            "@type": "Product",
            "name": "Homestay Night (Tumaini Festival)",
            "description": "One night accommodation with a host family including one meal.",
            "offers": {
                "@type": "Offer",
                "price": "20.00",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
            }
        },
        {
            "@type": "Hotel",
            "name": "Kalipano Hotel by Sunbird",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Dowa",
                "addressCountry": "MW"
            },
            "starRating": "4"
        }
    ]
};

export default function Accommodation() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const externalHotels = [
        {
            category: "Mponela (Nearest Towns)",
            hotels: [
                {
                    name: "Kalipano Hotel by Sunbird",
                    location: "Dowa (approx. 20km from Dzaleka)",
                    description: "Malawi's first purpose-built country resort. A premium option with lake, gardens, and high-end amenities.",
                    link: "https://www.sunbirdmalawi.com/hotels/kalipano-hotel",
                    amenities: ["Resort", "Lake Activities", "Premium Dining"]
                },
                {
                    name: "Linde Motel",
                    location: "Mponela, Dowa",
                    description: "Reliable standard hotel facilities including air conditioning, Wi-Fi, and a swimming pool.",
                    link: "https://www.google.com/maps/place/Linde+Motel",
                    amenities: ["Air Conditioning", "Wi-Fi", "Swimming Pool"]
                },
                {
                    name: "Chikho Hotel",
                    location: "Mponela, Dowa",
                    description: "Conference hotel with various room types, Wi-Fi, and a swimming pool.",
                    link: "https://www.google.com/maps/place/Chikho+Hotel",
                    amenities: ["Wi-Fi", "Swimming Pool", "Conference Hall"]
                }
            ]
        },
        {
            category: "Lilongwe (Capital City)",
            hotels: [
                {
                    name: "Latitude 13°",
                    location: "Lilongwe",
                    description: "Upscale boutique hotel in the capital city, perfect for day trips to Dzaleka.",
                    link: "https://www.google.com/maps/place/Latitude+13",
                    amenities: ["Boutique Hotel", "Restaurant", "Premium Service"]
                },
                {
                    name: "Crossroads Hotel",
                    location: "Lilongwe",
                    description: "Convenient location in Lilongwe for arranging day trips to Dzaleka.",
                    link: "https://www.google.com/maps/place/Crossroads+Hotel+Lilongwe",
                    amenities: ["Central Location", "Luxurious", "Spa"]
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Accommodation | Where to Stay Near Dzaleka"
                description="Find accommodation options for your visit to Dzaleka Refugee Camp. Stay with a local family through the Homestay Program ($20/night) or choose premium hotels like Kalipano."
                keywords="Dzaleka accommodation, homestay Malawi, Tumaini Letu, Mponela hotels, Kalipano Hotel, refugee camp visit"
                canonical="https://visit.dzaleka.com/accommodation"
                ogImage="https://tumainiletu.org/wp-content/uploads/2024/10/Dzaleka_107-min.jpg"
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
                        <Link href="/blog" className="text-sm font-medium hover:text-primary transition-colors">Blog</Link>
                        <Link href="/things-to-do" className="text-sm font-medium hover:text-primary transition-colors">Things To Do</Link>
                        <Link href="/accommodation" className="text-sm font-medium text-primary transition-colors">Accommodation</Link>
                        <Link href="/whats-on" className="text-sm font-medium hover:text-primary transition-colors">What's On</Link>
                        <Link href="/plan-your-trip" className="text-sm font-medium hover:text-primary transition-colors">Plan Your Trip</Link>
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
                        <Link href="/things-to-do" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Things To Do</Link>
                        <Link href="/accommodation" className="block text-sm font-medium py-1 text-primary" onClick={() => setMobileMenuOpen(false)}>Accommodation</Link>
                        <Link href="/whats-on" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>What's On</Link>
                        <Link href="/plan-your-trip" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Plan Your Trip</Link>
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
                <div className="relative py-20 overflow-hidden bg-muted/20">
                    <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full uppercase tracking-widest font-semibold flex items-center justify-center w-fit mx-auto">
                            <Bed className="mr-2 h-3.5 w-3.5" />
                            Where to Stay
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                            Accommodation Options
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            The primary accommodation option available within Dzaleka Refugee Camp is the community-based Homestay Program, which offers an immersive cultural exchange experience.
                        </p>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl -z-10" />
                </div>

                <div className="container mx-auto px-4 py-16 space-y-24">
                    {/* Section 1: Homestay Program */}
                    <section className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-2 md:order-1 relative">
                            <div className="aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-muted">
                                <img
                                    src="https://tumainiletu.org/wp-content/uploads/2024/10/Dzaleka_107-min.jpg"
                                    alt="Dzaleka Homestay Program"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-6 -right-6 -z-10 w-full h-full border-2 border-primary/10 rounded-2xl" />
                        </div>
                        <div className="order-1 md:order-2 space-y-6">
                            <div className="flex items-center gap-3 text-primary font-semibold">
                                <Home className="h-5 w-5" />
                                <span>Immersive Experience</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight">Dzaleka Homestay Program</h2>
                            <p className="text-muted-foreground text-lg">
                                This program is run by the non-profit organization <strong>Tumaini Letu</strong>, the organizers of the annual Tumaini Festival. It provides visitors with a unique opportunity to stay with vetted refugee families, directly supporting their livelihoods and fostering meaningful connections.
                            </p>
                            <div className="space-y-4 pt-2">
                                <div className="flex gap-4 items-start p-4 rounded-lg bg-muted/50">
                                    <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold block text-foreground">The Experience</span>
                                        <span className="text-muted-foreground">You will stay in a family home, share one daily meal with your hosts, and take part in everyday activities. Facilities are basic, typically including squat toilets and bucket showers, and not all homes have consistent electricity or refrigerators.</span>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start p-4 rounded-lg bg-muted/50">
                                    <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold block text-foreground">Safety</span>
                                        <span className="text-muted-foreground">Host families are carefully vetted and trained to ensure guest safety and hospitality.</span>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start p-4 rounded-lg bg-muted/50">
                                    <DollarSign className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold block text-foreground">Cost</span>
                                        <span className="text-muted-foreground">The program costs <strong>$20 USD per person per night</strong>. Of this, $15 goes directly to the host family, and $5 supports the program's management and training.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Booking CTA */}
                    <section className="max-w-4xl mx-auto">
                        <Card className="bg-primary text-primary-foreground overflow-hidden">
                            <div className="md:flex">
                                <div className="md:w-1/3 bg-black/20 relative min-h-[200px]">
                                    <img
                                        src="https://tumainiletu.org/wp-content/uploads/2021/07/Website-Entrepreneurship-and-innovation-2048x1536.jpg"
                                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
                                        alt="Cultural Exchange"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Mail className="h-12 w-12 text-white/90" />
                                    </div>
                                </div>
                                <div className="md:w-2/3 p-8">
                                    <h3 className="text-2xl font-bold mb-2">Book Your Homestay</h3>
                                    <p className="text-primary-foreground/90 mb-6 text-lg">
                                        You can apply and find more information on the Tumaini Letu website. For specific dates or longer stays, you can also email the program coordinator.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <Button asChild variant="secondary" size="lg">
                                            <a href="https://tumainiletu.org/the-dzaleka-homestay-program/" target="_blank" rel="noopener noreferrer">
                                                Visit Website <ExternalLink className="ml-2 h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                                            <a href="mailto:dzalekahomestay@gmail.com">
                                                <Mail className="mr-2 h-4 w-4" /> Email Coordinator
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </section>

                    {/* Section 2: External Accommodation */}
                    <section>
                        <div className="text-center max-w-3xl mx-auto mb-12">
                            <div className="flex items-center justify-center gap-3 text-primary font-semibold mb-4">
                                <Hotel className="h-5 w-5" />
                                <span>Nearby Options</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Accommodation Outside the Camp</h2>
                            <p className="text-muted-foreground text-lg">
                                If you prefer more conventional amenities, there are hotels and lodges in nearby towns like Mponela or in Lilongwe (about an hour away).
                            </p>
                        </div>

                        <div className="space-y-12 max-w-5xl mx-auto">
                            {externalHotels.map((group, groupIndex) => (
                                <div key={groupIndex}>
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        {group.category}
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {group.hotels.map((hotel, index) => (
                                            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                                                <CardContent className="p-6">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h3 className="text-xl font-bold">{hotel.name}</h3>
                                                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                                <MapPin className="h-3.5 w-3.5" /> {hotel.location}
                                                            </p>
                                                        </div>
                                                        <div className="bg-primary/10 p-2 rounded-lg">
                                                            <Hotel className="h-5 w-5 text-primary" />
                                                        </div>
                                                    </div>
                                                    <p className="text-muted-foreground mb-4 text-sm">{hotel.description}</p>
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {hotel.amenities.map((amenity, i) => (
                                                            <Badge key={i} variant="secondary" className="text-xs">
                                                                {amenity}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                    <Button asChild variant="outline" size="sm" className="w-full">
                                                        <a href={hotel.link} target="_blank" rel="noopener noreferrer">
                                                            View Website / Map <ExternalLink className="ml-2 h-3.5 w-3.5" />
                                                        </a>
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Travel Tips */}
                    <section className="bg-muted/30 rounded-3xl p-8 md:p-12 max-w-4xl mx-auto">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-bold mb-2">Travel Tips</h3>
                            <p className="text-muted-foreground">Things to consider when planning your stay</p>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-6">
                            <div className="text-center p-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Car className="h-6 w-6 text-primary" />
                                </div>
                                <h4 className="font-semibold mb-2">Distance</h4>
                                <p className="text-sm text-muted-foreground">Lilongwe is about 1 hour from Dzaleka. Mponela is the closest town to the camp.</p>
                            </div>
                            <div className="text-center p-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Star className="h-6 w-6 text-primary" />
                                </div>
                                <h4 className="font-semibold mb-2">Our Recommendation</h4>
                                <p className="text-sm text-muted-foreground">The Homestay Program offers the most authentic and meaningful experience.</p>
                            </div>
                            <div className="text-center p-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Wifi className="h-6 w-6 text-primary" />
                                </div>
                                <h4 className="font-semibold mb-2">Connectivity</h4>
                                <p className="text-sm text-muted-foreground">Hotels offer reliable Wi-Fi. Homestay facilities are more basic but authentic.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
