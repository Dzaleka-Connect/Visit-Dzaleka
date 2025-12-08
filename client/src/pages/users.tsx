import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Users,
  Shield,
  UserCog,
  MapPin,
  Eye,
  Search,
  Plus,
  UserPlus,
  Trash2,
  Power,
  MoreVertical,
  Key,
  Mail,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User, UserRole } from "@shared/schema";

interface UserStats {
  totalUsers: number;
  byRole: Record<string, number>;
}

const roleColors: Record<string, { bg: string; text: string; icon: any }> = {
  admin: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-400",
    icon: Shield,
  },
  coordinator: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-800 dark:text-purple-400",
    icon: UserCog,
  },
  guide: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-400",
    icon: MapPin,
  },
  security: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-800 dark:text-orange-400",
    icon: Shield,
  },
  visitor: {
    bg: "bg-gray-100 dark:bg-gray-900/30",
    text: "text-gray-800 dark:text-gray-400",
    icon: Eye,
  },
};

const roleDescriptions: Record<string, string> = {
  admin: "Full system access, user management, all settings",
  coordinator: "Booking management, guide assignment, reports",
  guide: "View assigned tours, update tour status",
  security: "Check-in/out, incident reporting, visitor verification",
  visitor: "View own bookings, submit booking requests",
};

