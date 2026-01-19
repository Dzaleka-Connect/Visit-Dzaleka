import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer, RefreshCw } from "lucide-react";
import { Link } from "wouter";

export default function ContinuousImprovement() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <SEO
                title="Continuous Improvement Framework"
                description="Framework for ongoing quality assurance and social impact operational improvements."
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
                                <RefreshCw className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold">Visit Dzaleka – Continuous Improvement Framework</CardTitle>
                        <p className="text-muted-foreground">Quality Assurance & Impact Growth | Last Updated: January 2026</p>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8 print:p-0">

                    {/* 1. Purpose */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">1. Purpose</h2>
                        <ul className="list-disc pl-6 space-y-1 text-lg">
                            <li>Ensure tours, operations, and community engagement remain high-quality, safe, and socially impactful.</li>
                            <li>Integrate visitor and community feedback into ongoing improvements.</li>
                            <li>Strengthen guide skills, operational efficiency, and overall visitor experience.</li>
                        </ul>
                    </section>

                    {/* 2. Key Components */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">2. Key Components</h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold">2.1 Monitoring & Evaluation</h3>
                                <p className="text-sm font-medium text-muted-foreground">Regularly track KPIs from the Social Impact Framework:</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm bg-muted/10 p-3 rounded text-muted-foreground">
                                    <li>Number of tours conducted & Visitors hosted</li>
                                    <li>Guide income generated</li>
                                    <li>Community partnerships supported</li>
                                </ul>
                                <p className="text-sm font-medium text-muted-foreground mt-2">Review operational metrics:</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm bg-muted/10 p-3 rounded text-muted-foreground">
                                    <li>Tour punctuality</li>
                                    <li>Safety incident reports</li>
                                    <li>Guide performance and visitor feedback</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-bold">2.2 Feedback Collection</h3>
                                <ul className="list-disc pl-5 space-y-2 text-sm">
                                    <li><strong>Visitor Feedback:</strong> Surveys, reviews, post-tour interviews.</li>
                                    <li><strong>Guide Feedback:</strong> Regular debrief sessions to capture challenges and suggestions.</li>
                                    <li><strong>Community Feedback:</strong> Consult community leaders and advisory groups on tour content and cultural impact.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold">2.3 Analysis & Reporting</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Compare performance against targets and KPIs.</li>
                                <li>Identify trends, gaps, and areas for improvement.</li>
                                <li>Produce quarterly and annual internal reports for management and community stakeholders.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold">2.4 Training & Development</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Use feedback and monitoring results to identify training needs.</li>
                                <li>Conduct refresher courses and skill upgrades for guides and staff.</li>
                                <li>Develop advanced modules in storytelling, safety, or customer service based on gaps.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold">2.5 SOP & Policy Updates</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Integrate lessons learned into SOPs, policies, and training manuals.</li>
                                <li>Update operational procedures annually or as required.</li>
                                <li>Ensure all updates are communicated to staff and guides promptly.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold">2.6 Innovation & Experimentation</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Test new tour formats, routes, or experiences based on visitor and community input.</li>
                                <li>Evaluate the impact of changes before full implementation.</li>
                                <li>Document successes and lessons for future iterations.</li>
                            </ul>
                        </div>
                    </section>

                    {/* 3. Responsibility */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">3. Responsibility</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-muted/10 rounded-lg">
                                <h3 className="font-bold">Operations Coordinator</h3>
                                <p className="text-sm text-muted-foreground">Leads daily improvement checks and debriefs.</p>
                            </div>
                            <div className="p-4 bg-muted/10 rounded-lg">
                                <h3 className="font-bold">Guides & Staff</h3>
                                <p className="text-sm text-muted-foreground">Provide frontline feedback and suggestions.</p>
                            </div>
                            <div className="p-4 bg-muted/10 rounded-lg">
                                <h3 className="font-bold">Management Team</h3>
                                <p className="text-sm text-muted-foreground">Reviews reports, approves changes, and allocates resources.</p>
                            </div>
                            <div className="p-4 bg-muted/10 rounded-lg">
                                <h3 className="font-bold">Community Advisory Group</h3>
                                <p className="text-sm text-muted-foreground">Advises on cultural appropriateness and impact.</p>
                            </div>
                        </div>
                    </section>

                    {/* 4. Review Cycle */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">4. Review Cycle</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><span className="font-bold text-primary">Daily:</span> Quick debrief after each tour.</li>
                            <li><span className="font-bold text-primary">Quarterly:</span> Full operational review including KPIs, training, and feedback analysis.</li>
                            <li><span className="font-bold text-primary">Annually:</span> Comprehensive review of SOPs, policies, training programs, and social impact.</li>
                        </ul>
                    </section>

                </CardContent>
            </Card>
        </div>
    );
}
