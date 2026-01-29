import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useLocation, useRoute } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    Calendar,
    Clock,
    User,
    Mail,
    Plus,
    Trash2,
    Send,
    FileText,
    ArrowLeft,
    DollarSign
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
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { SEO } from "@/components/seo";
import type { Booking, Guide, PointOfInterest } from "@shared/schema";
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
    notes: z.string().optional(),
    guideName: z.string().optional(),
    guideContact: z.string().optional(),
    pois: z.array(z.string()).optional(),
    bookingReference: z.string().optional(),
    bookingId: z.string().optional(),
    items: z.array(z.object({
        time: z.string().min(1, "Time is required"),
        activity: z.string().min(1, "Activity is required")
    })).min(1, "At least one timeline item is required")
});

type FormValues = z.infer<typeof formSchema>;

export default function ItineraryBuilder() {
    const { toast } = useToast();
    const [match, params] = useRoute("/itinerary-builder/:bookingId?");
    const bookingId = params?.bookingId;
    const [_, setLocation] = useLocation();

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

    const handleBookingSelect = (bookingId: string) => {
        const selected = allBookings?.find(b => b.id === bookingId);
        if (selected) {
            form.setValue("recipientName", selected.visitorName);
            form.setValue("recipientEmail", selected.visitorEmail);
            form.setValue("date", new Date(selected.visitDate).toISOString().split('T')[0]);
            form.setValue("totalCost", `MWK ${selected.totalAmount?.toLocaleString() || '0'}`);
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
            duration: "3.5 Hours",
            totalCost: "",
            notes: "Payment will be made in cash upon arrival.\n\nPlease note that our tours are conducted on foot.",
            guideName: "",
            guideContact: "",
            items: [
                { time: "14:00", activity: "Meet at the UNHCR Office" },
                { time: "14:15", activity: "Orientation and welcome briefing" },
                { time: "14:30", activity: "Visit Kawale 1 & 2" },
                { time: "17:30", activity: "Return and closing remarks" }
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

            if (booking.assignedGuideId && guides) {
                const guide = guides.find(g => g.id === booking.assignedGuideId);
                if (guide) {
                    form.setValue("guideName", `${guide.firstName} ${guide.lastName}`);
                    form.setValue("guideContact", guide.phone || "");
                }
            }
        }
    }, [booking, guides, form]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items"
    });

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
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <SEO title="Itinerary Builder" description="Create and send custom itineraries." />

            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Itinerary Builder</h1>
                    <p className="text-muted-foreground">Create a custom itinerary and email it to the visitor.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Key Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            Recipient Details
                                        </div>
                                        <div className="w-[200px]">
                                            <Select onValueChange={handleBookingSelect}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Import from Booking" />
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
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="recipientName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
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
                                                    <Input {...field} />
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
                                                    <Input {...field} placeholder="e.g. 3.5 Hours" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Points of Interest */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        Points of Interest / Organizations
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
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
                                                                        <FormLabel className="text-sm font-normal cursor-pointer">
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
                                </CardContent>
                            </Card>

                            {/* Timeline */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5" />
                                        Timeline
                                    </CardTitle>
                                    <Button type="button" variant="outline" size="sm" onClick={() => append({ time: "", activity: "" })}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Item
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex gap-4 items-start">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.time`}
                                                render={({ field }) => (
                                                    <FormItem className="w-24">
                                                        <FormControl>
                                                            <Input {...field} placeholder="Time" />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.activity`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <Input {...field} placeholder="Activity description" />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive/90"
                                                onClick={() => remove(index)}
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
                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle>Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <p>
                                Create a clear timeline for the visitor. You can adjust the duration and times as needed.
                            </p>
                            <p>
                                The email will be sent from "Visit Dzaleka Team" unless you are logged in as a specific user.
                            </p>
                            <p>
                                <strong>Note:</strong> Payment options are replaced by a single cost field as payment is usually pre-determined.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
