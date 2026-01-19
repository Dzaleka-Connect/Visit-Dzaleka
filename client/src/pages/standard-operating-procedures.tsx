import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer } from "lucide-react";
import { Link } from "wouter";

export default function StandardOperatingProcedures() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <SEO
                title="Standard Operating Procedures"
                description="Comprehensive SOPs for proper tourism operations in Dzaleka."
            />

            <div className="flex items-center gap-4 mb-6 print:hidden">
                <Link href="/operations-manual">
                    <Button variant="outline" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Manual
                    </Button>
                </Link>
                <div className="flex-1" />
                <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" /> Print SOP
                </Button>
            </div>

            <Card className="print:shadow-none print:border-none">
                <CardHeader className="border-b bg-muted/20 print:bg-transparent print:border-none">
                    <div className="text-center space-y-2">
                        <CardTitle className="text-3xl font-bold">Visit Dzaleka – Standard Operating Procedures (SOP)</CardTitle>
                        <p className="text-muted-foreground">Internal Document | Last Updated: January 2026</p>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8 print:p-0">

                    <section className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-6 bg-primary/5 p-6 rounded-lg border border-primary/10">
                            <div>
                                <h2 className="text-xl font-bold text-primary mb-2">Vision</h2>
                                <p className="italic text-muted-foreground">"Inspire meaningful connections between visitors and the resilient community of Dzaleka, supporting cultural preservation, learning, and community prosperity."</p>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-primary mb-2">Mission</h2>
                                <p className="italic text-muted-foreground">"Deliver safe, respectful, and engaging tours that provide income and skill-building for local guides, educate visitors about refugee life and culture, and promote dignity, empowerment, and community well-being."</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">1. Purpose</h2>
                        <p>This SOP outlines how Visit Dzaleka operates its tourism activities to deliver safe, respectful, community-led, and socially impactful experiences in Dzaleka Refugee Camp. It ensures consistency, accountability, and alignment with sustainable and responsible tourism principles as reflected on visit.dzaleka.com. It also serves as a practical guide for daily operations, staff training, and quality assurance.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">2. Scope</h2>
                        <p>This SOP applies to:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>All Visit Dzaleka staff, coordinators, and guides</li>
                            <li>Volunteers and contractors</li>
                            <li>Partner organisations and suppliers involved in tours and experiences</li>
                        </ul>
                        <p>It is also used as a reference for training, onboarding, and operational decision-making.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">3. Guiding Principles</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Community-led and refugee-driven tourism</li>
                            <li>Respect for dignity, culture, and privacy</li>
                            <li>Safety of visitors and residents</li>
                            <li>Fair income opportunities for guides and partners</li>
                            <li>Authentic storytelling, not poverty tourism</li>
                            <li>Continuous learning and improvement</li>
                            <li>Transparency and alignment with Visit Dzaleka’s publicly shared guidelines</li>
                            <li>Practical application in daily tour operations</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">3A. Social Impact Framework</h2>
                        <p>Visit Dzaleka exists to generate tangible, community-first social impact through tourism, consistent with the messaging and offerings on visit.dzaleka.com. Our impact focuses on five core areas and is actively measured during tour operations.</p>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="bg-muted/10 p-4 rounded-lg border">
                                <h3 className="font-semibold text-lg mb-2">3A.1 Economic Empowerment</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm mb-3">
                                    <li>Paid employment for refugee tour guides</li>
                                    <li>Income opportunities for local artists, vendors, and small businesses</li>
                                    <li>Transparent and timely payments</li>
                                </ul>
                                <p className="text-sm font-medium text-muted-foreground">Indicators:</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li>Number of guides engaged</li>
                                    <li>Total income generated for guides</li>
                                    <li>% of spend with local partners</li>
                                </ul>
                            </div>

                            <div className="bg-muted/10 p-4 rounded-lg border">
                                <h3 className="font-semibold text-lg mb-2">3A.2 Community Ownership & Voice</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm mb-3">
                                    <li>Tours co-designed with community members</li>
                                    <li>Community-approved narratives and routes</li>
                                    <li>Ongoing consultation with local leaders</li>
                                </ul>
                                <p className="text-sm font-medium text-muted-foreground">Indicators:</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li>Number of community consultations</li>
                                    <li>Community partners involved per tour</li>
                                </ul>
                            </div>

                            <div className="bg-muted/10 p-4 rounded-lg border">
                                <h3 className="font-semibold text-lg mb-2">3A.3 Ethical Storytelling & Dignity</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm mb-3">
                                    <li>Shift from charity-based narratives to lived experience and resilience</li>
                                    <li>Consent-led photography and media</li>
                                    <li>No exploitation or intrusion into private life</li>
                                </ul>
                                <p className="text-sm font-medium text-muted-foreground">Indicators:</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li>Consent compliance rate</li>
                                    <li>Media content approved vs rejected</li>
                                </ul>
                            </div>

                            <div className="bg-muted/10 p-4 rounded-lg border">
                                <h3 className="font-semibold text-lg mb-2">3A.4 Cultural Exchange & Awareness</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm mb-3">
                                    <li>Educating visitors about refugee life beyond stereotypes</li>
                                    <li>Creating space for dialogue, learning, and mutual respect</li>
                                    <li>Promoting African cultures, histories, and creativity</li>
                                </ul>
                                <p className="text-sm font-medium text-muted-foreground">Indicators:</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li>Visitor feedback scores</li>
                                    <li>Repeat or referral bookings</li>
                                </ul>
                            </div>

                            <div className="bg-muted/10 p-4 rounded-lg border md:col-span-2">
                                <h3 className="font-semibold text-lg mb-2">3A.5 Skills Development & Capacity Building</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm mb-3">
                                    <li>Training guides in communication, safety, and leadership</li>
                                    <li>Building pathways to future opportunities (media, tourism, advocacy)</li>
                                </ul>
                                <p className="text-sm font-medium text-muted-foreground">Indicators:</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li>Training sessions delivered</li>
                                    <li>Guides progressing to advanced roles</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">4. Roles & Responsibilities</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-bold">4.1 Operations Coordinator</h3>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Oversees daily tour operations</li>
                                    <li>Assigns guides and schedules tours</li>
                                    <li>Liaises with community leaders</li>
                                    <li>Handles incident reporting</li>
                                    <li>Uses SOP as a reference for operational decisions</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold">4.2 Tour Guides</h3>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Deliver tours according to approved itineraries</li>
                                    <li>Ensure visitor safety and respectful conduct</li>
                                    <li>Share accurate, community-approved narratives</li>
                                    <li>Report issues or incidents after tours</li>
                                    <li>Follow SOP checklists for daily tour execution</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold">4.3 Finance & Admin Lead</h3>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Manages payments and records</li>
                                    <li>Disburses guide payments promptly</li>
                                    <li>Tracks community contributions</li>
                                    <li>Uses SOP financial procedures for consistency</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold">4.4 Community Advisory Group (as applicable)</h3>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Provides cultural guidance</li>
                                    <li>Advises on sensitive areas or topics</li>
                                    <li>Supports dispute resolution</li>
                                    <li>Consults SOP for operational alignment</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">5. Tour Design & Approval</h2>

                        <h3 className="font-bold">5.1 Tour Development</h3>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Tours must be co-designed with community members.</li>
                            <li>Each tour must have:
                                <ul className="list-[circle] pl-6 mt-1">
                                    <li>Clear purpose and learning outcomes</li>
                                    <li>Defined route and duration</li>
                                    <li>Approved storytelling themes</li>
                                </ul>
                            </li>
                            <li>SOP checklists guide development.</li>
                        </ul>

                        <h3 className="font-bold mt-4">5.2 Approval Process</h3>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Draft itinerary reviewed by Operations Coordinator</li>
                            <li>Community leaders consulted where required</li>
                            <li>Final approval recorded before launch</li>
                            <li>SOP ensures consistent documentation</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">6. Booking & Visitor Management</h2>

                        <h3 className="font-bold">6.1 Bookings</h3>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>All bookings handled through approved channels</li>
                            <li>Visitor information collected: Full name, Contact details, Group size, Accessibility needs</li>
                            <li>Booking SOP checklists used to maintain consistency</li>
                        </ul>

                        <h3 className="font-bold mt-4">6.2 Pre-Visit Briefing</h3>
                        <p>Visitors receive:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Code of conduct</li>
                            <li>Photography and consent rules</li>
                            <li>Cultural etiquette guidelines</li>
                            <li>Safety and security briefing</li>
                            <li>Aligned with Visit Dzaleka’s public guidance</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">7. Guide Allocation & Preparation</h2>

                        <h3 className="font-bold">7.1 Guide Selection</h3>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Guides must be trained and approved</li>
                            <li>Priority given to local refugee guides</li>
                            <li>Selection reflects guide opportunities published online</li>
                            <li>SOP ensures fairness and training compliance</li>
                        </ul>

                        <h3 className="font-bold mt-4">7.2 Pre-Tour Checklist</h3>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Confirm route and meeting point</li>
                            <li>Confirm visitor numbers</li>
                            <li>Carry emergency contacts</li>
                            <li>Ensure identification is visible</li>
                            <li>Checklists from SOP used on each tour</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">8. Code of Conduct</h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg">
                                <h3 className="font-bold mb-2">8.1 Visitor Conduct</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li>Respect residents’ privacy and dignity</li>
                                    <li>Ask permission before taking photos or videos</li>
                                    <li>Follow guide instructions at all times</li>
                                    <li>Avoid exploitative or intrusive behaviour</li>
                                </ul>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
                                <h3 className="font-bold mb-2">8.2 Guide Conduct</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li>Be respectful, punctual, and professional</li>
                                    <li>Avoid political or inflammatory commentary</li>
                                    <li>Share balanced, factual, and community-approved narratives</li>
                                    <li>Prioritise safety at all times</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">9. Safety & Risk Management</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li><strong>9.1 Risk Assessment:</strong> Conduct regular risk assessments for tour routes; Identify health, security, and environmental risks.</li>
                            <li><strong>9.2 Incident Response:</strong> Ensure immediate safety; Contact Operations Coordinator; Document incident within 24 hours using SOP forms.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">10. Accessibility & Inclusion</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>SOP ensures adjustments for visitors with disabilities</li>
                            <li>Guides trained and follow SOP instructions</li>
                            <li>Accessibility info communicated during bookings</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">11. Community Engagement & Benefit Sharing</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li><strong>11.1 Local Partnerships:</strong> Prioritise local vendors, artists, and businesses; Promote community initiatives during tours.</li>
                            <li><strong>11.2 Revenue Distribution:</strong> Transparent guide payment structure; Portion of revenue allocated to community initiatives; SOP ensures documentation.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">12. Photography, Media & Storytelling</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>SOP ensures consent, review, and ethical storytelling</li>
                            <li>Guides use SOP checklists before capturing or publishing media</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">13. Payments & Financial Handling</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>SOP guides daily financial operations</li>
                            <li>Payments accepted through approved methods</li>
                            <li>Guides paid within agreed timelines</li>
                            <li>Records maintained securely</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">14. Monitoring, Feedback & Reporting</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li><strong>14.1 Visitor Feedback:</strong> Feedback collected after each tour; documented and reviewed.</li>
                            <li><strong>14.2 Impact Tracking:</strong> Track tours, visitors, income, partnerships. Metrics aligned with social impact framework.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">15. Continuous Improvement</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Quarterly internal review of operations</li>
                            <li>SOP updated annually or as required</li>
                            <li>Community feedback integrated into updates</li>
                            <li>Guides and staff trained using SOP checklists</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg text-sm">
                            <h2 className="font-bold uppercase text-muted-foreground mb-2">16. Review & Approval</h2>
                            <p><strong>SOP Owner:</strong> Visit Dzaleka Management</p>
                            <p><strong>Review Cycle:</strong> Annual</p>
                            <p><strong>Last Updated:</strong> January 2026</p>
                            <p className="mt-4 italic">
                                This SOP ensures Visit Dzaleka operates responsibly, ethically, and in a way that uplifts the community while offering meaningful experiences to visitors. It is also a practical tool for guides and staff to follow day-to-day, ensuring consistent application of standards and alignment with publicly shared practices.
                            </p>
                        </div>
                    </section>

                </CardContent>
            </Card>
        </div>
    );
}
