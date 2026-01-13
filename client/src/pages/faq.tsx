import { useState } from "react";
import { Link } from "wouter";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Menu, X, HelpCircle } from "lucide-react";

// FAQ Data
const faqCategories = [
    {
        title: "Tours & Packages",
        questions: [
            {
                q: "What types of tours do you offer?",
                a: "We offer guided walking tours of Dzaleka Refugee Camp, where visitors can explore key areas, learn about the camp's history, and engage with the community."
            },
            {
                q: "What activities can I experience during the visit?",
                a: "Visitors can experience cultural exchanges, educational workshops, community initiatives, and during special events, the Tumaini Festival which showcases music, art, and performances. You can also engage with local entrepreneurs and artisans."
            },
            {
                q: "Are the tours family-friendly?",
                a: "Yes, our tours are suitable for all ages and are designed to be family-friendly. We can adjust the tour content and pace to accommodate families with children."
            }
        ]
    },
    {
        title: "Pricing & Booking",
        questions: [
            {
                q: "How much do tours cost?",
                a: "Tour prices range from MWK 15,000 for individuals to MWK 100,000 for groups of 10+ people. Additional hours are charged at MWK 10,000 per hour."
            },
            {
                q: "Do you offer group discounts?",
                a: "Yes, we offer special rates for groups. Groups of 6-10 people pay MWK 80,000, while groups of 10+ people pay MWK 100,000 for a standard 2-hour tour."
            },
            {
                q: "What is your cancellation policy?",
                a: "We understand that plans can change. Please inform us as soon as possible if you need to cancel or reschedule your tour, and we will do our best to accommodate your needs."
            }
        ]
    },
    {
        title: "Planning Your Visit",
        questions: [
            {
                q: "What are the tour timings?",
                a: "Tours operate Monday through Friday, with standard start times at 10:00 AM and 2:00 PM. The standard tour duration is 2 hours, with options for extended tours."
            },
            {
                q: "Where do tours start from?",
                a: "Tours can start from three recommended meeting points: the UNHCR Office, Appfactory, or JRS (Jesuit Refugee Service). The specific meeting point will be confirmed upon booking."
            },
            {
                q: "What should I bring for the tour?",
                a: "We recommend wearing comfortable walking shoes, bringing a hat, sunscreen, water, and a camera. The tours involve walking, so comfortable attire is essential."
            }
        ]
    },
    {
        title: "Visitor Dashboard",
        questions: [
            {
                q: "How do I access my visitor dashboard?",
                a: "Once you have created an account and logged in, you will be automatically directed to your Visitor Dashboard. This is your central hub for managing your Dzaleka experience."
            },
            {
                q: "What can I do on the dashboard?",
                a: "Your dashboard allows you to: Book new tours ('Book'), view your upcoming and past itineraries ('Bookings'), communicate directly with us or your guide ('Messages'), and access helpful materials ('Resources')."
            },
            {
                q: "How do I check my booking status?",
                a: "Navigate to the 'Bookings' section on your dashboard. You will see a list of your requests with their current status (e.g., Pending, Confirmed). You can also view detailed itineraries here."
            },
            {
                q: "Can I contact my guide before the tour?",
                a: "Yes! Use the 'Messages' feature on your dashboard to send secure messages to your assigned guide or our coordination team regarding any specific needs or questions about your upcoming visit."
            }
        ]
    },
    {
        title: "About Dzaleka",
        questions: [
            {
                q: "What are the different zones in Dzaleka Refugee Camp?",
                a: "Dzaleka Refugee Camp is divided into several distinct zones: Lisungwi, Kawale 1 & 2, Likuni 1 & 2, Zomba, Blantyre, Katubza, New Katubza, and Dzaleka Hill. Each zone has its own unique characteristics and community features."
            }
        ]
    }
];

export default function FAQPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <SEO
                title="Frequently Asked Questions | Dzaleka Visit"
                description="Find answers to common questions about visiting Dzaleka Refugee Camp, tour prices, meeting points, and what to expect."
                keywords="Dzaleka FAQ, tour prices Dzaleka, visiting Dzaleka zones, Dzaleka tour timings"
                canonical="https://visit.dzaleka.com/faq"
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
                        <Link href="/blog" className="text-sm font-medium hover:text-primary transition-colors">Blog</Link>
                        <Link href="/partner-with-us" className="text-sm font-medium hover:text-primary transition-colors">Partner</Link>
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
                        <Link href="/partner-with-us" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Partner</Link>
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
                <section className="bg-muted/30 py-16 md:py-24 border-b">
                    <div className="container mx-auto px-4 text-center">
                        <div className="inline-flex items-center justify-center p-3 mb-6 rounded-full bg-primary/10 text-primary">
                            <HelpCircle className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                            Frequently Asked Questions
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Common questions about visiting Dzaleka, bookings, and what to expect.
                        </p>
                    </div>
                </section>

                {/* FAQ Content */}
                <section className="py-16 md:py-24 max-w-4xl mx-auto px-4">
                    <div className="space-y-12">
                        {faqCategories.map((category, index) => (
                            <div key={index} id={category.title.toLowerCase().replace(/\s+/g, '-')}>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                    {category.title}
                                    <span className="h-px flex-1 bg-border hidden sm:block"></span>
                                </h2>
                                <Accordion type="single" collapsible className="w-full">
                                    {category.questions.map((faq, i) => (
                                        <AccordionItem key={i} value={`item-${index}-${i}`}>
                                            <AccordionTrigger className="text-left text-lg font-medium hover:text-primary transition-colors">
                                                {faq.q}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                                                {faq.a}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        ))}
                    </div>

                    {/* Still have questions? */}
                    <div className="mt-20 text-center bg-primary/5 rounded-2xl p-8 md:p-12">
                        <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
                        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                            Can't find the answer you're looking for? Please get in touch.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Button asChild variant="default">
                                <Link href="/partner-with-us">Contact Us</Link>
                            </Button>
                            <Button asChild variant="outline">
                                <a href="mailto:info@mail.dzaleka.com">Email Support</a>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
