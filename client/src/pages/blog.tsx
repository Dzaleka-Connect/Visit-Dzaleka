import { useQuery } from "@tanstack/react-query";
import { BlogPost } from "@shared/schema";
import { Link, useSearch } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { PublicHeader } from "@/components/public-header";

const POSTS_PER_PAGE = 6;

// Dzaleka Highlights - Inspiration articles
const dzalekaHighlights = [
    {
        title: "24 Hours in Dzaleka",
        description: "Make the most of your day with our curated itinerary",
        image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhQC52NEfamRlqaUT7uLWcP8ZKNUDp3_opelPFqoO6E5hyphenhyphen09lp-zxRXXig5aEnaH3PbRsia1ciM8y-vOdzDe9RMvbQApON7rdM0SrBmtVVWAPIzmiId-jvcwSa46-Y-qRApCBTmozhIbWhNZWxcLFY3bp6Q4uNk_LFB5MpYFlXywwX7vYlUQeRoirJWm50/s2048/533061219_1079243081018233_5344782622295089839_n.jpg",
        link: "/blog/24-hours-in-dzaleka"
    },
    {
        title: "Best Markets & Shopping",
        description: "Discover Mardi Marché and artisan crafts",
        image: "https://services.dzaleka.com/images/Dzaleka_Marketplace.jpeg",
        link: "/things-to-do/shopping"
    },
    {
        title: "Arts & Culture Guide",
        description: "From Tumaini Festival to local theater groups",
        image: "https://tumainiletu.org/wp-content/uploads/2021/07/Website-Entrepreneurship-and-innovation-2048x1536.jpg",
        link: "/things-to-do/arts-culture"
    },
    {
        title: "Food Experiences",
        description: "Taste King's Chapati and authentic Congolese cuisine",
        image: "https://live.staticflickr.com/65535/49083236178_c692c9746d_c.jpg",
        link: "/things-to-do"
    },
];