function RoleBadge({ role }: { role: string }) {
  const config = roleColors[role] || roleColors.visitor;
  const Icon = config.icon;
  return (
    <Badge className={`${config.bg} ${config.text}`}>
      <Icon className="mr-1 h-3 w-3" />
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
}



export default function UsersPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "visitor" as UserRole,
  });

  const { data: usersList, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user-stats"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof newUser) => {
      return apiRequest("POST", "/api/auth/create-user", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-stats"] });
      toast({
        title: "User Created",
        description: "New user has been created successfully.",
      });
      setCreateUserOpen(false);
      setNewUser({ email: "", password: "", firstName: "", lastName: "", role: "visitor" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user.",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-stats"] });
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("PATCH", `/api/users/${userId}/toggle-active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-stats"] });
      toast({
        title: "Status Updated",
        description: "User status has been toggled successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to toggle user status.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-stats"] });
      toast({
        title: "User Deactivated",
        description: "User has been deactivated successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate user.",
        variant: "destructive",
      });
    },
  });

  // Admin: Reset password directly
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      await apiRequest("POST", `/api/users/${userId}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Password Reset",
        description: "User password has been reset successfully.",
      });
      setResetPasswordDialog({ open: false, userId: null });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password.",
        variant: "destructive",
      });
    },
  });

  // Admin: Verify email
  const verifyEmailMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", `/api/users/${userId}/verify-email`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Email Verified",
        description: "User email has been verified successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to verify email.",
        variant: "destructive",
      });
    },
  });

  // Admin: Send password reset email
  const sendResetEmailMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", `/api/users/${userId}/send-reset-email`);
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Password reset email has been sent to the user.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email.",
        variant: "destructive",
      });
    },
  });

  // State for reset password dialog
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; userId: string | null }>({
    open: false,
    userId: null,
  });
  const [newPassword, setNewPassword] = useState("");

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const filteredUsers = usersList?.filter((user) => {
    const matchesSearch =
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleCounts = usersList?.reduce(
    (acc, user) => {
      const role = user.role || "visitor";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions across the system.
          </p>
        </div>
        <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-user">
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system with a specific role.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={newUser.firstName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, firstName: e.target.value })
                    }
                    data-testid="input-new-user-firstname"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={newUser.lastName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, lastName: e.target.value })
                    }
                    data-testid="input-new-user-lastname"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  data-testid="input-new-user-email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  data-testid="input-new-user-password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: UserRole) =>
                    setNewUser({ ...newUser, role: value })
                  }
                >
                  <SelectTrigger data-testid="select-new-user-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="coordinator">Coordinator</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="visitor">Visitor</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {roleDescriptions[newUser.role]}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setCreateUserOpen(false)}
                data-testid="button-cancel-create-user"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={createUserMutation.isPending}
                data-testid="button-submit-create-user"
              >
                {createUserMutation.isPending ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {(["admin", "coordinator", "guide", "security", "visitor"] as const).map(
          (role) => {
            const config = roleColors[role];
            const Icon = config.icon;
            return (
              <Card
                key={role}
                className={`cursor-pointer transition-all ${roleFilter === role ? "ring-2 ring-primary" : ""
                  }`}
                onClick={() =>
                  setRoleFilter(roleFilter === role ? "all" : role)
                }
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`rounded-full p-2 ${config.bg}`}>
                    <Icon className={`h-4 w-4 ${config.text}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{roleCounts[role] || 0}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {role}s
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          }
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>All Users</CardTitle>
            <div className="flex gap-4">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-users"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40" data-testid="select-role-filter">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                  <SelectItem value="guide">Guide</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="visitor">Visitor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading users...</p>
          ) : !filteredUsers || filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users found"
              description={
                searchQuery || roleFilter !== "all"
                  ? "Try adjusting your filters."
                  : "No users have registered yet."
              }
              className="py-8"
            />
          ) : (
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profileImageUrl || undefined} />
                            <AvatarFallback>
                              {user.firstName?.charAt(0) || "U"}
                              {user.lastName?.charAt(0) || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>
                        <RoleBadge role={user.role || "visitor"} />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "default" : "secondary"}
                          className={
                            user.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : ""
                          }
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-user-actions-${user.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                            {(
                              [
                                "admin",
                                "coordinator",
                                "guide",
                                "security",
                                "visitor",
                              ] as const
                            ).map((role) => (
                              <DropdownMenuItem
                                key={role}
                                onClick={() =>
                                  updateRoleMutation.mutate({
                                    userId: user.id,
                                    role,
                                  })
                                }
                                disabled={user.role === role}
                                className="cursor-pointer"
                              >
                                <RoleBadge role={role} />
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => toggleActiveMutation.mutate(user.id)}
                              className="cursor-pointer"
                            >
                              <Power className="mr-2 h-4 w-4" />
                              {user.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setResetPasswordDialog({ open: true, userId: user.id });
                                setNewPassword("");
                              }}
                              className="cursor-pointer"
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Set Password
                            </DropdownMenuItem>
                            {!user.emailVerified && (
                              <DropdownMenuItem
                                onClick={() => verifyEmailMutation.mutate(user.id)}
                                className="cursor-pointer"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Verify Email
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => sendResetEmailMutation.mutate(user.id)}
                              className="cursor-pointer"
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Send Reset Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}? This will deactivate the user.`)) {
                                  deleteUserMutation.mutate(user.id);
                                }
                              }}
                              className="cursor-pointer text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(roleDescriptions).map(([role, description]) => {
              const config = roleColors[role];
              const Icon = config.icon;
              return (
                <div
                  key={role}
                  className="flex items-start gap-3 rounded-lg border p-4"
                >
                  <div className={`rounded-full p-2 ${config.bg}`}>
                    <Icon className={`h-4 w-4 ${config.text}`} />
                  </div>
                  <div>
                    <p className="font-medium capitalize">{role}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Password Reset Dialog */}
      <Dialog open={resetPasswordDialog.open} onOpenChange={(open) => setResetPasswordDialog({ ...resetPasswordDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set User Password</DialogTitle>
            <DialogDescription>
              Enter a new password for this user. They will need to use this password to log in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setResetPasswordDialog({ open: false, userId: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (resetPasswordDialog.userId && newPassword.length >= 6) {
                  resetPasswordMutation.mutate({
                    userId: resetPasswordDialog.userId,
                    newPassword,
                  });
                }
              }}
              disabled={newPassword.length < 6 || resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Set Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
