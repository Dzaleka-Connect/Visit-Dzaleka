import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, ArrowRight, Menu, X, Clock, Calendar, Utensils, Scissors, Monitor, Wallet, ExternalLink, Store, Quote, ShieldAlert, Lightbulb, TrendingUp, Lock, Users, Layers, Handshake } from "lucide-react";
import { useState } from "react";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";

export default function ShoppingMarkets() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const marketHighlights = [
        {
            icon: Clock,
            title: "Daily Market",
            description: "Open every day for daily essentials like fresh produce, household items, and basic supplies.",
        },
        {
            icon: Calendar,
            title: "Tuesday Market",
            description: "The main, larger market day. Visitors and locals flock here to find provisions at potentially lower costs.",
        },
        {
            icon: Utensils,
            title: "Food & Drink",
            description: "Fresh vegetables, meats, grains, and cooked foods. Try 'King's Chapati', a local favorite!",
        },
        {
            icon: Scissors,
            title: "Services",
            description: "Tailoring, hairdressing, phone charging, and computer repair services are widely available.",
        }
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Shopping & Markets in Dzaleka"
                description="Explore Dzaleka's dynamic market economy. From the bustling Tuesday Market to refugee-run businesses selling crafts, food, and services."
                keywords="Dzaleka market, shopping in Dzaleka, refugee entrepreneurs, Malawi markets, Tuesday market Dzaleka, African crafts, King's Chapati"
                canonical="https://visit.dzaleka.com/things-to-do/shopping"
                ogImage="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj7jE_sKQ_YlG2gJq66kEsqq7fT4v7uO_QeL-2hWp6cZq9_XlJ0yK0qE1pW5nQ4z3k7rT9vXlJ0yK0qE1pW5nQ4z3k7rT9vXlJ0yK0qE1pW5nQ4z3k7rT9vXlJ0/s1600/market.jpg"
            />

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
                        <Link href="/things-to-do/shopping" className="block text-sm font-medium py-1 pl-4 text-primary" onClick={() => setMobileMenuOpen(false)}>↳ Shopping & Markets</Link>
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
                        style={{ backgroundImage: 'url(https://services.dzaleka.com/images/Dzaleka_Marketplace.jpeg)' }}
                    />
                    <div className="absolute inset-0 bg-black/60" />

                    <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-white/30 bg-white/10 text-white rounded-full uppercase tracking-widest font-semibold flex items-center justify-center w-fit mx-auto backdrop-blur-sm">
                            <ShoppingBag className="mr-2 h-3.5 w-3.5" />
                            Local Economy
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-white">
                            Shopping & Markets in Dzaleka
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
                            Dzaleka hosts a dynamic, self-organized market economy. Support local refugee entrepreneurs and discover unique goods and services.
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-16 space-y-24">

                    {/* Intro */}
                    <section className="max-w-3xl mx-auto text-center">
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Shopping in Dzaleka is a direct way to support the local economy. The market includes both refugees and local Malawian traders selling a variety of goods. It's a vibrant system that caters to the daily needs of over 50,000 residents.
                        </p>
                    </section>

                    {/* Market Highlights Grid */}
                    <section>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Market Days & Locations</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                The camp's economy revolves around these key trading times and sectors.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {marketHighlights.map((item, index) => (
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

                    {/* What You Can Buy Section */}
                    <section className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-2 md:order-1 space-y-6">
                            <div className="flex items-center gap-3 text-primary font-semibold">
                                <Store className="h-5 w-5" />
                                <span>Products & Services</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight">What You Can Buy</h2>
                            <p className="text-muted-foreground text-lg">
                                The stalls await with a diverse range of products. Beyond physical goods, Dzaleka is a hub for skilled services.
                            </p>
                            <div className="space-y-4">
                                <div className="flex gap-4 items-start p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                                    <Utensils className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold block text-foreground">Food & Favorites</span>
                                        <span className="text-muted-foreground">Vendors sell fresh produce and cooked foods. Don't miss "King's Chapati", a famous local delight.</span>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                                    <ShoppingBag className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold block text-foreground">Goods & Crafts</span>
                                        <span className="text-muted-foreground">Find used clothing, hair supplies, fabrics, furniture, paper goods, and various handmade crafts.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 md:order-2 relative">
                            <div className="aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-muted">
                                <img
                                    src="https://thereishopemalawi.org/wp-content/uploads/2019/12/Shabani-a-refugee-artisan-from-Dzaleka-Camp-whose-life-transformed-after-being-employed-by-Kibebe.jpg"
                                    alt="Tailoring in Dzaleka"
                                    className="w-full h-full object-cover"
                                />
                                {/* Note: Placeholder image URL logic used for demonstration as I don't have the exact image, using a generic placeholder if needed, but keeping the intent */}
                            </div>
                            <div className="absolute -bottom-6 -left-6 -z-10 w-full h-full border-2 border-primary/10 rounded-2xl" />
                        </div>
                    </section>

                    {/* Digital Marketplace CTA */}
                    <section className="bg-muted/50 rounded-3xl p-8 border border-muted">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-2 text-primary font-semibold">
                                    <Monitor className="h-5 w-5" />
                                    <span>Digital Economy</span>
                                </div>
                                <h2 className="text-2xl font-bold">Shop Dzaleka Online</h2>
                                <p className="text-muted-foreground">
                                    Browse products and services from refugee entrepreneurs online. Discover the vibrant digital marketplace of Dzaleka.
                                </p>
                                <div className="flex flex-wrap gap-4 pt-2">
                                    <Button asChild variant="default">
                                        <a href="https://services.dzaleka.com/marketplace/" target="_blank" rel="noopener noreferrer">
                                            Visit Marketplace <ExternalLink className="ml-2 h-4 w-4" />
                                        </a>
                                    </Button>
                                    <Button asChild variant="outline">
                                        <a href="https://services.dzaleka.com/marketplace/stores/" target="_blank" rel="noopener noreferrer">
                                            Browse Stores <ExternalLink className="ml-2 h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            </div>
                            <div className="hidden md:flex h-32 w-32 items-center justify-center rounded-full bg-background border shadow-sm">
                                <ShoppingBag className="h-12 w-12 text-primary" />
                            </div>
                        </div>
                    </section>

                    {/* Impact Section */}
                    <section className="bg-primary/5 rounded-3xl p-8 md:p-12">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight mb-4">Supporting Livelihoods</h2>
                                <p className="text-lg text-muted-foreground mb-6">
                                    Shopping in Dzaleka empowers residents. The Tumaini Festival alone generates significant funds for the local economy.
                                </p>
                                <div className="space-y-4">
                                    <div className="bg-background p-4 rounded-xl shadow-sm">
                                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                                            <Scissors className="h-4 w-4 text-primary" /> Vocational Training
                                        </h4>
                                        <p className="text-sm text-muted-foreground">Organizations like There Is Hope Malawi run programs where trainees learn to make clothes and generate income.</p>
                                    </div>
                                    <div className="bg-background p-4 rounded-xl shadow-sm">
                                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                                            <Monitor className="h-4 w-4 text-primary" /> Modern Services
                                        </h4>
                                        <p className="text-sm text-muted-foreground">From computer repair to digital services, the camp's economy is diversifying and modernizing.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <Card className="border-none shadow-lg">
                                    <CardContent className="p-8">
                                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                            <Wallet className="h-5 w-5 text-primary" />
                                            Tips for Shopping
                                        </h3>
                                        <ul className="space-y-4">
                                            <li className="flex items-start gap-3">
                                                <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                                                <div>
                                                    <span className="font-medium block">Cash is King</span>
                                                    <span className="text-sm text-muted-foreground">While there are ATMs in the camp, we strongly recommend bringing enough Malawian Kwacha (MWK) cash for your purchases as standard availability can vary.</span>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                                                <div>
                                                    <span className="font-medium block">Haggling is Welcome</span>
                                                    <span className="text-sm text-muted-foreground">Haggling is a common practice and part of the vibrant market experience.</span>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                                                <div>
                                                    <span className="font-medium block">Ask Permission</span>
                                                    <span className="text-sm text-muted-foreground">Always ask before taking photos of stalls or people in the market.</span>
                                                </div>
                                            </li>
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </section>

                    {/* Economic Resilience Narrative Section */}
                    <section className="space-y-16">
                        <div className="text-center max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                Economic Dynamics & Resilience
                            </h2>
                            <p className="text-xl text-muted-foreground leading-relaxed mb-4">
                                Dzaleka’s market is a testament to agility. Refugee entrepreneurs navigate complex challenges to build livelihoods that support their families and the wider community.
                            </p>
                            <p className="text-sm text-muted-foreground/60 italic">
                                Insights adapted from "Refugee entrepreneurship within and beyond refugee camps" (Msowoya & Luiz, 2025).
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-16">
                            {/* Insight 1 */}
                            <div className="group space-y-4">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300">
                                        <ShieldAlert className="h-5 w-5" />
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                                </div>
                                <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">Navigating Systemic Barriers</h3>
                                <p className="text-muted-foreground leading-relaxed text-lg">
                                    Doing business outside the camp boundaries presents significant risks, including property confiscation or detention. Despite these hurdles, entrepreneurs find innovative ways to operate, turning constraints into drivers for creative logistical solutions.
                                </p>
                            </div>

                            {/* Insight 2 */}
                            <div className="group space-y-4">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                                        <Lightbulb className="h-5 w-5" />
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                                </div>
                                <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">From Scarcity to Strategy</h3>
                                <p className="text-muted-foreground leading-relaxed text-lg">
                                    Many businesses begin with minimal resources—sometimes initiated by trading a portion of monthly food rations for startup capital. This survivalist improvisation evolves into strategic intent, with entrepreneurs growing to source commodities from Lilongwe and neighboring countries.
                                </p>
                            </div>

                            {/* Insight 3 */}
                            <div className="group space-y-4">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                                </div>
                                <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">The Power of Networks</h3>
                                <p className="text-muted-foreground leading-relaxed text-lg">
                                    Social capital is as valuable as financial capital. Entrepreneurs leverage connections with diaspora relatives for funding and form critical partnerships with local Malawians. These "boundary-spanning" ties enable market access that would otherwise be legally out of reach.
                                </p>
                            </div>

                            {/* Insight 4 */}
                            <div className="group space-y-4">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                                        <Layers className="h-5 w-5" />
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                                </div>
                                <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">Strategic Diversification</h3>
                                <p className="text-muted-foreground leading-relaxed text-lg">
                                    Successful entrepreneurs rarely rely on a single income stream. Most diversify their portfolio, perhaps running a hardware shop in Dzaleka, a restaurant in town, and a wholesale business simultaneously, buffering against shocks and regulatory uncertainty.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Final CTA */}
                    <section className="mt-24 text-center space-y-8 bg-muted/30 py-16 rounded-3xl border border-border/50">
                        <div className="max-w-2xl mx-auto px-4">
                            <h2 className="text-3xl font-bold mb-4">Experience the Market Energy</h2>
                            <p className="text-lg text-muted-foreground mb-8">
                                There is no better way to understand Dzaleka's economy than to walk its streets. Join a guided tour to meet the entrepreneurs, taste local foods, and support these businesses directly.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button asChild size="lg" className="px-8 text-base">
                                    <Link href="/login">Book a Market Tour</Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="px-8 text-base">
                                    <Link href="/contact">Contact for Group Visits</Link>
                                </Button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
