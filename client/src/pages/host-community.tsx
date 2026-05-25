import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Radio, Menu, X, Globe, Users, Music, Handshake, Store, Share2, Heart, Trees, Church, Home } from "lucide-react";
import { useState } from "react";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { PublicHeader } from "@/components/public-header";

// Structured Data for Article (Host Community)
const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Article",
            "headline": "The Host Community of Dowa: Culture & Coexistence",
            "description": "Explore the Chewa culture of Dowa District and the symbiotic relationship between Dzaleka refugees and their Malawian hosts.",
            "author": {
                "@type": "Organization",
                "name": "Visit Dzaleka"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Visit Dzaleka",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://services.dzaleka.com/images/dzaleka-digital-heritage.png"
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": "https://visit.dzaleka.com/things-to-do/host-community"
            }
        }
    ]
};

export default function HostCommunity() {
    const culturePoints = [
        {
            icon: Heart,
            title: "Alendo ndi Mame",
            description: "A Chewa proverb meaning 'Visitors are like dew'—precious but temporary. It reflects the deep value placed on hospitality.",
        },
        {
            icon: Handshake,
            title: "Greetings: 'Moni'",
            description: "Respect is paramount. Always greet with 'Moni' (Hello) or 'Wawa' (to elders). Handshakes are soft and prolonged.",
        },
        {
            icon: Music,
            title: "Gule Wamkulu",
            description: "The 'Great Dance' of the Chewa people involves masked dancers and is a UNESCO Intangible Cultural Heritage.",
        },
        {
            icon: Home,
            title: "'Odi, Odi'",
            description: "The traditional way to knock. Visitors call out 'Odi, Odi!' at the gate and wait for a welcoming 'Odini!' before entering.",
        }
    ];

    const integrationPoints = [
        {
            icon: Store,
            title: "Economic Symbiosis",
            description: "Dzaleka is a massive market. Refugees buy local produce, while Malawians patronize camp businesses for goods and services.",
        },
        {
            icon: Share2,
            title: "Cultural Exchange",
            description: "Events like the Tumaini Festival see thousands of Malawians celebrating alongside refugees, breaking down social barriers.",
        },
        {
            icon: Trees,
            title: "Shared Challenges",
            description: "Both communities face resource scarcity, but this often drives cooperation in agriculture and environmental management.",
        },
        {
            icon: Radio,
            title: "Radio for Inclusion",
            description: "Yetu Community Radio features presenters from both communities, bridging gaps and dispelling myths through dialogue.",
        }
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Host Community & Culture around Dzaleka"
                description="Discover the Malawian host community around Dzaleka. Learn about Chewa traditions, the proverb 'Alendo ndi mame', and the economic partnership between locals and refugees."
                keywords="Dzaleka host community, Chewa culture, Alendo ndi mame, Gule Wamkulu, Dowa district economy, refugee integration Malawi"
                canonical="https://visit.dzaleka.com/things-to-do/host-community"
                ogImage="https://i.kickstarter.com/assets/035/136/436/b82196f7bef5b7747e77183fdcf1f5c1_original.JPG?anim=false&fit=cover&gravity=auto&height=873&origin=ugc&q=92&v=1633523591&width=1552&sig=oBKQ45RRC9IUlKPnSJGhyCyHZg%2BjcVijIqChC8sXsSs%3D"
            />
            {/* Inject Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            {/* Header */}
            <PublicHeader activePath="/things-to-do/host-community" />

            <main className="flex-1">
                {/* Hero Section */}
                <div className="relative py-24 overflow-hidden">
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: 'url(https://i.kickstarter.com/assets/035/136/091/fa85f28e74de5419717601c4d3ffd08d_original.JPG?fit=scale-down&origin=ugc&q=92&v=1633521126&width=680&sig=Hxu%2BVokRArUbcgSYPb06e5QGOTXuOBwCBYlag1TYvqY%3D)' }}
                    />
                    <div className="absolute inset-0 bg-black/60" />

                    <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-white/30 bg-white/10 text-white rounded-full uppercase tracking-widest font-semibold flex items-center justify-center w-fit mx-auto backdrop-blur-sm">
                            <Handshake className="mr-2 h-3.5 w-3.5" />
                            Coexistence & Culture
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-white">
                            Host Community & Culture
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
                            The surrounding Dowa district is home to the Chewa people. Explore the rich traditions and the vital economic partnership shared between refugees and their Malawian neighbors.
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-16 space-y-24">

                    {/* Intro */}
                    <section className="max-w-3xl mx-auto text-center">
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            The host communities, primarily of the Chewa ethnic group, are known for their warmth. The local philosophy is best captured by the proverb <strong className="text-primary text-xl font-medium">"Alendo ndi mame"</strong> (Visitors are like dew)—signifying that a guest's presence is precious and should be cherished.
                        </p>
                    </section>

                    {/* Malawian Culture Grid */}
                    <section>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Malawian Traditions & Etiquette</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Understanding these cultural pillars will deepen your connection with the local community in Dowa.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {culturePoints.map((item, index) => (
                                <Card key={index} className="overflow-hidden hover:shadow-lg transition-all border-none bg-muted/30">
                                    <CardContent className="p-6 text-center">
                                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                            <item.icon className="h-7 w-7 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                                        <p className="text-muted-foreground text-sm">{item.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Interaction & Integration Detail */}
                    <section className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-1 relative">
                            <div className="aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-muted">
                                <img
                                    src="https://i.kickstarter.com/assets/035/136/436/b82196f7bef5b7747e77183fdcf1f5c1_original.JPG?anim=false&fit=cover&gravity=auto&height=873&origin=ugc&q=92&v=1633523591&width=1552&sig=oBKQ45RRC9IUlKPnSJGhyCyHZg%2BjcVijIqChC8sXsSs%3D"
                                    alt="Malawian village life near Dzaleka"
                                    className="w-full h-full object-cover"
                                />
                                {/* Placeholder logic */}
                            </div>
                            <div className="absolute -bottom-6 -left-6 -z-10 w-full h-full border-2 border-primary/10 rounded-2xl" />
                        </div>
                        <div className="order-2 space-y-6">
                            <div className="flex items-center gap-3 text-primary font-semibold">
                                <Heart className="h-5 w-5" />
                                <span>Integration & Economy</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight">A Symbiotic Relationship</h2>
                            <p className="text-muted-foreground text-lg">
                                The relationship between Dzaleka and Dowa is complex but vital. The camp acts as a major economic engine, creating a market for local farmers and businesses, while hosting a diverse workforce that contributes to the district's development.
                            </p>
                            <div className="space-y-4">
                                {integrationPoints.map((point, idx) => (
                                    <div key={idx} className="flex gap-4 items-start p-4 rounded-lg bg-background border shadow-sm">
                                        <point.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-semibold block text-foreground">{point.title}</span>
                                            <span className="text-muted-foreground text-sm">{point.description}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
