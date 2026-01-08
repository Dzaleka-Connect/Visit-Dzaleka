import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, MapPin, Printer, Calendar, Clock, User } from "lucide-react";
import { Itinerary } from "@shared/schema";
import { formatDate } from "@/lib/constants";

interface ItineraryItem {
    time: string;
    activity: string;
}

interface ItineraryData {
    recipientName: string;
    date: string;
    duration: string;
    items: ItineraryItem[];
    totalCost?: string;
    notes?: string;
    guideName?: string;
    guideContact?: string;
    pois?: string[];
    bookingReference?: string;
}

export default function ItineraryView() {
    const { id } = useParams(); // bookingId
    const { data: itinerary, isLoading, error } = useQuery<Itinerary>({
        queryKey: [`/api/bookings/${id}/itinerary`],
    });

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    if (error || !itinerary) {
        return (
            <div className="container mx-auto p-6 max-w-3xl">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href={`/bookings/${id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Booking
                    </Link>
                </Button>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">No itinerary found for this booking yet.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const rawContent = itinerary.content as any;
    // Normalize keys (handle both camelCase and snake_case)
    const content: ItineraryData = {
        recipientName: rawContent.recipientName || rawContent.recipient_name || "Visitor",
        date: rawContent.date,
        duration: rawContent.duration,
        items: rawContent.items || [],
        totalCost: rawContent.totalCost || rawContent.total_cost,
        notes: rawContent.notes,
        guideName: rawContent.guideName || rawContent.guide_name,
        guideContact: rawContent.guideContact || rawContent.guide_contact,
        pois: rawContent.pois,
        bookingReference: rawContent.bookingReference || rawContent.booking_reference,
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <Button variant="ghost" asChild className="mb-6">
                <Link href={`/bookings/${id}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Booking
                </Link>
            </Button>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Your Itinerary</h1>
                    <p className="text-gray-500 mt-1">Ref: {content.bookingReference || 'N/A'}</p>
                </div>
                <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Welcome */}
                    <Card className="bg-gradient-to-r from-sky-600 to-sky-700 text-white border-none">
                        <CardContent className="pt-6">
                            <h2 className="text-2xl font-bold mb-2">Welcome, {content.recipientName}</h2>
                            <p className="opacity-90">
                                Here is the curated plan for your visit on <strong>{content.date}</strong>.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" /> Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l-2 border-sky-100 ml-3 space-y-8 pb-2">
                                {content.items.map((item, index) => (
                                    <div key={index} className="relative pl-8">
                                        <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-sky-500 ring-4 ring-white" />
                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                            <span className="text-sm font-bold text-sky-600 min-w-[80px]">{item.time}</span>
                                            <span className="text-gray-700 font-medium">{item.activity}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* POIs */}
                    {content.pois && content.pois.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" /> Highlights
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {content.pois.map((poi, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-gray-700">
                                            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                                            {poi}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Before You Visit */}
                    <Card className="bg-slate-900 text-white border-none">
                        <CardHeader>
                            <CardTitle>Before You Visit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-300 mb-4">Please review our guidelines to ensure a respectful and prepared visit.</p>
                            <div className="flex flex-wrap gap-4">
                                <a href="https://services.dzaleka.com/visit/travel-guide/" target="_blank" rel="noopener noreferrer" className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
                                    Travel Guide
                                </a>
                                <a href="https://services.dzaleka.com/visit/guidelines/" target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md font-medium transition-colors">
                                    Visitor Guidelines
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Trip Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Trip Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Duration</p>
                                <p className="font-medium">{content.duration}</p>
                            </div>
                            {content.totalCost && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Estimated Cost</p>
                                    <p className="font-medium text-sky-600">{content.totalCost}</p>
                                    <p className="text-xs text-muted-foreground">Cash upon arrival</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Guide Info */}
                    {content.guideName && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" /> Your Guide
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="font-bold">{content.guideName}</p>
                                {content.guideContact && (
                                    <p className="text-sm text-muted-foreground">{content.guideContact}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Notes */}
                    {content.notes && (
                        <Card className="bg-orange-50 border-orange-100">
                            <CardHeader>
                                <CardTitle className="text-orange-800 text-lg">Important Info</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-orange-900 text-sm whitespace-pre-wrap">{content.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
