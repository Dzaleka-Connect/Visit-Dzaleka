import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExternalCalendarSchema, type ExternalCalendar } from "@shared/schema";
import { Loader2, Plus, RefreshCw, Trash2, Calendar, Link } from "lucide-react";
// import { CopyButton } from "@/components/ui/copy-button"; // Removed as it might not exist

export default function ChannelManager() {
    const { toast } = useToast();
    const [isSyncing, setIsSyncing] = useState(false);

    const { data: calendars, isLoading } = useQuery<ExternalCalendar[]>({
        queryKey: ["/api/calendars"],
    });

    const syncMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/calendar/sync");
            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Sync Complete",
                description: `Synced ${data.results?.length || 0} calendars.`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/calendars"] });
            queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
        },
        onError: (error) => {
            toast({
                title: "Sync Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/calendars/${id}`);
        },
        onSuccess: () => {
            toast({
                title: "Calendar disconnected",
                description: "The channel connection has been removed.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/calendars"] });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleSync = async () => {
        setIsSyncing(true);
        await syncMutation.mutateAsync();
        setIsSyncing(false);
    };

    // Construct current domain iCal feed URL
    const feedUrl = `${window.location.origin}/api/calendar/feed/public`;

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Channel Manager</h1>
                    <p className="text-muted-foreground mt-2">
                        Sync availability with OTA platforms like Airbnb, Booking.com, and Viator.
                    </p>
                </div>
                <Button
                    onClick={handleSync}
                    disabled={isSyncing || syncMutation.isPending}
                    variant="outline"
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                    Sync Now
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Connected Channels</CardTitle>
                            <CardDescription>External calendars we are importing availability from.</CardDescription>
                        </div>
                        <AddCalendarDialog />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : calendars?.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                                <h3 className="text-lg font-medium">No channels connected</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                                    Connect an external calendar to prevent double bookings.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[150px]">Channel Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Last Synced</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {calendars?.map((cal) => (
                                            <TableRow key={cal.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {cal.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        Active
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {cal.lastSyncedAt
                                                        ? new Date(cal.lastSyncedAt).toLocaleString()
                                                        : "Never"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive/90"
                                                        onClick={() => deleteMutation.mutate(cal.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Export Availability</CardTitle>
                        <CardDescription>
                            Share this iCal link with OTAs to push your availability to them.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg break-all text-sm font-mono relative group">
                            {feedUrl}
                        </div>
                        <Button
                            className="w-full"
                            variant="secondary"
                            onClick={() => {
                                navigator.clipboard.writeText(feedUrl);
                                toast({ title: "Copied!", description: "Calendar URL copied to clipboard." });
                            }}
                        >
                            <Link className="mr-2 h-4 w-4" /> Copy Link
                        </Button>

                        <div className="text-xs text-muted-foreground mt-4 space-y-2">
                            <p><strong>Instructions:</strong></p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li><strong>Airbnb:</strong> Go to 'Availability' settings, select 'Import Calendar' to paste external links, or 'Export Calendar' to get this link.</li>
                                <li><strong>Booking.com:</strong> 'Rates & Availability' &gt; 'Calendar Sync'.</li>
                                <li><strong>Viator:</strong> 'Product Content' &gt; 'Availability'.</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function AddCalendarDialog() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof insertExternalCalendarSchema>>({
        resolver: zodResolver(insertExternalCalendarSchema),
        defaultValues: {
            name: "",
            url: "",
            color: "#3b82f6",
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof insertExternalCalendarSchema>) => {
            const res = await apiRequest("POST", "/api/calendars", values);
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "Calendar Connected",
                description: "Availability will now be synced from this source.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/calendars"] });
            setOpen(false);
            form.reset();
        },
        onError: (error) => {
            toast({
                title: "Connection Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    function onSubmit(values: z.infer<typeof insertExternalCalendarSchema>) {
        mutation.mutate(values);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Connect Channel
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Connect New Channel</DialogTitle>
                    <DialogDescription>
                        Enter the iCal URL from the OTA (e.g., Airbnb, Booking.com) to import their bookings.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Channel Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Airbnb Apartment 1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>iCal URL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://www.airbnb.com/calendar/ical/..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Connect
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
