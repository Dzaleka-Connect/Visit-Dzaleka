import { useState } from "react";
import { Link } from "wouter";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    Heart,
    Globe,
    CheckCircle2,
    ArrowRight,
    Loader2,
    Menu,
    X,
    Sparkles,
    Camera,
    MessageCircle,
    HandHeart,
    MapPin,
    Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const whoCanApply = [
    "Have a real connection to Dzaleka",
    "Are comfortable sharing your experience responsibly",
    "Respect community values and privacy"
];

const whatInvolves = [
    {
        icon: Share2,
        title: "Share Your Experience",
        description: "Share your personal experience of Dzaleka on social media"
    },
    {
        icon: Camera,
        title: "Be Featured",
        description: "Be featured on Visit Dzaleka platforms"
    },
    {
        icon: MessageCircle,
        title: "Help Promote",
        description: "Help promote guided tours and cultural activities"
    },
    {
        icon: HandHeart,
        title: "Support Local",
        description: "Support local guides, artists, and small businesses"
    }
];

const whoAreThey = [
    "Grew up in Dzaleka or lived there",
    "Have visited the camp and spent time with the community",
    "Are artists, guides, organisers, or supporters connected to Dzaleka",
    "Care about ethical, community-led tourism"
];

export default function FriendsOfDzaleka() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            const response = await fetch("https://formspree.io/f/xqaaajae", {
                method: "POST",
                headers: {
                    'Accept': 'application/json'
                },
                body: formData
            });

            if (response.ok) {
                toast({
                    title: "Application Submitted!",
                    description: "Thank you for your interest in becoming a Friend of Dzaleka. We'll review your application and get back to you soon.",
                    variant: "default",
                });
                form.reset();
            } else {
                throw new Error("Failed to send application");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "There was a problem submitting your application. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <SEO
                title="Friends of Dzaleka"
                description="Join Friends of Dzaleka – help share the real story of Dzaleka Refugee Camp through authentic, community-led storytelling."
                keywords="Friends of Dzaleka, Dzaleka ambassador, community storytelling, refugee camp stories, ethical tourism"
                canonical="https://visit.dzaleka.com/friends-of-dzaleka"
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
                {/* Hero Section */}
                <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
                    <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full uppercase tracking-widest font-semibold">
                            <Heart className="mr-2 h-3.5 w-3.5" />
                            Community Storytelling
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-foreground">
                            Friends of Dzaleka
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
                            Help share the real story of Dzaleka.
                        </p>
                        <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Stories shared by people who know the community.
                        </p>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl -z-10" />
                </section>

                {/* About Friends of Dzaleka */}
                <section className="py-16 bg-background">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <div className="prose prose-lg max-w-none text-muted-foreground">
                            <p className="leading-relaxed">
                                Dzaleka Refugee Camp is a living community shaped by culture, creativity, and everyday life. People here are artists, teachers, students, parents, and business owners.
                            </p>
                            <p className="leading-relaxed">
                                <strong className="text-foreground">Friends of Dzaleka</strong> brings together people who have a genuine connection to the camp and want to help share its story in a respectful and honest way.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Who Are Friends of Dzaleka */}
                <section className="py-16 bg-muted/30">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Users className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Who Are Friends of Dzaleka?</h2>
                        </div>
                        <p className="text-muted-foreground mb-6">Friends of Dzaleka include people who:</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {whoAreThey.map((item, index) => (
                                <div key={index} className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                    <span className="text-sm">{item}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-6">
                            You don't need a large following. What matters is your connection and your respect for the community.
                        </p>
                    </div>
                </section>

                {/* What Being a Friend Involves */}
                <section className="py-16 bg-background">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">What Being a Friend Involves</h2>
                        </div>
                        <p className="text-muted-foreground mb-8">As a Friend of Dzaleka, you may:</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {whatInvolves.map((item, index) => (
                                <Card key={index} className="border-none shadow-sm">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <item.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold mb-1">{item.title}</h3>
                                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-6 italic">
                            There is no script. You choose what and how you share.
                        </p>
                    </div>
                </section>

                {/* Why It Matters */}
                <section className="py-16 bg-primary/5">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Globe className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Why Friends of Dzaleka Matters</h2>
                        </div>
                        <p className="text-muted-foreground mb-6">
                            Many people only hear about Dzaleka through news stories. Friends of Dzaleka helps show everyday life — the culture, the work, and the people behind the headlines.
                        </p>
                        <div className="bg-background p-6 rounded-xl border">
                            <p className="font-semibold mb-4">Your involvement helps:</p>
                            <ul className="grid gap-3 sm:grid-cols-2">
                                <li className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                    Broaden how Dzaleka is understood
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                    Support local livelihoods
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                    Encourage respectful visits
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                    Keep stories rooted in lived experience
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Who Can Apply */}
                <section className="py-16 bg-background">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <div className="flex items-center gap-3 mb-6">
                            <MapPin className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Who Can Apply</h2>
                        </div>
                        <p className="text-muted-foreground mb-6">You can apply if you:</p>
                        <ul className="space-y-3 mb-6">
                            {whoCanApply.map((item, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-sm text-muted-foreground">
                            Applications are reviewed to make sure they align with Visit Dzaleka's approach.
                        </p>
                    </div>
                </section>

                {/* Application Form */}
                <section className="py-16 bg-muted/30">
                    <div className="container mx-auto px-4 max-w-2xl">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Join Friends of Dzaleka</h2>
                            <p className="text-muted-foreground">If you'd like to take part, please fill out the form below.</p>
                        </div>

                        <Card className="shadow-lg border-muted/60">
                            <CardHeader>
                                <CardTitle>Apply to Become a Friend</CardTitle>
                                <CardDescription>
                                    Tell us about your connection to Dzaleka. We'll review your application and get back to you.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <input type="hidden" name="_subject" value="Friends of Dzaleka Application - Visit Dzaleka" />
                                    <input type="hidden" name="form_type" value="friends_of_dzaleka" />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                                            <Input id="firstName" name="firstName" placeholder="Your first name" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                                            <Input id="lastName" name="lastName" placeholder="Your last name" required />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                                        <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="location" className="text-sm font-medium">Where are you based?</label>
                                        <Input id="location" name="location" placeholder="e.g., Lilongwe, Malawi or London, UK" />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="connection" className="text-sm font-medium">What is your connection to Dzaleka?</label>
                                        <Textarea
                                            id="connection"
                                            name="connection"
                                            placeholder="Tell us about your relationship with Dzaleka – did you grow up there, visit, work with the community, or have another connection?"
                                            className="min-h-[100px]"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="how_help" className="text-sm font-medium">How would you like to help share Dzaleka's story?</label>
                                        <Textarea
                                            id="how_help"
                                            name="how_help"
                                            placeholder="e.g., social media, blog posts, video content, word of mouth, etc."
                                            className="min-h-[80px]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="social" className="text-sm font-medium">Social Media / Website (optional)</label>
                                        <Input id="social" name="social" placeholder="@yourhandle or https://..." />
                                    </div>

                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                Submit Application <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
