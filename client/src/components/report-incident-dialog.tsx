import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Loader2 } from "lucide-react";
import { insertIncidentSchema } from "@shared/schema";

const formSchema = insertIncidentSchema.pick({
    title: true,
    description: true,
    location: true,
    involvedParties: true,
});

type IncidentForm = z.infer<typeof formSchema>;

export function ReportIncidentDialog() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<IncidentForm>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            location: "",
            involvedParties: "",
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: IncidentForm) => {
            // Default to "low" severity for user reports, admin can upgrade
            const payload = { ...data, severity: "medium", status: "reported" };
            const res = await apiRequest("POST", "/api/incidents", payload);
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "Report Submitted",
                description: "Your report has been received. Security will investigate shortly.",
            });
            setOpen(false);
            form.reset();
            // Invalidate queries if we show a list of incidents somewhere, otherwise just notify
        },
        onError: (error: any) => {
            toast({
                title: "Submission Failed",
                description: error.message || "Could not submit report.",
                variant: "destructive",
            });
        },
    });

    function onSubmit(data: IncidentForm) {
        mutation.mutate(data);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2 justify-start">
                    <AlertTriangle className="h-4 w-4" />
                    Report Safety Issue
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Report Safety Issue</DialogTitle>
                    <DialogDescription>
                        Please describe the incident or safety concern. In case of immediate emergency, please contact Camp Security directly.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subject</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Brief title of the issue" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Where is this happening?" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Please provide details about what happened..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="involvedParties"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Involved Parties (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Names or descriptions of people involved" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormDescription>Leave blank if unknown or anonymity preferred</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="destructive" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Report
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
