import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, X, Utensils, Coffee, Beer, Music, Users, Star, ArrowRight } from "lucide-react";
import { useState } from "react";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { PublicHeader } from "@/components/public-header";

export default function DiningNightlife() {
    const diningOptions = [
        {
            title: "Local Restaurants & Food Stalls",
            description: "Numerous small, affordable restaurants and food stalls line the main roads. You can find a variety of freshly cooked meals and snacks.",
            icon: Utensils
        },
        {
            title: "Ethiopian & Congolese Cuisine",
            description: "Traditional dishes that offer a taste of home for many residents. Expect rich spices, injera, and hearty stews.",
            icon: Utensils
        },
        {
            title: "Malawian Staples",
            description: "Nsima (a staple maize dish) and BBQ (locally known as kanyenya) are commonly available and beloved by locals.",
            icon: Utensils
        },
        {
            title: "Snacks & Breads",
            description: "East African delicacies like chapati (unleavened flatbread) and mandazi (fritters) are popular, often served with chai (tea) at local tea houses.",
            icon: Coffee
        },
        {
            title: "International Options",
            description: "For a different taste, some places even offer items like cheeseburgers, French fries, and fresh fruit smoothies.",
            icon: Utensils
        },
        {
            title: "Tumaini Festival Food Stalls",
            description: "During the annual Tumaini Festival, the culinary scene explodes with an even wider array of stalls offering delights to thousands of visitors.",
            icon: Star
        }
    ];

    const nightlifeOptions = [
        {
            title: "Bars and Lounges",
            description: "The camp has several sports bars and small clubs where residents gather to socialize, watch sports, and enjoy drinks and music. These places are popular weekend hangout spots.",
            icon: Beer
        },
        {
            title: "Cultural Events & Theater",
            description: "Dzaleka has a thriving arts scene. In addition to local theater and dance groups, the annual Tumaini Festival is a major event featuring music, poetry, dance, and theater from local and international artists.",
            icon: Music
        },
        {
            title: "Social Gatherings",
            description: "Community-led events, such as concerts, talent shows, and even organized sports betting, form a significant part of the community's social fabric and leisure activities.",
            icon: Users
        }
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Dining & Nightlife | Visit Dzaleka"
                description="Experience the vibrant culinary fusion and social life of Dzaleka, from Ethiopian coffee ceremonies to lively spots bars and cultural festivals."
                keywords="Dzaleka food, Dzaleka restaurants, Ethiopian food Malawi, Congolese cuisine Dzaleka, Tumaini festival food, Dzaleka nightlife"
                canonical="https://visit.dzaleka.com/things-to-do/dining-nightlife"
                ogImage="https://www.austinmadinga.com/storage/2025/07/Tumaini-food.jpg" // Fallback to relevant existing image
            />

            {/* Header (Reused/Inline) */}
            <PublicHeader activePath="/things-to-do/dining-nightlife" />

            <main className="flex-1">
                {/* Hero */}
                <div className="relative py-24 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: 'url(https://www.austinmadinga.com/storage/2025/07/Tumaini-food.jpg)' }} // Placeholder: General food/dining atmosphere
                    />
                    <div className="absolute inset-0 bg-black/60" />
                    <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-white/30 bg-white/10 text-white rounded-full uppercase tracking-widest font-semibold flex items-center justify-center w-fit mx-auto backdrop-blur-sm">
                            <Utensils className="mr-2 h-3.5 w-3.5" />
                            Culinary Journey
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-white">
                            Dining & Nightlife
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
                            Dzaleka offers a surprisingly vibrant scene, driven by the diverse cultural backgrounds of its residents. From fusion cuisine to lively social gatherings.
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-16 space-y-24">

                    {/* Dining Options */}
                    <section>
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl font-bold tracking-tight mb-6">A Fusion of Flavors</h2>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                The camp's culinary scene is a unique fusion of cuisines from across Africa, including Burundi, Rwanda, the Democratic Republic of Congo, Somalia, and Ethiopia.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {diningOptions.map((item, index) => (
                                <Card key={index} className="border-none shadow-md bg-card hover:shadow-lg transition-all duration-300 group">
                                    <CardContent className="p-8 space-y-4">
                                        <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <item.icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{item.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {item.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Nightlife */}
                    <section className="bg-muted/30 py-16 rounded-3xl -mx-4 px-4 md:mx-0 md:px-12">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl font-bold tracking-tight mb-6">Nightlife & Entertainment</h2>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                As the sun sets, social life extends into the evenings. Nightlife in Dzaleka is centered around social gathering spots, sports, and cultural events.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {nightlifeOptions.map((item, index) => (
                                <div key={index} className="space-y-4">
                                    <div className="h-48 rounded-2xl bg-muted overflow-hidden relative group">
                                        {/* Abstract placeholder visual for nightlife */}
                                        <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 opacity-80 group-hover:opacity-100 ${index === 0 ? 'from-purple-600 to-blue-600' : index === 1 ? 'from-pink-600 to-rose-600' : 'from-indigo-600 to-cyan-600'}`} />
                                        <div className="absolute inset-0 flex items-center justify-center text-white">
                                            <item.icon className="h-12 w-12 opacity-80 group-hover:scale-110 transition-transform duration-300" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="text-center space-y-8">
                        <h2 className="text-3xl font-bold">Taste the Culture</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Want to know the best spots for authentic Ethiopian coffee or local BBQ? Our guides live here and can show you the culinary gems hidden in Dzaleka.
                        </p>
                        <Button asChild size="lg" className="px-8">
                            <Link href="/login">Book a Food & Culture Tour <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </section>

                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
