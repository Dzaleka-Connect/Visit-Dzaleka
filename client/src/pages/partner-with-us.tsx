import { useState } from "react";
import { Link } from "wouter";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Users,
    HeartHandshake,
    Globe2,
    Lightbulb,
    CheckCircle2,
    ArrowRight,
    Loader2,
    Menu,
    X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const benefits = [
    {
        icon: Users,
        title: "Expert Local Knowledge",
        description: "Our guides are passionate locals who know every corner of Dzaleka, ensuring authentic and respectful experiences for your clients."
    },
    {
        icon: HeartHandshake,
        title: "Support Community Growth",
        description: "Partnering with us means directly supporting refugee-led initiatives and economic empowerment within the camp."
    },
    {
        icon: Globe2,
        title: "Exclusive Cultural Access",
        description: "From the Tumaini Festival to hidden art workshops, we offer access to experiences you won't find anywhere else."
    },
    {
        icon: Lightbulb,
        title: "Customizable Itineraries",
        description: "We work with you to craft tailored experiences, whether for educational groups, researchers, or cultural tourists."
    }
];

export default function PartnerWithUs() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const form = e.currentTarget;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

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
                    title: "Message Sent!",
                    description: "Thank you for your interest. We will get back to you shortly.",
                    variant: "default",
                });
                form.reset();
            } else {
                throw new Error("Failed to send message");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "There was a problem sending your message. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <SEO
                title="Partner With Us | Dzaleka Visit"
                description="Join us in creating meaningful connections. Partner with Dzaleka Visit to offer authentic cultural experiences and support the refugee community."
                keywords="partner with Dzaleka, tourism partnership Malawi, refugee camp tours collaboration, sustainable tourism partners"
                canonical="https://visit.dzaleka.com/partner-with-us"
            />

            {/* Header - Reused from Landing/Blog */}
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
                        <Link href="/blog" className="text-sm font-medium hover:text-primary transition-colors">Blog</Link>
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
                        <Link href="/blog" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
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
                <section className="relative py-24 md:py-32 overflow-hidden bg-muted/30">
                    <div className="absolute inset-0 z-0 opacity-10">
                        <img
                            src="https://tumainiletu.org/wp-content/uploads/2021/07/Website-Entrepreneurship-and-innovation-2048x1536.jpg"
                            alt="Background Pattern"
                            className="w-full h-full object-cover grayscale"
                        />
                    </div>
                    <div className="container relative z-10 mx-auto px-4 text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-foreground">
                            Partner with Dzaleka Visit
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Join us in redefining narrative through tourism. Connect your clients with authentic stories, resilience, and the vibrant creativity of Dzaleka Refugee Camp.
                        </p>
                    </div>
                </section>

                {/* Why Partner Section */}
                <section className="py-24 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Why Collaborate With Us?</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                We believe in partnerships that are mutually beneficial, transparent, and impact-driven.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {benefits.map((benefit, index) => (
                                <Card key={index} className="border-none shadow-md hover:shadow-xl transition-shadow duration-300">
                                    <CardHeader>
                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                            <benefit.icon className="h-6 w-6" />
                                        </div>
                                        <CardTitle className="text-xl font-bold">{benefit.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {benefit.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Partnership CTA / Contact Form */}
                <section className="py-24 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
                            {/* Left Side: Content */}
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight mb-6">Let's Build Something Together</h2>
                                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                                    Are you a tour operator, travel agent, or educational institution? We'd love to discuss how we can work together to create unforgettable experiences for your groups.
                                </p>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <CheckCircle2 className="h-6 w-6 text-primary mt-1 shrink-0" />
                                        <div>
                                            <h3 className="font-semibold mb-1">Tailored Solutions</h3>
                                            <p className="text-sm text-muted-foreground">Custom itineraries designed to fit your specific needs and interests.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <CheckCircle2 className="h-6 w-6 text-primary mt-1 shrink-0" />
                                        <div>
                                            <h3 className="font-semibold mb-1">Reliable Communication</h3>
                                            <p className="text-sm text-muted-foreground">Direct access to our coordination team for seamless planning.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <CheckCircle2 className="h-6 w-6 text-primary mt-1 shrink-0" />
                                        <div>
                                            <h3 className="font-semibold mb-1">Impact Reporting</h3>
                                            <p className="text-sm text-muted-foreground">See exactly how your visits contribute to the local community.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Form */}
                            <Card className="shadow-lg border-muted/60">
                                <CardHeader>
                                    <CardTitle>Get In Touch</CardTitle>
                                    <CardDescription>
                                        Fill out the form below and we'll get back to you within 24 hours.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <input type="hidden" name="_subject" value="Partner With Us Inquiry - Visit Dzaleka" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                                                <Input id="firstName" name="firstName" placeholder="John" required />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                                                <Input id="lastName" name="lastName" placeholder="Doe" required />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                                            <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="organization" className="text-sm font-medium">Organization / Company</label>
                                            <Input id="organization" name="organization" placeholder="Your Agency Name" />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="message" className="text-sm font-medium">How can we partner?</label>
                                            <Textarea
                                                id="message"
                                                name="message"
                                                placeholder="Tell us about your organization and what kind of partnership you're looking for..."
                                                className="min-h-[120px]"
                                                required
                                            />
                                        </div>

                                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    Send Message <ArrowRight className="ml-2 h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
