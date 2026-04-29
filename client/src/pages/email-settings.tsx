import { useRef, useState } from "react";
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
import { Mail, Edit2, Save, Clock, UserCheck, MessageSquare, Info, Loader2, Eye, Send } from "lucide-react";
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

interface RenderedEmailPreview {
    subject: string;
    body: string;
}

const templateSampleData: Record<string, string> = {
    visitor_name: "Amina Banda",
    visitor_email: "amina@example.com",
    visit_date: "2026-05-15",
    visit_time: "10:00",
    tour_type: "standard tour",
    group_size: "Small group",
    number_of_people: "4",
    meeting_point: "Dzaleka Main Gate",
    guide_name: "Joseph Mwale",
    total_amount: "120,000",
    booking_id: "DVS-2026-SAMPLE",
    booking_reference: "DVS-2026-SAMPLE",
    old_status: "pending",
    new_status: "confirmed",
    admin_notes: "Please arrive 10 minutes early.",
    guide_phone: "+265 999 000 000",
    check_in_time: "09:52",
    old_visit_date: "2026-05-14",
    old_visit_time: "09:00",
    new_visit_date: "2026-05-15",
    new_visit_time: "10:00",
    feedback_link: "https://visit.dzaleka.com/visit/feedback?booking=DVS-2026-SAMPLE",
    visitor_phone: "+265 888 123 456",
    visitor_organization: "Sample University",
    selected_zones: "Market, Education Center",
    special_requests: "Vegetarian lunch preferred",
    accessibility_needs: "Step-free meeting point preferred",
    cancellation_reason: "Visitor schedule changed",
    reschedule_link: "https://visit.dzaleka.com/my-bookings",
    payment_method: "card",
    payment_reference: "pi_sample_123",
    paid_at: "2026-05-15 10:20",
    ticket_id: "TKT-SAMPLE",
    ticket_subject: "Question about arrival time",
    ticket_status: "open",
    support_link: "https://visit.dzaleka.com/help",
    old_guide_name: "Joseph Mwale",
    new_guide_name: "Grace Phiri",
    assignment_change: "Guide assignment updated",
    incident_title: "Late arrival safety concern",
    incident_severity: "high",
    incident_location: "Dzaleka Main Gate",
    incident_reporter: "Amina Banda",
    rating: "3",
    generated_count: "4",
    generated_dates: "2026-05-15, 2026-05-22, 2026-05-29, 2026-06-05",
    training_percentage: "75",
    incomplete_modules: "Safety briefing, visitor care",
    verification_link: "https://visit.dzaleka.com/verify-email?token=sample",
};

const renderTemplateText = (value: string, data: Record<string, string> = templateSampleData) =>
    value.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => data[key] ?? `{{${key}}}`);

