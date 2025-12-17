import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Mail, Edit2, Save, Clock, UserCheck, MessageSquare, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SEO } from "@/components/seo";

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    description?: string;
    variables?: string[];
    isActive: boolean;
    updatedAt?: string;
}

// Default templates for initialization
const defaultTemplates: Omit<EmailTemplate, "id" | "updatedAt">[] = [
    {
        name: "booking_confirmation",
        subject: "Your Dzaleka Visit is Confirmed!",
        body: `Dear {{visitor_name}},

Your visit to Dzaleka Refugee Camp has been confirmed!

Visit Details:
- Date: {{visit_date}}
- Time: {{visit_time}}
- Tour Type: {{tour_type}}
- Group Size: {{group_size}} ({{number_of_people}} people)
- Meeting Point: {{meeting_point}}
- Assigned Guide: {{guide_name}}

Total Amount: MWK {{total_amount}}

Please arrive 15 minutes before your scheduled time. If you need to make any changes, please contact us at least 24 hours in advance.

We look forward to welcoming you!

Best regards,
Dzaleka Visit Team`,
        description: "Sent when a booking is confirmed by admin",
        variables: ["visitor_name", "visit_date", "visit_time", "tour_type", "group_size", "number_of_people", "meeting_point", "guide_name", "total_amount"],
        isActive: true,
    },
    {
        name: "booking_reminder",
        subject: "Reminder: Your Dzaleka Visit is Tomorrow!",
        body: `Dear {{visitor_name}},

This is a friendly reminder that your visit to Dzaleka Refugee Camp is scheduled for tomorrow!

Visit Details:
- Date: {{visit_date}}
- Time: {{visit_time}}
- Meeting Point: {{meeting_point}}
- Guide: {{guide_name}}

What to bring:
- Valid ID/Passport
- Comfortable walking shoes
- Water and sunscreen
- Camera (optional)

If you have any questions or need to reschedule, please contact us as soon as possible.

See you tomorrow!

Best regards,
Dzaleka Visit Team`,
        description: "Sent 24 hours before the scheduled visit",
        variables: ["visitor_name", "visit_date", "visit_time", "meeting_point", "guide_name"],
        isActive: true,
    },
    {
        name: "feedback_request",
        subject: "How was your Dzaleka Visit Experience?",
        body: `Dear {{visitor_name}},

Thank you for visiting Dzaleka Refugee Camp on {{visit_date}}!

We hope you had a meaningful and educational experience. Your feedback helps us improve our services and better share the stories of our community.

We'd love to hear your thoughts:
- What did you enjoy most about the tour?
- How was your guide, {{guide_name}}?
- Any suggestions for improvement?

Please reply to this email with your feedback, or leave a review on our website.

Thank you for your support in sharing the Dzaleka story with the world.

Warm regards,
Dzaleka Visit Team`,
        description: "Sent after a tour is completed",
        variables: ["visitor_name", "visit_date", "guide_name"],
        isActive: true,
    },
];

