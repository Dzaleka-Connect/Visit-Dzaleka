import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, MapPin, Menu, X, ExternalLink, Clock, Tag, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";

interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    endDate?: string;
    location: string;
    category: string;
    featured: boolean;
    image: string;
    organizer: string;
    status: "past" | "upcoming";
    contact?: {
        email?: string;
        phone?: string;
        whatsapp?: string;
    };
    registration?: {
        required: boolean;
        url?: string;
        deadline?: string;
    };
    tags: string[];
}

interface EventsResponse {
    status: string;
    count: number;
    data: {
        events: Event[];
    };
}

const ITEMS_PER_PAGE = 6;

export default function WhatsOn() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const { data, isLoading, error } = useQuery<EventsResponse>({
        queryKey: ["events"],
        queryFn: async () => {
            const res = await fetch("https://services.dzaleka.com/api/events");
            if (!res.ok) {
                throw new Error("Failed to fetch events");
            }
            return res.json();
        },
    });

    const events = data?.data?.events || [];

    // Filter and sort events
    const upcomingEvents = events
        .filter(event => event.status === "upcoming")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const allPastEvents = events
        .filter(event => event.status === "past")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest past events first

    // Pagination logic for past events
    const totalPages = Math.ceil(allPastEvents.length / ITEMS_PER_PAGE);
    const paginatedPastEvents = allPastEvents.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Scroll to the top of the past events section
        const element = document.getElementById('past-events');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Generate schema.org Event structured data dynamically
    const structuredData = useMemo(() => {
        if (!events.length) return null;

        const eventSchemas = events.map((event) => ({
            "@type": "Event",
            "@id": `https://visit.dzaleka.com/whats-on#event-${event.id}`,
            "name": event.title,
            "description": event.description,
            "startDate": event.date,
            ...(event.endDate && { "endDate": event.endDate }),
            "eventStatus": event.status === "upcoming"
                ? "https://schema.org/EventScheduled"
                : "https://schema.org/EventPostponed",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "location": {
                "@type": "Place",
                "name": event.location,
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
            ...(event.image && {
                "image": event.image.startsWith('/')
                    ? `https://services.dzaleka.com${event.image}`
                    : event.image
            }),
            "organizer": {
                "@type": "Organization",
                "name": event.organizer || "Dzaleka Online Services",
                "url": "https://visit.dzaleka.com"
            },
            ...(event.registration?.url && {
                "offers": {
                    "@type": "Offer",
                    "url": event.registration.url,
                    "availability": event.status === "upcoming"
                        ? "https://schema.org/InStock"
                        : "https://schema.org/SoldOut"
                }
            }),
            ...(event.tags?.length && { "keywords": event.tags.join(", ") })
        }));

        return {
            "@context": "https://schema.org",
            "@graph": [
                // Organization
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
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "Home",
                            "item": "https://visit.dzaleka.com"
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": "What's On",
                            "item": "https://visit.dzaleka.com/whats-on"
                        }
                    ]
                },
                // ItemList for upcoming events (helps with rich results)
                ...(upcomingEvents.length > 0 ? [{
                    "@type": "ItemList",
                    "name": "Upcoming Events in Dzaleka",
                    "itemListElement": upcomingEvents.map((event, index) => ({
                        "@type": "ListItem",
                        "position": index + 1,
                        "item": {
                            "@type": "Event",
                            "@id": `https://visit.dzaleka.com/whats-on#event-${event.id}`,
                            "name": event.title,
                            "startDate": event.date,
                            "location": {
                                "@type": "Place",
                                "name": event.location
                            }
                        }
                    }))
                }] : []),
                // All individual events
                ...eventSchemas
            ]
        };
    }, [events, upcomingEvents]);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="What's On | Events in Dzaleka Refugee Camp"
                description="Discover upcoming events, festivals, and cultural activities in Dzaleka Refugee Camp. From the famous Tumaini Festival to local sports and art exhibitions."
                keywords="Dzaleka events, Tumaini Festival, Dzaleka culture, refugee camp events, Malawi events, cultural festival Dzaleka"
                canonical="https://visit.dzaleka.com/whats-on"
                ogImage="https://tumainiletu.org/wp-content/uploads/2024/10/9L1A6757-1.jpg"
            />

            {/* Schema.org Event Structured Data */}
            {structuredData && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />
            )}
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
                        <Link href="/whats-on" className="text-sm font-medium text-primary transition-colors">What's On</Link>
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
                        <Link href="/whats-on" className="block text-sm font-medium py-1 text-primary" onClick={() => setMobileMenuOpen(false)}>What's On</Link>
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
                            <Calendar className="mr-2 h-3.5 w-3.5" />
                            Events & Culture
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                            What's On
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            Dzaleka has an epic line-up of major sporting and cultural events & we’ve saved you a seat!
                        </p>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl -z-10" />
                </div>

                <div className="container mx-auto px-4 py-12">
                    {isLoading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-[400px] rounded-xl bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <h3 className="text-xl font-semibold mb-2">Could not load events</h3>
                            <p className="text-muted-foreground">Please try again later.</p>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {/* Upcoming Events */}
                            <section>
                                <div className="flex items-center gap-2 mb-8">
                                    <div className="h-8 w-1 bg-primary rounded-full" />
                                    <h2 className="text-2xl font-bold">Upcoming Events</h2>
                                </div>

                                {upcomingEvents.length > 0 ? (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {upcomingEvents.map((event) => (
                                            <EventCard key={event.id} event={event} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="md:col-span-3">
                                        <Card className="bg-primary/5 border-primary/20 text-center">
                                            <CardContent className="flex flex-col items-center justify-center p-8 md:p-12">
                                                <Lightbulb className="h-10 w-10 text-primary mb-4" />
                                                <h3 className="text-xl font-semibold mb-2">No upcoming events at the moment – check back soon!</h3>
                                                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                                                    There's always something happening in Dzaleka Refugee Camp. If you're organizing an event, workshop, or community gathering, share it with us and we'll help spread the word.
                                                </p>
                                                <Button asChild size="lg">
                                                    <a href="https://services.dzaleka.com/events/organize" target="_blank" rel="noopener noreferrer">
                                                        Submit Event
                                                    </a>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </section>

                            {/* Past Events */}
                            {allPastEvents.length > 0 && (
                                <section id="past-events">
                                    <div className="flex items-center gap-2 mb-8">
                                        <div className="h-8 w-1 bg-muted-foreground rounded-full" />
                                        <h2 className="text-2xl font-bold text-muted-foreground">Past Events</h2>
                                    </div>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-75 grayscale-[0.3] hover:grayscale-0 transition-all duration-500 mb-8">
                                        {paginatedPastEvents.map((event) => (
                                            <EventCard key={event.id} event={event} />
                                        ))}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center items-center gap-2 mt-8">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>

                                            <div className="flex items-center gap-1 mx-2">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                    <Button
                                                        key={page}
                                                        variant={currentPage === page ? "default" : "ghost"}
                                                        size="sm"
                                                        className="w-8 h-8 p-0"
                                                        onClick={() => handlePageChange(page)}
                                                    >
                                                        {page}
                                                    </Button>
                                                ))}
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}

function EventCard({ event }: { event: Event }) {
    const isPast = event.status === "past";

    return (
        <Card className="flex flex-col overflow-hidden h-full hover:shadow-lg transition-all duration-300 group">
            <div className="relative aspect-video overflow-hidden bg-muted">
                {event.image ? (
                    <img
                        src={event.image.startsWith('/') ? `https://services.dzaleka.com${event.image}` : event.image}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://services.dzaleka.com/images/dzaleka-digital-heritage.png";
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/20">
                        <Calendar className="h-12 w-12" />
                    </div>
                )}
                <div className="absolute top-4 left-4">
                    <Badge variant={isPast ? "secondary" : "default"} className="uppercase text-[10px] font-bold tracking-wider">
                        {event.category}
                    </Badge>
                </div>
            </div>

            <CardHeader className="pb-2">
                <div className="flex items-center text-xs text-muted-foreground mb-2 gap-2">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>
                        {format(new Date(event.date), "EEE, MMM d, yyyy • h:mm a")}
                    </span>
                </div>
                <CardTitle className="line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {event.title}
                </CardTitle>
                <div className="flex items-center text-xs text-muted-foreground mt-2 gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{event.location}</span>
                </div>
            </CardHeader>

            <CardContent className="flex-1 pb-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {event.description}
                </p>

                {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                        {event.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                                <Tag className="mr-1 h-2.5 w-2.5" />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-0">
                {event.registration?.url ? (
                    <Button asChild className="w-full gap-2" variant={isPast ? "outline" : "default"} disabled={isPast}>
                        <a href={event.registration.url} target="_blank" rel="noopener noreferrer">
                            {isPast ? "Event Ended" : "Register / Details"}
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </Button>
                ) : (
                    <Button className="w-full" variant="outline" disabled>
                        {isPast ? "Event Ended" : "No Registration Required"}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
