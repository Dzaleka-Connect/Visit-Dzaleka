import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  User,
  ShieldCheck,
  CreditCard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { User as UserType, Booking } from "@shared/schema";
import { SEO } from "@/components/seo";

interface CustomerDetailsResponse {
  user: UserType;
  bookings: Booking[];
  stats?: {
    totalVisits?: number;
    totalSpend?: number;
    lastVisit?: string;
  };
}

const getRecognizedBookingRevenue = (booking: Booking) =>
  booking.paymentStatus === "paid" && booking.status !== "cancelled"
    ? booking.totalAmount || 0
    : 0;

export default function VisitorDetailsPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/visitors/:id");
  const visitorId = params?.id ? decodeURIComponent(params.id) : undefined;
  const isUnregistered = visitorId?.startsWith("unregistered-");

  const { data: customerDetails, isLoading: customerLoading } = useQuery<CustomerDetailsResponse>({
    queryKey: ["/api/customers", visitorId],
    enabled: !!visitorId && !isUnregistered,
  });

  const { data: allBookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!visitorId && !!isUnregistered,
  });

  if ((!isUnregistered && customerLoading) || (isUnregistered && bookingsLoading)) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[200px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
      </div>
    );
  }

  // Determine if it's a registered user or unregistered guest
  const emailIdentifier = isUnregistered ? visitorId?.replace("unregistered-", "") : null;

  let visitorProfile: any = null;
  let visitorBookings: Booking[] = [];

  if (isUnregistered && emailIdentifier) {
    visitorBookings = allBookings?.filter(b => b.visitorEmail?.toLowerCase() === emailIdentifier.toLowerCase()) || [];
    
    // Synthesize profile from newest booking
    const latestBooking = [...visitorBookings].sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )[0];

    if (latestBooking) {
      const nameParts = (latestBooking.visitorName || "").split(" ");
      visitorProfile = {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: latestBooking.visitorEmail,
        phone: latestBooking.visitorPhone,
        country: latestBooking.visitorCountry,
        isRegistered: false,
        createdAt: [...visitorBookings].sort((a, b) => 
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        )[0]?.createdAt,
      };
    }
  } else {
    if (customerDetails?.user) {
      visitorProfile = {
        ...customerDetails.user,
        isRegistered: true,
      };
      visitorBookings = customerDetails.bookings || [];
    }
  }

  if (!visitorProfile) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="bg-muted p-4 rounded-full">
          <User className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Visitor Not Found</h2>
        <p className="text-muted-foreground max-w-md">We couldn't find a record for this visitor. They may have been removed or the data is still loading.</p>
        <Button onClick={() => setLocation("/admin/visitors")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Visitors
        </Button>
      </div>
    );
  }

  // Calculate metrics
  const completedBookings = visitorBookings.filter(b => b.status === "completed");
  const totalSpent = visitorBookings.reduce((sum, b) => sum + getRecognizedBookingRevenue(b), 0);
  const cancelledBookings = visitorBookings.filter(b => b.status === "cancelled").length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-MW", {
      style: "currency",
      currency: "MWK",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <SEO title={`${visitorProfile.firstName} ${visitorProfile.lastName} | Visitor Details`} robots="noindex" />
      
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation("/admin/visitors")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visitor Details</h1>
          <p className="text-muted-foreground">Comprehensive history and analytics</p>
        </div>
      </div>

      {/* Header Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
              <AvatarImage src={visitorProfile.profileImageUrl || undefined} />
              <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                {visitorProfile.firstName?.charAt(0)}
                {visitorProfile.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold">
                  {visitorProfile.firstName} {visitorProfile.lastName}
                </h2>
                {visitorProfile.isRegistered ? (
                  <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                    <ShieldCheck className="mr-1 h-3 w-3" /> Registered Account
                  </Badge>
                ) : (
                  <Badge variant="secondary">Guest</Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground mt-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a href={`mailto:${visitorProfile.email}`} className="hover:text-primary hover:underline truncate">
                    {visitorProfile.email}
                  </a>
                </div>
                {visitorProfile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{visitorProfile.phone}</span>
                  </div>
                )}
                {visitorProfile.country && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{visitorProfile.country}</span>
                  </div>
                )}
                {visitorProfile.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>Joined {formatDistanceToNow(new Date(visitorProfile.createdAt))} ago</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
              <Button onClick={() => window.location.href = `mailto:${visitorProfile.email}`}>
                <Mail className="mr-2 h-4 w-4" /> Email Visitor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visitorBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              {cancelledBookings} cancelled
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tours</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              Successfully attended
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Visit</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {visitorBookings.length > 0 
                ? formatDistanceToNow(new Date(
                    [...visitorBookings].sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0].visitDate
                  ), { addSuffix: true }) 
                : "Never"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CRM Details (Only available for registered users or if attached to the profile) */}
      {(visitorProfile.adminNotes || visitorProfile.tags?.length > 0 || visitorProfile.preferences) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Visitor CRM Profile</CardTitle>
            <CardDescription>Internal notes and preferences for this visitor.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Preferences & Logistics */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Preferences & Requirements</h4>
                  {visitorProfile.preferences ? (
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      {Object.entries(visitorProfile.preferences as Record<string, any>).map(([key, value]) => (
                        <li key={key} className="capitalize">
                          <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {String(value)}
                        </li>
                      ))}
                      {Object.keys(visitorProfile.preferences as Record<string, any>).length === 0 && (
                        <li>No specific preferences recorded.</li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No preferences recorded.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Language</h4>
                    <p className="text-sm text-muted-foreground">{visitorProfile.preferredLanguage === 'en' ? 'English' : visitorProfile.preferredLanguage === 'fr' ? 'French' : visitorProfile.preferredLanguage || 'Unknown'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Contact Method</h4>
                    <p className="text-sm text-muted-foreground capitalize">{visitorProfile.preferredContactMethod || 'Email'}</p>
                  </div>
                </div>
              </div>

              {/* Internal Notes & Tags */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Admin Notes</h4>
                  {visitorProfile.adminNotes ? (
                    <div className="bg-muted/50 p-3 rounded-md text-sm italic text-muted-foreground border">
                      "{visitorProfile.adminNotes}"
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No internal notes.</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Segmentation Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {visitorProfile.tags && visitorProfile.tags.length > 0 ? (
                      visitorProfile.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No tags assigned.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Booking History</CardTitle>
          <CardDescription>A chronological log of all tours booked by this visitor.</CardDescription>
        </CardHeader>
        <CardContent>
          {visitorBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bookings found for this visitor.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Tour Type</TableHead>
                  <TableHead>Group Size</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitorBookings
                  .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
                  .map((booking) => (
                    <TableRow key={booking.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setLocation(`/bookings?search=${booking.bookingReference}`)}>
                      <TableCell className="font-medium">
                        {booking.bookingReference || booking.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{format(new Date(booking.visitDate), "PPP")}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> {booking.visitTime}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{booking.tourType.replace(/_/g, " ")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {booking.numberOfPeople}
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.totalAmount ? formatCurrency(booking.totalAmount) : "Free"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          booking.status === "completed" ? "default" :
                          booking.status === "cancelled" ? "destructive" :
                          booking.status === "confirmed" ? "secondary" : "outline"
                        } className={booking.status === "completed" ? "bg-green-600 hover:bg-green-700" : ""}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
