import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Menu, X, MapPin, Users, Heart, Globe, Target, Sparkles,
    ArrowRight, Mail, ExternalLink, Handshake
} from "lucide-react";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";

export default function AboutUs() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="About Us | Visit Dzaleka"
                description="Learn about Visit Dzaleka – a refugee-led tourism initiative connecting visitors with authentic cultural experiences in Malawi's Dzaleka Refugee Camp."
                keywords="Visit Dzaleka, about us, refugee tourism, community tourism, Dzaleka guides, Malawi"
                canonical="https://visit.dzaleka.com/about-us"
            />

            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/">
                        <div className="flex items-center gap-3 cursor-pointer">
                            <img src="https://services.dzaleka.com/images/dzaleka-digital-heritage.png" alt="Visit Dzaleka Logo" className="h-10 w-10 rounded-lg shadow-sm" />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold tracking-tight">Visit Dzaleka</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Official Portal</span>
                            </div>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-4">
                        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
                        <Link href="/about-dzaleka" className="text-sm font-medium hover:text-primary transition-colors">About Dzaleka</Link>
                        <Link href="/about-us" className="text-sm font-medium text-primary transition-colors">About Us</Link>
                        <Link href="/things-to-do" className="text-sm font-medium hover:text-primary transition-colors">Things To Do</Link>
                        <Link href="/plan-your-trip" className="text-sm font-medium hover:text-primary transition-colors">Plan Your Trip</Link>
                        <div className="flex items-center gap-2 ml-2">
                            <Button asChild size="sm">
                                <Link href="/login">Book Now</Link>
                            </Button>
                        </div>
                    </nav>

                    <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden border-t bg-background p-4 space-y-3">
                        <Link href="/" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                        <Link href="/about-dzaleka" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>About Dzaleka</Link>
                        <Link href="/about-us" className="block text-sm font-medium py-1 text-primary" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
                        <Link href="/things-to-do" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Things To Do</Link>
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
                <div className="relative py-16 sm:py-24 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
                    <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full uppercase tracking-widest font-semibold flex items-center justify-center w-fit mx-auto">
                            <Sparkles className="mr-2 h-3.5 w-3.5" />
                            Refugee-Led Tourism
                        </Badge>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                            About Visit Dzaleka
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                            We connect visitors with authentic cultural experiences, led by refugees who call Dzaleka home. Every tour supports livelihoods and shares the extraordinary stories of resilience within our community.
                        </p>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl -z-10" />
                </div>

                <div className="container mx-auto px-4 py-8 sm:py-12 space-y-12 sm:space-y-16 max-w-5xl">

                    {/* Our Mission */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Target className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Our Mission</h2>
                        </div>
                        <div className="prose prose-sm sm:prose max-w-none text-muted-foreground">
                            <p className="text-sm sm:text-base leading-relaxed">
                                Visit Dzaleka exists to <strong className="text-foreground">change how the world sees refugees</strong>—from recipients of aid to hosts, entrepreneurs, and cultural ambassadors. Through tourism, we create sustainable income for guides while offering visitors transformative experiences they won't find anywhere else.
                            </p>
                        </div>
                    </section>

                    {/* What We Do */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Globe className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">What We Do</h2>
                        </div>
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        Guided Tours
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Walking tours through Dzaleka led by local refugee guides. Experience markets, artisan workshops, innovation hubs, and community spaces.
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Users className="h-5 w-5 text-primary" />
                                        Cultural Experiences
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Food experiences, art workshops, music performances, and storytelling sessions that showcase the rich cultures of the Great Lakes region.
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Handshake className="h-5 w-5 text-primary" />
                                        Partner Visits
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Coordinated visits for NGOs, delegations, researchers, and media seeking to understand refugee entrepreneurship and community resilience.
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Our Story */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Heart className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Our Story</h2>
                        </div>
                        <div className="prose prose-sm sm:prose max-w-none text-muted-foreground space-y-4">
                            <p className="text-sm sm:text-base leading-relaxed">
                                Visit Dzaleka grew out of <strong className="text-foreground">Dzaleka Online Services</strong>, a community initiative that has been connecting refugees with digital opportunities since 2020. As interest from visitors grew, we saw an opportunity to formalize tours in a way that benefits guides directly.
                            </p>
                            <p className="text-sm sm:text-base leading-relaxed">
                                Today, we work with a network of trained local guides who share their personal stories, their cultures, and their vision for the future. We're also listed on <strong className="text-foreground">GetYourGuide</strong>, bringing international visitors to Dzaleka from around the world.
                            </p>
                        </div>
                    </section>

                    {/* Our Impact */}
                    <section className="bg-primary/5 rounded-2xl p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Our Impact</h2>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-3 text-center">
                            <div>
                                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">100%</div>
                                <p className="text-sm text-muted-foreground">Tour income goes directly to guides</p>
                            </div>
                            <div>
                                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">10+</div>
                                <p className="text-sm text-muted-foreground">Active local guides</p>
                            </div>
                            <div>
                                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">4.9★</div>
                                <p className="text-sm text-muted-foreground">Average visitor rating</p>
                            </div>
                        </div>
                    </section>

                    {/* Our Partners */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Handshake className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Our Partners</h2>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <a href="https://www.getyourguide.com/mbalame-l265219/dzaleka-refugee-camp-guided-walking-tour-t1188868/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <ExternalLink className="h-6 w-6 text-primary shrink-0" />
                                <div>
                                    <p className="font-semibold">GetYourGuide</p>
                                    <p className="text-sm text-muted-foreground">International booking platform</p>
                                </div>
                            </a>
                            <a href="https://services.dzaleka.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <ExternalLink className="h-6 w-6 text-primary shrink-0" />
                                <div>
                                    <p className="font-semibold">Dzaleka Online Services</p>
                                    <p className="text-sm text-muted-foreground">Our parent organization</p>
                                </div>
                            </a>
                        </div>
                    </section>

                    {/* Contact */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Mail className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Get in Touch</h2>
                        </div>
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-muted-foreground mb-4">
                                    Have questions about visiting Dzaleka? Want to partner with us? We'd love to hear from you.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button asChild>
                                        <a href="mailto:info@dzaleka.com">
                                            <Mail className="mr-2 h-4 w-4" />
                                            Email Us
                                        </a>
                                    </Button>
                                    <Button asChild variant="outline">
                                        <Link href="/partner-with-us">
                                            Become a Partner
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* CTA Section */}
                    <section className="bg-primary/5 rounded-2xl p-6 sm:p-8 md:p-12 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">Ready to Experience Dzaleka?</h2>
                        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto text-sm sm:text-base">
                            Book a tour and support refugee-led tourism. Every visit makes a difference.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild size="lg">
                                <Link href="/login">Book a Tour</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg">
                                <Link href="/about-dzaleka">Learn About Dzaleka</Link>
                            </Button>
                        </div>
                    </section>

                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
