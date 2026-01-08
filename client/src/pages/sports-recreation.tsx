import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Menu, X, Rocket, Users, Target, Activity, Heart, Shield, Calendar, MapPin } from "lucide-react";
import { useState } from "react";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";

export default function SportsRecreation() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const sportsPrograms = [
        {
            icon: Trophy,
            title: "Football (Soccer)",
            description: "The most popular sport with ~15 teams. Dzaleka Future FC competes in the Central Region District Football League.",
        },
        {
            icon: Users,
            title: "Dzaleka Sports Association",
            description: "Coordinates athletic activities and youth tournaments during school holidays to promote responsible behavior.",
        },
        {
            icon: Activity,
            title: "Basketball",
            description: "Partnering with NBA Africa & CorpsAfrica, the 'Dream Team' trains on a specialized court aiming for national leagues.",
        },
        {
            icon: Shield,
            title: "Martial Arts",
            description: "The 'Judo for Peace' program teaches discipline and values, helping young judokas overcome daily challenges.",
        }
    ];

    const recreationActivities = [
        {
            icon: Target,
            title: "Scouting",
            description: "Volunteer-led groups providing leadership training and resilience-building in a structured, fun environment.",
        },
        {
            icon: Rocket,
            title: "Track and Field",
            description: "The 'Breaking Down Barriers' project (with UNHCR) is the first dedicated track & field initiative for young refugees.",
        },
        {
            icon: Heart,
            title: "Recreational Tournaments",
            description: "Weekend football and volleyball matches provide an essential social escape and community bonding.",
        }
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Sports & Recreation in Dzaleka"
                description="Sports in Dzaleka foster unity and empowering youth. From Dzaleka Future FC to basketball and Judo for Peace, discover the vibrant sports culture."
                keywords="Dzaleka sports, refugee football team, Dzaleka Future FC, Judo for Peace, NBA Africa Dzaleka, scouting in refugee camps, sports for development"
                canonical="https://visit.dzaleka.com/things-to-do/sports-recreation"
                ogImage="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj7jE_sKQ_YlG2gJq66kEsqq7fT4v7uO_QeL-2hWp6cZq9_XlJ0yK0qE1pW5nQ4z3k7rT9vXlJ0yK0qE1pW5nQ4z3k7rT9vXlJ0yK0qE1pW5nQ4z3k7rT9vXlJ0/s1600/sports.jpg"
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
                        <div className="relative group">
                            <button className="text-sm font-medium text-primary transition-colors flex items-center gap-1">
                                Things To Do
                                <svg className="h-3 w-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div className="absolute left-0 top-full mt-1 w-48 rounded-md border bg-background shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                <div className="py-1">
                                    <Link href="/things-to-do" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">All Experiences</Link>
                                    <Link href="/things-to-do/arts-culture" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Arts & Culture</Link>
                                    <Link href="/things-to-do/shopping" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Shopping & Markets</Link>
                                    <Link href="/things-to-do/sports-recreation" className="block px-4 py-2 text-sm bg-muted/50 text-primary font-medium">Sports & Recreation</Link>
                                    <Link href="/things-to-do/host-community" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Host Community</Link>
                                </div>
                            </div>
                        </div>
                        <Link href="/accommodation" className="text-sm font-medium hover:text-primary transition-colors">Accommodation</Link>
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
                        <Link href="/things-to-do" className="block text-sm font-medium py-1 text-primary" onClick={() => setMobileMenuOpen(false)}>Things To Do</Link>
                        <Link href="/things-to-do/arts-culture" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Arts & Culture</Link>
                        <Link href="/things-to-do/shopping" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Shopping & Markets</Link>
                        <Link href="/things-to-do/sports-recreation" className="block text-sm font-medium py-1 pl-4 text-primary" onClick={() => setMobileMenuOpen(false)}>↳ Sports & Recreation</Link>
                        <Link href="/things-to-do/host-community" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Host Community</Link>
                        <Link href="/accommodation" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Accommodation</Link>
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
                {/* Hero Section */}
                <div className="relative py-24 overflow-hidden">
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: 'url(https://images.squarespace-cdn.com/content/v1/6218c0b66ea9365b6e572281/6e8bbcfe-8c40-4111-b4c1-d71aba4937dc/Malawi+-+UNHCR+-+Pat+B47-min.jpg?format=1500w)' }}
                    />
                    <div className="absolute inset-0 bg-black/60" />

                    <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-white/30 bg-white/10 text-white rounded-full uppercase tracking-widest font-semibold flex items-center justify-center w-fit mx-auto backdrop-blur-sm">
                            <Trophy className="mr-2 h-3.5 w-3.5" />
                            Youth Empowerment
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-white">
                            Sports & Recreation
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
                            More than a pastime, sports in Dzaleka build mental health, social inclusion, and peace. Discover how the community unites through play.
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-16 space-y-24">

                    {/* Intro */}
                    <section className="max-w-3xl mx-auto text-center">
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Sports and recreation are central to community unity in Dzaleka. They serve as a vital tool for fostering peace between diverse nationalities and empowering the next generation.
                        </p>
                    </section>

                    {/* Sports Programs Grid */}
                    <section>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Sports Programs & Organizations</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                From local leagues to international partnerships, these programs drive talent and discipline.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {sportsPrograms.map((item, index) => (
                                <Card key={index} className="overflow-hidden hover:shadow-lg transition-all border-none bg-muted/30">
                                    <CardContent className="p-6 text-center">
                                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                            <item.icon className="h-7 w-7 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                                        <p className="text-muted-foreground text-sm">{item.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Recreation & Adventure Section */}
                    <section className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-2 md:order-1 space-y-6">
                            <div className="flex items-center gap-3 text-primary font-semibold">
                                <Rocket className="h-5 w-5" />
                                <span>Active Living</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight">Recreational Activities</h2>
                            <p className="text-muted-foreground text-lg">
                                Beyond competitive sports, these initiatives build leadership and provide essential social outlets.
                            </p>
                            <div className="space-y-4">
                                {recreationActivities.map((activity, idx) => (
                                    <div key={idx} className="flex gap-4 items-start p-4 rounded-lg bg-background border shadow-sm">
                                        <activity.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-semibold block text-foreground">{activity.title}</span>
                                            <span className="text-muted-foreground text-sm">{activity.description}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="order-1 md:order-2 relative">
                            <div className="aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-muted">
                                <img
                                    src="https://images.squarespace-cdn.com/content/v1/6218c0b66ea9365b6e572281/6e8bbcfe-8c40-4111-b4c1-d71aba4937dc/Malawi+-+UNHCR+-+Pat+B47-min.jpg?format=1500w"
                                    alt="Football match in Dzaleka"
                                    className="w-full h-full object-cover"
                                />
                                {/* Placeholder logic for demonstration - ideally user provides specific image or uses generated one */}
                            </div>
                            <div className="absolute -bottom-6 -left-6 -z-10 w-full h-full border-2 border-primary/10 rounded-2xl" />
                        </div>
                    </section>

                    {/* Visitor Participation */}
                    <section className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-12 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight mb-4">Join the Energy</h2>
                                <p className="text-lg text-primary-foreground/90 mb-6">
                                    Visitors are encouraged to engage with these activities. It's one of the best ways to experience the camp's spirit and support the community.
                                </p>
                                <div className="flex flex-col gap-4 sm:flex-row">
                                    <Button asChild size="lg" variant="secondary" className="font-bold text-primary">
                                        <Link href="/contact">Contact to Visit</Link>
                                    </Button>
                                    <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground">
                                        <Link href="/plan-your-trip">Plan Your Trip</Link>
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex gap-4 items-start">
                                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Attend Matches</h4>
                                        <p className="text-primary-foreground/80">Watching weekend football tournaments is an electrifying experience.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Hire Local Guides</h4>
                                        <p className="text-primary-foreground/80">Book a tour to navigate safely and find current sports schedules.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                        <Heart className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Support Local Teams</h4>
                                        <p className="text-primary-foreground/80">Many teams rely on donations for kits and equipment. Your support goes a long way.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
