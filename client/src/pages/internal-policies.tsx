import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer } from "lucide-react";
import { Link } from "wouter";

export default function InternalPolicies() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <SEO
                title="Internal Policies"
                description="Official internal policies for Visit Dzaleka staff and stakeholders."
            />

            <div className="flex items-center gap-4 mb-6 print:hidden">
                <Link href="/operations-manual">
                    <Button variant="outline" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Manual
                    </Button>
                </Link>
                <div className="flex-1" />
                <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" /> Print Policies
                </Button>
            </div>

            <Card className="print:shadow-none print:border-none">
                <CardHeader className="border-b bg-muted/20 print:bg-transparent print:border-none">
                    <div className="text-center space-y-2">
                        <CardTitle className="text-3xl font-bold">Visit Dzaleka – Internal Policies & Compliance</CardTitle>
                        <p className="text-muted-foreground">Official Operational Standards | Last Updated: January 2026</p>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8 print:p-0">

                    {/* 1. Health & Safety Policy */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">1. Health & Safety Policy</h2>
                        <p><strong>Goal:</strong> To ensure the physical and mental well-being of all visitors, staff, guides, and community members during Visit Dzaleka operations.</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Risk Assessments:</strong> All tour routes and activities must undergo a documented risk assessment, reviewed quarterly.</li>
                            <li><strong>Emergency Preparedness:</strong> All guides must carry a charged mobile phone with emergency contacts (Security, Medical, Police) saved.</li>
                            <li><strong>Incident Reporting:</strong> Any accident, injury, or safety threat must be reported to the Operations Coordinator immediately and documented within 24 hours.</li>
                            <li><strong>Visitor Briefing:</strong> Safety briefings are mandatory at the start of every tour.</li>
                        </ul>
                    </section>

                    {/* 2. Code of Conduct Policy */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">2. Code of Conduct Policy</h2>
                        <p><strong>Goal:</strong> To maintain the highest standards of professionalism, integrity, and ethical behaviour.</p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg">
                                <h3 className="font-bold mb-2">Professionalism</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li>Staff and guides must present themselves professionally (punctual, neat appearance).</li>
                                    <li>Zero tolerance for alcohol or substance use during working hours.</li>
                                    <li>Clear and respectful communication with all stakeholders.</li>
                                </ul>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg">
                                <h3 className="font-bold mb-2">Ethical Boundaries</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li>Strict prohibition on requesting personal gifts or financial aid from visitors outside of agreed tour fees.</li>
                                    <li>Conflict of interest must be declared immediately.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* 3. Anti-Harassment & Equality Policy */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">3. Anti-Harassment & Equality Policy</h2>
                        <p><strong>Goal:</strong> To provide a safe environment free from discrimination and harassment.</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Zero Tolerance:</strong> We do not tolerate harassment, bullying, or discrimination based on nationality, tribe, religion, gender, disability, or sexual orientation.</li>
                            <li><strong>Protection of Vulnerable Groups:</strong> Special attention is paid to the safety of women, children, and minority groups within the camp during our operations.</li>
                            <li><strong>Reporting Mechanism:</strong> Any instance of harassment must be reported confidentially to the Management Team. Whistleblowers will be protected.</li>
                        </ul>
                    </section>

                    {/* 4. Financial & Payments Policy */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">4. Financial & Payments Policy</h2>
                        <p><strong>Goal:</strong> To ensure transparency, security, and fairness in all financial transactions.</p>
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg">Direct Payment Model</h3>
                            <p>For most standard tours, visitors pay guides directly. This ensures immediate income for the community.</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li><strong>Accepted Methods:</strong> Cash (MWK/USD) or Mobile Money (Airtel Money/Mpamba).</li>
                                <li><strong>Timing:</strong> Payments are typically collected at the <strong>start</strong> or <strong>end</strong> of the tour, as per the booking confirmation.</li>
                                <li><strong>Receipts:</strong> Guides must provide a digital or written acknowledgement of receipt if requested.</li>
                                <li><strong>Transparency:</strong> Guides must strictly adhere to the pricing structure listed on the booking. Overcharging is a serious disciplinary offence.</li>
                            </ul>
                            <h3 className="font-semibold text-lg mt-2">Platform & Impact Fees</h3>
                            <p>If a booking involves a platform or impact fee (for community projects), this must be remitted by the guide to the Finance Lead within 24 hours of the tour.</p>
                        </div>
                    </section>

                    {/* 5. Media & Photography Policy */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">5. Media & Photography Policy</h2>
                        <p><strong>Goal:</strong> To protect the dignity and privacy of Dzaleka residents.</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Informed Consent:</strong> Photos/Videos of individuals require explicit verbal consent.</li>
                            <li><strong>Safeguarding Minors:</strong> Strict prohibition on photographing children without a parent/guardian's explicit permission.</li>
                            <li><strong>Sensitive Areas:</strong> No photography of security installations, UNHCR processing centres, or private homes without permission.</li>
                            <li><strong>Commercial Use:</strong> Commercial filming requires a specific permit and agreement on benefit sharing.</li>
                        </ul>
                    </section>

                    {/* 6. Data Privacy Policy */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">6. Data Privacy Policy</h2>
                        <p><strong>Goal:</strong> To responsibly handle visitor and staff personal data.</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Collection:</strong> We only collect data necessary for operations (Name, Contact, Emergency details).</li>
                            <li><strong>Storage:</strong> Visitor data is stored securely in the Dzaleka Visit admin system. Hard copies are destroyed after use.</li>
                            <li><strong>Sharing:</strong> No data is sold or shared with third parties without consent, except for security clearances required by Camp Administration.</li>
                        </ul>
                    </section>

                    {/* 7. Accessibility & Inclusion Policy */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">7. Accessibility & Inclusion Policy</h2>
                        <p><strong>Goal:</strong> To make Dzaleka accessible to visitors of all abilities.</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Reasonable Adjustments:</strong> We will make every effort to adapt tour routes and pacing for visitors with mobility, sensory, or cognitive impairments.</li>
                            <li><strong>Non-Discrimination:</strong> We welcome visitors from all backgrounds and perform our duties without bias.</li>
                            <li><strong>Information:</strong> Detailed accessibility information (terrain, distance) will be provided pre-booking.</li>
                        </ul>
                    </section>

                    {/* 8. Environmental Sustainability Policy */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">8. Environmental Sustainability Policy</h2>
                        <p><strong>Goal:</strong> To minimise our ecological footprint on the camp environment.</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Leave No Trace:</strong> Visitors and guides must take all litter with them.</li>
                            <li><strong>Plastic Reduction:</strong> promoting the use of reusable water bottles over single-use plastics.</li>
                            <li><strong>Respect for Resources:</strong> Mindful usage of water and local resources during tours.</li>
                        </ul>
                    </section>

                </CardContent>
            </Card>
        </div>
    );
}

