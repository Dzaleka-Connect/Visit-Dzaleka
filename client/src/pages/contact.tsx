import { PublicPageIntro } from "@/components/public-page-intro";
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
import { PublicHeader } from "@/components/public-header";

const CONTACT_OG_IMAGE = "https://services.dzaleka.com/images/dzaleka-digital-heritage.png";

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
                ogImage={CONTACT_OG_IMAGE}
                imageAlt="Visit Dzaleka contact and tour support"
            />

            <PublicHeader activePath="/contact" />

            <main id="main-content" tabIndex={-1} className="flex-1">
                <PublicPageIntro
                    eyebrow="Talk to our team"
                    title="Contact us"
                    description="Ask about a tour, plan a group visit, or explore a partnership. Choose the contact option that works for you."
                />



                <section className="py-10 sm:py-14 bg-background">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
                            <div>
                                <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
                                <div className="space-y-6 mb-8">
                                    {contactInfo.map((item, index) => (
                                        <div key={index} className="flex items-start gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <item.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground mb-1">{item.label}</div>
                                                {item.href ? (
                                                    <a href={item.href} className="font-medium hover:text-primary">
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
                                                className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground"
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

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
