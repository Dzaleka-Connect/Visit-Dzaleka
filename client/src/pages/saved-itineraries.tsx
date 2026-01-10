import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/seo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/constants";
import {
    Map,
    Trash2,
    Calendar,
    Users,
    MapPin,
    ArrowRight,
    Loader2,
    BookmarkCheck,
} from "lucide-react";
import { Link } from "wouter";

interface SavedItinerary {
    id: string;
    name: string;
    tourType: string;
    groupSize: string | null;
    numberOfPeople: number | null;
    selectedZones: string[] | null;
    selectedInterests: string[] | null;
    customDuration: number | null;
    meetingPointId: string | null;
    specialRequests: string | null;
    createdAt: string;
}

export default function SavedItineraries() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: itineraries = [], isLoading } = useQuery<SavedItinerary[]>({
        queryKey: ["/api/visitors/saved-itineraries"],
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/visitors/saved-itineraries/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/visitors/saved-itineraries"] });
            toast({ title: "Itinerary Deleted", description: "Your saved itinerary has been removed." });
        },
        onError: (error: Error) => {
            toast({ title: "Failed to Delete", description: error.message, variant: "destructive" });
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SEO
                title="Saved Itineraries"
                description="View and reuse your saved tour plans."
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Saved Itineraries</h1>
                    <p className="text-muted-foreground">
                        Quickly book a tour using your saved preferences.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/my-bookings">
                        Book a New Visit
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>

            {itineraries.length === 0 ? (
                <EmptyState
                    icon={Map}
                    title="No saved itineraries"
                    description="When you create a booking, you can save it as an itinerary template for future use."
                    className="py-16"
                    action={
                        <Button asChild className="mt-4">
                            <Link href="/my-bookings">
                                Book Your First Visit
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    }
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {itineraries.map((itinerary) => (
                        <Card key={itinerary.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <BookmarkCheck className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{itinerary.name}</CardTitle>
                                            <CardDescription className="text-xs">
                                                Saved {formatDate(itinerary.createdAt)}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteMutation.mutate(itinerary.id)}
                                        disabled={deleteMutation.isPending}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary" className="capitalize">
                                        {itinerary.tourType?.replace("_", " ")}
                                    </Badge>
                                    {itinerary.groupSize && (
                                        <Badge variant="outline" className="capitalize">
                                            {itinerary.groupSize.replace("_", " ")}
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Users className="h-3.5 w-3.5" />
                                        {itinerary.numberOfPeople || 1} {(itinerary.numberOfPeople || 1) === 1 ? "person" : "people"}
                                    </div>
                                    {itinerary.customDuration && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {itinerary.customDuration}h
                                        </div>
                                    )}
                                </div>

                                {itinerary.selectedZones && itinerary.selectedZones.length > 0 && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{itinerary.selectedZones.length} zones selected</span>
                                    </div>
                                )}

                                {itinerary.specialRequests && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {itinerary.specialRequests}
                                    </p>
                                )}

                                <Button asChild className="w-full mt-2">
                                    <Link href={`/my-bookings?itinerary=${itinerary.id}`}>
                                        Book This Itinerary
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