// Default templates for initialization
const defaultTemplates: Omit<EmailTemplate, "id" | "updatedAt">[] = [
    {
        name: "booking_request_received",
        subject: "Booking request received - {{booking_id}}",
        body: `Dear {{visitor_name}},

Thank you for requesting a visit to Dzaleka Refugee Camp. We have received your request and our team is reviewing it.

Request Details:
- Reference: {{booking_id}}
- Date: {{visit_date}}
- Time: {{visit_time}}
- Tour Type: {{tour_type}}
- Group Size: {{group_size}} ({{number_of_people}} people)
- Meeting Point: {{meeting_point}}

Total Amount: MWK {{total_amount}}

Our team will send a confirmation email once your visit time and guide assignment are confirmed.

Best regards,
Visit Dzaleka Team`,
        description: "Sent when a new booking request is received",
        variables: ["visitor_name", "booking_id", "visit_date", "visit_time", "tour_type", "group_size", "number_of_people", "meeting_point", "total_amount"],
        isActive: true,
    },
    {
        name: "booking_confirmation",
        subject: "Booking confirmed - {{booking_id}}",
        body: `Dear {{visitor_name}},

Great news. Your Visit Dzaleka booking has been confirmed.

Visit Details:
- Reference: {{booking_id}}
- Date: {{visit_date}}
- Time: {{visit_time}}
- Meeting Point: {{meeting_point}}
- Assigned Guide: {{guide_name}}

Please arrive 10 minutes before your scheduled time. If anything changes, contact us as soon as possible.

Best regards,
Visit Dzaleka Team`,
        description: "Sent when a booking is confirmed",
        variables: ["visitor_name", "booking_id", "visit_date", "visit_time", "meeting_point", "guide_name"],
        isActive: true,
    },
    {
        name: "booking_rescheduled",
        subject: "Booking rescheduled - {{booking_id}}",
        body: `Dear {{visitor_name}},

Your Visit Dzaleka booking has been rescheduled.

Previous Details:
- Date: {{old_visit_date}}
- Time: {{old_visit_time}}

New Details:
- Date: {{new_visit_date}}
- Time: {{new_visit_time}}
- Meeting Point: {{meeting_point}}
- Guide: {{guide_name}}

If this new time does not work for you, please reply to this email as soon as possible.

Best regards,
Visit Dzaleka Team`,
        description: "Sent when staff reschedule a booking",
        variables: ["visitor_name", "booking_id", "old_visit_date", "old_visit_time", "new_visit_date", "new_visit_time", "meeting_point", "guide_name"],
        isActive: true,
    },
    {
        name: "booking_cancelled",
        subject: "Booking cancelled - {{booking_id}}",
        body: `Dear {{visitor_name}},

Your Visit Dzaleka booking has been cancelled.

Booking Details:
- Reference: {{booking_id}}
- Date: {{visit_date}}
- Time: {{visit_time}}
- Meeting Point: {{meeting_point}}

Reason:
{{cancellation_reason}}

If you would like to request a new date, use this link or reply to this email:
{{reschedule_link}}

Best regards,
Visit Dzaleka Team`,
        description: "Sent when staff or visitors cancel a booking",
        variables: ["visitor_name", "booking_id", "visit_date", "visit_time", "meeting_point", "cancellation_reason", "reschedule_link"],
        isActive: true,
    },
    {
        name: "booking_reminder",
        subject: "Reminder: your Visit Dzaleka tour is tomorrow",
        body: `Dear {{visitor_name}},

This is a friendly reminder that your visit to Dzaleka Refugee Camp is scheduled for tomorrow.

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

We look forward to welcoming you.

Best regards,
Visit Dzaleka Team`,
        description: "Sent 24 hours before the scheduled visit",
        variables: ["visitor_name", "visit_date", "visit_time", "meeting_point", "guide_name"],
        isActive: true,
    },
    {
        name: "feedback_request",
        subject: "How was your Visit Dzaleka experience?",
        body: `Dear {{visitor_name}},

Thank you for visiting Dzaleka Refugee Camp on {{visit_date}}.

We hope you had a meaningful and educational experience. Your feedback helps us improve our services and better share the stories of our community.

We'd love to hear your thoughts:
- What did you enjoy most about the tour?
- How was your guide, {{guide_name}}?
- Any suggestions for improvement?

Share feedback here: {{feedback_link}}

Thank you for your support in sharing the Dzaleka story with the world.

Warm regards,
Visit Dzaleka Team`,
        description: "Sent after a tour is completed",
        variables: ["visitor_name", "visit_date", "guide_name", "feedback_link"],
        isActive: true,
    },
    {
        name: "status_update",
        subject: "Booking update - {{booking_id}}",
        body: `Dear {{visitor_name}},

Your booking status has changed from {{old_status}} to {{new_status}}.

Reference: {{booking_id}}
Visit Date: {{visit_date}}

{{admin_notes}}

Best regards,
Visit Dzaleka Team`,
        description: "Sent when staff change a booking status",
        variables: ["visitor_name", "booking_id", "old_status", "new_status", "visit_date", "admin_notes"],
        isActive: true,
    },
    {
        name: "guide_assignment",
        subject: "Your guide has been assigned - {{booking_id}}",
        body: `Dear {{visitor_name}},

Your guide for your Visit Dzaleka booking has been assigned.

Guide: {{guide_name}}
Phone: {{guide_phone}}
Date: {{visit_date}}
Time: {{visit_time}}
Meeting Point: {{meeting_point}}

Best regards,
Visit Dzaleka Team`,
        description: "Sent when staff assign a guide to a booking",
        variables: ["visitor_name", "booking_id", "guide_name", "guide_phone", "visit_date", "visit_time", "meeting_point"],
        isActive: true,
    },
    {
        name: "guide_tour_assignment",
        subject: "New tour assignment - {{booking_id}}",
        body: `Hello {{guide_name}},

You have been assigned to a Visit Dzaleka tour.

Tour Details:
- Reference: {{booking_id}}
- Visitor: {{visitor_name}}
- Visitor Email: {{visitor_email}}
- Visitor Phone: {{visitor_phone}}
- Organization: {{visitor_organization}}
- Date: {{visit_date}}
- Time: {{visit_time}}
- Group Size: {{number_of_people}}
- Meeting Point: {{meeting_point}}
- Selected Zones: {{selected_zones}}

Notes:
- Special Requests: {{special_requests}}
- Accessibility Needs: {{accessibility_needs}}

Please review the booking details before the tour.

Best regards,
Visit Dzaleka Team`,
        description: "Sent to guides when staff assign them to a tour",
        variables: ["guide_name", "booking_id", "visitor_name", "visitor_email", "visitor_phone", "visitor_organization", "visit_date", "visit_time", "number_of_people", "meeting_point", "selected_zones", "special_requests", "accessibility_needs"],
        isActive: true,
    },
    {
        name: "guide_assignment_changed",
        subject: "Guide assignment updated - {{booking_id}}",
        body: `Hello,

{{assignment_change}}

Booking Details:
- Reference: {{booking_id}}
- Visitor: {{visitor_name}}
- Date: {{visit_date}}
- Time: {{visit_time}}
- Meeting Point: {{meeting_point}}

Guide Details:
- Previous Guide: {{old_guide_name}}
- New Guide: {{new_guide_name}}

Best regards,
Visit Dzaleka Team`,
        description: "Sent when a booking guide changes after the first assignment",
        variables: ["assignment_change", "booking_id", "visitor_name", "visit_date", "visit_time", "meeting_point", "old_guide_name", "new_guide_name"],
        isActive: true,
    },
    {
        name: "payment_receipt",
        subject: "Payment receipt - {{booking_id}}",
        body: `Dear {{visitor_name}},

We have received payment for your Visit Dzaleka booking.

Receipt Details:
- Reference: {{booking_id}}
- Amount: {{total_amount}}
- Payment Method: {{payment_method}}
- Payment Reference: {{payment_reference}}
- Paid At: {{paid_at}}

Thank you for supporting Visit Dzaleka.

Best regards,
Visit Dzaleka Team`,
        description: "Sent when staff or payment webhooks mark a booking as paid",
        variables: ["visitor_name", "booking_id", "total_amount", "payment_method", "payment_reference", "paid_at"],
        isActive: true,
    },
    {
        name: "support_ticket_created",
        subject: "Support ticket received - {{ticket_subject}}",
        body: `Hello,

We received your support ticket and our team will review it.

Ticket Details:
- Ticket ID: {{ticket_id}}
- Subject: {{ticket_subject}}
- Status: {{ticket_status}}

You can view your tickets here:
{{support_link}}

Best regards,
Visit Dzaleka Team`,
        description: "Sent to visitors when a support ticket is created",
        variables: ["ticket_id", "ticket_subject", "ticket_status", "support_link"],
        isActive: true,
    },
    {
        name: "support_ticket_resolved",
        subject: "Support ticket resolved - {{ticket_subject}}",
        body: `Hello,

Your support ticket has been updated.

Ticket Details:
- Ticket ID: {{ticket_id}}
- Subject: {{ticket_subject}}
- Status: {{ticket_status}}

Team Note:
{{admin_notes}}

You can review it here:
{{support_link}}

Best regards,
Visit Dzaleka Team`,
        description: "Sent to visitors when a support ticket is resolved",
        variables: ["ticket_id", "ticket_subject", "ticket_status", "admin_notes", "support_link"],
        isActive: true,
    },
    {
        name: "incident_alert",
        subject: "Incident alert: {{incident_severity}} - {{incident_title}}",
        body: `Hello team,

A high-priority incident has been reported.

Incident Details:
- Title: {{incident_title}}
- Severity: {{incident_severity}}
- Location: {{incident_location}}
- Reported By: {{incident_reporter}}

Description:
{{admin_notes}}

Review in Security:
{{support_link}}`,
        description: "Sent to internal staff when high-severity incidents are reported",
        variables: ["incident_title", "incident_severity", "incident_location", "incident_reporter", "admin_notes", "support_link"],
        isActive: true,
    },
    {
        name: "low_rating_alert",
        subject: "Low rating alert - {{guide_name}}",
        body: `Hello team,

A low tour rating needs review.

Details:
- Guide: {{guide_name}}
- Rating: {{rating}}/5
- Visitor: {{visitor_name}}
- Booking: {{booking_id}}
- Visit Date: {{visit_date}}

Open guide performance:
{{support_link}}`,
        description: "Sent to internal staff when a guide receives a low rating",
        variables: ["guide_name", "rating", "visitor_name", "booking_id", "visit_date", "support_link"],
        isActive: true,
    },
    {
        name: "recurring_booking_generated",
        subject: "Recurring bookings generated for {{visitor_name}}",
        body: `Hello,

Recurring bookings have been generated.

Details:
- Visitor or Organization Contact: {{visitor_name}}
- Email: {{visitor_email}}
- Generated Count: {{generated_count}}
- Dates: {{generated_dates}}

Review bookings:
{{support_link}}`,
        description: "Sent when recurring bookings generate confirmed bookings",
        variables: ["visitor_name", "visitor_email", "generated_count", "generated_dates", "support_link"],
        isActive: true,
    },
    {
        name: "guide_training_reminder",
        subject: "Training reminder - Visit Dzaleka",
        body: `Hello {{guide_name}},

Your required guide training is {{training_percentage}}% complete.

Please complete:
{{incomplete_modules}}

Continue training:
{{support_link}}

Best regards,
Visit Dzaleka Team`,
        description: "Sent to guides with incomplete required training",
        variables: ["guide_name", "training_percentage", "incomplete_modules", "support_link"],
        isActive: true,
    },
    {
        name: "welcome_or_email_verification",
        subject: "Welcome to Visit Dzaleka – Planning Your Visit",
        body: `Hi {{visitor_name}},

Thank you for signing up with Visit Dzaleka! We’re excited to share the stories, culture, and community of Dzaleka Refugee Camp with you.

We’d love to hear if you’re planning a visit soon and help you make the most of your experience. From guided tours to community activities, we can tailor your visit to suit your interests.

Feel free to reply to this email with your travel plans or any questions you have, and we’ll help you get started.

Looking forward to welcoming you to Dzaleka!

You can verify your account here:
{{verification_link}}

Need help?
{{support_link}}

Kind regards,
Bakari Mustafa
Visit Dzaleka Team`,
        description: "Sent when a user account is created or accepts an invite",
        variables: ["visitor_name", "visitor_email", "verification_link", "support_link"],
        isActive: true,
    },
    {
        name: "check_in_notification",
        subject: "Check-in confirmed - {{booking_id}}",
        body: `Dear {{visitor_name}},

You have successfully checked in for your Visit Dzaleka tour.

Reference: {{booking_id}}
Check-in Time: {{check_in_time}}
Guide: {{guide_name}}

Please follow your guide's instructions during the visit.

Best regards,
Visit Dzaleka Team`,
        description: "Sent when a visitor is checked in",
        variables: ["visitor_name", "booking_id", "check_in_time", "guide_name"],
        isActive: true,
    },
];

