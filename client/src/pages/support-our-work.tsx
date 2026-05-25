import { useState } from "react";
import { Link } from "wouter";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Heart,
    Globe,
    Wifi,
    GraduationCap,
    ArrowRight,
    Menu,
    X,
    ExternalLink,
    Mail,
    Laptop,
    Building2,
    Phone
} from "lucide-react";
import { PublicHeader } from "@/components/public-header";

const SUPPORT_OG_IMAGE = "https://services.dzaleka.com/images/dzaleka-digital-heritage.png";

export default function SupportOurWork() {
    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <SEO
                title="Support Our Work | Visit Dzaleka"
                description="Support Dzaleka Online Services to preserve and promote Dzaleka's cultural heritage. Donate now to help digitize history, empower refugees, and amplify community voices."
                keywords="donate Dzaleka, support refugees Malawi, Dzaleka Online Services, digital inclusion refugees, in-kind donations Dzaleka"
                canonical="https://visit.dzaleka.com/support-our-work"
                ogImage={SUPPORT_OG_IMAGE}
                imageAlt="Support Visit Dzaleka and Dzaleka Online Services"
            />

            {/* Header */}
            <PublicHeader activePath="/support-our-work" />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative py-20 md:py-32 overflow-hidden bg-primary/5">
                    <div className="container relative z-10 mx-auto px-4 text-center">
                        <div className="inline-flex items-center justify-center p-3 mb-6 rounded-full bg-primary/10 text-primary">
                            <Heart className="w-8 h-8 fill-current" />
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-foreground">
                            Support Our Work
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
                            We are working to preserve Dzaleka's cultural heritage and empower our community through digital innovation. Your support makes this possible.
                        </p>
                        <Button asChild size="lg" className="rounded-full px-8 text-lg h-12 shadow-lg hover:shadow-xl transition-all">
                            <a href="https://fundraise.dzaleka.com/dzaleka-online-services" target="_blank" rel="noopener noreferrer">
                                Donate Now <ExternalLink className="ml-2 h-5 w-5" />
                            </a>
                        </Button>
                    </div>
                </section>

                {/* Your Impact Section */}
                <section className="py-24 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Your Impact</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                                We engage in research that centers refugee experiences and narratives.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-semibold flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <ArrowRight className="h-5 w-5" />
                                    </div>
                                    Your financial gift will go towards:
                                </h3>
                                <ul className="space-y-4 pl-4">
                                    {["Digitisation of photos, documents, and oral histories",
                                        "Innovation in digital archiving and storytelling",
                                        "Research that centres refugee experiences and narratives",
                                        "Capacity building for local youth and content creators"].map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-muted-foreground">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                </ul>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-2xl font-semibold flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Globe className="h-5 w-5" />
                                    </div>
                                    With your support, we can:
                                </h3>
                                <ul className="space-y-4 pl-4">
                                    {["Improve public access to cultural records and digital archives",
                                        "Preserve and restore historical materials",
                                        "Boost cultural vibrancy and build creative economies"].map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-muted-foreground">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Ways to Support Grid */}
                <section className="py-24 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Ways to Support</h2>
                            <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                            {/* Donate Online */}
                            <Card className="border-none shadow-md hover:shadow-lg transition-all h-full">
                                <CardHeader>
                                    <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mb-4">
                                        <Heart className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-xl">Donate Online</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-muted-foreground">
                                        Support our work with a one-off, monthly, or annual donation.
                                    </p>
                                    <Button asChild className="w-full">
                                        <a href="https://fundraise.dzaleka.com/dzaleka-online-services" target="_blank" rel="noopener noreferrer">
                                            Donate to Dzaleka Online Services <ExternalLink className="ml-2 h-4 w-4" />
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Grants */}
                            <Card className="border-none shadow-md hover:shadow-lg transition-all h-full">
                                <CardHeader>
                                    <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mb-4">
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-xl">Grants & Institutional Giving</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-muted-foreground text-sm">
                                        Institutional giving plays a key role in expanding our impact. If you're part of a foundation, NGO, or funder interested in digital heritage, refugee storytelling, or African-led innovation — we'd love to connect.
                                    </p>
                                    <Button variant="outline" asChild className="w-full">
                                        <a href="mailto:dzalekaconnnect@gmail.com">
                                            Contact Us <Mail className="ml-2 h-4 w-4" />
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* In-Kind */}
                            <Card className="border-none shadow-md hover:shadow-lg transition-all h-full">
                                <CardHeader>
                                    <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center mb-4">
                                        <Laptop className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-xl">In-Kind Donations</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-muted-foreground text-sm mb-2">
                                        We welcome in-kind support, including:
                                    </p>
                                    <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                                        <li>Technical equipment (laptops, cameras, scanners, hard drives)</li>
                                        <li>Archival storage materials</li>
                                        <li>Books, stationery, or event space</li>
                                    </ul>
                                    <div className="pt-2">
                                        <Button variant="outline" asChild className="w-full">
                                            <a href="mailto:dzalekaconnnect@gmail.com">
                                                Offer In-Kind Support <Mail className="ml-2 h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Mobile Money */}
                            <Card className="border-none shadow-md hover:shadow-lg transition-all h-full">
                                <CardHeader>
                                    <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center mb-4">
                                        <Phone className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-xl">Airtel Money / TNM Mpamba</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-muted-foreground">
                                        Prefer to donate through mobile money or direct bank transfer? Contact us for details.
                                    </p>
                                    <Button variant="outline" asChild className="w-full">
                                        <a href="mailto:dzalekaconnnect@gmail.com">
                                            Request Payment Details <Mail className="ml-2 h-4 w-4" />
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Privacy Note */}
                <section className="py-12 bg-background border-t">
                    <div className="container mx-auto px-4 text-center">
                        <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
                            We take donor privacy seriously and carefully safeguard all data shared during the donation process.
                            Please refer to our <a href="https://services.dzaleka.com/privacy" className="text-primary hover:underline underline-offset-4">Privacy Policy</a> to learn more.
                        </p>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
