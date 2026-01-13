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
// Comprehensive Structured Data for SEO
const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Article",
            "headline": "Life in Dzaleka: A City in Waiting",
            "description": "Discover the daily reality, economy, education, and vibrant culture of Dzaleka Refugee Camp. Learn about the Tumaini Festival, the $9 monthly stipend struggle, and the resilience of 56,000+ residents.",
            "image": "https://services.dzaleka.com/images/dzaleka-hero.jpeg",
            "datePublished": "2024-01-01",
            "dateModified": "2025-01-01",
            "author": {
                "@type": "Organization",
                "name": "Visit Dzaleka"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Visit Dzaleka",
                "url": "https://visit.dzaleka.com",
                "logo": "https://services.dzaleka.com/images/dzaleka-digital-heritage.png"
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": "https://visit.dzaleka.com/life-in-dzaleka"
            },
            "mentions": [
                {
                    "@type": "Event",
                    "name": "Tumaini Festival",
                    "description": "The world's only arts and culture festival held within a refugee camp.",
                    "startDate": "2014",
                    "organizer": { "@type": "Person", "name": "Menes La Plume" }
                },
                {
                    "@type": "Organization",
                    "name": "Kibébé",
                    "description": "Social enterprise crafting upcycled products."
                },
                {
                    "@type": "Organization",
                    "name": "Jesuit Worldwide Learning",
                    "alternateName": "JWL"
                }
            ]
        },
        {
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "Can refugees in Dzaleka work?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Under Malawi's 1989 Refugee Act, refugees generally do not have the right to formal employment or freedom of movement, restricting most to the informal economy within the camp."
                    }
                },
                {
                    "@type": "Question",
                    "name": "How do refugees survive in Dzaleka?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Most rely on WFP monthly food rations and a small stipend (approx. $9/month). Many engage in informal small businesses, trading, or skilled trades like tailoring and carpentry to supplement this."
                    }
                },
                {
                    "@type": "Question",
                    "name": "What is the Tumaini Festival?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Founded in 2014, the Tumaini Festival is an annual multi-cultural arts festival held inside Dzaleka Refugee Camp, attracting visitors and artists from around the world to celebrate unity and peace."
                    }
                }
            ]
        }
    ]
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
                        <p className="text-muted-foreground mb-6 text-sm sm:text-base leading-relaxed">
                            For the average resident, each day is a negotiation for basic necessities. The camp infrastructure is overwhelmed, and most families survive on a WFP monthly stipend of roughly <strong className="text-foreground">$9 per person</strong>—barely enough to cover basic food needs for two weeks.
                        </p>

                        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Utensils className="h-5 w-5 text-primary" />
                                        Food Security
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    With rations frequently cut to <strong className="text-foreground">50-75% of requirements</strong> due to funding gaps, many families face food insecurity. Residents supplement their diet by cultivating small vegetable patches or trading goods.
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Droplets className="h-5 w-5 text-primary" />
                                        Water Access
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Water is life's daily chore. Residents fetch water from communal boreholes (<strong className="text-foreground">36 hand pumps, 13 electric</strong>), often waiting hours in lines that serve as impromptu community gathering spots.
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Building className="h-5 w-5 text-primary" />
                                        Shelter Crisis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Families live in self-constructed mud-brick houses. As space runs out, overcrowding forces new arrivals into temporary communal shelters or to rent small rooms from established residents.
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

                        <div className="grid gap-4 md:grid-cols-2 mb-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-primary" />
                                        Legal Restrictions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <p className="mb-3">
                                        Under the 1989 Refugee Act, residents generally lack the right to formal employment or free movement. This forces economic activity underground, yet the camp bustles with small businesses—from grocery kiosks to furniture workshops.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <Store className="h-5 w-5 text-primary" />
                                        Mardi Marché
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <p className="mb-3">
                                        Every Tuesday, the camp transforms for <strong className="text-foreground">"Mardi Marché"</strong> (Tuesday Market). Traders from across Dowa District descend on Dzaleka, creating a massive commercial hub where refugees and locals trade vegetables, electronics, and textiles side-by-side.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                            Entrepreneurship is a form of resistance. Denied formal jobs, residents create their own opportunities:
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex gap-3 items-start p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-lg">🪡</div>
                                <div>
                                    <p className="font-semibold text-foreground">Kibébé</p>
                                    <p className="text-xs text-muted-foreground">A social enterprise where artisans craft high-quality upcycled products involved in the global market.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-lg">🫓</div>
                                <div>
                                    <p className="font-semibold text-foreground">King's Chapati</p>
                                    <p className="text-xs text-muted-foreground">A legendary local bakery that has become a culinary staple of the camp's daily life.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-lg">🧺</div>
                                <div>
                                    <p className="font-semibold text-foreground">Umoja Crafts</p>
                                    <p className="text-xs text-muted-foreground">Women's cooperative weaving traditional baskets to support their families.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Education Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <GraduationCap className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Education & Youth</h2>
                        </div>
                        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                            With a massive youth population, education is a race against overcrowding. Classroom ratios can reach <strong className="text-foreground">1:88</strong>, yet students remain determined.
                        </p>

                        <div className="space-y-4">
                            <div className="relative border-l-4 border-primary pl-6 py-2">
                                <h3 className="font-bold text-lg mb-1">Primary & Secondary</h3>
                                <p className="text-sm text-muted-foreground">
                                    JRS operates schools where children often attend in shifts. The <strong className="text-foreground">Dzaleka Community Day Secondary School</strong> is a beacon of excellence, consistently performing well in national exams despite limited resources.
                                </p>
                            </div>
                            <div className="relative border-l-4 border-primary pl-6 py-2">
                                <h3 className="font-bold text-lg mb-1">Digital Skills</h3>
                                <p className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">TakenoLAB</strong> and AppFactory are refugee-led tech hubs teaching coding. For many youth, digital work offers a rare legal loophole to earn an income remotely.
                                </p>
                            </div>
                            <div className="relative border-l-4 border-primary pl-6 py-2">
                                <h3 className="font-bold text-lg mb-1">Higher Learning</h3>
                                <p className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">Jesuit Worldwide Learning (JWL)</strong> provides online diploma courses, offering one of the few pathways to accredited higher education for adults in the camp.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Culture Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Music className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Culture & Resilience</h2>
                        </div>

                        <div className="prose prose-sm sm:prose max-w-none text-muted-foreground mb-8">
                            <p className="text-sm sm:text-base leading-relaxed">
                                Dzaleka is not just a place of survival; it is a cultural melting pot where Congolese rumba blends with Burundian drumming and Malawian vibes. The community's resilience shines brightest through its arts.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                            <Card className="col-span-full md:col-span-2 border-primary/20 bg-primary/5">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                        <Trophy className="h-5 w-5 text-primary" />
                                        Tumaini Festival
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                                    <p className="mb-3">
                                        Founded in 2014 by refugee poet Menes La Plume, Tumaini (meaning "Hope") is the <strong className="text-foreground">world's only music and arts festival held within a refugee camp</strong>.
                                    </p>
                                    <p>
                                        For one weekend a year, the camp opens its doors to the world. International artists, tourists, and locals dance together, shattering stereotypes and generating significant income for camp businesses. It is Dzaleka's proudest showcase of peace and creativity.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Users className="h-5 w-5 text-primary" />
                                        Faith & Society
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    With over <strong className="text-foreground">200 churches</strong>, faith is the bedrock of social life. Churches serve as community centers, safety nets, and places of emotional refuge.
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Music className="h-5 w-5 text-primary" />
                                        Creative Arts
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Groups like the <strong className="text-foreground">Amahoro Drummers</strong> and Dzaleka Acrobatics keep traditions alive. Salons and barber shops double as social hubs where news and culture are exchanged daily.
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
