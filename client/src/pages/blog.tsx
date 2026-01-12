import { useQuery } from "@tanstack/react-query";
import { BlogPost } from "@shared/schema";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight, Menu, X, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";

const POSTS_PER_PAGE = 6;

export default function BlogList() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const { data: posts, isLoading } = useQuery<BlogPost[]>({
        queryKey: ["/api/blog"],
    });

    // Pagination logic
    const totalPosts = posts?.length || 0;
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    const currentPosts = posts?.slice(startIndex, endIndex) || [];

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
            {/* Header - Reused from Landing */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/">
                        <div className="flex items-center gap-3 cursor-pointer">
                            <img src="https://services.dzaleka.com/images/dzaleka-digital-heritage.png" alt="Dzaleka Visit Logo" className="h-10 w-10 rounded-lg shadow-sm" />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold tracking-tight">Dzaleka Visit</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    Official Portal
                                </span>
                            </div>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-4">
                        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
                        <Link href="/blog" className="text-sm font-medium text-primary transition-colors">Blog</Link>
                        <a href="/#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
                        <div className="flex items-center gap-2 ml-2">
                            <Button asChild size="sm">
                                <Link href="/login">Book Now</Link>
                            </Button>
                        </div>
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Nav */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t bg-background p-4 space-y-3">
                        <Link href="/" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                        <Link href="/blog" className="block text-sm font-medium py-1 text-primary" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
                        <div className="flex gap-2 pt-2">
                            <Button asChild className="flex-1">
                                <Link href="/login">Book Now</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto text-center mb-12">
                    <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full uppercase tracking-widest font-semibold">
                        INSPIRATION
                    </Badge>

                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8">
                        Searching for inspiration?
                    </h1>

                    <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                        <p>
                            If you're visiting Dzaleka and looking for travel inspiration, check out our latest articles and helpful itineraries.
                        </p>
                        <p>
                            Stay in the know with our latest articles and discover unique ways to experience the sights.
                        </p>
                        <p>
                            Or if you want helpful tips on how to plan your day or insider information on where to go and what to do, check out our inspiring itineraries.
                        </p>
                        <p className="font-medium text-foreground">
                            No matter your travel goals, read on for inspiration and make the most out of your visit to Dzaleka Refugee Camp.
                        </p>
                    </div>
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
                        {totalPosts > 0 && (
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-sm text-muted-foreground">
                                    Showing {startIndex + 1}-{Math.min(endIndex, totalPosts)} of {totalPosts} articles
                                </p>
                                {totalPages > 1 && (
                                    <p className="text-sm text-muted-foreground">
                                        Page {currentPage} of {totalPages}
                                    </p>
                                )}
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
            </main>

            <SiteFooter />
        </div>
    );
}
