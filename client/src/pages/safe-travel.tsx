import { useState } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Shield,
    Phone,
    AlertTriangle,
    Building2,
    Stethoscope,
    Car,
    Camera,
    Droplets,
    Sun,
    Menu,
    X,
    ExternalLink,
    MapPin,
    Plane,
    CreditCard,
    Printer
} from "lucide-react";

export default function SafeTravel() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const nationalEmergencyNumbers = [
        { service: "Police", number: "997 or 990", icon: Shield },
        { service: "Ambulance", number: "998", note: "or 118 for M1 highway accidents", icon: Stethoscope },
        { service: "Fire", number: "999", icon: AlertTriangle },
    ];

    const localContacts = [
        {
            name: "Dzaleka Health Centre",
            type: "Hospital",
            location: "Dzaleka, M16",
            description: "Primary 24/7 healthcare facility located within the camp.",
            contact: "+265 999 124 688",
            contactLabel: "Focal Person"
        },
        {
            name: "Dowa District Hospital",
            type: "Hospital",
            location: "Dowa District",
            description: "The primary referral center for the Dowa region.",
            contact: "+265 1 282 208 / +265 1 282 220",
            contactLabel: "Main Line"
        },
        {
            name: "Dzaleka Police Station",
            type: "Government Office",
            location: "Dzaleka, M16",
            description: "Localized security within the camp.",
            contact: "+265 887 389 290",
            contactLabel: "Regional Police HQ (Northern)"
        },
        {
            name: "UNHCR Malawi",
            type: "Protection Agency",
            location: "Dzaleka Refugee Camp, Dowa",
            description: "For protection-related emergencies or serious legal issues.",
            contact: "+265 1 772 155",
            contactLabel: "Main Office",
            secondaryContact: "+265 999 911 830",
            secondaryLabel: "Reporting Associate"
        },
    ];

    const lilongweHospitals = [
        {
            name: "Daeyang Luke Hospital",
            description: "Open 24/7; known for high infrastructure standards.",
            contact: "+265 997 43 48 73",
            contactLabel: "Emergency"
        },
        {
            name: "Kamuzu Central Hospital",
            description: "Largest public tertiary hospital in Malawi.",
            contact: "+265 1 756 900",
            contactLabel: "Emergency/Main Line"
        },
    ];

    const evacuationServices = [
        {
            name: "Medical Rescue International (MRI) Malawi",
            description: "A major provider in the region offering fully equipped ground and air ambulances.",
            contacts: [
                { label: "Local Toll Free", number: "992" },
                { label: "Lilongwe Office", number: "+265 888 189 070 / +265 888 189 072" },
                { label: "International Helpdesk", number: "+267 390 1601" },
            ]
        },
        {
            name: "Medical Air Service",
            description: "Offers air ambulance flights and medical escorts on commercial flights to or from Malawi for repatriation.",
            contacts: [
                { label: "UK Phone", number: "+44 (0) 20 / 3514 8813" },
                { label: "USA Phone", number: "+1 929 / 339 10 72" },
            ]
        },
        {
            name: "Halsted's Aviation Corporation (HAC Medical)",
            description: "Provides EURAMI-accredited regional fixed-wing aero-medical services, particularly for critical care transfers.",
            contacts: [
                { label: "Medical Call Centre", number: "+263 789 444 000" },
            ]
        },
        {
            name: "MASM (Medical Aid Society of Malawi)",
            description: "Offers ambulance services in major cities, primarily for members but may assist others.",
            contacts: [
                { label: "Lilongwe Mobile", number: "+265 888 189 070" },
            ]
        },
    ];

    const securityProtocols = [
        {
            icon: Sun,
            title: "Move Only in Daylight",
            description: "Avoid walking after dark, even in groups. Armed muggings and assaults have increased in urban areas and camp zones."
        },
        {
            icon: Car,
            title: "Use Trusted Transport",
            description: "Request taxis through established hotels or restaurants rather than hailing them on the street. Keep windows up and doors locked."
        },
        {
            icon: Shield,
            title: "Verify Your Guide",
            description: "Be cautious of strangers offering tour services. Ensure your guide is verified through a recognized community-led platform or agency."
        },
        {
            icon: AlertTriangle,
            title: "Discretion with Valuables",
            description: "Minimize displays of wealth and avoid carrying large amounts of cash. Hand over valuables without resistance if confronted."
        },
    ];

    const visitorGuidelines = [
        {
            icon: Building2,
            title: "Official Permits",
            description: "Specialized visits (research, media) require approval from the Malawi Ministry of Homeland Security or UNHCR."
        },
        {
            icon: Droplets,
            title: "Health Precautions",
            description: "Use treated mosquito nets and insect repellent—malaria is endemic. Drink only bottled or boiled water to avoid waterborne diseases."
        },
        {
            icon: Camera,
            title: "Photography Ethics",
            description: "Always obtain explicit permission before photographing individuals. Never photograph government or security facilities."
        },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Helmet>
                <title>Safe Travel & Emergency Information | Visit Dzaleka</title>
                <meta
                    name="description"
                    content="Essential safety information and emergency contacts for visitors to Dzaleka Refugee Camp. National emergency numbers, local contacts, and security protocols."
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
                        <Link href="/things-to-do" className="text-sm font-medium hover:text-primary transition-colors">Things To Do</Link>
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
                                    <Link href="/plan-your-trip/safe-travel" className="block px-4 py-2 text-sm hover:bg-muted transition-colors font-medium">Safe Travel</Link>
                                    <Link href="/plan-your-trip/public-holidays" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Public Holidays</Link>
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

                    <button
                        className="md:hidden p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden border-t bg-background p-4 space-y-3">
                        <Link href="/" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                        <Link href="/blog" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
                        <Link href="/things-to-do" className="block text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Things To Do</Link>
                        <Link href="/plan-your-trip" className="block text-sm font-medium py-1 text-primary" onClick={() => setMobileMenuOpen(false)}>Plan Your Trip</Link>
                        <Link href="/plan-your-trip/visitor-essentials" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Visitor Essentials</Link>
                        <Link href="/plan-your-trip/safe-travel" className="block text-sm font-medium py-1 pl-4 text-primary" onClick={() => setMobileMenuOpen(false)}>↳ Safe Travel</Link>
                        <Link href="/plan-your-trip/public-holidays" className="block text-sm font-medium py-1 pl-4 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>↳ Public Holidays</Link>
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
                <div className="relative py-24 overflow-hidden bg-gradient-to-br from-red-500/10 via-background to-orange-500/5">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-geometric.png')] opacity-5" />
                    <div className="container mx-auto px-4 text-center relative z-10">
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm rounded-full uppercase tracking-widest font-semibold border-red-500/30 bg-red-500/10 text-red-600">
                            <Shield className="mr-2 h-3.5 w-3.5" />
                            Safety First
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                            Safe Travel & Emergency Info
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            Essential contacts, security protocols, and visitor guidelines for a safe experience in Dzaleka.
                        </p>
                    </div>
                </div>

                <div className="container mx-auto py-16 space-y-16 px-4">
                    {/* Important Notice */}
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-amber-800 dark:text-amber-200 mb-2">Important Note</h3>
                                <p className="text-amber-700 dark:text-amber-300 text-sm">
                                    Emergency response in Malawi is categorized by local and national services. While national "99x" numbers exist,
                                    response times can vary. For localized incidents in Dzaleka, contacting the Dowa District Police or
                                    Dzaleka Health Centre directly is often faster.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* National Emergency Numbers */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 rounded-lg bg-red-500/10 text-red-600">
                                <Phone className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">National Emergency Numbers</h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {nationalEmergencyNumbers.map((item, index) => (
                                <Card key={index} className="border-2 border-red-200 dark:border-red-900 hover:border-red-400 transition-colors">
                                    <CardContent className="p-6 text-center">
                                        <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                            <item.icon className="h-7 w-7 text-red-600" />
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">{item.service}</h3>
                                        <p className="text-3xl font-bold text-red-600 mb-1">{item.number}</p>
                                        {item.note && (
                                            <p className="text-xs text-muted-foreground">{item.note}</p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Dzaleka & Local Area Contacts */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Dzaleka & Local Area Contacts</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {localContacts.map((contact, index) => (
                                <Card key={index} className="border-border hover:border-primary/50 transition-colors">
                                    <CardHeader className="pb-3">
                                        <div>
                                            <CardTitle className="text-lg">{contact.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground">{contact.type}</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            {contact.location}
                                        </p>
                                        <p className="text-sm">{contact.description}</p>
                                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">{contact.contactLabel}</span>
                                                <a href={`tel:${contact.contact.replace(/\s/g, '')}`} className="text-sm font-medium text-primary hover:underline">
                                                    {contact.contact}
                                                </a>
                                            </div>
                                            {contact.secondaryContact && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-muted-foreground">{contact.secondaryLabel}</span>
                                                    <a href={`tel:${contact.secondaryContact.replace(/\s/g, '')}`} className="text-sm font-medium text-primary hover:underline">
                                                        {contact.secondaryContact}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Major Medical Centers */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Stethoscope className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Major Medical Centers (Lilongwe)</h2>
                                <p className="text-sm text-muted-foreground">Approx. 1 hour from Dzaleka — for critical care or private assistance</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                            {lilongweHospitals.map((hospital, index) => (
                                <Card key={index} className="border-border">
                                    <CardContent className="p-6">
                                        <h3 className="font-bold text-lg mb-3">{hospital.name}</h3>
                                        <p className="text-sm text-muted-foreground mb-4">{hospital.description}</p>
                                        <div className="bg-muted/50 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">{hospital.contactLabel}</span>
                                                <a href={`tel:${hospital.contact.replace(/\s/g, '')}`} className="text-sm font-medium text-primary hover:underline">
                                                    {hospital.contact}
                                                </a>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Travel Insurance Notice */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <CreditCard className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">Travel Insurance Recommendation</h3>
                                <p className="text-blue-700 dark:text-blue-300 text-sm">
                                    Having international travel insurance that includes emergency medical evacuation is highly recommended for travel in Malawi,
                                    as local facilities may not meet all international standards. Private air ambulance services are available but costly.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Private Medical Evacuation Services */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Plane className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Private Medical Evacuation Services</h2>
                                <p className="text-sm text-muted-foreground">Contact directly for quotes — costs vary based on medical need and distance</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                            {evacuationServices.map((service, index) => (
                                <Card key={index} className="border-border">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">{service.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-muted-foreground">{service.description}</p>
                                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                            {service.contacts.map((contact, idx) => (
                                                <div key={idx} className="flex items-center justify-between">
                                                    <span className="text-xs text-muted-foreground">{contact.label}</span>
                                                    <a href={`tel:${contact.number.replace(/[\s\/]/g, '')}`} className="text-sm font-medium text-primary hover:underline">
                                                        {contact.number}
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Emergency Card Template */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Emergency Card Template</h2>
                                <p className="text-sm text-muted-foreground">Print this wallet-sized card to carry with you</p>
                            </div>
                        </div>

                        <div className="max-w-2xl mx-auto">
                            <Card id="emergency-card" className="border-2 border-red-200 dark:border-red-900 print:border-black">
                                <CardHeader className="bg-red-600 text-white print:bg-white print:text-black pb-3">
                                    <CardTitle className="text-center text-lg uppercase tracking-wider">
                                        🚨 Malawi Emergency Contacts
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="font-medium">National Police</span>
                                            <span className="font-bold">997 / 990</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="font-medium">Ambulance</span>
                                            <span className="font-bold">998</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="font-medium">Road Accident</span>
                                            <span className="font-bold">118</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="font-medium">MRI Malawi</span>
                                            <span className="font-bold">992</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm border-t pt-4">
                                        <div className="flex justify-between">
                                            <span>Dzaleka Health Centre</span>
                                            <span className="font-medium text-primary">+265 999 124 688</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Daeyang Luke Hospital (LLW)</span>
                                            <span className="font-medium text-primary">+265 997 43 48 73</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>UNHCR Malawi</span>
                                            <span className="font-medium text-primary">+265 1 772 155</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Your Embassy</span>
                                            <Input
                                                placeholder="Enter number"
                                                className="w-40 h-7 text-sm print:border-b print:border-black print:bg-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="border-t pt-4 space-y-3">
                                        <h4 className="font-bold text-sm uppercase tracking-wide">Personal Information</h4>
                                        <div className="grid gap-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground w-32 shrink-0">Name:</span>
                                                <Input
                                                    placeholder="Your full name"
                                                    className="flex-1 h-8 print:border-b print:border-black print:bg-transparent"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground w-32 shrink-0">Blood Type:</span>
                                                <Input
                                                    placeholder="e.g., A+, O-, B+"
                                                    className="flex-1 h-8 print:border-b print:border-black print:bg-transparent"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground w-32 shrink-0">Allergies:</span>
                                                <Input
                                                    placeholder="e.g., Penicillin, Peanuts"
                                                    className="flex-1 h-8 print:border-b print:border-black print:bg-transparent"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground w-32 shrink-0">Emergency Contact:</span>
                                                <Input
                                                    placeholder="Name & phone number"
                                                    className="flex-1 h-8 print:border-b print:border-black print:bg-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-center mt-6 print:hidden">
                                <Button
                                    onClick={() => {
                                        // Get input values
                                        const cardElement = document.getElementById('emergency-card');
                                        if (!cardElement) return;

                                        const inputs = cardElement.querySelectorAll('input');
                                        const embassyNumber = (inputs[0] as HTMLInputElement)?.value || '________________';
                                        const name = (inputs[1] as HTMLInputElement)?.value || '________________';
                                        const bloodType = (inputs[2] as HTMLInputElement)?.value || '________________';
                                        const allergies = (inputs[3] as HTMLInputElement)?.value || '________________';
                                        const emergencyContact = (inputs[4] as HTMLInputElement)?.value || '________________';

                                        const printWindow = window.open('', '', 'width=500,height=700');
                                        if (printWindow) {
                                            printWindow.document.write(`
                                                <!DOCTYPE html>
                                                <html>
                                                    <head>
                                                        <title>Malawi Emergency Card</title>
                                                        <style>
                                                            * { margin: 0; padding: 0; box-sizing: border-box; }
                                                            body { font-family: Arial, sans-serif; padding: 20px; background: white; }
                                                            .card { border: 2px solid #dc2626; border-radius: 12px; max-width: 350px; margin: 0 auto; overflow: hidden; }
                                                            .header { background: #dc2626; color: white; text-align: center; padding: 12px 16px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
                                                            .content { padding: 16px; font-size: 12px; }
                                                            .emergency-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 12px; }
                                                            .emergency-item { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #eee; }
                                                            .emergency-label { font-weight: 500; }
                                                            .emergency-value { font-weight: bold; color: #dc2626; }
                                                            .section { border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px; }
                                                            .section-title { font-weight: bold; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; margin-bottom: 8px; color: #333; }
                                                            .contact-row { display: flex; justify-content: space-between; padding: 3px 0; }
                                                            .contact-name { color: #333; }
                                                            .contact-number { font-weight: 600; color: #2563eb; }
                                                            .personal-row { display: flex; align-items: center; padding: 4px 0; }
                                                            .personal-label { color: #666; width: 100px; font-size: 11px; }
                                                            .personal-value { flex: 1; font-weight: 500; border-bottom: 1px solid #ccc; min-height: 16px; padding-left: 4px; }
                                                            @media print { body { padding: 0; } .card { border-width: 1px; } }
                                                        </style>
                                                    </head>
                                                    <body>
                                                        <div class="card">
                                                            <div class="header">🚨 Malawi Emergency Contacts</div>
                                                            <div class="content">
                                                                <div class="emergency-grid">
                                                                    <div class="emergency-item">
                                                                        <span class="emergency-label">Police</span>
                                                                        <span class="emergency-value">997 / 990</span>
                                                                    </div>
                                                                    <div class="emergency-item">
                                                                        <span class="emergency-label">Ambulance</span>
                                                                        <span class="emergency-value">998</span>
                                                                    </div>
                                                                    <div class="emergency-item">
                                                                        <span class="emergency-label">Road Accident</span>
                                                                        <span class="emergency-value">118</span>
                                                                    </div>
                                                                    <div class="emergency-item">
                                                                        <span class="emergency-label">MRI Malawi</span>
                                                                        <span class="emergency-value">992</span>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div class="section">
                                                                    <div class="contact-row">
                                                                        <span class="contact-name">Dzaleka Health Centre</span>
                                                                        <span class="contact-number">+265 999 124 688</span>
                                                                    </div>
                                                                    <div class="contact-row">
                                                                        <span class="contact-name">Daeyang Luke Hospital</span>
                                                                        <span class="contact-number">+265 997 43 48 73</span>
                                                                    </div>
                                                                    <div class="contact-row">
                                                                        <span class="contact-name">UNHCR Malawi</span>
                                                                        <span class="contact-number">+265 1 772 155</span>
                                                                    </div>
                                                                    <div class="contact-row">
                                                                        <span class="contact-name">Your Embassy</span>
                                                                        <span class="contact-number">${embassyNumber}</span>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div class="section">
                                                                    <div class="section-title">Personal Information</div>
                                                                    <div class="personal-row">
                                                                        <span class="personal-label">Name:</span>
                                                                        <span class="personal-value">${name}</span>
                                                                    </div>
                                                                    <div class="personal-row">
                                                                        <span class="personal-label">Blood Type:</span>
                                                                        <span class="personal-value">${bloodType}</span>
                                                                    </div>
                                                                    <div class="personal-row">
                                                                        <span class="personal-label">Allergies:</span>
                                                                        <span class="personal-value">${allergies}</span>
                                                                    </div>
                                                                    <div class="personal-row">
                                                                        <span class="personal-label">Emergency:</span>
                                                                        <span class="personal-value">${emergencyContact}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </body>
                                                </html>
                                            `);
                                            printWindow.document.close();
                                            setTimeout(() => printWindow.print(), 250);
                                        }
                                    }}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <Printer className="h-4 w-4" />
                                    Print Emergency Card
                                </Button>
                            </div>

                            {/* Disclaimer */}
                            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center print:hidden">
                                <p className="text-xs text-muted-foreground mb-2">
                                    <strong>Disclaimer:</strong> Contact details are provided for reference only and may change without notice.
                                    Please verify all numbers before relying on them in an emergency.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Found incorrect information?{" "}
                                    <Link href="/contact" className="text-primary hover:underline font-medium">
                                        Contact us
                                    </Link>{" "}
                                    to report updates.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Safety Tips */}
                    <section className="bg-muted/30 rounded-3xl p-8 md:p-12">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Safety Tips</h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <div className="p-4 bg-background rounded-xl border">
                                <Phone className="h-6 w-6 text-primary mb-3" />
                                <h4 className="font-semibold mb-2">Phone Connectivity</h4>
                                <p className="text-sm text-muted-foreground">
                                    Ensure your phone is topped up with local credit (Airtel or TNM), as toll-free numbers can fail if the network is congested.
                                </p>
                            </div>
                            <div className="p-4 bg-background rounded-xl border">
                                <Car className="h-6 w-6 text-primary mb-3" />
                                <h4 className="font-semibold mb-2">Road Safety</h4>
                                <p className="text-sm text-muted-foreground">
                                    If traveling the M1 between Lilongwe and the camp, dial <strong>118</strong> specifically for road traffic accidents.
                                </p>
                            </div>
                            <div className="p-4 bg-background rounded-xl border">
                                <Stethoscope className="h-6 w-6 text-primary mb-3" />
                                <h4 className="font-semibold mb-2">Private Evacuation</h4>
                                <p className="text-sm text-muted-foreground">
                                    If you have international insurance, keep the number for MRI Malawi (Medical Rescue International) on hand for private transport.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Security Protocols */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 rounded-lg bg-red-500/10 text-red-600">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Malawi Security Protocols (2026)</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {securityProtocols.map((protocol, index) => (
                                <div key={index} className="flex items-start gap-4 p-6 bg-card border rounded-xl">
                                    <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                        <protocol.icon className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-2">{protocol.title}</h3>
                                        <p className="text-sm text-muted-foreground">{protocol.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Dzaleka-Specific Guidelines */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Dzaleka-Specific Visitor Guidelines</h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {visitorGuidelines.map((guideline, index) => (
                                <Card key={index} className="border-border">
                                    <CardContent className="p-6">
                                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                            <guideline.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <h3 className="font-bold mb-2">{guideline.title}</h3>
                                        <p className="text-sm text-muted-foreground">{guideline.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-12 text-center">
                        <Shield className="h-12 w-12 mx-auto mb-6 opacity-80" />
                        <h2 className="text-3xl font-bold mb-4">Plan a Safe Visit</h2>
                        <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto mb-6">
                            For additional guidance on visiting Dzaleka safely, check our Visitor Essentials page or book a tour with a verified local guide.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Button asChild variant="secondary" size="lg">
                                <Link href="/plan-your-trip/visitor-essentials">
                                    Visitor Essentials
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                                <Link href="/login">
                                    Book a Guided Tour
                                </Link>
                            </Button>
                        </div>
                    </section>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
