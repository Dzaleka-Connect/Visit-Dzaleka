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
  Heart,
  Lightbulb,
  TrendingUp,
  ExternalLink,
  Camera,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { SEO } from "@/components/seo";
import { useQuery } from "@tanstack/react-query";
import { SiteFooter } from "@/components/site-footer";

const features = [
  {
    icon: Calendar,
    key: "feature_1",
    defaultTitle: "Effortless Booking",
    defaultDesc:
      "Book your authentic cultural experience in seconds with our real-time availability system. No stress, just connection.",
  },
  {
    icon: Users,
    key: "feature_2",
    defaultTitle: "Meet Your Local Ambassador",
    defaultDesc:
      "Connect with verified local guides—residents who are passionate storytellers with deep knowledge of Dzaleka's history, culture, and \"hidden gems.\"",
  },
  {
    icon: Globe,
    key: "feature_3",
    defaultTitle: "Immersive Experiences",
    defaultDesc:
      "Dive deep into the vibrant cultures of Dzaleka through immersive food tours, art workshops, and music events, fostering mutual respect.",
  },
  {
    icon: Shield,
    key: "feature_4",
    defaultTitle: "A Culture of Safety & Respect",
    defaultDesc:
      "All visits are coordinated with camp security protocols and local leaders, ensuring a safe, respectful, and responsible experience for both visitors and residents.",
    link: "https://services.dzaleka.com/visit/guidelines/",
    linkText: "Read Visitor Guidelines",
  },
];

const stats = [
  { value: "57k+", defaultLabel: "Residents" },
  { value: "100+", defaultLabel: "Entrepreneurs" },
  { value: "6+", defaultLabel: "Nations" },
  { value: "4.9", defaultLabel: "Visitor Rating" },
];

const nationalities = [
  { country: "DR Congo", percentage: 64.9, flag: "🇨🇩" },
  { country: "Burundi", percentage: 21.9, flag: "🇧🇮" },
  { country: "Rwanda", percentage: 12.6, flag: "🇷🇼" },
  { country: "Somalia", percentage: 0.3, flag: "🇸🇴" },
  { country: "Ethiopia", percentage: 0.3, flag: "🇪🇹" },
];

const testimonials = [
  {
    key: "testimonial_1",
    defaultQuote: "An eye-opening experience that changed my perspective completely. The guides are incredibly knowledgeable and welcoming.",
    defaultAuthor: "Sarah Jenkins",
    defaultRole: "International Visitor",
    rating: 5
  },
  {
    key: "testimonial_2",
    defaultQuote: "The booking process was seamless, and the tour was well-organized. It's amazing to see the creativity and resilience here.",
    defaultAuthor: "David Mwale",
    defaultRole: "Local Tourist",
    rating: 5
  },
  {
    key: "testimonial_3",
    defaultQuote: "A unique opportunity to learn about the resilience and creativity within the camp. The art market is a must-visit.",
    defaultAuthor: "Elena Rodriguez",
    defaultRole: "NGO Worker",
    rating: 5
  }
];

const pricing = [
  {
    title: "Individual",
    price: "MWK 15,000",
    description: "Personalized 2-hour cultural immersion with your own dedicated local ambassador. Flexible pace and focus.",
    features: ["2-hour guided tour", "Dedicated local ambassador", "Flexible pace", "Personal attention"],
    highlight: false
  },
  {
    title: "Small Group",
    price: "MWK 50,000",
    description: "For 2-5 people. Ideal for families & friends. Our most popular choice for an interactive, high-value group experience.",
    features: ["Private guide", "Interactive experience", "Family-friendly", "Group discount"],
    highlight: true
  },
  {
    title: "Large Group",
    price: "MWK 80,000",
    description: "For 6-10 people. Ideal for organizations or student groups. A structured, impactful tour with custom focus options.",
    features: ["2 guides included", "Structured program", "Custom focus options", "Best value per person"],
    highlight: false
  }
];

