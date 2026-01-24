import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Calendar, MapPin, Menu, X, ExternalLink, Clock, Tag,
    Bus, Camera, Coffee, Home, Info, Phone, Shield, Music, Briefcase, Thermometer, AlertTriangle, CreditCard, Zap
} from "lucide-react";

import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";

// Structured Data for SEO: TravelGuide & FAQPage
const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "TravelGuide",
            "name": "Visit Dzaleka Refugee Camp",
            "about": {
                "@type": "CivicStructure",
                "name": "Dzaleka Refugee Camp",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Dowa",
                    "addressCountry": "MW"
                }
            },
            "author": {
                "@type": "Organization",
                "name": "Visit Dzaleka"
            },
            "inLanguage": "en"
        },
        {
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "Do I need a visa to visit Malawi?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes, as of January 2026, Malawi has implemented a reciprocity visa policy. Citizens of the US, UK, Canada, and EU countries now require an e-Visa to enter, replacing the previous 2024 visa waiver."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Is it safe to visit Dzaleka Refugee Camp?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Visiting Dzaleka is safe when done through an official guided tour. Petty crime exists, so avoid carrying large amounts of cash and always stay with your local guide."
                    }
                },
                {
                    "@type": "Question",
                    "name": "What is the best time to visit Dzaleka?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "The dry season from May to August is the best time to visit, offering cooler temperatures and dry roads. The rainy season (November-April) can make travel difficult."
                    }
                }
            ]
        }
    ]
};

