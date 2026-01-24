
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ArrowRight, Menu, X, Globe, Calendar, Users, Camera, Music, BookOpen, Star } from "lucide-react";
import { useState } from "react";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";

// Structured Data for Google "Things to do" - TouristAttraction + TouristTrip
// Using valid schema.org types only: https://schema.org/TouristAttraction
const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        // Organization - Provider info for rich snippets
        {
            "@type": "Organization",
            "@id": "https://visit.dzaleka.com#organization",
            "name": "Visit Dzaleka",
            "url": "https://visit.dzaleka.com",
            "logo": "https://services.dzaleka.com/images/dzaleka-digital-heritage.png",
            "description": "Official tourism portal for Dzaleka Refugee Camp cultural experiences and guided tours in Malawi.",
            "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "availableLanguage": ["English", "French", "Swahili"]
            },
            "sameAs": [
                "https://www.facebook.com/dzalekaOnline",
                "https://twitter.com/dzalekaconnect"
            ]
        },
        // BreadcrumbList - Navigation path for search results
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://visit.dzaleka.com"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Things to Do",
                    "item": "https://visit.dzaleka.com/things-to-do"
                }
            ]
        },
        // Main TouristAttraction with AggregateRating
        {
            "@type": "TouristAttraction",
            "@id": "https://visit.dzaleka.com/things-to-do#attraction",
            "name": "Dzaleka Refugee Camp Cultural Tours",
            "description": "Guided cultural tours of Dzaleka Refugee Camp in Malawi. Experience diverse African cultures, meet local artisans, visit community markets, and learn about refugee resilience and innovation.",
            "url": "https://visit.dzaleka.com/things-to-do",
            "image": [
                "https://tumainiletu.org/wp-content/uploads/2021/07/Website-Entrepreneurship-and-innovation-2048x1536.jpg",
                "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhQC52NEfamRlqaUT7uLWcP8ZKNUDp3_opelPFqoO6E5hyphenhyphen09lp-zxRXXig5aEnaH3PbRsia1ciM8y-vOdzDe9RMvbQApON7rdM0SrBmtVVWAPIzmiId-jvcwSa46-Y-qRApCBTmozhIbWhNZWxcLFY3bp6Q4uNk_LFB5MpYFlXywwX7vYlUQeRoirJWm50/s16000-rw/533061219_1079243081018233_5344782622295089839_n.jpg"
            ],
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
            "touristType": ["Cultural tourists", "Educational visitors", "Volunteer travelers"],
            "availableLanguage": ["English", "French", "Swahili", "Chichewa"],
            "isAccessibleForFree": false,
            "publicAccess": true,
            "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                "opens": "08:00",
                "closes": "17:00"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "47",
                "bestRating": "5",
                "worstRating": "1"
            },
            "sameAs": [
                "https://www.facebook.com/dzalekaOnline",
                "https://visit.dzaleka.com"
            ]
        },
        // TouristTrip - Individual Tour
        {
            "@type": "TouristTrip",
            "@id": "https://visit.dzaleka.com/things-to-do#individual",
            "name": "Individual Cultural Tour",
            "description": "A personal, one-on-one cultural immersion tailored to your interests. Connect deeply with your guide at your own pace.",
            "touristType": ["Cultural tourists", "Educational visitors"],
            "subjectOf": { "@id": "https://visit.dzaleka.com/things-to-do#attraction" },
            "itinerary": {
                "@type": "ItemList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Welcome and orientation" },
                    { "@type": "ListItem", "position": 2, "name": "Walk through camp zones" },
                    { "@type": "ListItem", "position": 3, "name": "Visit local market and businesses" },
                    { "@type": "ListItem", "position": 4, "name": "Meet community artisans" },
                    { "@type": "ListItem", "position": 5, "name": "Q&A with residents" }
                ]
            },
            "offers": {
                "@type": "Offer",
                "price": "15000",
                "priceCurrency": "MWK",
                "availability": "https://schema.org/InStock",
                "validFrom": "2024-01-01",
                "priceValidUntil": "2026-12-31",
                "url": "https://visit.dzaleka.com/login"
            },
            "provider": { "@id": "https://visit.dzaleka.com#organization" }
        },
        // TouristTrip - Small Group
        {
            "@type": "TouristTrip",
            "@id": "https://visit.dzaleka.com/things-to-do#small-group",
            "name": "Small Group Experience",
            "description": "Perfect for couples or small families (2-5 people) seeking an intimate, interactive experience.",
            "touristType": ["Cultural tourists", "Families", "Small groups"],
            "subjectOf": { "@id": "https://visit.dzaleka.com/things-to-do#attraction" },
            "offers": {
                "@type": "Offer",
                "price": "50000",
                "priceCurrency": "MWK",
                "availability": "https://schema.org/InStock",
                "validFrom": "2024-01-01",
                "priceValidUntil": "2026-12-31",
                "url": "https://visit.dzaleka.com/login"
            },
            "provider": { "@id": "https://visit.dzaleka.com#organization" }
        },
        // TouristTrip - Medium Group
        {
            "@type": "TouristTrip",
            "@id": "https://visit.dzaleka.com/things-to-do#medium-group",
            "name": "Medium Group Tour",
            "description": "Ideal for extended families, friend groups, or small teams (6-10 people). A balanced experience ensuring everyone engages.",
            "touristType": ["Educational visitors", "Groups"],
            "subjectOf": { "@id": "https://visit.dzaleka.com/things-to-do#attraction" },
            "offers": {
                "@type": "Offer",
                "price": "80000",
                "priceCurrency": "MWK",
                "availability": "https://schema.org/InStock",
                "priceValidUntil": "2026-12-31",
                "url": "https://visit.dzaleka.com/login"
            },
            "provider": { "@id": "https://visit.dzaleka.com#organization" }
        },
        // TouristTrip - Large Group
        {
            "@type": "TouristTrip",
            "@id": "https://visit.dzaleka.com/things-to-do#large-group",
            "name": "Large Group Tour",
            "description": "Designed for schools, organizations, or delegations (10+ people). Includes dedicated logistics and multiple guides.",
            "touristType": ["Researchers", "Special interest groups", "Large delegations"],
            "subjectOf": { "@id": "https://visit.dzaleka.com/things-to-do#attraction" },
            "offers": {
                "@type": "Offer",
                "price": "100000",
                "priceCurrency": "MWK",
                "availability": "https://schema.org/InStock",
                "priceValidUntil": "2026-12-31",
                "url": "https://visit.dzaleka.com/login"
            },
            "provider": { "@id": "https://visit.dzaleka.com#organization" }
        },
        // Event - Tumaini Festival (enhanced)
        {
            "@type": "Event",
            "@id": "https://visit.dzaleka.com/things-to-do#tumaini-festival",
            "name": "Tumaini Festival 2026",
            "description": "Annual arts and music festival celebrating refugee creativity and peaceful coexistence. Features international and local performances, dance, poetry, and theater.",
            "image": "https://tumainiletu.org/wp-content/uploads/2024/10/Badre_Bahaji_Tumaini_festival21_-35-1.jpg",
            "startDate": "2026-11-01T09:00:00+02:00",
            "endDate": "2026-11-02T21:00:00+02:00",
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "location": {
                "@type": "Place",
                "name": "Dzaleka Refugee Camp",
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
                }
            },
            "isAccessibleForFree": true,
            "performer": {
                "@type": "PerformingGroup",
                "name": "Various Local and International Artists"
            },
            "organizer": {
                "@type": "Organization",
                "name": "Tumaini Letu",
                "url": "https://tumainiletu.org"
            },
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "MWK",
                "availability": "https://schema.org/InStock",
                "url": "https://tumainiletu.org"
            }
        },
        // Accommodation - Homestay Program (using LodgingBusiness as container)
        {
            "@type": "LodgingBusiness",
            "@id": "https://visit.dzaleka.com/things-to-do#homestay",
            "name": "Dzaleka Homestay Program",
            "description": "Community-based tourism initiative connecting visitors with refugee families in Dzaleka Refugee Camp. Experience daily life, culture, and hospitality while contributing to intercultural exchange. $15 goes directly to the host family, $5 supports program management.",
            "url": "https://tumainiletu.org/the-dzaleka-homestay-program/",
            "image": "https://tumainiletu.org/wp-content/uploads/2024/10/Dzaleka_107-min.jpg",
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
            "amenityFeature": [
                {
                    "@type": "LocationFeatureSpecification",
                    "name": "One Meal Per Day Included",
                    "value": true
                },
                {
                    "@type": "LocationFeatureSpecification",
                    "name": "Private Room",
                    "value": true
                },
                {
                    "@type": "LocationFeatureSpecification",
                    "name": "Vetted Host Families",
                    "value": true
                },
                {
                    "@type": "LocationFeatureSpecification",
                    "name": "Cultural Exchange Activities",
                    "value": true
                }
            ],
            "availableLanguage": ["English", "French", "Swahili"],
            "priceRange": "$20 USD per person per night",
            "currenciesAccepted": "USD",
            "email": "dzalekahomestay@gmail.com",
            "tourBookingPage": "https://tumainiletu.org/the-dzaleka-homestay-program/",
            "numberOfRooms": {
                "@type": "QuantitativeValue",
                "value": 1,
                "unitText": "private room per guest"
            },
            "containsPlace": {
                "@type": "Accommodation",
                "name": "Private Homestay Room",
                "description": "Private room in a vetted refugee family home. Basic facilities include pit-style toilets and bucket showers. Most homes don't have refrigerators, and electricity may be limited.",
                "occupancy": {
                    "@type": "QuantitativeValue",
                    "minValue": 1,
                    "maxValue": 2,
                    "unitText": "guests (couples may share)"
                },
                "amenityFeature": [
                    {
                        "@type": "LocationFeatureSpecification",
                        "name": "Private Room",
                        "value": true
                    },
                    {
                        "@type": "LocationFeatureSpecification",
                        "name": "Bucket Shower",
                        "value": true
                    },
                    {
                        "@type": "LocationFeatureSpecification",
                        "name": "Pit Toilet",
                        "value": true
                    }
                ],
                "numberOfRooms": 1
            }
        },
        // FAQPage - Common questions for rich snippets
        {
            "@type": "FAQPage",
            "mainEntity": [
                // Tour FAQs
                {
                    "@type": "Question",
                    "name": "How do I book a tour of Dzaleka Refugee Camp?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "You can book a guided cultural tour through our online booking portal at visit.dzaleka.com. Simply create an account, select your preferred tour type (individual, small group, medium group, or large group), choose your date, and complete the booking."
                    }
                },
                {
                    "@type": "Question",
                    "name": "What languages are tours available in?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Our tours are available in English, French, Swahili, and Chichewa. Please specify your language preference when booking."
                    }
                },
                {
                    "@type": "Question",
                    "name": "How much does a Dzaleka cultural tour cost?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Tour prices vary by group size: Individual tours start at MWK 15,000, Small Group (2-5 people) at MWK 50,000, Medium Group (6-10 people) at MWK 80,000, and Large Group (10+ people) at MWK 100,000."
                    }
                },
                {
                    "@type": "Question",
                    "name": "What is the Tumaini Festival?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "The Tumaini Festival is an annual free arts and music festival held at Dzaleka Refugee Camp, typically in late October or early November. It celebrates refugee creativity and peaceful coexistence through music, dance, poetry, and theater performances."
                    }
                },
                // Homestay FAQs (from Tumaini Letu website)
                {
                    "@type": "Question",
                    "name": "What is the Dzaleka Homestay Program?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "The homestay program connects visitors with refugee families in Dzaleka Refugee Camp, offering a unique opportunity to experience daily life, culture, and hospitality within the community."
                    }
                },
                {
                    "@type": "Question",
                    "name": "How much does the Dzaleka Homestay cost?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "The program costs $20 USD per person per night. $15 goes directly to the host family, and $5 supports the recruitment, training, and management of the program."
                    }
                },
                {
                    "@type": "Question",
                    "name": "What meals are included in the homestay?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "One meal per day is included, prepared by your host family. For other meals, you can explore the many restaurants in the camp offering chapati, Congolese and Ethiopian cuisine, BBQ, rice, nsima, and smoothies."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Will I have my own room in the homestay?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes, all homestay guests will have their own private room. Couples may choose to stay together."
                    }
                },
                {
                    "@type": "Question",
                    "name": "What facilities can I expect at a Dzaleka homestay?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Facilities are basic: toilets are usually squat, pit-style, and showers are typically bucket showers. Most homes don't have refrigerators, and not all have electricity."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Is it safe to stay in a homestay at Dzaleka?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes. Host families are carefully vetted by Tumaini Letu for their hospitality, safety, and willingness to welcome visitors. Hosts are trained in how to receive guests. Contact dzalekahomestay@gmail.com with specific concerns."
                    }
                },
                {
                    "@type": "Question",
                    "name": "How long can I stay with a host family?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Most visitors stay for the duration of the Tumaini Festival (2-3 nights), but longer stays can be arranged year-round. Contact dzalekahomestay@gmail.com for more information."
                    }
                },
                {
                    "@type": "Question",
                    "name": "How do I apply for the Dzaleka Homestay Program?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "For stays during the Tumaini Festival, applications are completed online through the Tumaini Letu website. Early booking is recommended as spots are limited. For other dates, email dzalekahomestay@gmail.com."
                    }
                }
            ]
        }
    ]
};

