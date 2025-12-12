import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BookOpen,
  Settings,
  LogOut,
  MapPin,
  Shield,
  UserCog,
  Ticket,
  User,
  Mail,
  DollarSign,
  FileText,
  TrendingUp,
  GraduationCap,
  ListTodo,
  MessageCircle,
  HelpCircle,
  CalendarRange,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import type { LucideIcon } from "lucide-react";

type UserRole = "admin" | "coordinator" | "guide" | "security" | "visitor";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  roles: UserRole[];
}

const mainNavigationItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    roles: ["admin", "coordinator", "guide", "security", "visitor"],
  },
  {
    title: "Bookings",
    url: "/bookings",
    icon: BookOpen,
    roles: ["admin", "coordinator"],
  },
  {
    title: "Recurring",
    url: "/recurring-bookings",
    icon: CalendarRange,
    roles: ["admin", "coordinator"],
  },
  {
    title: "My Bookings",
    url: "/my-bookings",
    icon: Ticket,
    roles: ["visitor"],
  },
  {
    title: "Learning Center",
    url: "/resources",
    icon: BookOpen,
    roles: ["visitor"],
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: CalendarDays,
    roles: ["admin", "coordinator", "guide"],
  },
  {
    title: "Guides",
    url: "/guides",
    icon: Users,
    roles: ["admin", "coordinator"],
  },
  {
    title: "Guide Performance",
    url: "/guide-performance",
    icon: TrendingUp,
    roles: ["admin", "coordinator"],
  },
  {
    title: "Zones & POI",
    url: "/zones",
    icon: MapPin,
    roles: ["admin", "coordinator"],
  },
  {
    title: "Visitors",
    url: "/visitors",
    icon: Users,
    roles: ["admin", "coordinator"],
  },
  {
    title: "Guide Training",
    url: "/guide-training",
    icon: GraduationCap,
    roles: ["guide"],
  },
  {
    title: "My Tasks",
    url: "/tasks",
    icon: ListTodo,
    roles: ["admin", "coordinator", "guide", "security"],
  },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageCircle,
    roles: ["admin", "coordinator", "guide", "security", "visitor"],
  },
  {
    title: "Help Center",
    url: "/help",
    icon: HelpCircle,
    roles: ["visitor", "guide"],
  },
];

const financeItems: NavItem[] = [
  {
    title: "Revenue",
    url: "/revenue",
    icon: DollarSign,
    roles: ["admin", "coordinator"],
  },
];

const operationsItems: NavItem[] = [
  {
    title: "Security",
    url: "/security",
    icon: Shield,
    roles: ["admin", "coordinator", "security"],
  },
  {
    title: "Security Admin",
    url: "/security-admin",
    icon: Shield,
    roles: ["admin"],
  },
  {
    title: "Send Email",
    url: "/send-email",
    icon: Mail,
    roles: ["admin", "coordinator"],
  },
  {
    title: "Email Templates",
    url: "/email-settings",
    icon: Settings,
    roles: ["admin"],
  },
  {
    title: "Audit Logs",
    url: "/audit-logs",
    icon: FileText,
    roles: ["admin"],
  },
  {
    title: "Training Management",
    url: "/training-admin",
    icon: BookOpen,
    roles: ["admin"],
  },
  {
    title: "Task Admin",
    url: "/task-admin",
    icon: ListTodo,
    roles: ["admin", "coordinator"],
  },
  {
    title: "Help Admin",
    url: "/help-admin",
    icon: HelpCircle,
    roles: ["admin"],
  },
];

const adminItems: NavItem[] = [
  {
    title: "User Management",
    url: "/users",
    icon: UserCog,
    roles: ["admin"],
  },
  {
    title: "Content Management",
    url: "/cms",
    icon: FileText,
    roles: ["admin"],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ["admin"],
  },
  {
    title: "My Profile",
    url: "/profile",
    icon: User,
    roles: ["admin", "coordinator", "guide", "security", "visitor"],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout, isLoggingOut } = useAuth();

  // Fetch pending task count for badge
  const { data: tasks } = useQuery<{ id: string; status: string }[]>({
    queryKey: ["/api/tasks"],
    enabled: !!user && user.role !== "visitor",
  });

  // Fetch pending bookings count for badge
  const { data: bookings } = useQuery<{ id: string; status: string }[]>({
    queryKey: ["/api/bookings"],
    enabled: !!user && (user.role === "admin" || user.role === "coordinator"),
  });

  // Fetch unread chat count
  const { data: chatCount } = useQuery<{ count: number }>({
    queryKey: ["/api/chat/unread-count"],
    enabled: !!user,
    refetchInterval: 10000, // Poll every 10s for faster updates
  });

  const pendingTaskCount = tasks?.filter(t => t.status === "pending" || t.status === "in_progress").length || 0;
  const pendingBookingCount = bookings?.filter(b => b.status === "pending").length || 0;
  const unreadChatCount = chatCount?.count || 0;

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "AD";
  };

  const userRole = (user?.role || "visitor") as UserRole;

  const filterByRole = (items: NavItem[]) =>
    items.filter((item) => item.roles.includes(userRole));

  const filteredMainItems = filterByRole(mainNavigationItems);
  const filteredFinanceItems = filterByRole(financeItems);
  const filteredOperationsItems = filterByRole(operationsItems);
  const filteredAdminItems = filterByRole(adminItems);

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    coordinator: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    guide: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    security: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    visitor: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">
              Visit Dzaleka
            </span>
            <span className="text-xs text-muted-foreground">Dashboard</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainItems.map((item) => {
                const isActive = location === item.url;
                const showTaskBadge = item.title === "My Tasks" && pendingTaskCount > 0;
                const showBookingBadge = item.title === "Bookings" && pendingBookingCount > 0;
                const showChatBadge = item.title === "Messages" && unreadChatCount > 0;

                let badgeCount = 0;
                if (showTaskBadge) badgeCount = pendingTaskCount;
                else if (showBookingBadge) badgeCount = pendingBookingCount;
                else if (showChatBadge) badgeCount = unreadChatCount;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      className={isActive ? "bg-sidebar-accent" : ""}
                    >
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {(showTaskBadge || showBookingBadge || showChatBadge) && (
                          <Badge
                            variant="default"
                            className={`ml-auto h-5 min-w-5 shrink-0 rounded-full px-1.5 flex items-center justify-center text-[10px] font-bold ${showBookingBadge ? "bg-orange-500 hover:bg-orange-600" : "bg-primary hover:bg-primary/90"}`}
                          >
                            {badgeCount > 9 ? "9+" : badgeCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredFinanceItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Finance</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredFinanceItems.map((item) => {
                  const isActive = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        data-active={isActive}
                        className={isActive ? "bg-sidebar-accent" : ""}
                      >
                        <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredOperationsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredOperationsItems.map((item) => {
                  const isActive = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        data-active={isActive}
                        className={isActive ? "bg-sidebar-accent" : ""}
                      >
                        <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{userRole === "admin" ? "Administration" : "Account"}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdminItems.map((item) => {
                  const isActive = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        data-active={isActive}
                        className={isActive ? "bg-sidebar-accent" : ""}
                      >
                        <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user?.profileImageUrl || undefined}
              alt={`${user?.firstName || "Admin"}'s avatar`}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {user?.firstName
                ? `${user.firstName} ${user.lastName || ""}`.trim()
                : "Admin User"}
            </span>
            <Badge className={`w-fit text-[10px] ${roleColors[userRole]}`} data-testid="user-role-badge">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={logout}
            disabled={isLoggingOut}
            data-testid="button-logout"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
