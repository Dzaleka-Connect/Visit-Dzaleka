import { Switch, Route, useLocation } from "wouter";
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
import { ErrorBoundary } from "@/components/error-boundary";
import { CommandPalette } from "@/components/command-palette";
import { useRealtimeSubscriptions } from "@/hooks/useRealtime";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import ResetPassword from "@/pages/reset-password";
import VerifyEmail from "@/pages/verify-email";
import Dashboard from "@/pages/dashboard";
import Bookings from "@/pages/bookings";
import BookingDetails from "@/pages/booking-details";
import MyBookings from "@/pages/my-bookings";
import MyBookingDetails from "@/pages/my-booking-details";
import Guides from "@/pages/guides";
import GuideProfile from "@/pages/guide-profile";
import CalendarPage from "@/pages/calendar";
import ChannelManager from "@/pages/channel-manager";
import GetYourGuidePage from "@/pages/getyourguide";
import SpecialOffersPage from "@/pages/special-offers";
import GuidePerformance from "@/pages/guide-performance";
import GuideProfileReviewDetails from "@/pages/guide-profile-review-details";
import GuideTourReportDetails from "@/pages/guide-tour-report-details";
import PostTourReports from "@/pages/admin-post-tour-reports";
import GuideProfileReviews from "@/pages/admin-guide-profile-reviews";
import GuideCertificates from "@/pages/guide-certificates";
import ReviewsPerformance from "@/pages/reviews-performance";
import ReviewDetails from "@/pages/review-details";
import Zones from "@/pages/zones";
import Security from "@/pages/security";
import UsersPage from "@/pages/users";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import EmailHistory from "@/pages/email-history";
import EmailSettings from "@/pages/email-settings";
import Revenue from "@/pages/revenue";
import AuditLogs from "@/pages/audit-logs";
import VisitorsPage from "@/pages/visitors";
import VisitorDetailsPage from "@/pages/visitor-details";
import Landing from "@/pages/landing";
import CMSPage from "@/pages/cms";
import SecurityAdmin from "@/pages/security-admin";
import IncidentDetails from "@/pages/incident-details";
import SystemHealth from "@/pages/system-health";
import Webhooks from "@/pages/webhooks";
import ScheduledReports from "@/pages/scheduled-reports";
import AcceptInvite from "@/pages/accept-invite";
import GuideTraining from "@/pages/guide-training";
import DTDWGuide from "@/pages/dtdw-guide";
import OperationsManual from "@/pages/operations-manual";
import OperationsControl from "@/pages/operations-control";
import StandardOperatingProcedures from "@/pages/standard-operating-procedures";
import InternalPolicies from "@/pages/internal-policies";
import MarketingStrategy from "@/pages/marketing-strategy";
import ContinuousImprovement from "@/pages/continuous-improvement";
import FinancialFramework from "@/pages/financial-framework";
import TrainingAdmin from "@/pages/training-admin";
import ThingsToDo from "@/pages/things-to-do";
import DzalekaGuidedWalkingTour from "@/pages/dzaleka-guided-walking-tour";
import VisitFeedback from "@/pages/visit-feedback";
import ArtsCulture from "@/pages/arts-culture";
import ShoppingMarkets from "@/pages/shopping";
import SportsRecreation from "@/pages/sports-recreation";
import HostCommunity from "@/pages/host-community";
import WhatsOn, { WhatsOnEventDetail } from "@/pages/whats-on";
import PlanYourTrip from "@/pages/plan-your-trip";
import VisitorEssentials from "@/pages/visitor-essentials";
import LifeInDzaleka from "@/pages/life-in-dzaleka";
import AboutDzaleka from "@/pages/about-dzaleka";
import AboutUs from "@/pages/about-us";
import FriendsOfDzaleka from "@/pages/friends-of-dzaleka";
import FriendProfile from "@/pages/friend-profile";
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
import GuideTourDetails from "@/pages/guide-tour-details";
import MyEarnings from "@/pages/my-earnings";
import MyAvailability from "@/pages/my-availability";
import MyGuideProfile from "@/pages/my-guide-profile";
import SavedItineraries from "@/pages/saved-itineraries";
import FavoriteGuides from "@/pages/favorite-guides";
import CustomersPage from "@/pages/customers";
import CustomerProfile from "@/pages/customer-profile";
import Analytics from "@/pages/analytics";
import Reports from "@/pages/reports";
import DeveloperSettings from "@/pages/developer-settings";
import EmbedBooking from "@/pages/embed-booking";
import CommunityHub from "@/pages/community-hub";
import CommunityHubGuide from "@/pages/community-hub-guide";
import CommunityListingDetails from "@/pages/community-listing-details";
import AdminCommunityListings from "@/pages/admin-community-listings";
import AdminCommunityListingDetails from "@/pages/admin-community-listing-details";
import AdminCommunityExperienceRequestDetails from "@/pages/admin-community-experience-request-details";
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
import PaymentsPage from "@/pages/payments";
import TransportPartnerPortal, { TransportPartnerRecordPage } from "@/pages/transport-partner-portal";
import TransportQuote from "@/pages/transport-quote";

