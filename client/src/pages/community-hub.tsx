import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/components/seo";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
    Globe,
    Calendar,
    FileText,
    Newspaper,
    Image as ImageIcon,
    Briefcase,
    Search,
    ExternalLink,
    MapPin,
    Clock,
    Building,
    CheckCircle2,
    Users,
    Star,
    Mail,
    Phone,
    Facebook,
    Instagram,
    Twitter,
    Linkedin,
    Tag,
    ChevronLeft,
    ChevronRight,
    Filter,
    ShoppingCart,
    Palette,
    Music,
    BarChart3,
    Database,
    ClipboardCheck,
    FolderKanban,
    Store,
    Feather,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceItem {
    id: string;
    title: string;
    slug?: string;
    description?: string;
    category?: string;
    featured?: boolean;
    verified?: boolean;
    logo?: string;
    contact?: {
        email?: string;
        phone?: string;
        hours?: string;
    };
    location?: {
        address?: string;
        city?: string;
    };
    socialMedia?: {
        website?: string;
        facebook?: string;
        instagram?: string;
        twitter?: string;
        linkedin?: string;
    };
    lastUpdated?: string;
    status?: string;
}

interface EventItem {
    id: string;
    title: string;
    slug?: string;
    date?: string;
    endDate?: string;
    location?: string;
    category?: string;
    description?: string;
    featured?: boolean;
    image?: string;
    organizer?: string;
    status?: string;
    contact?: {
        email?: string;
        phone?: string;
        whatsapp?: string;
    };
    registration?: {
        required?: boolean;
        url?: string;
        deadline?: string;
    };
    tags?: string[];
}

interface ResourceItem {
    id: string;
    title: string;
    slug?: string;
    category?: string;
    fileType?: string;
    description?: string;
}

interface NewsItem {
    id: string;
    title: string;
    slug?: string;
    date?: string;
    category?: string;
    description?: string;
    image?: string;
    author?: string;
}

interface PhotoItem {
    id: string;
    title: string;
    slug?: string;
    date?: string;
    image?: string;
    category?: string;
    description?: string;
}

interface JobItem {
    id: string;
    title: string;
    slug?: string;
    type?: string;
    category?: string;
    status?: string;
    organization?: string;
    location?: string;
    deadline?: string;
    posted?: string;
    featured?: boolean;
    skills?: string[];
    description?: string;
    contact?: {
        email?: string;
        phone?: string;
        website?: string;
    };
}

interface ApiResponse<T> {
    status: string;
    count: number;
    data: { [key: string]: T[] };
}

const DZALEKA_BASE_URL = "https://services.dzaleka.com";

// Helper to handle relative URLs from API
const getImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return `${DZALEKA_BASE_URL}${url}`;
    return `${DZALEKA_BASE_URL}/${url}`;
};