export default function EmailSettings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const { data: templates, isLoading } = useQuery<EmailTemplate[]>({
        queryKey: ["/api/email-templates"],
    });

    const updateTemplateMutation = useMutation({
        mutationFn: async (template: EmailTemplate) => {
            return await apiRequest("PUT", `/api/email-templates/${template.id}`, template);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
            setIsEditOpen(false);
            toast({
                title: "Template Updated",
                description: "The email template has been saved successfully.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to Update",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const toggleTemplateMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            return await apiRequest("PATCH", `/api/email-templates/${id}/toggle`, { isActive });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
        },
    });

    const getTemplateIcon = (name: string) => {
        switch (name) {
            case "booking_confirmation":
                return <UserCheck className="h-5 w-5 text-green-500" />;
            case "booking_reminder":
                return <Clock className="h-5 w-5 text-blue-500" />;
            case "feedback_request":
                return <MessageSquare className="h-5 w-5 text-purple-500" />;
            case "status_update":
                return <Info className="h-5 w-5 text-orange-500" />;
            case "guide_assignment":
                return <UserCheck className="h-5 w-5 text-indigo-500" />;
            case "check_in_notification":
                return <UserCheck className="h-5 w-5 text-emerald-500" />;
            case "password_reset":
                return <Mail className="h-5 w-5 text-red-500" />;
            default:
                return <Mail className="h-5 w-5 text-gray-500" />;
        }
    };

    const getTemplateLabel = (name: string) => {
        switch (name) {
            case "booking_confirmation":
                return "Booking Confirmation";
            case "booking_reminder":
                return "24hr Reminder";
            case "feedback_request":
                return "Feedback Request";
            case "status_update":
                return "Status Update";
            case "guide_assignment":
                return "Guide Assignment";
            case "check_in_notification":
                return "Check-In Notification";
            case "password_reset":
                return "Password Reset";
            default:
                return name.replace(/_/g, " ");
        }
    };

    // Use default templates if none exist
    const displayTemplates = templates && templates.length > 0 ? templates : defaultTemplates.map((t, i) => ({
        ...t,
        id: `default-${i}`,
        updatedAt: new Date().toISOString(),
    }));

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SEO
                title="Email Templates"
                description="Customize email messages sent to visitors for bookings, reminders, and feedback."
            />
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">Email Templates</h1>
                <p className="text-muted-foreground">
                    Customize the email messages sent to visitors for bookings, reminders, and feedback.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Templates
                    </CardTitle>
                    <CardDescription>
                        Edit templates to personalize communication. Use {"{{variable_name}}"} for dynamic content.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Template</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-24">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayTemplates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {getTemplateIcon(template.name)}
                                            <div>
                                                <div className="font-medium">{getTemplateLabel(template.name)}</div>
                                                <div className="text-xs text-muted-foreground">{template.description}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={template.isActive}
                                            onCheckedChange={(checked) => {
                                                if (template.id.startsWith("default-")) {
                                                    toast({
                                                        title: "Save Templates First",
                                                        description: "Initialize templates in the database before toggling.",
                                                        variant: "destructive",
                                                    });
                                                    return;
                                                }
                                                toggleTemplateMutation.mutate({ id: template.id, isActive: checked });
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setEditingTemplate(template as EmailTemplate);
                                                setIsEditOpen(true);
                                            }}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Available Variables
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {["visitor_name", "visit_date", "visit_time", "tour_type", "group_size", "number_of_people", "meeting_point", "guide_name", "total_amount", "booking_id"].map((v) => (
                            <Badge key={v} variant="secondary" className="font-mono text-xs">
                                {`{{${v}}}`}
                            </Badge>
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                        Use these variables in your templates. They will be replaced with actual booking data when emails are sent.
                    </p>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Email Template</DialogTitle>
                        <DialogDescription>
                            Customize the email content. Variables in {"{{brackets}}"} will be replaced with actual data.
                        </DialogDescription>
                    </DialogHeader>
                    {editingTemplate && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Template Name</Label>
                                <Input value={getTemplateLabel(editingTemplate.name)} disabled className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject Line</Label>
                                <Input
                                    id="subject"
                                    value={editingTemplate.subject}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                    placeholder="Email subject"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="body">Email Body</Label>
                                <Textarea
                                    id="body"
                                    value={editingTemplate.body}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                                    placeholder="Email content..."
                                    rows={15}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {editingTemplate.variables?.map((v) => (
                                    <Badge
                                        key={v}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-muted"
                                        onClick={() => {
                                            setEditingTemplate({
                                                ...editingTemplate,
                                                body: editingTemplate.body + `{{${v}}}`,
                                            });
                                        }}
                                    >
                                        {`{{${v}}}`}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (editingTemplate) {
                                    if (editingTemplate.id.startsWith("default-")) {
                                        toast({
                                            title: "Templates Not Initialized",
                                            description: "Run database migration to create email templates table first.",
                                            variant: "destructive",
                                        });
                                        return;
                                    }
                                    updateTemplateMutation.mutate(editingTemplate);
                                }
                            }}
                            disabled={updateTemplateMutation.isPending}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {updateTemplateMutation.isPending ? "Saving..." : "Save Template"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
