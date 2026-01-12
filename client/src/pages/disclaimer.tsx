import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Users, MapPin, AlertTriangle, Scale } from "lucide-react";

export default function Disclaimer() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Disclaimer"
                description="Important information about Visit Dzaleka tours, liability, and terms of use."
                canonical="https://visit.dzaleka.com/disclaimer"
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

                <h1 className="text-4xl font-bold tracking-tight mb-8">Disclaimer</h1>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="text-lg text-muted-foreground mb-8">
                        Please read this disclaimer carefully before using the Visit Dzaleka platform or participating in any tours.
                    </p>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-2xl font-semibold m-0">About Visit Dzaleka</h2>
                        </div>
                        <p>
                            Visit Dzaleka is a community-led tourism initiative that connects visitors with local guides residing in Dzaleka Refugee Camp, located in Dowa District, Malawi. Our platform facilitates cultural exchange experiences, guided tours, and authentic engagement with the refugee community.
                        </p>
                        <p>
                            We operate as part of <a href="https://services.dzaleka.com" className="text-primary hover:underline">Dzaleka Online Services</a>, a digital ecosystem supporting refugee-led initiatives and community development.
                        </p>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-2xl font-semibold m-0">Safety & Coordination</h2>
                        </div>
                        <p>
                            All tours are conducted in coordination with camp authorities, UNHCR guidelines, and local security protocols. Our guides are trained community members who understand and adhere to all applicable regulations.
                        </p>
                        <ul>
                            <li>Tours follow established routes and safety procedures</li>
                            <li>Visitors must comply with camp entry requirements</li>
                            <li>Photography and recording may be restricted in certain areas</li>
                            <li>Guides are authorized to modify or cancel tours for safety reasons</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-2xl font-semibold m-0">Tour Availability</h2>
                        </div>
                        <p>
                            Tour availability is subject to camp access regulations and may change without prior notice due to:
                        </p>
                        <ul>
                            <li>Security considerations</li>
                            <li>Weather conditions</li>
                            <li>Official camp activities or events</li>
                            <li>Public health measures</li>
                            <li>Guide availability</li>
                        </ul>
                        <p>
                            We will make reasonable efforts to notify you of any changes to your booking, but cannot guarantee uninterrupted service.
                        </p>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h2 className="text-2xl font-semibold m-0">Limitation of Liability</h2>
                        </div>
                        <p>
                            While we take every reasonable precaution to ensure visitor safety, participation in tours is at your own risk. Visit Dzaleka, its operators, guides, and affiliates shall not be held liable for:
                        </p>
                        <ul>
                            <li>Personal injury, illness, or death during tours</li>
                            <li>Loss, theft, or damage to personal property</li>
                            <li>Delays, cancellations, or itinerary changes</li>
                            <li>Actions or conduct of third parties</li>
                            <li>Force majeure events beyond our control</li>
                        </ul>
                        <p>
                            We strongly recommend that all visitors obtain comprehensive travel insurance before participating in any tour.
                        </p>
                    </section>

                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Scale className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-2xl font-semibold m-0">Visitor Conduct</h2>
                        </div>
                        <p>
                            By booking a tour, you agree to:
                        </p>
                        <ul>
                            <li>Respect the dignity, privacy, and culture of camp residents</li>
                            <li>Follow all instructions from guides and camp authorities</li>
                            <li>Obtain consent before photographing or recording individuals</li>
                            <li>Refrain from distributing money, gifts, or items to residents without coordination</li>
                            <li>Not engage in any illegal activities</li>
                            <li>Dress appropriately and behave respectfully</li>
                        </ul>
                        <p>
                            Failure to comply may result in immediate termination of your tour without refund.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Accuracy of Information</h2>
                        <p>
                            We strive to provide accurate and up-to-date information on our platform. However, we do not warrant that all content is complete, accurate, or current. Information about camp demographics, services, and experiences may change over time.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Third-Party Links</h2>
                        <p>
                            Our platform may contain links to third-party websites. We are not responsible for the content, privacy policies, or practices of any external sites. Accessing third-party links is at your own discretion and risk.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Changes to This Disclaimer</h2>
                        <p>
                            We reserve the right to update or modify this disclaimer at any time without prior notice. Continued use of our platform after any changes constitutes acceptance of the updated terms.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                        <p>
                            If you have any questions about this disclaimer, please contact us at:
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
