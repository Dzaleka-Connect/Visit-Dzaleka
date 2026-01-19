import { useState } from "react";
import { Link, useRoute } from "wouter";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    DollarSign,
    Calendar,
    FileText,
    Globe,
    Menu,
    X,
    ArrowLeft,
    Download,
    CalendarDays,
    TrendingUp,
    CheckCircle2
} from "lucide-react";

const reportsData: Record<string, {
    id: string;
    title: string;
    period: string;
    publishedDate: string;
    type: string;
    status: string;
    summary: string;
    stats: { label: string; value: string; icon: any }[];
    visitorOrigins: { country: string; flag: string; visitors: number }[];
    highlights: string[];
    downloadUrl: string | null;
}> = {
    "2025": {
        id: "2025",
        title: "2025 Impact Report",
        period: "2025",
        publishedDate: "Coming Soon",
        type: "Yearly",
        status: "Coming Soon",
        summary: "Our first full year impact report tracking the growth of refugee-led tourism at Dzaleka. This report covers all tours, visitors, and revenue generated through the Visit Dzaleka platform.",
        stats: [
            { label: "Total Bookings", value: "6", icon: CalendarDays },
            { label: "Participants", value: "18", icon: Users },
            { label: "Total Revenue", value: "MK 280,000", icon: DollarSign },
        ],
        visitorOrigins: [
            { country: "United States", flag: "🇺🇸", visitors: 14 },
            { country: "Germany", flag: "🇩🇪", visitors: 2 },
            { country: "United Kingdom", flag: "🇬🇧", visitors: 1 },
            { country: "South Africa", flag: "🇿🇦", visitors: 1 },
        ],
        highlights: [
            "6 tours completed",
            "18 visitors hosted",
            "MK 280,000 revenue generated",
            "Visitors from 4 countries",
            "100% positive feedback"
        ],
        downloadUrl: null
    }
};

export default function ImpactReportView() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [, params] = useRoute("/impact-report/:id");
    const reportId = params?.id || "";
    const report = reportsData[reportId];

    if (!report) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold mb-2">Report Not Found</h1>
                <p className="text-muted-foreground mb-6">The report you're looking for doesn't exist.</p>
                <Button asChild>
                    <Link href="/impact-report">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Impact Reports
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title={`${report.title} | Visit Dzaleka`}
                description={report.summary}
                keywords="Visit Dzaleka impact report, refugee tourism impact, community tourism results"
                canonical={`https://visit.dzaleka.com/impact-report/${report.id}`}
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
                        <Link href="/impact-report" className="text-sm font-medium hover:text-primary transition-colors">All Reports</Link>
                        <Link href="/about-us" className="text-sm font-medium hover:text-primary transition-colors">About Us</Link>
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
                        <Link href="/impact-report" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>All Reports</Link>
                        <Link href="/about-us" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
                        <div className="flex gap-2 pt-2">
                            <Button asChild className="flex-1">
                                <Link href="/login">Book a Tour</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1">
                {/* Back Button */}
                <div className="container mx-auto px-4 pt-6">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/impact-report">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to All Reports
                        </Link>
                    </Button>
                </div>

                {/* Report Header */}
                <section className="py-12 bg-gradient-to-b from-primary/5 to-background">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <Badge variant={report.status === "Coming Soon" ? "secondary" : "default"}>
                                {report.status}
                            </Badge>
                            <Badge variant="outline">{report.type}</Badge>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                            {report.title}
                        </h1>
                        <div className="flex items-center gap-4 text-muted-foreground mb-6">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{report.period}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>{report.publishedDate}</span>
                            </div>
                        </div>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            {report.summary}
                        </p>

                        {report.downloadUrl && (
                            <div className="mt-6">
                                <Button asChild>
                                    <a href={report.downloadUrl} download>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download PDF
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Stats */}
                <section className="py-12 bg-background border-b">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Key Metrics
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {report.stats.map((stat, index) => (
                                <Card key={index} className="text-center">
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
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            Visitor Origins
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                            {report.visitorOrigins.map((origin, index) => (
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

                {/* Highlights */}
                <section className="py-12 bg-background">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            Highlights
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {report.highlights.map((highlight, index) => (
                                <div key={index} className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                    <span>{highlight}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-12 bg-primary/5">
                    <div className="container mx-auto px-4 max-w-3xl text-center">
                        <h2 className="text-2xl font-bold mb-4">Be Part of Our Next Report</h2>
                        <p className="text-muted-foreground mb-6">
                            Book a tour and contribute to the growing impact of refugee-led tourism.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild size="lg">
                                <Link href="/login">Book a Tour</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg">
                                <Link href="/support-our-work">Make a Donation</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
