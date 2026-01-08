import { useQuery } from "@tanstack/react-query";
import { BlogPost } from "@shared/schema";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowLeft, Menu, X, Clock } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";

export default function BlogPostPage() {
    const [, params] = useRoute("/blog/:slug");
    const slug = params?.slug;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const { data: post, isLoading, error } = useQuery<BlogPost>({
        queryKey: [`/api/blog/${slug}`],
        enabled: !!slug,
    });

    if (isLoading) {
        return <BlogPostSkeleton />;
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
                <p className="text-muted-foreground mb-6">The article you are looking for does not exist or has been removed.</p>
                <Button asChild>
                    <Link href="/blog">Back to Blog</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title={post.title}
                description={post.excerpt || post.content.substring(0, 160)}
                keywords={`Dzaleka, blog, ${post.title.toLowerCase()}`}
                canonical={`https://visit.dzaleka.com/blog/${post.slug}`}
                ogImage={post.coverImage || "https://services.dzaleka.com/images/dzaleka-digital-heritage.png"}
                type="article"
            />
            {/* Header - Reused from Blog List (should probably extracting to component later) */}
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

            <main className="flex-1">
                {/* Hero / Header Section */}
                <div className="bg-muted/30 py-12 md:py-20 border-b">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <Button asChild variant="ghost" size="sm" className="mb-8 -ml-4 text-muted-foreground hover:text-foreground">
                            <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog</Link>
                        </Button>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center"><Calendar className="mr-1.5 h-4 w-4" /> {post.publishedAt ? format(new Date(post.publishedAt), "MMMM d, yyyy") : "Draft"}</span>
                                <span>•</span>
                                <span className="flex items-center"><Clock className="mr-1.5 h-4 w-4" /> {Math.ceil(post.content.length / 1000)} min read</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">{post.title}</h1>
                            {post.excerpt && <p className="text-xl text-muted-foreground leading-relaxed">{post.excerpt}</p>}
                        </div>
                    </div>
                </div>

                {/* Cover Image */}
                {post.coverImage && (
                    <div className="container mx-auto px-4 max-w-5xl -mt-8 md:-mt-12 mb-12">
                        <div className="aspect-video w-full overflow-hidden rounded-xl shadow-lg border bg-muted">
                            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                        </div>
                    </div>
                )}

                {/* Content */}
                <article className="container mx-auto px-4 max-w-3xl pb-20">
                    <div className="prose prose-slate dark:prose-invert lg:prose-lg mx-auto">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {post.content}
                        </ReactMarkdown>
                    </div>
                </article>
            </main>

            <SiteFooter />
        </div>
    );
}

function BlogPostSkeleton() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="h-16 border-b w-full" />
            <div className="container mx-auto px-4 max-w-4xl py-20">
                <Skeleton className="h-6 w-24 mb-6" />
                <Skeleton className="h-12 w-3/4 mb-4" />
                <Skeleton className="h-6 w-1/2 mb-12" />
                <Skeleton className="h-96 w-full rounded-xl mb-12" />
                <div className="space-y-4 max-w-3xl mx-auto">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </div>
        </div>
    )
}
