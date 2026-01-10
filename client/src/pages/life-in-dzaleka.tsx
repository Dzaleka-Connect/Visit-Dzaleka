import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Menu, X, ExternalLink, Users, History, Globe, Church, Droplets, Store,
    GraduationCap, Music, Heart, Trophy, Building, Utensils, Briefcase
} from "lucide-react";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";

// Structured Data for SEO
const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Life in Dzaleka: A City in Waiting",
    "description": "Discover the daily reality, economy, education, and vibrant culture of Dzaleka Refugee Camp - home to over 56,000 people from DRC, Rwanda, and Burundi.",
    "author": {
        "@type": "Organization",
        "name": "Visit Dzaleka"
    },
    "publisher": {
        "@type": "Organization",
        "name": "Visit Dzaleka",
        "url": "https://visit.dzaleka.com"
    },
    "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://visit.dzaleka.com/life-in-dzaleka"
    }
};

const stats = [
    { icon: Users, value: "56,000+", label: "Population" },
    { icon: History, value: "1994", label: "Established" },
    { icon: Globe, value: "DRC & Burundi/Rwanda", label: "Main Origins" },
    { icon: Church, value: "~200", label: "Churches" },
];

export default function LifeInDzaleka() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Life in Dzaleka | Understanding the Community"
                description="Discover the daily reality, economy, education, and vibrant culture of Dzaleka Refugee Camp - home to over 56,000 people from DRC, Rwanda, and Burundi."
                keywords="Dzaleka life, Dzaleka community, refugee camp life, Dzaleka economy, Dzaleka education, Dzaleka culture"
                canonical="https://visit.dzaleka.com/life-in-dzaleka"
                ogImage="https://services.dzaleka.com/images/dzaleka-hero.jpeg"
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
                        <Link href="/life-in-dzaleka" className="text-sm font-medium text-primary transition-colors">Life in Dzaleka</Link>
                        <Link href="/things-to-do" className="text-sm font-medium hover:text-primary transition-colors">Things To Do</Link>
                        <Link href="/whats-on" className="text-sm font-medium hover:text-primary transition-colors">What's On</Link>
                        <Link href="/plan-your-trip" className="text-sm font-medium hover:text-primary transition-colors">Plan Your Trip</Link>
                        <div className="flex items-center gap-2 ml-2">
                            <Button asChild size="sm">
                                <Link href="/login">Book Now</Link>
                            </Button>
                        </div>
                    </nav>

                    <button
                        className="md:hidden p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden border-t bg-background p-4 space-y-3">
                        <Link href="/" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                        <Link href="/blog" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
                        <Link href="/life-in-dzaleka" className="block text-sm font-medium py-1 text-primary" onClick={() => setMobileMenuOpen(false)}>Life in Dzaleka</Link>
                        <Link href="/things-to-do" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Things To Do</Link>
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
                <div className="relative py-16 sm:py-20 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
                    <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full uppercase tracking-widest font-semibold flex items-center justify-center w-fit mx-auto">
                            <Heart className="mr-2 h-3.5 w-3.5" />
                            Understanding Dzaleka
                        </Badge>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                            A City in Waiting
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                            Look past the label of "refugee camp." Dzaleka is a bustling, self-organized urban settlement of over 56,000 people squeezed into a space originally designed for 10,000.
                        </p>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl -z-10" />
                </div>

                {/* Stats Bar */}
                <div className="bg-muted/50 border-y">
                    <div className="container mx-auto px-4 py-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                                    <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
                                    <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8 sm:py-12 space-y-12 sm:space-y-16 max-w-5xl">

                    {/* Introduction */}
                    <section>
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                            Established in 1994, Dzaleka has evolved from temporary shelter into a permanent home for generations of families from the DRC, Rwanda, and Burundi. Life here is defined by a stark paradox: a vibrant, tenacious community spirit that thrives despite severe legal restrictions on movement and employment.
                        </p>
                    </section>

                    {/* Survival Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Droplets className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Survival: The Daily Reality</h2>
                        </div>
                        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                            For the average resident, each day is a negotiation for basic necessities. The camp infrastructure, built decades ago, is overwhelmed by the population surge.
                        </p>

                        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Utensils className="h-5 w-5 text-primary" />
                                        Food Crisis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Residents rely on monthly rations from the World Food Programme. Due to funding shortfalls in 2024-2025, rations have dropped to <strong className="text-foreground">50-75% of daily requirements</strong>. Cash transfers have been reduced, pushing many families into severe food insecurity.
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Droplets className="h-5 w-5 text-primary" />
                                        Water Scarcity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Water is accessed via communal boreholes—<strong className="text-foreground">36 hand pumps and 13 electric pumps</strong>. Long queues are a fixture of daily life. Residents often wait hours to fill jerrycans, and tensions can flare when supply is low.
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Building className="h-5 w-5 text-primary" />
                                        Housing & Zones
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Families live in self-constructed mud-brick houses. The camp is divided into zones named after Malawian towns (e.g., "Kawale", "Karonga"). <strong className="text-foreground">Overcrowding is critical</strong>—new arrivals often lack shelter space.
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Economy Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Store className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">The Informal Economy</h2>
                        </div>

                        <Card className="mb-6 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
                            <CardContent className="p-6">
                                <h3 className="font-bold text-lg mb-2 text-amber-800 dark:text-amber-400">The Encampment Policy — Under Review</h3>
                                <p className="text-amber-700 dark:text-amber-300 text-sm sm:text-base mb-3">
                                    Under Malawi's <strong>1989 Refugee Act</strong>, refugees do not have the legal right to work, freedom of movement, or property ownership outside the camp. This forces all economic activity underground or within Dzaleka's boundaries.
                                </p>
                                <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-3 mt-3">
                                    <p className="text-green-800 dark:text-green-300 text-xs sm:text-sm">
                                        <strong>Policy Reform Underway:</strong> A Special Law Commission began reviewing the 1989 Act in January 2024, with a new <strong>Refugee Bill expected by December 2025</strong> that may lift restrictions on employment and movement. Malawi has also launched the <strong>Kayilizi Open Settlement</strong> in Chitipa District as a pilot for rights-based refugee integration.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                            Despite these restrictions, Dzaleka is an economic hub. The main road is lined with businesses—from groceries and barber shops to wedding photographers and cinemas. <strong className="text-foreground">Tuesday is "Mardi Marché,"</strong> a massive market day that attracts traders from across the district, blurring the lines between the refugee and host communities.
                        </p>

                        <Card className="bg-muted/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <Briefcase className="h-5 w-5 text-primary" />
                                    Entrepreneurship as Resistance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                <p className="mb-4">Denied formal jobs, residents create their own opportunities:</p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="flex gap-3 items-start p-3 bg-background rounded-lg">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-lg">🫓</div>
                                        <div>
                                            <p className="font-semibold text-foreground">King's Chapati</p>
                                            <p className="text-xs">A bakery that has become a culinary staple of the camp</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-start p-3 bg-background rounded-lg">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-lg">🧺</div>
                                        <div>
                                            <p className="font-semibold text-foreground">Umoja Woman Craft</p>
                                            <p className="text-xs">A cooperative of women weaving and exporting baskets</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Education Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <GraduationCap className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Education & Youth</h2>
                        </div>
                        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                            With a massive youth population, education is both a priority and a struggle. Classroom ratios can reach <strong className="text-foreground">1:88</strong>—far above the national average.
                        </p>

                        <div className="space-y-4">
                            <div className="relative border-l-4 border-primary pl-6 py-2">
                                <div className="absolute -left-3 top-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                                <h3 className="font-bold text-lg mb-1">Primary Education</h3>
                                <p className="text-sm text-muted-foreground">
                                    Severe overcrowding. Many children attend school in shifts due to a lack of classrooms and teachers.
                                </p>
                            </div>
                            <div className="relative border-l-4 border-primary pl-6 py-2">
                                <div className="absolute -left-3 top-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                                <h3 className="font-bold text-lg mb-1">Higher Education</h3>
                                <p className="text-sm text-muted-foreground">
                                    Provided by <strong className="text-foreground">Jesuit Worldwide Learning (JWL)</strong>, offering online diploma courses—one of the few pathways to accredited qualifications for adults.
                                </p>
                            </div>
                            <div className="relative border-l-4 border-primary pl-6 py-2">
                                <div className="absolute -left-3 top-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                                <h3 className="font-bold text-lg mb-1">Tech & Digital Skills</h3>
                                <p className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">TakenoLAB</strong> is a refugee-founded tech hub teaching coding and digital skills, allowing youth to find remote work online—one of the few legal loopholes for earning an income.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Culture Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Music className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Culture & Community</h2>
                        </div>
                        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                            Social life in Dzaleka is rich and structured. The camp is governed by a complex mix of the official Camp Administrator (Government) and elected Community Leaders representing the different nationalities.
                        </p>

                        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Church className="h-5 w-5 text-primary" />
                                        Faith
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Over <strong className="text-foreground">200 churches</strong> operate in the camp. For many, the church is the primary social safety net, offering spiritual solace and material aid.
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Trophy className="h-5 w-5 text-primary" />
                                        Sports
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Football is a universal language here. Weekends see <strong className="text-foreground">thousands gather</strong> for local leagues—serious community events managed by refugee committees.
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Users className="h-5 w-5 text-primary" />
                                        Youth Governance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    The <strong className="text-foreground">Dzaleka Children's Parliament</strong> empowers ages 8-17 to advocate for child protection and education, giving youth a direct voice in their future.
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="bg-primary/5 rounded-2xl p-6 sm:p-8 md:p-12 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">Experience Dzaleka Firsthand</h2>
                        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto text-sm sm:text-base">
                            Book a guided tour to see beyond the statistics and connect with the real people and stories of this remarkable community.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild size="lg">
                                <Link href="/login">Book a Tour</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg">
                                <Link href="/plan-your-trip/visitor-essentials">Visitor Essentials</Link>
                            </Button>
                        </div>
                    </section>

                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
