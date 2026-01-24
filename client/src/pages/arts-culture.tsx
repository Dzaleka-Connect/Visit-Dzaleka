import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Palette, ArrowRight, Menu, X, Music, Camera, Mic2, Sparkles, Users, Radio, ExternalLink, Calendar } from "lucide-react";
import { useState } from "react";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";

export default function ArtsCulture() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const highlights = [
        {
            icon: Calendar,
            title: "Tumaini Festival",
            description: "The first large-scale international arts festival held within a refugee camp, established in 2014 by refugee poet Menes La Plume.",
            link: "https://tumainiletu.org/"
        },
        {
            icon: Palette,
            title: "Dzaleka Art Project",
            description: "A community-led initiative using visual arts to tell the stories of residents through murals, street art, and personal archives.",
            link: "https://www.dzalekaartproject.com/"
        },
        {
            icon: Sparkles,
            title: "Fashion in the Dust",
            description: "Local designers host runway shows featuring custom clothing made from vibrant African prints by skilled tailors.",
            link: null
        },
        {
            icon: Music,
            title: "Music & Performance",
            description: "Refugee-run studios produce Afro-pop, Reggae, Gospel, and traditional folk music. Dance troupes keep cultural heritage alive.",
            link: null
        }
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Arts, Culture & Creativity"
                description="Discover Dzaleka's vibrant arts scene. From the Tumaini Festival to murals, fashion shows, and music studios - experience African creativity at its finest."
                keywords="Dzaleka arts, Tumaini Festival, Dzaleka Art Project, African culture, refugee artists, Fashion in the Dust, Menes La Plume"
                canonical="https://visit.dzaleka.com/things-to-do/arts-culture"
                ogImage="https://tumainiletu.org/wp-content/uploads/2024/10/9L1A6757-1.jpg"
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
                                    <Link href="/things-to-do/arts-culture" className="block px-4 py-2 text-sm bg-muted/50 text-primary font-medium">Arts & Culture</Link>
                                    <Link href="/things-to-do/shopping" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Shopping & Markets</Link>
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
                        <Link href="/things-to-do" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Things To Do</Link>
                        <Link href="/things-to-do/arts-culture" className="block text-sm font-medium py-1 text-primary" onClick={() => setMobileMenuOpen(false)}>Arts & Culture</Link>
                        <Link href="/things-to-do/shopping" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Shopping & Markets</Link>
                        <Link href="/things-to-do/sports-recreation" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Sports & Recreation</Link>
                        <Link href="/things-to-do/host-community" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Host Community</Link>
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
                        style={{ backgroundImage: 'url(https://tumainiletu.org/wp-content/uploads/2024/10/Badre_Bahaji_Tumaini_festival21_-31-1.jpg)' }}
                    />
                    <div className="absolute inset-0 bg-black/60" />

                    <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-white/30 bg-white/10 text-white rounded-full uppercase tracking-widest font-semibold flex items-center justify-center w-fit mx-auto backdrop-blur-sm">
                            <Palette className="mr-2 h-3.5 w-3.5" />
                            Arts & Culture
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-white">
                            Arts, Culture & Creativity in Dzaleka
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
                            Dzaleka is far more than a place of refuge; it is a thriving cultural capital in Malawi. Home to artists, musicians, and innovators from across Africa.
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-16 space-y-24">

                    {/* Intro */}
                    <section className="max-w-3xl mx-auto text-center">
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            When you visit Dzaleka, you aren't just seeing a camp—you are entering a vibrant hub of creative expression. The community includes talented individuals from the Democratic Republic of Congo, Burundi, Rwanda, and beyond.
                        </p>
                    </section>

                    {/* Highlights Grid */}
                    <section>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Cultural Highlights</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                From world-class festivals to grassroots art projects, Dzaleka offers a rich tapestry of creative experiences.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                            {highlights.map((item, index) => (
                                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <item.icon className="h-6 w-6 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                                <p className="text-muted-foreground mb-4">{item.description}</p>
                                                {item.link && (
                                                    <Button asChild variant="outline" size="sm">
                                                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                                                            Learn More <ExternalLink className="ml-2 h-3.5 w-3.5" />
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Tumaini Festival Section */}
                    <section className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="relative">
                            <div className="aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-muted">
                                <img
                                    src="https://tumainiletu.org/wp-content/uploads/2024/10/9L1A6757-1.jpg"
                                    alt="Tumaini Festival Performance"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-6 -right-6 -z-10 w-full h-full border-2 border-primary/10 rounded-2xl" />
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-primary font-semibold">
                                <Calendar className="h-5 w-5" />
                                <span>Annual Event</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight">The Tumaini Festival</h2>
                            <p className="text-muted-foreground text-lg">
                                The crown jewel of Dzaleka's cultural calendar. Established in 2014 by refugee poet Menes La Plume, it is the first large-scale international arts festival held within a refugee camp.
                            </p>
                            <div className="space-y-4">
                                <div className="flex gap-4 items-start p-4 rounded-lg bg-muted/50">
                                    <Music className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold block text-foreground">The Experience</span>
                                        <span className="text-muted-foreground">For three days, the camp transforms into a massive stage for music, traditional dance, theater, and poetry.</span>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start p-4 rounded-lg bg-muted/50">
                                    <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold block text-foreground">The Impact</span>
                                        <span className="text-muted-foreground">It brings together thousands of visitors and hundreds of performers, proving that art has no borders.</span>
                                    </div>
                                </div>
                            </div>
                            <Button asChild size="lg">
                                <a href="https://tumainiletu.org/" target="_blank" rel="noopener noreferrer">
                                    Visit Festival Website <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    </section>

                    {/* Art Project Section */}
                    <section className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-2 md:order-1 space-y-6">
                            <div className="flex items-center gap-3 text-primary font-semibold">
                                <Palette className="h-5 w-5" />
                                <span>Visual Arts</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight">Dzaleka Art Project</h2>
                            <p className="text-muted-foreground text-lg">
                                For year-round creativity, the Dzaleka Art Project is a must-visit. This community-led initiative uses visual arts to tell the stories of its residents.
                            </p>
                            <div className="space-y-4">
                                <div className="flex gap-4 items-start p-4 rounded-lg bg-muted/50">
                                    <Camera className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold block text-foreground">Murals & Street Art</span>
                                        <span className="text-muted-foreground">Wander through the camp to see striking murals that turn grey walls into canvases of hope and history.</span>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start p-4 rounded-lg bg-muted/50">
                                    <Mic2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold block text-foreground">Biographies & Essays</span>
                                        <span className="text-muted-foreground">The project archives personal stories and creative journeys, providing a platform for voices to be heard globally.</span>
                                    </div>
                                </div>
                            </div>
                            <Button asChild size="lg" variant="outline">
                                <a href="https://www.dzalekaartproject.com/" target="_blank" rel="noopener noreferrer">
                                    Explore Art Project <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                        <div className="order-1 md:order-2 relative">
                            <div className="aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-muted">
                                <img
                                    src="https://tumainiletu.org/wp-content/uploads/2021/07/Website-Entrepreneurship-and-innovation-2048x1536.jpg"
                                    alt="Dzaleka Art Project Murals"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-6 -left-6 -z-10 w-full h-full border-2 border-primary/10 rounded-2xl" />
                        </div>
                    </section>

                    {/* Music & Fashion Section */}
                    <section className="bg-muted/30 rounded-3xl p-8 md:p-12">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Music, Fashion & Innovation</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Creativity in Dzaleka takes many forms—from recording studios to runway shows to tech hubs.
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="text-center p-6 bg-background rounded-xl shadow-sm">
                                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Music className="h-7 w-7 text-primary" />
                                </div>
                                <h4 className="font-semibold mb-2">Recording Studios</h4>
                                <p className="text-sm text-muted-foreground">Small, refugee-run studios produce Afro-pop, Reggae, Gospel, and traditional folk music.</p>
                            </div>
                            <div className="text-center p-6 bg-background rounded-xl shadow-sm">
                                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Users className="h-7 w-7 text-primary" />
                                </div>
                                <h4 className="font-semibold mb-2">Dance Troupes</h4>
                                <p className="text-sm text-muted-foreground">Traditional dance groups from Rwanda, Burundi, and the DRC keep cultural heritage alive.</p>
                            </div>
                            <div className="text-center p-6 bg-background rounded-xl shadow-sm">
                                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="h-7 w-7 text-primary" />
                                </div>
                                <h4 className="font-semibold mb-2">Fashion Shows</h4>
                                <p className="text-sm text-muted-foreground">Local designers host runway shows featuring custom clothing made from vibrant African prints.</p>
                            </div>
                            <div className="text-center p-6 bg-background rounded-xl shadow-sm">
                                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Radio className="h-7 w-7 text-primary" />
                                </div>
                                <h4 className="font-semibold mb-2">Community Radio</h4>
                                <p className="text-sm text-muted-foreground">Local broadcasting shares music, news, and drama in multiple languages.</p>
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="max-w-4xl mx-auto">
                        <Card className="bg-primary text-primary-foreground overflow-hidden">
                            <div className="md:flex">
                                <div className="md:w-1/3 bg-black/20 relative min-h-[200px]">
                                    <img
                                        src="https://tumainiletu.org/wp-content/uploads/2024/10/Badre_Bahaji_Tumaini_festival21_-31-1.jpg"
                                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
                                        alt="Cultural Tour"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Palette className="h-12 w-12 text-white/90" />
                                    </div>
                                </div>
                                <div className="md:w-2/3 p-8">
                                    <h3 className="text-2xl font-bold mb-2">Book a Cultural & Arts Tour</h3>
                                    <p className="text-primary-foreground/90 mb-6 text-lg">
                                        To get the most out of Dzaleka's arts scene, we recommend booking a specialized Cultural & Arts Tour with a local guide who can introduce you to artists, musicians, and creative spaces.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <Button asChild variant="secondary" size="lg">
                                            <Link href="/login">
                                                Book Cultural Tour <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                                            <Link href="/things-to-do">
                                                View All Experiences
                                            </Link>
                                        </Button>
                                    </div>
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
