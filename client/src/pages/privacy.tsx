import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, Mail } from "lucide-react";
import { PublicHeader } from "@/components/public-header";

export default function Privacy() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Privacy Policy"
                description="How Visit Dzaleka collects, uses, stores and protects personal information from visitors, guides and community members."
                canonical="https://visit.dzaleka.com/privacy"
            />

            <PublicHeader activePath="/privacy" />

            <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
                <Button asChild variant="ghost" size="sm" className="mb-8 -ml-4">
                    <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
                </Button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-semibold">Privacy Policy</h1>
                        <p className="text-muted-foreground mt-1">How we handle your information</p>
                    </div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="text-lg text-muted-foreground mb-8">
                        Visit Dzaleka is operated by Dzaleka Connect, based at Dzaleka Refugee Camp in Dowa District,
                        Malawi. This policy explains what personal information we collect when you browse the site or
                        book a guided visit, why we collect it, how long we keep it, and the choices you have. We take
                        this seriously: many of the people represented on this platform are refugees, and careless
                        handling of personal data can carry real consequences for them.
                    </p>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Who we are</h2>
                        <p>
                            Visit Dzaleka is the official booking and information portal for guided visits to Dzaleka
                            Refugee Camp. The data controller is Dzaleka Connect. You can reach us at{" "}
                            <a href="mailto:contact@mail.dzaleka.com">contact@mail.dzaleka.com</a> with any question
                            about this policy or about information we hold.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Information we collect</h2>
                        <p>We collect only what we need to arrange and support a visit:</p>
                        <ul>
                            <li>
                                <strong>Account details</strong> — your name, email address and password (stored only as
                                a cryptographic hash, never in readable form).
                            </li>
                            <li>
                                <strong>Booking details</strong> — the date and time you request, group size, tour type,
                                meeting point, languages you prefer, and any accessibility needs or notes you choose to
                                share so your guide can prepare.
                            </li>
                            <li>
                                <strong>Contact details</strong> — a phone number or messaging handle where we can reach
                                you about your visit, including on the day.
                            </li>
                            <li>
                                <strong>Payment status</strong> — whether a booking has been paid, and by which method
                                (cash, Airtel Money or TNM Mpamba). We do not collect or store card numbers, mobile money
                                PINs or bank credentials.
                            </li>
                            <li>
                                <strong>Technical data</strong> — pages viewed, approximate region, browser type and
                                referring site, used to understand which information visitors need and to keep the
                                service secure.
                            </li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">How we use it</h2>
                        <p>
                            We use your information to confirm and run your booking, to assign and brief a guide, to send
                            you booking confirmations and reminders, to answer your questions, to process and reconcile
                            payment, and to keep aggregate statistics about how many people visit and what that means for
                            community income. We also use it to detect and prevent fraud and abuse of the platform.
                        </p>
                        <p>
                            We do not sell personal information. We do not share it with advertisers. We do not use it to
                            build advertising profiles.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Who we share it with</h2>
                        <p>
                            Your name, group size and visit time are shared with the guide assigned to you, so they can
                            meet you. Where camp access requires it, visitor names may be shared with camp authorities or
                            UNHCR implementing partners for entry clearance. We use service providers to run the platform
                            — hosting, our database and transactional email — and they process data on our instructions
                            only. We disclose information to authorities only where the law requires it.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Photography and community consent</h2>
                        <p>
                            Dzaleka is a place where tens of thousands of people live. Photographing residents requires
                            their explicit consent, and your guide will tell you where photography is not appropriate. If
                            you send us photographs, we will not publish any image that identifies a resident without
                            that person's recorded permission. If you appear in a photograph on this site and want it
                            removed, email us and we will take it down.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">How long we keep it</h2>
                        <p>
                            Booking records are kept for up to seven years, which is what we need for financial and
                            reporting obligations. Account data is kept while your account is open. Analytics data is
                            aggregated and stops being personally identifying within 14 months. If you close your
                            account, we delete or anonymise your personal data except where we must retain a record.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Your rights</h2>
                        <p>
                            You can ask us for a copy of the information we hold about you, ask us to correct it, ask us
                            to delete it, or object to a particular use. Email{" "}
                            <a href="mailto:contact@mail.dzaleka.com">contact@mail.dzaleka.com</a> and we will respond
                            within 30 days. You can unsubscribe from any non-essential email using the link in the
                            message; we will still send operational messages about a booking you have made.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Security</h2>
                        <p>
                            The site is served over HTTPS. Passwords are hashed with bcrypt. Access to booking data is
                            restricted by role, and administrative actions are recorded in an audit log. No system is
                            perfectly secure, and we will tell affected people promptly if a breach puts their data at
                            risk.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
                        <p>
                            We use a small number of cookies, mainly to keep you signed in and to measure usage. The{" "}
                            <Link href="/cookie-notice">Cookie Notice</Link> explains each one and how to control them.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Children</h2>
                        <p>
                            This platform is not intended for children under 16. Where a young person is part of a
                            visiting group, we ask that a responsible adult makes the booking and provides the contact
                            details.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Changes and contact</h2>
                        <p>
                            If we change this policy materially we will note it here and, where the change affects an
                            active booking, email you. Questions, requests and complaints go to{" "}
                            <a href="mailto:contact@mail.dzaleka.com" className="inline-flex items-center gap-1">
                                <Mail className="h-4 w-4" /> contact@mail.dzaleka.com
                            </a>
                            , or via the <Link href="/contact">contact page</Link>.
                        </p>
                    </section>

                    <div className="border-t pt-8 mt-12">
                        <p className="text-sm text-muted-foreground">Last updated: August 2026</p>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
