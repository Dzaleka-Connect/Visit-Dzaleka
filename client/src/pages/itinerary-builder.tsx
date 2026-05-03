import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useLocation, useRoute } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    Clock,
    User,
    Plus,
    Trash2,
    Send,
    FileText,
    ArrowLeft,
    DollarSign,
    Eye,
    Save,
    Copy,
    RotateCcw,
    ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { SEO } from "@/components/seo";
import type { Booking, Guide, Itinerary, PointOfInterest } from "@shared/schema";
import { formatDate } from "@/lib/constants";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin } from "lucide-react";

const formSchema = z.object({
    recipientName: z.string().min(1, "Recipient name is required"),
    recipientEmail: z.string().email("Invalid email address"),
    date: z.string().min(1, "Date is required"),
    duration: z.string().min(1, "Duration is required"),
    totalCost: z.string().optional(),
    paymentStatus: z.string().optional(),
    notes: z.string().optional(),
    guideName: z.string().optional(),
    guideContact: z.string().optional(),
    pois: z.array(z.string()).optional(),
    organizationStops: z.string().optional(),
    routePreset: z.string().optional(),
    bookingReference: z.string().optional(),
    bookingId: z.string().optional(),
    items: z.array(z.object({
        time: z.string().min(1, "Time is required"),
        activity: z.string().min(1, "Activity is required")
    })).min(1, "At least one timeline item is required")
});

type FormValues = z.infer<typeof formSchema>;

type StaffItineraryTemplate = {
    id: string;
    name: string;
    createdAt: string;
    values: Partial<FormValues>;
};

const servicesDirectoryUrl = "https://services.dzaleka.com/services/";
const draftStorageKey = "visit-dzaleka-itinerary-builder-draft";
const templateStorageKey = "visit-dzaleka-itinerary-builder-templates";

const defaultNotes = [
    "This itinerary is a planning guide. The route may change based on safety guidance, weather, market days, and community availability.",
    "Your payment status is shown in your booking record. Staff will confirm any outstanding balance before or on arrival.",
    "Please wear comfortable shoes, bring water, dress modestly, and ask permission before taking photos of individuals.",
].join("\n\n");

const routePresets = [
    {
        id: "standard",
        label: "Standard walking tour",
        description: "Core route for first-time visitors.",
        duration: "2-3 hours",
        items: [
            { time: "09:00", activity: "Meet at the UNHCR/Plan International Compound main gate" },
            { time: "09:10", activity: "Orientation, safety briefing, and visitor expectations" },
            { time: "09:30", activity: "Walk through Kawale and selected nearby routes" },
            { time: "10:15", activity: "Ascend Dzaleka Hill for settlement context and views" },
            { time: "10:45", activity: "Visit Katudza or a community stop if arranged" },
            { time: "11:30", activity: "Return, questions, and closing remarks" },
        ],
    },
    {
        id: "market",
        label: "Market day",
        description: "Best when Mardi Marché is active.",
        duration: "2-3 hours",
        items: [
            { time: "09:00", activity: "Meet at the UNHCR/Plan International Compound main gate" },
            { time: "09:10", activity: "Orientation and photography guidance" },
            { time: "09:30", activity: "Walk to Mardi Marché / Tuesday Market when active" },
            { time: "10:20", activity: "Meet selected traders or artisans if available" },
            { time: "11:00", activity: "Kawale route and local enterprise context" },
            { time: "11:30", activity: "Return and closing remarks" },
        ],
    },
    {
        id: "education_orgs",
        label: "Education / organizations",
        description: "For visitors focused on services, learning, or partnerships.",
        duration: "2-3 hours",
        items: [
            { time: "09:00", activity: "Meet at the UNHCR/Plan International Compound main gate" },
            { time: "09:10", activity: "Orientation and organization visit expectations" },
            { time: "09:35", activity: "Visit pre-arranged education, training, or service organization" },
            { time: "10:35", activity: "Walk selected route with guide commentary" },
            { time: "11:10", activity: "Debrief on follow-up contacts and practical next steps" },
        ],
    },
    {
        id: "arts_culture",
        label: "Arts / culture",
        description: "For visitors interested in creative work and cultural events.",
        duration: "2-3 hours",
        items: [
            { time: "09:00", activity: "Meet at the UNHCR/Plan International Compound main gate" },
            { time: "09:10", activity: "Orientation and respectful visitor guidance" },
            { time: "09:35", activity: "Visit pre-arranged arts, music, or cultural project" },
            { time: "10:30", activity: "Walk through selected community routes and market areas" },
            { time: "11:15", activity: "Questions, recommendations, and closing remarks" },
        ],
    },
    {
        id: "group_visit",
        label: "Group visit",
        description: "For schools, organizations, or delegations.",
        duration: "3 hours",
        items: [
            { time: "09:00", activity: "Group arrival at the UNHCR/Plan International Compound main gate" },
            { time: "09:15", activity: "Welcome briefing, route split, and safety expectations" },
            { time: "09:45", activity: "Guided walk through selected zones with assigned guide groups" },
            { time: "10:45", activity: "Pre-arranged community or organization stop" },
            { time: "11:30", activity: "Group debrief, questions, and closing remarks" },
        ],
    },
];

