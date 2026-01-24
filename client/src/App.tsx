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
import { ProtectedRoute } from "@/lib/protected-route";
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
import DTDWGuide from "@/pages/dtdw-guide";
import OperationsManual from "@/pages/operations-manual";
import StandardOperatingProcedures from "@/pages/standard-operating-procedures";
import InternalPolicies from "@/pages/internal-policies";
import MarketingStrategy from "@/pages/marketing-strategy";
import ContinuousImprovement from "@/pages/continuous-improvement";
import FinancialFramework from "@/pages/financial-framework";
import TrainingAdmin from "@/pages/training-admin";
import ThingsToDo from "@/pages/things-to-do";
import ArtsCulture from "@/pages/arts-culture";
import ShoppingMarkets from "@/pages/shopping";
import SportsRecreation from "@/pages/sports-recreation";
import HostCommunity from "@/pages/host-community";
import WhatsOn from "@/pages/whats-on";
import PlanYourTrip from "@/pages/plan-your-trip";
import VisitorEssentials from "@/pages/visitor-essentials";
import LifeInDzaleka from "@/pages/life-in-dzaleka";
import AboutDzaleka from "@/pages/about-dzaleka";
import AboutUs from "@/pages/about-us";
import FriendsOfDzaleka from "@/pages/friends-of-dzaleka";
import ImpactReport from "@/pages/impact-report";
import ImpactReportView from "@/pages/impact-report-view";
import ContactUs from "@/pages/contact";
import ITCodeOfPractice from "@/pages/it-code-of-practice";
import Accommodation from "@/pages/accommodation";
import VisitorResources from "@/pages/visitor-resources";
import Tasks from "@/pages/tasks";
import TaskAdmin from "@/pages/task-admin";
import Messages from "@/pages/messages";
import HelpCenter from "@/pages/help-center";
import HelpAdmin from "@/pages/help-admin";
import ItineraryBuilder from "@/pages/itinerary-builder";
import ItineraryView from "@/pages/itinerary-view";
import SharePhotos from "@/pages/share-photos";
import RecurringBookingsPage from "@/pages/recurring-bookings";
import LiveOperations from "@/pages/live-ops";
import MyTours from "@/pages/my-tours";
import MyEarnings from "@/pages/my-earnings";
import MyAvailability from "@/pages/my-availability";
import SavedItineraries from "@/pages/saved-itineraries";
import FavoriteGuides from "@/pages/favorite-guides";
import CustomersPage from "@/pages/customers";
import CustomerProfile from "@/pages/customer-profile";
import Analytics from "@/pages/analytics";
import Reports from "@/pages/reports";
import DeveloperSettings from "@/pages/developer-settings";
import EmbedBooking from "@/pages/embed-booking";
import CommunityHub from "@/pages/community-hub";
import BlogList from "@/pages/blog";
import BlogPostPage from "@/pages/blog-post";
import AdminBlog from "@/pages/admin-blog";
import AdminBlogEditor from "@/pages/admin-blog-editor";
import Unauthorized from "@/pages/unauthorized";
import Disclaimer from "@/pages/disclaimer";
import CookieNotice from "@/pages/cookie-notice";
import PartnerWithUs from "@/pages/partner-with-us";
import FAQPage from "@/pages/faq";
import SupportOurWork from "@/pages/support-our-work";

import Destinations from "@/pages/destinations";
import NatureOutdoors from "@/pages/nature-outdoors";
import DiningNightlife from "@/pages/dining-nightlife";
import PublicHolidays from "@/pages/public-holidays";
import DzalekaMap from "@/pages/dzaleka-map";
import Newsletter from "@/pages/newsletter";
import SafeTravel from "@/pages/safe-travel";
import { usePageTracker } from "@/hooks/usePageTracker";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { ScrollToTop } from "@/components/scroll-to-top";


