import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Calendar, MapPin, Menu, X, ExternalLink, Clock, Tag,
    Bus, Camera, Coffee, Home, Info, Phone, Shield, Music, Briefcase
} from "lucide-react";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";

export default function PlanYourTrip() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Plan Your Trip | Visit Dzaleka Refugee Camp"
                description="Your ultimate guide to planning a visit to Dzaleka. Find information on transport, accommodation, timing, and essential tips for a respectful trip."
                keywords="plan trip Dzaleka, Dzaleka travel guide, visit Dzaleka logistics, accommodation Dzaleka, Dzaleka transport"
                canonical="https://visit.dzaleka.com/plan-your-trip"
                ogImage="https://tumainiletu.org/wp-content/uploads/2024/10/Badre_Bahaji_Tumaini_festival21_-31-1.jpg"
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
                        <Link href="/things-to-do" className="text-sm font-medium hover:text-primary transition-colors">Things To Do</Link>
                        <Link href="/whats-on" className="text-sm font-medium hover:text-primary transition-colors">What's On</Link>
                        <Link href="/plan-your-trip" className="text-sm font-medium text-primary transition-colors">Plan Your Trip</Link>
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
                        <Link href="/whats-on" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>What's On</Link>
                        <Link href="/plan-your-trip" className="block text-sm font-medium py-1 text-primary" onClick={() => setMobileMenuOpen(false)}>Plan Your Trip</Link>
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
                            <MapPin className="mr-2 h-3.5 w-3.5" />
                            Trip Planner
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                            Plan Your Trip
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            Ready to explore but not sure where to start? Consider this your ultimate trip planner for Dzaleka Refugee Camp.
                        </p>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl -z-10" />
                </div>

                <div className="container mx-auto px-4 py-12 space-y-20 max-w-5xl">

                    {/* Intro Text */}
                    <div className="prose prose-lg dark:prose-invert mx-auto text-center max-w-3xl">
                        <p className="lead">
                            This experience is about more than sightseeing; it is an opportunity to connect with a resilient community of over 50,000 people from across Central and Eastern Africa.
                        </p>
                    </div>

                    {/* 1. Pick Your Timing */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xl">1</div>
                            <h2 className="text-3xl font-bold tracking-tight">Pick Your Timing</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                        <Music className="h-5 w-5 text-primary" />
                                        The Festival Experience
                                    </h3>
                                    <p className="text-muted-foreground">
                                        To see the camp at its most vibrant, plan your visit for the annual <span className="font-semibold text-foreground">Tumaini Festival</span>. Usually held in late October or November, this free, three-day event transforms the camp with music, dance, and poetry from around the globe.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-primary" />
                                        Year-Round Visits
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Outside of festival dates, the camp offers a more personal atmosphere for cultural exchange. Weekdays are ideal for visiting innovation hubs and vocational training centers while they are in session.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* 2. Arrange Your Logistics */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xl">2</div>
                            <h2 className="text-3xl font-bold tracking-tight">Arrange Your Logistics</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="flex gap-4 items-start">
                                <Bus className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-xl font-bold">Transport</h3>
                                    <p className="text-muted-foreground">
                                        Dzaleka is located about 45km (a one-hour drive) from Lilongwe. You can take a local minibus from the Lilongwe bus terminal or hire a private taxi for the day.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <Tag className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-xl font-bold">Booking a Guide</h3>
                                    <p className="text-muted-foreground">
                                        It is essential to book a local guide through our online portal. This ensures your visit is respectful, and your tour fees directly support camp residents.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <Info className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-xl font-bold">Entry Requirements</h3>
                                    <p className="text-muted-foreground">
                                        While the camp is open to visitors, it is always wise to check for any updated entry guidelines via your local guide or the <a href="https://services.dzaleka.com/visit/guidelines/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center">Dzaleka Visitor Guidelines <ExternalLink className="h-3 w-3 ml-1" /></a>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. Curate Your Itinerary */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xl">3</div>
                            <h2 className="text-3xl font-bold tracking-tight">Curate Your Itinerary</h2>
                        </div>
                        <div className="relative border-l-2 border-muted ml-5 space-y-10 pl-8 py-2">
                            <div className="relative">
                                <div className="absolute -left-[41px] top-0 h-6 w-6 rounded-full border-4 border-background bg-primary" />
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                                    <Briefcase className="h-4 w-4" /> Morning: Tech & Innovation
                                </h3>
                                <p className="text-muted-foreground">
                                    Start at the ADAI Circle or TakenoLAB. Meet young entrepreneurs learning software development and AI—a firsthand look at the camp’s drive toward self-reliance.
                                </p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[41px] top-0 h-6 w-6 rounded-full border-4 border-background bg-primary" />
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                                    <Coffee className="h-4 w-4" /> Lunch: Authentic Flavors
                                </h3>
                                <p className="text-muted-foreground">
                                    Head to the local markets to try regional specialties. Look for King’s Chapati or sample Mthumbwana (a traditional goat dish) from one of the many refugee-owned stalls.
                                </p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[41px] top-0 h-6 w-6 rounded-full border-4 border-background bg-primary" />
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                                    <Camera className="h-4 w-4" /> Afternoon: Arts & Community
                                </h3>
                                <p className="text-muted-foreground">
                                    Visit the Dzaleka Art Project to see murals and studios. You may have the chance to watch a rehearsal for a dance troupe or visit a tailoring project at There Is Hope.
                                </p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[41px] top-0 h-6 w-6 rounded-full border-4 border-background bg-primary" />
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                                    <Home className="h-4 w-4" /> Stay Over
                                </h3>
                                <p className="text-muted-foreground">
                                    For a deeper connection, book an overnight stay through the <a href="https://tumainiletu.org/the-dzaleka-homestay-program/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center">Dzaleka Homestay Program <ExternalLink className="h-3 w-3 ml-1" /></a>. Sharing a meal and a home with a local family provides a perspective you cannot get in a single day.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 4. Essentials for Your Visit */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xl">4</div>
                            <h2 className="text-3xl font-bold tracking-tight">Essentials for Your Visit</h2>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="bg-muted/50 border-none">
                                <CardContent className="pt-6">
                                    <div className="mb-4 w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm">
                                        <span className="text-xl">💰</span>
                                    </div>
                                    <h3 className="font-bold mb-2">Cash</h3>
                                    <p className="text-sm text-muted-foreground">
                                        There are no ATMs in the camp. Bring Malawian Kwacha in small denominations for food, handmade crafts, and tips.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/50 border-none">
                                <CardContent className="pt-6">
                                    <div className="mb-4 w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm">
                                        <Camera className="h-5 w-5 text-foreground" />
                                    </div>
                                    <h3 className="font-bold mb-2">Respectful Photography</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Always ask for permission before taking photos of individuals or their homes.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/50 border-none">
                                <CardContent className="pt-6">
                                    <div className="mb-4 w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm">
                                        <span className="text-xl">👕</span>
                                    </div>
                                    <h3 className="font-bold mb-2">Dress Code</h3>
                                    <p className="text-sm text-muted-foreground">
                                        To be respectful of the diverse cultures (DRC, Burundi, Rwanda), it is best to wear modest clothing that covers shoulders and knees.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/50 border-none">
                                <CardContent className="pt-6">
                                    <div className="mb-4 w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm">
                                        <span className="text-xl">🔋</span>
                                    </div>
                                    <h3 className="font-bold mb-2">Preparedness</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Bring your own drinking water and a power bank for your phone, as electricity can be limited.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* 5. Contact & Booking Links */}
                    <section className="bg-primary/5 rounded-2xl p-8 md:p-12 text-center">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-xl">5</div>
                            <h2 className="text-3xl font-bold tracking-tight">Contact & Booking Links</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            <Button asChild size="lg" className="h-auto py-4 flex flex-col gap-1">
                                <Link href="/login">
                                    <span className="font-bold text-lg">Official Tours</span>
                                    <span className="text-xs opacity-90 font-normal">Visit Dzaleka Portal</span>
                                </Link>
                            </Button>
                            <Button asChild variant="secondary" size="lg" className="h-auto py-4 flex flex-col gap-1">
                                <a href="https://tumainiletu.org/the-dzaleka-homestay-program/" target="_blank" rel="noopener noreferrer">
                                    <span className="font-bold text-lg">Homestays</span>
                                    <span className="text-xs opacity-75 font-normal">Dzaleka Homestay Program</span>
                                </a>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="h-auto py-4 flex flex-col gap-1">
                                <a href="https://tumainiletu.org/" target="_blank" rel="noopener noreferrer">
                                    <span className="font-bold text-lg">Festival Updates</span>
                                    <span className="text-xs opacity-75 font-normal">Tumaini Letu Official Site</span>
                                </a>
                            </Button>
                        </div>
                    </section>

                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
