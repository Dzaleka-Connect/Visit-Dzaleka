import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cookie, Eye, Settings, Clock, Shield, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CookieNotice() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Cookie Notice"
                description="Information about how Visit Dzaleka uses cookies and similar technologies."
                canonical="https://visit.dzaleka.com/cookie-notice"
            />

            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center px-4">
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
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
                <Button asChild variant="ghost" size="sm" className="mb-8 -ml-4">
                    <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
                </Button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Cookie className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Cookie Notice</h1>
                        <p className="text-muted-foreground mt-1">How we use cookies and similar technologies</p>
                    </div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="text-lg text-muted-foreground mb-8">
                        This Cookie Notice explains how Visit Dzaleka uses cookies and similar technologies to recognize you when you visit our platform. It explains what these technologies are, why we use them, and your rights to control our use of them.
                    </p>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">What Are Cookies?</h2>
                        <p>
                            Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently, provide a better user experience, and give website owners information about how their site is being used.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Types of Cookies We Use</h2>

                        <div className="grid gap-4 md:grid-cols-2 not-prose mb-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Shield className="h-5 w-5 text-green-600" />
                                        Essential Cookies
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <p>Required for the platform to function properly. These cannot be disabled.</p>
                                    <ul className="mt-2 space-y-1">
                                        <li>• Session management</li>
                                        <li>• Authentication</li>
                                        <li>• Security tokens</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Eye className="h-5 w-5 text-blue-600" />
                                        Analytics Cookies
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <p>Help us understand how visitors interact with our platform.</p>
                                    <ul className="mt-2 space-y-1">
                                        <li>• Page view tracking</li>
                                        <li>• Session duration</li>
                                        <li>• Traffic sources</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Settings className="h-5 w-5 text-purple-600" />
                                        Functional Cookies
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <p>Enable enhanced functionality and personalization.</p>
                                    <ul className="mt-2 space-y-1">
                                        <li>• Theme preferences</li>
                                        <li>• Language settings</li>
                                        <li>• User preferences</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Clock className="h-5 w-5 text-orange-600" />
                                        Session Storage
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <p>Temporary data stored during your browsing session.</p>
                                    <ul className="mt-2 space-y-1">
                                        <li>• Form data</li>
                                        <li>• Booking progress</li>
                                        <li>• Navigation state</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">How We Use Cookies</h2>
                        <p>We use cookies for the following purposes:</p>
                        <ul>
                            <li><strong>Authentication:</strong> To keep you signed in and secure your session</li>
                            <li><strong>Preferences:</strong> To remember your settings and preferences</li>
                            <li><strong>Analytics:</strong> To understand how visitors use our platform and improve our services</li>
                            <li><strong>Performance:</strong> To optimize the speed and functionality of our website</li>
                            <li><strong>Security:</strong> To protect against fraud and unauthorized access</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Our Analytics Approach</h2>
                        <p>
                            Visit Dzaleka uses <strong>first-party analytics</strong> to track page views and visitor behavior. This means:
                        </p>
                        <ul>
                            <li>We do not use third-party tracking services like Google Analytics</li>
                            <li>Your data stays on our servers and is not shared with external parties</li>
                            <li>We collect anonymized data including page views, device type, and referral sources</li>
                            <li>We use session identifiers (not personal identifiers) to understand usage patterns</li>
                        </ul>
                        <p>
                            This data helps us improve our platform, understand which content is most helpful, and enhance your experience.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Third-Party Cookies</h2>
                        <p>
                            Our platform may include content from third-party services that set their own cookies:
                        </p>
                        <ul>
                            <li><strong>YouTube:</strong> Embedded videos may set cookies for playback and analytics</li>
                            <li><strong>Social Media:</strong> Share buttons may set cookies if you interact with them</li>
                            <li><strong>Payment Processors:</strong> When making payments, third-party services may set cookies</li>
                        </ul>
                        <p>
                            We do not control these third-party cookies. Please refer to their respective privacy policies for more information.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Managing Cookies</h2>
                        <p>
                            You can control and manage cookies in several ways:
                        </p>
                        <ul>
                            <li><strong>Browser Settings:</strong> Most browsers allow you to refuse or accept cookies through their settings</li>
                            <li><strong>Delete Cookies:</strong> You can delete existing cookies through your browser</li>
                            <li><strong>Private Browsing:</strong> Use private/incognito mode to limit cookie storage</li>
                        </ul>
                        <p>
                            Please note that disabling essential cookies may affect the functionality of our platform, including your ability to log in or complete bookings.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Cookie Retention</h2>
                        <p>
                            Different cookies have different lifespans:
                        </p>
                        <ul>
                            <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
                            <li><strong>Persistent cookies:</strong> Remain until they expire or you delete them</li>
                            <li><strong>Authentication cookies:</strong> Typically last for 7-30 days depending on your login preferences</li>
                            <li><strong>Analytics session ID:</strong> Expires after 24 hours of inactivity</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Updates to This Notice</h2>
                        <p>
                            We may update this Cookie Notice from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We encourage you to review this page periodically for the latest information.
                        </p>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <Mail className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl font-semibold m-0">Contact Us</h2>
                        </div>
                        <p>
                            If you have any questions about our use of cookies or this notice, please contact us at:
                        </p>
                        <ul>
                            <li>Email: <a href="mailto:info@mail.dzaleka.com" className="text-primary hover:underline">info@mail.dzaleka.com</a></li>
                            <li>Website: <a href="https://services.dzaleka.com" className="text-primary hover:underline">services.dzaleka.com</a></li>
                        </ul>
                    </section>

                    <div className="border-t pt-8 mt-12">
                        <p className="text-sm text-muted-foreground">
                            Last updated: January 2026
                        </p>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
