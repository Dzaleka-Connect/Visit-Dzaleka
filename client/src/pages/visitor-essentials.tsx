import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Menu, X, ExternalLink, Shield, FileCheck, Camera, Wallet,
    Bus, Bike, Footprints, AlertTriangle, Music, Calendar, MapPin, Clock, Users, Home
} from "lucide-react";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";

// Structured Data for Google Search (TouristAttraction + FAQPage + HowTo + Event schema)
const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "TouristAttraction",
            "name": "Dzaleka Refugee Camp",
            "description": "Home to over 50,000 people from DRC, Rwanda, and Burundi. A unique opportunity for ethical cultural tourism and community engagement.",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Dowa District",
                "addressCountry": "MW"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": -13.7833,
                "longitude": 33.9833
            },
            "isAccessibleForFree": false,
            "publicAccess": true,
            "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                "opens": "08:00",
                "closes": "17:00"
            },
            "touristType": "Cultural tourism",
            "availableLanguage": ["English", "French", "Swahili", "Chichewa"]
        },
        {
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "Do I need authorization to visit Dzaleka?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes. All visits must be arranged at least 48 hours in advance through the official Visit Dzaleka initiative. Unauthorized entry is prohibited by the Government of Malawi."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Do I need to carry ID when visiting?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "We recommend carrying a valid Photo ID (Passport or National ID) when traveling to and from Dzaleka. Police checkpoints are common on Malawian roads, and having identification ensures a smooth journey."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Can I take photographs at Dzaleka?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Photography is allowed, but you must always ask for permission before photographing people. Your guide will help facilitate appropriate photo opportunities. Photography of security installations or the camp entrance is prohibited."
                    }
                },
                {
                    "@type": "Question",
                    "name": "How much does a tour cost?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Individual tours cost MWK 15,000, Small Groups (2-5) cost MWK 50,000, Medium Groups (6-10) cost MWK 80,000, and Large Groups (10+) cost MWK 100,000. Payment is accepted via Cash (MWK), Airtel Money, or TNM Mpamba."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Is Dzaleka safe to visit?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes, Dzaleka is generally safe for visitors. We recommend traveling with a guide, especially on your first visit. Avoid walking alone after dark and keep valuables secure."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Can I drink the tap water?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "No. It is not advised to drink tap water in Malawi. Visitors should use bottled water or a filtered water bottle for drinking."
                    }
                },
                {
                    "@type": "Question",
                    "name": "How do I get to Dzaleka from Lilongwe?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Dzaleka is located 41-45km from Lilongwe. Options include: Taxi (45-60 minutes direct), public minibus to Dowa then local transport (1-1.5 hours total), or private car. We can help arrange transportation if needed."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Do I need a visa for Malawi?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Most nationalities need a visa to enter Malawi. A 30-day Single Entry Visa costs $75. Some nationalities can get visas on arrival, while others need to apply in advance."
                    }
                }
            ]
        },
        {
            "@type": "Event",
            "name": "Tumaini Festival 2025",
            "description": "The world's only music festival hosted within a refugee camp. Features music, poetry, and dance from around the globe.",
            "startDate": "2025-10-30",
            "endDate": "2025-11-01",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "location": {
                "@type": "Place",
                "name": "Dzaleka Refugee Camp",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Dowa District",
                    "addressCountry": "MW"
                }
            },
            "isAccessibleForFree": true,
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "MWK",
                "availability": "https://schema.org/InStock"
            }
        },
        {
            "@type": "HowTo",
            "name": "How to Book a Visit to Dzaleka",
            "step": [
                {
                    "@type": "HowToStep",
                    "name": "Create an Account",
                    "text": "Sign up on the Visit Dzaleka portal with your name and contact details."
                },
                {
                    "@type": "HowToStep",
                    "name": "Choose Experience",
                    "text": "Select your tour type, group size, and date at least 48 hours in advance."
                },
                {
                    "@type": "HowToStep",
                    "name": "Customize",
                    "text": "Select zones and interests (Food, Art, Tech)."
                },
                {
                    "@type": "HowToStep",
                    "name": "Meet Your Guide",
                    "text": "Receive confirmation and meet your guide at the designated gate."
                }
            ]
        }
    ]
};