function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  // Enable real-time subscriptions for the authenticated user
  useRealtimeSubscriptions();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-dvh w-full">
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

  // Embed and Blog routes should be accessible without authenticated layout
  const path = window.location.pathname;
  if (path.startsWith("/embed/") || path.startsWith("/blog") || path.startsWith("/things-to-do") || path.startsWith("/whats-on") || path.startsWith("/plan-your-trip") || path.startsWith("/accommodation") || path === "/disclaimer" || path === "/cookie-notice" || path === "/destinations" || path === "/partner-with-us" || path === "/faq" || path === "/support-our-work" || path === "/newsletter") {
    return (
      <Switch>
        <Route path="/embed/booking" component={EmbedBooking} />
        <Route path="/blog" component={BlogList} />
        <Route path="/blog/:slug" component={BlogPostPage} />
        <Route path="/things-to-do" component={ThingsToDo} />
        <Route path="/things-to-do/arts-culture" component={ArtsCulture} />
        <Route path="/things-to-do/shopping" component={ShoppingMarkets} />
        <Route path="/things-to-do/nature-outdoors" component={NatureOutdoors} />
        <Route path="/things-to-do/dining-nightlife" component={DiningNightlife} />
        <Route path="/things-to-do/sports-recreation" component={SportsRecreation} />
        <Route path="/things-to-do/host-community" component={HostCommunity} />
        <Route path="/whats-on" component={WhatsOn} />
        <Route path="/plan-your-trip" component={PlanYourTrip} />
        <Route path="/plan-your-trip/visitor-essentials" component={VisitorEssentials} />
        <Route path="/plan-your-trip/public-holidays" component={PublicHolidays} />
        <Route path="/plan-your-trip/dzaleka-map" component={DzalekaMap} />
        <Route path="/plan-your-trip/safe-travel" component={SafeTravel} />
        <Route path="/life-in-dzaleka" component={LifeInDzaleka} />
        <Route path="/about-dzaleka" component={AboutDzaleka} />
        <Route path="/about-us" component={AboutUs} />
        <Route path="/accommodation" component={Accommodation} />
        <Route path="/disclaimer" component={Disclaimer} />
        <Route path="/cookie-notice" component={CookieNotice} />
        <Route path="/destinations" component={Destinations} />
        <Route path="/partner-with-us" component={PartnerWithUs} />
        <Route path="/friends-of-dzaleka" component={FriendsOfDzaleka} />
        <Route path="/impact-report/:id" component={ImpactReportView} />
        <Route path="/impact-report" component={ImpactReport} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/support-our-work" component={SupportOurWork} />
        <Route path="/contact" component={ContactUs} />
        <Route path="/newsletter" component={Newsletter} />
      </Switch>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
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
        <Route path="/things-to-do" component={ThingsToDo} />
        <Route path="/whats-on" component={WhatsOn} />
        <Route path="/plan-your-trip" component={PlanYourTrip} />
        <Route path="/plan-your-trip/visitor-essentials" component={VisitorEssentials} />
        <Route path="/life-in-dzaleka" component={LifeInDzaleka} />
        <Route path="/about-dzaleka" component={AboutDzaleka} />
        <Route path="/about-us" component={AboutUs} />
        <Route path="/it-code-of-practice" component={ITCodeOfPractice} />
        <Route path="/accommodation" component={Accommodation} />
        <Route path="/disclaimer" component={Disclaimer} />
        <Route path="/cookie-notice" component={CookieNotice} />
        <Route path="/destinations" component={Destinations} />
        <Route path="/partner-with-us" component={PartnerWithUs} />
        <Route path="/friends-of-dzaleka" component={FriendsOfDzaleka} />
        <Route path="/impact-report/:id" component={ImpactReportView} />
        <Route path="/impact-report" component={ImpactReport} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/support-our-work" component={SupportOurWork} />
        <Route path="/contact" component={ContactUs} />
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
        <Route path="/bookings/:id/itinerary" component={ItineraryView} />
        <Route path="/recurring-bookings" component={RecurringBookingsPage} />
        <Route path="/my-bookings" component={MyBookings} />
        <Route path="/saved-itineraries" component={SavedItineraries} />
        <Route path="/favorite-guides" component={FavoriteGuides} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/channel-manager" component={ChannelManager} />
        <Route path="/guide-performance" component={GuidePerformance} />
        <Route path="/guides" component={Guides} />
        <Route path="/guide/:slug" component={GuideProfile} />
        <Route path="/guide-training" component={GuideTraining} />
        <ProtectedRoute path="/dtdw-guide" component={DTDWGuide} allowedRoles={["admin", "coordinator", "guide"]} />
        <ProtectedRoute path="/operations-manual" component={OperationsManual} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/standard-operating-procedures" component={StandardOperatingProcedures} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/internal-policies" component={InternalPolicies} allowedRoles={["admin", "coordinator", "guide"]} />
        <ProtectedRoute path="/marketing-strategy" component={MarketingStrategy} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/continuous-improvement" component={ContinuousImprovement} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/financial-framework" component={FinancialFramework} allowedRoles={["admin", "coordinator"]} />
        <Route path="/my-tours" component={MyTours} />
        <Route path="/my-earnings" component={MyEarnings} />
        <Route path="/my-availability" component={MyAvailability} />
        <Route path="/training-admin" component={TrainingAdmin} />
        <Route path="/zones" component={Zones} />
        <Route path="/security" component={Security} />
        <Route path="/share-photos" component={SharePhotos} />
        <ProtectedRoute path="/users" component={UsersPage} allowedRoles={["admin"]} />
        <Route path="/settings" component={Settings} />
        <Route path="/profile" component={Profile} />
        <Route path="/send-email" component={EmailHistory} />
        <Route path="/email-settings" component={EmailSettings} />
        <ProtectedRoute path="/revenue" component={Revenue} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/audit-logs" component={AuditLogs} allowedRoles={["admin"]} />
        <ProtectedRoute path="/analytics" component={Analytics} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/reports" component={Reports} allowedRoles={["admin", "coordinator"]} />
        <Route path="/visitors" component={Visitors} />
        <ProtectedRoute path="/cms" component={CMSPage} allowedRoles={["admin"]} />
        <ProtectedRoute path="/security-admin" component={SecurityAdmin} allowedRoles={["admin"]} />
        <Route path="/resources" component={VisitorResources} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/task-admin" component={TaskAdmin} />
        <Route path="/messages" component={Messages} />
        <ProtectedRoute path="/live-ops" component={LiveOperations} allowedRoles={["admin", "coordinator"]} />
        <Route path="/customers" component={CustomersPage} />
        <Route path="/customers/:id" component={CustomerProfile} />
        <Route path="/help" component={HelpCenter} />
        <ProtectedRoute path="/help-admin" component={HelpAdmin} allowedRoles={["admin"]} />
        <Route path="/itinerary-builder" component={ItineraryBuilder} />
        <Route path="/itinerary-builder/:bookingId" component={ItineraryBuilder} />
        <ProtectedRoute path="/developer" component={DeveloperSettings} allowedRoles={["admin"]} />
        <Route path="/community" component={CommunityHub} />
        <Route path="/landing" component={Landing} />
        <ProtectedRoute path="/admin/blog" component={AdminBlog} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/admin/blog/new" component={AdminBlogEditor} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/admin/blog/edit/:id" component={AdminBlogEditor} allowedRoles={["admin", "coordinator"]} />
        <Route path="/unauthorized" component={Unauthorized} />
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
          <AnalyticsTracker />
          <ScrollToTop />
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
