import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    Shield,
    Wifi,
    History,
    UserPlus,
    Plus,
    Trash2,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    Mail,
    Monitor,
    Smartphone,
    Tablet,
    AlertTriangle,
    Send,
    MailOpen,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SEO } from "@/components/seo";

// Types
interface AllowedIp {
    id: string;
    ipAddress: string;
    description: string | null;
    createdBy: string | null;
    createdAt: string;
}

interface LoginHistory {
    id: string;
    userId: string | null;
    email: string;
    ipAddress: string | null;
    userAgent: string | null;
    deviceType: string | null;
    browser: string | null;
    os: string | null;
    success: boolean;
    failureReason: string | null;
    createdAt: string;
}

interface UserInvite {
    id: string;
    email: string;
    role: string | null;
    inviteToken: string;
    invitedBy: string | null;
    expiresAt: string;
    acceptedAt: string | null;
    createdAt: string;
}

interface EmailLog {
    id: string;
    sentBy: string | null;
    recipientName: string | null;
    recipientEmail: string;
    subject: string;
    message: string | null;
    templateType: string | null;
    status: string | null;
    errorMessage: string | null;
    relatedEntityType: string | null;
    relatedEntityId: string | null;
    createdAt: string;
}

export default function SecurityAdmin() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("ip-whitelist");

    // IP Whitelist State
    const [newIpAddress, setNewIpAddress] = useState("");
    const [newIpDescription, setNewIpDescription] = useState("");
    const [isAddIpOpen, setIsAddIpOpen] = useState(false);

    // Invite State
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("visitor");
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    // Login History Filter
    const [historyFilter, setHistoryFilter] = useState<"all" | "success" | "failed">("all");

    // Email Filter
    const [emailFilter, setEmailFilter] = useState<"all" | "sent" | "failed">("all");

    // Queries
    const { data: allowedIps, isLoading: ipsLoading } = useQuery<AllowedIp[]>({
        queryKey: ["/api/security/ip-whitelist"],
    });

    const { data: loginHistory, isLoading: historyLoading } = useQuery<LoginHistory[]>({
        queryKey: ["/api/security/login-history"],
    });

    const { data: invites, isLoading: invitesLoading } = useQuery<UserInvite[]>({
        queryKey: ["/api/invites"],
    });

    const { data: emailLogs, isLoading: emailLogsLoading } = useQuery<EmailLog[]>({
        queryKey: ["/api/email-logs"],
    });

    // Mutations
    const addIpMutation = useMutation({
        mutationFn: async (data: { ipAddress: string; description: string }) => {
            await apiRequest("POST", "/api/security/ip-whitelist", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/security/ip-whitelist"] });
            toast({ title: "IP Added", description: "IP address has been added to the whitelist." });
            setIsAddIpOpen(false);
            setNewIpAddress("");
            setNewIpDescription("");
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message || "Failed to add IP address.", variant: "destructive" });
        },
    });

    const deleteIpMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/security/ip-whitelist/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/security/ip-whitelist"] });
            toast({ title: "IP Removed", description: "IP address has been removed from the whitelist." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message || "Failed to remove IP address.", variant: "destructive" });
        },
    });

    const createInviteMutation = useMutation({
        mutationFn: async (data: { email: string; role: string }) => {
            await apiRequest("POST", "/api/invites", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
            toast({ title: "Invitation Sent", description: "An invitation email has been sent." });
            setIsInviteOpen(false);
            setInviteEmail("");
            setInviteRole("visitor");
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message || "Failed to send invitation.", variant: "destructive" });
        },
    });

    const resendInviteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("POST", `/api/invites/${id}/resend`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
            toast({ title: "Invitation Resent", description: "The invitation has been resent." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message || "Failed to resend invitation.", variant: "destructive" });
        },
    });

    const deleteInviteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/invites/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
            toast({ title: "Invitation Deleted", description: "The invitation has been cancelled." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message || "Failed to delete invitation.", variant: "destructive" });
        },
    });

    const retryEmailMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("POST", `/api/email-logs/${id}/retry`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/email-logs"] });
            toast({ title: "Email Resent", description: "The email has been resent successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message || "Failed to resend email.", variant: "destructive" });
        },
    });

    // Filter login history
    const filteredHistory = loginHistory?.filter(entry => {
        if (historyFilter === "success") return entry.success;
        if (historyFilter === "failed") return !entry.success;
        return true;
    });

    // Filter email logs
    const filteredEmails = emailLogs?.filter(entry => {
        if (emailFilter === "sent") return entry.status === "sent";
        if (emailFilter === "failed") return entry.status === "failed";
        return true;
    });

    // Device icon helper
    const getDeviceIcon = (deviceType: string | null) => {
        switch (deviceType) {
            case "mobile": return <Smartphone className="h-4 w-4" />;
            case "tablet": return <Tablet className="h-4 w-4" />;
            default: return <Monitor className="h-4 w-4" />;
        }
    };

    // Invite status helper
    const getInviteStatus = (invite: UserInvite) => {
        if (invite.acceptedAt) {
            return { label: "Accepted", variant: "default" as const, icon: CheckCircle };
        }
        if (new Date(invite.expiresAt) < new Date()) {
            return { label: "Expired", variant: "destructive" as const, icon: AlertTriangle };
        }
        return { label: "Pending", variant: "secondary" as const, icon: Clock };
    };

    return (
        <div className="space-y-6">
            <SEO
                title="Security Admin"
                description="Manage IP whitelist, view login history, and send user invitations."
            />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Security Admin</h1>
                    <p className="text-muted-foreground">
                        Manage IP whitelist, view login history, and send user invitations
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="ip-whitelist" className="flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        IP Whitelist
                    </TabsTrigger>
                    <TabsTrigger value="login-history" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Login History
                    </TabsTrigger>
                    <TabsTrigger value="email-history" className="flex items-center gap-2">
                        <MailOpen className="h-4 w-4" />
                        Email History
                    </TabsTrigger>
                    <TabsTrigger value="invites" className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        User Invites
                    </TabsTrigger>
                </TabsList>

                {/* IP Whitelist Tab */}
                <TabsContent value="ip-whitelist" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>IP Whitelist</CardTitle>
                                <CardDescription>
                                    {allowedIps?.length === 0
                                        ? "No IPs whitelisted. All IPs are currently allowed."
                                        : `${allowedIps?.length || 0} IP addresses whitelisted`
                                    }
                                </CardDescription>
                            </div>
                            <Dialog open={isAddIpOpen} onOpenChange={setIsAddIpOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add IP
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add IP to Whitelist</DialogTitle>
                                        <DialogDescription>
                                            Add an IP address that will be allowed to access the API.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ip-address">IP Address</Label>
                                            <Input
                                                id="ip-address"
                                                placeholder="e.g., 192.168.1.1"
                                                value={newIpAddress}
                                                onChange={(e) => setNewIpAddress(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ip-description">Description (optional)</Label>
                                            <Textarea
                                                id="ip-description"
                                                placeholder="e.g., Office network"
                                                value={newIpDescription}
                                                onChange={(e) => setNewIpDescription(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAddIpOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={() => addIpMutation.mutate({ ipAddress: newIpAddress, description: newIpDescription })}
                                            disabled={!newIpAddress || addIpMutation.isPending}
                                        >
                                            {addIpMutation.isPending ? "Adding..." : "Add IP"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {ipsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                </div>
                            ) : allowedIps?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-lg font-medium">No IP restrictions</p>
                                    <p className="text-sm text-muted-foreground">
                                        All IP addresses are currently allowed to access the API.
                                        <br />
                                        Add IPs to restrict access.
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>IP Address</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Added</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allowedIps?.map((ip) => (
                                            <TableRow key={ip.id}>
                                                <TableCell className="font-mono">{ip.ipAddress}</TableCell>
                                                <TableCell>{ip.description || "-"}</TableCell>
                                                <TableCell>{format(new Date(ip.createdAt), "MMM d, yyyy")}</TableCell>
                                                <TableCell className="text-right">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Remove IP Address</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to remove {ip.ipAddress} from the whitelist?
                                                                    This IP will no longer be able to access the API.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => deleteIpMutation.mutate(ip.id)}
                                                                    className="bg-destructive text-destructive-foreground"
                                                                >
                                                                    Remove
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Login History Tab */}
                <TabsContent value="login-history" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Login History</CardTitle>
                                <CardDescription>
                                    View all login attempts with detailed information
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={historyFilter === "all" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setHistoryFilter("all")}
                                >
                                    All
                                </Button>
                                <Button
                                    variant={historyFilter === "success" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setHistoryFilter("success")}
                                >
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Success
                                </Button>
                                <Button
                                    variant={historyFilter === "failed" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setHistoryFilter("failed")}
                                >
                                    <XCircle className="mr-1 h-3 w-3" />
                                    Failed
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {historyLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                </div>
                            ) : filteredHistory?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <History className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-lg font-medium">No login history</p>
                                    <p className="text-sm text-muted-foreground">
                                        Login attempts will appear here once users log in.
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Device</TableHead>
                                            <TableHead>IP Address</TableHead>
                                            <TableHead>Browser / OS</TableHead>
                                            <TableHead>Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredHistory?.map((entry) => (
                                            <TableRow key={entry.id}>
                                                <TableCell>
                                                    {entry.success ? (
                                                        <Badge variant="default" className="bg-green-500">
                                                            <CheckCircle className="mr-1 h-3 w-3" />
                                                            Success
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive">
                                                            <XCircle className="mr-1 h-3 w-3" />
                                                            {entry.failureReason?.replace(/_/g, " ") || "Failed"}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>{entry.email}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getDeviceIcon(entry.deviceType)}
                                                        <span className="capitalize">{entry.deviceType || "Unknown"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">{entry.ipAddress || "-"}</TableCell>
                                                <TableCell>
                                                    {entry.browser || "Unknown"} / {entry.os || "Unknown"}
                                                </TableCell>
                                                <TableCell>{format(new Date(entry.createdAt), "MMM d, yyyy HH:mm")}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Email History Tab */}
                <TabsContent value="email-history" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Email History</CardTitle>
                                <CardDescription>
                                    View all emails sent by the system
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={emailFilter === "all" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setEmailFilter("all")}
                                >
                                    All
                                </Button>
                                <Button
                                    variant={emailFilter === "sent" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setEmailFilter("sent")}
                                >
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Sent
                                </Button>
                                <Button
                                    variant={emailFilter === "failed" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setEmailFilter("failed")}
                                >
                                    <XCircle className="mr-1 h-3 w-3" />
                                    Failed
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {emailLogsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                </div>
                            ) : filteredEmails?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <MailOpen className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-lg font-medium">No emails sent</p>
                                    <p className="text-sm text-muted-foreground">
                                        Emails sent by the system will appear here.
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Recipient</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Sent</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredEmails?.map((email) => (
                                            <TableRow key={email.id}>
                                                <TableCell>
                                                    {email.status === "sent" ? (
                                                        <Badge variant="default" className="bg-green-500">
                                                            <CheckCircle className="mr-1 h-3 w-3" />
                                                            Sent
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive">
                                                            <XCircle className="mr-1 h-3 w-3" />
                                                            Failed
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{email.recipientName || "-"}</div>
                                                        <div className="text-xs text-muted-foreground">{email.recipientEmail}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={email.subject}>
                                                    {email.subject}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {email.templateType?.replace(/_/g, " ") || "custom"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{format(new Date(email.createdAt), "MMM d, yyyy HH:mm")}</TableCell>
                                                <TableCell className="text-right">
                                                    {email.status === "failed" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => retryEmailMutation.mutate(email.id)}
                                                            disabled={retryEmailMutation.isPending}
                                                            title="Retry sending"
                                                        >
                                                            <RefreshCw className={`h-4 w-4 ${retryEmailMutation.isPending ? "animate-spin" : ""}`} />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* User Invites Tab */}
                <TabsContent value="invites" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>User Invitations</CardTitle>
                                <CardDescription>
                                    Send invitations to new users to join the platform
                                </CardDescription>
                            </div>
                            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Send Invite
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Invite User</DialogTitle>
                                        <DialogDescription>
                                            Send an invitation email to a new user.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="invite-email">Email Address</Label>
                                            <Input
                                                id="invite-email"
                                                type="email"
                                                placeholder="user@example.com"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="invite-role">Role</Label>
                                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="visitor">Visitor</SelectItem>
                                                    <SelectItem value="guide">Guide</SelectItem>
                                                    <SelectItem value="security">Security</SelectItem>
                                                    <SelectItem value="coordinator">Coordinator</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={() => createInviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                                            disabled={!inviteEmail || createInviteMutation.isPending}
                                        >
                                            {createInviteMutation.isPending ? "Sending..." : "Send Invite"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {invitesLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                </div>
                            ) : invites?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-lg font-medium">No invitations</p>
                                    <p className="text-sm text-muted-foreground">
                                        Send an invitation to add new users to the platform.
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Expires</TableHead>
                                            <TableHead>Sent</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invites?.map((invite) => {
                                            const status = getInviteStatus(invite);
                                            return (
                                                <TableRow key={invite.id}>
                                                    <TableCell>{invite.email}</TableCell>
                                                    <TableCell className="capitalize">{invite.role || "visitor"}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={status.variant}>
                                                            <status.icon className="mr-1 h-3 w-3" />
                                                            {status.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{format(new Date(invite.expiresAt), "MMM d, yyyy")}</TableCell>
                                                    <TableCell>{format(new Date(invite.createdAt), "MMM d, yyyy")}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {!invite.acceptedAt && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => resendInviteMutation.mutate(invite.id)}
                                                                    disabled={resendInviteMutation.isPending}
                                                                >
                                                                    <RefreshCw className={`h-4 w-4 ${resendInviteMutation.isPending ? "animate-spin" : ""}`} />
                                                                </Button>
                                                            )}
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Are you sure you want to delete the invitation for {invite.email}?
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => deleteInviteMutation.mutate(invite.id)}
                                                                            className="bg-destructive text-destructive-foreground"
                                                                        >
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
