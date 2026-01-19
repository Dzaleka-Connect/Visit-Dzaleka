import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer, Megaphone } from "lucide-react";
import { Link } from "wouter";

export default function MarketingStrategy() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <SEO
                title="Marketing Strategy"
                description="Internal marketing and promotion strategy for Visit Dzaleka."
            />

            <div className="flex items-center gap-4 mb-6 print:hidden">
                <Link href="/operations-manual">
                    <Button variant="outline" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Manual
                    </Button>
                </Link>
                <div className="flex-1" />
                <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" /> Print Strategy
                </Button>
            </div>

            <Card className="print:shadow-none print:border-none">
                <CardHeader className="border-b bg-muted/20 print:bg-transparent print:border-none">
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-2">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <Megaphone className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold">Visit Dzaleka – Marketing & Promotion Strategy</CardTitle>
                        <p className="text-muted-foreground">Strategic Roadmap | Last Updated: January 2026</p>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8 print:p-0">

                    {/* 1. Purpose */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">1. Purpose</h2>
                        <ul className="list-disc pl-6 space-y-1 text-lg">
                            <li>Raise awareness of Visit Dzaleka tours and experiences.</li>
                            <li>Attract ethical, engaged visitors while maintaining community integrity.</li>
                            <li>Promote the social impact and cultural storytelling of the camp.</li>
                        </ul>
                    </section>

                    {/* 2. Target Audience */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">2. Target Audience</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-muted/10 rounded-lg border">
                                <h3 className="font-bold mb-1">Cultural Tourists</h3>
                                <p className="text-sm text-muted-foreground">Interested in authentic African culture, refugee stories, and meaningful travel.</p>
                            </div>
                            <div className="p-4 bg-muted/10 rounded-lg border">
                                <h3 className="font-bold mb-1">Educational Groups</h3>
                                <p className="text-sm text-muted-foreground">Schools, universities, and research organizations looking for field visits.</p>
                            </div>
                            <div className="p-4 bg-muted/10 rounded-lg border">
                                <h3 className="font-bold mb-1">NGOs & Social Impact</h3>
                                <p className="text-sm text-muted-foreground">Organizations interested in community development and humanitarian work.</p>
                            </div>
                            <div className="p-4 bg-muted/10 rounded-lg border">
                                <h3 className="font-bold mb-1">Travel Enthusiasts</h3>
                                <p className="text-sm text-muted-foreground">Visitors looking for unique, off-the-beaten-path, ethical travel experiences.</p>
                            </div>
                        </div>
                    </section>

                    {/* 3. Branding & Positioning */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">3. Branding & Positioning</h2>
                        <div className="space-y-3">
                            <div>
                                <h3 className="font-bold inline">Brand Message: </h3>
                                <span>Community-led, ethical tourism that uplifts and empowers.</span>
                            </div>
                            <div>
                                <h3 className="font-bold inline">Visual Identity: </h3>
                                <span>Consistent logo, vibrant color scheme, and high-quality imagery aligned with dignity and culture.</span>
                            </div>
                            <div>
                                <h3 className="font-bold inline">Tone of Voice: </h3>
                                <span>Friendly, informative, respectful, and inspiring.</span>
                            </div>
                        </div>
                    </section>

                    {/* 4. Marketing Channels */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">4. Marketing Channels</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Website:</strong> <span className="text-primary font-medium">visit.dzaleka.com</span> — primary booking and information hub.</li>
                            <li><strong>Social Media:</strong> Facebook, Instagram, LinkedIn, TikTok — showcase stories, guides, and cultural experiences.</li>
                            <li><strong>Email Marketing:</strong> Newsletters for partners, past visitors, and schools.</li>
                            <li><strong>Partnerships:</strong> Collaborate with NGOs, universities, travel agencies, and cultural organizations.</li>
                            <li><strong>Media & PR:</strong> Highlight social impact, cultural events, and success stories in local and international press.</li>
                        </ul>
                    </section>

                    {/* 5. Content Strategy */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">5. Content Strategy</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Storytelling:</strong> Focus on resilience, community-led initiatives, and authentic experiences (not poverty/sympathy).</li>
                                <li><strong>Guides & Community:</strong> Feature guides’ profiles, local artisans, and community projects.</li>
                            </ul>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Events & Festivals:</strong> Promote cultural events like workshops, art markets, and the Tumaini Festival.</li>
                                <li><strong>Visitor Testimonials:</strong> Showcase experiences and positive feedback to build trust.</li>
                            </ul>
                        </div>
                    </section>

                    {/* 6. Promotions & Campaigns */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">6. Promotions & Campaigns</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Seasonal Campaigns:</strong> Highlight tours during festivals or school holidays.</li>
                            <li><strong>Referral Programs:</strong> Encourage repeat visits and visitor referrals with small incentives.</li>
                            <li><strong>Educational Packages:</strong> Special custom itineraries for schools and university groups.</li>
                            <li><strong>Fundraising & Social Impact:</strong> Clearly show how visiting supports the refugee community and local economy.</li>
                        </ul>
                    </section>

                    {/* 7. Monitoring & Evaluation */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-primary border-b pb-2">7. Monitoring & Evaluation</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Track website traffic, bookings, and social media engagement analytics.</li>
                            <li>Measure campaign ROI and track visitor inquiry sources ("How did you hear about us?").</li>
                            <li>Collect visitor feedback surveys to improve messaging and promotions.</li>
                            <li>Regularly adjust marketing strategies based on trends, booking data, and community input.</li>
                        </ul>
                    </section>
                </CardContent>
            </Card>
        </div>
    );
}
