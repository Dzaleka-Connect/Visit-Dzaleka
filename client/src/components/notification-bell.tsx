import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Link, useLocation } from "wouter";
import {
    Bell,
    Check,
    CheckCheck,
    Calendar,
    UserCheck,
    CreditCard,
    Shield,
    AlertCircle,
    X,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const notificationIcons: Record<string, React.ElementType> = {
    booking_created: Calendar,
    booking_confirmed: Check,
    booking_cancelled: X,
    booking_completed: CheckCheck,
    guide_assigned: UserCheck,
    check_in: Shield,
    check_out: Shield,
    payment_received: CreditCard,
    payment_verified: CreditCard,
    system: AlertCircle,
};

const notificationColors: Record<string, string> = {
    booking_created: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    booking_confirmed: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    booking_cancelled: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    booking_completed: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    guide_assigned: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    check_in: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    check_out: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    payment_received: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    payment_verified: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    system: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
};

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch unread count
    const { data: countData } = useQuery<{ count: number }>({
        queryKey: ["/api/notifications/unread-count"],
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    // Fetch notifications
    const { data: notifications, isLoading } = useQuery<Notification[]>({
        queryKey: ["/api/notifications"],
        enabled: open,
    });

    // Mark single as read
    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiRequest("PATCH", `/api/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
        },
    });

    // Mark all as read
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            return apiRequest("PATCH", "/api/notifications/mark-all-read");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
            toast({ title: "All notifications marked as read" });
        },
    });

    // Delete notification
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiRequest("DELETE", `/api/notifications/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
        },
    });

    const unreadCount = countData?.count || 0;

    const [, setLocation] = useLocation();

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsReadMutation.mutate(notification.id);
        }
        setOpen(false);
        if (notification.link) {
            setLocation(notification.link);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    data-testid="notification-bell"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white hover:bg-red-600 border-2 border-background shadow-sm"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAllAsReadMutation.mutate()}
                            disabled={markAllAsReadMutation.isPending}
                            className="text-xs h-7"
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : !notifications || notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => {
                                const Icon = notificationIcons[notification.type] || AlertCircle;
                                const colorClass = notificationColors[notification.type] || notificationColors.system;

                                return (
                                    <div
                                        key={notification.id}
                                        className={`group relative flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                                            }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-medium leading-tight flex items-center gap-2 ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                                                    {notification.title}
                                                    {notification.link && <ExternalLink className="h-3 w-3 opacity-50" />}
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteMutation.mutate(notification.id);
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5 break-words">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                {notification.createdAt
                                                    ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                                                    : "Just now"}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
