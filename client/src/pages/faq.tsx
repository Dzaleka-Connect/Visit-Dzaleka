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
        title: "Tours & Experience",
        questions: [
            {
                q: "What types of tours do you offer?",
                a: "We offer guided walking tours of Dzaleka Refugee Camp led by local guides. Visits can include camp history, daily life, community initiatives, markets, creative spaces, and selected zones depending on timing, access, and visitor interests."
            },
            {
                q: "Can I choose specific areas or interests for my visit?",
                a: "Yes. During booking you can share interests such as arts, education, community projects, entrepreneurship, faith spaces, markets, sports, or youth initiatives. We use that information to shape the visit where possible."
            },
            {
                q: "Are the tours family-friendly?",
                a: "Yes. We can adjust the pace and content for families, school groups, and mixed-age groups. Please mention children, accessibility needs, or sensitive requirements when booking."
            },
            {
                q: "Are visits guaranteed to include every listed place?",
                a: "No. Dzaleka is a living community, so access can depend on timing, community availability, weather, security guidance, public holidays, and partner schedules. Your guide will adapt the route responsibly."
            }
        ]
    },
    {
        title: "Pricing & Booking",
        questions: [
            {
                q: "How much do tours cost?",
                a: "Current prices are shown on the booking form before you submit your request. Pricing can vary by group size, tour type, custom duration, and any additional services requested."
            },
            {
                q: "When is my booking confirmed?",
                a: "After you submit a request, our team reviews guide availability, timing, meeting point, and any special notes. Your booking is confirmed only after you receive confirmation from Visit Dzaleka."
            },
            {
                q: "What is your cancellation policy?",
                a: "Please contact us as early as possible if you need to cancel. If we need to cancel because of safety, guide availability, access restrictions, or local conditions, we will contact you and help with next steps."
            },
            {
                q: "Can I reschedule my visit?",
                a: "Yes, visitors can request a reschedule from their booking page. Rescheduling depends on guide availability, transport availability if requested, and operational conditions on the new date."
            }
        ]
    },
    {
        title: "Transport",
        questions: [
            {
                q: "Can Visit Dzaleka arrange transport?",
                a: "You can request transport during booking. Transport depends on partner availability, route, date, pickup location, and the quote you receive. If no partner is available, you may need to arrange alternative transport outside our partner network."
            },
            {
                q: "How does a transport quote work?",
                a: "If a partner can assist, they provide a quote, pickup time, driver details, and vehicle details. You can review the quote before final confirmation."
            },
            {
                q: "Will I receive driver details?",
                a: "Yes. Once a partner accepts and driver details are assigned, you should receive the relevant pickup and driver information so you can coordinate clearly before travel."
            }
        ]
    },
    {
        title: "Payments",
        questions: [
            {
                q: "How can I pay?",
                a: "Available payment methods are shown during booking or in your visitor booking page. Depending on configuration and your booking, this may include cash, local mobile money, bank or reference-based payment, or card payment."
            },
            {
                q: "Can I pay by card?",
                a: "Card payment is available only when enabled for your booking. If card payment is offered, the payment is processed through Stripe and your booking page will show the next step."
            },
            {
                q: "How do I report a payment?",
                a: "Visitors can report payment details from their booking page. Staff then verify the payment and update the booking status."
            },
            {
                q: "Will I receive a receipt?",
                a: "When a payment is verified and marked paid, the system can send a payment receipt email to the visitor."
            }
        ]
    },
    {
        title: "Your Booking Account",
        questions: [
            {
                q: "Do I need an account?",
                a: "An account helps you manage bookings, view booking details, message Visit Dzaleka, track transport quote updates, and access visitor resources. Some booking emails may also invite you to create or access your account."
            },
            {
                q: "Where can I view my booking?",
                a: "After logging in, go to Your Bookings. Each booking has its own detail page that you can bookmark or share with your group."
            },
            {
                q: "Who can I message?",
                a: "Visitors can message Visit Dzaleka staff from their booking. Once a guide is assigned, booking-specific communication can also include the assigned guide where enabled."
            },
            {
                q: "Can I update my visitor preferences?",
                a: "Yes. Your profile can include country, phone, language preference, accessibility needs, dietary notes, and emergency contact information so the team can plan more responsibly."
            }
        ]
    },
    {
        title: "Planning Your Visit",
        questions: [
            {
                q: "What are the tour timings?",
                a: "Tour times depend on the date, guide availability, and the type of visit. Common tour windows are during the day, and your confirmed booking will show the final date and time."
            },
            {
                q: "Where do tours start from?",
                a: "Your confirmed booking will show the meeting point. Common meeting points may include well-known community or organization locations near Dzaleka, but the final point depends on the visit plan."
            },
            {
                q: "What should I bring for the tour?",
                a: "Wear comfortable walking shoes and bring water, sun protection, a charged phone, and any medication you may need. Please dress respectfully and ask before taking photos of people."
            },
            {
                q: "Is it safe to visit Dzaleka?",
                a: "Visits are planned with local guidance and community awareness. As with any community visit, follow your guide's instructions, stay with the group, and respect local privacy and security guidance."
            }
        ]
    },
    {
        title: "Events & Dzaleka",
        questions: [
            {
                q: "What are the different zones in Dzaleka Refugee Camp?",
                a: "Dzaleka has multiple zones and neighborhoods, each with its own community life, history, and points of interest. A visit route may include selected areas depending on the purpose of the tour and what is appropriate on the day."
            },
            {
                q: "Can I attend events in Dzaleka?",
                a: "Visit the What's On page for upcoming events, festivals, performances, workshops, and community activities. Some events may have external links or organizers outside Visit Dzaleka."
            },
            {
                q: "Do you work with partners?",
                a: "Yes. Visit Dzaleka may work with guides, transport partners, community initiatives, event organizers, and other responsible partners to improve visitor experience and community benefit."
            }
        ]
    }
];

export default function FAQPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <SEO
                title="Frequently Asked Questions | Visit Dzaleka"
                description="Find answers about Visit Dzaleka tours, booking confirmation, transport requests, payment options, visitor accounts, meeting points, and what to expect."
                keywords="Dzaleka FAQ, Visit Dzaleka booking, Dzaleka transport, Dzaleka tour prices, visiting Dzaleka zones, Dzaleka tour timings"
                canonical="https://visit.dzaleka.com/faq"
            />

            {/* FAQPage Structured Data for Google Rich Results */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": faqCategories.flatMap(category =>
                            category.questions.map(faq => ({
                                "@type": "Question",
                                "name": faq.q,
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": faq.a
                                }
                            }))
                        )
                    })
                }}
            />

            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/">
                        <div className="flex items-center gap-3 cursor-pointer">
                            <img src="https://services.dzaleka.com/images/dzaleka-digital-heritage.png" alt="Visit Dzaleka Logo" className="h-10 w-10 rounded-lg shadow-sm" />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold tracking-tight">Visit Dzaleka</span>
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
                        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
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