export default function ThingsToDo() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Things to Do | Cultural Experiences in Dzaleka"
                description="Explore guided tours, arts, markets, and cultural experiences in Dzaleka Refugee Camp. Book your visit and support the local community."
                keywords="things to do Dzaleka, Dzaleka tours, arts and crafts Dzaleka, cultural exchange Malawi, visit Dzaleka market"
                canonical="https://visit.dzaleka.com/things-to-do"
                ogImage="https://tumainiletu.org/wp-content/uploads/2021/07/Website-Entrepreneurship-and-innovation-2048x1536.jpg"
            />

            {/* Structured Data JSON-LD for Google Things to do */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            {/* Header - Reused from Landing */}
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
                                    <Link href="/things-to-do/nature-outdoors" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Nature & Outdoors</Link>
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
                        <Link href="/things-to-do/arts-culture" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Arts & Culture</Link>
                        <Link href="/things-to-do/shopping" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Shopping & Markets</Link>
                        <Link href="/things-to-do/nature-outdoors" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Nature & Outdoors</Link>
                        <Link href="/things-to-do/dining-nightlife" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Dining & Nightlife</Link>
                        <Link href="/things-to-do/sports-recreation" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Sports & Recreation</Link>
                        <Link href="/things-to-do/host-community" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Host Community</Link>
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
                {/* Hero Section */}
                <div className="relative py-24 overflow-hidden">
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: 'url(https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhQC52NEfamRlqaUT7uLWcP8ZKNUDp3_opelPFqoO6E5hyphenhyphen09lp-zxRXXig5aEnaH3PbRsia1ciM8y-vOdzDe9RMvbQApON7rdM0SrBmtVVWAPIzmiId-jvcwSa46-Y-qRApCBTmozhIbWhNZWxcLFY3bp6Q4uNk_LFB5MpYFlXywwX7vYlUQeRoirJWm50/s16000-rw/533061219_1079243081018233_5344782622295089839_n.jpg)' }}
                    />
                    <div className="absolute inset-0 bg-black/60" />

                    <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-white/30 bg-white/10 text-white rounded-full uppercase tracking-widest font-semibold flex items-center justify-center w-fit mx-auto backdrop-blur-sm">
                            <Globe className="mr-2 h-3.5 w-3.5" />
                            Explore & Experience
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-white">
                            Things to do in Dzaleka
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
                            Dzaleka Refugee Camp offers unique opportunities for cultural immersion and community engagement. Visitors can participate in guided tours, attend the annual Tumaini Festival, and support local, refugee-led businesses and art projects.
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-16 space-y-24">
                    {/* Section 1: Guided Tours */}
                    <section className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-2 md:order-1 relative">
                            <div className="aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-muted">
                                <img
                                    src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhQC52NEfamRlqaUT7uLWcP8ZKNUDp3_opelPFqoO6E5hyphenhyphen09lp-zxRXXig5aEnaH3PbRsia1ciM8y-vOdzDe9RMvbQApON7rdM0SrBmtVVWAPIzmiId-jvcwSa46-Y-qRApCBTmozhIbWhNZWxcLFY3bp6Q4uNk_LFB5MpYFlXywwX7vYlUQeRoirJWm50/s16000-rw/533061219_1079243081018233_5344782622295089839_n.jpg"
                                    alt="Guided Tour in Dzaleka"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-6 -right-6 -z-10 w-full h-full border-2 border-primary/10 rounded-2xl" />
                        </div>
                        <div className="order-1 md:order-2 space-y-6">
                            <div className="flex items-center gap-3 text-primary font-semibold">
                                <MapPin className="h-5 w-5" />
                                <span>Cultural Exchange</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight">Guided Tours & Cultural Exchange</h2>
                            <p className="text-muted-foreground text-lg">
                                The most recommended way to experience Dzaleka is through a local, guided tour arranged via our booking portal.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <Globe className="h-5 w-5 text-primary shrink-0 mt-1" />
                                    <div>
                                        <span className="font-semibold block text-foreground">Explore diverse zones</span>
                                        <span className="text-muted-foreground">Guides can take you through different areas of the camp, each with its own character and residents from various countries like the DRC, Burundi, and Rwanda.</span>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <BookOpen className="h-5 w-5 text-primary shrink-0 mt-1" />
                                    <div>
                                        <span className="font-semibold block text-foreground">Learn the history</span>
                                        <span className="text-muted-foreground">Gain insight into the camp's history and the daily lives and challenges of its over 50,000 residents.</span>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <Users className="h-5 w-5 text-primary shrink-0 mt-1" />
                                    <div>
                                        <span className="font-semibold block text-foreground">Interact with residents</span>
                                        <span className="text-muted-foreground">Tours often include opportunities to talk with community members and ask questions about their experiences and initiatives.</span>
                                    </div>
                                </li>
                            </ul>
                            <Button asChild size="lg" className="mt-4">
                                <Link href="/login">Book a Tour</Link>
                            </Button>
                        </div>
                    </section>

                    {/* Tour Options - Explicit Inventory for Google Ads Compliance */}
                    <section className="space-y-12">
                        <div className="text-center max-w-3xl mx-auto">
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Tour Options</h2>
                            <p className="text-muted-foreground text-lg">
                                Choose the experience that fits your group size and interests. All tours are led by certified local guides.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Individual */}
                            <Card id="individual" className="flex flex-col h-full border-muted shadow-lg hover:shadow-xl transition-shadow scroll-mt-24">
                                <CardContent className="p-6 flex flex-col h-full">
                                    <Badge className="w-fit mb-4" variant="secondary">Popular</Badge>
                                    <h3 className="text-xl font-bold mb-2">Individual</h3>
                                    <p className="text-muted-foreground text-sm mb-4 flex-grow">
                                        A personal, one-on-one cultural immersion tailored to your interests. Connect deeply with your guide at your own pace.
                                    </p>
                                    <div className="mt-auto pt-4 border-t">
                                        <div className="flex items-baseline gap-1 mb-4">
                                            <span className="text-2xl font-bold">MWK 15,000</span>
                                            <span className="text-muted-foreground text-sm">/ person</span>
                                        </div>
                                        <Button asChild className="w-full">
                                            <Link href="/login">Book Individual</Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Small Group */}
                            <Card id="small-group" className="flex flex-col h-full border-muted shadow-lg hover:shadow-xl transition-shadow scroll-mt-24">
                                <CardContent className="p-6 flex flex-col h-full">
                                    <Badge className="w-fit mb-4 bg-primary/10 text-primary hover:bg-primary/20">Best Value</Badge>
                                    <h3 className="text-xl font-bold mb-2">Small Group</h3>
                                    <p className="text-muted-foreground text-sm mb-4 flex-grow">
                                        Perfect for couples or small families (2-5 people) seeking an intimate, interactive experience.
                                    </p>
                                    <div className="mt-auto pt-4 border-t">
                                        <div className="flex items-baseline gap-1 mb-4">
                                            <span className="text-2xl font-bold">MWK 50,000</span>
                                            <span className="text-muted-foreground text-sm">/ group</span>
                                        </div>
                                        <Button asChild className="w-full">
                                            <Link href="/login">Book Small Group</Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Medium Group */}
                            <Card id="medium-group" className="flex flex-col h-full border-muted shadow-lg hover:shadow-xl transition-shadow scroll-mt-24">
                                <CardContent className="p-6 flex flex-col h-full">
                                    <Badge className="w-fit mb-4" variant="outline">Groups</Badge>
                                    <h3 className="text-xl font-bold mb-2">Medium Group</h3>
                                    <p className="text-muted-foreground text-sm mb-4 flex-grow">
                                        Ideal for extended families, friend groups, or small teams (6-10 people). A balanced experience ensuring everyone engages.
                                    </p>
                                    <div className="mt-auto pt-4 border-t">
                                        <div className="flex items-baseline gap-1 mb-4">
                                            <span className="text-2xl font-bold">MWK 80,000</span>
                                            <span className="text-muted-foreground text-sm">/ group</span>
                                        </div>
                                        <Button asChild className="w-full">
                                            <Link href="/login">Book Medium Group</Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Large Group */}
                            <Card id="large-group" className="flex flex-col h-full border-muted shadow-lg hover:shadow-xl transition-shadow scroll-mt-24">
                                <CardContent className="p-6 flex flex-col h-full">
                                    <Badge className="w-fit mb-4" variant="outline">Educational</Badge>
                                    <h3 className="text-xl font-bold mb-2">Large Group</h3>
                                    <p className="text-muted-foreground text-sm mb-4 flex-grow">
                                        Designed for schools, organizations, or delegations (10+ people). Includes dedicated logistics and multiple guides.
                                    </p>
                                    <div className="mt-auto pt-4 border-t">
                                        <div className="flex items-baseline gap-1 mb-4">
                                            <span className="text-2xl font-bold">MWK 100,000</span>
                                            <span className="text-muted-foreground text-sm">/ group</span>
                                        </div>
                                        <Button asChild className="w-full">
                                            <Link href="/login">Book Large Group</Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Section 2: Arts & Entrepreneurship */}
                    <section className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-primary font-semibold">
                                <Camera className="h-5 w-5" />
                                <span>Creativity & Innovation</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight">Arts and Entrepreneurship</h2>
                            <p className="text-muted-foreground text-lg">
                                Dzaleka has a thriving arts scene and a micro-economy driven by resilient entrepreneurs.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                                    <div>
                                        <span className="font-semibold text-foreground">Visit local markets:</span>
                                        <span className="text-muted-foreground ml-1">Explore the various small businesses, food stalls (such as King's Chapati), and craft markets offering unique goods and international cuisine.</span>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                                    <div>
                                        <span className="font-semibold text-foreground">Discover art projects:</span>
                                        <span className="text-muted-foreground ml-1">Engage with the Dzaleka Art Project to see paintings, murals, music production, dance, and theater performances by local artists.</span>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                                    <div>
                                        <span className="font-semibold text-foreground">Learn new skills:</span>
                                        <span className="text-muted-foreground ml-1">Organizations like TakenoLAB and There Is Hope Malawi offer educational and vocational training in areas like IT, tailoring, and farming. Visitors may be able to see these programs in action.</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-muted">
                                <img
                                    src="https://tumainiletu.org/wp-content/uploads/2021/07/Website-Entrepreneurship-and-innovation-2048x1536.jpg"
                                    alt="Arts and Crafts in Dzaleka"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -top-6 -left-6 -z-10 w-full h-full border-2 border-primary/10 rounded-2xl" />
                        </div>
                    </section>

                    {/* Section 3: Events & Recreation */}
                    <div className="bg-primary/5 rounded-3xl p-8 md:p-12">
                        <div className="text-center max-w-3xl mx-auto mb-12">
                            <div className="flex items-center justify-center gap-3 text-primary font-semibold mb-4">
                                <Music className="h-5 w-5" />
                                <span>Community Life</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Events and Recreation</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <Card className="bg-background border-none shadow-md">
                                <CardContent className="p-6">
                                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                        Tumaini Festival
                                    </h3>
                                    <p className="text-muted-foreground">
                                        If visiting in late October or early November, attending the free annual Tumaini Festival is a highlight. It features international and local music, dance, poetry, and theater performances that promote peaceful coexistence.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-background border-none shadow-md">
                                <CardContent className="p-6">
                                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                        <div className="h-5 w-5 rounded-full border-2 border-foreground flex items-center justify-center text-[10px] font-bold">⚽</div>
                                        Sports
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Football and volleyball are popular recreational activities. On weekends, community members often gather to watch games, providing a lively atmosphere for interaction.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Section 4: Accommodation */}
                    <section className="text-center max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold tracking-tight mb-6">Accommodation</h2>
                        <Card className="bg-primary text-primary-foreground overflow-hidden">
                            <div className="md:flex">
                                <div className="md:w-1/3 bg-black/20 relative min-h-[200px]">
                                    <img
                                        src="https://tumainiletu.org/wp-content/uploads/2024/10/Dzaleka_107-min.jpg"
                                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
                                        alt="Homestay"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-4xl font-bold text-white/90">🏡</span>
                                    </div>
                                </div>
                                <div className="md:w-2/3 p-8 text-left">
                                    <h3 className="text-2xl font-bold mb-2">Tumaini Letu Homestay Program</h3>
                                    <p className="text-primary-foreground/90 mb-6 text-lg">
                                        For an immersive stay, consider the Tumaini Letu Homestay Program. This allows you to stay with a vetted local family, directly contributing to their income and fostering a deeper cultural exchange.
                                    </p>
                                    <Button asChild variant="secondary" size="lg">
                                        <a href="https://tumainiletu.org/the-dzaleka-homestay-program/" target="_blank" rel="noopener noreferrer">
                                            Learn More & Book Stay <ArrowRight className="ml-2 h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </section>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
