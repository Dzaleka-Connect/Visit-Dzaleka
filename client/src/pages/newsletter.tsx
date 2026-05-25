import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Bell, Calendar, Users, Menu, X } from "lucide-react";
import { useState } from "react";
import { PublicHeader } from "@/components/public-header";
import { cn } from "@/lib/utils";

export default function Newsletter() {
    const formContainerRef = useRef<HTMLDivElement>(null);
    const [embedState, setEmbedState] = useState<"loading" | "ready" | "error">("loading");

    // Load the Kit (ConvertKit) script into the container
    useEffect(() => {
        if (!formContainerRef.current) return;

        // Clear any existing content
        formContainerRef.current.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://dzaleka-online.kit.com/72d6e703a6/index.js";
        script.async = true;
        script.dataset.uid = "72d6e703a6";
        script.onload = () => setEmbedState("ready");
        script.onerror = () => setEmbedState("error");
        const timeout = window.setTimeout(() => setEmbedState((state) => state === "loading" ? "error" : state), 8000);

        // Append to container instead of body
        formContainerRef.current.appendChild(script);

        return () => {
            window.clearTimeout(timeout);
            // Cleanup on unmount
            if (formContainerRef.current) {
                formContainerRef.current.innerHTML = "";
            }
        };
    }, []);

    const benefits = [
        {
            icon: Bell,
            title: "Latest Updates",
            description: "Be the first to know about new programs, opportunities, and community initiatives."
        },
        {
            icon: Calendar,
            title: "Event Announcements",
            description: "Get notified about upcoming events, festivals, and cultural celebrations in Dzaleka."
        },
        {
            icon: Users,
            title: "Community Stories",
            description: "Read inspiring stories from residents, entrepreneurs, and visitors to the camp."
        }
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Helmet>
                <title>Newsletter - Stay Updated | Visit Dzaleka</title>
                <meta
                    name="description"
                    content="Subscribe to the Visit Dzaleka newsletter. Get the latest news about programs, opportunities, and events delivered straight to your inbox."
                />
            </Helmet>

            {/* Header */}
            <PublicHeader activePath="/newsletter" />

            <main className="flex-1">
                {/* Hero Section */}
                <div className="relative py-24 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
                    <div className="container mx-auto px-4 text-center relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm rounded-full uppercase tracking-widest font-semibold">
                            <Mail className="mr-2 h-3.5 w-3.5" />
                            Stay Connected
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                            Subscribe to Our Newsletter
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            Get the latest news from Visit Dzaleka delivered straight to your inbox.
                        </p>
                    </div>
                </div>

                <div className="container mx-auto py-16 space-y-16 px-4">
                    {/* Newsletter Form Section */}
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-card border rounded-2xl p-8 md:p-12 shadow-sm">
                            {/* Kit (ConvertKit) Form Embed Container */}
                            {embedState === "loading" && (
                                <div className="min-h-[220px] animate-pulse rounded-xl border bg-muted/40" aria-live="polite" aria-label="Loading newsletter form" />
                            )}
                            {embedState === "error" && (
                                <div className="min-h-[220px] rounded-xl border border-dashed p-6 text-center">
                                    <Mail className="mx-auto h-8 w-8 text-muted-foreground" />
                                    <h2 className="mt-4 text-lg font-semibold">Newsletter form unavailable</h2>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Your browser may have blocked the embedded form. You can still contact the team to be added manually.
                                    </p>
                                    <Button asChild className="mt-5">
                                        <a href="mailto:info@mail.dzaleka.com?subject=Newsletter%20subscription">Request subscription</a>
                                    </Button>
                                </div>
                            )}
                            <div
                                ref={formContainerRef}
                                id="kit-form-container"
                                className={cn("w-full [&>*]:w-full", embedState !== "ready" && "sr-only")}
                            />
                        </div>
                    </div>

                    {/* Benefits Section */}
                    <div className="space-y-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight mb-4">What You'll Receive</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                By subscribing, you'll get exclusive access to updates, stories, and opportunities
                                from the Dzaleka community.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="text-center p-6 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                        <benefit.icon className="h-7 w-7 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Privacy Note */}
                    <div className="max-w-2xl mx-auto text-center">
                        <p className="text-sm text-muted-foreground">
                            We respect your privacy. Your email address will only be used to send you our newsletter
                            and occasional updates. You can unsubscribe at any time.
                        </p>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