export default function BlogList() {
    const [currentPage, setCurrentPage] = useState(1);
    const searchString = useSearch();
    const searchParams = new URLSearchParams(searchString);
    const initialQuery = searchParams.get("q") || "";
    const [searchTerm, setSearchTerm] = useState(initialQuery);

    const { data: posts, isLoading } = useQuery<BlogPost[]>({
        queryKey: ["/api/blog"],
    });

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Update URL when search changes (optional, but good for UX)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (searchTerm) {
            params.set("q", searchTerm);
        } else {
            params.delete("q");
        }
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState({}, '', newUrl);
    }, [searchTerm]);

    const filteredPosts = posts?.filter(post => {
        if (!searchTerm) return true;
        const lowerTerm = searchTerm.toLowerCase();
        return (
            post.title.toLowerCase().includes(lowerTerm) ||
            post.content.toLowerCase().includes(lowerTerm) ||
            (post.excerpt && post.excerpt.toLowerCase().includes(lowerTerm))
        );
    }) || [];

    // Pagination logic
    const totalPosts = filteredPosts.length;
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    const currentPosts = filteredPosts.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Blog & Inspiration | Stories from Dzaleka"
                description="Read inspiring stories, travel tips, and updates from Dzaleka Refugee Camp. Discover the resilience and creativity of the community."
                keywords="Dzaleka blog, refugee stories, travel inspiration Malawi, Dzaleka news, community stories"
                canonical="https://visit.dzaleka.com/blog"
                ogImage="https://tumainiletu.org/wp-content/uploads/2021/07/Website-Entrepreneurship-and-innovation-2048x1536.jpg"
            />
            <PublicHeader />

            <main className="flex-1">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-3xl mx-auto text-center mb-12">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full uppercase tracking-widest font-semibold">
                            INSPIRATION
                        </Badge>

                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8">
                            Searching for inspiration?
                        </h1>

                        <div className="mb-8 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            <p>
                                Discover unique ways to experience Dzaleka through our latest stories and itineraries. Whether you're looking for cultural insights, travel tips, or hidden gems, search below to make the most of your visit.
                            </p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-md mx-auto mb-12 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search articles..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="h-96 rounded-xl bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Posts count */}
                            {filteredPosts.length > 0 ? (
                                <div className="flex items-center justify-between mb-6">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {startIndex + 1}-{Math.min(endIndex, totalPosts)} of {totalPosts} results
                                    </p>
                                    {totalPages > 1 && (
                                        <p className="text-sm text-muted-foreground">
                                            Page {currentPage} of {totalPages}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground text-lg">No articles found matching "{searchTerm}"</p>
                                    <Button variant="link" onClick={() => setSearchTerm("")}>Clear search</Button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {currentPosts.map((post) => (
                                    <Card key={post.id} className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow border-muted/60">
                                        {post.coverImage && (
                                            <div className="h-48 w-full overflow-hidden bg-muted">
                                                <img
                                                    src={post.coverImage}
                                                    alt={post.title}
                                                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                                />
                                            </div>
                                        )}
                                        <CardHeader>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                                <Calendar className="h-3 w-3" />
                                                <span>{post.publishedAt ? format(new Date(post.publishedAt), "MMM d, yyyy") : "Draft"}</span>
                                            </div>
                                            <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
                                                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <p className="text-muted-foreground line-clamp-3 text-sm">
                                                {post.excerpt || post.content.substring(0, 150) + "..."}
                                            </p>
                                        </CardContent>
                                        <CardFooter className="pt-0">
                                            <Button asChild variant="ghost" size="sm" className="ml-auto group">
                                                <Link href={`/blog/${post.slug}`}>
                                                    Read More <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                </Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                                {posts?.length === 0 && (
                                    <div className="col-span-full text-center py-12 text-muted-foreground">
                                        <p>No blog posts found. Check back later!</p>
                                    </div>
                                )}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-12">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="gap-1"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <Button
                                                key={page}
                                                variant={currentPage === page ? "default" : "ghost"}
                                                size="sm"
                                                onClick={() => goToPage(page)}
                                                className="w-10"
                                            >
                                                {page}
                                            </Button>
                                        ))}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="gap-1"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Plan Your Visit Section */}
                <section className="py-24 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Start Planning Your Visit</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Everything you need to know to prepare for an unforgettable experience at Dzaleka.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <Link href="/plan-your-trip">
                                <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                                    <div className="aspect-video relative overflow-hidden">
                                        <img
                                            src="https://tumainiletu.org/wp-content/uploads/2024/10/Badre_Bahaji_Tumaini_festival21_-31-1.jpg"
                                            alt="Plan Your Trip"
                                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                            <h3 className="text-white text-3xl font-bold">Plan Your Trip</h3>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <p className="text-muted-foreground">
                                            Essential information on how to get here, what to pack, safety guidelines, and booking procedures.
                                        </p>
                                        <div className="mt-4 flex items-center text-primary font-medium">
                                            View Guide <ArrowRight className="ml-2 h-4 w-4" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href="/accommodation">
                                <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                                    <div className="aspect-video relative overflow-hidden">
                                        <img
                                            src="https://tumainiletu.org/wp-content/uploads/2024/10/Dzaleka_107-min.jpg"
                                            alt="Accommodation"
                                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                            <h3 className="text-white text-3xl font-bold">Where to Stay</h3>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <p className="text-muted-foreground">
                                            Discover our homestay program for a full immersion, or browse trusted nearby hotels in Dowa.
                                        </p>
                                        <div className="mt-4 flex items-center text-primary font-medium">
                                            Find Accommodation <ArrowRight className="ml-2 h-4 w-4" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Important Highlights Section */}
                <section className="py-24 bg-background border-t">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dzaleka Highlights</h2>
                            <Button variant="ghost" asChild className="group">
                                <Link href="/things-to-do">
                                    View All
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {dzalekaHighlights.map((highlight) => (
                                <Link key={highlight.title} href={highlight.link}>
                                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group h-full">
                                        <div className="aspect-[4/3] relative overflow-hidden">
                                            <img
                                                src={highlight.image}
                                                alt={highlight.title}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "https://tumainiletu.org/wp-content/uploads/2024/10/Badre_Bahaji_Tumaini_festival21_-31-1.jpg";
                                                }}
                                            />
                                        </div>
                                        <CardContent className="p-4">
                                            <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">{highlight.title}</h3>
                                            <p className="text-sm text-muted-foreground">{highlight.description}</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
