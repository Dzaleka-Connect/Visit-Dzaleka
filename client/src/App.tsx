import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeSubscriptions } from "@/hooks/useRealtime";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import ResetPassword from "@/pages/reset-password";
import VerifyEmail from "@/pages/verify-email";
import Dashboard from "@/pages/dashboard";
import Bookings from "@/pages/bookings";
import BookingDetails from "@/pages/booking-details";
import MyBookings from "@/pages/my-bookings";
import Guides from "@/pages/guides";
import GuideProfile from "@/pages/guide-profile";
import CalendarPage from "@/pages/calendar";
import ChannelManager from "@/pages/channel-manager";
import GuidePerformance from "@/pages/guide-performance";
import Zones from "@/pages/zones";
import Security from "@/pages/security";
import UsersPage from "@/pages/users";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import EmailHistory from "@/pages/email-history";
import EmailSettings from "@/pages/email-settings";
import Revenue from "@/pages/revenue";
import AuditLogs from "@/pages/audit-logs";
import Visitors from "@/pages/visitors";
import Landing from "@/pages/landing";
import CMSPage from "@/pages/cms";
import SecurityAdmin from "@/pages/security-admin";
import AcceptInvite from "@/pages/accept-invite";
import GuideTraining from "@/pages/guide-training";
import TrainingAdmin from "@/pages/training-admin";
import VisitorResources from "@/pages/visitor-resources";
import Tasks from "@/pages/tasks";
import TaskAdmin from "@/pages/task-admin";
import Messages from "@/pages/messages";
import HelpCenter from "@/pages/help-center";
import HelpAdmin from "@/pages/help-admin";
import RecurringBookingsPage from "@/pages/recurring-bookings";
import LiveOperations from "@/pages/live-ops";
import CustomersPage from "@/pages/customers";
import CustomerProfile from "@/pages/customer-profile";
import Analytics from "@/pages/analytics";
import DeveloperSettings from "@/pages/developer-settings";
import EmbedBooking from "@/pages/embed-booking";
import CommunityHub from "@/pages/community-hub";
import { usePageTracker } from "@/hooks/usePageTracker";


function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  // Enable real-time subscriptions for the authenticated user
  useRealtimeSubscriptions();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-background px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Track page views for analytics
  usePageTracker();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Embed routes should be accessible without authenticated layout
  const path = window.location.pathname;
  if (path.startsWith("/embed/")) {
    return (
      <Switch>
        <Route path="/embed/booking" component={EmbedBooking} />
      </Switch>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={AuthPage} />
        <Route path="/landing" component={Landing} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/accept-invite" component={AcceptInvite} />
        <Route path="/embed/booking" component={EmbedBooking} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return (
    <AuthenticatedLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/bookings" component={Bookings} />
        <Route path="/bookings/:id" component={BookingDetails} />
        <Route path="/recurring-bookings" component={RecurringBookingsPage} />
        <Route path="/my-bookings" component={MyBookings} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/channel-manager" component={ChannelManager} />
        <Route path="/guide-performance" component={GuidePerformance} />
        <Route path="/guides" component={Guides} />
        <Route path="/guide/:slug" component={GuideProfile} />
        <Route path="/guide-training" component={GuideTraining} />
        <Route path="/training-admin" component={TrainingAdmin} />
        <Route path="/zones" component={Zones} />
        <Route path="/security" component={Security} />
        <Route path="/users" component={UsersPage} />
        <Route path="/settings" component={Settings} />
        <Route path="/profile" component={Profile} />
        <Route path="/send-email" component={EmailHistory} />
        <Route path="/email-settings" component={EmailSettings} />
        <Route path="/revenue" component={Revenue} />
        <Route path="/visitors" component={Visitors} />
        <Route path="/audit-logs" component={AuditLogs} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/cms" component={CMSPage} />
        <Route path="/security-admin" component={SecurityAdmin} />
        <Route path="/resources" component={VisitorResources} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/task-admin" component={TaskAdmin} />
        <Route path="/messages" component={Messages} />
        <Route path="/live-ops" component={LiveOperations} />
        <Route path="/customers" component={CustomersPage} />
        <Route path="/customers/:id" component={CustomerProfile} />
        <Route path="/help" component={HelpCenter} />
        <Route path="/help-admin" component={HelpAdmin} />
        <Route path="/developer" component={DeveloperSettings} />
        <Route path="/community" component={CommunityHub} />
        <Route path="/landing" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
