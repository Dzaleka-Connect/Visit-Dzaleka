import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Clock,
  CreditCard,
  Headphones,
  RefreshCw,
  Search,
  CalendarDays,
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
    description: "A personal, one-on-one cultural immersion tailored to your specific interests. Connect deeply with your guide at your own pace.",
    features: ["Fully Personalized Itinerary", "Dedicated Local Host", "Flexible Pace & Focus", "1-on-1 Cultural Exchange"],
    highlight: false
  },
  {
    title: "Small Group",
    price: "MWK 50,000",
    description: "Perfect for couples or small families (2-5 people) seeking an intimate, interactive experience. Share the journey together.",
    features: ["Interactive Group Tour", "Experienced Guide", "Family-Friendly", "Shared Experience"],
    highlight: true
  },
  {
    title: "Medium Group",
    price: "MWK 80,000",
    description: "Ideal for extended families, friend groups, or small teams (6-10 people). A balanced experience ensuring everyone engages.",
    features: ["Structured Group Experience", "Senior Guide", "Engaging for All Ages", "Custom Focus Options"],
    highlight: false
  },
  {
    title: "Large Group",
    price: "MWK 100,000",
    description: "Designed for schools, organizations, or delegations (10+ people). Includes dedicated logistics and multiple guides for a smooth visit.",
    features: ["Full Logistics Support", "Multiple Dedicated Guides", "Educational Focus", "Q&A & Debrief Session"],
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

// Trust badges for credibility
const trustBadges = [
  { icon: Shield, text: "Verified Local Guides" },
  { icon: RefreshCw, text: "Free Cancellation" },
  { icon: CreditCard, text: "Secure Booking" },
  { icon: Headphones, text: "24/7 Support" },
  { icon: Clock, text: "Instant Confirmation" },
];

// Dzaleka Highlights - Inspiration articles
const dzalekaHighlights = [
  {
    title: "24 Hours in Dzaleka",
    description: "Make the most of your day with our curated itinerary",
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhQC52NEfamRlqaUT7uLWcP8ZKNUDp3_opelPFqoO6E5hyphenhyphen09lp-zxRXXig5aEnaH3PbRsia1ciM8y-vOdzDe9RMvbQApON7rdM0SrBmtVVWAPIzmiId-jvcwSa46-Y-qRApCBTmozhIbWhNZWxcLFY3bp6Q4uNk_LFB5MpYFlXywwX7vYlUQeRoirJWm50/s2048/533061219_1079243081018233_5344782622295089839_n.jpg",
    link: "/blog/24-hours-in-dzaleka"
  },
  {
    title: "Best Markets & Shopping",
    description: "Discover Mardi Marché and artisan crafts",
    image: "https://services.dzaleka.com/images/Dzaleka_Marketplace.jpeg",
    link: "/things-to-do/shopping"
  },
  {
    title: "Arts & Culture Guide",
    description: "From Tumaini Festival to local theater groups",
    image: "https://tumainiletu.org/wp-content/uploads/2021/07/Website-Entrepreneurship-and-innovation-2048x1536.jpg",
    link: "/things-to-do/arts-culture"
  },
  {
    title: "Food Experiences",
    description: "Taste King's Chapati and authentic Congolese cuisine",
    image: "https://live.staticflickr.com/65535/49083236178_c692c9746d_c.jpg",
    link: "/things-to-do"
  },
];

import { type Event, type BlogPost } from "@shared/schema";

// Featured events (would be pulled from API in production)
// const featuredEvents = []; // Now fetching from API

const featuredExperiences = [
  {
    title: "Experience the Tumaini Festival",
    description: "The world's only cultural festival within a refugee camp, attracting thousands of visitors and performers from over 25 countries.",
    hook: "Plan your trip around this extraordinary event.",
    link: "https://tumainiletu.org/tumaini-festival/",
    image: "https://idsb.tmgrup.com.tr/ly/uploads/images/2024/11/04/353422.jpg",
    duration: "3 Days",
    rating: "5.0"
  },
  {
    title: "Meet the Makers: Innovation Tour",
    description: "Discover tech labs, fashion designers, and film companies that thrive against all odds.",
    hook: "Connect with digital pioneers shaping their future.",
    link: "/things-to-do",
    image: "https://openlearning.mit.edu/sites/default/files/styles/event_news_detail/public/news-events/2024-02/ADAI-Circle-MIT-Emerging-Talent-00_0.JPG?itok=2H1_RlIh",
    duration: "2 Hours",
    rating: "5.0"
  },
  {
    title: "Cultural Food Experience",
    description: "Taste authentic Congolese, Burundian, and Rwandan cuisine prepared by local chefs.",
    hook: "A culinary journey through the Great Lakes region.",
    link: "/things-to-do",
    image: "https://www.wfp.org/sites/default/files/styles/media_embed/public/2022-06/WF1568463_20220519_MWI_Badre_Bahaji--_0.jpg?itok=0TrCCVT-", // Food placeholder
    duration: "3 Hours",
    rating: "5.0"
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

  const { data: events, isLoading: isLoadingEvents } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: blogPosts, isLoading: isLoadingBlog } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": featuredExperiences.map((experience, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "TouristAttraction",
                "name": experience.title,
                "description": experience.description,
                "url": experience.link.startsWith("http") ? experience.link : `https://visit.dzaleka.com${experience.link}`,
                "image": experience.image
              }
            }))
          })
        }}
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
          <nav className="hidden md:flex items-center gap-3">
            {/* Discover Dropdown */}
            <div className="relative group">
              <button className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                Discover
                <svg className="h-3 w-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 top-full mt-1 w-56 rounded-md border bg-background shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="py-1">
                  <p className="px-4 py-1 text-xs text-muted-foreground uppercase tracking-wider">About</p>
                  <Link href="/about-dzaleka" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">About Dzaleka</Link>
                  <Link href="/about-us" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">About Us</Link>
                  <Link href="/life-in-dzaleka" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Life in Dzaleka</Link>
                  <div className="border-t my-1" />
                  <p className="px-4 py-1 text-xs text-muted-foreground uppercase tracking-wider">Things To Do</p>
                  <Link href="/things-to-do" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">All Experiences</Link>
                  <Link href="/things-to-do/arts-culture" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Arts & Culture</Link>
                  <Link href="/things-to-do/shopping" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Shopping & Markets</Link>
                  <Link href="/things-to-do/sports-recreation" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Sports & Recreation</Link>
                  <Link href="/things-to-do/host-community" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Host Community</Link>
                  <div className="border-t my-1" />
                  <Link href="/whats-on" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">What's On</Link>
                  <Link href="/blog" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Blog</Link>
                </div>
              </div>
            </div>

            {/* Plan Your Trip Dropdown */}
            <div className="relative group">
              <Link href="/plan-your-trip" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                Plan Your Trip
                <svg className="h-3 w-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <div className="absolute left-0 top-full mt-1 w-48 rounded-md border bg-background shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="py-1">
                  <Link href="/plan-your-trip" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Trip Planner</Link>
                  <Link href="/plan-your-trip/visitor-essentials" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Visitor Essentials</Link>
                  <Link href="/accommodation" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Accommodation</Link>
                </div>
              </div>
            </div>

            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Stories</a>

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
          <div className="md:hidden border-t bg-background p-4 space-y-2 max-h-[70vh] overflow-y-auto">
            {/* Discover Section */}
            <p className="text-xs text-muted-foreground uppercase tracking-wider pt-1">Discover</p>
            <Link href="/about-dzaleka" className="block text-sm font-medium py-1.5" onClick={() => setMobileMenuOpen(false)}>About Dzaleka</Link>
            <Link href="/about-us" className="block text-sm font-medium py-1.5" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
            <Link href="/life-in-dzaleka" className="block text-sm font-medium py-1.5" onClick={() => setMobileMenuOpen(false)}>Life in Dzaleka</Link>
            <Link href="/things-to-do" className="block text-sm font-medium py-1.5" onClick={() => setMobileMenuOpen(false)}>Things To Do</Link>
            <Link href="/whats-on" className="block text-sm font-medium py-1.5" onClick={() => setMobileMenuOpen(false)}>What's On</Link>
            <Link href="/blog" className="block text-sm font-medium py-1.5" onClick={() => setMobileMenuOpen(false)}>Blog</Link>

            <div className="border-t my-2" />

            {/* Plan Section */}
            <p className="text-xs text-muted-foreground uppercase tracking-wider pt-1">Plan Your Trip</p>
            <Link href="/plan-your-trip" className="block text-sm font-medium py-1.5" onClick={() => setMobileMenuOpen(false)}>Trip Planner</Link>
            <Link href="/plan-your-trip/visitor-essentials" className="block text-sm font-medium py-1.5" onClick={() => setMobileMenuOpen(false)}>Visitor Essentials</Link>
            <Link href="/accommodation" className="block text-sm font-medium py-1.5" onClick={() => setMobileMenuOpen(false)}>Accommodation</Link>

            <div className="border-t my-2" />

            {/* Buttons */}
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
                Refugee-Led Tourism
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
                  <Link href="/about-us">
                    Learn More
                  </Link>
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

        {/* Trust Badges Bar */}
        <section className="border-b bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 py-4">
              {trustBadges.map((badge) => (
                <div key={badge.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <badge.icon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Booking Widget */}
        <section className="py-8 bg-background border-b">
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto shadow-lg border-primary/20">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-4 w-full md:items-end">
                  <div className="flex-1 space-y-2 min-w-0">
                    <label className="text-sm font-medium text-muted-foreground">When are you visiting?</label>
                    <div className="relative w-full">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                      <Input
                        type="date"
                        className="pl-10 w-full h-12 text-base [&::-webkit-calendar-picker-indicator]:opacity-100"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <label className="text-sm font-medium text-muted-foreground">Group Size</label>
                    <Select defaultValue="1">
                      <SelectTrigger className="h-12 text-base">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select group size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Person</SelectItem>
                        <SelectItem value="2-5">2-5 People</SelectItem>
                        <SelectItem value="6-10">Medium Group (6-10 People)</SelectItem>
                        <SelectItem value="10+">Large Group (10+ People)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <label className="text-sm font-medium text-muted-foreground">Experience Type</label>
                    <Select defaultValue="cultural">
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cultural">Cultural Tour</SelectItem>
                        <SelectItem value="food">Food Experience</SelectItem>
                        <SelectItem value="innovation">Innovation Tour</SelectItem>
                        <SelectItem value="arts">Arts & Crafts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="lg" className="w-full md:w-auto px-8 h-12 text-base" asChild>
                    <Link href="/login">
                      <Search className="mr-2 h-4 w-4" />
                      Find Tours
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Dzaleka Highlights - Inspiration Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dzaleka Highlights</h2>
              <Button variant="ghost" asChild className="group">
                <Link href="/things-to-do">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {dzalekaHighlights.map((highlight) => (
                <Link key={highlight.title} href={highlight.link}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group h-full">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={highlight.image}
                        alt={highlight.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://tumainiletu.org/wp-content/uploads/2024/10/Badre_Bahaji_Tumaini_festival21_-31-1.jpg";
                        }}
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">{highlight.title}</h3>
                      <p className="text-sm text-muted-foreground">{highlight.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Events - What's On */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">What's On</h2>
              <Button variant="ghost" asChild className="group">
                <Link href="/whats-on">
                  See All Events
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {isLoadingEvents ? (
                // Loading Skeletons
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden h-full">
                    <div className="aspect-[16/9] bg-muted animate-pulse" />
                    <CardContent className="p-4">
                      <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                    </CardContent>
                  </Card>
                ))
              ) : events?.length === 0 ? (
                <div className="md:col-span-3">
                  <Card className="bg-primary/5 border-primary/20 text-center">
                    <CardContent className="flex flex-col items-center justify-center p-8 md:p-12">
                      <Lightbulb className="h-10 w-10 text-primary mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No upcoming events at the moment – check back soon!</h3>
                      <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                        There's always something happening in Dzaleka Refugee Camp. If you're organizing an event, workshop, or community gathering, share it with us and we'll help spread the word.
                      </p>
                      <Button asChild size="lg">
                        <a href="https://services.dzaleka.com/events/organize" target="_blank" rel="noopener noreferrer">
                          Submit Event
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                events?.map((event) => (
                  <a
                    key={event.id}
                    href={event.link || "#"}
                    target={event.link?.startsWith('http') ? '_blank' : undefined}
                    rel={event.link?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group h-full">
                      <div className="aspect-[16/9] relative overflow-hidden">
                        <img
                          src={event.image || "https://tumainiletu.org/wp-content/uploads/2024/10/Badre_Bahaji_Tumaini_festival21_-31-1.jpg"}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://tumainiletu.org/wp-content/uploads/2024/10/Badre_Bahaji_Tumaini_festival21_-31-1.jpg";
                          }}
                        />
                        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                          <Calendar className="mr-1 h-3 w-3" />
                          {event.date}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs font-normal border-primary/20 text-primary">{event.category}</Badge>
                        </div>
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">{event.title}</h3>

                        <div className="flex items-center text-xs text-muted-foreground mb-2 flex-wrap">
                          <div className="flex items-center mr-3">
                            <CalendarDays className="h-3 w-3 mr-1" />
                            <span>{event.date}</span>
                          </div>
                          {event.time && (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{event.time}</span>
                            </div>
                          )}
                        </div>

                        {event.location && (
                          <div className="flex items-center text-xs text-muted-foreground mb-2">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}

                        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                      </CardContent>
                    </Card>
                  </a>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center max-w-3xl mx-auto">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Seamless & Meaningful Visits
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

        {/* Video Showcase Section */}
        <section id="videos" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center max-w-3xl mx-auto">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                See Dzaleka
              </h2>
              <p className="text-lg text-muted-foreground">
                Watch these videos to get a glimpse of life, culture, and community in Dzaleka Refugee Camp.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
              {/* Video 1 */}
              <a
                href="https://www.youtube.com/watch?v=T4oSsqeraHE"
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <Card className="overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="aspect-video relative bg-black">
                    <img
                      src="https://img.youtube.com/vi/T4oSsqeraHE/maxresdefault.jpg"
                      alt="Dzaleka Video"
                      className="w-full h-full object-cover transition-opacity group-hover:opacity-80"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://img.youtube.com/vi/T4oSsqeraHE/hqdefault.jpg";
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                        <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="font-semibold group-hover:text-primary transition-colors">Watch on YouTube →</p>
                  </CardContent>
                </Card>
              </a>

              {/* Video 2 */}
              <a
                href="https://www.youtube.com/watch?v=BQvjRVqsyZM"
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <Card className="overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="aspect-video relative bg-black">
                    <img
                      src="https://img.youtube.com/vi/BQvjRVqsyZM/maxresdefault.jpg"
                      alt="Dzaleka Video"
                      className="w-full h-full object-cover transition-opacity group-hover:opacity-80"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://img.youtube.com/vi/BQvjRVqsyZM/hqdefault.jpg";
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                        <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="font-semibold group-hover:text-primary transition-colors">Watch on YouTube →</p>
                  </CardContent>
                </Card>
              </a>
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
        <section id="experiences" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center max-w-3xl mx-auto">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Top Experiences
              </h2>
              <p className="text-lg text-muted-foreground">
                Discover our most popular tours and cultural experiences.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {featuredExperiences.map((experience, index) => (
                <a
                  key={index}
                  href={experience.link}
                  target={experience.link.startsWith('http') ? '_blank' : undefined}
                  rel={experience.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group h-full">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={experience.image}
                        alt={experience.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://tumainiletu.org/wp-content/uploads/2024/10/Badre_Bahaji_Tumaini_festival21_-31-1.jpg";
                        }}
                      />
                      {/* Duration badge */}
                      <Badge className="absolute top-3 left-3 bg-black/70 text-white backdrop-blur-sm">
                        <Clock className="mr-1 h-3 w-3" />
                        {experience.duration}
                      </Badge>
                      {/* Free cancellation badge */}
                      <Badge variant="secondary" className="absolute top-3 right-3 bg-green-500/90 text-white">
                        Free Cancellation
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-sm">{experience.rating}</span>
                        <span className="text-sm text-muted-foreground">(Reviews)</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {experience.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{experience.description}</p>
                      <p className="text-xs italic text-muted-foreground">"{experience.hook}"</p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>

            <div className="text-center mt-10">
              <Button size="lg" asChild>
                <Link href="/things-to-do">
                  View All Experiences
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* From the Blog Section */}
        {blogPosts && blogPosts.length > 0 && (
          <section id="blog" className="py-24 bg-background">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight">From the Blog</h2>
                  <p className="text-muted-foreground mt-2">Stories, tips, and inspiration for your visit</p>
                </div>
                <Button variant="ghost" asChild className="group hidden sm:flex">
                  <Link href="/blog">
                    View All Articles
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {blogPosts.slice(0, 3).map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group h-full">
                      {post.coverImage && (
                        <div className="aspect-[16/9] overflow-hidden bg-muted">
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://tumainiletu.org/wp-content/uploads/2024/10/Badre_Bahaji_Tumaini_festival21_-31-1.jpg";
                            }}
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Calendar className="h-3 w-3" />
                          <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Draft"}</span>
                        </div>
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.excerpt || post.content?.substring(0, 120) + "..."}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-8 sm:hidden">
                <Button variant="outline" asChild>
                  <Link href="/blog">
                    View All Articles
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}

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

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
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
