
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Plus, Trash2, RefreshCw, CalendarRange } from "lucide-react";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SEO } from "@/components/seo";

interface RecurringBooking {
    id: string;
    organizationName?: string;
    visitorName: string;
    visitorEmail: string;
    frequency: "weekly" | "monthly";
    dayOfWeek?: number;
    weekOfMonth?: number;
    startDate: string;
    endDate?: string;
    startTime: string;
    lastGeneratedDate?: string;
    isActive: boolean;
}

export default function RecurringBookingsPage() {
    const { toast } = useToast();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteSchedule, setDeleteSchedule] = useState<RecurringBooking | null>(null);

    const { data: schedules, isLoading } = useQuery<RecurringBooking[]>({
        queryKey: ["/api/recurring-bookings"],
    });

    const generateMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await apiRequest("POST", `/api/recurring-bookings/${id}/generate`, {});
            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Bookings Generated",
                description: `Successfully created ${data.generatedCount} new bookings.`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/recurring-bookings"] });
        },
        onError: () => {
            toast({ title: "Generation failed", variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/recurring-bookings/${id}`);
        },
        onSuccess: () => {
            toast({ title: "Schedule deleted" });
            queryClient.invalidateQueries({ queryKey: ["/api/recurring-bookings"] });
        },
    });

    // Helper to format frequency
    const getFrequencyText = (s: RecurringBooking) => {
        if (s.frequency === "weekly") {
            const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
            return `Weekly on ${s.dayOfWeek !== undefined ? days[s.dayOfWeek] : "Unknown"}`;
        }
        return "Monthly (Same Date)";
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SEO
                title="Recurring Schedules"
                description="Manage template-based recurring visits for organizations and schools."
            />
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Recurring Schedules</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage template-based recurring visits for organizations and schools.
                    </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Schedule
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Schedules</CardTitle>
                    <CardDescription>
                        Click "Generate" to create actual bookings for the next 30 days based on these templates.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {schedules && schedules.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Organization / Visitor</TableHead>
                                    <TableHead>Frequency</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Last Generated</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {schedules.map((schedule) => (
                                    <TableRow key={schedule.id}>
                                        <TableCell>
                                            <div className="font-medium">{schedule.organizationName || schedule.visitorName}</div>
                                            <div className="text-sm text-muted-foreground">{schedule.visitorEmail}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                                <span>{getFrequencyText(schedule)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{format(new Date(schedule.startDate), "MMM d, yyyy")}</TableCell>
                                        <TableCell>{schedule.startTime.slice(0, 5)}</TableCell>
                                        <TableCell>
                                            {schedule.lastGeneratedDate ? (
                                                <div className="text-xs">
                                                    {format(new Date(schedule.lastGeneratedDate), "MMM d, yyyy")}
                                                </div>
                                            ) : (
                                                <Badge variant="outline">Never</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => generateMutation.mutate(schedule.id)}
                                                disabled={generateMutation.isPending}
                                            >
                                                <RefreshCw className={`mr-1 h-3 w-3 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
                                                Generate
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleteSchedule(schedule)}
                                                aria-label="Delete schedule"
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            No recurring schedules found. Create one to get started.
                        </div>
                    )}
                </CardContent>
            </Card>

            <CreateScheduleDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

            <AlertDialog open={!!deleteSchedule} onOpenChange={() => setDeleteSchedule(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this recurring schedule for {deleteSchedule?.organizationName || deleteSchedule?.visitorName}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteSchedule && deleteMutation.mutate(deleteSchedule.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function CreateScheduleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        organizationName: "",
        visitorName: "",
        visitorEmail: "",
        visitorPhone: "",
        groupSize: "large_group",
        numberOfPeople: 10,
        tourType: "standard",
        frequency: "weekly",
        dayOfWeek: "5", // Friday default
        startDate: new Date().toISOString().split('T')[0],
        startTime: "09:00",
    });

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const payload = {
                ...data,
                dayOfWeek: parseInt(data.dayOfWeek),
                numberOfPeople: parseInt(data.numberOfPeople.toString()) || 1
            };
            return apiRequest("POST", "/api/recurring-bookings", payload);
        },
        onSuccess: () => {
            toast({ title: "Schedule Created" });
            onOpenChange(false);
            queryClient.invalidateQueries({ queryKey: ["/api/recurring-bookings"] });
        },
        onError: () => toast({ title: "Failed to create", variant: "destructive" })
    });

    const onSubmit = () => {
        if (!formData.visitorName || !formData.visitorEmail || !formData.startDate) {
            toast({ title: "Missing fields", variant: "destructive" });
            return;
        }
        mutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Recurring Schedule</DialogTitle>
                    <DialogDescription>Set up a template for regular visits.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Organization Name</Label>
                        <Input
                            placeholder="e.g. St. Mary's School"
                            value={formData.organizationName}
                            onChange={e => setFormData({ ...formData, organizationName: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Contact Person *</Label>
                            <Input
                                value={formData.visitorName}
                                onChange={e => setFormData({ ...formData, visitorName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email *</Label>
                            <Input
                                type="email"
                                value={formData.visitorEmail}
                                onChange={e => setFormData({ ...formData, visitorEmail: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Frequency</Label>
                            <Select
                                value={formData.frequency}
                                onValueChange={v => setFormData({ ...formData, frequency: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly (Same Date)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.frequency === 'weekly' && (
                            <div className="space-y-2">
                                <Label>Day of Week</Label>
                                <Select
                                    value={formData.dayOfWeek}
                                    onValueChange={v => setFormData({ ...formData, dayOfWeek: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Monday</SelectItem>
                                        <SelectItem value="2">Tuesday</SelectItem>
                                        <SelectItem value="3">Wednesday</SelectItem>
                                        <SelectItem value="4">Thursday</SelectItem>
                                        <SelectItem value="5">Friday</SelectItem>
                                        <SelectItem value="6">Saturday</SelectItem>
                                        <SelectItem value="0">Sunday</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date *</Label>
                            <Input
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Time *</Label>
                            <Input
                                type="time"
                                value={formData.startTime}
                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <Button className="w-full" onClick={onSubmit} disabled={mutation.isPending}>
                        {mutation.isPending ? "Creating..." : "Create Schedule"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
