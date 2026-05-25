
import { useState } from "react";
import { useRoute, Link } from "wouter";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { friends } from "@/data/friends";
import { ArrowLeft, MapPin, Share2, Quote, Globe, Instagram, Twitter, Facebook, Youtube, Linkedin, Menu, X } from "lucide-react";
import NotFound from "@/pages/not-found";
import { PublicHeader } from "@/components/public-header";

export default function FriendProfile() {
    const [, params] = useRoute("/friends-of-dzaleka/:slug");
    const slug = params?.slug;

    const friend = friends.find(f => f.slug === slug);

    if (!friend) {
        return <NotFound />;
    }

    const initials = friend.name.split(' ').map(n => n[0]).join('');
    const imageUrl = friend.image
        ? (friend.image.startsWith('http') ? friend.image : `https://visit.dzaleka.com${friend.image}`)
        : undefined;
    const profileDescription = `${friend.shortBio} Learn about ${friend.name}'s connection to Dzaleka and contribution to community-led storytelling.`;

    const schemaData = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": friend.name,
        "jobTitle": friend.role,
        "description": friend.shortBio,
        "image": imageUrl,
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

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <SEO
                title={`${friend.name} - Friend of Dzaleka`}
                description={profileDescription}
                canonical={`https://visit.dzaleka.com/friends-of-dzaleka/${friend.slug}`}
                ogImage={imageUrl}
                imageAlt={`${friend.name}, ${friend.role}`}
                type="profile"
                keywords={`${friend.name}, Friends of Dzaleka, Dzaleka community storytelling, refugee advocacy, Visit Dzaleka`}
                structuredData={schemaData}
            />

            {/* Header */}
            <PublicHeader activePath="/friends-of-dzaleka" />

            <main className="flex-1">
                {/* Hero / Header */}
                <section className="relative bg-muted/20 pt-10 pb-12 border-b border-muted/40 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
                    <div className="container mx-auto px-4 relative z-10">
                        <Link href="/friends-of-dzaleka">
                            <Button variant="ghost" size="sm" className="mb-6 pl-0 hover:bg-transparent hover:text-primary transition-colors">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Friends of Dzaleka
                            </Button>
                        </Link>

                        <div className="max-w-5xl mx-auto grid md:grid-cols-[300px_1fr] gap-8 items-start">
                            {/* Image Column */}
                            <div className="aspect-[4/5] bg-background rounded-2xl overflow-hidden border border-muted/60 shadow-xl relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-background flex items-center justify-center text-primary text-8xl font-bold tracking-tight">
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
                                <div className="space-y-2">
                                    <Badge variant="outline" className="px-3 py-1 border-primary/20 bg-primary/5 text-primary text-[11px] font-semibold tracking-wider rounded-full uppercase">
                                        Friend of Dzaleka
                                    </Badge>
                                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                                        {friend.name}
                                    </h1>
                                    <p className="text-xl text-primary font-semibold">
                                        {friend.role}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <span>Based in {friend.location}</span>
                                </div>

                                <div className="flex flex-wrap gap-3 pt-2">
                                    {friend.social.website && (
                                        <a href={friend.social.website} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-background border border-muted/80 hover:border-primary/50 hover:text-primary transition-colors" aria-label="Website">
                                            <Globe className="h-5 w-5" />
                                        </a>
                                    )}
                                    {friend.social.instagram && (
                                        <a href={friend.social.instagram} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-background border border-muted/80 hover:border-primary/50 hover:text-primary transition-colors" aria-label="Instagram">
                                            <Instagram className="h-5 w-5" />
                                        </a>
                                    )}
                                    {friend.social.twitter && (
                                        <a href={friend.social.twitter} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-background border border-muted/80 hover:border-primary/50 hover:text-primary transition-colors" aria-label="Twitter">
                                            <Twitter className="h-5 w-5" />
                                        </a>
                                    )}
                                    {friend.social.facebook && (
                                        <a href={friend.social.facebook} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-background border border-muted/80 hover:border-primary/50 hover:text-primary transition-colors" aria-label="Facebook">
                                            <Facebook className="h-5 w-5" />
                                        </a>
                                    )}
                                    {friend.social.linkedin && (
                                        <a href={friend.social.linkedin} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-background border border-muted/80 hover:border-primary/50 hover:text-primary transition-colors" aria-label="LinkedIn">
                                            <Linkedin className="h-5 w-5" />
                                        </a>
                                    )}
                                    {friend.social.youtube && (
                                        <a href={friend.social.youtube} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-background border border-muted/80 hover:border-primary/50 hover:text-primary transition-colors" aria-label="YouTube">
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
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <Card className="border border-muted/60 bg-muted/10 shadow-sm relative overflow-hidden">
                                        <CardContent className="p-6 space-y-4">
                                            <h3 className="font-bold text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                                                <Share2 className="h-4.5 w-4.5" /> Connection to Dzaleka
                                            </h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {friend.connection}
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border border-muted/60 bg-muted/10 shadow-sm relative overflow-hidden">
                                        <CardContent className="p-6 space-y-4">
                                            <h3 className="font-bold text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                                                <Quote className="h-4.5 w-4.5" /> Contribution
                                            </h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {friend.contribution}
                                            </p>
                                        </CardContent>
                                    </Card>
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
