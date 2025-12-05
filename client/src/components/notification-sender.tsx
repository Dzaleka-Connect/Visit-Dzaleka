import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Send,
    Users,
    User as UserIcon,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface SendNotificationData {
    title: string;
    message: string;
    link?: string;
    userIds?: string[];
    sendToAll?: boolean;
    role?: string;
}

export function NotificationSender() {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [link, setLink] = useState("");
    const [targetType, setTargetType] = useState<"all" | "role" | "specific">("all");
    const [selectedRole, setSelectedRole] = useState<string>("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch users for specific selection
    const { data: users } = useQuery<User[]>({
        queryKey: ["/api/users"],
    });

    const sendMutation = useMutation({
        mutationFn: async (data: SendNotificationData) => {
            const res = await apiRequest("POST", "/api/notifications/send", data);
            return await res.json();
        },
        onSuccess: (data: any) => {
            toast({
                title: "Notifications Sent",
                description: `Successfully sent to ${data.sentCount} of ${data.totalTargeted} users`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            setOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast({
                title: "Failed to send",
                description: error.message || "Could not send notifications",
                variant: "destructive",
            });
        },
    });

    const resetForm = () => {
        setTitle("");
        setMessage("");
        setLink("");
        setTargetType("all");
        setSelectedRole("");
        setSelectedUsers([]);
    };

    const handleSubmit = () => {
        if (!title.trim() || !message.trim()) {
            toast({
                title: "Validation Error",
                description: "Title and message are required",
                variant: "destructive",
            });
            return;
        }

        const data: SendNotificationData = {
            title: title.trim(),
            message: message.trim(),
            link: link.trim() || undefined,
        };

        if (targetType === "all") {
            data.sendToAll = true;
        } else if (targetType === "role") {
            if (!selectedRole) {
                toast({
                    title: "Validation Error",
                    description: "Please select a role",
                    variant: "destructive",
                });
                return;
            }
            data.role = selectedRole;
        } else if (targetType === "specific") {
            if (selectedUsers.length === 0) {
                toast({
                    title: "Validation Error",
                    description: "Please select at least one user",
                    variant: "destructive",
                });
                return;
            }
            data.userIds = selectedUsers;
        }

        sendMutation.mutate(data);
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const activeUsers = users?.filter((u) => u.isActive) || [];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Send className="h-4 w-4" />
                    Send Notification
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Send Custom Notification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="Notification title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            placeholder="Notification message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Link (optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="link">Link (optional)</Label>
                        <Input
                            id="link"
                            placeholder="/bookings or external URL..."
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                        />
                    </div>

                    {/* Target Selection */}
                    <div className="space-y-3">
                        <Label>Send To</Label>
                        <RadioGroup
                            value={targetType}
                            onValueChange={(val) => setTargetType(val as any)}
                            className="flex flex-col gap-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="all" id="all" />
                                <label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                                    <Users className="h-4 w-4" />
                                    All Active Users
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="role" id="role" />
                                <label htmlFor="role" className="flex items-center gap-2 cursor-pointer">
                                    <UserIcon className="h-4 w-4" />
                                    By Role
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="specific" id="specific" />
                                <label htmlFor="specific" className="flex items-center gap-2 cursor-pointer">
                                    <CheckCircle className="h-4 w-4" />
                                    Specific Users
                                </label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Role Selection */}
                    {targetType === "role" && (
                        <div className="space-y-2">
                            <Label>Select Role</Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose role..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admins</SelectItem>
                                    <SelectItem value="coordinator">Coordinators</SelectItem>
                                    <SelectItem value="guide">Guides</SelectItem>
                                    <SelectItem value="security">Security</SelectItem>
                                    <SelectItem value="visitor">Visitors</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* User Multi-Select */}
                    {targetType === "specific" && (
                        <div className="space-y-2">
                            <Label>Select Users ({selectedUsers.length} selected)</Label>
                            <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                                {activeUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${selectedUsers.includes(user.id)
                                            ? "bg-primary/10 border border-primary/30"
                                            : "hover:bg-muted"
                                            }`}
                                        onClick={() => toggleUserSelection(user.id)}
                                    >
                                        <div
                                            className={`h-4 w-4 rounded border flex items-center justify-center ${selectedUsers.includes(user.id)
                                                ? "bg-primary border-primary"
                                                : "border-gray-300"
                                                }`}
                                        >
                                            {selectedUsers.includes(user.id) && (
                                                <CheckCircle className="h-3 w-3 text-white" />
                                            )}
                                        </div>
                                        <span className="text-sm">
                                            {user.firstName} {user.lastName}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-auto">
                                            {user.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={sendMutation.isPending}
                    >
                        {sendMutation.isPending ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Sending...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Send className="h-4 w-4" />
                                Send Notification
                            </div>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
