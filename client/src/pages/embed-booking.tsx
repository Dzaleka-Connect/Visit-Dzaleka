import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Loader2, CheckCircle } from "lucide-react";
import { SEO } from "@/components/seo";
import { GROUP_SIZES } from "@/lib/constants";
import { bookingToday, embedBookingFieldsSchema } from "@/lib/embed-booking";
import { TransportRequestFields } from "@/components/transport-request-fields";
import { buildTransportSpecialRequests, createTransportRequestFromSearch } from "@/lib/transport";

interface MeetingPoint {
    id: string;
    name: string;
    description?: string;
}

interface Zone {
    id: string;
    name: string;
    description?: string;
}

interface PointOfInterest {
    id: string;
    name: string;
    description?: string;
}

export default function EmbedBooking() {
    const formRef = useRef<HTMLFormElement>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [bookingReference, setBookingReference] = useState("");
    const { toast } = useToast();

    // Parse URL params for customization
    const params = new URLSearchParams(window.location.search);
    const theme = params.get("theme") || "light";
    const primaryColor = params.get("primaryColor") || "#f97316";
    const defaultGroup = GROUP_SIZES.find((group) => group.id === params.get("defaultTourType")) || GROUP_SIZES[0];
    const showBranding = params.get("showBranding") !== "false";
    const initialTransportRequest = createTransportRequestFromSearch(window.location.search);

    // Form state
    const [formData, setFormData] = useState({
        visitorName: "",
        visitorEmail: "",
        visitorPhone: "",
        visitorCountry: "",
        visitDate: "",
        visitTime: "10:00",
        groupSize: defaultGroup.id as string,
        numberOfPeople: String(defaultGroup.min),
        meetingPointId: "",
        paymentMethod: "cash",
        referralSource: "",
        specialRequests: "",
        selectedZones: [] as string[],
        selectedInterests: [] as string[],
        transportRequested: initialTransportRequest.transportRequested || false,
        transportRoute: initialTransportRequest.transportRoute,
        transportPartnerId: initialTransportRequest.transportPartnerId,
        transportPartnerName: initialTransportRequest.transportPartnerName || "",
        transportPickup: initialTransportRequest.transportPickup || "",
        transportNotes: initialTransportRequest.transportNotes || "",
    });
    const [submitted, setSubmitted] = useState(false);
    const initialFormData = useRef(formData);
    const confirmationRef = useRef<HTMLHeadingElement>(null);
    useUnsavedChanges(!submitted && JSON.stringify(formData) !== JSON.stringify(initialFormData.current));
    useEffect(() => {
        if (submitted) confirmationRef.current?.focus();
    }, [submitted]);

    // Fetch meeting points from API (public endpoint for embed forms)
    const { data: meetingPoints } = useQuery<MeetingPoint[]>({
        queryKey: ["/api/public/meeting-points"],
    });

    // Fetch zones and POIs (public endpoints)
    const { data: zones } = useQuery<Zone[]>({
        queryKey: ["/api/public/zones"],
    });

    const { data: pointsOfInterest } = useQuery<PointOfInterest[]>({
        queryKey: ["/api/public/points-of-interest"],
    });

    const bookingMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const {
                transportRequested,
                transportRoute,
                transportPartnerId,
                transportPartnerName,
                transportPickup,
                transportNotes,
                ...bookingFields
            } = data;
            const res = await apiRequest("POST", "/api/bookings", {
                ...bookingFields,
                ...embedBookingFieldsSchema.parse(data),
                transportRequested,
                transportRoute,
                transportPartnerId,
                transportPickup,
                transportNotes,
                specialRequests: buildTransportSpecialRequests(data.specialRequests, {
                    transportRequested,
                    transportRoute,
                    transportPartnerId,
                    transportPartnerName,
                    transportPickup,
                    transportNotes,
                }),
                tourType: "standard",
                source: "embed_widget",
            });
            return res.json();
        },
        onSuccess: (booking) => {
            setBookingReference(booking.bookingReference || "");
            setSubmitted(true);
        },
        onError: (error: Error) => {
            setErrors({ submit: error.message || "Please try again or contact us directly." });
            toast({
                title: "Booking Failed",
                description: "Please try again or contact us directly.",
                variant: "destructive",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (bookingMutation.isPending) return;
        const result = embedBookingFieldsSchema.safeParse(formData);
        if (!result.success) {
            const nextErrors: Record<string, string> = {};
            for (const issue of result.error.issues) {
                const field = String(issue.path[0]);
                nextErrors[field] ??= issue.message;
            }
            setErrors(nextErrors);
            formRef.current?.querySelector<HTMLElement>(`[name="${result.error.issues[0].path[0]}"]`)?.focus();
            return;
        }
        setErrors({});
        bookingMutation.mutate(formData);
    };

    const fieldError = (name: string) => errors[name] ? (
        <p id={`${name}-error`} className="text-sm text-destructive" aria-live="polite">{errors[name]}</p>
    ) : null;
    const fieldAccessibility = (name: string) => ({
        id: name,
        name,
        "aria-invalid": Boolean(errors[name]),
        "aria-describedby": errors[name] ? `${name}-error` : undefined,
    });

    const isDark = theme === "dark";
    const bgClass = isDark ? "bg-gray-900 text-white" : "bg-white";
    const inputClass = isDark ? "bg-gray-800 border-gray-700 text-white" : "";

    if (submitted) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 ${bgClass}`}>
                <SEO title="Booking submitted" description="Your booking request has been received." robots="noindex" />
                <Card className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                    <CardContent className="pt-6 text-center">
                        <CheckCircle className="h-16 w-16 mx-auto mb-4" style={{ color: primaryColor }} />
                        <h1 ref={confirmationRef} tabIndex={-1} className="text-2xl font-semibold mb-2">Booking submitted</h1>
                        {bookingReference && <p className="mb-3 break-words font-medium">Reference: {bookingReference}</p>}
                        <p className={isDark ? "text-gray-300" : "text-muted-foreground"}>
                            We'll confirm your visit shortly via email.
                        </p>
                        {formData.transportRequested && (
                            <p className={`mt-3 text-sm ${isDark ? "text-gray-300" : "text-muted-foreground"}`}>
                                Your transport quote request was included. A verified partner will confirm the price,
                                driver or vehicle details, pickup point, and payment terms before the ride is final.
                            </p>
                        )}
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
                    <form ref={formRef} noValidate onSubmit={handleSubmit} onKeyDown={(event) => {
                        if (event.target instanceof HTMLTextAreaElement && event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                            event.preventDefault();
                            event.currentTarget.requestSubmit();
                        }
                    }} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="visitorName" className={isDark ? "text-gray-200" : ""}>Full Name *</Label>
                                <Input
                                    required
                                    autoComplete="name"
                                    placeholder="Your name…"
                                    {...fieldAccessibility("visitorName")}
                                    value={formData.visitorName}
                                    onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                                    className={inputClass}
                                />
                                {fieldError("visitorName")}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="visitorEmail" className={isDark ? "text-gray-200" : ""}>Email *</Label>
                                <Input
                                    type="email"
                                    required
                                    autoComplete="email"
                                    spellCheck={false}
                                    placeholder="you@example.com…"
                                    {...fieldAccessibility("visitorEmail")}
                                    value={formData.visitorEmail}
                                    onChange={(e) => setFormData({ ...formData, visitorEmail: e.target.value })}
                                    className={inputClass}
                                />
                                {fieldError("visitorEmail")}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="visitorPhone" className={isDark ? "text-gray-200" : ""}>Phone</Label>
                                <Input
                                    type="tel"
                                    autoComplete="tel"
                                    placeholder="+265…"
                                    {...fieldAccessibility("visitorPhone")}
                                    value={formData.visitorPhone}
                                    onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                                    className={inputClass}
                                />
                                {fieldError("visitorPhone")}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="visitorCountry" className={isDark ? "text-gray-200" : ""}>Country / region</Label>
                                <Input
                                    autoComplete="country-name"
                                    placeholder="Country or region…"
                                    {...fieldAccessibility("visitorCountry")}
                                    value={formData.visitorCountry}
                                    onChange={(e) => setFormData({ ...formData, visitorCountry: e.target.value })}
                                    className={inputClass}
                                />
                                {fieldError("visitorCountry")}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="visitDate" className={isDark ? "text-gray-200" : ""}>Visit Date *</Label>
                                <Input
                                    type="date"
                                    min={bookingToday()}
                                    required
                                    {...fieldAccessibility("visitDate")}
                                    value={formData.visitDate}
                                    onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                                    className={inputClass}
                                />
                                {fieldError("visitDate")}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="visitTime" className={isDark ? "text-gray-200" : ""}>Preferred Start Time *</Label>
                            <Input
                                type="time"
                                required
                                {...fieldAccessibility("visitTime")}
                                value={formData.visitTime}
                                onChange={(e) => setFormData({ ...formData, visitTime: e.target.value })}
                                className={inputClass}
                            />
                            {fieldError("visitTime")}
                            <p className={`text-xs ${isDark ? "text-gray-400" : "text-muted-foreground"}`}>
                                💡 Standard start times: 10:00 AM and 2:00 PM. Standard tours are 2 hours.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="groupSize" className={isDark ? "text-gray-200" : ""}>Group Size</Label>
                                <Select
                                    value={formData.groupSize}
                                    onValueChange={(value) => {
                                        const group = GROUP_SIZES.find((item) => item.id === value)!;
                                        const count = Number(formData.numberOfPeople);
                                        const fits = count >= group.min && (group.max === null || count <= group.max);
                                        setFormData({ ...formData, groupSize: value, numberOfPeople: fits ? formData.numberOfPeople : String(group.min) });
                                    }}
                                >
                                    <SelectTrigger id="groupSize" name="groupSize" className={inputClass}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GROUP_SIZES.map((size) => (
                                            <SelectItem key={size.id} value={size.id}>
                                                {size.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="numberOfPeople" className={isDark ? "text-gray-200" : ""}>Number of People</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    {...fieldAccessibility("numberOfPeople")}
                                    value={formData.numberOfPeople}
                                    onChange={(e) => setFormData({ ...formData, numberOfPeople: e.target.value })}
                                    className={inputClass}
                                />
                                {fieldError("numberOfPeople")}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="meetingPointId" className={isDark ? "text-gray-200" : ""}>Meeting Point</Label>
                                <Select
                                    value={formData.meetingPointId}
                                    onValueChange={(value) => setFormData({ ...formData, meetingPointId: value })}
                                >
                                    <SelectTrigger id="meetingPointId" className={inputClass}>
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

                        {/* Areas of Interest Section */}
                        {((zones && zones.length > 0) || (pointsOfInterest && pointsOfInterest.length > 0)) && (
                            <div className="space-y-3">
                                <Label className={isDark ? "text-gray-200" : ""}>Areas of Interest (Select all that apply)</Label>
                                {zones && zones.length > 0 && (
                                    <div className="space-y-2">
                                        <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-muted-foreground"}`}>Camp Zones</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {zones.map((zone) => (
                                                <div key={zone.id} className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={`zone-${zone.id}`}
                                                        checked={formData.selectedZones?.includes(zone.id) || false}
                                                        onCheckedChange={(checked) => {
                                                            const currentZones = formData.selectedZones || [];
                                                            const newZones = checked
                                                                ? [...currentZones, zone.id]
                                                                : currentZones.filter((z: string) => z !== zone.id);
                                                            setFormData({ ...formData, selectedZones: newZones });
                                                        }}
                                                    />
                                                    <label htmlFor={`zone-${zone.id}`} className={`text-sm cursor-pointer ${isDark ? "text-gray-200" : ""}`}>
                                                        {zone.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {pointsOfInterest && pointsOfInterest.length > 0 && (
                                    <div className="space-y-2">
                                        <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-muted-foreground"}`}>
                                            Points of Interest ({pointsOfInterest.length} available)
                                        </p>
                                        <div className={`max-h-40 overflow-y-auto border rounded-md p-3 ${isDark ? "bg-gray-700/50 border-gray-600" : "bg-muted/20"}`}>
                                            <div className="grid grid-cols-2 gap-2">
                                                {pointsOfInterest.map((poi) => (
                                                    <div key={poi.id} className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={`poi-${poi.id}`}
                                                            checked={formData.selectedInterests?.includes(poi.id) || false}
                                                            onCheckedChange={(checked) => {
                                                                const currentInterests = formData.selectedInterests || [];
                                                                const newInterests = checked
                                                                    ? [...currentInterests, poi.id]
                                                                    : currentInterests.filter((p: string) => p !== poi.id);
                                                                setFormData({ ...formData, selectedInterests: newInterests });
                                                            }}
                                                        />
                                                        <label htmlFor={`poi-${poi.id}`} className={`text-sm cursor-pointer ${isDark ? "text-gray-200" : ""}`}>
                                                            {poi.name}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="specialRequests" className={isDark ? "text-gray-200" : ""}>Special Requests</Label>
                            <Textarea
                                placeholder="Any dietary requirements, accessibility needs, or questions…"
                                {...fieldAccessibility("specialRequests")}
                                value={formData.specialRequests}
                                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                                className={inputClass}
                            />
                            {fieldError("specialRequests")}
                        </div>

                        <TransportRequestFields
                            idPrefix="embed"
                            transportRequested={formData.transportRequested}
                            transportRoute={formData.transportRoute}
                            transportPartnerId={formData.transportPartnerId}
                            transportPartnerName={formData.transportPartnerName}
                            transportPickup={formData.transportPickup}
                            transportNotes={formData.transportNotes}
                            inputClassName={inputClass}
                            textClassName={isDark ? "text-gray-200" : undefined}
                            descriptionClassName={isDark ? "text-gray-400" : undefined}
                            onChange={(updates) => setFormData({ ...formData, ...updates })}
                        />

                        {fieldError("submit")}
                        <Button
                            type="submit"
                            className="w-full"
                            style={{ backgroundColor: primaryColor }}
                            disabled={bookingMutation.isPending}
                        >
                            {bookingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                            Book Now
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
