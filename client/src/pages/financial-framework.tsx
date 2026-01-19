import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer, Banknote } from "lucide-react";
import { Link } from "wouter";

export default function FinancialFramework() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <SEO
                title="Financial Management Framework"
                description="Framework for transparent and accountable financial operations."
            />

            <div className="flex items-center gap-4 mb-6 print:hidden">
                <Link href="/operations-manual">
                    <Button variant="outline" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Manual
                    </Button>
                </Link>
                <div className="flex-1" />
                <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" /> Print Framework
                </Button>
            </div>

            <Card className="print:shadow-none print:border-none">
                <CardHeader className="border-b bg-muted/20 print:bg-transparent print:border-none">
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-2">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <Banknote className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold">Visit Dzaleka – Financial Management Framework</CardTitle>
                        <p className="text-muted-foreground">Transparency & Sustainability | Last Updated: January 2026</p>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8 print:p-0">

                    {/* 1. Purpose */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">1. Purpose</h2>
                        <ul className="list-disc pl-6 space-y-1 text-lg">
                            <li>Ensure all financial operations are transparent, accurate, and accountable.</li>
                            <li>Protect funds for community benefit, guide payments, and operational sustainability.</li>
                            <li>Provide a clear system for reporting, monitoring, and auditing finances.</li>
                        </ul>
                    </section>

                    {/* 2. Key Components */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">2. Key Components</h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold">2.1 Revenue Management</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li><strong>Tour Fees:</strong> Track all bookings and payments received.</li>
                                    <li><strong>Payment Methods:</strong> Accept mobile money (Airtel Money, TNM Mpamba), cash, or via <a href="https://www.getyourguide.com/mbalame-l265219/dzaleka-refugee-camp-guided-walking-tour-t1188868/" target="_blank" rel="noopener noreferrer" className="text-primary underline">GetYourGuide</a>.</li>
                                    <li><strong>Revenue Allocation:</strong> Currently guides receive 100% of tour income. Future model may shift to 60% guides / 40% operations as the program scales.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-bold">2.2 Guide & Staff Payments</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li><strong>Direct Bookings:</strong> Guides paid per tour upon completion.</li>
                                    <li><strong>GetYourGuide:</strong> Payments processed bi-weekly or monthly depending on platform payout schedule.</li>
                                    <li><strong>Transparent Records:</strong> Payment logs maintained in internal systems (Revenue page).</li>
                                </ul>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold">2.3 Expense Management</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li><strong>Current Expenses:</strong> Web hosting, domain, and technology infrastructure.</li>
                                    <li><strong>Future Expenses:</strong> Marketing, transport, supplies, events as program grows.</li>
                                    <li><strong>Documentation:</strong> Track all expenses in the Revenue page for transparency.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-bold">2.4 Budgeting & Planning</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li>Develop an annual budget aligned with tour operations, training, marketing, and community initiatives.</li>
                                    <li>Review actual spending vs. budget monthly or quarterly.</li>
                                    <li>Adjust allocations based on performance, social impact, or seasonal changes.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold">2.5 Financial Reporting</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li><strong>Internal Reports:</strong> Monthly revenue and expense statements for management review.</li>
                                <li><strong>Impact Reports:</strong> Track income generated for guides, community contributions, and social impact metrics.</li>
                                <li><strong>Audit Readiness:</strong> Maintain all records for external audits or partner verification.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold">2.6 Compliance & Security</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Follow local financial regulations and laws.</li>
                                <li>Protect cash and digital transactions with secure handling and documentation.</li>
                                <li>Implement checks to prevent errors, fraud, or misuse of funds.</li>
                            </ul>
                        </div>
                    </section>

                    {/* 3. Responsibility */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">3. Responsibility</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-muted/10 rounded-lg">
                                <h3 className="font-bold">Operations Coordinator</h3>
                                <p className="text-sm text-muted-foreground">Oversees all financial processes, record-keeping, tour income logging, and guide payments.</p>
                            </div>
                            <div className="p-4 bg-muted/10 rounded-lg">
                                <h3 className="font-bold">Guides</h3>
                                <p className="text-sm text-muted-foreground">Report completed tours and receive payments through agreed channels.</p>
                            </div>
                        </div>
                    </section>

                </CardContent>
            </Card>
        </div>
    );
}
