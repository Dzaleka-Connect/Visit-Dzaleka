import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Shield, Lock, Eye, Users, AlertTriangle, FileText, CheckCircle2,
    Smartphone, Wifi, Camera, MessageSquare, Database, Mail, Globe, ArrowLeft
} from "lucide-react";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";

// Structured Data for SEO
const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Information Technology Code of Practice",
    "description": "IT Code of Practice for Visit Dzaleka platform users covering acceptable use, data protection, privacy, and security guidelines.",
    "publisher": {
        "@type": "Organization",
        "name": "Visit Dzaleka",
        "url": "https://visit.dzaleka.com"
    }
};

export default function ITCodeOfPractice() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Information Technology Code of Practice | Visit Dzaleka"
                description="IT Code of Practice for Visit Dzaleka platform users. Guidelines for acceptable use, data protection, privacy, security, and responsible technology use."
                keywords="IT code of practice, acceptable use policy, data protection, privacy policy, Visit Dzaleka guidelines"
                canonical="https://visit.dzaleka.com/it-code-of-practice"
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
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Official Portal</span>
                            </div>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-4">
                        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
                        <Link href="/plan-your-trip" className="text-sm font-medium hover:text-primary transition-colors">Plan Your Trip</Link>
                        <Button asChild size="sm">
                            <Link href="/login">Sign In</Link>
                        </Button>
                    </nav>

                    <div className="md:hidden">
                        <Button asChild size="sm" variant="outline">
                            <Link href="/login">Sign In</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <div className="relative py-12 sm:py-16 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
                    <div className="container mx-auto px-4 max-w-4xl relative z-10">
                        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Sign In
                        </Link>
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="h-10 w-10 text-primary" />
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                                Information Technology Code of Practice
                            </h1>
                        </div>
                        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
                            Guidelines for responsible use of Visit Dzaleka's digital platforms and technology resources.
                            This Code applies to all users including visitors, guides, and administrators.
                        </p>
                        <p className="text-xs text-muted-foreground mt-4">
                            Last updated: January 2025
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl space-y-8">

                    {/* Introduction */}
                    <section>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Introduction
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                                <p>
                                    Information technology resources are essential for accomplishing Dzaleka Online Services' mission to connect visitors with Dzaleka Refugee Camp in a safe, ethical, and respectful manner.
                                </p>
                                <p>
                                    Members and users of the Visit Dzaleka community are granted shared access to these resources on condition they are used in accordance with this Information Technology Code of Practice. This Code applies irrespective of where the technology resources are accessed—including use at home, on mobile devices, or through public networks.
                                </p>
                                <p>
                                    You can expect sanctions, including account suspension or termination, if you act irresponsibly and disregard your obligations under this Code and the <a href="https://services.dzaleka.com/terms/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms and Conditions</a>.
                                </p>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Acceptable Use */}
                    <section>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    Acceptable Use
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    When using Visit Dzaleka's platforms and services, you agree to:
                                </p>
                                <ul className="space-y-3 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>Use the platform only for its intended purpose—booking tours, communicating with guides, and accessing visitor resources</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>Provide accurate personal information during registration and booking</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>Respect the privacy and dignity of Dzaleka residents in all communications and content shared</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>Keep your account credentials secure and not share them with others</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>Report any security vulnerabilities or suspicious activity immediately</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>Comply with all applicable laws of Malawi and your country of residence</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Prohibited Activities */}
                    <section>
                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="h-5 w-5" />
                                    Prohibited Activities
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    The following activities are strictly prohibited and may result in immediate account termination:
                                </p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                                        <h4 className="font-semibold text-sm text-destructive mb-2">Security Violations</h4>
                                        <ul className="text-xs text-muted-foreground space-y-1">
                                            <li>• Attempting to access unauthorized accounts or data</li>
                                            <li>• Sharing login credentials with unauthorized individuals</li>
                                            <li>• Attempting to bypass security controls or exploit vulnerabilities</li>
                                            <li>• Installing malicious software or code</li>
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                                        <h4 className="font-semibold text-sm text-destructive mb-2">Harmful Content</h4>
                                        <ul className="text-xs text-muted-foreground space-y-1">
                                            <li>• Posting discriminatory, threatening, or harassing content</li>
                                            <li>• Sharing content that exploits or endangers refugees</li>
                                            <li>• Distributing false or misleading information about Dzaleka</li>
                                            <li>• Uploading illegal, obscene, or defamatory material</li>
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                                        <h4 className="font-semibold text-sm text-destructive mb-2">Privacy Violations</h4>
                                        <ul className="text-xs text-muted-foreground space-y-1">
                                            <li>• Collecting personal data without consent</li>
                                            <li>• Sharing photos of identifiable residents without permission</li>
                                            <li>• Disclosing private information about guides or staff</li>
                                            <li>• Using platform data for unauthorized purposes</li>
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                                        <h4 className="font-semibold text-sm text-destructive mb-2">Commercial Misuse</h4>
                                        <ul className="text-xs text-muted-foreground space-y-1">
                                            <li>• Using the platform for unauthorized commercial activities</li>
                                            <li>• Spamming users with unsolicited messages or offers</li>
                                            <li>• Scraping data for external use</li>
                                            <li>• Impersonating guides, staff, or other users</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Data Protection */}
                    <section>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5 text-primary" />
                                    Data Protection & Privacy
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Visit Dzaleka is committed to protecting your personal data and the privacy of Dzaleka residents.
                                </p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Lock className="h-4 w-4 text-primary" />
                                            <h4 className="font-semibold text-sm">Data Security</h4>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            We use encryption, secure servers, and access controls to protect personal data. Booking information is stored securely and accessible only to authorized personnel.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Eye className="h-4 w-4 text-primary" />
                                            <h4 className="font-semibold text-sm">Your Rights</h4>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            You can request access to your data, corrections, or deletion by contacting us. Full details are in our <a href="https://services.dzaleka.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a>.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="h-4 w-4 text-primary" />
                                            <h4 className="font-semibold text-sm">Resident Privacy</h4>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Photos and personal information of Dzaleka residents must not be shared without explicit consent. This protects vulnerable individuals and their families.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Globe className="h-4 w-4 text-primary" />
                                            <h4 className="font-semibold text-sm">International Transfers</h4>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Data may be processed in Malawi and other countries. By using our services, you consent to this transfer with appropriate safeguards in place.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Device & Account Security */}
                    <section>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="h-5 w-5 text-primary" />
                                    Device & Account Security
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    You are responsible for maintaining the security of your account and any devices used to access Visit Dzaleka.
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                                        <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-sm">Strong Passwords</p>
                                            <p className="text-xs text-muted-foreground">Use unique, complex passwords of at least 8 characters</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                                        <Wifi className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-sm">Secure Networks</p>
                                            <p className="text-xs text-muted-foreground">Avoid booking or logging in on public, unsecured WiFi</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                                        <Smartphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-sm">Device Updates</p>
                                            <p className="text-xs text-muted-foreground">Keep your browser and device software up to date</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                                        <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-sm">Phishing Awareness</p>
                                            <p className="text-xs text-muted-foreground">We will never ask for your password via email</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Photography & Media */}
                    <section>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Camera className="h-5 w-5 text-primary" />
                                    Photography & Media Guidelines
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    If you share photos or media from your visit on the platform or social media:
                                </p>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span><strong className="text-foreground">Always ask permission</strong> before photographing identifiable individuals</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span><strong className="text-foreground">Never photograph children</strong> without explicit consent from their guardians</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span><strong className="text-foreground">Respect "no photo" requests</strong> immediately and without question</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span><strong className="text-foreground">Consider context</strong>—avoid portraying residents in a degrading or sensationalized manner</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span><strong className="text-foreground">Credit local artists</strong> when sharing their work or creations</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Communication */}
                    <section>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    Communication Standards
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    All communications through Visit Dzaleka should be:
                                </p>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                                        <p className="font-semibold text-sm text-foreground mb-1">Respectful</p>
                                        <p className="text-xs text-muted-foreground">Treat guides and staff with courtesy and professionalism</p>
                                    </div>
                                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                                        <p className="font-semibold text-sm text-foreground mb-1">Honest</p>
                                        <p className="text-xs text-muted-foreground">Provide accurate information in bookings and reviews</p>
                                    </div>
                                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                                        <p className="font-semibold text-sm text-foreground mb-1">Constructive</p>
                                        <p className="text-xs text-muted-foreground">Offer feedback that helps improve experiences</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Enforcement */}
                    <section>
                        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
                                    <AlertTriangle className="h-5 w-5" />
                                    Enforcement & Consequences
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-amber-700 dark:text-amber-300">
                                <p className="text-sm">
                                    Violations of this Code of Practice may result in:
                                </p>
                                <ul className="text-sm space-y-2">
                                    <li>• <strong>Warning</strong> — First minor violation with required acknowledgment</li>
                                    <li>• <strong>Temporary Suspension</strong> — Repeated violations or single serious incident</li>
                                    <li>• <strong>Permanent Ban</strong> — Severe violations or continued misconduct</li>
                                    <li>• <strong>Legal Action</strong> — Criminal activity may be reported to authorities</li>
                                </ul>
                                <p className="text-sm">
                                    We reserve the right to take action without prior notice in cases of serious misconduct.
                                </p>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Contact */}
                    <section>
                        <Card>
                            <CardContent className="p-6 text-center">
                                <h3 className="font-semibold text-lg mb-2">Questions or Concerns?</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    If you have questions about this Code of Practice or need to report a violation, contact us:
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <a href="mailto:info@mail.dzaleka.com" className="text-primary hover:underline text-sm">
                                        info@mail.dzaleka.com
                                    </a>
                                    <span className="hidden sm:inline text-muted-foreground">|</span>
                                    <a href="https://services.dzaleka.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                                        services.dzaleka.com
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Related Links */}
                    <section className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Button asChild variant="outline">
                            <a href="https://services.dzaleka.com/terms/" target="_blank" rel="noopener noreferrer">
                                Terms and Conditions
                            </a>
                        </Button>
                        <Button asChild variant="outline">
                            <a href="https://services.dzaleka.com/privacy/" target="_blank" rel="noopener noreferrer">
                                Privacy Policy
                            </a>
                        </Button>
                        <Button asChild>
                            <Link href="/login">Back to Sign In</Link>
                        </Button>
                    </section>

                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
