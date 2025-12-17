import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Users, CheckCircle } from "lucide-react";
import { SEO } from "@/components/seo";

interface MeetingPoint {
    id: string;
    name: string;
    description?: string;
}

export default function EmbedBooking() {
    const [, navigate] = useLocation();
    const { toast } = useToast();

    // Parse URL params for customization
    const params = new URLSearchParams(window.location.search);
    const theme = params.get("theme") || "light";
    const primaryColor = params.get("primaryColor") || "#f97316";
    const defaultTourType = params.get("defaultTourType") || "individual";
    const showBranding = params.get("showBranding") !== "false";

    // Form state
    const [formData, setFormData] = useState({
        visitorName: "",
        visitorEmail: "",
        visitorPhone: "",
        visitDate: "",
        visitTime: "10:00",
        groupSize: defaultTourType,
        numberOfPeople: 1,
        meetingPointId: "",
        paymentMethod: "cash",
        referralSource: "",
        specialRequests: "",
    });
    const [submitted, setSubmitted] = useState(false);

    // Fetch meeting points from API
    const { data: meetingPoints } = useQuery<MeetingPoint[]>({
        queryKey: ["/api/meeting-points"],
    });

    const bookingMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await apiRequest("POST", "/api/bookings", {
                ...data,
                tourType: "standard",
                source: "embed_widget",
            });
            return res.json();
        },
        onSuccess: () => {
            setSubmitted(true);
        },
        onError: () => {
            toast({
                title: "Booking Failed",
                description: "Please try again or contact us directly.",
                variant: "destructive",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.visitorName || !formData.visitorEmail || !formData.visitDate) {
            toast({
                title: "Missing Information",
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }
        bookingMutation.mutate(formData);
    };

    const isDark = theme === "dark";
    const bgClass = isDark ? "bg-gray-900 text-white" : "bg-white";
    const inputClass = isDark ? "bg-gray-800 border-gray-700 text-white" : "";

    if (submitted) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 ${bgClass}`}>
                <Card className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                    <CardContent className="pt-6 text-center">
                        <CheckCircle className="h-16 w-16 mx-auto mb-4" style={{ color: primaryColor }} />
                        <h2 className="text-2xl font-bold mb-2">Booking Submitted!</h2>
                        <p className={isDark ? "text-gray-300" : "text-muted-foreground"}>
                            We'll confirm your visit shortly via email.
                        </p>
                        {showBranding && (
                            <p className="text-xs mt-4 text-muted-foreground">
                                Powered by Visit Dzaleka
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-4 ${bgClass}`}>
            <SEO
                title="Book Your Visit"
                description="Book a guided tour of Dzaleka Refugee Camp. Experience the vibrant community."
            />
            <Card className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2" style={{ color: primaryColor }}>
                        <Calendar className="h-5 w-5" />
                        Book Your Visit
                    </CardTitle>
                    <CardDescription className={isDark ? "text-gray-400" : ""}>
                        Experience the vibrant community of Dzaleka
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className={isDark ? "text-gray-200" : ""}>Full Name *</Label>
                                <Input
                                    required
                                    placeholder="Your name"
                                    value={formData.visitorName}
                                    onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className={isDark ? "text-gray-200" : ""}>Email *</Label>
                                <Input
                                    type="email"
                                    required
                                    placeholder="your@email.com"
                                    value={formData.visitorEmail}
                                    onChange={(e) => setFormData({ ...formData, visitorEmail: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className={isDark ? "text-gray-200" : ""}>Phone</Label>
                                <Input
                                    placeholder="+265..."
                                    value={formData.visitorPhone}
                                    onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className={isDark ? "text-gray-200" : ""}>Visit Date *</Label>
                                <Input
                                    type="date"
                                    required
                                    value={formData.visitDate}
                                    onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className={isDark ? "text-gray-200" : ""}>Group Size</Label>
                                <Select
                                    value={formData.groupSize}
                                    onValueChange={(value) => setFormData({ ...formData, groupSize: value })}
                                >
                                    <SelectTrigger className={inputClass}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="individual">Individual (1-2)</SelectItem>
                                        <SelectItem value="small_group">Small Group (3-10)</SelectItem>
                                        <SelectItem value="large_group">Large Group (11+)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className={isDark ? "text-gray-200" : ""}>Number of People</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={formData.numberOfPeople}
                                    onChange={(e) => setFormData({ ...formData, numberOfPeople: parseInt(e.target.value) || 1 })}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className={isDark ? "text-gray-200" : ""}>Meeting Point</Label>
                                <Select
                                    value={formData.meetingPointId}
                                    onValueChange={(value) => setFormData({ ...formData, meetingPointId: value })}
                                >
                                    <SelectTrigger className={inputClass}>
                                        <SelectValue placeholder="Select meeting point" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {meetingPoints?.map((mp) => (
                                            <SelectItem key={mp.id} value={mp.id}>{mp.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className={isDark ? "text-gray-200" : ""}>Payment Method</Label>
                                <Select
                                    value={formData.paymentMethod}
                                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                                >
                                    <SelectTrigger className={inputClass}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="airtel_money">Airtel Money</SelectItem>
                                        <SelectItem value="tnm_mpamba">TNM Mpamba</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className={isDark ? "text-gray-200" : ""}>How Did You Hear About Us?</Label>
                            <Select
                                value={formData.referralSource}
                                onValueChange={(value) => setFormData({ ...formData, referralSource: value })}
                            >
                                <SelectTrigger className={inputClass}>
                                    <SelectValue placeholder="Please select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="social-media">Social Media</SelectItem>
                                    <SelectItem value="word-of-mouth">Word of Mouth</SelectItem>
                                    <SelectItem value="website">Website</SelectItem>
                                    <SelectItem value="other">Other (Please Specify)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className={isDark ? "text-gray-200" : ""}>Special Requests</Label>
                            <Textarea
                                placeholder="Any dietary requirements, accessibility needs, or questions..."
                                value={formData.specialRequests}
                                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                                className={inputClass}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            style={{ backgroundColor: primaryColor }}
                            disabled={bookingMutation.isPending}
                        >
                            {bookingMutation.isPending ? "Submitting..." : "Book Now"}
                        </Button>

                        {showBranding && (
                            <p className="text-xs text-center text-muted-foreground">
                                Powered by <a href="https://visit.dzaleka.com" target="_blank" rel="noopener" className="underline">Visit Dzaleka</a>
                            </p>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
