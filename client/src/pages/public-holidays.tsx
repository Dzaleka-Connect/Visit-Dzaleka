import { useState } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Info, Menu, X, MapPin } from "lucide-react";

export default function PublicHolidays() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const holidays = [
        {
            date: "January 1 (Thursday)",
            name: "New Year's Day",
            description: "Also known locally as Chilimike."
        },
        {
            date: "January 15 (Thursday)",
            name: "John Chilembwe Day",
            description: "Honoring the leader of the 1915 uprising against colonial rule."
        },
        {
            date: "March 3 (Tuesday)",
            name: "Martyrs' Day",
            description: "Commemorating those who died in the struggle for independence."
        },
        {
            date: "March 20 (Friday)",
            name: "Eid al-Fitr (tentative)",
            description: "Marking the end of Ramadan."
        },
        {
            date: "April 3 (Friday)",
            name: "Good Friday"
        },
        {
            date: "April 6 (Monday)",
            name: "Easter Monday"
        },
        {
            date: "May 1 (Friday)",
            name: "Labour Day",
            description: "International Workers' Day."
        },
        {
            date: "May 14 (Thursday)",
            name: "Kamuzu Day",
            description: "Celebrating the birthday of the first president, Dr. Hastings Kamuzu Banda."
        },
        {
            date: "July 6 (Monday)",
            name: "Independence Day (National Day)",
            description: "Celebrating the country's independence in 1964."
        },
        {
            date: "October 15 (Thursday)",
            name: "Mother's Day"
        },
        {
            date: "December 25 (Friday)",
            name: "Christmas Day"
        },
        {
            date: "December 26 (Saturday)",
            name: "Boxing Day"
        },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Helmet>
                <title>Public Holidays - Visit Dzaleka</title>
                <meta
                    name="description"
                    content="Information about public holidays and significant observances in Dzaleka Refugee Camp."
                />
            </Helmet>

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

                    <nav className="hidden md:flex items-center gap-4">
                        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
                        <Link href="/blog" className="text-sm font-medium hover:text-primary transition-colors">Blog</Link>
                        <Link href="/life-in-dzaleka" className="text-sm font-medium hover:text-primary transition-colors">Life in Dzaleka</Link>
                        <div className="relative group">
                            <Link href="/plan-your-trip" className="text-sm font-medium text-primary transition-colors flex items-center gap-1">
                                Plan Your Trip
                                <svg className="h-3 w-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </Link>
                            <div className="absolute left-0 top-full mt-1 w-48 rounded-md border bg-background shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                <div className="py-1">
                                    <Link href="/plan-your-trip" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Trip Planner</Link>
                                    <Link href="/plan-your-trip/visitor-essentials" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Visitor Essentials</Link>
                                    <Link href="/plan-your-trip/safe-travel" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Safe Travel</Link>
                                    <Link href="/plan-your-trip/public-holidays" className="block px-4 py-2 text-sm hover:bg-muted transition-colors font-medium">Public Holidays</Link>
                                    <Link href="/plan-your-trip/dzaleka-map" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Dzaleka Map</Link>
                                    <Link href="/accommodation" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Accommodation</Link>
                                </div>
                            </div>
                        </div>
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
                        <Link href="/life-in-dzaleka" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Life in Dzaleka</Link>
                        <Link href="/plan-your-trip" className="block text-sm font-medium py-1 text-primary" onClick={() => setMobileMenuOpen(false)}>Plan Your Trip</Link>
                        <Link href="/plan-your-trip/visitor-essentials" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Visitor Essentials</Link>
                        <Link href="/plan-your-trip/public-holidays" className="block text-sm font-medium py-1 pl-4 text-primary" onClick={() => setMobileMenuOpen(false)}>↳ Public Holidays</Link>
                        <Link href="/accommodation" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Accommodation</Link>
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
                <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage:
                                "url('https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=2940&auto=format&fit=crop')",
                        }}
                    >
                        <div className="absolute inset-0 bg-black/50" />
                    </div>
                    <div className="relative container mx-auto h-full flex items-center justify-center text-center text-white">
                        <div className="max-w-2xl px-4 animate-fade-up">
                            <h1 className="text-4xl md:text-6xl font-bold mb-4">
                                Public Holidays
                            </h1>
                            <p className="text-lg md:text-xl text-gray-200">
                                Observances and celebrations within Dzaleka Refugee Camp
                            </p>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto py-12 space-y-12">
                    {/* Intro Section */}
                    <div className="max-w-3xl mx-auto text-center space-y-4">
                        <h2 className="text-3xl font-bold text-foreground">
                            Community Calendar
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Dzaleka Refugee Camp observes both the official national holidays of
                            Malawi and significant days relevant to the refugee community.
                            Planning your visit around these dates can help ensure available
                            services and respectful engagement.
                        </p>
                    </div>

                    {/* National Holidays */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Malawi National Holidays</h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {holidays.map((holiday, index) => (
                                <Card key={index} className="border-border hover:border-primary/50 transition-colors">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg font-semibold text-primary">
                                            {holiday.date}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="font-medium">{holiday.name}</p>
                                        {/* @ts-ignore */}
                                        {holiday.description && (
                                            <p className="text-sm text-muted-foreground mt-1">{holiday.description}</p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg flex gap-3 text-sm text-muted-foreground border border-border">
                            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>
                                <strong>Note on Observed Holidays:</strong> If a public holiday
                                falls on a Saturday or Sunday, the following Monday is typically
                                observed as a public holiday. Government offices and many
                                businesses will be closed.
                            </p>
                        </div>
                    </div>

                    {/* Significant Camp Observances */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Significant Camp Observances</h2>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle className="text-xl">World Refugee Day</CardTitle>
                                    <p className="text-sm font-medium text-primary">June 20</p>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        A major event in Dzaleka featuring cultural performances,
                                        advocacy events, and community gatherings to honor the
                                        strength and courage of people who have been forced to flee
                                        their home country.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle className="text-xl">Tumaini Festival</CardTitle>
                                    <p className="text-sm font-medium text-primary">
                                        Late October / Early November
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        An extraordinary music and arts festival founded and held
                                        within Dzaleka. It attracts visitors from across Malawi and
                                        internationally, showcasing talent from the camp and
                                        fostering intercultural harmony.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Important Notes */}
                    <div className="bg-card border border-border rounded-xl p-8 space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Info className="w-5 h-5 text-primary" />
                            Visitor Note: Movement Restrictions
                        </h3>
                        <p className="text-muted-foreground">
                            On public holidays, processing for <strong>Gate Passes (Kibali)</strong> and
                            administrative offices may be closed or operating on reduced hours.
                            Please verify office hours if you require administrative assistance
                            during your visit.
                        </p>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
