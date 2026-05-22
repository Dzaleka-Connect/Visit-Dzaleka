import { useState, useEffect } from "react";
import { Link } from "wouter";
import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    Heart,
    Globe,
    CheckCircle2,
    ArrowRight,
    Loader2,
    Menu,
    X,
    Sparkles,
    Camera,
    MessageCircle,
    HandHeart,
    MapPin,
    Share2,
    Instagram,
    Twitter,
    Facebook,
    Youtube,
    Linkedin,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    ShieldCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { friends } from "@/data/friends";

const whoCanApply = [
    "Have a real connection to Dzaleka",
    "Are comfortable sharing your experience responsibly",
    "Respect community values and privacy"
];

const whatInvolves = [
    {
        icon: Share2,
        title: "Share Your Experience",
        description: "Share your personal experience of Dzaleka on social media"
    },
    {
        icon: Camera,
        title: "Be Featured",
        description: "Be featured on Visit Dzaleka platforms"
    },
    {
        icon: MessageCircle,
        title: "Help Promote",
        description: "Help promote guided tours and cultural activities"
    },
    {
        icon: HandHeart,
        title: "Support Local",
        description: "Support local guides, artists, and small businesses"
    }
];

const whoAreThey = [
    "Grew up in Dzaleka or lived there",
    "Have visited the camp and spent time with the community",
    "Are artists, guides, organisers, or supporters connected to Dzaleka",
    "Care about ethical, community-led tourism"
];

const FRIENDS_OG_IMAGE = "https://services.dzaleka.com/images/dzaleka-hero.jpeg";

