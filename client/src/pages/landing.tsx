import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Users,
  Calendar,
  Globe,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Star,
  Quote,
  Menu,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { SEO } from "@/components/seo";

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Book your visit in seconds with our real-time availability system. No more back-and-forth emails.",
  },
  {
    icon: Users,
    title: "Expert Guides",
    description:
      "Connect with verified local guides who know the camp's history, culture, and hidden gems.",
  },
  {
    icon: Globe,
    title: "Cultural Exchange",
    description:
      "Experience the diverse cultures of Dzaleka through food, art, and music tours.",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    description:
      "All visits are coordinated with camp security protocols for a safe and respectful experience.",
  },
];

const stats = [
  { value: "55k+", label: "Residents" },
  { value: "100+", label: "Entrepreneurs" },
  { value: "15+", label: "Nationalities" },
  { value: "4.9", label: "Visitor Rating" },
];

const testimonials = [
  {
    quote: "An eye-opening experience that changed my perspective completely. The guides are incredibly knowledgeable and welcoming.",
    author: "Sarah Jenkins",
    role: "International Visitor",
    rating: 5
  },
  {
    quote: "The booking process was seamless, and the tour was well-organized. It's amazing to see the creativity and resilience here.",
    author: "David Mwale",
    role: "Local Tourist",
    rating: 5
  },
  {
    quote: "A unique opportunity to learn about the resilience and creativity within the camp. The art market is a must-visit.",
    author: "Elena Rodriguez",
    role: "NGO Worker",
    rating: 5
  }
];

const pricing = [
  {
    title: "Individual",
    price: "MWK 15,000",
    description: "Perfect for solo travelers",
    features: ["2-hour guided tour", "Community interaction", "Market visit", "Standard itinerary"],
    highlight: false
  },
  {
    title: "Small Group",
    price: "MWK 50,000",
    description: "Up to 5 people",
    features: ["Private guide", "Customizable route", "Photo opportunities", "Group discount"],
    highlight: true
  },
  {
    title: "Large Group",
    price: "MWK 80,000",
    description: "6-10 people",
    features: ["2 guides included", "Extended duration", "Q&A session", "Best value per person"],
    highlight: false
  }
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO 
        title="Experience Dzaleka Refugee Camp" 
        description="Book guided tours, meet local artists, and experience the vibrant culture of Dzaleka Refugee Camp. Secure, organized, and impactful visits."
        ogImage="https://services.dzaleka.com/images/Visit_Dzaleka.png"
      />
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">Dzaleka Visit</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Official Portal
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Stories</a>
            <Button asChild size="sm" className="ml-2">
              <Link href="/auth">Sign In</Link>
            </Button>
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
          <div className="md:hidden border-t bg-background p-4 space-y-4">
            <a href="#features" className="block text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" className="block text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#testimonials" className="block text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Stories</a>
            <Button asChild className="w-full">
              <Link href="/auth">Sign In</Link>
            </Button>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32 lg:py-40">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="absolute right-0 top-0 -z-10 h-[600px] w-[600px] bg-primary/5 blur-[100px] rounded-full opacity-50" />

          <div className="container relative mx-auto px-4 text-center">
            <div className="mx-auto max-w-4xl">
              <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full">
                <Sparkles className="mr-2 h-3.5 w-3.5 fill-primary" />
                Experience the Heart of Africa
              </Badge>

              <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
                Discover the Spirit of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  Dzaleka Refugee Camp
                </span>
              </h1>

              <p className="mb-10 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto leading-relaxed">
                Join us for an immersive cultural journey. Meet resilient artists,
                entrepreneurs, and community leaders building a vibrant future against all odds.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" asChild>
                  <Link href="/auth">
                    Book Your Visit
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base"
                  asChild
                >
                  <a
                    href="https://services.dzaleka.com/visit/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn More
                  </a>
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4 border-y border-border/50 bg-background/50 backdrop-blur-sm py-8">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-3xl font-bold text-foreground md:text-4xl tracking-tight">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center max-w-3xl mx-auto">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Everything You Need for a Perfect Visit
              </h2>
              <p className="text-lg text-muted-foreground">
                We've streamlined the entire process so you can focus on the experience,
                not the logistics.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="border-none shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <feature.icon className="h-7 w-7" />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center max-w-3xl mx-auto">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Transparent Pricing
              </h2>
              <p className="text-lg text-muted-foreground">
                Choose the package that fits your group size. All proceeds support
                the guides and community development projects.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
              {pricing.map((plan) => (
                <Card
                  key={plan.title}
                  className={`relative flex flex-col ${plan.highlight ? 'border-primary shadow-lg scale-105 z-10' : 'border-border shadow-sm'}`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.title}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="mb-6">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/visit</span>
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant={plan.highlight ? "default" : "outline"} asChild>
                      <Link href="/auth">Choose Plan</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center max-w-3xl mx-auto">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Visitor Stories
              </h2>
              <p className="text-lg text-muted-foreground">
                Hear from people who have experienced the magic of Dzaleka firsthand.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, i) => (
                <Card key={i} className="border-none shadow-sm bg-background">
                  <CardContent className="p-8">
                    <div className="mb-6 text-primary">
                      <Quote className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="mb-6 text-lg italic text-muted-foreground">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {testimonial.author[0]}
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.author}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                      <div className="ml-auto flex gap-0.5">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5" />
          <div className="container relative mx-auto px-4 text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
              Ready to Plan Your Visit?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground max-w-2xl mx-auto">
              Create an account to check availability, book your tour, and manage your itinerary.
            </p>
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/auth">
                Get Started Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg">Dzaleka Visit</span>
              </div>
              <p className="text-muted-foreground max-w-xs">
                Connecting visitors with the vibrant community of Dzaleka Refugee Camp through guided tours and cultural exchange.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-primary">Stories</a></li>
                <li><Link href="/auth" className="hover:text-primary">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>visit@dzaleka.com</li>
                <li>+265 123 456 789</li>
                <li>Dowa District, Malawi</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Dzaleka Visit. All rights reserved.</p>
            <p>
              Part of <a href="https://services.dzaleka.com" className="text-primary hover:underline">Dzaleka Online Services</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