export default function VisitorEssentials() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Visitor Essentials | Visit Dzaleka Refugee Camp"
                description="Essential information for visiting Dzaleka Refugee Camp. Authorization requirements, documentation, dress code, photography rules, transport options, and booking information."
                keywords="Dzaleka visitor guide, Dzaleka authorization, Dzaleka travel, refugee camp visit, Malawi tourism, ethical tourism"
                canonical="https://visit.dzaleka.com/plan-your-trip/visitor-essentials"
                ogImage="https://tumainiletu.org/wp-content/uploads/2024/10/Badre_Bahaji_Tumaini_festival21_-31-1.jpg"
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
                        <Link href="/things-to-do" className="text-sm font-medium hover:text-primary transition-colors">Things To Do</Link>
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
                                    <Link href="/plan-your-trip/visitor-essentials" className="block px-4 py-2 text-sm hover:bg-muted transition-colors font-medium">Visitor Essentials</Link>
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
                        <Link href="/things-to-do" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Things To Do</Link>
                        <Link href="/whats-on" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>What's On</Link>
                        <Link href="/plan-your-trip" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Plan Your Trip</Link>
                        <Link href="/plan-your-trip/visitor-essentials" className="block text-sm font-medium py-1 pl-4 text-primary" onClick={() => setMobileMenuOpen(false)}>↳ Visitor Essentials</Link>
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
                <div className="relative py-16 sm:py-20 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
                    <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full uppercase tracking-widest font-semibold flex items-center justify-center w-fit mx-auto">
                            <Shield className="mr-2 h-3.5 w-3.5" />
                            Visitor Guide
                        </Badge>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                            Visitor Essentials
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                            Located in the Dowa District of Malawi, approximately 45km from Lilongwe, Dzaleka is home to over 50,000 people from the DRC, Rwanda, and Burundi.
                        </p>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl -z-10" />
                </div>

                <div className="container mx-auto px-4 py-8 sm:py-12 space-y-12 sm:space-y-16 max-w-5xl">

                    {/* Important Notice */}
                    <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
                        <CardContent className="p-6">
                            <div className="flex gap-4 items-start">
                                <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <h2 className="font-bold text-lg mb-2 text-amber-800 dark:text-amber-400">Important Notice</h2>
                                    <p className="text-amber-700 dark:text-amber-300 text-sm sm:text-base">
                                        Dzaleka is a humanitarian site, <strong>not a standard tourist destination</strong>. For those wanting a tour through Visit Dzaleka, arrangements must be made <strong className="text-amber-900 dark:text-amber-100">at least 48 hours in advance</strong>. Visiting is a privilege that requires careful planning and strict adherence to ethical guidelines.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Visitor Essentials Grid */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Essential Requirements</h2>
                        </div>
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <FileCheck className="h-5 w-5 text-primary" />
                                        Authorization Required
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Visits are allowed and encouraged, often through organized, respectful guided tours that support the community. For those wanting a tour through Visit Dzaleka, arrangements must be made <strong className="text-foreground">at least 48 hours in advance</strong>. Visitors must follow strict guidelines, prioritize cultural sensitivity, and ask permission before taking photos.
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Shield className="h-5 w-5 text-primary" />
                                        Documentation (Travel Safety)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    We recommend carrying a <strong className="text-foreground">valid Photo ID</strong> (Passport or National ID) when traveling to and from Dzaleka. Police checkpoints are common on Malawian roads, and having identification ensures a smooth journey.
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Users className="h-5 w-5 text-primary" />
                                        Dress Code
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">Modest clothing is required.</strong> Shoulders and knees should be covered to respect the diverse cultural and religious norms within the camp.
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Camera className="h-5 w-5 text-primary" />
                                        Photography Rules
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">Strictly Controlled.</strong> You must obtain explicit permission before photographing any individual. Photography of security installations, government buildings, or the camp entrance barrier is <strong className="text-foreground">prohibited</strong>.
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-2">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Wallet className="h-5 w-5 text-primary" />
                                        Currency & Banking
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground space-y-3">
                                    <p>
                                        The local currency is <strong className="text-foreground">Malawi Kwacha (MWK)</strong>. While cash is still widely preferred for markets and small purchases, banking services are available within the camp.
                                    </p>
                                    <div className="bg-muted/50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-foreground mb-2">🏧 ATM Access</h4>
                                        <p>
                                            <strong className="text-foreground">Centenary Bank</strong> operates a branch and ATM inside Dzaleka, supporting international cards (Visa, MasterCard, Cirrus, Maestro). This was established for financial inclusion and humanitarian aid cash transfers.
                                        </p>
                                    </div>
                                    <p className="text-xs">
                                        For ATM locations in nearby areas: <a href="https://www.natbank.co.mw/atm-locations" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">National Bank ATM Locator</a> | <a href="https://www.standardbank.co.mw/malawi/personal/contact-us/atm-locator" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Standard Bank ATM Locator</a>
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Booking & Pricing */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Calendar className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Booking & Visitor Information</h2>
                        </div>
                        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                            The Visit Dzaleka initiative manages cultural tours, ensuring that fees directly support the refugee guides and community projects. There is no physical "Booking Centre" outside the camp; all arrangements are handled digitally.
                        </p>

                        <Card className="mb-6 overflow-hidden">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-xs sm:text-sm">Package</TableHead>
                                            <TableHead className="text-xs sm:text-sm">Cost</TableHead>
                                            <TableHead className="text-xs sm:text-sm">Includes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="font-medium text-xs sm:text-sm">Individual (1)</TableCell>
                                            <TableCell className="text-xs sm:text-sm font-semibold">MWK 15,000</TableCell>
                                            <TableCell className="text-xs sm:text-sm text-muted-foreground">
                                                A personal, one-on-one cultural immersion tailored to your interests.
                                                <br /><span className="font-medium text-foreground/80">Includes:</span> Fully Personalized Itinerary, Dedicated Local Host, Flexible Pace.
                                            </TableCell>
                                        </TableRow>
                                        <TableRow className="bg-primary/5">
                                            <TableCell className="font-medium text-xs sm:text-sm">
                                                Small Group (2-5)
                                                <Badge variant="secondary" className="ml-2 text-[10px]">Most Popular</Badge>
                                            </TableCell>
                                            <TableCell className="text-xs sm:text-sm font-semibold">MWK 50,000</TableCell>
                                            <TableCell className="text-xs sm:text-sm text-muted-foreground">
                                                Intimate, interactive experience perfect for couples or small families.
                                                <br /><span className="font-medium text-foreground/80">Includes:</span> Interactive Group Tour, Experienced Guide, Shared Experience.
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium text-xs sm:text-sm">Medium Group (6-10)</TableCell>
                                            <TableCell className="text-xs sm:text-sm font-semibold">MWK 80,000</TableCell>
                                            <TableCell className="text-xs sm:text-sm text-muted-foreground">
                                                Balanced experience for extended families or teams ensuring everyone engages.
                                                <br /><span className="font-medium text-foreground/80">Includes:</span> Structured Experience, Senior Guide, Custom Focus Options.
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium text-xs sm:text-sm">Large Group (10+)</TableCell>
                                            <TableCell className="text-xs sm:text-sm font-semibold">MWK 100,000</TableCell>
                                            <TableCell className="text-xs sm:text-sm text-muted-foreground">
                                                Designed for schools or delegations with smooth logistics.
                                                <br /><span className="font-medium text-foreground/80">Includes:</span> Full Logistics Support, Multiple Guides, Q&A Session.
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>

                        <Card className="bg-muted/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base sm:text-lg">How to Book Your Tour</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex gap-3">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">1</div>
                                    <div>
                                        <strong>Create Your Account</strong>
                                        <p className="text-muted-foreground">Sign up on the <Link href="/login" className="text-primary hover:underline">Visit Dzaleka portal</Link> with your name, email, and phone number.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">2</div>
                                    <div>
                                        <strong>Choose Your Experience</strong>
                                        <p className="text-muted-foreground">Select your tour type (Standard 2-hour or Extended), group size, and preferred date/time at least 48 hours in advance.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">3</div>
                                    <div>
                                        <strong>Customize Your Tour</strong>
                                        <p className="text-muted-foreground">Select zones to visit (Market, Art District, Innovation Hub, etc.) and your interests (Food, Art, Tech, Music).</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">4</div>
                                    <div>
                                        <strong>Pick Your Meeting Point</strong>
                                        <p className="text-muted-foreground">Choose where you'll meet your guide—main gate, market entrance, or another designated location.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">5</div>
                                    <div>
                                        <strong>Receive Confirmation</strong>
                                        <p className="text-muted-foreground">Get an email with your assigned guide's details, contact info, and meeting instructions.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">6</div>
                                    <div>
                                        <strong>Pay on Arrival</strong>
                                        <p className="text-muted-foreground">Pay your guide directly via <strong>Cash (MWK)</strong>, <strong>Airtel Money</strong>, or <strong>TNM Mpamba</strong>.</p>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <Button asChild className="w-full sm:w-auto">
                                        <Link href="/login">Book Your Tour Now</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Travelling to Dzaleka */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Bus className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Travelling to Dzaleka</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="relative border-l-2 border-primary/30 ml-4 space-y-8 pl-8 py-2">
                                <div className="relative">
                                    <div className="absolute -left-[41px] top-0 h-8 w-8 rounded-full border-4 border-background bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">1</div>
                                    <h3 className="text-lg sm:text-xl font-bold mb-2">Route</h3>
                                    <p className="text-muted-foreground text-sm sm:text-base">
                                        From Lilongwe, take the M1 road north towards Kasungu, then turn onto the M16 towards Dowa. The camp is approximately <strong className="text-foreground">45-50km</strong> from the capital.
                                    </p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[41px] top-0 h-8 w-8 rounded-full border-4 border-background bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">2</div>
                                    <h3 className="text-lg sm:text-xl font-bold mb-2 flex items-center gap-2">
                                        <Bus className="h-4 w-4" /> By Minibus
                                    </h3>
                                    <p className="text-muted-foreground text-sm sm:text-base">
                                        Catch a minibus from <strong className="text-foreground">Lilongwe Bus Depot</strong> headed to Dowa. Ask to be dropped at "Dzaleka Turn-off" or the main market gate. This is the most affordable option but can be crowded.
                                    </p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[41px] top-0 h-8 w-8 rounded-full border-4 border-background bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">3</div>
                                    <h3 className="text-lg sm:text-xl font-bold mb-2">By Taxi</h3>
                                    <p className="text-muted-foreground text-sm sm:text-base">
                                        Private taxis can be hired from Lilongwe (approx. 45-60 mins). <strong className="text-foreground">Arrange a return trip in advance</strong>, as finding a taxi at the camp for the return journey can be difficult.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Getting Around & Accessibility */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Footprints className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Getting Around & Accessibility</h2>
                        </div>

                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Footprints className="h-5 w-5 text-primary" />
                                        Walking (Primary Mode)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Official tours are conducted entirely on foot. The camp is dense and lively; walking allows you to respectfully navigate the markets and community hubs. <strong className="text-foreground">Wear durable, closed-toe shoes.</strong>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Bike className="h-5 w-5 text-primary" />
                                        Bicycle Taxis (Kabaza)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    For longer distances within the camp, bicycle taxis are available at the main entrance. <strong className="text-foreground">Discuss the fare before starting your journey.</strong>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="mt-6 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
                            <CardContent className="p-6">
                                <div className="flex gap-4 items-start">
                                    <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-bold text-lg mb-2 text-amber-800 dark:text-amber-400">Accessibility Warning</h3>
                                        <p className="text-amber-700 dark:text-amber-300 text-sm sm:text-base">
                                            Accessibility is <strong>extremely limited</strong>. The camp consists largely of unpaved dirt roads that become muddy during the rainy season. There are few, if any, wheelchair-accessible facilities or paved sidewalks. Visitors with mobility challenges should <Link href="/login" className="text-primary hover:underline font-medium">contact Visit Dzaleka in advance</Link> to discuss feasibility.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Safety & Health */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Safety & Health</h2>
                        </div>
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base sm:text-lg">General Safety</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground space-y-2">
                                    <p>While generally safe, visitors should exercise caution:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        <li>Always travel with a guide, especially on first visits</li>
                                        <li>Be aware of your surroundings at all times</li>
                                        <li>Avoid walking alone after dark</li>
                                        <li>Keep valuables secure and discreet</li>
                                    </ul>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base sm:text-lg">Health Precautions</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground space-y-2">
                                    <p>Medical facilities are limited within the camp:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        <li><strong className="text-foreground">Do NOT drink tap water</strong> — use bottled or filtered water only</li>
                                        <li>Ensure you have comprehensive travel insurance</li>
                                        <li>Consult a doctor about vaccinations before visiting</li>
                                        <li>Bring any essential medications you need</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Ethical Considerations */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Users className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Ethical Considerations</h2>
                        </div>
                        <Card className="bg-muted/30">
                            <CardContent className="p-6">
                                <p className="text-muted-foreground mb-4 text-sm sm:text-base">Please respect the dignity of residents and community at all times:</p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="flex gap-3 items-start">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Camera className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">Ask Permission</p>
                                            <p className="text-xs text-muted-foreground">Always ask before taking photos of people</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-start">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Shield className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">Respect Privacy</p>
                                            <p className="text-xs text-muted-foreground">Be mindful of residents' personal space</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-start">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Wallet className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">Support Locally</p>
                                            <p className="text-xs text-muted-foreground">Buy from local vendors and artisans</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-start">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">Be Aware</p>
                                            <p className="text-xs text-muted-foreground">Understand the camp's challenges and limitations</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Malawi Travel Info */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <MapPin className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Malawi Travel Info</h2>
                        </div>
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold">🌍 Language</CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground">
                                    English (official) and Chichewa (widely spoken). French and Swahili are common in Dzaleka.
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold">☀️ Climate</CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground">
                                    Subtropical climate. Rainy season: Nov–Apr. Dry season: May–Oct (best time to visit).
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold">🔌 Power & Plugs</CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground">
                                    Type G (British 3-pin). Bring appropriate adapters for your devices.
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold">📱 Mobile Networks</CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground">
                                    Airtel and TNM (Telecom). Purchase a local SIM for data. Coverage may be limited.
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold">✈️ Airports</CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground">
                                    <strong>Kamuzu International (LLW)</strong> — Lilongwe (nearest)<br />
                                    Chileka International (BLZ) — Blantyre
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold">🛂 Visa Requirements</CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground">
                                    Most need a visa ($75 for 30 days). Some get visa on arrival. <a href="https://en.wikipedia.org/wiki/Visa_policy_of_Malawi" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Check requirements</a>
                                </CardContent>
                            </Card>
                        </div>

                        {/* What to Bring */}
                        <Card className="mt-6">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base sm:text-lg">🎒 What to Bring</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-primary">✓</span> Comfortable walking shoes
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-primary">✓</span> Sun protection (hat, sunscreen)
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-primary">✓</span> Water bottle
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-primary">✓</span> Camera (with permission)
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-primary">✓</span> Cash (MWK) for purchases
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-primary">✓</span> Modest, respectful clothing
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-primary">✓</span> Travel insurance documents
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-primary">✓</span> Any essential medications
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-primary">✓</span> Power adapter (Type G)
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Tumaini Festival */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Music className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Major Annual Event</h2>
                        </div>

                        <Card className="overflow-hidden">
                            <div className="md:flex">
                                <div className="md:w-2/5">
                                    <img
                                        src="https://tumainiletu.org/wp-content/uploads/2024/10/Badre_Bahaji_Tumaini_festival21_-31-1.jpg"
                                        alt="Tumaini Festival Performance"
                                        className="w-full h-48 md:h-full object-cover"
                                    />
                                </div>
                                <CardContent className="p-6 md:w-3/5">
                                    <Badge variant="secondary" className="mb-3">Oct 30 - Nov 1, 2025</Badge>
                                    <h3 className="text-xl sm:text-2xl font-bold mb-3">Tumaini Festival</h3>
                                    <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                                        This is the <strong className="text-foreground">world's only music festival hosted within a refugee camp</strong>. It attracts thousands of visitors for music, poetry, and dance. During the festival, a specific <strong className="text-foreground">Homestay Program</strong> allows visitors to stay overnight with refugee families.
                                    </p>
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Home className="h-4 w-4 text-primary" />
                                            <span><strong>Homestay:</strong> ~$20 USD/night</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Music className="h-4 w-4 text-primary" />
                                            <span><strong>Festival Entry:</strong> Free</span>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <Button asChild variant="outline" size="sm">
                                            <a href="https://tumainiletu.org/" target="_blank" rel="noopener noreferrer">
                                                Learn More <ExternalLink className="ml-2 h-3 w-3" />
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </div>
                        </Card>
                    </section>

                    {/* CTA Section */}
                    <section className="bg-primary/5 rounded-2xl p-6 sm:p-8 md:p-12 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">Ready to Visit?</h2>
                        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto text-sm sm:text-base">
                            Book your authorized tour through our official portal and experience Dzaleka with a local guide.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild size="lg">
                                <Link href="/login">Book Your Tour</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg">
                                <Link href="/plan-your-trip">Full Trip Planner</Link>
                            </Button>
                        </div>
                    </section>

                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
