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
    Mail,
    MapPin,
    Phone,
    Clock,
    Send,
    Loader2,
    Menu,
    X,
    MessageCircle,
    Globe
} from "lucide-react";
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp, FaLinkedin, FaTiktok } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";

const contactInfo = [
    {
        icon: Mail,
        label: "Email",
        value: "info@mail.dzaleka.com",
        href: "mailto:info@mail.dzaleka.com"
    },
    {
        icon: MapPin,
        label: "Location",
        value: "Dzaleka Refugee Camp, Dowa District, Malawi",
        href: null
    },
    {
        icon: Clock,
        label: "Response Time",
        value: "Within 24-48 hours",
        href: null
    }
];

const socialLinks = [
    { icon: FaFacebook, href: "https://www.facebook.com/dzalekaonline/", label: "Facebook" },
    { icon: FaInstagram, href: "https://www.instagram.com/dzalekaonline/", label: "Instagram" },
    { icon: FaTwitter, href: "https://twitter.com/dzalekaconnect", label: "Twitter" },
    { icon: FaWhatsapp, href: "https://www.whatsapp.com/channel/0029VaZJG7U1SWsysKsrGC2E", label: "WhatsApp" },
    { icon: FaLinkedin, href: "https://www.linkedin.com/company/dzalekaconnect/", label: "LinkedIn" },
    { icon: FaTiktok, href: "https://www.tiktok.com/@dzaleka", label: "TikTok" },
];

export default function ContactUs() {
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
                    title: "Message Sent!",
                    description: "Thank you for reaching out. We'll get back to you within 24-48 hours.",
                    variant: "default",
                });
                form.reset();
            } else {
                throw new Error("Failed to send message");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "There was a problem sending your message. Please try again or email us directly.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Contact Us | Visit Dzaleka"
                description="Get in touch with Visit Dzaleka. Contact us for tour inquiries, partnership opportunities, or general questions about refugee-led tourism."
                keywords="contact Visit Dzaleka, Dzaleka tourism contact, book tour Dzaleka, partnership inquiry"
                canonical="https://visit.dzaleka.com/contact"
            />

            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/">
                        <div className="flex items-center gap-3 cursor-pointer">
                            <img src="https://services.dzaleka.com/images/dzaleka-digital-heritage.png" alt="Visit Dzaleka Logo" className="h-10 w-10 rounded-lg shadow-sm" />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold tracking-tight">Visit Dzaleka</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Official Portal</span>
                            </div>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-4">
                        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
                        <Link href="/about-us" className="text-sm font-medium hover:text-primary transition-colors">About Us</Link>
                        <Link href="/things-to-do" className="text-sm font-medium hover:text-primary transition-colors">Things To Do</Link>
                        <div className="flex items-center gap-2 ml-2">
                            <Button asChild size="sm">
                                <Link href="/login">Book a Tour</Link>
                            </Button>
                        </div>
                    </nav>

                    <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden border-t bg-background p-4 space-y-3">
                        <Link href="/" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                        <Link href="/about-us" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
                        <Link href="/things-to-do" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Things To Do</Link>
                        <div className="flex gap-2 pt-2">
                            <Button asChild className="flex-1">
                                <Link href="/login">Book a Tour</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1">
                <section className="relative py-16 sm:py-20 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
                    <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full uppercase tracking-widest font-semibold">
                            <MessageCircle className="mr-2 h-3.5 w-3.5" />
                            Get In Touch
                        </Badge>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                            Contact Us
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                            Have a question about our tours? Want to partner with us? We'd love to hear from you.
                        </p>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl -z-10" />
                </section>

                <section className="py-16 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
                            <div>
                                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                                <div className="space-y-6 mb-8">
                                    {contactInfo.map((item, index) => (
                                        <div key={index} className="flex items-start gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <item.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground mb-1">{item.label}</div>
                                                {item.href ? (
                                                    <a href={item.href} className="font-medium hover:text-primary transition-colors">
                                                        {item.value}
                                                    </a>
                                                ) : (
                                                    <div className="font-medium">{item.value}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-8">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-primary" />
                                        Follow Us
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        {socialLinks.map((social) => (
                                            <a
                                                key={social.label}
                                                href={social.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                                                aria-label={social.label}
                                            >
                                                <social.icon className="h-4 w-4" />
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-8 p-6 bg-muted/50 rounded-xl">
                                    <h3 className="font-semibold mb-2">Planning a Group Visit?</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        For educational institutions, tour operators, or large groups, we offer customized experiences.
                                    </p>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href="/partner-with-us">Partner With Us</Link>
                                    </Button>
                                </div>
                            </div>

                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle>Send Us a Message</CardTitle>
                                    <CardDescription>
                                        Fill out the form below and we'll respond within 24-48 hours.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <input type="hidden" name="_subject" value="Contact Form - Visit Dzaleka" />
                                        <input type="hidden" name="form_type" value="contact" />

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
                                            <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                                            <Input id="subject" name="subject" placeholder="What is your inquiry about?" required />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="message" className="text-sm font-medium">Message</label>
                                            <Textarea
                                                id="message"
                                                name="message"
                                                placeholder="Tell us how we can help you..."
                                                className="min-h-[120px]"
                                                required
                                            />
                                        </div>

                                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sending…
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Send Message
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
