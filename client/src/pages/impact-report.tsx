import { useState } from "react";
import { Link } from "wouter";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    TrendingUp,
    DollarSign,
    Calendar,
    FileText,
    Globe,
    Menu,
    X,
    ArrowRight,
    Download,
    MapPin,
    Eye,
    CalendarDays
} from "lucide-react";

const overallStats = [
    {
        label: "Total Bookings",
        value: "6",
        icon: CalendarDays,
    },
    {
        label: "Participants",
        value: "18",
        icon: Users,
    },
    {
        label: "Total Revenue",
        value: "MK 280,000",
        icon: DollarSign,
    }
];

const visitorOrigins = [
    { country: "United States", flag: "🇺🇸", visitors: 14 },
    { country: "Germany", flag: "🇩🇪", visitors: 2 },
    { country: "United Kingdom", flag: "🇬🇧", visitors: 1 },
    { country: "South Africa", flag: "🇿🇦", visitors: 1 },
];

const publishedReports = [
    {
        id: "2025",
        title: "2025 Impact Report",
        period: "January - December 2025",
        publishedDate: "January 2026",
        type: "Yearly",
        highlights: [
            "5 tours completed",
            "17 visitors hosted",
            "3 countries represented"
        ],
        downloadUrl: null,
        status: "Published"
    },
];

const impactCategories = [
    { name: "Tourism", count: 1, color: "bg-blue-500" },
    { name: "Guide Income", count: 0, color: "bg-green-500" },
    { name: "Community Projects", count: 0, color: "bg-purple-500" },
    { name: "Grants", count: 0, color: "bg-orange-500" },
];

export default function ImpactReport() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Impact Report | Visit Dzaleka"
                description="See the impact of Visit Dzaleka – tours completed, guides supported, and community growth through refugee-led tourism."
                keywords="Visit Dzaleka impact, refugee tourism impact, community tourism results, Dzaleka KPIs"
                canonical="https://visit.dzaleka.com/impact-report"
            />

            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/">
                        <div className="flex items-center gap-3 cursor-pointer">
                            <img src="https://services.dzaleka.com/images/dzaleka-digital-heritage.png" alt="Dzaleka Visit Logo" className="h-10 w-10 rounded-lg shadow-sm" />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold tracking-tight">Dzaleka Visit</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Official Portal</span>
                            </div>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-4">
                        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
                        <Link href="/about-us" className="text-sm font-medium hover:text-primary transition-colors">About Us</Link>
                        <Link href="/support-our-work" className="text-sm font-medium hover:text-primary transition-colors">Support Us</Link>
                        <div className="flex items-center gap-2 ml-2">
                            <Button asChild size="sm">
                                <Link href="/login">Book a Tour</Link>
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
                        <Link href="/about-us" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
                        <Link href="/support-our-work" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Support Us</Link>
                        <div className="flex gap-2 pt-2">
                            <Button asChild className="flex-1">
                                <Link href="/login">Book a Tour</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1">
                {/* Hero */}
                <section className="relative py-16 sm:py-20 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
                    <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full uppercase tracking-widest font-semibold">
                            <TrendingUp className="mr-2 h-3.5 w-3.5" />
                            Transparency & Accountability
                        </Badge>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                            Impact Reports
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                            Track how refugee-led tourism is creating livelihoods and connecting communities. We publish regular reports on our progress.
                        </p>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl -z-10" />
                </section>

                {/* Overall Stats */}
                <section className="py-12 bg-background border-b">
                    <div className="container mx-auto px-4">
                        <h2 className="text-lg font-semibold text-center mb-6 text-muted-foreground uppercase tracking-wider">Overall Performance</h2>
                        <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
                            {overallStats.map((stat, index) => (
                                <Card key={index} className="border-none shadow-md text-center">
                                    <CardContent className="p-6">
                                        <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                                        <div className="text-3xl font-bold mb-1">{stat.value}</div>
                                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Visitor Origins */}
                <section className="py-12 bg-muted/30">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Globe className="h-6 w-6 text-primary" />
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Where Our Visitors Come From</h2>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                            {visitorOrigins.map((origin, index) => (
                                <Card key={index}>
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <span className="text-2xl">{origin.flag}</span>
                                        <div>
                                            <div className="font-medium text-sm">{origin.country}</div>
                                            <div className="text-xs text-muted-foreground">{origin.visitors} visitors</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Published Reports Table */}
                <section className="py-16 bg-background">
                    <div className="container mx-auto px-4 max-w-5xl">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <FileText className="h-6 w-6 text-primary" />
                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Published Reports</h2>
                            </div>
                            <Badge variant="secondary">{publishedReports.length} Reports</Badge>
                        </div>

                        {publishedReports.length > 0 ? (
                            <div className="space-y-4">
                                {publishedReports.map((report) => (
                                    <Card key={report.id} className="overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="flex flex-col md:flex-row">
                                                {/* Report Info */}
                                                <div className="flex-1 p-6">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant={report.status === "Current" ? "default" : "secondary"}>
                                                            {report.status}
                                                        </Badge>
                                                        <Badge variant="outline">{report.type}</Badge>
                                                    </div>
                                                    <h3 className="text-lg font-semibold mb-1">{report.title}</h3>
                                                    <p className="text-sm text-muted-foreground mb-3">
                                                        <Calendar className="inline h-3 w-3 mr-1" />
                                                        {report.period}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {report.highlights.map((highlight, i) => (
                                                            <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
                                                                {highlight}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex md:flex-col items-center justify-center gap-2 p-4 md:p-6 bg-muted/30 md:border-l">
                                                    <div className="text-xs text-muted-foreground mb-2 hidden md:block">
                                                        {report.publishedDate}
                                                    </div>
                                                    <Button asChild size="sm">
                                                        <Link href={`/impact-report/${report.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Report
                                                        </Link>
                                                    </Button>
                                                    {report.downloadUrl && (
                                                        <Button asChild size="sm" variant="outline">
                                                            <a href={report.downloadUrl} download>
                                                                <Download className="mr-2 h-4 w-4" />
                                                                PDF
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="bg-muted/30">
                                <CardContent className="p-12 text-center">
                                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
                                    <p className="text-muted-foreground">Impact reports will appear here as they are published.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </section>

                {/* Report Categories */}
                <section className="py-12 bg-muted/30">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <h2 className="text-lg font-semibold text-center mb-6 text-muted-foreground uppercase tracking-wider">Report Categories</h2>
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                            {impactCategories.map((category, index) => (
                                <Card key={index} className="text-center">
                                    <CardContent className="p-4">
                                        <div className={`h-2 w-12 mx-auto mb-3 rounded-full ${category.color}`} />
                                        <div className="font-medium text-sm">{category.name}</div>
                                        <div className="text-xs text-muted-foreground">{category.count} reports</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-16 bg-primary/5">
                    <div className="container mx-auto px-4 max-w-3xl text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">Want to Support Our Impact?</h2>
                        <p className="text-muted-foreground mb-6">
                            Every tour booked and every donation directly supports refugee guides and community projects.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild size="lg">
                                <Link href="/login">
                                    Book a Tour <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg">
                                <Link href="/support-our-work">
                                    Make a Donation
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