import Destinations from "@/pages/destinations";
import NatureOutdoors from "@/pages/nature-outdoors";
import DiningNightlife from "@/pages/dining-nightlife";
import PublicHolidays from "@/pages/public-holidays";
import DzalekaMap from "@/pages/dzaleka-map";
import Newsletter from "@/pages/newsletter";
import SafeTravel from "@/pages/safe-travel";
import TransportPartners from "@/pages/transport-partners";
import { usePageTracker } from "@/hooks/usePageTracker";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { ScrollToTop } from "@/components/scroll-to-top";
import { TimezoneClock } from "@/components/timezone-clock";


function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  // Enable real-time subscriptions for the authenticated user
  useRealtimeSubscriptions();
  const { user } = useAuth();
  const showTimezoneClock = user?.role === "admin" || user?.role === "coordinator";

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-dvh w-full">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-background px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              {showTimezoneClock && <TimezoneClock />}
              <NotificationBell />
              <ThemeToggle />
            </div>
          </header>
          <main id="main-content" className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// Public routes that don't need authentication layout
const PUBLIC_ROUTES = [
  "/embed/",
  "/blog",
  "/community-hub",
  "/things-to-do",
  "/whats-on",
  "/plan-your-trip",
  "/accommodation",
  "/disclaimer",
  "/cookie-notice",
  "/destinations",
  "/partner-with-us",
  "/faq",
  "/support-our-work",
  "/newsletter",
  "/visit/feedback",
  "/transport-quote",
  "/friends-of-dzaleka",
  "/about-dzaleka",
  "/about-us",
  "/life-in-dzaleka",
  "/impact-report",
  "/it-code-of-practice",
  "/contact",
];

