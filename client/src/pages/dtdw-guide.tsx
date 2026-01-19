import { SEO } from "@/components/seo";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
    Database,
    MapPin,
    Image as ImageIcon,
    FileText,
    Video,
    Tag,
    CheckCircle2,
    Lightbulb,
    ArrowRight,
    ArrowLeft,
    Globe,
    Star,
    MessageSquare,
    ExternalLink,
    Share2
} from "lucide-react";
import { Link } from "wouter";

export default function DTDWGuide() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <SEO
                title="DTDW Guide"
                description="Learn how to create a high-quality listing on the Dzaleka Tourism Data Warehouse."
            />

            {/* Back Button */}
            <Link href="/operations-manual">
                <Button variant="outline" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Manual
                </Button>
            </Link>

            {/* Hero Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">DTDW Listing Guide</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        How to create and maintain tour listings in the system.
                    </p>
                </div>
                <Link href="/bookings">
                    <Button size="lg" className="gap-2">
                        Go to Bookings <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* What is DTDW Card */}
                <Card className="md:col-span-2 bg-primary/5 border-primary/20">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Database className="h-6 w-6 text-primary" />
                            <CardTitle>About the DTDW</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="leading-relaxed">
                            The <strong>Dzaleka Tourism Data Warehouse (DTDW)</strong> is our internal system
                            for managing tour data. Information entered here syncs to our website, GetYourGuide,
                            and partner booking widgets.
                        </p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                            <div className="flex flex-col gap-2 p-4 bg-background rounded-lg border">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <h3 className="font-semibold">Single Source</h3>
                                <p className="text-xs text-muted-foreground">Update once, syncs everywhere.</p>
                            </div>
                            <div className="flex flex-col gap-2 p-4 bg-background rounded-lg border">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <h3 className="font-semibold">Auto-Distribution</h3>
                                <p className="text-xs text-muted-foreground">Pushes to website, GYG, and embeds.</p>
                            </div>
                            <div className="flex flex-col gap-2 p-4 bg-background rounded-lg border">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <h3 className="font-semibold">Data Accuracy</h3>
                                <p className="text-xs text-muted-foreground">Keeps all channels consistent.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Writing Description */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <CardTitle>Writing Tour Descriptions</CardTitle>
                        </div>
                        <CardDescription>Guidelines for listing text</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>1. Be specific, not generic</AccordionTrigger>
                                <AccordionContent>
                                    <p className="mb-2"><strong>❌ Don't write:</strong> "We offer walking tours"</p>
                                    <p><strong>✅ Do write:</strong> "Guided walking tour through Dzaleka's artisan workshops and community markets"</p>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>2. Lead with the key info</AccordionTrigger>
                                <AccordionContent>
                                    Put the most important details in the first two sentences. This is what shows in search results and previews.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>3. Don't put prices/dates in text</AccordionTrigger>
                                <AccordionContent>
                                    Use the dedicated price and availability fields in the system. Prices in description text become outdated and cause confusion.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>

                {/* Imagery */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-purple-600" />
                            <CardTitle>Photo Requirements</CardTitle>
                        </div>
                        <CardDescription>Image standards for listings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">Photo Checklist</h4>
                            <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
                                <li>
                                    <span className="font-medium text-foreground">Include people:</span> Photos with visitors or guides perform better than empty scenes.
                                </li>
                                <li>
                                    <span className="font-medium text-foreground">Good lighting:</span> Take photos in daylight. Avoid dark or blurry images.
                                </li>
                                <li>
                                    <span className="font-medium text-foreground">Show the location:</span> Include recognizable Dzaleka locations for context.
                                </li>
                                <li>
                                    <span className="font-medium text-foreground">Minimum resolution:</span> 1200px wide for website, 2000px for GetYourGuide.
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Video & Deals */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Video className="h-5 w-5 text-red-600" />
                            <CardTitle>Video Guidelines</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            If uploading video content, keep clips under 2 minutes. Ensure audio is clear and background noise is minimal.
                        </p>
                        <div className="bg-muted p-3 rounded-md text-sm">
                            <strong>Note:</strong> Video is optional but recommended for GetYourGuide listings.
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Tag className="h-5 w-5 text-green-600" />
                            <CardTitle>Pricing & Availability</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Keep pricing and availability up to date in both the system and GetYourGuide.
                        </p>
                        <ul className="text-sm space-y-1 list-disc pl-4 text-muted-foreground">
                            <li>Update availability when guides are unavailable</li>
                            <li>Sync pricing changes across all channels</li>
                            <li>For group bookings, assign at least 2 guides</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* GetYourGuide Settings */}
            <Card className="bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/20">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ExternalLink className="h-5 w-5 text-orange-600" />
                        <CardTitle>GetYourGuide Requirements</CardTitle>
                    </div>
                    <CardDescription>
                        Standards for our <a href="https://www.getyourguide.com/mbalame-l265219/dzaleka-refugee-camp-guided-walking-tour-t1188868/" target="_blank" rel="noopener noreferrer" className="text-primary underline">GYG listing</a>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">Image Specs</h4>
                            <ul className="text-sm space-y-1 text-muted-foreground list-disc pl-4">
                                <li><strong>Landscape orientation</strong> (16:9)</li>
                                <li>Minimum 2000x1000px resolution</li>
                                <li>No text overlays or watermarks</li>
                                <li>Include people in photos</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">Effective Keywords</h4>
                            <ul className="text-sm space-y-1 text-muted-foreground list-disc pl-4">
                                <li>Cultural immersion, authentic experience</li>
                                <li>Refugee-led, community tourism</li>
                                <li>Walking tour, local guide</li>
                                <li>Malawi, off the beaten path</li>
                            </ul>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border text-sm">
                        <p className="font-medium mb-1">Pricing</p>
                        <p className="text-muted-foreground">Check similar cultural tours in the region when setting prices. GYG payments are processed bi-weekly or monthly.</p>
                    </div>
                </CardContent>
            </Card>

            {/* Where Listings Appear */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-purple-600" />
                        <CardTitle>Where Listings Appear</CardTitle>
                    </div>
                    <CardDescription>Channels that pull from the DTDW</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg text-center space-y-2">
                            <Globe className="h-8 w-8 mx-auto text-blue-600" />
                            <h4 className="font-semibold">Website</h4>
                            <p className="text-xs text-muted-foreground">visit.dzaleka.com – Direct bookings, no commission.</p>
                        </div>
                        <div className="p-4 border rounded-lg text-center space-y-2 bg-orange-50/50 dark:bg-orange-900/10">
                            <ExternalLink className="h-8 w-8 mx-auto text-orange-600" />
                            <h4 className="font-semibold">GetYourGuide</h4>
                            <p className="text-xs text-muted-foreground">External platform. Payments bi-weekly/monthly.</p>
                        </div>
                        <div className="p-4 border rounded-lg text-center space-y-2">
                            <Share2 className="h-8 w-8 mx-auto text-teal-600" />
                            <h4 className="font-semibold">Partner Embeds</h4>
                            <p className="text-xs text-muted-foreground">Iframe widgets on partner websites.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Handling Reviews */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <CardTitle>Handling Reviews</CardTitle>
                    </div>
                    <CardDescription>How to manage feedback on GetYourGuide</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" /> Getting Reviews
                            </h4>
                            <ul className="text-sm space-y-1 text-muted-foreground list-disc pl-4">
                                <li>Thank visitors at tour end</li>
                                <li>GetYourGuide sends automatic review requests</li>
                                <li>Can share positive reviews on social media (with permission)</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                                <Star className="h-4 w-4" /> Responding to Reviews
                            </h4>
                            <ul className="text-sm space-y-1 text-muted-foreground list-disc pl-4">
                                <li><strong>Positive:</strong> Thank them</li>
                                <li><strong>Constructive:</strong> Acknowledge, explain what changed</li>
                                <li><strong>Negative:</strong> Respond professionally, don't argue publicly</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Verification Checklist */}
            <Card className="bg-slate-50 dark:bg-slate-900 border-dashed">
                <CardHeader>
                    <CardTitle>Ready to publish?</CardTitle>
                    <CardDescription>Double check your listing against this checklist</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid sm:grid-cols-2 gap-2">
                        {[
                            "High-resolution hero image uploaded",
                            "Engaging 50-word short description",
                            "Contact details are current",
                            "Opening hours are accurate",
                            "Accessibility information included",
                            "Pricing is up to date"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                                {item}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