export default function FriendsOfDzaleka() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    // Form state for validation
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        location: "",
        role: "",
        bio: "",
        connection: "",
        contribution: "",
        social: ""
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name is required";
        }
        if (!formData.email.trim()) {
            newErrors.email = "Email address is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }
        if (!formData.location.trim()) {
            newErrors.location = "Location is required";
        }
        if (!formData.role.trim()) {
            newErrors.role = "Role is required";
        }
        if (formData.bio.trim().length < 150) {
            newErrors.bio = `Bio must be at least 150 characters (currently ${formData.bio.trim().length})`;
        }
        if (formData.connection.trim().length < 100) {
            newErrors.connection = `Connection details must be at least 100 characters (currently ${formData.connection.trim().length})`;
        }
        if (formData.contribution.trim().length < 100) {
            newErrors.contribution = `Contribution plan must be at least 100 characters (currently ${formData.contribution.trim().length})`;
        }

        setErrors(newErrors);
        return newErrors;
    };

    // Handle hash scrolling on mount
    useEffect(() => {
        if (window.location.hash) {
            const id = window.location.hash.substring(1); // Remove the '#'
            // Use setTimeout to allow potential layout shifts or rendering to complete
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    }, []);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const totalPages = Math.ceil(friends.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentFriends = friends.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            // Scroll to the top of the friends section
            document.getElementById('meet-friends')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const newErrors = validateForm();
        const firstErrorKey = Object.keys(newErrors)[0];

        if (firstErrorKey) {
            const element = document.getElementById(firstErrorKey);
            if (element) {
                element.focus();
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setIsSubmitting(true);
        const form = e.currentTarget;
        const submitData = new FormData(form);

        try {
            const response = await fetch("https://formspree.io/f/xqaaajae", {
                method: "POST",
                headers: {
                    'Accept': 'application/json'
                },
                body: submitData
            });

            if (response.ok) {
                toast({
                    title: "Application Submitted!",
                    description: "Thank you for your interest in becoming a Friend of Dzaleka. We'll review your application and get back to you soon.",
                    variant: "default",
                });
                form.reset();
                setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    location: "",
                    role: "",
                    bio: "",
                    connection: "",
                    contribution: "",
                    social: ""
                });
                setErrors({});
            } else {
                throw new Error("Failed to send application");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "There was a problem submitting your application. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <SEO
                title="Friends of Dzaleka"
                description="Join Friends of Dzaleka – help share the real story of Dzaleka Refugee Camp through authentic, community-led storytelling."
                keywords="Friends of Dzaleka, Dzaleka ambassador, community storytelling, refugee camp stories, ethical tourism"
                canonical="https://visit.dzaleka.com/friends-of-dzaleka"
                ogImage={FRIENDS_OG_IMAGE}
                imageAlt="Friends of Dzaleka community storytelling"
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
                        <Link href="/about-us" className="text-sm font-medium hover:text-primary transition-colors">About Us</Link>
                        <Link href="/things-to-do" className="text-sm font-medium hover:text-primary transition-colors">Things To Do</Link>
                        <Link href="/partner-with-us" className="text-sm font-medium hover:text-primary transition-colors">Partner With Us</Link>
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
                        <Link href="/about-us" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
                        <Link href="/things-to-do" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Things To Do</Link>
                        <Link href="/partner-with-us" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Partner With Us</Link>
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
                <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
                    <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary rounded-full uppercase tracking-widest font-semibold">
                            <Heart className="mr-2 h-3.5 w-3.5" />
                            Community Storytelling
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-foreground">
                            Friends of Dzaleka
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-3 duration-500">
                            Help share the real story of Dzaleka Refugee Camp through authentic, community-led storytelling and digital heritage preservation.
                        </p>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl -z-10" />
                </section>

                {/* Mission & Impact Grid */}
                <section className="py-16 md:py-24 bg-background">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <div className="grid gap-12 md:grid-cols-12 items-center">
                            {/* Mission Description */}
                            <div className="md:col-span-7 space-y-6">
                                <Badge variant="secondary" className="px-3 py-1 text-xs text-primary bg-primary/10 rounded-full font-semibold uppercase tracking-wider">
                                    Our Mission
                                </Badge>
                                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                                    A Community-Led Initiative
                                </h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Dzaleka Refugee Camp is a living community shaped by culture, creativity, and everyday life. People here are artists, teachers, students, parents, and business owners.
                                </p>
                                <p className="text-muted-foreground leading-relaxed">
                                    <strong>Friends of Dzaleka</strong> brings together people who have a genuine connection to the camp and want to help share its story in a respectful, ethical, and community-led way.
                                </p>
                            </div>

                            {/* Why It Matters Glass Card */}
                            <div className="md:col-span-5">
                                <Card className="border border-primary/10 bg-card/40 shadow-lg backdrop-blur-md relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                <Globe className="h-5 w-5" />
                                            </div>
                                            <CardTitle className="text-lg font-bold">Why It Matters</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Many people only hear about Dzaleka through brief news headlines. Friends of Dzaleka helps showcase everyday life, fostering:
                                        </p>
                                        <ul className="space-y-3">
                                            <li className="flex items-start gap-3 text-sm">
                                                <div className="p-1 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                                                    <BookOpen className="h-3.5 w-3.5" />
                                                </div>
                                                <span>Broadened cultural understanding</span>
                                            </li>
                                            <li className="flex items-start gap-3 text-sm">
                                                <div className="p-1 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                                                    <HandHeart className="h-3.5 w-3.5" />
                                                </div>
                                                <span>Direct support for local livelihoods</span>
                                            </li>
                                            <li className="flex items-start gap-3 text-sm">
                                                <div className="p-1 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                                                    <Users className="h-3.5 w-3.5" />
                                                </div>
                                                <span>Respectful, ethical visitor engagement</span>
                                            </li>
                                            <li className="flex items-start gap-3 text-sm">
                                                <div className="p-1 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                                                    <ShieldCheck className="h-3.5 w-3.5" />
                                                </div>
                                                <span>Stories rooted in lived experiences</span>
                                            </li>
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Program Details & Involvement Grid */}
                <section className="py-16 md:py-20 bg-muted/30 border-y border-muted/50">
                    <div className="container mx-auto px-4 max-w-5xl">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <Badge variant="outline" className="mb-3 px-3 py-1 text-xs text-primary border-primary/20 bg-primary/5 rounded-full font-semibold uppercase tracking-wider">
                                Getting Involved
                            </Badge>
                            <h2 className="text-3xl font-bold tracking-tight mb-4">What the Program Involves</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Share Dzaleka's narrative in your own way. There is no rigid script; you control the story you want to share.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {whatInvolves.map((item, index) => (
                                <Card key={index} className="border border-muted/60 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <item.icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="mt-12 p-6 rounded-xl border border-dashed border-muted-foreground/30 bg-background text-center max-w-3xl mx-auto">
                            <h4 className="font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                                <Users className="h-5 w-5 text-primary" /> Who can become a Friend?
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                We welcome anyone who has a real connection to Dzaleka, respects the community's privacy, and is committed to ethical tourism. You don't need a large following to make an impact.
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                {whoCanApply.map((item, index) => (
                                    <Badge key={index} variant="outline" className="px-3 py-1 bg-muted/40 text-xs rounded-full border-muted/80">
                                        {item}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Featured Friends */}
                <section className="py-16 bg-muted/30" id="meet-friends">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="flex items-center gap-3 mb-8">
                            <Users className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Meet Our Friends</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {currentFriends.map((friend, index) => (
                                <Card key={friend.slug || index} className="group overflow-hidden border border-muted/60 shadow-sm hover:border-primary/20 transition-all duration-300 bg-background flex flex-col h-full">
                                    <div className="h-48 relative overflow-hidden bg-muted">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-background flex items-center justify-center text-primary text-4xl font-bold tracking-tight">
                                            {friend.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        {friend.image && (
                                            <img
                                                src={friend.image}
                                                alt={friend.name}
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                        )}
                                        <Badge className="absolute top-3 left-3 bg-background/80 hover:bg-background/90 text-foreground text-[10px] font-semibold border backdrop-blur-sm px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                            {friend.role}
                                        </Badge>
                                    </div>
                                    <CardContent className="p-5 flex flex-col flex-1">
                                        <div className="mb-3">
                                            <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">{friend.name}</h3>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                                                {friend.location}
                                            </div>
                                        </div>

                                        <p className="text-muted-foreground text-xs leading-relaxed mb-4 line-clamp-3">
                                            {friend.shortBio}
                                        </p>

                                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-muted/50">
                                            <div className="flex gap-2.5">
                                                {friend.social.website && (
                                                    <a href={friend.social.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Website">
                                                        <Globe className="h-3.5 w-3.5" />
                                                    </a>
                                                )}
                                                {friend.social.instagram && (
                                                    <a href={friend.social.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
                                                        <Instagram className="h-3.5 w-3.5" />
                                                    </a>
                                                )}
                                                {friend.social.twitter && (
                                                    <a href={friend.social.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
                                                        <Twitter className="h-3.5 w-3.5" />
                                                    </a>
                                                )}
                                                {friend.social.facebook && (
                                                    <a href={friend.social.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
                                                        <Facebook className="h-3.5 w-3.5" />
                                                    </a>
                                                )}
                                                {friend.social.linkedin && (
                                                    <a href={friend.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
                                                        <Linkedin className="h-3.5 w-3.5" />
                                                    </a>
                                                )}
                                                {friend.social.youtube && (
                                                    <a href={friend.social.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="YouTube">
                                                        <Youtube className="h-3.5 w-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                            <Link href={`/friends-of-dzaleka/${friend.slug}`}>
                                                <Button variant="link" className="p-0 h-auto text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                                                    Read Story <ArrowRight className="ml-1 h-3 w-3" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="mt-10 flex justify-center items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="h-9 w-9"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="sr-only">Previous Page</span>
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(page)}
                                            className={`h-9 w-9 p-0 ${currentPage === page ? 'pointer-events-none' : ''}`}
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="h-9 w-9"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                    <span className="sr-only">Next Page</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </section>


                {/* Application Form */}
                <section className="py-16 bg-muted/30" id="apply-form">
                    <div className="container mx-auto px-4 max-w-2xl">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Join Friends of Dzaleka</h2>
                            <p className="text-muted-foreground">If you'd like to take part, please fill out the form below.</p>
                        </div>

                        <Card className="shadow-lg border-muted/60">
                            <CardHeader>
                                <CardTitle>Apply to Become a Friend</CardTitle>
                                <CardDescription>
                                    Tell us about your connection to Dzaleka. We'll review your application and get back to you.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <input type="hidden" name="_subject" value="Friends of Dzaleka Application - Visit Dzaleka" />
                                    <input type="hidden" name="form_type" value="friends_of_dzaleka" />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                                            <Input
                                                id="firstName"
                                                name="firstName"
                                                placeholder="e.g. Jane…"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                aria-invalid={!!errors.firstName}
                                            />
                                            {errors.firstName && (
                                                <p className="text-xs text-destructive mt-1" role="alert">
                                                    {errors.firstName}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                                            <Input
                                                id="lastName"
                                                name="lastName"
                                                placeholder="e.g. Doe…"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                aria-invalid={!!errors.lastName}
                                            />
                                            {errors.lastName && (
                                                <p className="text-xs text-destructive mt-1" role="alert">
                                                    {errors.lastName}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="e.g. you@example.com…"
                                            autoComplete="email"
                                            spellCheck={false}
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            aria-invalid={!!errors.email}
                                        />
                                        {errors.email && (
                                            <p className="text-xs text-destructive mt-1" role="alert">
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="location" className="text-sm font-medium">Where are you based?</label>
                                        <Input
                                            id="location"
                                            name="location"
                                            placeholder="e.g. Lilongwe, Malawi…"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            aria-invalid={!!errors.location}
                                        />
                                        {errors.location && (
                                            <p className="text-xs text-destructive mt-1" role="alert">
                                                {errors.location}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="role" className="text-sm font-medium">Proposed Role / Title</label>
                                        <Input
                                            id="role"
                                            name="role"
                                            placeholder="e.g. Artist…"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                            aria-invalid={!!errors.role}
                                        />
                                        {errors.role && (
                                            <p className="text-xs text-destructive mt-1" role="alert">
                                                {errors.role}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="bio" className="text-sm font-medium">Bio / Personal Story</label>
                                        <Textarea
                                            id="bio"
                                            name="bio"
                                            placeholder="Tell us a bit about yourself…"
                                            className="min-h-[120px]"
                                            value={formData.bio}
                                            onChange={handleInputChange}
                                            aria-invalid={!!errors.bio}
                                        />
                                        <div className="flex justify-between items-center mt-1">
                                            {errors.bio ? (
                                                <p className="text-xs text-destructive font-medium" role="alert">
                                                    {errors.bio}
                                                </p>
                                            ) : (
                                                <div />
                                            )}
                                            <p className={`text-xs ${formData.bio.trim().length < 150 ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {formData.bio.trim().length}/150 characters min
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="connection" className="text-sm font-medium">What is your connection to Dzaleka?</label>
                                        <Textarea
                                            id="connection"
                                            name="connection"
                                            placeholder="Describe your relationship with Dzaleka in detail…"
                                            className="min-h-[100px]"
                                            value={formData.connection}
                                            onChange={handleInputChange}
                                            aria-invalid={!!errors.connection}
                                        />
                                        <div className="flex justify-between items-center mt-1">
                                            {errors.connection ? (
                                                <p className="text-xs text-destructive font-medium" role="alert">
                                                    {errors.connection}
                                                </p>
                                            ) : (
                                                <div />
                                            )}
                                            <p className={`text-xs ${formData.connection.trim().length < 100 ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {formData.connection.trim().length}/100 characters min
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="contribution" className="text-sm font-medium">Contribution Plan</label>
                                        <Textarea
                                            id="contribution"
                                            name="contribution"
                                            placeholder="How you plan to share Dzaleka's story…"
                                            className="min-h-[100px]"
                                            value={formData.contribution}
                                            onChange={handleInputChange}
                                            aria-invalid={!!errors.contribution}
                                        />
                                        <div className="flex justify-between items-center mt-1">
                                            {errors.contribution ? (
                                                <p className="text-xs text-destructive font-medium" role="alert">
                                                    {errors.contribution}
                                                </p>
                                            ) : (
                                                <div />
                                            )}
                                            <p className={`text-xs ${formData.contribution.trim().length < 100 ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {formData.contribution.trim().length}/100 characters min
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="social" className="text-sm font-medium">Social Media / Website (optional)</label>
                                        <Input
                                            id="social"
                                            name="social"
                                            placeholder="e.g. @yourhandle or https://…"
                                            value={formData.social}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Submitting…
                                            </>
                                        ) : (
                                            <>
                                                Submit Application <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div >
    );
}