function isPublicRoute(path: string): boolean {
  const routePath = path.split(/[?#]/)[0];
  return PUBLIC_ROUTES.some((route) =>
    route.endsWith("/") ? routePath.startsWith(route) : routePath === route || routePath.startsWith(route + "/")
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Track page views for analytics
  usePageTracker();

  // Public routes accessible without authentication layout
  if (isPublicRoute(location)) {
    return (
      <Switch>
        <Route path="/embed/booking" component={EmbedBooking} />
        <Route path="/blog" component={BlogList} />
        <Route path="/blog/:slug" component={BlogPostPage} />
        <Route path="/community-hub/guide" component={CommunityHubGuide} />
        <Route path="/community-hub/:listingId" component={CommunityListingDetails} />
        <Route path="/community-hub" component={CommunityHub} />
        <Route path="/things-to-do/dzaleka-refugee-camp-guided-walking-tour" component={DzalekaGuidedWalkingTour} />
        <Route path="/things-to-do" component={ThingsToDo} />
        <Route path="/things-to-do/arts-culture" component={ArtsCulture} />
        <Route path="/things-to-do/shopping" component={ShoppingMarkets} />
        <Route path="/things-to-do/nature-outdoors" component={NatureOutdoors} />
        <Route path="/things-to-do/dining-nightlife" component={DiningNightlife} />
        <Route path="/things-to-do/sports-recreation" component={SportsRecreation} />
        <Route path="/things-to-do/host-community" component={HostCommunity} />
        <Route path="/whats-on/:eventId" component={WhatsOnEventDetail} />
        <Route path="/whats-on" component={WhatsOn} />
        <Route path="/plan-your-trip" component={PlanYourTrip} />
        <Route path="/plan-your-trip/visitor-essentials" component={VisitorEssentials} />
        <Route path="/plan-your-trip/public-holidays" component={PublicHolidays} />
        <Route path="/plan-your-trip/dzaleka-map" component={DzalekaMap} />
        <Route path="/plan-your-trip/safe-travel" component={SafeTravel} />
        <Route path="/plan-your-trip/transport" component={TransportPartners} />
        <Route path="/life-in-dzaleka" component={LifeInDzaleka} />
        <Route path="/about-dzaleka" component={AboutDzaleka} />
        <Route path="/about-us" component={AboutUs} />
        <Route path="/accommodation" component={Accommodation} />
        <Route path="/disclaimer" component={Disclaimer} />
        <Route path="/cookie-notice" component={CookieNotice} />
        <Route path="/destinations" component={Destinations} />
        <Route path="/partner-with-us" component={PartnerWithUs} />
        <Route path="/friends-of-dzaleka" component={FriendsOfDzaleka} />
        <Route path="/friends-of-dzaleka/:slug" component={FriendProfile} />
        <Route path="/it-code-of-practice" component={ITCodeOfPractice} />

        <Route path="/impact-report/:id" component={ImpactReportView} />
        <Route path="/impact-report" component={ImpactReport} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/support-our-work" component={SupportOurWork} />
        <Route path="/contact" component={ContactUs} />
        <Route path="/newsletter" component={Newsletter} />
        <Route path="/visit/feedback" component={VisitFeedback} />
        <Route path="/transport-quote/:token" component={TransportQuote} />
      </Switch>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading…</p>
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
        <Route path="/things-to-do/dzaleka-refugee-camp-guided-walking-tour" component={DzalekaGuidedWalkingTour} />
        <Route path="/things-to-do" component={ThingsToDo} />
        <Route path="/whats-on/:eventId" component={WhatsOnEventDetail} />
        <Route path="/whats-on" component={WhatsOn} />
        <Route path="/plan-your-trip" component={PlanYourTrip} />
        <Route path="/plan-your-trip/visitor-essentials" component={VisitorEssentials} />
        <Route path="/plan-your-trip/transport" component={TransportPartners} />
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
        <Route path="/visit/feedback" component={VisitFeedback} />
        <Route path="/transport-quote/:token" component={TransportQuote} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return (
    <AuthenticatedLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <ProtectedRoute path="/bookings" component={Bookings} allowedRoles={["admin", "coordinator", "guide", "security"]} />
        <Route path="/bookings/:id" component={BookingDetails} />
        <Route path="/bookings/:id/itinerary" component={ItineraryView} />
        <ProtectedRoute path="/recurring-bookings" component={RecurringBookingsPage} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/my-bookings/:bookingId" component={MyBookingDetails} allowedRoles={["visitor"]} />
        <ProtectedRoute path="/my-bookings" component={MyBookings} allowedRoles={["visitor"]} />
        <ProtectedRoute path="/saved-itineraries" component={SavedItineraries} allowedRoles={["visitor"]} />
        <ProtectedRoute path="/favorite-guides" component={FavoriteGuides} allowedRoles={["visitor"]} />
        <ProtectedRoute path="/calendar" component={CalendarPage} allowedRoles={["admin", "coordinator", "guide"]} />
        <ProtectedRoute path="/channel-manager" component={ChannelManager} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/getyourguide" component={GetYourGuidePage} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/special-offers" component={SpecialOffersPage} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/guide-performance" component={GuidePerformance} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/admin/guide-profile-reviews/:id" component={GuideProfileReviewDetails} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/admin/guide-profile-reviews" component={GuideProfileReviews} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/admin/guide-tour-reports/:id" component={GuideTourReportDetails} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/admin/post-tour-reports" component={PostTourReports} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/admin/community-listings/requests/:requestId" component={AdminCommunityExperienceRequestDetails} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/admin/community-listings/:listingId" component={AdminCommunityListingDetails} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/admin/community-listings" component={AdminCommunityListings} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/guide-certificates" component={GuideCertificates} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/reviews-performance/:reviewId" component={ReviewDetails} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/reviews-performance" component={ReviewsPerformance} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/guides" component={Guides} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/guide/:slug" component={GuideProfile} allowedRoles={["admin", "coordinator", "guide", "security"]} />
        <ProtectedRoute path="/guide-training" component={GuideTraining} allowedRoles={["guide"]} />
        <ProtectedRoute path="/dtdw-guide" component={DTDWGuide} allowedRoles={["admin", "coordinator", "guide"]} />
        <ProtectedRoute path="/operations-manual" component={OperationsManual} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/operations-control" component={OperationsControl} allowedRoles={["admin"]} />
        <ProtectedRoute path="/standard-operating-procedures" component={StandardOperatingProcedures} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/internal-policies" component={InternalPolicies} allowedRoles={["admin", "coordinator", "guide"]} />
        <ProtectedRoute path="/marketing-strategy" component={MarketingStrategy} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/continuous-improvement" component={ContinuousImprovement} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/financial-framework" component={FinancialFramework} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/my-tours/:bookingId" component={GuideTourDetails} allowedRoles={["guide"]} />
        <ProtectedRoute path="/my-tours" component={MyTours} allowedRoles={["guide"]} />
        <ProtectedRoute path="/my-earnings" component={MyEarnings} allowedRoles={["guide"]} />
        <ProtectedRoute path="/my-availability" component={MyAvailability} allowedRoles={["guide"]} />
        <ProtectedRoute path="/my-guide-profile" component={MyGuideProfile} allowedRoles={["guide"]} />
        <ProtectedRoute path="/training-admin" component={TrainingAdmin} allowedRoles={["admin"]} />
        <ProtectedRoute path="/zones" component={Zones} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/security" component={Security} allowedRoles={["admin", "coordinator", "security"]} />
        <ProtectedRoute path="/security/incidents/:id" component={IncidentDetails} allowedRoles={["admin", "coordinator", "security"]} />
        <ProtectedRoute path="/admin/system-health" component={SystemHealth} allowedRoles={["admin"]} />
        <ProtectedRoute path="/admin/webhooks" component={Webhooks} allowedRoles={["admin"]} />
        <ProtectedRoute path="/admin/scheduled-reports" component={ScheduledReports} allowedRoles={["admin"]} />
        <ProtectedRoute path="/share-photos" component={SharePhotos} allowedRoles={["visitor"]} />
        <ProtectedRoute path="/users" component={UsersPage} allowedRoles={["admin"]} />
        <ProtectedRoute path="/settings" component={Settings} allowedRoles={["admin"]} />
        <Route path="/profile" component={Profile} />
        <ProtectedRoute path="/send-email" component={EmailHistory} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/email-settings" component={EmailSettings} allowedRoles={["admin"]} />
        <ProtectedRoute path="/revenue" component={Revenue} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/payments" component={PaymentsPage} allowedRoles={["admin"]} />
        <ProtectedRoute path="/transport-partner/partners/:partnerId" component={TransportPartnerRecordPage} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/transport-partner" component={TransportPartnerPortal} allowedRoles={["admin", "coordinator", "transport_partner"]} />
        <ProtectedRoute path="/audit-logs" component={AuditLogs} allowedRoles={["admin"]} />
        <ProtectedRoute path="/analytics" component={Analytics} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/reports" component={Reports} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/visitors" component={VisitorsPage} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/cms" component={CMSPage} allowedRoles={["admin"]} />
        <ProtectedRoute path="/security-admin" component={SecurityAdmin} allowedRoles={["admin"]} />
        <ProtectedRoute path="/resources" component={VisitorResources} allowedRoles={["visitor"]} />
        <ProtectedRoute path="/visitor-resources" component={VisitorResources} allowedRoles={["visitor"]} />
        <ProtectedRoute path="/tasks" component={Tasks} allowedRoles={["admin", "coordinator", "guide", "security"]} />
        <ProtectedRoute path="/task-admin" component={TaskAdmin} allowedRoles={["admin", "coordinator"]} />
        <Route path="/messages" component={Messages} />
        <ProtectedRoute path="/live-ops" component={LiveOperations} allowedRoles={["admin", "security"]} />
        <ProtectedRoute path="/customers" component={CustomersPage} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/customers/:id" component={CustomerProfile} allowedRoles={["admin", "coordinator"]} />
        <Route path="/help" component={HelpCenter} />
        <ProtectedRoute path="/help-admin" component={HelpAdmin} allowedRoles={["admin"]} />
        <ProtectedRoute path="/itinerary-builder" component={ItineraryBuilder} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/itinerary-builder/:bookingId" component={ItineraryBuilder} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/admin/visitors" component={VisitorsPage} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/admin/visitors/:id" component={VisitorDetailsPage} allowedRoles={["admin", "coordinator"]} />
        <ProtectedRoute path="/developer" component={DeveloperSettings} allowedRoles={["admin"]} />
        <Route path="/community/guide" component={CommunityHubGuide} />
        <Route path="/community/:listingId" component={CommunityListingDetails} />
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
        <TooltipProvider delayDuration={500} skipDelayDuration={100}>
          <ErrorBoundary>
            <AnalyticsTracker />
            <ScrollToTop />
            <Toaster />
            <CommandPalette />
            <Router />
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
