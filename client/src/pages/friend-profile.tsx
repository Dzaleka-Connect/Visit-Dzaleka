
import { useState } from "react";
import { useRoute, Link } from "wouter";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { friends } from "@/data/friends";
import { ArrowLeft, MapPin, Share2, Quote, Instagram, Twitter, Facebook, Youtube, Menu, X } from "lucide-react";
import NotFound from "@/pages/not-found";

export default function FriendProfile() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [, params] = useRoute("/friends-of-dzaleka/:slug");
    const slug = params?.slug;

    const friend = friends.find(f => f.slug === slug);

    if (!friend) {
        return <NotFound />;
    }

    const initials = friend.name.split(' ').map(n => n[0]).join('');

    const schemaData = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": friend.name,
        "jobTitle": friend.role,
        "description": friend.shortBio,
        "image": friend.image || undefined,
        "url": `https://visit.dzaleka.com/friends-of-dzaleka/${friend.slug}`,
        "affiliation": {
            "@type": "Organization",
            "name": "Friends of Dzaleka"
        },
        "knowsAbout": ["Dzaleka Refugee Camp", "Refugee Advocacy", "Community Storytelling"],
        "sameAs": [
            friend.social.instagram,
            friend.social.twitter,
            friend.social.facebook,
            friend.social.youtube,
            friend.social.linkedin,
            friend.social.website
        ].filter(Boolean)
    };

    const imageUrl = friend.image
        ? (friend.image.startsWith('http') ? friend.image : `https://visit.dzaleka.com${friend.image}`)
        : undefined;

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <SEO
                title={`${friend.name} - Friend of Dzaleka`}
                description={`Meet ${friend.name}, a ${friend.role} and Friend of Dzaleka.`}
                canonical={`https://visit.dzaleka.com/friends-of-dzaleka/${friend.slug}`}
                ogImage={imageUrl}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
            />

            {/* Header */}
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
                        <Link href="/about-us" className="text-sm font-medium hover:text-primary transition-colors">About Us</Link>
                        <Link href="/things-to-do" className="text-sm font-medium hover:text-primary transition-colors">Things To Do</Link>
                        <Link href="/partner-with-us" className="text-sm font-medium hover:text-primary transition-colors">Partner With Us</Link>
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
                        <Link href="/about-us" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
                        <Link href="/things-to-do" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Things To Do</Link>
                        <Link href="/partner-with-us" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Partner With Us</Link>
                        <div className="flex gap-2 pt-2">
                            <Button asChild className="flex-1">
                                <Link href="/login">Book Now</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1">
                {/* Hero / Header */}
                <section className="bg-muted/30 pt-10 pb-12">
                    <div className="container mx-auto px-4">
                        <Link href="/friends-of-dzaleka">
                            <Button variant="ghost" size="sm" className="mb-6 pl-0 hover:bg-transparent hover:text-primary">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Friends of Dzaleka
                            </Button>
                        </Link>

                        <div className="max-w-5xl mx-auto grid md:grid-cols-[300px_1fr] gap-8 items-start">
                            {/* Image Column */}
                            <div className="aspect-[4/5] bg-background rounded-xl overflow-hidden shadow-lg relative">
                                <div className="absolute inset-0 flex items-center justify-center bg-primary/10 text-primary text-8xl font-bold">
                                    {initials}
                                </div>
                                {friend.image && (
                                    <img
                                        src={friend.image}
                                        alt={friend.name}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                )}
                            </div>

                            {/* Header Info */}
                            <div className="space-y-6 pt-4">
                                <div>
                                    <Badge variant="outline" className="mb-3 border-primary/20 bg-primary/5 text-primary">
                                        Friend of Dzaleka
                                    </Badge>
                                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-foreground">
                                        {friend.name}
                                    </h1>
                                    <p className="text-xl text-muted-foreground font-medium">
                                        {friend.role}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>Based in {friend.location}</span>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    {friend.social.instagram && (
                                        <a href={friend.social.instagram} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-background border hover:border-primary/50 hover:text-primary transition-all">
                                            <Instagram className="h-5 w-5" />
                                        </a>
                                    )}
                                    {friend.social.twitter && (
                                        <a href={friend.social.twitter} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-background border hover:border-primary/50 hover:text-primary transition-all">
                                            <Twitter className="h-5 w-5" />
                                        </a>
                                    )}
                                    {friend.social.facebook && (
                                        <a href={friend.social.facebook} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-background border hover:border-primary/50 hover:text-primary transition-all">
                                            <Facebook className="h-5 w-5" />
                                        </a>
                                    )}
                                    {friend.social.youtube && (
                                        <a href={friend.social.youtube} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-background border hover:border-primary/50 hover:text-primary transition-all">
                                            <Youtube className="h-5 w-5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Content */}
                <section className="py-16">
                    <div className="container mx-auto px-4">
                        <div className="max-w-5xl mx-auto grid md:grid-cols-[300px_1fr] gap-12">
                            {/* Left Sidebar (Desktop) */}
                            <div className="hidden md:block">
                                <div className="sticky top-24 space-y-6">
                                    <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                                        <h3 className="font-bold mb-2">Want to be a Friend?</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Join {friend.name.split(' ')[0]} and others in sharing the real story of Dzaleka.
                                        </p>
                                        <Link href="/friends-of-dzaleka#apply-form">
                                            <Button className="w-full">Apply Now</Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Right Content */}
                            <div className="space-y-12">
                                {/* Bio */}
                                <div>
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                        About {friend.name.split(' ')[0]}
                                    </h2>
                                    <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
                                        {friend.fullBio.split('\n\n').map((paragraph, i) => (
                                            <p key={i} className="mb-4">{paragraph}</p>
                                        ))}
                                    </div>
                                </div>

                                {/* Connection & Contribution */}
                                <div className="grid sm:grid-cols-2 gap-8">
                                    <div className="bg-muted/30 p-6 rounded-xl border border-muted/60">
                                        <h3 className="font-semibold text-sm uppercase tracking-wide text-primary mb-4 flex items-center gap-2">
                                            <Share2 className="h-4 w-4" /> Connection to Dzaleka
                                        </h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {friend.connection}
                                        </p>
                                    </div>
                                    <div className="bg-muted/30 p-6 rounded-xl border border-muted/60">
                                        <h3 className="font-semibold text-sm uppercase tracking-wide text-primary mb-4 flex items-center gap-2">
                                            <Quote className="h-4 w-4" /> Contribution
                                        </h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {friend.contribution}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mobile CTA */}
                <section className="md:hidden py-12 bg-muted/30 border-t">
                    <div className="container mx-auto px-4 text-center">
                        <h3 className="font-bold text-xl mb-3">Join the Community</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Help us share authentic stories from Dzaleka.
                        </p>
                        <Link href="/friends-of-dzaleka#apply-form">
                            <Button size="lg">Apply to be a Friend</Button>
                        </Link>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
