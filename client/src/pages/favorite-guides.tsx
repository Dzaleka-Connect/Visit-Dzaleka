import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/empty-state";
import {
    Heart,
    Star,
    Globe,
    Loader2,
    Users,
    Phone,
} from "lucide-react";

interface Guide {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
    bio: string | null;
    languages: string[] | null;
    specialties: string[] | null;
    rating: number | null;
    totalRatings: number | null;
    phone: string;
}

interface FavoriteGuideWithDetails {
    id: string;
    guideId: string;
    createdAt: string;
    guide: Guide | null;
}

export default function FavoriteGuides() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: favorites = [], isLoading } = useQuery<FavoriteGuideWithDetails[]>({
        queryKey: ["/api/visitors/favorite-guides"],
    });

    const removeMutation = useMutation({
        mutationFn: async (guideId: string) => {
            await apiRequest("DELETE", `/api/visitors/favorite-guides/${guideId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/visitors/favorite-guides"] });
            toast({ title: "Removed from Favorites", description: "Guide has been removed from your favorites." });
        },
        onError: (error: Error) => {
            toast({ title: "Failed to Remove", description: error.message, variant: "destructive" });
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Filter out any favorites where guide data is missing
    const validFavorites = favorites.filter(f => f.guide !== null);

    return (
        <div className="space-y-6">
            <SEO
                title="Favorite Guides"
                description="Your saved favorite tour guides."
            />

            <div className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Favorite Guides</h1>
                <p className="text-muted-foreground">
                    Guides you've saved for future bookings.
                </p>
            </div>

            {validFavorites.length === 0 ? (
                <EmptyState
                    icon={Heart}
                    title="No favorite guides yet"
                    description="After completing a tour, you can add guides to your favorites to easily request them for future visits."
                    className="py-16"
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {validFavorites.map((favorite) => {
                        const guide = favorite.guide!;
                        const initials = `${guide.firstName[0]}${guide.lastName[0]}`.toUpperCase();
                        const rating = guide.rating ? (guide.rating / 20).toFixed(1) : null; // Assuming rating is 0-100

                        return (
                            <Card key={favorite.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-16 w-16 shrink-0">
                                            {guide.profileImageUrl ? (
                                                <AvatarImage src={guide.profileImageUrl} alt={guide.firstName} />
                                            ) : null}
                                            <AvatarFallback className="text-lg bg-primary/10 text-primary">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-lg">
                                                        {guide.firstName} {guide.lastName}
                                                    </h3>
                                                    {rating && (
                                                        <div className="flex items-center gap-1 text-sm text-yellow-600">
                                                            <Star className="h-4 w-4 fill-yellow-400" />
                                                            <span>{rating}</span>
                                                            {guide.totalRatings && (
                                                                <span className="text-muted-foreground">
                                                                    ({guide.totalRatings} reviews)
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeMutation.mutate(guide.id)}
                                                    disabled={removeMutation.isPending}
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Heart className="h-5 w-5 fill-current" />
                                                </Button>
                                            </div>

                                            {guide.bio && (
                                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                                    {guide.bio}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {guide.languages && guide.languages.length > 0 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        <Globe className="h-3 w-3 mr-1" />
                                                        {guide.languages.slice(0, 2).join(", ")}
                                                        {guide.languages.length > 2 && ` +${guide.languages.length - 2}`}
                                                    </Badge>
                                                )}
                                                {guide.specialties && guide.specialties.length > 0 && (
                                                    <Badge variant="secondary" className="text-xs capitalize">
                                                        {guide.specialties[0].replace("_", " ")}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {guide.phone && (
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={`tel:${guide.phone}`}>
                                                            <Phone className="h-3.5 w-3.5 mr-1" />
                                                            Call
                                                        </a>
                                                    </Button>
                                                )}
                                                <Button size="sm">
                                                    <Users className="h-3.5 w-3.5 mr-1" />
                                                    Request Guide
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
