import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
    BookOpen,
    Shield,
    Users,
    CreditCard,
    Settings,
    FileText,
    AlertTriangle,
    CheckCircle2,
    Phone,
    Camera,
    Globe,
    Share2,
    BarChart3,
    ListTodo,
    RefreshCw,
    Map,
    MessageSquare,
    GraduationCap,
    LayoutTemplate,
    Mail,
    HeartHandshake,
    Megaphone,
    Banknote,
    Calendar,
    Newspaper,
    Code2
} from "lucide-react";
import { Link } from "wouter";

export default function OperationsManual() {
    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-10">
            <SEO
                title="Operations Manual"
                description="Internal standard operating procedures and workflows."
            />

            <div className="flex flex-col gap-2 border-b pb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Operations Manual</h1>
                        <p className="text-muted-foreground text-lg mt-1">
                            Central command for Visit Dzaleka policies, procedures, and strategies.
                        </p>
                    </div>
                    <Badge variant="outline" className="h-fit py-1 px-3 border-primary/20 bg-primary/5 text-primary">
                        Internal
                    </Badge>
                </div>
            </div>

            {/* Quick Access Tiles */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                <Link href="/standard-operating-procedures">
                    <div className="group flex flex-col gap-2 p-3 rounded-lg border bg-card text-card-foreground hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer shadow-sm h-full">
                        <div className="p-1.5 w-fit rounded-md bg-blue-100/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                            <FileText className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-medium text-sm leading-none">SOP</h3>
                            <p className="text-[10px] text-muted-foreground">Procedures</p>
                        </div>
                    </div>
                </Link>

                <Link href="/internal-policies">
                    <div className="group flex flex-col gap-2 p-3 rounded-lg border bg-card text-card-foreground hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer shadow-sm h-full">
                        <div className="p-1.5 w-fit rounded-md bg-red-100/50 dark:bg-red-900/20 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                            <Shield className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-medium text-sm leading-none">Policies</h3>
                            <p className="text-[10px] text-muted-foreground">Compliance</p>
                        </div>
                    </div>
                </Link>

                <Link href="/marketing-strategy">
                    <div className="group flex flex-col gap-2 p-3 rounded-lg border bg-card text-card-foreground hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer shadow-sm h-full">
                        <div className="p-1.5 w-fit rounded-md bg-orange-100/50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                            <Megaphone className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-medium text-sm leading-none">Marketing</h3>
                            <p className="text-[10px] text-muted-foreground">Strategy</p>
                        </div>
                    </div>
                </Link>

                <Link href="/continuous-improvement">
                    <div className="group flex flex-col gap-2 p-3 rounded-lg border bg-card text-card-foreground hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer shadow-sm h-full">
                        <div className="p-1.5 w-fit rounded-md bg-green-100/50 dark:bg-green-900/20 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                            <RefreshCw className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-medium text-sm leading-none">Quality</h3>
                            <p className="text-[10px] text-muted-foreground">Improvement</p>
                        </div>
                    </div>
                </Link>

                <Link href="/financial-framework">
                    <div className="group flex flex-col gap-2 p-3 rounded-lg border bg-card text-card-foreground hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer shadow-sm h-full">
                        <div className="p-1.5 w-fit rounded-md bg-purple-100/50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                            <Banknote className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-medium text-sm leading-none">Finance</h3>
                            <p className="text-[10px] text-muted-foreground">Framework</p>
                        </div>
                    </div>
                </Link>

                <Link href="/dtdw-guide">
                    <div className="group flex flex-col gap-2 p-3 rounded-lg border bg-card text-card-foreground hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer shadow-sm h-full">
                        <div className="p-1.5 w-fit rounded-md bg-teal-100/50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                            <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-medium text-sm leading-none">DTDW</h3>
                            <p className="text-[10px] text-muted-foreground">Guide</p>
                        </div>
                    </div>
                </Link>

                <Link href="/it-code-of-practice">
                    <div className="group flex flex-col gap-2 p-3 rounded-lg border bg-card text-card-foreground hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer shadow-sm h-full">
                        <div className="p-1.5 w-fit rounded-md bg-indigo-100/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <Code2 className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-medium text-sm leading-none">IT Code</h3>
                            <p className="text-[10px] text-muted-foreground">Tech</p>
                        </div>
                    </div>
                </Link>
            </div>

            <Tabs defaultValue="bookings" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-7 h-auto">
                    <TabsTrigger value="bookings" className="gap-2 py-3 flex items-center justify-center">
                        <BookOpen className="h-4 w-4" /> Bookings
                    </TabsTrigger>
                    <TabsTrigger value="guides" className="gap-2 py-3 flex items-center justify-center">
                        <Users className="h-4 w-4" /> Guides
                    </TabsTrigger>
                    <TabsTrigger value="visitors" className="gap-2 py-3 flex items-center justify-center">
                        <Shield className="h-4 w-4" /> Visitors
                    </TabsTrigger>
                    <TabsTrigger value="finance" className="gap-2 py-3 flex items-center justify-center">
                        <CreditCard className="h-4 w-4" /> Finance
                    </TabsTrigger>
                    <TabsTrigger value="marketing" className="gap-2 py-3 flex items-center justify-center">
                        <LayoutTemplate className="h-4 w-4" /> Marketing
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="gap-2 py-3 flex items-center justify-center">
                        <Settings className="h-4 w-4" /> Admin
                    </TabsTrigger>
                    <TabsTrigger value="impact" className="gap-2 py-3 flex items-center justify-center">
                        <HeartHandshake className="h-4 w-4 text-green-600" /> Impact
                    </TabsTrigger>
                </TabsList>

                {/* BOOKINGS TAB */}
                <TabsContent value="bookings" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Booking Operations</CardTitle>
                            <CardDescription>Managing bookings, OTAs, and Itineraries</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="manual-entry">
                                    <AccordionTrigger>Manual Booking Entry (Offline)</AccordionTrigger>
                                    <AccordionContent className="space-y-2">
                                        <p>When creating a booking for a walk-in or offline payment:</p>
                                        <ol className="list-decimal pl-5 space-y-1">
                                            <li>Go to <strong>Bookings</strong> page and click "Create Booking".</li>
                                            <li>Select "Cash" as payment method if paid on-site.</li>
                                            <li>Assign a guide manually by editing the booking after creation.</li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="channels">
                                    <AccordionTrigger>
                                        <div className="flex gap-2 items-center">
                                            <RefreshCw className="h-4 w-4 text-blue-500" /> Channel Manager (Airbnb/Viator)
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-2">
                                        <p>Sync availability with external platforms to prevent double bookings.</p>
                                        <ul className="list-disc pl-5 mt-2">
                                            <li><strong>Import:</strong> Click "Connect Channel" and paste the iCal URL from Airbnb/Booking.com.</li>
                                            <li><strong>Export:</strong> Copy the "Export Availability" link and paste it into the OTA's calendar settings.</li>
                                            <li><strong>Sync Frequency:</strong> The system automatically polls; click "Sync Now" for immediate updates.</li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="itinerary">
                                    <AccordionTrigger>
                                        <div className="flex gap-2 items-center">
                                            <Map className="h-4 w-4 text-green-500" /> Itinerary Builder
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-2">
                                        <p>Create custom PDF itineraries for confirmed visitors.</p>
                                        <ol className="list-decimal pl-5 mt-2">
                                            <li>Select "Import from Booking" to auto-fill visitor details.</li>
                                            <li><strong>Add POIs:</strong> Check box "Points of Interest" (e.g., Dzaleka Market, Umoja Radio).</li>
                                            <li><strong>Timeline:</strong> Add items (Time + Activity) for the day's schedule.</li>
                                            <li>Click "Send Itinerary" to email the PDF directly to the visitor.</li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="recurring">
                                    <AccordionTrigger>Recurring Bookings</AccordionTrigger>
                                    <AccordionContent>
                                        <p>Use for regular visits (e.g., NGOs, Schools, Researchers).</p>
                                        <p className="mt-2"><strong>Action Required:</strong> You must click "Generate" on the schedule card to create the actual booking records for the upcoming month.</p>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="calendar">
                                    <AccordionTrigger>
                                        <div className="flex gap-2 items-center">
                                            <Calendar className="h-4 w-4 text-indigo-500" /> Calendar View
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p>Visual calendar showing all bookings by day/week/month.</p>
                                        <ul className="list-disc pl-5 mt-2 space-y-1">
                                            <li><strong>Drag & Drop:</strong> Reschedule bookings by dragging to a new date.</li>
                                            <li><strong>Color Coding:</strong> Confirmed (Green), Pending (Yellow), Cancelled (Red).</li>
                                            <li><strong>Quick Actions:</strong> Click any booking to view details or assign a guide.</li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="live-ops">
                                    <AccordionTrigger>Live Operations Dashboard</AccordionTrigger>
                                    <AccordionContent>
                                        <p>Real-time view of today's active tours and check-ins.</p>
                                        <ul className="list-disc pl-5 mt-2 space-y-1">
                                            <li><strong>Active Tours:</strong> See which guides are currently on tour.</li>
                                            <li><strong>Check-In Status:</strong> Monitor visitor arrivals and departures.</li>
                                            <li><strong>Alerts:</strong> Immediate notifications for delays or incidents.</li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="saved-itineraries">
                                    <AccordionTrigger>Saved Itinerary Templates</AccordionTrigger>
                                    <AccordionContent>
                                        <p>Pre-built itinerary templates for common tour types.</p>
                                        <ul className="list-disc pl-5 mt-2 space-y-1">
                                            <li><strong>Create Template:</strong> Build an itinerary, then click "Save as Template".</li>
                                            <li><strong>Reuse:</strong> When creating a new itinerary, select "Load Template" to start from a saved version.</li>
                                            <li><strong>Best For:</strong> Standard half-day tours, VIP visits, school groups.</li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="cancellations">
                                    <AccordionTrigger>Cancellations & No-Shows</AccordionTrigger>
                                    <AccordionContent className="space-y-3">
                                        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-200 dark:border-blue-900/20 text-sm">
                                            <p><strong>Note:</strong> Visitors do not pay upfront, so there are no refunds to process.</p>
                                        </div>
                                        <p><strong>Cancellation Process:</strong></p>
                                        <ol className="list-decimal pl-5 space-y-1">
                                            <li>Go to <strong>Booking Details</strong> → Click "Cancel Booking".</li>
                                            <li>Select cancellation reason from dropdown.</li>
                                            <li>Add notes if the visitor requested to reschedule.</li>
                                            <li>The booking status will update to "Cancelled".</li>
                                        </ol>
                                        <p className="mt-3"><strong>No-Show Handling:</strong></p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>If visitor does not arrive within 30 minutes, mark as "No-Show".</li>
                                            <li>Release the assigned guide for other duties.</li>
                                            <li>Log in Admin Notes for future reference.</li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="group-bookings">
                                    <AccordionTrigger>Group Booking Procedures</AccordionTrigger>
                                    <AccordionContent className="space-y-3">
                                        <p>For group visits:</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li><strong>Minimum Guides:</strong> At least 2 guides must be assigned to any group booking.</li>
                                            <li><strong>Route Planning:</strong> Use Itinerary Builder to coordinate group movement.</li>
                                            <li><strong>Coordination:</strong> Guides should communicate via Messages during the tour.</li>
                                            <li><strong>Logistics:</strong> Coordinate transport, lunch arrangements, and rest stops in advance.</li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* GUIDES TAB */}
                <TabsContent value="guides" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Guide Management</CardTitle>
                            <CardDescription>Onboarding, assignment, and training for Refugee Youth guides</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="onboarding">
                                    <AccordionTrigger>Guide Onboarding Checklist</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Profile Photo Uploaded</div>
                                            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Mobile Money (Airtel/Mpamba) Verified</div>
                                            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Signed Code of Conduct (Child Protection)</div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="assignment">
                                    <AccordionTrigger>Guide Assignment</AccordionTrigger>
                                    <AccordionContent>
                                        <p>Guides can only see bookings they are assigned to.</p>
                                        <ul className="list-disc pl-5 mt-2">
                                            <li><strong>Language Match:</strong> Check visitor language preference (Swahili, French, English, Chichewa).</li>
                                            <li><strong>Availability:</strong> Ensure the guide is not booked on another tour.</li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="training">
                                    <AccordionTrigger>
                                        <div className="flex gap-2 items-center">
                                            <GraduationCap className="h-4 w-4 text-purple-500" /> Training Modules
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p>Manage the educational content guides must complete.</p>
                                        <ul className="list-disc pl-5 mt-2 space-y-1">
                                            <li><strong>Creating Modules:</strong> Go to "Training Admin". Add Title, Content, and Est. Time.</li>
                                            <li><strong>Target Audience:</strong> Set to "Guide" for internal training, or "Visitor" for pre-arrival info.</li>
                                            <li><strong>Tracking:</strong> Check the "Guide Progress" tab to see completion percentages. Guides cannot take tours until "Required" modules are 100% complete.</li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="performance">
                                    <AccordionTrigger>Guide Performance Metrics</AccordionTrigger>
                                    <AccordionContent>
                                        <p>Track individual guide performance and ratings.</p>
                                        <ul className="list-disc pl-5 mt-2 space-y-1">
                                            <li><strong>Ratings:</strong> Average visitor rating per guide.</li>
                                            <li><strong>Tours Completed:</strong> Total tours and revenue generated.</li>
                                            <li><strong>Training Status:</strong> Module completion percentage.</li>
                                            <li><strong>Attendance:</strong> On-time rate and cancellation history.</li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* VISITORS / CRM TAB */}
                <TabsContent value="visitors" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-blue-500" />
                                <CardTitle>Visitor Safety & CRM</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="incident">
                                    <AccordionTrigger className="text-red-600 font-medium">Incident Reporting</AccordionTrigger>
                                    <AccordionContent>
                                        <ol className="list-decimal pl-5 space-y-2">
                                            <li>Secure the safety of all visitors and guides first.</li>
                                            <li>Call Emergency Contacts immediately via <strong>Security Admin</strong> page.</li>
                                            <li>Log the incident using the "Report Incident" form.</li>
                                            <li>Notify the Program Coordinator within 1 hour.</li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="vip">
                                    <AccordionTrigger>VIP & Special Visits</AccordionTrigger>
                                    <AccordionContent>
                                        <p>For high-profile visits (UN, Diplomats, Donors):</p>
                                        <ol className="list-decimal pl-5 space-y-1 mt-2">
                                            <li>Go to <strong>Customer Profile</strong>.</li>
                                            <li>Add the tag <code>vip</code> in the "Tags" input field.</li>
                                            <li>Add specific requirements in "Admin Notes".</li>
                                            <li>Notify Head of Security 24h in advance.</li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="international">
                                    <AccordionTrigger>International Visitors</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-2">
                                            <p><strong>Cultural Sensitivity:</strong> Brief visitors on photography rules before entering community areas.</p>
                                            <p><strong>Language:</strong> Ensure the assigned guide speaks the visitor's preferred language.</p>
                                            <p><strong>Zones:</strong> Check the <strong>Zones</strong> page daily. Do not take visitors to "Red" zones.</p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="emergency">
                                    <AccordionTrigger className="text-red-600 font-medium">⚠️ Emergency Procedures</AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 dark:border-red-900/20">
                                            <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3">🏥 Medical Emergency</h4>
                                            <ol className="list-decimal pl-5 space-y-1 text-sm mb-3">
                                                <li>Call for help immediately. Do not move the injured person.</li>
                                                <li>Contact <strong>Dzaleka Health Centre</strong> (on-site clinic).</li>
                                                <li>Send a guide to fetch the nearest first aid kit.</li>
                                                <li>Log incident immediately in Security Admin.</li>
                                            </ol>
                                            <div className="bg-white dark:bg-gray-800 p-3 rounded border text-sm space-y-2">
                                                <p className="font-medium">Quick Reference Numbers:</p>
                                                <ul className="space-y-1">
                                                    <li>• <strong>Ministry of Health Line:</strong> 118</li>
                                                    <li>• <strong>MASM Emergency:</strong> 0888 189 070 / 0888 189 072</li>
                                                    <li>• <strong>St John Ambulance:</strong> +265 111 840 170</li>
                                                </ul>
                                                <p className="text-muted-foreground text-xs mt-2">Note: Private services (MASM/St John) are based in Lilongwe (45-60 min away). Local transport to meet ambulance is standard.</p>
                                            </div>
                                        </div>
                                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-200 dark:border-amber-900/20">
                                            <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-3">🛡️ Security Threat / Evacuation</h4>
                                            <ol className="list-decimal pl-5 space-y-1 text-sm mb-3">
                                                <li>Calmly escort all visitors to the designated Safe Zone.</li>
                                                <li>Contact UNHCR or Police immediately.</li>
                                                <li>Do not return to restricted areas until cleared.</li>
                                            </ol>
                                            <div className="bg-white dark:bg-gray-800 p-3 rounded border text-sm space-y-1">
                                                <p className="font-medium">Protection Services:</p>
                                                <ul className="space-y-1">
                                                    <li>• <strong>UNHCR:</strong> +265 1 772 155</li>
                                                    <li>• <strong>Dzaleka Dowa Police</strong></li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg border border-green-200 dark:border-green-900/20">
                                            <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3">⚖️ Legal Aid</h4>
                                            <div className="text-sm space-y-1">
                                                <p><strong>Inua Advocacy:</strong> +265 886 44 72 77</p>
                                                <p className="text-muted-foreground">Email: info@inuaadvocacy.org</p>
                                                <p className="text-muted-foreground text-xs">Professional legal assistance and advocacy services for refugees.</p>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-200 dark:border-blue-900/20">
                                            <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-3">⚡ Power / Internet Outage</h4>
                                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                                <li><strong>Bookings:</strong> Use the offline paper forms (in Guide Kits).</li>
                                                <li><strong>Check-ins:</strong> Record manually, sync later via "Offline Sync".</li>
                                                <li><strong>Payments:</strong> Accept cash, issue manual receipts.</li>
                                            </ul>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border text-sm">
                                            <p className="font-medium mb-1">📞 Dialing Tips:</p>
                                            <ul className="text-muted-foreground space-y-1">
                                                <li>• <strong>118</strong> is the dedicated Ministry of Health line—use first for serious medical issues.</li>
                                                <li>• Use country code <strong>+265</strong> if dialing from international roaming SIM.</li>
                                                <li>• Local SIMs (Airtel/TNM) work best for all emergency calls.</li>
                                            </ul>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="photo-consent">
                                    <AccordionTrigger>Photo Consent Protocol</AccordionTrigger>
                                    <AccordionContent className="space-y-2">
                                        <p><strong>Before photographing residents:</strong></p>
                                        <ol className="list-decimal pl-5 space-y-1">
                                            <li>Introduce yourself and explain the purpose of photos/videos.</li>
                                            <li>Ask for verbal consent clearly: "May I take your photo?"</li>
                                            <li>If for publication, obtain written consent using the Photo Release Form.</li>
                                            <li>Never photograph children without parent/guardian present.</li>
                                            <li>Respect refusals immediately—do not pressure.</li>
                                        </ol>
                                        <p className="mt-2 text-muted-foreground text-sm"><strong>Storage:</strong> Upload consent forms to the visitor's Customer Profile under "Documents".</p>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* FINANCE TAB */}
                <TabsContent value="finance" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Finance & Reporting</CardTitle>
                            <CardDescription>Managing payouts, revenue, and data exports</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="payouts">
                                    <AccordionTrigger>Processing Guide Payouts</AccordionTrigger>
                                    <AccordionContent>
                                        <p>Go to the <strong>Revenue</strong> page, specific to the "Payouts" tab.</p>
                                        <ol className="list-decimal pl-5 space-y-2 mt-2">
                                            <li><strong>Step 1: Record Payout (Pending):</strong> Click "Record Payout" for a guide. This logs the amount owed based on completed tours.</li>
                                            <li><strong>Step 2: Transfer Funds:</strong> Send the money via Airtel Money/Mpamba/Cash offline.</li>
                                            <li><strong>Step 3: Mark as Paid:</strong> Find the record in "Payout History", click "Pay Now", and enter the transaction reference to close the loop.</li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="reports">
                                    <AccordionTrigger>
                                        <div className="flex gap-2 items-center">
                                            <BarChart3 className="h-4 w-4 text-blue-500" /> Generating Reports
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p>Navigate to the <strong>Reports</strong> page for detailed analytics.</p>
                                        <ul className="list-disc pl-5 mt-2 space-y-1">
                                            <li><strong>Export CSV:</strong> Use the "Export CSV" button on the Bookings tab for raw data (Excel compatible).</li>
                                            <li><strong>Heatmaps:</strong> Use "Schedule" tab to see peak visiting hours/days.</li>
                                            <li><strong>Revenue Share:</strong> "Payments" tab shows Gross Margin vs Guide Share breakdown.</li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* MARKETING / CMS TAB */}
                <TabsContent value="marketing" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Marketing & Content</CardTitle>
                            <CardDescription>Managing the website content and media assets</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="cms">
                                    <AccordionTrigger>
                                        <div className="flex gap-2 items-center">
                                            <LayoutTemplate className="h-4 w-4 text-orange-500" /> Landing Page CMS
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p>To update the public homepage text:</p>
                                        <ol className="list-decimal pl-5 space-y-1 mt-2">
                                            <li>Go to <strong>CMS</strong> in the admin menu.</li>
                                            <li>Update fields (Hero Title, Stats, Features, Testimonials).</li>
                                            <li><strong>Note:</strong> Changes are live immediately after clicking "Save". Ensure you spell-check before saving.</li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="social">
                                    <AccordionTrigger>Social Media & Images</AccordionTrigger>
                                    <AccordionContent>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Hashtags:</strong> Use #DzalekaVisit #RefugeeVoices.</li>
                                            <li><strong>Images:</strong> Only use images where subjects have given verbal consent. Avoid "poverty porn" angles; focus on dignity and skill.</li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="blog">
                                    <AccordionTrigger>
                                        <div className="flex gap-2 items-center">
                                            <Newspaper className="h-4 w-4 text-teal-500" /> Blog Management
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p>Publish stories and updates to the public blog.</p>
                                        <ol className="list-decimal pl-5 space-y-1 mt-2">
                                            <li>Go to <strong>Admin Blog</strong> in the sidebar.</li>
                                            <li>Click "New Post" to create a draft.</li>
                                            <li>Add Title, Content (Markdown supported), Featured Image.</li>
                                            <li>Set "Published" to make it live on the public blog page.</li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="embed">
                                    <AccordionTrigger>Embeddable Booking Widget</AccordionTrigger>
                                    <AccordionContent>
                                        <p>Allow partner websites to embed a booking form.</p>
                                        <ul className="list-disc pl-5 mt-2 space-y-1">
                                            <li><strong>Generate Code:</strong> Go to Developer Settings → Embed Widgets.</li>
                                            <li><strong>Customize:</strong> Select theme color, default tour type.</li>
                                            <li><strong>Copy & Paste:</strong> Provide the iframe code to partners.</li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="partner-onboarding">
                                    <AccordionTrigger>
                                        <div className="flex gap-2 items-center">
                                            <Share2 className="h-4 w-4 text-purple-500" /> Partner Onboarding
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                        <p className="text-muted-foreground">We believe in partnerships that are mutually beneficial, transparent, and impact-driven.</p>

                                        <div className="grid md:grid-cols-2 gap-3">
                                            <div className="border p-3 rounded-lg">
                                                <h5 className="font-semibold text-sm mb-1">🗺️ Expert Local Knowledge</h5>
                                                <p className="text-sm text-muted-foreground">Our guides are passionate locals who know every corner of Dzaleka, ensuring authentic experiences.</p>
                                            </div>
                                            <div className="border p-3 rounded-lg">
                                                <h5 className="font-semibold text-sm mb-1">💚 Support Community Growth</h5>
                                                <p className="text-sm text-muted-foreground">Directly supporting refugee-led initiatives and economic empowerment.</p>
                                            </div>
                                            <div className="border p-3 rounded-lg">
                                                <h5 className="font-semibold text-sm mb-1">🎭 Exclusive Cultural Access</h5>
                                                <p className="text-sm text-muted-foreground">From Tumaini Festival to hidden art workshops—experiences you won't find elsewhere.</p>
                                            </div>
                                            <div className="border p-3 rounded-lg">
                                                <h5 className="font-semibold text-sm mb-1">📋 Customizable Itineraries</h5>
                                                <p className="text-sm text-muted-foreground">Tailored for educational groups, researchers, or cultural tourists.</p>
                                            </div>
                                            <div className="border p-3 rounded-lg">
                                                <h5 className="font-semibold text-sm mb-1">📞 Reliable Communication</h5>
                                                <p className="text-sm text-muted-foreground">Direct access to our coordination team for seamless planning.</p>
                                            </div>
                                            <div className="border p-3 rounded-lg">
                                                <h5 className="font-semibold text-sm mb-1">📊 Impact Reporting</h5>
                                                <p className="text-sm text-muted-foreground">See exactly how your visits contribute to the local community.</p>
                                            </div>
                                        </div>

                                        <div className="bg-muted/30 p-3 rounded-lg mt-3">
                                            <p className="font-medium text-sm">To onboard a new partner:</p>
                                            <ol className="list-decimal pl-5 text-sm space-y-1 mt-2">
                                                <li>Direct them to the <Link href="/partner-with-us" className="text-primary underline">Partner With Us</Link> page.</li>
                                                <li>Review their inquiry in the admin Messages or Email inbox.</li>
                                                <li>Schedule an introductory call to discuss their needs.</li>
                                                <li>Generate embed widget code or share booking link.</li>
                                            </ol>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ADMIN TAB */}
                <TabsContent value="admin" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Administration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <h3 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> User Roles Matrix</h3>
                                    <ul className="text-sm space-y-1 text-muted-foreground border p-3 rounded-lg bg-muted/20">
                                        <li><strong>Admin:</strong> Full system access (Finance, Settings, Users).</li>
                                        <li><strong>Coordinator:</strong> Daily operations (Bookings, Guides, Reports).</li>
                                        <li><strong>Guide:</strong> View assigned tours, completion status, earnings.</li>
                                        <li><strong>Security:</strong> Incidents, Zone status, Check-ins.</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Communication Protocols</h3>
                                    <ul className="text-sm space-y-1 text-muted-foreground border p-3 rounded-lg bg-muted/20">
                                        <li><strong>Messages:</strong> Use specific "Rooms" for tour groups.</li>
                                        <li><strong>Direct:</strong> Use "Start New Chat" for 1-on-1 guide comms.</li>
                                        <li><strong>Email Logs:</strong> Check "Email History" if a visitor claims they didn't receive a ticket.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <Link href="/tasks">
                                    <div className="border p-4 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><ListTodo className="h-4 w-4" /> Task Tracking</h4>
                                        <p className="text-sm text-muted-foreground">Assign work to staff.</p>
                                    </div>
                                </Link>
                                <Link href="/users">
                                    <div className="border p-4 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Users className="h-4 w-4" /> User Accounts</h4>
                                        <p className="text-sm text-muted-foreground">Reset passwords, Roles.</p>
                                    </div>
                                </Link>
                                <Link href="/audit-logs">
                                    <div className="border p-4 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Audit Logs</h4>
                                        <p className="text-sm text-muted-foreground">Review access logs.</p>
                                    </div>
                                </Link>
                                <Link href="/dashboard">
                                    <div className="border p-4 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Dashboard</h4>
                                        <p className="text-sm text-muted-foreground">Overview of key metrics.</p>
                                    </div>
                                </Link>
                                <Link href="/analytics">
                                    <div className="border p-4 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Analytics</h4>
                                        <p className="text-sm text-muted-foreground">Detailed visitor analytics.</p>
                                    </div>
                                </Link>
                                <Link href="/settings">
                                    <div className="border p-4 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Settings className="h-4 w-4" /> Settings</h4>
                                        <p className="text-sm text-muted-foreground">System configuration.</p>
                                    </div>
                                </Link>
                                <Link href="/developer-settings">
                                    <div className="border p-4 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Code2 className="h-4 w-4" /> Developer Settings</h4>
                                        <p className="text-sm text-muted-foreground">API keys, webhooks.</p>
                                    </div>
                                </Link>
                                <Link href="/email-settings">
                                    <div className="border p-4 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Mail className="h-4 w-4" /> Email Settings</h4>
                                        <p className="text-sm text-muted-foreground">SMTP and templates.</p>
                                    </div>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Troubleshooting FAQ */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" /> Troubleshooting FAQ
                            </CardTitle>
                            <CardDescription>Common issues and quick fixes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="login-issues">
                                    <AccordionTrigger>Can't log in / Session expired</AccordionTrigger>
                                    <AccordionContent>
                                        <ol className="list-decimal pl-5 space-y-1">
                                            <li>Clear browser cache and cookies.</li>
                                            <li>Try Incognito/Private browsing mode.</li>
                                            <li>If password forgotten: Use "Forgot Password" link.</li>
                                            <li>If still failing: Contact Admin to reset account.</li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="sync-issues">
                                    <AccordionTrigger>Channel sync not working</AccordionTrigger>
                                    <AccordionContent>
                                        <ol className="list-decimal pl-5 space-y-1">
                                            <li>Check OTA iCal URL is still valid (not expired).</li>
                                            <li>Click "Sync Now" to force immediate refresh.</li>
                                            <li>If error persists: Remove and re-add the channel.</li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="email-issues">
                                    <AccordionTrigger>Emails not sending</AccordionTrigger>
                                    <AccordionContent>
                                        <ol className="list-decimal pl-5 space-y-1">
                                            <li>Check <strong>Email Settings</strong> → Verify SMTP credentials.</li>
                                            <li>Check <strong>Email History</strong> for error messages.</li>
                                            <li>Verify recipient email is correct (no typos).</li>
                                            <li>Check spam/junk folder of recipient.</li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="payment-issues">
                                    <AccordionTrigger>Payment not recorded</AccordionTrigger>
                                    <AccordionContent>
                                        <ol className="list-decimal pl-5 space-y-1">
                                            <li>Manually record payment in <strong>Revenue</strong> page.</li>
                                            <li>Add transaction reference for reconciliation.</li>
                                            <li>If online payment failed: Check payment gateway logs in Developer Settings.</li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="data-missing">
                                    <AccordionTrigger>Data appears missing</AccordionTrigger>
                                    <AccordionContent>
                                        <ol className="list-decimal pl-5 space-y-1">
                                            <li>Check date filters—data may be outside the selected range.</li>
                                            <li>Check role permissions—you may not have access to that data.</li>
                                            <li>Refresh the page (Ctrl+Shift+R / Cmd+Shift+R).</li>
                                            <li>Check <strong>Audit Logs</strong> to see if data was deleted.</li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    {/* Data Backup & Security */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-green-500" /> Data Backup & Security
                            </CardTitle>
                            <CardDescription>Data protection, privacy, and backup procedures</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg border border-green-200 dark:border-green-900/20">
                                    <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">🔒 Data Protection</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm">
                                        <li><strong>Encryption:</strong> All data is encrypted in transit (HTTPS) and at rest.</li>
                                        <li><strong>Access Control:</strong> Role-based permissions ensure staff only see what they need.</li>
                                        <li><strong>Audit Logs:</strong> All admin actions are logged for accountability.</li>
                                    </ul>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-200 dark:border-blue-900/20">
                                    <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">💾 Backup Schedule</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm">
                                        <li><strong>Database:</strong> Automatic daily backups retained for 30 days.</li>
                                        <li><strong>Files/Images:</strong> Stored in cloud storage with redundancy.</li>
                                        <li><strong>Recovery:</strong> Contact developer support for data restoration requests.</li>
                                    </ul>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-200 dark:border-amber-900/20">
                                    <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-2">🛡️ Privacy Compliance</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm">
                                        <li><strong>Visitor Data:</strong> Only collected for operational purposes. Not shared with third parties.</li>
                                        <li><strong>Consent:</strong> Photo consent forms stored securely in Customer Profiles.</li>
                                        <li><strong>Deletion Requests:</strong> Process via Settings → Privacy → "Data Deletion Request".</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SOCIAL IMPACT TAB - REVISED WITH 5 PILLAR FRAMEWORK */}
                <TabsContent value="impact" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dzaleka Impact Management Framework</CardTitle>
                            <CardDescription>Measuring our contribution to economic, social, and detailed wellbeing.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-6 p-4 bg-muted/20 rounded-lg">
                                <h3 className="font-semibold mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Reporting Cadence</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="border-l-2 border-blue-500 pl-3">
                                        <p className="font-medium text-foreground">Monthly</p>
                                        <p className="text-muted-foreground">Tour counts, income, guide employment stats.</p>
                                    </div>
                                    <div className="border-l-2 border-green-500 pl-3">
                                        <p className="font-medium text-foreground">Quarterly</p>
                                        <p className="text-muted-foreground">Training completion, visitor satisfaction, resident check-ins.</p>
                                    </div>
                                    <div className="border-l-2 border-purple-500 pl-3">
                                        <p className="font-medium text-foreground">Annually</p>
                                        <p className="text-muted-foreground">Full social impact analysis & community feedback trends.</p>
                                    </div>
                                </div>
                            </div>

                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="economic">
                                    <AccordionTrigger>1️⃣ Economic & Livelihood Impact</AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                        <p className="text-muted-foreground">Measures whether tourism genuinely benefits people financially.</p>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="bg-muted/30 p-3 rounded">
                                                <h4 className="font-semibold text-sm mb-2 text-primary">Key Metrics</h4>
                                                <ul className="list-disc pl-5 text-sm space-y-1">
                                                    <li><strong>Local Employment:</strong> # of Refugees employed as Guides/Hosts.</li>
                                                    <li><strong>Income Generated:</strong> Total revenue earned by guides/partners.</li>
                                                    <li><strong>Spending in Camp:</strong> % revenue spent on local services (food, crafts).</li>
                                                    <li><strong>Quality of Employment:</strong> Retention rates & Training hours.</li>
                                                </ul>
                                            </div>
                                            <div className="border p-3 rounded">
                                                <h4 className="font-semibold text-sm mb-2">Dzaleka Context Actions</h4>
                                                <ul className="list-disc pl-5 text-sm space-y-1">
                                                    <li>Reserve 100% of Guide roles for Dzaleka residents.</li>
                                                    <li>Source visitor lunches exclusively from refugee-owned home restaurants.</li>
                                                    <li>Promote local artisans for souvenirs.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="social-cultural">
                                    <AccordionTrigger>2️⃣ Social & Cultural Well-Being</AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                        <p className="text-muted-foreground">Assesses tourism’s influence on residents’ social conditions and culture.</p>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="bg-muted/30 p-3 rounded">
                                                <h4 className="font-semibold text-sm mb-2 text-primary">Key Metrics</h4>
                                                <ul className="list-disc pl-5 text-sm space-y-1">
                                                    <li><strong>Community Participation:</strong> # involved in design/storytelling.</li>
                                                    <li><strong>Cultural Preservation:</strong> Heritage elements in tours.</li>
                                                    <li><strong>Resident Satisfaction:</strong> Survey scores on tourism effects.</li>
                                                    <li><strong>Intercultural Exchange:</strong> Narrative feedback frequency.</li>
                                                </ul>
                                            </div>
                                            <div className="border p-3 rounded">
                                                <h4 className="font-semibold text-sm mb-2">Dzaleka Context Actions</h4>
                                                <ul className="list-disc pl-5 text-sm space-y-1">
                                                    <li>Collaborate with Umoja Radio & Salama Africa for events.</li>
                                                    <li>Ensure diversity in guide storytelling (Congolese, Burundian, etc).</li>
                                                    <li>Regular "Community Box" feedback collection.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="visitor-experience">
                                    <AccordionTrigger>3️⃣ Visitor Experience & Inclusion</AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                        <p className="text-muted-foreground">Measures how tourism affects visitors and community experience.</p>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="bg-muted/30 p-3 rounded">
                                                <h4 className="font-semibold text-sm mb-2 text-primary">Key Metrics</h4>
                                                <ul className="list-disc pl-5 text-sm space-y-1">
                                                    <li><strong>Visitor Satisfaction:</strong> Ratings on education/respect.</li>
                                                    <li><strong>Access & Inclusion:</strong> % of visitors with needs served.</li>
                                                    <li><strong>Re-booking/Referrals:</strong> Repeat rates.</li>
                                                </ul>
                                            </div>
                                            <div className="border p-3 rounded">
                                                <h4 className="font-semibold text-sm mb-2">Dzaleka Context Actions</h4>
                                                <ul className="list-disc pl-5 text-sm space-y-1">
                                                    <li>Map accessible routes (flat terrain) for mobility needs.</li>
                                                    <li>Manage seasonal demand (Rainy vs Dry season offers).</li>
                                                    <li>Educate visitors on cultural sensitivity (Photo policy).</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="community-wellbeing">
                                    <AccordionTrigger>4️⃣ Community Well-Being & Quality of Life</AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                        <p className="text-muted-foreground">Measures broader social effects within the camp.</p>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="bg-muted/30 p-3 rounded">
                                                <h4 className="font-semibold text-sm mb-2 text-primary">Key Metrics</h4>
                                                <ul className="list-disc pl-5 text-sm space-y-1">
                                                    <li><strong>Perceived Well-Being:</strong> Self-reported changes via survey.</li>
                                                    <li><strong>Capacity Building:</strong> # residents completing skills training.</li>
                                                    <li><strong>Social Cohesion:</strong> Indicators of trust/cooperation.</li>
                                                </ul>
                                            </div>
                                            <div className="border p-3 rounded">
                                                <h4 className="font-semibold text-sm mb-2">Dzaleka Context Actions</h4>
                                                <ul className="list-disc pl-5 text-sm space-y-1">
                                                    <li>Reinvest profits into Dzaleka Online Services hubs (Internet/Power).</li>
                                                    <li>Guides volunteer 5hrs/month teaching digital skills.</li>
                                                    <li>Prioritize digital inclusion for youth.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="governance">
                                    <AccordionTrigger>5️⃣ Governance & Ethical Standards</AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                        <p className="text-muted-foreground">Evaluates whether tourism is delivered fairly and responsibly.</p>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="bg-muted/30 p-3 rounded">
                                                <h4 className="font-semibold text-sm mb-2 text-primary">Key Metrics</h4>
                                                <ul className="list-disc pl-5 text-sm space-y-1">
                                                    <li><strong>Consent Compliance:</strong> % photos with documented consent.</li>
                                                    <li><strong>Fair Pay:</strong> Adherence to wage standards.</li>
                                                    <li><strong>Stakeholder Engagement:</strong> Frequency of community meetings.</li>
                                                </ul>
                                            </div>
                                            <div className="border p-3 rounded">
                                                <h4 className="font-semibold text-sm mb-2">Dzaleka Context Actions</h4>
                                                <ul className="list-disc pl-5 text-sm space-y-1">
                                                    <li>Quarterly meetings with Camp Leadership & UNHCR.</li>
                                                    <li>Strict Child Protection Policy enforcement.</li>
                                                    <li>Transparent financial reporting to community partners.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="tools-methods">
                                    <AccordionTrigger className="text-blue-600">📌 Measurement Tools & Advanced Methods</AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="font-semibold text-sm mb-2">Primary Tools</h4>
                                                <ul className="list-disc pl-5 text-sm space-y-1">
                                                    <li>Surveys (Guides, Residents, Visitors)</li>
                                                    <li>Structured Interviews</li>
                                                    <li>Financial Records (Income/Spending)</li>
                                                    <li>Training Logs & Consent Forms</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm mb-2">Advanced Methods (Optional)</h4>
                                                <ul className="list-disc pl-5 text-sm space-y-1">
                                                    <li><strong>SROI:</strong> Social Return on Investment analysis.</li>
                                                    <li><strong>Theory of Change:</strong> Mapping Activities → Outputs → Outcomes.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/20 flex gap-3 text-sm">
                <Phone className="h-5 w-5 text-blue-600 shrink-0" />
                <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Need Tech Support?</p>
                    <p className="text-blue-700 dark:text-blue-300">
                        For system issues not covered here, submit a ticket via <Link href="/help-admin" className="underline hover:text-blue-600">Help Admin</Link>.
                    </p>
                </div>
            </div>
        </div >
    );
}
