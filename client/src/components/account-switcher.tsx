import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, ChevronDown, Search, X, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export function AccountSwitcher() {
    const { user, isImpersonating, stopImpersonation, isStoppingImpersonation } = useAuth();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    // Only show for admins (or when impersonating)
    if (!user || (user.role !== "admin" && !isImpersonating)) {
        return null;
    }

    // Fetch all users for admin
    const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
        queryKey: ["/api/users"],
        enabled: user.role === "admin" || isImpersonating,
    });

    const impersonateMutation = useMutation({
        mutationFn: async (userId: string) => {
            const response = await apiRequest("POST", `/api/admin/impersonate/${userId}`);
            return response.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Impersonating User",
                description: `Now viewing as ${data.user.firstName} ${data.user.lastName}`,
            });
            // Force a full page reload to ensure all data refreshes with new user context
            window.location.href = "/";
        },
        onError: (error: Error) => {
            toast({
                title: "Impersonation Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const filteredUsers = users.filter((u) => {
        if (u.role === "admin") return false; // Can't impersonate admins
        if (u.id === user.id) return false; // Can't impersonate self
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        return (
            u.email?.toLowerCase().includes(searchLower) ||
            u.firstName?.toLowerCase().includes(searchLower) ||
            u.lastName?.toLowerCase().includes(searchLower)
        );
    });

    const getInitials = (firstName?: string | null, lastName?: string | null) => {
        return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "?";
    };

    // If impersonating, show a prominent banner
    if (isImpersonating) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <Eye className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    Viewing as {user.firstName}
                </span>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs ml-auto border-amber-500/30 hover:bg-amber-500/20"
                    onClick={() => stopImpersonation()}
                    disabled={isStoppingImpersonation}
                >
                    {isStoppingImpersonation ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <>
                            <X className="h-3 w-3 mr-1" />
                            Exit
                        </>
                    )}
                </Button>
            </div>
        );
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Switch User</span>
                    <ChevronDown className="h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Impersonate User</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-8"
                        />
                    </div>
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-64 overflow-y-auto">
                    {isLoadingUsers ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            No users found
                        </div>
                    ) : (
                        filteredUsers.slice(0, 10).map((u) => (
                            <DropdownMenuItem
                                key={u.id}
                                onClick={() => impersonateMutation.mutate(u.id)}
                                disabled={impersonateMutation.isPending}
                                className="flex items-center gap-3 py-2"
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={u.profileImageUrl || undefined} />
                                    <AvatarFallback className="text-xs">
                                        {getInitials(u.firstName, u.lastName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                        {u.firstName} {u.lastName}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {u.email}
                                    </div>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                                    {u.role}
                                </span>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
                {filteredUsers.length > 10 && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-2 text-center text-xs text-muted-foreground">
                            Showing 10 of {filteredUsers.length} users
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
