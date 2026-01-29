import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Menu, X, MapPin, Users, History, Globe, Building2, Scale, Shield,
    AlertTriangle, Landmark, GraduationCap, Heart, ExternalLink, FileText
} from "lucide-react";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";

// Comprehensive Structured Data for SEO - Dzaleka Refugee Camp
// Using schema.org types: AdministrativeArea, LandmarksOrHistoricalBuildings, Hospital, PoliceStation, EducationalOrganization
const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        // Organization - Visit Dzaleka
        {
            "@type": "Organization",
            "@id": "https://visit.dzaleka.com#organization",
            "name": "Visit Dzaleka",
            "url": "https://visit.dzaleka.com",
            "logo": "https://services.dzaleka.com/images/dzaleka-digital-heritage.png"
        },
        // BreadcrumbList
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://visit.dzaleka.com" },
                { "@type": "ListItem", "position": 2, "name": "About Dzaleka", "item": "https://visit.dzaleka.com/about-dzaleka" }
            ]
        },
        // Main Place - Dzaleka Refugee Camp as AdministrativeArea
        {
            "@type": ["Place", "AdministrativeArea", "CivicStructure"],
            "@id": "https://visit.dzaleka.com/about-dzaleka#dzaleka-camp",
            "name": "Dzaleka Refugee Camp",
            "alternateName": ["Dzaleka Camp", "Dzaleka"],
            "description": "Dzaleka Refugee Camp is Malawi's only refugee camp, established in 1994. Located 41km north of Lilongwe in Dowa District, it hosts over 56,000 refugees and asylum seekers primarily from the Democratic Republic of Congo, Burundi, and Rwanda. Originally a political prison (1964-1994), the camp was designed for 10,000-12,000 people across 201 hectares.",
            "url": "https://visit.dzaleka.com/about-dzaleka",
            "image": "https://services.dzaleka.com/images/20241023_205851_3.jpg",
            "foundingDate": "1994",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Dowa",
                "addressRegion": "Central Region",
                "addressCountry": "MW"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": -13.7833,
                "longitude": 33.9833
            },
            "areaServed": {
                "@type": "Population",
                "populationType": "Refugees and Asylum Seekers",
                "numConstraints": {
                    "@type": "QuantitativeValue",
                    "value": 56000,
                    "unitText": "people"
                }
            },
            "containsPlace": [
                { "@id": "https://visit.dzaleka.com/about-dzaleka#dzaleka-health-centre" },
                { "@id": "https://visit.dzaleka.com/about-dzaleka#dzaleka-hill" },
                { "@id": "https://visit.dzaleka.com/about-dzaleka#police-station" },
                { "@id": "https://visit.dzaleka.com/about-dzaleka#jrs-schools" }
            ],
            "sameAs": [
                "https://en.wikipedia.org/wiki/Dzaleka_Refugee_Camp",
                "https://www.unhcr.org/where-we-work/countries/malawi"
            ]
        },
        // Dzaleka Hill - LandmarksOrHistoricalBuildings
        {
            "@type": "LandmarksOrHistoricalBuildings",
            "@id": "https://visit.dzaleka.com/about-dzaleka#dzaleka-hill",
            "name": "Dzaleka Hill",
            "description": "A natural landmark offering panoramic views of Dzaleka Refugee Camp and the surrounding Central Region of Malawi. The hill provides a popular viewpoint to observe the settlement's growth and layout, including the New Katubza extension area.",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Dowa",
                "addressRegion": "Central Region",
                "addressCountry": "MW"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": -13.7833,
                "longitude": 33.9833
            },
            "isAccessibleForFree": true,
            "publicAccess": true
        },
        // Dzaleka Health Centre - Hospital/MedicalClinic
        {
            "@type": "Hospital",
            "@id": "https://visit.dzaleka.com/about-dzaleka#dzaleka-health-centre",
            "name": "Dzaleka Health Centre",
            "alternateName": "Dzaleka Clinic",
            "description": "Primary healthcare facility serving Dzaleka Refugee Camp and surrounding Malawian communities. Operated by UNHCR in partnership with the Malawi Ministry of Health, it provides primary healthcare, maternal and child healthcare, chronic disease management, vaccination programs, and health education. Serves approximately 70,000-86,000 people.",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Dowa",
                "addressRegion": "Central Region",
                "addressCountry": "MW"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": -13.7833,
                "longitude": 33.9833
            },
            "medicalSpecialty": [
                "Primary Care",
                "Maternal Health",
                "Child Health",
                "Vaccination",
                "Chronic Disease Management"
            ],
            "availableService": [
                {
                    "@type": "MedicalProcedure",
                    "name": "Primary Healthcare"
                },
                {
                    "@type": "MedicalProcedure",
                    "name": "Maternal and Child Healthcare"
                },
                {
                    "@type": "MedicalProcedure",
                    "name": "Vaccination Programs"
                }
            ],
            "parentOrganization": {
                "@type": "GovernmentOrganization",
                "name": "Malawi Ministry of Health"
            },
            "funder": {
                "@type": "Organization",
                "name": "UNHCR",
                "url": "https://www.unhcr.org"
            }
        },
        // Police Station - CivicStructure
        {
            "@type": "CivicStructure",
            "@id": "https://visit.dzaleka.com/about-dzaleka#police-station",
            "name": "Dzaleka Police Post",
            "description": "Security services provided by Malawi Police Service personnel stationed at Dzaleka Refugee Camp. Works with community policing initiatives and elected zone leaders to maintain safety and order.",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Dowa",
                "addressRegion": "Central Region",
                "addressCountry": "MW"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": -13.7833,
                "longitude": 33.9833
            },
            "parentOrganization": {
                "@type": "GovernmentOrganization",
                "name": "Malawi Police Service"
            }
        },
        // Educational Organizations - JRS Schools
        {
            "@type": "EducationalOrganization",
            "@id": "https://visit.dzaleka.com/about-dzaleka#jrs-schools",
            "name": "Jesuit Refugee Service Schools",
            "alternateName": "JRS Dzaleka Schools",
            "description": "Educational facilities operated by Jesuit Refugee Service (JRS) in Dzaleka Refugee Camp. Educates over 5,000 children in pre-primary, primary, and secondary levels. Dzaleka Community Day Secondary School (CDSS) serves both refugees and local Malawian students and has achieved national recognition for academic excellence.",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Dowa",
                "addressRegion": "Central Region",
                "addressCountry": "MW"
            },
            "numberOfStudents": {
                "@type": "QuantitativeValue",
                "value": 5000,
                "unitText": "students"
            },
            "parentOrganization": {
                "@type": "NGO",
                "name": "Jesuit Refugee Service",
                "url": "https://jrs.net"
            }
        },
        // UNHCR - Managing Organization
        {
            "@type": "GovernmentOrganization",
            "@id": "https://visit.dzaleka.com/about-dzaleka#unhcr",
            "name": "UNHCR Malawi",
            "alternateName": "United Nations High Commissioner for Refugees - Malawi",
            "description": "UNHCR coordinates humanitarian response at Dzaleka Refugee Camp alongside the Government of Malawi and partner organizations including WFP and Plan International.",
            "url": "https://www.unhcr.org/where-we-work/countries/malawi",
            "parentOrganization": {
                "@type": "Organization",
                "name": "United Nations",
                "url": "https://www.un.org"
            }
        },
        // Article about Dzaleka
        {
            "@type": "Article",
            "headline": "About Dzaleka Refugee Camp",
            "description": "Comprehensive information about Dzaleka Refugee Camp in Malawi - establishment in 1994, demographics (56,000+ refugees from DRC, Burundi, Rwanda), governance by Ministry of Homeland Security and UNHCR, living conditions, and 2024-2025 policy developments.",
            "datePublished": "2024-01-01",
            "dateModified": "2025-01-01",
            "author": { "@id": "https://visit.dzaleka.com#organization" },
            "publisher": { "@id": "https://visit.dzaleka.com#organization" },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": "https://visit.dzaleka.com/about-dzaleka"
            },
            "about": { "@id": "https://visit.dzaleka.com/about-dzaleka#dzaleka-camp" }
        }
    ]
};