export default function PlanYourTrip() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Plan Your Trip | Dzaleka Travel Guide"
                description="Essential guide for visiting Dzaleka Refugee Camp: 2026 Visa updates, safety advice, best time to visit, and cultural etiquette."
                keywords="Dzaleka visa 2026, Malawi e-visa, Dzaleka safety, best time to visit Malawi, Dzaleka transport, refugee camp tourism"
                canonical="https://visit.dzaleka.com/plan-your-trip"
                ogImage="https://tumainiletu.org/wp-content/uploads/2024/10/Badre_Bahaji_Tumaini_festival21_-31-1.jpg"
            />

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
                                    <Link href="/plan-your-trip" className="block px-4 py-2 text-sm hover:bg-muted transition-colors font-medium">Trip Planner</Link>
                                    <Link href="/plan-your-trip/visitor-essentials" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Visitor Essentials</Link>
                                    <Link href="/plan-your-trip/safe-travel" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Safe Travel</Link>
                                    <Link href="/plan-your-trip/public-holidays" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Public Holidays</Link>
                                    <Link href="/plan-your-trip/dzaleka-map" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Dzaleka Map</Link>
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
                <div className="relative py-20 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
                    <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full uppercase tracking-widest font-semibold flex items-center justify-center w-fit mx-auto">
                            <MapPin className="mr-2 h-3.5 w-3.5" />
                            Official Travel Guide
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                            Plan Your Trip
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            Essential information for visiting Dzaleka Refugee Camp and Malawi. Navigating visas, safety, and logistics for a meaningful experience.
                        </p>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl -z-10" />
                </div>

                <div className="container mx-auto px-4 py-12 space-y-16 max-w-5xl">

                    {/* Intro Text */}
                    <div className="prose prose-lg dark:prose-invert mx-auto text-center max-w-3xl">
                        <p className="lead border-b pb-8">
                            Visiting Dzaleka is more than tourism; it's a chance to witness resilience in action. This guide ensures your trip is safe, respectful, and well-planned, so you can focus on connecting with the community.
                        </p>
                    </div>

                    {/* 1. Pre-Trip Essentials (Visas & Health) */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xl">1</div>
                            <h2 className="text-3xl font-bold tracking-tight">Pre-Trip Essentials</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <Card className="border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-amber-800 dark:text-amber-500">
                                        <AlertTriangle className="h-5 w-5" />
                                        Visa Policy Update (Jan 2026)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-foreground/80 mb-4">
                                        <strong className="block text-foreground mb-1">Reciprocity Rules are in Effect</strong>
                                        The 2024 visa waiver program has ended. As of January 2026, citizens of countries that require visas for Malawians (including <strong>US, UK, Canada, and EU nations</strong>) must obtain a visa to enter Malawi.
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                        <li><strong>E-Visa:</strong> Apply online at <a href="https://www.evisa.gov.mw" target="_blank" rel="noopener noreferrer" className="text-primary underline">evisa.gov.mw</a> at least 7 days prior.</li>
                                        <li><strong>Cost:</strong> Approx. $50 (Single Entry).</li>
                                        <li><strong>Exemptions:</strong> Only limited regional partners remain visa-free. Check your status before flying.</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-primary" />
                                        Health & Vaccines
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Malawi is a malaria-endemic zone. Consult your travel clinic 6-8 weeks before departure.
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                        <li><strong>Yellow Fever:</strong> Required if traveling from a risk country.</li>
                                        <li><strong>Malaria:</strong> Prophylaxis (e.g., Doxycycline, Malarone) is highly recommended.</li>
                                        <li><strong>Water:</strong> Drink only bottled or filtered water. Avoid ice in rural areas.</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* 2. Pick Your Timing */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xl">2</div>
                            <h2 className="text-3xl font-bold tracking-tight">Pick Your Timing</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="bg-primary/5 border-primary/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Thermometer className="h-5 w-5 text-primary" />
                                        Best Time (May-Aug)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Cool & Dry.</strong> Ideal for walking tours. Daytime temps around 24°C (75°F), getting chilly at night.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Thermometer className="h-5 w-5 text-amber-500" />
                                        Hot Season (Sep-Oct)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Hot & Dry.</strong> Temps soar to 30°C+ (86°F+). Good for Lake Malawi visits post-camp, but bring sunscreen.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <UmbrellaIcon className="h-5 w-5 text-blue-500" />
                                        Wet Season (Nov-Apr)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Heavy Rains.</strong> Dzaleka's earth roads can get muddy. Travel can be lush but unpredictable.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* 3. Safety & Etiquette */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xl">3</div>
                            <h2 className="text-3xl font-bold tracking-tight">Safety & Etiquette</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="flex gap-4 items-start">
                                <Shield className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-xl font-bold">Safety First</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Like many urban areas, petty crime exists. <strong>Do not display expensive electronics</strong> or large amounts of cash. When in Dzaleka, always stay with your guide—they know the community and ensure your safety. Stick to official paths and avoid the camp periphery after dark.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <Camera className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-xl font-bold">Photography Rule</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        <strong>Ask before you snap.</strong> Many residents have fled persecution and fear having their location shared online. Only take photos of people who have given explicit verbal consent, and avoid photographing government buildings or the camp entrance police post.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <Tag className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-xl font-bold">Booking a Guide</h3>
                                    <p className="text-muted-foreground mb-3">
                                        It is essential to book a local guide through our online portal. This ensures your visit is respectful, and your tour fees directly support camp residents.
                                    </p>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href="/login">Secure a Guide</Link>
                                    </Button>
                                    <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                        <Link href="/login">Book Your Guide Now</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 4. Logistics (Money & Transport) */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xl">4</div>
                            <h2 className="text-3xl font-bold tracking-tight">Logistics: Money & Transport</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="bg-muted/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-primary" />
                                        Cash is King
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <p className="mb-3">
                                        <strong>ATM Access:</strong> <strong className="text-foreground">Centenary Bank</strong> has an ATM inside the camp. However, it is wise to bring backup cash from Lilongwe in case of network outages.
                                    </p>
                                    <p>
                                        Major foreign currencies (USD, GBP, EUR) are accepted at some guesthouses, but USD notes must be <strong className="text-foreground">post-2013 with big heads</strong> (older notes are rejected).
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <Bus className="h-5 w-5 text-primary" />
                                        Getting Here
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <p className="mb-3">
                                        Dzaleka is 45km (~1 hour) from Lilongwe.
                                    </p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li><strong>Private Taxi:</strong> Recommended. approx. $40-$60 round trip.</li>
                                        <li><strong>Minibus:</strong> Cheap (~$2) but crowded and slow. Departs from Lilongwe Bus Terminal.</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* 5. Packing Smart */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xl">5</div>
                            <h2 className="text-3xl font-bold tracking-tight">Packing Smart</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-primary" />
                                        Clothing & Essentials
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                        <li><strong>Modest Clothing:</strong> Essential for Dzaleka. Skirts/shorts should cover knees. Avoid revealing tops.</li>
                                        <li><strong>Layers:</strong> Evenings can be surprisingly cool (especially May-Aug). Bring a jumper or fleece.</li>
                                        <li><strong>Sturdy Shoes:</strong> Roads are unpaved and uneven. Closed walking shoes are best.</li>
                                        <li><strong>Rain Gear:</strong> A light poncho is a lifesaver if visiting Nov-Apr.</li>
                                    </ul>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-primary" />
                                        Tech & Health
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                        <li><strong>Power Bank:</strong> electricity can be intermittent.</li>
                                        <li><strong>Adapter:</strong> Malawi uses <strong>Type G</strong> (British style 3-pin square).</li>
                                        <li><strong>Headlamp:</strong> Useful for navigating unlit paths after sunset.</li>
                                        <li><strong>First Aid:</strong> Basics plus insect repellent (DEET) and anti-malaria meds.</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* 6. Contact & Booking Links */}
                    <section className="bg-primary/5 rounded-2xl p-8 md:p-12 text-center mt-12">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-xl">6</div>
                            <h2 className="text-3xl font-bold tracking-tight">Ready to Visit?</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            <Button asChild size="lg" className="h-auto py-4 flex flex-col gap-1">
                                <Link href="/login">
                                    <span className="font-bold text-lg">Book Official Tour</span>
                                    <span className="text-xs opacity-90 font-normal">Secure your guide</span>
                                </Link>
                            </Button>
                            <Button asChild variant="secondary" size="lg" className="h-auto py-4 flex flex-col gap-1">
                                <a href="https://tumainiletu.org/the-dzaleka-homestay-program/" target="_blank" rel="noopener noreferrer">
                                    <span className="font-bold text-lg">Book Homestay</span>
                                    <span className="text-xs opacity-75 font-normal">Stay overnight</span>
                                </a>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="h-auto py-4 flex flex-col gap-1">
                                <a href="https://tumainiletu.org/" target="_blank" rel="noopener noreferrer">
                                    <span className="font-bold text-lg">Festival Updates</span>
                                    <span className="text-xs opacity-75 font-normal">Tumaini Official Site</span>
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

function UmbrellaIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12a10.06 10.06 0 0 0-20 0Z" />
            <path d="M12 12v8a2 2 0 0 0 2 2h0.5" />
            <path d="M12 12v8" />
        </svg>
    )
}
