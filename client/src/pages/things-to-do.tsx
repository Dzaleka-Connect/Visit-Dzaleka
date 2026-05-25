
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ArrowRight, Menu, X, Globe, Calendar, Users, Camera, Music, BookOpen, Star } from "lucide-react";
import { useState } from "react";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { PublicHeader } from "@/components/public-header";

const guidedTourPath = "/things-to-do/dzaleka-refugee-camp-guided-walking-tour";
const guidedTourOptionsPath = `${guidedTourPath}#tour-options`;
const guidedTourUrl = "https://visit.dzaleka.com/things-to-do/dzaleka-refugee-camp-guided-walking-tour";

const experienceCategories = [
    {
        title: "Guided Walking Tour",
        href: guidedTourPath,
        description: "Resident-led cultural route through camp zones, markets, and community spaces.",
        icon: MapPin,
    },
    {
        title: "Arts & Culture",
        href: "/things-to-do/arts-culture",
        description: "Creative spaces, music, craft, performance, and cultural storytelling.",
        icon: Music,
    },
    {
        title: "Shopping & Markets",
        href: "/things-to-do/shopping",
        description: "Community markets, small businesses, local makers, and everyday trade.",
        icon: Camera,
    },
    {
        title: "Nature & Outdoors",
        href: "/things-to-do/nature-outdoors",
        description: "Outdoor routes, green edges, sport spaces, and slower ways to explore.",
        icon: Globe,
    },
    {
        title: "Dining & Nightlife",
        href: "/things-to-do/dining-nightlife",
        description: "Food spots, cafes, evening activity, and informal community gathering places.",
        icon: Star,
    },
    {
        title: "Sports & Recreation",
        href: "/things-to-do/sports-recreation",
        description: "Football, youth recreation, competitions, and active community events.",
        icon: Users,
    },
    {
        title: "Host Community",
        href: "/things-to-do/host-community",
        description: "Experiences connecting Dzaleka visitors with surrounding host communities.",
        icon: BookOpen,
    },
];

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
        // Main local business entity for Google-friendly structured data
        {
            "@type": "LocalBusiness",
            "@id": "https://visit.dzaleka.com/things-to-do#attraction",
            "additionalType": "https://schema.org/TouristAttraction",
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
                "url": guidedTourUrl
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
                "url": guidedTourUrl
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
                "url": guidedTourUrl
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
                "url": guidedTourUrl
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
            <PublicHeader activePath="/things-to-do" />

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
                            Plan a respectful visit with resident guides, community markets, cultural events, and local projects. Each experience is shaped by availability, consent, and direct community benefit.
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-16 space-y-24">
                    <section className="space-y-8">
                        <div className="max-w-3xl">
                            <h2 className="text-3xl font-bold tracking-tight">Explore by category</h2>
                            <p className="mt-3 text-muted-foreground text-lg">
                                Use these sections to find the kind of visit you want to plan, from guided cultural routes to food, markets, outdoor spaces, and community connections.
                            </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {experienceCategories.map((category) => (
                                <Link key={category.href} href={category.href}>
                                    <Card className="h-full transition-shadow hover:shadow-md">
                                        <CardContent className="flex h-full flex-col gap-4 p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                                    <category.icon className="h-5 w-5" />
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{category.title}</h3>
                                                <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>

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
                                The clearest way to visit Dzaleka is with a resident guide who can explain context, coordinate access, and help visitors follow community expectations.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <Globe className="h-5 w-5 text-primary shrink-0 mt-1" />
                                    <div>
                                        <span className="font-semibold block text-foreground">Explore diverse zones</span>
                                        <span className="text-muted-foreground">Guides can take you through selected areas of the camp, depending on safety guidance, timing, and community availability.</span>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <BookOpen className="h-5 w-5 text-primary shrink-0 mt-1" />
                                    <div>
                                        <span className="font-semibold block text-foreground">Learn the history</span>
                                        <span className="text-muted-foreground">Learn how Dzaleka was established, how the settlement has changed, and how residents organize daily life today.</span>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <Users className="h-5 w-5 text-primary shrink-0 mt-1" />
                                    <div>
                                        <span className="font-semibold block text-foreground">Meet community projects</span>
                                        <span className="text-muted-foreground">When available, tours may include conversations with artists, traders, educators, or entrepreneurs connected to the route.</span>
                                    </div>
                                </li>
                            </ul>
                            <Button asChild size="lg" className="mt-4">
                                <Link href={guidedTourPath}>View Tour Listing</Link>
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
                                            <Link href={guidedTourOptionsPath}>View Individual Option</Link>
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
                                            <Link href={guidedTourOptionsPath}>View Small Group Option</Link>
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
                                            <Link href={guidedTourOptionsPath}>View Medium Group Option</Link>
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
                                            <Link href={guidedTourOptionsPath}>View Large Group Option</Link>
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
                                        <span className="text-muted-foreground ml-1">Education, vocational training, technology, arts, and community organizations operate across Dzaleka. Visitors may be able to learn from selected projects when visits are arranged in advance.</span>
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