const whyDzaleka = [
  {
    icon: "Sparkles",
    title: "Vibrant Culture & Arts",
    description: "Home to a thriving arts scene, from the internationally recognized Tumaini Festival to local dance and theater groups."
  },
  {
    icon: "Lightbulb",
    title: "Innovation Hub",
    description: "Meet the entrepreneurs at TakenoLAB, where coding and digital skills are building bridges to a brighter future."
  },
  {
    icon: "Heart",
    title: "Authentic Connection",
    description: "Experience genuine hospitality, enjoy local culinary delights like \"King's Chapati\", and hear powerful personal stories."
  },
  {
    icon: "TrendingUp",
    title: "Meaningful Impact",
    description: "Your visit directly supports refugee-led initiatives and economic growth within the community."
  }
];

const featuredExperiences = [
  {
    title: "Experience the Tumaini Festival",
    description: "The world's only cultural festival within a refugee camp, attracting thousands of visitors and performers from over 25 countries. A powerful symbol of hope.",
    hook: "Plan your trip around this extraordinary event and witness the power of art to unite and inspire.",
    link: "https://tumainiletu.org/tumaini-festival/",
    image: "🎭"
  },
  {
    title: "Meet the Makers: Innovation Stories",
    description: "Discover tech labs, fashion designers, and film companies that thrive against all odds, creating a unique micro-economy.",
    hook: "Connect with the digital pioneers and creative entrepreneurs shaping their own future.",
    link: "https://services.dzaleka.com/inspirational-stories/",
    image: "💡"
  },
  {
    title: "Your Visit, Your Impact",
    description: "A UN volunteer's account of the community's determination and creativity as a source of dignity in a place never meant to be permanent.",
    hook: "Discover how your visit makes a difference. Read the firsthand account of a UN volunteer.",
    link: "https://www.unv.org/Success-stories/where-time-stands-still-life-dzaleka-refugee-camp",
    image: "🌍"
  }
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: content } = useQuery<Record<string, string>>({
    queryKey: ["/api/content"],
    staleTime: 10 * 1000, // Consider stale after 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: true, // Refetch when tab becomes active
  });

  const getContent = (key: string, fallback: string) => content?.[key] || fallback;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Book Cultural Tours | Dzaleka Refugee Camp"
        description="Book your guided tour of Dzaleka Refugee Camp in Malawi. Experience authentic African culture, meet local artists, entrepreneurs, and support refugee-led initiatives. Tours from MWK 15,000. Book online today!"
        ogImage="https://tumainiletu.org/wp-content/uploads/2024/10/Badre_Bahaji_Tumaini_festival21_-31-1.jpg"
        canonical="https://visit.dzaleka.com/"
        keywords="book Dzaleka tour, Dzaleka refugee camp tours, cultural tourism Malawi, Tumaini Festival, guided tours Africa, visit Dzaleka, refugee camp experience, Malawi tourism booking, African cultural exchange"
      />
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src="https://services.dzaleka.com/images/dzaleka-digital-heritage.png" alt="Dzaleka Visit Logo" className="h-10 w-10 rounded-lg shadow-sm" />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">Dzaleka Visit</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Official Portal
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#why-dzaleka" className="text-sm font-medium hover:text-primary transition-colors">Why Dzaleka</a>

            <div className="relative group">
              <Link href="/things-to-do" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                Things To Do
                <svg className="h-3 w-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <div className="absolute left-0 top-full mt-1 w-48 rounded-md border bg-background shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="py-1">
                  <Link href="/things-to-do" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">All Experiences</Link>
                  <Link href="/things-to-do/arts-culture" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Arts & Culture</Link>
                  <Link href="/things-to-do/shopping" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Shopping & Markets</Link>
                  <Link href="/things-to-do/sports-recreation" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Sports & Recreation</Link>
                  <Link href="/things-to-do/host-community" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Host Community</Link>
                </div>
              </div>
            </div>
            <Link href="/whats-on" className="text-sm font-medium hover:text-primary transition-colors">What's On</Link>
            <Link href="/plan-your-trip" className="text-sm font-medium hover:text-primary transition-colors">Plan Your Trip</Link>
            <a href="#experiences" className="text-sm font-medium hover:text-primary transition-colors">Experiences</a>
            <a href="#community" className="text-sm font-medium hover:text-primary transition-colors">Community</a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Stories</a>
            <Link href="/blog" className="text-sm font-medium hover:text-primary transition-colors">Blog</Link>
            <div className="flex items-center gap-2 ml-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
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
            <a href="#features" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#why-dzaleka" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Why Dzaleka</a>
            <Link href="/things-to-do" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Things To Do</Link>
            <Link href="/things-to-do/arts-culture" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Arts & Culture</Link>
            <Link href="/things-to-do/shopping" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Shopping & Markets</Link>
            <Link href="/things-to-do/sports-recreation" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Sports & Recreation</Link>
            <Link href="/things-to-do/host-community" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Host Community</Link>
            <Link href="/whats-on" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>What's On</Link>
            <Link href="/plan-your-trip" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Plan Your Trip</Link>
            <a href="#experiences" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Experiences</a>
            <a href="#community" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Community</a>
            <a href="#pricing" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#testimonials" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Stories</a>
            <Link href="/blog" className="block text-sm font-medium py-1 text-primary" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/login">Book Now</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section - Full Screen Immersive */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image - Full visibility */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(https://tumainiletu.org/wp-content/uploads/2024/10/Badre_Bahaji_Tumaini_festival21_-31-1.jpg)' }}
          />
          {/* Gradient overlay - dark at bottom for text, transparent at top for image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Centered Content */}
          <div className="container relative mx-auto px-4 text-center z-10 pb-32 md:pb-24">
            <div className="max-w-4xl mx-auto">
              <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-white/30 bg-white/10 text-white rounded-full backdrop-blur-sm">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Experience the Heart of Africa
              </Badge>

              <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl drop-shadow-lg">
                {getContent("hero_title", "Experience Hope, Creativity, and Culture at Dzaleka.")}
              </h1>

              <p className="mb-10 text-lg text-white/90 md:text-xl max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                {getContent("hero_subtitle", "Discover Malawi's hidden gem—a unique community defined by extraordinary human spirit, vibrant arts, and innovative entrepreneurship. Your journey of authentic cultural exchange starts here.")}
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" className="h-14 px-10 text-lg shadow-2xl" asChild>
                  <Link href="/login">
                    {getContent("hero_cta", "Book Your Visit")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-10 text-lg border-white/40 text-white hover:bg-white/10 hover:text-white bg-transparent"
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
            </div>
          </div>

          {/* Stats Bar - Fixed at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 py-6">
                {stats.map((stat, index) => (
                  <div key={stat.value} className="text-center px-4 py-2">
                    <div className="text-2xl md:text-3xl font-bold text-foreground">
                      {stat.value}
                    </div>
                    <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      {getContent(`stats_label_${index + 1}`, stat.defaultLabel)}
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
                Seamless & Meaningful Visits: We Handle the Details
              </h2>
              <p className="text-lg text-muted-foreground">
                We've streamlined the entire process so you can focus on authentic connections
                and the experience, not the logistics.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card key={feature.key} className="border-none shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <feature.icon className="h-7 w-7" />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold">
                      {getContent(`feature_${index + 1}_title`, feature.defaultTitle)}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {getContent(`feature_${index + 1}_desc`, feature.defaultDesc)}
                    </p>
                    {(feature as any).link && (
                      <a
                        href={(feature as any).link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center mt-3 text-sm text-primary hover:underline"
                      >
                        {(feature as any).linkText} →
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Dzaleka Section */}
        <section id="why-dzaleka" className="py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center max-w-3xl mx-auto">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Why Dzaleka? A Journey Unlike Any Other
              </h2>
              <p className="text-lg text-muted-foreground">
                Discover what makes Dzaleka a truly unique destination.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {whyDzaleka.map((item, index) => {
                const IconComponent = item.icon === "Sparkles" ? Sparkles :
                  item.icon === "Lightbulb" ? Lightbulb :
                    item.icon === "Heart" ? Heart : TrendingUp;
                return (
                  <div key={index} className="text-center p-6">
                    <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Community Demographics Section */}
        <section id="community" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <div>
                <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
                  A Diverse Community of Resilience
                </h2>
                <p className="mb-6 text-lg text-muted-foreground leading-relaxed">
                  Dzaleka refugee camp is home to over <span className="font-semibold text-foreground">57,000 refugees and asylum seekers</span> from
                  several African nations. Originally designed for 10,000-12,000 people, the camp has grown to become a vibrant
                  multicultural community reflecting the protracted nature of conflicts in the region.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Each nationality brings unique traditions, languages, cuisines, and artistic expressions, creating one of Africa's
                  most culturally diverse communities within a single location.
                </p>
              </div>

              {/* Nationality Breakdown */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Nationalities in Dzaleka
                  </CardTitle>
                  <CardDescription>Population breakdown by country of origin</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {nationalities.map((nation) => (
                    <div key={nation.country} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{nation.flag}</span>
                          <span className="font-medium">{nation.country}</span>
                        </div>
                        <span className="text-sm text-muted-foreground font-semibold">{nation.percentage}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${nation.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t text-sm text-muted-foreground text-center">
                    + other nationalities including Mozambique, and more
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Experiences Section */}
        <section id="experiences" className="py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center max-w-3xl mx-auto">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Featured Experiences & Stories
              </h2>
              <p className="text-lg text-muted-foreground">
                Explore verified stories and experiences from Dzaleka.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {featuredExperiences.map((experience, index) => (
                <Card key={index} className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="text-4xl mb-4">{experience.image}</div>
                    <CardTitle className="text-xl">{experience.title}</CardTitle>
                    <CardDescription>{experience.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm italic text-muted-foreground mb-4">"{experience.hook}"</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full gap-2" asChild>
                      <a href={experience.link} target="_blank" rel="noopener noreferrer">
                        Learn More <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </CardFooter>
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
                {getContent("pricing_title", "Transparent Pricing")}
              </h2>
              <p className="text-lg text-muted-foreground">
                {getContent("pricing_desc", "Choose the package that fits your group size. All proceeds support the guides and community development projects.")}
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
                      <Link href="/login">Choose Plan</Link>
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
              {testimonials.map((testimonial, index) => (
                <Card key={testimonial.key} className="border-none shadow-sm bg-background">
                  <CardContent className="p-8">
                    <div className="mb-6 text-primary">
                      <Quote className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="mb-6 text-lg italic text-muted-foreground">
                      "{getContent(`testimonial_${index + 1}_quote`, testimonial.defaultQuote)}"
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {getContent(`testimonial_${index + 1}_author`, testimonial.defaultAuthor)[0]}
                      </div>
                      <div>
                        <div className="font-semibold">{getContent(`testimonial_${index + 1}_author`, testimonial.defaultAuthor)}</div>
                        <div className="text-sm text-muted-foreground">{getContent(`testimonial_${index + 1}_role`, testimonial.defaultRole)}</div>
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

        {/* Platform Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="mb-4 text-2xl font-bold tracking-tight md:text-3xl">
                Book with Confidence
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our platform makes it easy to plan, book, and manage your visit
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { icon: Calendar, label: "Real-time Availability" },
                { icon: CheckCircle, label: "Instant Confirmation" },
                { icon: Users, label: "Dashboard Tracking" },
                { icon: Globe, label: "Mobile Friendly" },
                { icon: Shield, label: "Secure Booking" },
                { icon: ArrowRight, label: "Email Reminders" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center text-center p-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Visitor Gallery Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full">
                <Camera className="mr-2 h-3.5 w-3.5" />
                Community Gallery
              </Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Share Your Dzaleka Experience
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Have you visited Dzaleka? Share your favorite photos, videos, and memories using
                <span className="font-semibold text-primary"> #VisitDzaleka</span> on Instagram and Twitter to be featured in our gallery!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="gap-2" asChild>
                  <a href="https://services.dzaleka.com/photos/" target="_blank" rel="noopener noreferrer">
                    <ImageIcon className="h-4 w-4" />
                    View Gallery
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="gap-2" asChild>
                  <a href="https://services.dzaleka.com/photos/submit/" target="_blank" rel="noopener noreferrer">
                    <Upload className="h-4 w-4" />
                    Submit Your Photos
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5" />
          <div className="container relative mx-auto px-4 text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
              {getContent("cta_title", "Ready to Plan Your Visit?")}
            </h2>
            <p className="mb-8 text-lg text-muted-foreground max-w-2xl mx-auto">
              {getContent("cta_desc", "Create an account to check availability, book your tour, and manage your itinerary.")}
            </p>
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/login">
                Get Started Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
