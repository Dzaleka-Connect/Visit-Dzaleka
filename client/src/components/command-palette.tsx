import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Command } from "cmdk";
import {
  Home,
  Calendar,
  Users,
  BookOpen,
  Settings,
  User,
  LogOut,
  Search,
  MapPin,
  MessageCircle,
  HelpCircle,
  FileText,
  BarChart3,
  Shield,
  Mail,
  DollarSign,
  Ticket,
  Globe,
  Sparkles,
  Heart,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
  group: "navigation" | "actions" | "admin" | "public";
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  // Toggle command palette with Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      // Also support Escape to close
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = useCallback((path: string) => {
    setLocation(path);
    setOpen(false);
    setSearch("");
  }, [setLocation]);

  const runAction = useCallback((action: () => void) => {
    action();
    setOpen(false);
    setSearch("");
  }, []);

  // Define all available commands
  const commands: CommandItem[] = [
    // Public navigation (always available)
    { id: "home", label: "Go to Home", icon: Home, action: () => navigate("/"), keywords: ["home", "start", "landing"], group: "public" },
    { id: "things-to-do", label: "Things to Do", icon: Sparkles, action: () => navigate("/things-to-do"), keywords: ["activities", "experiences", "tours"], group: "public" },
    { id: "about", label: "About Dzaleka", icon: Globe, action: () => navigate("/about-dzaleka"), keywords: ["about", "info", "history"], group: "public" },
    { id: "blog", label: "Blog", icon: FileText, action: () => navigate("/blog"), keywords: ["articles", "news", "stories"], group: "public" },
    { id: "faq", label: "FAQ", icon: HelpCircle, action: () => navigate("/faq"), keywords: ["questions", "help", "support"], group: "public" },
    { id: "contact", label: "Contact Us", icon: Mail, action: () => navigate("/contact"), keywords: ["contact", "email", "support"], group: "public" },
    { id: "accommodation", label: "Accommodation", icon: MapPin, action: () => navigate("/accommodation"), keywords: ["stay", "hotel", "homestay"], group: "public" },
    { id: "support", label: "Support Our Work", icon: Heart, action: () => navigate("/support-our-work"), keywords: ["donate", "help", "support"], group: "public" },

    // Authenticated navigation
    ...(isAuthenticated ? [
      { id: "dashboard", label: "Dashboard", icon: Home, shortcut: "G D", action: () => navigate("/"), keywords: ["dashboard", "home", "overview"], group: "navigation" as const },
      { id: "bookings", label: "Bookings", icon: Ticket, shortcut: "G B", action: () => navigate("/bookings"), keywords: ["bookings", "reservations", "tours"], group: "navigation" as const },
      { id: "calendar", label: "Calendar", icon: Calendar, shortcut: "G C", action: () => navigate("/calendar"), keywords: ["calendar", "schedule", "dates"], group: "navigation" as const },
      { id: "messages", label: "Messages", icon: MessageCircle, shortcut: "G M", action: () => navigate("/messages"), keywords: ["messages", "chat", "inbox"], group: "navigation" as const },
      { id: "profile", label: "My Profile", icon: User, shortcut: "G P", action: () => navigate("/profile"), keywords: ["profile", "account", "me"], group: "navigation" as const },
      { id: "settings", label: "Settings", icon: Settings, shortcut: "G S", action: () => navigate("/settings"), keywords: ["settings", "preferences", "config"], group: "navigation" as const },
      { id: "help", label: "Help Center", icon: HelpCircle, action: () => navigate("/help"), keywords: ["help", "support", "docs"], group: "navigation" as const },
    ] : []),

    // Admin-only commands
    ...(user?.role === "admin" ? [
      { id: "users", label: "User Management", icon: Users, action: () => navigate("/users"), keywords: ["users", "accounts", "manage"], group: "admin" as const },
      { id: "analytics", label: "Analytics", icon: BarChart3, action: () => navigate("/analytics"), keywords: ["analytics", "stats", "reports"], group: "admin" as const },
      { id: "revenue", label: "Revenue", icon: DollarSign, action: () => navigate("/revenue"), keywords: ["revenue", "money", "income"], group: "admin" as const },
      { id: "guides", label: "Manage Guides", icon: Users, action: () => navigate("/guides"), keywords: ["guides", "staff", "team"], group: "admin" as const },
      { id: "cms", label: "Content Management", icon: FileText, action: () => navigate("/cms"), keywords: ["cms", "content", "pages"], group: "admin" as const },
      { id: "security-admin", label: "Security Settings", icon: Shield, action: () => navigate("/security-admin"), keywords: ["security", "permissions"], group: "admin" as const },
      { id: "audit-logs", label: "Audit Logs", icon: BookOpen, action: () => navigate("/audit-logs"), keywords: ["logs", "audit", "history"], group: "admin" as const },
    ] : []),

    // Actions
    ...(isAuthenticated ? [
      { id: "logout", label: "Sign Out", icon: LogOut, action: () => runAction(logout), keywords: ["logout", "signout", "exit"], group: "actions" as const },
    ] : [
      { id: "login", label: "Sign In", icon: User, action: () => navigate("/login"), keywords: ["login", "signin", "auth"], group: "actions" as const },
    ]),
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter((cmd) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some((kw) => kw.includes(searchLower))
    );
  });

  // Group commands
  const groupedCommands = {
    navigation: filteredCommands.filter((c) => c.group === "navigation"),
    public: filteredCommands.filter((c) => c.group === "public"),
    admin: filteredCommands.filter((c) => c.group === "admin"),
    actions: filteredCommands.filter((c) => c.group === "actions"),
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-[640px]">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search…"
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {groupedCommands.navigation.length > 0 && (
              <Command.Group heading="Navigation">
                {groupedCommands.navigation.map((cmd) => (
                  <CommandItem key={cmd.id} item={cmd} onSelect={() => cmd.action()} />
                ))}
              </Command.Group>
            )}

            {groupedCommands.public.length > 0 && (
              <Command.Group heading="Pages">
                {groupedCommands.public.map((cmd) => (
                  <CommandItem key={cmd.id} item={cmd} onSelect={() => cmd.action()} />
                ))}
              </Command.Group>
            )}

            {groupedCommands.admin.length > 0 && (
              <Command.Group heading="Admin">
                {groupedCommands.admin.map((cmd) => (
                  <CommandItem key={cmd.id} item={cmd} onSelect={() => cmd.action()} />
                ))}
              </Command.Group>
            )}

            {groupedCommands.actions.length > 0 && (
              <Command.Group heading="Actions">
                {groupedCommands.actions.map((cmd) => (
                  <CommandItem key={cmd.id} item={cmd} onSelect={() => cmd.action()} />
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandItem({ item, onSelect }: { item: CommandItem; onSelect: () => void }) {
  return (
    <Command.Item
      value={item.id}
      onSelect={onSelect}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none",
        "aria-selected:bg-accent aria-selected:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
      )}
    >
      <item.icon className="mr-3 h-4 w-4 text-muted-foreground" />
      <span>{item.label}</span>
      {item.shortcut && (
        <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
          {item.shortcut}
        </kbd>
      )}
    </Command.Item>
  );
}

// Optional: Button to trigger command palette
export function CommandPaletteTrigger({ className }: { className?: string }) {
  const [, setOpen] = useState(false);

  const handleClick = () => {
    // Simulate Cmd+K press to open palette
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors",
        className
      )}
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search…</span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}
