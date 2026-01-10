import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/seo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Save, Loader2 } from "lucide-react";

const DAYS_OF_WEEK = [
    { key: "sunday", label: "Sunday", short: "Sun" },
    { key: "monday", label: "Monday", short: "Mon" },
    { key: "tuesday", label: "Tuesday", short: "Tue" },
    { key: "wednesday", label: "Wednesday", short: "Wed" },
    { key: "thursday", label: "Thursday", short: "Thu" },
    { key: "friday", label: "Friday", short: "Fri" },
    { key: "saturday", label: "Saturday", short: "Sat" },
];

interface AvailabilityData {
    guideId: string;
    availability: Record<string, boolean>;
    workingHours: { start: string; end: string };
    isActive: boolean;
}

export default function MyAvailability() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery<AvailabilityData>({
        queryKey: ["/api/guides/me/availability"],
    });

    const [localAvailability, setLocalAvailability] = useState<Record<string, boolean>>({});
    const [localWorkingHours, setLocalWorkingHours] = useState({ start: "08:00", end: "17:00" });
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize local state when data loads
    useState(() => {
        if (data) {
            setLocalAvailability(data.availability || {});
            setLocalWorkingHours(data.workingHours || { start: "08:00", end: "17:00" });
        }
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest("PATCH", "/api/guides/me/availability", {
                availability: localAvailability,
                workingHours: localWorkingHours,
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/guides/me/availability"] });
            setHasChanges(false);
            toast({ title: "Availability Saved", description: "Your availability has been updated." });
        },
        onError: (error: Error) => {
            toast({ title: "Failed to Save", description: error.message, variant: "destructive" });
        },
    });

    const toggleDay = (day: string) => {
        const current = localAvailability[day] ?? data?.availability?.[day] ?? true;
        setLocalAvailability(prev => ({ ...prev, [day]: !current }));
        setHasChanges(true);
    };

    const updateWorkingHours = (field: "start" | "end", value: string) => {
        setLocalWorkingHours(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const availability = { ...data?.availability, ...localAvailability };
    const workingHours = localWorkingHours.start ? localWorkingHours : (data?.workingHours || { start: "08:00", end: "17:00" });

    return (
        <div className="space-y-6">
            <SEO
                title="My Availability"
                description="Manage your availability for tour assignments."
            />

            <div className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">My Availability</h1>
                <p className="text-muted-foreground">
                    Set your availability so coordinators know when you can lead tours.
                </p>
            </div>

            {/* Weekly Availability */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Weekly Availability
                    </CardTitle>
                    <CardDescription>
                        Toggle the days you are available to lead tours
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {/* Desktop View */}
                        <div className="hidden md:flex gap-2 justify-center">
                            {DAYS_OF_WEEK.map(day => {
                                const isAvailable = availability[day.key] ?? true;
                                return (
                                    <button
                                        key={day.key}
                                        onClick={() => toggleDay(day.key)}
                                        className={`flex flex-col items-center justify-center w-20 h-20 rounded-lg border-2 transition-all ${isAvailable
                                                ? "bg-primary/10 border-primary text-primary"
                                                : "bg-muted/50 border-muted-foreground/20 text-muted-foreground"
                                            }`}
                                    >
                                        <span className="text-sm font-medium">{day.short}</span>
                                        <span className="text-xs mt-1">{isAvailable ? "Available" : "Off"}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden space-y-3">
                            {DAYS_OF_WEEK.map(day => {
                                const isAvailable = availability[day.key] ?? true;
                                return (
                                    <div key={day.key} className="flex items-center justify-between p-3 rounded-lg border">
                                        <span className="font-medium">{day.label}</span>
                                        <Switch
                                            checked={isAvailable}
                                            onCheckedChange={() => toggleDay(day.key)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Working Hours */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Working Hours
                    </CardTitle>
                    <CardDescription>
                        Set your preferred working hours
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="start-time">Start Time</Label>
                            <Input
                                id="start-time"
                                type="time"
                                value={workingHours.start}
                                onChange={(e) => updateWorkingHours("start", e.target.value)}
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="end-time">End Time</Label>
                            <Input
                                id="end-time"
                                type="time"
                                value={workingHours.end}
                                onChange={(e) => updateWorkingHours("end", e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={!hasChanges || saveMutation.isPending}
                    size="lg"
                >
                    {saveMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Availability
                </Button>
            </div>

            {/* Status Card */}
            <Card className="bg-muted/30">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${data?.isActive ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-sm">
                            Your profile is currently <strong>{data?.isActive ? "active" : "inactive"}</strong>.
                            {!data?.isActive && " Contact an administrator to activate your profile."}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