function LoadingGrid() {
    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="pb-2">
                        <div className="flex gap-3">
                            <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// Full detail Service Card
function ServiceCard({ item }: { item: ServiceItem }) {
    return (
        <Card className="hover:shadow-md transition-shadow flex flex-col h-full">
            <CardHeader className="pb-2">
                <div className="flex gap-3">
                    <Avatar className="h-12 w-12 rounded-lg shrink-0">
                        <AvatarImage src={getImageUrl(item.logo)} alt={item.title} className="object-cover" />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-bold">
                            {item.title?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
                                {item.verified && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
                                {item.featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />}
                            </div>
                            {item.status && (
                                <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className="shrink-0 text-xs capitalize">
                                    {item.status}
                                </Badge>
                            )}
                        </div>
                        {item.category && (
                            <Badge variant="outline" className="mt-1">
                                <Tag className="h-3 w-3 mr-1" />
                                {item.category}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
                {/* Description */}
                <p className="text-sm text-muted-foreground">{item.description || "No description available"}</p>

                {/* Contact Details */}
                <div className="space-y-1.5">
                    {item.contact?.email && (
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                            <a href={`mailto:${item.contact.email}`} className="text-primary hover:underline truncate">
                                {item.contact.email}
                            </a>
                        </div>
                    )}
                    {item.contact?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                            <a href={`tel:${item.contact.phone}`} className="hover:underline">
                                {item.contact.phone}
                            </a>
                        </div>
                    )}
                    {item.location?.address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.location.address}</span>
                        </div>
                    )}
                    {item.contact?.hours && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>{item.contact.hours}</span>
                        </div>
                    )}
                </div>

                {/* Social Media Links */}
                {item.socialMedia && (
                    <div className="flex flex-wrap gap-2">
                        {item.socialMedia.website && (
                            <a href={item.socialMedia.website} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded hover:bg-muted/80">
                                <Globe className="h-3 w-3" /> Website
                            </a>
                        )}
                        {item.socialMedia.facebook && (
                            <a href={item.socialMedia.facebook} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">
                                <Facebook className="h-3 w-3" /> Facebook
                            </a>
                        )}
                        {item.socialMedia.instagram && (
                            <a href={item.socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs bg-pink-50 text-pink-700 px-2 py-1 rounded hover:bg-pink-100">
                                <Instagram className="h-3 w-3" /> Instagram
                            </a>
                        )}
                        {item.socialMedia.twitter && (
                            <a href={item.socialMedia.twitter} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded hover:bg-sky-100">
                                <Twitter className="h-3 w-3" /> Twitter
                            </a>
                        )}
                        {item.socialMedia.linkedin && (
                            <a href={item.socialMedia.linkedin} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded hover:bg-blue-100">
                                <Linkedin className="h-3 w-3" /> LinkedIn
                            </a>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={`${DZALEKA_BASE_URL}/services/${item.slug || item.id}`} target="_blank" rel="noopener noreferrer">
                        View Full Details <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                </Button>
            </CardFooter>
        </Card>
    );
}

// Full detail Event Card
function EventCard({ item }: { item: EventItem }) {
    const isUpcoming = item.status === "upcoming";
    const eventDate = item.date ? new Date(item.date) : null;

    return (
        <Card className="hover:shadow-md transition-shadow flex flex-col h-full overflow-hidden">
            {item.image && (
                <div className="aspect-video bg-muted overflow-hidden">
                    <img
                        src={getImageUrl(item.image)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                        }}
                    />
                </div>
            )}
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
                    <Badge variant={isUpcoming ? "default" : "secondary"} className="shrink-0">
                        {isUpcoming ? "Upcoming" : "Past"}
                    </Badge>
                </div>
                {item.category && <Badge variant="outline" className="w-fit mt-1">{item.category}</Badge>}
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
                {/* Description */}
                <p className="text-sm text-muted-foreground">{item.description || "No description available"}</p>

                {/* Event Details */}
                <div className="space-y-1.5">
                    {eventDate && (
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{eventDate.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</span>
                        </div>
                    )}
                    {item.location && (
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{item.location}</span>
                        </div>
                    )}
                    {item.organizer && (
                        <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>Organized by: <strong>{item.organizer}</strong></span>
                        </div>
                    )}
                </div>

                {/* Contact Info */}
                {item.contact && (
                    <div className="space-y-1.5">
                        {item.contact.email && (
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                <a href={`mailto:${item.contact.email}`} className="text-primary hover:underline truncate">
                                    {item.contact.email}
                                </a>
                            </div>
                        )}
                        {item.contact.phone && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span>{item.contact.phone}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-2 gap-2 flex-col sm:flex-row">
                {item.registration?.url && isUpcoming && (
                    <Button size="sm" className="w-full sm:w-auto" asChild>
                        <a href={item.registration.url} target="_blank" rel="noopener noreferrer">
                            Register Now
                        </a>
                    </Button>
                )}
                <Button variant="outline" size="sm" className="w-full sm:flex-1" asChild>
                    <a href={`${DZALEKA_BASE_URL}/events/${item.slug || item.id}`} target="_blank" rel="noopener noreferrer">
                        View Details <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                </Button>
            </CardFooter>
        </Card>
    );
}

// Full detail Resource Card
function ResourceCard({ item }: { item: ResourceItem }) {
    return (
        <Card className="hover:shadow-md transition-shadow flex flex-col h-full">
            <CardHeader className="pb-2">
                <div className="flex gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
                        <div className="flex gap-2 mt-1 flex-wrap">
                            {item.category && <Badge variant="outline">{item.category}</Badge>}
                            {item.fileType && <Badge variant="secondary">{item.fileType.toUpperCase()}</Badge>}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">{item.description || "No description available"}</p>
            </CardContent>
            <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={`${DZALEKA_BASE_URL}/resources/${item.slug || item.id}`} target="_blank" rel="noopener noreferrer">
                        View Resource <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                </Button>
            </CardFooter>
        </Card>
    );
}

// Full detail News Card
function NewsCard({ item }: { item: NewsItem }) {
    return (
        <Card className="hover:shadow-md transition-shadow flex flex-col h-full overflow-hidden">
            {item.image && (
                <div className="aspect-video bg-muted overflow-hidden">
                    <img
                        src={getImageUrl(item.image)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                        }}
                    />
                </div>
            )}
            <CardHeader className="pb-2">
                <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
                <div className="flex gap-2 flex-wrap mt-1">
                    {item.date && (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {new Date(item.date).toLocaleDateString()}
                        </span>
                    )}
                    {item.category && <Badge variant="outline">{item.category}</Badge>}
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">{item.description || "No description available"}</p>
                {item.author && <p className="text-sm text-muted-foreground mt-2">By <strong>{item.author}</strong></p>}
            </CardContent>
            <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={`${DZALEKA_BASE_URL}/news/${item.slug || item.id}`} target="_blank" rel="noopener noreferrer">
                        Read More <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                </Button>
            </CardFooter>
        </Card>
    );
}

// Photo Card
function PhotoCard({ item }: { item: PhotoItem }) {
    return (
        <Card className="hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
            {item.image && (
                <div className="aspect-square bg-muted">
                    <img
                        src={getImageUrl(item.image)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                        }}
                    />
                </div>
            )}
            <CardContent className="p-3 flex-1">
                <p className="font-medium text-sm line-clamp-2">{item.title}</p>
                <div className="flex gap-2 flex-wrap mt-1">
                    {item.date && <span className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</span>}
                    {item.category && <Badge variant="outline" className="text-xs">{item.category}</Badge>}
                </div>
                {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
            </CardContent>
            <CardFooter className="pt-0 px-3 pb-3">
                <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={`${DZALEKA_BASE_URL}/photos/${item.slug || item.id}`} target="_blank" rel="noopener noreferrer">
                        View <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                </Button>
            </CardFooter>
        </Card>
    );
}

// Full detail Job Card
function JobCard({ item }: { item: JobItem }) {
    const isOpen = item.status === "open";
    const deadline = item.deadline ? new Date(item.deadline) : null;
    const isExpired = deadline && deadline < new Date();

    return (
        <Card className="hover:shadow-md transition-shadow flex flex-col h-full">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
                            {item.featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />}
                        </div>
                        {item.organization && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Building className="h-4 w-4" /> {item.organization}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant={isOpen && !isExpired ? "default" : "secondary"}>
                        {isOpen && !isExpired ? "Open" : "Closed"}
                    </Badge>
                    {item.type && <Badge variant="outline">{item.type.replace("-", " ")}</Badge>}
                    {item.category && <Badge variant="secondary">{item.category}</Badge>}
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
                {/* Description */}
                <p className="text-sm text-muted-foreground">{item.description || "No description available"}</p>

                {/* Job Details */}
                <div className="space-y-1.5">
                    {item.location && (
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{item.location}</span>
                        </div>
                    )}
                    {deadline && (
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>Deadline: <strong>{deadline.toLocaleDateString()}</strong></span>
                        </div>
                    )}
                    {item.posted && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>Posted: {new Date(item.posted).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                {/* Contact */}
                {item.contact?.email && (
                    <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a href={`mailto:${item.contact.email}`} className="text-primary hover:underline truncate">
                            {item.contact.email}
                        </a>
                    </div>
                )}

                {/* Skills */}
                {item.skills && item.skills.length > 0 && (
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Required Skills:</p>
                        <div className="flex flex-wrap gap-1">
                            {item.skills.map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-2 gap-2 flex-col sm:flex-row">
                {item.contact?.email && isOpen && !isExpired && (
                    <Button size="sm" className="w-full sm:w-auto" asChild>
                        <a href={`mailto:${item.contact.email}?subject=Application for ${item.title}`}>
                            Apply Now
                        </a>
                    </Button>
                )}
                <Button variant="outline" size="sm" className="w-full sm:flex-1" asChild>
                    <a href={`${DZALEKA_BASE_URL}/jobs/${item.slug || item.id}`} target="_blank" rel="noopener noreferrer">
                        View Details <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function CommunityHub() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("services");
    const [servicesPage, setServicesPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // New state for category filter
    const SERVICES_PER_PAGE = 12;

    // Reset category filter and page when tab changes
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setSelectedCategory(null);
        setServicesPage(1);
    };

    const { data: servicesData, isLoading: servicesLoading } = useQuery<ApiResponse<ServiceItem>>({
        queryKey: ["/api/community/services"],
        staleTime: 5 * 60 * 1000,
    });

    const { data: eventsData, isLoading: eventsLoading } = useQuery<ApiResponse<EventItem>>({
        queryKey: ["/api/community/events"],
        staleTime: 5 * 60 * 1000,
    });

    const { data: resourcesData, isLoading: resourcesLoading } = useQuery<ApiResponse<ResourceItem>>({
        queryKey: ["/api/community/resources"],
        staleTime: 5 * 60 * 1000,
    });

    const { data: newsData, isLoading: newsLoading } = useQuery<ApiResponse<NewsItem>>({
        queryKey: ["/api/community/news"],
        staleTime: 5 * 60 * 1000,
    });

    const { data: photosData, isLoading: photosLoading } = useQuery<ApiResponse<PhotoItem>>({
        queryKey: ["/api/community/photos"],
        staleTime: 5 * 60 * 1000,
    });

    const { data: jobsData, isLoading: jobsLoading } = useQuery<ApiResponse<JobItem>>({
        queryKey: ["/api/community/jobs"],
        staleTime: 5 * 60 * 1000,
    });

    const services = servicesData?.data?.services || [];
    const events = eventsData?.data?.events || [];
    const resources = resourcesData?.data?.resources || [];
    const news = newsData?.data?.news || [];
    const photos = photosData?.data?.photos || [];
    const jobs = jobsData?.data?.jobs || [];

    // Smart sort for events and jobs
    // Smart sort for events and jobs
    const { upcomingEvents, pastEvents } = useMemo(() => {
        const now = new Date();

        const upcoming = events.filter(e => {
            const date = e.date ? new Date(e.date) : null;
            // It is upcoming if date is in future OR today 
            // We ignore status "past" if date is future (data correction), but if status is explicitly past we might trust it? 
            // User requirement: "if an event has already passed dont list it as upcoming". So Date is Truth.
            return date && date >= now;
        }).sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()); // Ascending (soonest first)

        const past = events.filter(e => {
            const date = e.date ? new Date(e.date) : null;
            return !date || date < now;
        }).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()); // Descending (most recent first)

        return { upcomingEvents: upcoming, pastEvents: past };
    }, [events]);

    const sortedJobs = useMemo(() => {
        return [...jobs].sort((a, b) => {
            if (a.status === "open" && b.status !== "open") return -1;
            if (a.status !== "open" && b.status === "open") return 1;
            return 0; // Keep API order for same status
        });
    }, [jobs]);


    // Generic filter function
    const filterItems = <T extends { title: string; description?: string; category?: string }>(items: T[]) => {
        return items.filter((item) => {
            const matchesSearch = !searchQuery.trim() ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.description?.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory = !selectedCategory || item.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    };

    // Extract categories for the current tab
    const currentCategories = useMemo(() => {
        let items: { category?: string }[] = [];
        switch (activeTab) {
            case "services": items = services; break;
            case "events": items = events; break;
            case "resources": items = resources; break;
            case "news": items = news; break;
            case "photos": items = photos; break;
            case "jobs": items = jobs; break;
        }
        const categories = new Set(items.map(i => i.category).filter(Boolean) as string[]);
        return Array.from(categories).sort();
    }, [activeTab, services, events, resources, news, photos, jobs]);

    return (
        <div className="min-h-screen bg-background pb-12">
            <SEO
                title="Community Hub"
                description="Explore services, events, resources, news, photos, and job opportunities from the Dzaleka community."
            />

            {/* Hero Section with Search and Gradient */}
            <div className="relative bg-gradient-to-b from-primary/5 via-primary/5 to-background border-b mb-8 pb-8 pt-12 -mx-4 md:-mx-6 -mt-4 md:-mt-6">
                <div className="w-full max-w-5xl mx-auto px-4 md:px-6 space-y-8 text-center flex flex-col items-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                            <Globe className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">Community Hub</h1>
                            <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
                                Connect with essential services, stay informed on local news, and support the refugee-led initiatives driving economic empowerment and self-reliance in Dzaleka.
                            </p>
                        </div>
                    </div>

                    {/* Prominent Search Bar */}
                    <div className="relative w-full max-w-xl mx-auto">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder={`Search for services, events, jobs...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-12 h-14 rounded-full border-muted-foreground/20 bg-background/80 backdrop-blur-xl shadow-sm text-base hover:bg-background/90 focus-visible:ring-primary/20 transition-all font-medium py-2"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container space-y-10">
                {/* Discover Dzaleka - External Services */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold tracking-tight">Discover Dzaleka</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { title: "Marketplace", icon: ShoppingCart, url: "https://services.dzaleka.com/marketplace/", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", border: "hover:border-blue-500/50" },
                            { title: "Digital Stores", icon: Store, url: "https://services.dzaleka.com/marketplace/stores/", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20", border: "hover:border-indigo-500/50" },
                            { title: "Data & Stats", icon: BarChart3, url: "https://services.dzaleka.com/data/", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "hover:border-emerald-500/50" },
                            { title: "Public Art", icon: Palette, url: "https://services.dzaleka.com/public-art-catalogue/", color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-900/20", border: "hover:border-pink-500/50" },
                            { title: "Poets", icon: Feather, url: "https://services.dzaleka.com/poets/", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20", border: "hover:border-purple-500/50" },
                            { title: "Dancers", icon: Music, url: "https://services.dzaleka.com/dancers/", color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20", border: "hover:border-rose-500/50" },
                            { title: "Projects", icon: FolderKanban, url: "https://services.dzaleka.com/projects/", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", border: "hover:border-orange-500/50" },
                            { title: "Site Register", icon: ClipboardCheck, url: "https://services.dzaleka.com/site-register/", color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20", border: "hover:border-cyan-500/50" },
                        ].map((link) => (
                            <a
                                key={link.title}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`group flex flex-col items-center justify-center p-4 rounded-xl border bg-card transition-all duration-300 hover:shadow-md ${link.border}`}
                            >
                                <div className={`h-12 w-12 rounded-full ${link.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                    <link.icon className={`h-6 w-6 ${link.color}`} />
                                </div>
                                <span className="font-medium text-sm text-center">{link.title}</span>
                                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Navigation and Filters */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                            <ScrollArea className="w-full">
                                <TabsList className="inline-flex w-auto min-w-full md:w-auto p-1 bg-muted/50">
                                    <TabsTrigger value="services" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        <Building className="h-4 w-4" /> Services
                                    </TabsTrigger>
                                    <TabsTrigger value="events" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        <Calendar className="h-4 w-4" /> Events
                                    </TabsTrigger>
                                    <TabsTrigger value="jobs" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        <Briefcase className="h-4 w-4" /> Jobs
                                    </TabsTrigger>
                                    <TabsTrigger value="news" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        <Newspaper className="h-4 w-4" /> News
                                    </TabsTrigger>
                                    <TabsTrigger value="resources" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        <FileText className="h-4 w-4" /> Resources
                                    </TabsTrigger>
                                    <TabsTrigger value="photos" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        <ImageIcon className="h-4 w-4" /> Photos
                                    </TabsTrigger>
                                </TabsList>
                                <ScrollBar orientation="horizontal" className="invisible" />
                            </ScrollArea>
                        </Tabs>
                    </div>

                    {/* Category Filter Chips */}
                    {currentCategories.length > 0 && (
                        <ScrollArea className="w-full whitespace-nowrap">
                            <div className="flex items-center gap-2 pb-2">
                                <Filter className="h-4 w-4 text-muted-foreground mr-1" />
                                <Button
                                    variant={selectedCategory === null ? "secondary" : "ghost"}
                                    size="sm"
                                    className="rounded-full h-8"
                                    onClick={() => setSelectedCategory(null)}
                                >
                                    All
                                </Button>
                                {currentCategories.map((category) => (
                                    <Button
                                        key={category}
                                        variant={selectedCategory === category ? "secondary" : "ghost"}
                                        size="sm"
                                        className="rounded-full h-8 border border-transparent hover:border-input"
                                        onClick={() => setSelectedCategory(category)}
                                    >
                                        {category}
                                    </Button>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    )}
                </div>

                {/* Content Area */}

                <div className="min-h-[500px]">
                    {activeTab === "services" && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold mb-1">Local Services Directory</h2>
                                <p className="text-sm text-muted-foreground">Find organizations and businesses operating in Dzaleka.</p>
                            </div>
                            {servicesLoading ? (
                                <LoadingGrid />
                            ) : filterItems(services).length === 0 ? (
                                <EmptyState icon={Building} title="No services found" description="Try adjusting your filters or search." />
                            ) : (
                                <>
                                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                        {filterItems(services)
                                            .slice((servicesPage - 1) * SERVICES_PER_PAGE, servicesPage * SERVICES_PER_PAGE)
                                            .map((item) => (
                                                <ServiceCard key={item.id} item={item} />
                                            ))}
                                    </div>
                                    {/* Pagination */}
                                    {filterItems(services).length > SERVICES_PER_PAGE && (
                                        <div className="mt-8 flex items-center justify-center gap-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setServicesPage((p) => Math.max(1, p - 1))}
                                                disabled={servicesPage === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                                            </Button>
                                            <span className="text-sm text-muted-foreground">
                                                Page {servicesPage} of {Math.ceil(filterItems(services).length / SERVICES_PER_PAGE)}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setServicesPage((p) => Math.min(Math.ceil(filterItems(services).length / SERVICES_PER_PAGE), p + 1))}
                                                disabled={servicesPage >= Math.ceil(filterItems(services).length / SERVICES_PER_PAGE)}
                                            >
                                                Next <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === "events" && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {eventsLoading ? (
                                <LoadingGrid />
                            ) : filterItems(events).length === 0 ? (
                                <div className="space-y-4">
                                    <div className="mb-4">
                                        <h2 className="text-xl font-semibold mb-1">Community Events</h2>
                                        <p className="text-sm text-muted-foreground">Upcoming workshops and gatherings.</p>
                                    </div>
                                    <EmptyState icon={Calendar} title="No events found" description="Try adjusting your filters or search." />
                                </div>
                            ) : (
                                <>
                                    {/* Upcoming Events */}
                                    {filterItems(upcomingEvents).length > 0 && (
                                        <div className="space-y-4">
                                            <div className="mb-2">
                                                <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                                                    <Calendar className="h-5 w-5 text-primary" />
                                                    Upcoming Events
                                                </h2>
                                                <p className="text-sm text-muted-foreground">Don't miss out on these upcoming activities.</p>
                                            </div>
                                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                                {filterItems(upcomingEvents).slice(0, 12).map((item) => (
                                                    <EventCard key={item.id} item={item} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Past Events */}
                                    {filterItems(pastEvents).length > 0 && (
                                        <div className="space-y-4 pt-4 border-t">
                                            <div className="mb-2">
                                                <h2 className="text-xl font-semibold mb-1 text-muted-foreground">Past Events</h2>
                                                <p className="text-sm text-muted-foreground">Archive of previously held events.</p>
                                            </div>
                                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 opacity-80">
                                                {filterItems(pastEvents).slice(0, 12).map((item) => (
                                                    <EventCard key={item.id} item={item} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === "resources" && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold mb-1">Documents & Resources</h2>
                                <p className="text-sm text-muted-foreground">Important forms and educational materials.</p>
                            </div>
                            {resourcesLoading ? (
                                <LoadingGrid />
                            ) : filterItems(resources).length === 0 ? (
                                <EmptyState icon={FileText} title="No resources found" description="Try adjusting your filters or search." />
                            ) : (
                                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                    {filterItems(resources).slice(0, 12).map((item) => (
                                        <ResourceCard key={item.id} item={item} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "news" && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold mb-1">Latest News</h2>
                                <p className="text-sm text-muted-foreground">Updates and stories from the camp.</p>
                            </div>
                            {newsLoading ? (
                                <LoadingGrid />
                            ) : filterItems(news).length === 0 ? (
                                <EmptyState icon={Newspaper} title="No news found" description="Try adjusting your filters or search." />
                            ) : (
                                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                    {filterItems(news).slice(0, 12).map((item) => (
                                        <NewsCard key={item.id} item={item} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "photos" && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold mb-1">Photo Gallery</h2>
                                <p className="text-sm text-muted-foreground">Visual stories from community events.</p>
                            </div>
                            {photosLoading ? (
                                <LoadingGrid />
                            ) : filterItems(photos).length === 0 ? (
                                <EmptyState icon={ImageIcon} title="No photos found" description="Try adjusting your filters or search." />
                            ) : (
                                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                                    {filterItems(photos).slice(0, 20).map((item) => (
                                        <PhotoCard key={item.id} item={item} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "jobs" && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold mb-1">Job Opportunities</h2>
                                <p className="text-sm text-muted-foreground">Current vacancies and volunteer roles.</p>
                            </div>
                            {jobsLoading ? (
                                <LoadingGrid />
                            ) : filterItems(sortedJobs).length === 0 ? (
                                <EmptyState icon={Briefcase} title="No jobs found" description="Try adjusting your filters or search." />
                            ) : (
                                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                    {filterItems(sortedJobs).slice(0, 12).map((item) => (
                                        <JobCard key={item.id} item={item} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Attribution */}
                <div className="text-center text-sm text-muted-foreground border-t pt-8 mt-12 pb-4">
                    Data provided by{" "}
                    <a
                        href="https://services.dzaleka.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        Dzaleka Online Services
                    </a>
                </div>
            </div>
        </div >
    );
}
