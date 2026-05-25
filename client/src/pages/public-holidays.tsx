import { useState } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Info, Menu, X, MapPin } from "lucide-react";
import { PublicHeader } from "@/components/public-header";

export default function PublicHolidays() {
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
            <PublicHeader activePath="/plan-your-trip/public-holidays" />

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