export default function EmailSettings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
    const [preview, setPreview] = useState<RenderedEmailPreview | null>(null);
    const [testTemplate, setTestTemplate] = useState<EmailTemplate | null>(null);
    const [testEmail, setTestEmail] = useState("");
    const [testName, setTestName] = useState("");
    const [variableTarget, setVariableTarget] = useState<"subject" | "body">("body");
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isTestOpen, setIsTestOpen] = useState(false);
    const subjectInputRef = useRef<HTMLInputElement | null>(null);
    const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

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
                title: "Template updated",
                description: "The email template has been saved successfully.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to update",
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

    const initializeTemplatesMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest("POST", "/api/email-templates/initialize", {
                templates: defaultTemplates,
            });
            return await response.json() as { createdCount: number; updatedCount: number };
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
            toast({
                title: "Templates initialized",
                description: result.createdCount > 0
                    ? `${result.createdCount} missing template${result.createdCount === 1 ? "" : "s"} added. You can now preview, test, and toggle them.`
                    : "Template records are ready. You can now preview, test, and toggle them.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to initialize templates",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const previewTemplateMutation = useMutation({
        mutationFn: async (template: EmailTemplate) => {
            if (template.id.startsWith("default-")) {
                return {
                    subject: renderTemplateText(template.subject),
                    body: renderTemplateText(template.body),
                };
            }
            const response = await apiRequest("POST", `/api/email-templates/${template.id}/preview`, {
                sampleData: templateSampleData,
            });
            return await response.json() as RenderedEmailPreview;
        },
        onSuccess: (data) => {
            setPreview(data);
            setIsPreviewOpen(true);
        },
        onError: (error: Error) => {
            toast({
                title: "Preview failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const sendTestMutation = useMutation({
        mutationFn: async ({ template, recipientEmail, recipientName }: { template: EmailTemplate; recipientEmail: string; recipientName: string }) => {
            if (template.id.startsWith("default-")) {
                throw new Error("Initialize templates in the database before sending tests.");
            }
            return await apiRequest("POST", `/api/email-templates/${template.id}/send-test`, {
                recipientEmail,
                recipientName,
                sampleData: templateSampleData,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/email-logs"] });
            setIsTestOpen(false);
            setTestEmail("");
            setTestName("");
            toast({
                title: "Test email sent",
                description: "The rendered template was sent to the test recipient.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to send test",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const getTemplateIcon = (name: string) => {
        switch (name) {
            case "booking_request_received":
                return <Mail className="h-5 w-5 text-blue-500" />;
            case "booking_confirmation":
                return <UserCheck className="h-5 w-5 text-green-500" />;
            case "booking_rescheduled":
                return <Clock className="h-5 w-5 text-amber-500" />;
            case "booking_cancelled":
                return <Info className="h-5 w-5 text-red-500" />;
            case "booking_reminder":
                return <Clock className="h-5 w-5 text-blue-500" />;
            case "feedback_request":
                return <MessageSquare className="h-5 w-5 text-purple-500" />;
            case "status_update":
                return <Info className="h-5 w-5 text-orange-500" />;
            case "guide_assignment":
                return <UserCheck className="h-5 w-5 text-indigo-500" />;
            case "guide_tour_assignment":
                return <UserCheck className="h-5 w-5 text-cyan-500" />;
            case "guide_assignment_changed":
                return <UserCheck className="h-5 w-5 text-amber-500" />;
            case "payment_receipt":
                return <Mail className="h-5 w-5 text-emerald-500" />;
            case "support_ticket_created":
            case "support_ticket_resolved":
                return <MessageSquare className="h-5 w-5 text-blue-500" />;
            case "incident_alert":
            case "low_rating_alert":
                return <Info className="h-5 w-5 text-red-500" />;
            case "recurring_booking_generated":
                return <Clock className="h-5 w-5 text-indigo-500" />;
            case "guide_training_reminder":
                return <Clock className="h-5 w-5 text-purple-500" />;
            case "welcome_or_email_verification":
                return <Mail className="h-5 w-5 text-green-500" />;
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
            case "booking_request_received":
                return "Booking Request Received";
            case "booking_confirmation":
                return "Booking Confirmation";
            case "booking_rescheduled":
                return "Booking Rescheduled";
            case "booking_cancelled":
                return "Booking Cancelled";
            case "booking_reminder":
                return "24-hour Reminder";
            case "feedback_request":
                return "Feedback Request";
            case "status_update":
                return "Status Update";
            case "guide_assignment":
                return "Visitor Guide Assignment";
            case "guide_tour_assignment":
                return "Guide Tour Assignment";
            case "guide_assignment_changed":
                return "Guide Assignment Changed";
            case "payment_receipt":
                return "Payment Receipt";
            case "support_ticket_created":
                return "Support Ticket Created";
            case "support_ticket_resolved":
                return "Support Ticket Resolved";
            case "incident_alert":
                return "Incident Alert";
            case "low_rating_alert":
                return "Low Rating Alert";
            case "recurring_booking_generated":
                return "Recurring Booking Generated";
            case "guide_training_reminder":
                return "Guide Training Reminder";
            case "welcome_or_email_verification":
                return "Welcome / Email Verification";
            case "check_in_notification":
                return "Check-in Notification";
            case "password_reset":
                return "Password Reset";
            default:
                return name.replace(/_/g, " ");
        }
    };

    const getTemplateHealth = (template: EmailTemplate) => {
        if (!template.isActive) {
            return { label: "Disabled", variant: "secondary" as const };
        }

        const knownAutomationTemplates = new Set([
            "booking_confirmation",
            "booking_cancelled",
            "booking_request_received",
            "booking_rescheduled",
            "booking_reminder",
            "feedback_request",
            "status_update",
            "guide_assignment",
            "guide_assignment_changed",
            "guide_tour_assignment",
            "payment_receipt",
            "support_ticket_created",
            "support_ticket_resolved",
            "incident_alert",
            "low_rating_alert",
            "recurring_booking_generated",
            "guide_training_reminder",
            "welcome_or_email_verification",
            "check_in_notification",
            "password_reset",
            "invitation",
        ]);

        if (knownAutomationTemplates.has(template.name)) {
            if (template.id.startsWith("default-")) {
                return { label: "Not wired yet", variant: "destructive" as const };
            }
            return { label: "Used by automation", variant: "default" as const };
        }

        return { label: "Manual only", variant: "outline" as const };
    };

    const openPreview = (template: EmailTemplate) => {
        setPreviewTemplate(template);
        setPreview(null);
        previewTemplateMutation.mutate(template);
    };

    const openTestDialog = (template: EmailTemplate) => {
        if (template.id.startsWith("default-")) {
            initializeTemplatesMutation.mutate();
            return;
        }

        setTestTemplate(template);
        setTestEmail("");
        setTestName("");
        setIsTestOpen(true);
    };

    const insertVariable = (variable: string) => {
        if (!editingTemplate) return;

        const token = `{{${variable}}}`;
        const isSubject = variableTarget === "subject";
        const currentValue = isSubject ? editingTemplate.subject : editingTemplate.body;
        const element = isSubject ? subjectInputRef.current : bodyTextareaRef.current;
        const start = element?.selectionStart ?? currentValue.length;
        const end = element?.selectionEnd ?? currentValue.length;
        const nextValue = `${currentValue.slice(0, start)}${token}${currentValue.slice(end)}`;

        setEditingTemplate({
            ...editingTemplate,
            [isSubject ? "subject" : "body"]: nextValue,
        });

        window.setTimeout(() => {
            element?.focus();
            element?.setSelectionRange(start + token.length, start + token.length);
        }, 0);
    };

    // Use default templates if none exist
    const defaultDisplayTemplates = defaultTemplates.map((template, index) => ({
        ...template,
        id: `default-${index}`,
        updatedAt: new Date().toISOString(),
    }));
    const displayTemplates = templates && templates.length > 0
        ? [
            ...templates,
            ...defaultDisplayTemplates.filter(
                (defaultTemplate) => !templates.some((template) => template.name === defaultTemplate.name)
            ),
        ]
        : defaultDisplayTemplates;
    const hasUninitializedTemplates = displayTemplates.some((template) => template.id.startsWith("default-"));
    const templateHealthStats = displayTemplates.reduce(
        (acc, template) => {
            const health = getTemplateHealth(template as EmailTemplate).label;
            if (template.isActive) acc.active += 1;
            if (health === "Used by automation") acc.automated += 1;
            if (health === "Manual only") acc.manual += 1;
            if (health === "Not wired yet") acc.unwired += 1;
            if (health === "Disabled") acc.disabled += 1;
            return acc;
        },
        { active: 0, automated: 0, manual: 0, unwired: 0, disabled: 0 }
    );

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
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Email Templates</h1>
                <p className="text-muted-foreground">
                    Customize the email messages sent to visitors for bookings, reminders, and feedback.
                </p>
                {hasUninitializedTemplates && (
                    <div>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => initializeTemplatesMutation.mutate()}
                            disabled={initializeTemplatesMutation.isPending}
                            className="mt-2 gap-2"
                        >
                            {initializeTemplatesMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Initialize missing templates
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border p-4">
                    <p className="text-xs font-medium text-muted-foreground">Automation coverage</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{templateHealthStats.automated}</p>
                    <p className="text-xs text-muted-foreground">Templates wired to automated sends</p>
                </div>
                <div className="rounded-lg border p-4">
                    <p className="text-xs font-medium text-muted-foreground">Manual templates</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{templateHealthStats.manual}</p>
                    <p className="text-xs text-muted-foreground">Available for staff-triggered messages</p>
                </div>
                <div className="rounded-lg border p-4">
                    <p className="text-xs font-medium text-muted-foreground">Needs wiring</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{templateHealthStats.unwired}</p>
                    <p className="text-xs text-muted-foreground">Templates present but not connected yet</p>
                </div>
                <div className="rounded-lg border p-4">
                    <p className="text-xs font-medium text-muted-foreground">Active templates</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{templateHealthStats.active}</p>
                    <p className="text-xs text-muted-foreground">{templateHealthStats.disabled} disabled</p>
                </div>
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
                    <div className="overflow-x-auto">
                    <Table className="min-w-[760px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Template</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Health</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-36">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayTemplates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell>
                                        <div className="flex min-w-[220px] items-center gap-3">
                                            {getTemplateIcon(template.name)}
                                            <div className="min-w-0">
                                                <div className="break-words font-medium">{getTemplateLabel(template.name)}</div>
                                                <div className="line-clamp-2 text-xs text-muted-foreground">{template.description}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                                    <TableCell>
                                        <Badge variant={getTemplateHealth(template).variant}>
                                            {getTemplateHealth(template).label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={template.isActive}
                                                aria-label={`Toggle ${getTemplateLabel(template.name)} template`}
                                                onCheckedChange={(checked) => {
                                                    if (template.id.startsWith("default-")) {
                                                        initializeTemplatesMutation.mutate();
                                                        return;
                                                    }
                                                    toggleTemplateMutation.mutate({ id: template.id, isActive: checked });
                                                }}
                                            />
                                            <Badge variant={template.isActive ? "default" : "secondary"}>
                                                {template.isActive ? "Active" : "Off"}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                aria-label={`Preview ${getTemplateLabel(template.name)} template`}
                                                onClick={() => openPreview(template as EmailTemplate)}
                                                disabled={previewTemplateMutation.isPending}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                aria-label={`Send test ${getTemplateLabel(template.name)} template`}
                                                onClick={() => openTestDialog(template as EmailTemplate)}
                                            >
                                                <Send className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                aria-label={`Edit ${getTemplateLabel(template.name)} template`}
                                                onClick={() => {
                                                    setEditingTemplate(template as EmailTemplate);
                                                    setIsEditOpen(true);
                                                }}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
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
                        {[
                            "visitor_name",
                            "visitor_email",
                            "booking_id",
                            "booking_reference",
                            "visit_date",
                            "visit_time",
                            "tour_type",
                            "group_size",
                            "number_of_people",
                            "meeting_point",
                            "guide_name",
                            "guide_phone",
                            "total_amount",
                            "old_status",
                            "new_status",
                            "old_visit_date",
                            "old_visit_time",
                            "new_visit_date",
                            "new_visit_time",
                            "admin_notes",
                            "check_in_time",
                            "feedback_link",
                            "visitor_phone",
                            "visitor_organization",
                            "selected_zones",
                            "special_requests",
                            "accessibility_needs",
                            "cancellation_reason",
                            "reschedule_link",
                            "payment_method",
                            "payment_reference",
                            "paid_at",
                            "ticket_id",
                            "ticket_subject",
                            "ticket_status",
                            "support_link",
                            "old_guide_name",
                            "new_guide_name",
                            "assignment_change",
                            "incident_title",
                            "incident_severity",
                            "incident_location",
                            "incident_reporter",
                            "rating",
                            "generated_count",
                            "generated_dates",
                            "training_percentage",
                            "incomplete_modules",
                            "verification_link",
                        ].map((v) => (
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
                                    ref={subjectInputRef}
                                    value={editingTemplate.subject}
                                    onFocus={() => setVariableTarget("subject")}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                    placeholder="Subject line…"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="body">Email Body</Label>
                                <Textarea
                                    id="body"
                                    ref={bodyTextareaRef}
                                    value={editingTemplate.body}
                                    onFocus={() => setVariableTarget("body")}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                                    placeholder="Email content…"
                                    rows={15}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {editingTemplate.variables?.map((v) => (
                                    <Badge
                                        key={v}
                                        variant="outline"
                                        role="button"
                                        tabIndex={0}
                                        className="cursor-pointer hover:bg-muted"
                                        onClick={() => insertVariable(v)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                insertVariable(v);
                                            }
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
                                        initializeTemplatesMutation.mutate();
                                        return;
                                    }
                                    updateTemplateMutation.mutate(editingTemplate);
                                }
                            }}
                            disabled={updateTemplateMutation.isPending}
                        >
                            {updateTemplateMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Rendered Preview</DialogTitle>
                        <DialogDescription>
                            Sample data is used so variables render like a real visitor email.
                        </DialogDescription>
                    </DialogHeader>
                    {previewTemplate && preview && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Template</Label>
                                <Input value={getTemplateLabel(previewTemplate.name)} readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Subject</Label>
                                <Input value={preview.subject} readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Body</Label>
                                <div className="rounded-md border bg-muted/40 p-4 text-sm whitespace-pre-wrap">
                                    {preview.body}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isTestOpen} onOpenChange={setIsTestOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Send Test Email</DialogTitle>
                        <DialogDescription>
                            Sends a rendered sample using the current template variables.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="test-recipient-name">Recipient name</Label>
                            <Input
                                id="test-recipient-name"
                                name="testRecipientName"
                                autoComplete="name"
                                placeholder="Recipient name…"
                                value={testName}
                                onChange={(event) => setTestName(event.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="test-recipient-email">Recipient email</Label>
                            <Input
                                id="test-recipient-email"
                                name="testRecipientEmail"
                                type="email"
                                autoComplete="email"
                                placeholder="name@example.com"
                                value={testEmail}
                                onChange={(event) => setTestEmail(event.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTestOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={sendTestMutation.isPending}
                            onClick={() => {
                                if (!testTemplate || !testEmail.trim()) {
                                    toast({
                                        title: "Recipient required",
                                        description: "Add an email address before sending a test.",
                                        variant: "destructive",
                                    });
                                    return;
                                }
                                sendTestMutation.mutate({
                                    template: testTemplate,
                                    recipientEmail: testEmail.trim(),
                                    recipientName: testName.trim() || "Test Recipient",
                                });
                            }}
                        >
                            {sendTestMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" />
                            )}
                            Send Test
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
