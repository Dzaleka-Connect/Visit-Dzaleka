import { useQuery } from "@tanstack/react-query";
import { BlogPost } from "@shared/schema";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowLeft, Menu, X, Clock, Share2, ChevronRight, Home, BookOpen, ArrowRight } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { FaFacebook, FaTwitter, FaWhatsapp, FaLinkedin } from "react-icons/fa";
import { IoCopyOutline, IoCheckmark } from "react-icons/io5";

export default function BlogPostPage() {
    const [, params] = useRoute("/blog/:slug");
    const slug = params?.slug;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const { data: post, isLoading, error } = useQuery<BlogPost>({
        queryKey: [`/api/blog/${slug}`],
        enabled: !!slug,
    });

    // Fetch all posts for related posts section
    const { data: allPosts } = useQuery<BlogPost[]>({
        queryKey: ["/api/blog"],
    });

    // Get related posts (exclude current, take 3)
    const relatedPosts = allPosts?.filter(p => p.slug !== slug).slice(0, 3) || [];

    // Share URL
    const shareUrl = typeof window !== "undefined" ? window.location.href : `https://visit.dzaleka.com/blog/${slug}`;
    const shareTitle = post?.title || "Check out this article from Dzaleka";

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };


    if (isLoading) {
        return <BlogPostSkeleton />;
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <SEO
                    title="Article Not Found | Visit Dzaleka"
                    description="The article you are looking for does not exist."
                    robots="noindex"
                />
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
            {/* Structured Data for Google "Top Stories" - BlogPosting */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        "headline": post.title,
                        "image": [
                            post.coverImage || "https://services.dzaleka.com/images/dzaleka-digital-heritage.png"
                        ],
                        "datePublished": post.publishedAt || new Date().toISOString(),
                        "dateModified": post.publishedAt || new Date().toISOString(),
                        "author": {
                            "@type": "Person",
                            "name": "Visit Dzaleka Team"
                        },
                        "publisher": {
                            "@type": "Organization",
                            "name": "Visit Dzaleka",
                            "logo": {
                                "@type": "ImageObject",
                                "url": "https://services.dzaleka.com/images/dzaleka-digital-heritage.png"
                            }
                        },
                        "description": post.excerpt || post.content.substring(0, 160)
                    })
                }}
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
                {/* Breadcrumb Navigation */}
                <div className="bg-muted/30 border-b">
                    <div className="container mx-auto px-4 max-w-4xl py-3">
                        <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
                            <Link href="/" className="flex items-center hover:text-foreground transition-colors">
                                <Home className="h-4 w-4" />
                            </Link>
                            <ChevronRight className="h-3 w-3" />
                            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-foreground truncate max-w-[200px]">{post.title}</span>
                        </nav>
                    </div>
                </div>

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

                            {/* Social Sharing - Top */}
                            <div className="flex items-center gap-2 pt-4">
                                <span className="text-sm text-muted-foreground mr-2 flex items-center"><Share2 className="h-4 w-4 mr-1" /> Share:</span>
                                <a
                                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-9 w-9 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                                    aria-label="Share on Facebook"
                                >
                                    <FaFacebook className="h-4 w-4" />
                                </a>
                                <a
                                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-9 w-9 rounded-full bg-[#1DA1F2] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                                    aria-label="Share on Twitter"
                                >
                                    <FaTwitter className="h-4 w-4" />
                                </a>
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-9 w-9 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                                    aria-label="Share on WhatsApp"
                                >
                                    <FaWhatsapp className="h-4 w-4" />
                                </a>
                                <a
                                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-9 w-9 rounded-full bg-[#0A66C2] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                                    aria-label="Share on LinkedIn"
                                >
                                    <FaLinkedin className="h-4 w-4" />
                                </a>
                                <button
                                    onClick={handleCopyLink}
                                    className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                                    aria-label="Copy link"
                                >
                                    {copied ? <IoCheckmark className="h-4 w-4 text-green-500" /> : <IoCopyOutline className="h-4 w-4" />}
                                </button>
                            </div>
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
                <article className="container mx-auto px-4 max-w-3xl pb-12">
                    <div className="prose prose-slate dark:prose-invert lg:prose-lg mx-auto">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {post.content}
                        </ReactMarkdown>
                    </div>
                </article>

                {/* Social Sharing - Bottom */}
                <div className="container mx-auto px-4 max-w-3xl pb-12">
                    <div className="border-t pt-8">
                        <p className="text-sm font-medium mb-4">Enjoyed this article? Share it with others:</p>
                        <div className="flex items-center gap-3 flex-wrap">
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1877F2] text-white text-sm font-medium hover:opacity-80 transition-opacity"
                            >
                                <FaFacebook className="h-4 w-4" /> Facebook
                            </a>
                            <a
                                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1DA1F2] text-white text-sm font-medium hover:opacity-80 transition-opacity"
                            >
                                <FaTwitter className="h-4 w-4" /> Twitter
                            </a>
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] text-white text-sm font-medium hover:opacity-80 transition-opacity"
                            >
                                <FaWhatsapp className="h-4 w-4" /> WhatsApp
                            </a>
                            <button
                                onClick={handleCopyLink}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                                {copied ? <IoCheckmark className="h-4 w-4 text-green-500" /> : <IoCopyOutline className="h-4 w-4" />}
                                {copied ? "Copied!" : "Copy Link"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Book a Tour CTA */}
                <div className="container mx-auto px-4 max-w-3xl pb-12">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">Ready to Experience Dzaleka?</h3>
                                <p className="text-muted-foreground">
                                    Book a guided tour and discover the vibrant culture, creativity, and resilience of Dzaleka Refugee Camp firsthand.
                                </p>
                            </div>
                            <Button asChild size="lg" className="shrink-0">
                                <Link href="/login">
                                    Book Your Tour <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                    <div className="container mx-auto px-4 max-w-4xl pb-20">
                        <div className="border-t pt-12">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <BookOpen className="h-6 w-6 text-primary" />
                                    More Articles
                                </h2>
                                <Button variant="ghost" asChild className="group">
                                    <Link href="/blog">
                                        View All <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                            </div>
                            <div className="grid gap-6 md:grid-cols-3">
                                {relatedPosts.map((relatedPost) => (
                                    <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                                        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group h-full">
                                            {relatedPost.coverImage && (
                                                <div className="aspect-video overflow-hidden bg-muted">
                                                    <img
                                                        src={relatedPost.coverImage}
                                                        alt={relatedPost.title}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                </div>
                                            )}
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{relatedPost.publishedAt ? format(new Date(relatedPost.publishedAt), "MMM d, yyyy") : "Draft"}</span>
                                                </div>
                                                <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                                                    {relatedPost.title}
                                                </h3>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
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