function paymentStatusLabel(status?: string | null) {
    if (!status) return "";
    return status
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function organizationLines(value?: string) {
    return (value || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}

function loadStaffTemplates(): StaffItineraryTemplate[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(window.localStorage.getItem(templateStorageKey) || "[]");
    } catch {
        return [];
    }
}

export default function ItineraryBuilder() {
    const { toast } = useToast();
    const [, params] = useRoute("/itinerary-builder/:bookingId?");
    const bookingId = params?.bookingId;
    const [_, setLocation] = useLocation();
    const [templates, setTemplates] = useState<StaffItineraryTemplate[]>(() => loadStaffTemplates());
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    const [templateName, setTemplateName] = useState("");

    // Fetch booking details if available
    const { data: booking } = useQuery<Booking>({
        queryKey: [`/api/bookings/${bookingId}`],
        enabled: !!bookingId
    });

    const { data: guides } = useQuery<Guide[]>({
        queryKey: ["/api/guides"]
    });

    const { data: pois } = useQuery<PointOfInterest[]>({
        queryKey: ["/api/public/points-of-interest"]
    });

    const { data: allBookings } = useQuery<Booking[]>({
        queryKey: ["/api/bookings"]
    });

    const { data: existingItinerary } = useQuery<Itinerary>({
        queryKey: [`/api/bookings/${bookingId}/itinerary`],
        enabled: !!bookingId,
        retry: false,
    });

    const existingVersion = useMemo(() => {
        const content = existingItinerary?.content as any;
        return Number(content?.version || 0);
    }, [existingItinerary]);

    const handleBookingSelect = (bookingId: string) => {
        const selected = allBookings?.find(b => b.id === bookingId);
        if (selected) {
            form.setValue("recipientName", selected.visitorName);
            form.setValue("recipientEmail", selected.visitorEmail);
            form.setValue("date", new Date(selected.visitDate).toISOString().split('T')[0]);
            form.setValue("totalCost", `MWK ${selected.totalAmount?.toLocaleString() || '0'}`);
            form.setValue("paymentStatus", paymentStatusLabel(selected.paymentStatus));
            form.setValue("bookingReference", selected.bookingReference || ""); // Add reference
            form.setValue("bookingId", selected.id);
            if (selected.assignedGuideId && guides) {
                const guide = guides.find(g => g.id === selected.assignedGuideId);
                if (guide) {
                    form.setValue("guideName", `${guide.firstName} ${guide.lastName}`);
                    form.setValue("guideContact", guide.phone || "");
                }
            }
            if (selected.selectedInterests && selected.selectedInterests.length > 0 && pois) {
                const interestNames = selected.selectedInterests
                    .map(id => pois.find(p => p.id === id)?.name)
                    .filter((n): n is string => !!n);
                form.setValue("pois", interestNames);
            }
        }
    };

    const handleGuideSelect = (guideId: string) => {
        const guide = guides?.find(g => g.id === guideId);
        if (guide) {
            form.setValue("guideName", `${guide.firstName} ${guide.lastName}`);
            form.setValue("guideContact", guide.phone || "");
        }
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            recipientName: "",
            recipientEmail: "",
            date: "",
            duration: "2-3 hours",
            totalCost: "",
            paymentStatus: "",
            notes: defaultNotes,
            guideName: "",
            guideContact: "",
            pois: [],
            organizationStops: "",
            routePreset: "standard",
            items: [
                { time: "09:00", activity: "Meet at the UNHCR/Plan International Compound main gate" },
                { time: "09:10", activity: "Orientation, safety briefing, and visitor expectations" },
                { time: "09:30", activity: "Walk through Kawale and selected nearby routes" },
                { time: "10:15", activity: "Ascend Dzaleka Hill for settlement context and views" },
                { time: "10:45", activity: "Visit Katudza or a community stop if arranged" },
                { time: "11:30", activity: "Return, questions, and closing remarks" }
            ]
        }
    });

    // Populate form from booking
    useEffect(() => {
        if (booking) {
            form.setValue("recipientName", booking.visitorName);
            form.setValue("recipientEmail", booking.visitorEmail);
            form.setValue("date", new Date(booking.visitDate).toISOString().split('T')[0]);
            form.setValue("totalCost", `MWK ${booking.totalAmount?.toLocaleString() || '0'}`);
            form.setValue("paymentStatus", paymentStatusLabel(booking.paymentStatus));
            form.setValue("bookingReference", booking.bookingReference || "");
            form.setValue("bookingId", booking.id);

            if (booking.assignedGuideId && guides) {
                const guide = guides.find(g => g.id === booking.assignedGuideId);
                if (guide) {
                    form.setValue("guideName", `${guide.firstName} ${guide.lastName}`);
                    form.setValue("guideContact", guide.phone || "");
                }
            }
        }
    }, [booking, guides, form]);

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "items"
    });

    const previewValues = form.watch();
    const previewOrganizations = organizationLines(previewValues.organizationStops);

    const persistTemplates = (nextTemplates: StaffItineraryTemplate[]) => {
        setTemplates(nextTemplates);
        window.localStorage.setItem(templateStorageKey, JSON.stringify(nextTemplates));
    };

    const applyPreset = (presetId: string) => {
        const preset = routePresets.find((item) => item.id === presetId);
        if (!preset) return;
        form.setValue("routePreset", preset.id, { shouldDirty: true });
        form.setValue("duration", preset.duration, { shouldDirty: true });
        form.setValue("notes", defaultNotes, { shouldDirty: true });
        replace(preset.items);
        toast({
            title: "Route preset applied",
            description: `${preset.label} timeline loaded. Review times before sending.`,
        });
    };

    const saveDraft = () => {
        window.localStorage.setItem(draftStorageKey, JSON.stringify(form.getValues()));
        toast({ title: "Draft saved", description: "This itinerary draft is saved in this browser." });
    };

    const loadDraft = () => {
        const draft = window.localStorage.getItem(draftStorageKey);
        if (!draft) {
            toast({ title: "No draft found", description: "There is no saved draft in this browser.", variant: "destructive" });
            return;
        }
        form.reset(JSON.parse(draft));
        toast({ title: "Draft loaded", description: "Review the itinerary before sending." });
    };

    const saveTemplate = () => {
        const name = templateName.trim();
        if (!name) {
            toast({ title: "Template name required", description: "Add a short name before saving the template.", variant: "destructive" });
            return;
        }

        const values = form.getValues();
        const templateValues: Partial<FormValues> = {
            duration: values.duration,
            notes: values.notes,
            guideName: values.guideName,
            guideContact: values.guideContact,
            pois: values.pois,
            organizationStops: values.organizationStops,
            routePreset: values.routePreset,
            items: values.items,
        };
        const nextTemplates = [
            ...templates.filter((template) => template.name.toLowerCase() !== name.toLowerCase()),
            {
                id: crypto.randomUUID(),
                name,
                createdAt: new Date().toISOString(),
                values: templateValues,
            },
        ];
        persistTemplates(nextTemplates);
        setTemplateName("");
        toast({ title: "Template saved", description: "This staff template is saved in this browser." });
    };

    const loadTemplate = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const template = templates.find((item) => item.id === templateId);
        if (!template) return;
        const current = form.getValues();
        form.reset({
            ...current,
            ...template.values,
            recipientName: current.recipientName,
            recipientEmail: current.recipientEmail,
            date: current.date,
            totalCost: current.totalCost,
            paymentStatus: current.paymentStatus,
            bookingReference: current.bookingReference,
            bookingId: current.bookingId,
        });
        toast({ title: "Template loaded", description: "Visitor and booking details were preserved." });
    };

    const duplicateCurrentPlan = () => {
        const values = form.getValues();
        form.reset({
            ...values,
            recipientName: "",
            recipientEmail: "",
            date: "",
            totalCost: "",
            paymentStatus: "",
            bookingReference: "",
            bookingId: "",
        });
        toast({ title: "Plan duplicated", description: "The itinerary content is ready for a different visitor." });
    };

    const mutation = useMutation({
        mutationFn: async (values: FormValues) => {
            await apiRequest("POST", "/api/itinerary/send", values);
        },
        onSuccess: () => {
            toast({
                title: "Itinerary Sent",
                description: "The itinerary has been successfully emailed to the visitor.",
            });
            setTimeout(() => setLocation("/bookings"), 2000);
        },
        onError: (error) => {
            toast({
                title: "Failed to send",
                description: "There was an error sending the itinerary.",
                variant: "destructive"
            });
        }
    });

    function onSubmit(values: FormValues) {
        mutation.mutate(values);
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6 pb-10">
            <SEO title="Itinerary Builder" description="Create and send custom itineraries." />

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Itinerary Builder</h1>
                        <p className="text-muted-foreground">Create, preview, save, and send a visitor itinerary.</p>
                        {bookingId && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                {existingVersion > 0
                                    ? `Latest saved itinerary: version ${existingVersion}. Sending again creates version ${existingVersion + 1}.`
                                    : "No saved itinerary version found for this booking yet."}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={saveDraft}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Draft
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={loadDraft}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Load Draft
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={duplicateCurrentPlan}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Key Details */}
                            <Card>
                                <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            Recipient Details
                                        </CardTitle>
                                        <CardDescription>Import a booking or enter visitor details manually.</CardDescription>
                                    </div>
                                    <div className="w-full sm:w-[280px]">
                                        <Select onValueChange={handleBookingSelect}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Import from booking" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {allBookings?.map((booking) => (
                                                    <SelectItem key={booking.id} value={booking.id}>
                                                        {booking.visitorName} ({formatDate(booking.visitDate)})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="recipientName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} autoComplete="name" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="recipientEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="email" autoComplete="email" spellCheck={false} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="duration"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Duration</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="e.g. 2-3 hours" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="paymentStatus"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Payment Status</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="e.g. Paid, Pending verification" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="bookingReference"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Booking Reference</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Optional reference" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Route presets and templates */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Route Presets & Templates
                                    </CardTitle>
                                    <CardDescription>Start from a Visit Dzaleka route pattern, then adjust it for the actual visitor.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <FormField
                                        control={form.control}
                                        name="routePreset"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Route preset</FormLabel>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        applyPreset(value);
                                                    }}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Choose a route preset" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {routePresets.map((preset) => (
                                                            <SelectItem key={preset.id} value={preset.id}>
                                                                {preset.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-sm text-muted-foreground">
                                                    {routePresets.find((preset) => preset.id === field.value)?.description || "Load a starting timeline."}
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                                        <Input
                                            value={templateName}
                                            onChange={(event) => setTemplateName(event.target.value)}
                                            placeholder="Template name…"
                                            aria-label="Template name"
                                        />
                                        <Button type="button" variant="outline" onClick={saveTemplate}>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save as Template
                                        </Button>
                                    </div>

                                    <Select value={selectedTemplateId} onValueChange={loadTemplate}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={templates.length ? "Load saved template" : "No saved staff templates yet"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates.map((template) => (
                                                <SelectItem key={template.id} value={template.id}>
                                                    {template.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>

                            {/* Points of Interest */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        Points of Interest / Organizations
                                    </CardTitle>
                                    <CardDescription>
                                        Select known points of interest, then add any wider Dzaleka organizations or service providers that were arranged separately.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <FormField
                                        control={form.control}
                                        name="pois"
                                        render={() => (
                                            <FormItem>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {pois?.map((item) => (
                                                        <FormField
                                                            key={item.id}
                                                            control={form.control}
                                                            name="pois"
                                                            render={({ field }) => {
                                                                return (
                                                                    <FormItem
                                                                        key={item.id}
                                                                        className="flex flex-row items-center space-x-3 space-y-0"
                                                                    >
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                id={`poi-${item.id}`}
                                                                                checked={field.value?.includes(item.name)}
                                                                                onCheckedChange={(checked) => {
                                                                                    return checked
                                                                                        ? field.onChange([...(field.value || []), item.name])
                                                                                        : field.onChange(
                                                                                            field.value?.filter(
                                                                                                (value) => value !== item.name
                                                                                            )
                                                                                        )
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <FormLabel htmlFor={`poi-${item.id}`} className="cursor-pointer text-sm font-normal">
                                                                            {item.name}
                                                                        </FormLabel>
                                                                    </FormItem>
                                                                )
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="organizationStops"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Additional organization or community stops</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        rows={4}
                                                        placeholder="One per line, e.g. Dzaleka Digital Heritage, Adai Circle, health or education partner…"
                                                    />
                                                </FormControl>
                                                <p className="text-sm text-muted-foreground">
                                                    Use this for organizations from the wider Dzaleka services directory that are not listed as points of interest.
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button asChild type="button" variant="outline" size="sm">
                                        <a href={servicesDirectoryUrl} target="_blank" rel="noopener noreferrer">
                                            Browse Dzaleka Services
                                            <ExternalLink className="ml-2 h-4 w-4" />
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Timeline */}
                            <Card>
                                <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="h-5 w-5" />
                                            Timeline
                                        </CardTitle>
                                        <CardDescription>Times are planning estimates. Review them before sending.</CardDescription>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={() => append({ time: "", activity: "" })}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Item
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[112px_minmax(0,1fr)_40px] sm:items-start">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.time`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="sr-only">Time</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="Time" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.activity`}
                                                render={({ field }) => (
                                                    <FormItem className="min-w-0">
                                                        <FormLabel className="sr-only">Activity</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="Activity description" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="justify-self-end text-destructive hover:text-destructive/90"
                                                onClick={() => remove(index)}
                                                aria-label={`Remove timeline item ${index + 1}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <FormMessage>{form.formState.errors.items?.root?.message}</FormMessage>
                                </CardContent>
                            </Card>

                            {/* Cost & Notes */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        Cost & Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="totalCost"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Total Cost (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="MWK 80,000" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="space-y-2">
                                        <Label>Select Guide (Auto-fill)</Label>
                                        <Select onValueChange={handleGuideSelect}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a guide..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {guides?.map((guide) => (
                                                    <SelectItem key={guide.id} value={guide.id}>
                                                        {guide.firstName} {guide.lastName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="guideName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Guide Name (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Guide Name" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="guideContact"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Guide Contact (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Phone Number" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Notes</FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} rows={4} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <div className="flex justify-end gap-4">
                                <Button type="submit" disabled={mutation.isPending} size="lg">
                                    {mutation.isPending ? "Sending…" : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Send Itinerary
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>

                {/* Preview/Help Column */}
                <div className="space-y-6">
                    <Card className="lg:sticky lg:top-20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5" />
                                Live Preview
                            </CardTitle>
                            <CardDescription>This is the staff preview before the email is sent.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 text-sm">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Visitor</p>
                                <p className="mt-1 font-semibold">{previewValues.recipientName || "Visitor name"}</p>
                                <p className="break-words text-muted-foreground">{previewValues.recipientEmail || "visitor@example.com"}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground">Date</p>
                                    <p className="font-medium">{previewValues.date || "Not set"}</p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground">Duration</p>
                                    <p className="font-medium">{previewValues.duration || "Not set"}</p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground">Cost</p>
                                    <p className="font-medium">{previewValues.totalCost || "Not set"}</p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground">Payment</p>
                                    <p className="font-medium">{previewValues.paymentStatus || "Not set"}</p>
                                </div>
                            </div>

                            <div>
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Timeline</p>
                                <div className="space-y-2">
                                    {(previewValues.items || []).map((item, index) => (
                                        <div key={`${item.time}-${index}`} className="grid grid-cols-[64px_minmax(0,1fr)] gap-2">
                                            <span className="font-semibold text-primary">{item.time || "--:--"}</span>
                                            <span className="break-words text-muted-foreground">{item.activity || "Activity description"}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {previewValues.pois && previewValues.pois.length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Selected points</p>
                                    <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                                        {previewValues.pois.map((poi) => <li key={poi}>{poi}</li>)}
                                    </ul>
                                </div>
                            )}

                            {previewOrganizations.length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Additional organizations</p>
                                    <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                                        {previewOrganizations.map((organization) => <li key={organization}>{organization}</li>)}
                                    </ul>
                                </div>
                            )}

                            {previewValues.guideName && (
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Guide</p>
                                    <p className="mt-1 font-medium">{previewValues.guideName}</p>
                                    {previewValues.guideContact && <p className="text-muted-foreground">{previewValues.guideContact}</p>}
                                </div>
                            )}

                            {previewValues.notes && (
                                <div className="rounded-lg bg-muted p-3">
                                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
                                    <p className="whitespace-pre-wrap text-muted-foreground">{previewValues.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle>Staff Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <p>Create a clear timeline, then confirm any organization stops directly before including them.</p>
                            <p>Saved drafts and staff templates are browser-local in this version. Use route presets for shared operational consistency.</p>
                            <p>Resending a booking itinerary creates a new saved version in the booking history.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