export default function AboutDzaleka() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="About Dzaleka Refugee Camp | History, Facts & Overview"
                description="Learn about Dzaleka Refugee Camp in Malawi - established in 1994, home to 56,000+ refugees from DRC, Rwanda, Burundi. Discover its history, governance, and current developments."
                keywords="Dzaleka refugee camp, Malawi refugees, Dzaleka history, Dzaleka facts, UNHCR Malawi, Dowa District"
                canonical="https://visit.dzaleka.com/about-dzaleka"
                ogImage="https://services.dzaleka.com/images/20241023_205851_3.jpg"
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
                            <img src="https://services.dzaleka.com/images/dzaleka-digital-heritage.png" alt="Visit Dzaleka Logo" className="h-10 w-10 rounded-lg shadow-sm" />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold tracking-tight">Visit Dzaleka</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Official Portal</span>
                            </div>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-4">
                        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
                        <Link href="/about-dzaleka" className="text-sm font-medium text-primary transition-colors">About Dzaleka</Link>
                        <Link href="/life-in-dzaleka" className="text-sm font-medium hover:text-primary transition-colors">Life in Dzaleka</Link>
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
                        <Link href="/about-dzaleka" className="block text-sm font-medium py-1 text-primary" onClick={() => setMobileMenuOpen(false)}>About Dzaleka</Link>
                        <Link href="/life-in-dzaleka" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Life in Dzaleka</Link>
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
                <div id="dzaleka-camp" className="relative py-16 sm:py-20 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
                    <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full uppercase tracking-widest font-semibold flex items-center justify-center w-fit mx-auto">
                            <MapPin className="mr-2 h-3.5 w-3.5" />
                            Dowa District, Malawi
                        </Badge>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                            Dzaleka Refugee Camp
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                            Located 41 km north of Lilongwe, Dzaleka is Malawi's only refugee camp—home to over 56,000 people from the Democratic Republic of Congo, Rwanda, Burundi, and other nations.
                        </p>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl -z-10" />
                </div>

                {/* Quick Facts Bar */}
                <div className="bg-muted/50 border-y">
                    <div className="container mx-auto px-4 py-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <History className="h-6 w-6 mx-auto mb-2 text-primary" />
                                <div className="text-2xl sm:text-3xl font-bold">1994</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">Established</div>
                            </div>
                            <div className="text-center">
                                <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                                <div className="text-2xl sm:text-3xl font-bold">56,000+</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">Population (2024)</div>
                            </div>
                            <div className="text-center">
                                <MapPin className="h-6 w-6 mx-auto mb-2 text-primary" />
                                <div className="text-2xl sm:text-3xl font-bold">201 ha</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">Original Area</div>
                            </div>
                            <div className="text-center">
                                <Globe className="h-6 w-6 mx-auto mb-2 text-primary" />
                                <div className="text-2xl sm:text-3xl font-bold">10-12k</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">Design Capacity</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8 sm:py-12 space-y-12 sm:space-y-16 max-w-5xl">

                    {/* Establishment */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <History className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Establishment & Historical Context</h2>
                        </div>
                        <div className="prose prose-sm sm:prose max-w-none text-muted-foreground">
                            <p className="text-sm sm:text-base leading-relaxed">
                                Dzaleka Refugee Camp was established in <strong className="text-foreground">1994</strong> by the Government of Malawi and the United Nations High Commissioner for Refugees (UNHCR) to host individuals fleeing ethnic violence and genocide in Burundi, and subsequently the Democratic Republic of Congo and Rwanda.
                            </p>
                            <p className="text-sm sm:text-base leading-relaxed mt-4">
                                Originally designed for <strong className="text-foreground">10,000–12,000 residents</strong> across 201 hectares, the camp was intended as temporary shelter. However, with ongoing conflicts in the Great Lakes region and limited durable solutions, Dzaleka has become a permanent home for multiple generations of families.
                            </p>
                            <p className="text-sm sm:text-base leading-relaxed mt-4">
                                The site was formerly a <strong className="text-foreground">political detention center</strong> during the Hastings Kamuzu Banda era before being repurposed for humanitarian use.
                            </p>
                        </div>
                    </section>

                    {/* Demographics */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Users className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Demographics & Population</h2>
                        </div>
                        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                            As of August 2024, Dzaleka houses <strong className="text-foreground">55,425 refugees and asylum-seekers</strong>, with design capacity long exceeded—approximately <strong className="text-foreground">5x the intended population</strong>.
                        </p>

                        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        🇨🇩 DRC
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    The largest nationality group, primarily fleeing ongoing conflict in eastern DRC including the M23 crisis.
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        🇧🇮 Burundi
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Long-term residents from the 1993 civil war and 2015 political crisis, many now second-generation.
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        🇷🇼 Rwanda
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Survivors of the 1994 genocide and subsequent displacement, many with decades in the camp.
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="mt-6 bg-muted/30">
                            <CardContent className="p-6">
                                <p className="text-sm text-muted-foreground">
                                    Other nationalities include <strong className="text-foreground">Ethiopia, Somalia, Zimbabwe, Mozambique</strong>, and several other African nations. The camp has a <strong className="text-foreground">young population</strong>, with over 60% under the age of 18, and continues to receive new arrivals monthly.
                                </p>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Camp Zones */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <MapPin className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Camp Zones</h2>
                        </div>
                        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                            The camp is divided into zones named after Malawian towns and cities, each with its own unique character. The government set up the zones for administrative purposes.
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            <Card className="text-center p-4">
                                <CardContent className="p-0">
                                    <p className="font-semibold">Lisungwi</p>
                                </CardContent>
                            </Card>
                            <Card className="text-center p-4">
                                <CardContent className="p-0">
                                    <p className="font-semibold">Kawale 1 & 2</p>
                                </CardContent>
                            </Card>
                            <Card className="text-center p-4">
                                <CardContent className="p-0">
                                    <p className="font-semibold">Likuni 1 & 2</p>
                                </CardContent>
                            </Card>
                            <Card className="text-center p-4">
                                <CardContent className="p-0">
                                    <p className="font-semibold">Zomba</p>
                                </CardContent>
                            </Card>
                            <Card className="text-center p-4">
                                <CardContent className="p-0">
                                    <p className="font-semibold">Blantyre</p>
                                </CardContent>
                            </Card>
                            <Card className="text-center p-4">
                                <CardContent className="p-0">
                                    <p className="font-semibold">Katubza</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <Card className="border-primary/30 bg-primary/5">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base sm:text-lg">New Katubza</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    An extension area of the Dzaleka refugee camp, developed to reduce overcrowding and provide better living conditions for refugees and asylum seekers.
                                </CardContent>
                            </Card>
                            <Card id="dzaleka-hill" className="border-primary/30 bg-primary/5">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base sm:text-lg">Dzaleka Hill</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    A natural landmark offering views of the camp and surrounding area. The hill provides a popular viewpoint to see the large and growing settlement, including areas like New Katubza.
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Governance */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Landmark className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Governance & Operational Framework</h2>
                        </div>
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Building2 className="h-5 w-5 text-primary" />
                                        Government Administration
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    The camp is administered by the <strong className="text-foreground">Ministry of Homeland Security</strong> through an appointed Camp Administrator. The <strong className="text-foreground">Department of Refugee Affairs</strong> handles registration and documentation.
                                </CardContent>
                            </Card>
                            <Card id="unhcr">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Globe className="h-5 w-5 text-primary" />
                                        UNHCR & Partners
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">UNHCR</strong> coordinates humanitarian response alongside partners including <strong className="text-foreground">WFP</strong> (food), <strong className="text-foreground">Plan International</strong> (child protection), and various NGOs providing health, education, and livelihood support.
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Users className="h-5 w-5 text-primary" />
                                        Community Leadership
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Elected <strong className="text-foreground">Community Leaders</strong> represent different nationality groups and zones. The <strong className="text-foreground">Dzaleka Children's Parliament</strong> provides youth representation on protection and education issues.
                                </CardContent>
                            </Card>
                            <Card id="police-station">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Shield className="h-5 w-5 text-primary" />
                                        Security
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Security is provided by <strong className="text-foreground">Malawi Police Service</strong> personnel stationed at the camp. Community policing initiatives also operate through elected zone leaders.
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Services & Facilities */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Heart className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Services & Facilities</h2>
                        </div>
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                            <Card id="dzaleka-health-centre">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Heart className="h-5 w-5 text-primary" />
                                        Dzaleka Health Centre
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                                    <p className="mb-3">
                                        Serving a community of over <strong className="text-foreground">80,000 people</strong>—including both camp residents and neighbors from surrounding villages—the Dzaleka Health Centre is the medical backbone of the area.
                                    </p>
                                    <p>
                                        Operated by <strong className="text-foreground">UNHCR</strong> in partnership with the <strong className="text-foreground">Malawi Ministry of Health</strong>, the center works tirelessly to provide essential outpatient care, maternal health support, and vital vaccination programs. Despite the high volume of patients, dedicated staff manage everything from chronic disease treatment to community health education.
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-3 italic">
                                        Support is bolstered by partners like Beit-CURE Children's Hospital, which runs mobile clinics for children with treatable disabilities.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card id="jrs-schools">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <GraduationCap className="h-5 w-5 text-primary" />
                                        Jesuit Refugee Service Schools
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                                    <p className="mb-3">
                                        Education is a priority in Dzaleka, with the <strong className="text-foreground">Jesuit Refugee Service (JRS)</strong> leading the way by providing schooling for over <strong className="text-foreground">5,000 students</strong> across all grade levels.
                                    </p>
                                    <p>
                                        A standout success is the <strong className="text-foreground">Dzaleka Community Day Secondary School (CDSS)</strong>, which welcomes both refugee and Malawian students and is nationally recognized for its academic excellence. Beyond formal schooling, the camp buzzes with learning opportunities, from private initiates coordinated by <strong className="text-foreground">RISA</strong> to tech hubs like TakenoLAB and AppFactory empowering youth with digital skills.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Legal Framework */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Scale className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Legal Framework</h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-primary" />
                                        The 1989 Refugee Act
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <p className="mb-3">
                                        Malawi's current refugee law maintains reservations to the 1951 Refugee Convention, restricting refugees' rights to:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 ml-1">
                                        <li>Freedom of movement (encampment policy)</li>
                                        <li>Right to work and hold business licenses</li>
                                        <li>Property ownership outside the camp</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        Policy Reform (2024-2025)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <p className="mb-3">
                                        A <strong className="text-foreground">Special Law Commission</strong> began reviewing the 1989 Act in January 2024, with a new Refugee Bill expected by December 2025. Key proposed changes include lifting restrictions on employment and movement, aligning with international standards, and enabling access to national services.
                                    </p>
                                    <p className="mt-4 pt-4 border-t text-xs italic">
                                        Malawi also launched its first <strong className="text-foreground">National Implementation Plan on Migration (2025–2029)</strong> and the Keyilizi Open Settlement pilot.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Challenges */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <AlertTriangle className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Current Challenges</h2>
                        </div>
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base sm:text-lg">Overcrowding & Infrastructure</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    At 5x design capacity, housing is critical. Extension sites (Woodlot Area, Dzaleka Hills, Katubza) are being developed, but space remains insufficient for new arrivals.
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base sm:text-lg">Funding Shortfalls</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    UNHCR and WFP faced significant funding gaps in 2024-2025, leading to food ration cuts (50-75% of daily requirements) and reduced services.
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base sm:text-lg">Relocation Enforcement</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    In June 2024, approximately 2,000 urban refugees were forcibly relocated to Dzaleka, drawing criticism from human rights organizations.
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base sm:text-lg">Security Concerns</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Human trafficking has been identified as a concern, with UNODC conducting operations. Faith leaders and law enforcement are working on awareness campaigns.
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Resources */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <FileText className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Resources & References</h2>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <a href="https://www.unhcr.org/where-we-work/countries/malawi" target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <ExternalLink className="h-5 w-5 text-primary shrink-0" />
                                <div>
                                    <p className="font-medium text-sm">UNHCR Malawi</p>
                                    <p className="text-xs text-muted-foreground">Official UNHCR country page</p>
                                </div>
                            </a>
                            <a href="https://inuaadvocacy.org/wp-content/uploads/2024/12/MALAWI-REFUGEE-GUIDE-DEC-2024-sm.pdf" target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <ExternalLink className="h-5 w-5 text-primary shrink-0" />
                                <div>
                                    <p className="font-medium text-sm">Malawi Refugee Guide</p>
                                    <p className="text-xs text-muted-foreground">Inua Advocacy - December 2024</p>
                                </div>
                            </a>
                            <a href="https://services.dzaleka.com/data" target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <ExternalLink className="h-5 w-5 text-primary shrink-0" />
                                <div>
                                    <p className="font-medium text-sm">Dzaleka Data Portal</p>
                                    <p className="text-xs text-muted-foreground">Open data and research</p>
                                </div>
                            </a>
                            <a href="https://services.dzaleka.com" target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <ExternalLink className="h-5 w-5 text-primary shrink-0" />
                                <div>
                                    <p className="font-medium text-sm">Dzaleka Online Services</p>
                                    <p className="text-xs text-muted-foreground">Community resources and services</p>
                                </div>
                            </a>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="bg-primary/5 rounded-2xl p-6 sm:p-8 md:p-12 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">Want to Learn More?</h2>
                        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto text-sm sm:text-base">
                            Explore daily life in Dzaleka or plan a guided visit to experience this remarkable community firsthand.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild size="lg">
                                <Link href="/life-in-dzaleka">Life in Dzaleka</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg">
                                <Link href="/plan-your-trip">Plan Your Visit</Link>
                            </Button>
                        </div>
                    </section>

                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
