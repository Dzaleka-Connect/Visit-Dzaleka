import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import {
    ArrowLeft,
    Phone,
    Mail,
    Globe,
    Calendar,
    Star,
    DollarSign,
    Clock,
    MapPin,
    CheckCircle,
    Users,
    Award,
    AlertCircle,
    CreditCard,
    Edit,
    GraduationCap,
    BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { SEO } from "@/components/seo";
import { formatCurrency } from "@/lib/constants";
import type { Guide, Booking } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface GuideWithBookings extends Guide {
    recentBookings?: Booking[];
}

export default function GuideProfile() {
    const [, params] = useRoute("/guide/:slug");
    const slug = params?.slug || "";
    const { user } = useAuth();
    const isAdmin = user?.role === "admin" || user?.role === "coordinator";

    const { data: guide, isLoading, error } = useQuery<GuideWithBookings>({
        queryKey: [`/api/guides/slug/${slug}`],
        enabled: !!slug,
    });

    const { data: guideBookings } = useQuery<Booking[]>({
        queryKey: [`/api/guides/${guide?.id}/bookings`],
        enabled: !!guide?.id,
    });

    // Fetch training progress for admin view
    const { data: trainingData } = useQuery<{
        modules: Array<{ id: string; title: string; category: string; isRequired: boolean; progress: { status: string; completedAt: string | null } }>;
        stats: { completed: number; total: number; percentage: number };
    }>({
        queryKey: [`/api/guides/${guide?.id}/training`],
        enabled: !!guide?.id && isAdmin,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (error || !guide) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Guide Not Found</h2>
                <p className="text-muted-foreground">The guide you're looking for doesn't exist.</p>
                <Button asChild>
                    <Link href="/guides">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Guides
                    </Link>
                </Button>
            </div>
        );
    }

    const completionRate = guide.totalTours && guide.totalTours > 0
        ? Math.round(((guide.completedTours || 0) / guide.totalTours) * 100)
        : 0;

    const averageRating = guide.totalRatings && guide.totalRatings > 0
        ? (guide.rating || 0) / guide.totalRatings
        : guide.rating || 0;

    // Count bookings by status
    const completedBookings = guideBookings?.filter(b => b.status === "completed").length || 0;
    const upcomingBookings = guideBookings?.filter(b =>
        b.status === "confirmed" && new Date(b.visitDate) >= new Date()
    ).length || 0;

    return (
        <div className="space-y-6">
            <SEO
                title={`${guide.firstName} ${guide.lastName} - Guide Profile`}
                description={guide.bio || `Professional tour guide at Dzaleka Refugee Camp`}
            />

            {/* Header with Back Button */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" asChild>
                    <Link href="/guides">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Guides
                    </Link>
                </Button>
                {isAdmin && (
                    <Button variant="outline" asChild>
                        <Link href={`/guides?edit=${guide.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Guide
                        </Link>
                    </Button>
                )}
            </div>

            {/* Profile Header Card */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Avatar and Basic Info */}
                        <div className="flex flex-col items-center md:items-start gap-4">
                            <Avatar className="h-32 w-32">
                                <AvatarImage src={guide.profileImageUrl || undefined} className="object-cover" />
                                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                                    {guide.firstName[0]}{guide.lastName[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center md:text-left">
                                <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                                    <h1 className="text-2xl font-bold">{guide.firstName} {guide.lastName}</h1>
                                    {guide.isActive ? (
                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            <CheckCircle className="mr-1 h-3 w-3" />
                                            Active
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary">Inactive</Badge>
                                    )}
                                </div>
                                <p className="text-muted-foreground mt-1">Professional Tour Guide</p>
                            </div>
                        </div>

                        {/* Contact Info & Stats */}
                        <div className="flex-1 space-y-4">
                            {/* Contact Information */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <p className="font-medium">{guide.phone}</p>
                                    </div>
                                </div>
                                {guide.email && (
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Email</p>
                                            <p className="font-medium">{guide.email}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{guide.totalTours || 0}</div>
                                    <p className="text-xs text-muted-foreground">Total Tours</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{guide.completedTours || 0}</div>
                                    <p className="text-xs text-muted-foreground">Completed</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-amber-600">
                                        <Star className="h-5 w-5 fill-amber-400" />
                                        {averageRating.toFixed(1)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {guide.totalRatings ? `${guide.totalRatings} reviews` : "Rating"}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-emerald-600">
                                        {formatCurrency(guide.totalEarnings || 0)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Earnings</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Bio */}
                    {guide.bio && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">About</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed">{guide.bio}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Languages & Specialties */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Skills & Languages</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {guide.languages && guide.languages.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-blue-500" />
                                        Languages
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {guide.languages.map((lang) => (
                                            <Badge key={lang} variant="secondary">{lang}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {guide.specialties && guide.specialties.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                        <Award className="h-4 w-4 text-purple-500" />
                                        Specialties
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {guide.specialties.map((specialty) => (
                                            <Badge key={specialty} variant="outline">{specialty}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {guide.assignedZones && guide.assignedZones.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-red-500" />
                                        Assigned Zones
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {guide.assignedZones.map((zone) => (
                                            <Badge key={zone} variant="outline" className="border-red-200 text-red-700 dark:border-red-800 dark:text-red-400">
                                                {zone}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Performance Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Performance</CardTitle>
                            <CardDescription>Tour completion and ratings overview</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Completion Rate</span>
                                    <span className="text-sm text-muted-foreground">{completionRate}%</span>
                                </div>
                                <Progress value={completionRate} className="h-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <Calendar className="h-4 w-4" />
                                        Upcoming Tours
                                    </div>
                                    <div className="text-2xl font-bold">{upcomingBookings}</div>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <CheckCircle className="h-4 w-4" />
                                        Completed Tours
                                    </div>
                                    <div className="text-2xl font-bold text-green-600">{completedBookings}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-6">
                    {/* Training Progress - Admin View */}
                    {isAdmin && trainingData && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-purple-500" />
                                    Training Progress
                                </CardTitle>
                                <CardDescription>
                                    {trainingData.stats.completed} of {trainingData.stats.total} modules completed
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Completion</span>
                                        <span className="text-sm text-muted-foreground">{trainingData.stats.percentage}%</span>
                                    </div>
                                    <Progress value={trainingData.stats.percentage} className="h-2" />
                                </div>
                                {trainingData.stats.percentage === 100 ? (
                                    <Badge className="bg-green-500 text-white w-full justify-center py-1">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Fully Certified
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="w-full justify-center py-1">
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        Training In Progress
                                    </Badge>
                                )}
                                <Separator />
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {trainingData.modules.slice(0, 5).map((module) => (
                                        <div key={module.id} className="flex items-center justify-between text-sm">
                                            <span className="truncate flex-1 mr-2">{module.title}</span>
                                            {module.progress.status === "completed" ? (
                                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                            ) : module.progress.status === "in_progress" ? (
                                                <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                            ) : (
                                                <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                    {trainingData.modules.length > 5 && (
                                        <p className="text-xs text-muted-foreground text-center pt-2">
                                            +{trainingData.modules.length - 5} more modules
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Availability */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-blue-500" />
                                Availability
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">Available Days</p>
                                <div className="flex flex-wrap gap-1">
                                    {(guide as any).availableDays?.length > 0 ? (
                                        (guide as any).availableDays.map((day: string) => (
                                            <Badge key={day} variant="outline" className="text-xs capitalize">{day}</Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Not specified</span>
                                    )}
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">Preferred Times</p>
                                <div className="flex flex-wrap gap-1">
                                    {(guide as any).preferredTimes?.length > 0 ? (
                                        (guide as any).preferredTimes.map((time: string) => (
                                            <Badge key={time} variant="secondary" className="text-xs capitalize">{time}</Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Not specified</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Preference */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-green-500" />
                                Payment Preference
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant="secondary" className="text-sm">
                                {(guide as any).preferredPaymentMethod === "both"
                                    ? "Cash & Mobile Money"
                                    : (guide as any).preferredPaymentMethod === "mobile_money"
                                        ? "Mobile Money"
                                        : (guide as any).preferredPaymentMethod === "airtel_money"
                                            ? "Airtel Money"
                                            : (guide as any).preferredPaymentMethod === "tnm_mpamba"
                                                ? "TNM Mpamba"
                                                : (guide as any).preferredPaymentMethod === "cash"
                                                    ? "Cash"
                                                    : "Not specified"}
                            </Badge>
                        </CardContent>
                    </Card>

                    {/* Emergency Contact */}
                    {((guide as any).emergencyContactName || (guide as any).emergencyContactPhone) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                    Emergency Contact
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(guide as any).emergencyContactName && (
                                    <p className="font-medium">{(guide as any).emergencyContactName}</p>
                                )}
                                {(guide as any).emergencyContactPhone && (
                                    <p className="text-sm text-muted-foreground">{(guide as any).emergencyContactPhone}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Additional Notes */}
                    {(guide as any).additionalNotes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{(guide as any).additionalNotes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
