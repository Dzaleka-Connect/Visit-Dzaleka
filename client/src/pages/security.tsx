import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search,
  Shield,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDate, formatTime, formatCurrency } from "@/lib/constants";
import type { Booking, Guide, Incident } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface BookingWithGuide extends Booking {
  guide?: Guide;
}

const incidentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  location: z.string().optional(),
  involvedParties: z.string().optional(),
  bookingId: z.string().optional(),
});

type IncidentFormValues = z.infer<typeof incidentFormSchema>;

const severityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-400" },
  medium: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-400" },
  high: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-800 dark:text-orange-400" },
  critical: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-400" },
};

const statusColors: Record<string, { bg: string; text: string }> = {
  reported: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-400" },
  investigating: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-400" },
  resolved: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-400" },
  closed: { bg: "bg-gray-100 dark:bg-gray-900/30", text: "text-gray-800 dark:text-gray-400" },
};

export default function Security() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("verify");
  const [searchReference, setSearchReference] = useState("");
  const [verifiedBooking, setVerifiedBooking] = useState<BookingWithGuide | null>(null);
  const [isIncidentFormOpen, setIsIncidentFormOpen] = useState(false);

  const { data: activeVisits, isLoading: activeLoading } = useQuery<BookingWithGuide[]>({
    queryKey: ["/api/bookings/active"],
  });

  const { data: todaysBookings, isLoading: todaysLoading } = useQuery<BookingWithGuide[]>({
    queryKey: ["/api/bookings/today"],
  });

  const { data: incidents, isLoading: incidentsLoading } = useQuery<Incident[]>({
    queryKey: ["/api/incidents"],
  });

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      severity: "medium",
      location: "",
      involvedParties: "",
      bookingId: "",
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (reference: string) => {
      const response = await fetch(`/api/bookings/verify/${reference}`);
      if (!response.ok) {
        throw new Error("Booking not found");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setVerifiedBooking(data);
    },
    onError: () => {
      setVerifiedBooking(null);
      toast({
        title: "Not Found",
        description: "No booking found with this reference.",
        variant: "destructive",
      });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/bookings/${id}/check-in`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/today"] });
      setVerifiedBooking(null);
      setSearchReference("");
      toast({
        title: "Checked In",
        description: "Visitor has been checked in successfully.",
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
        description: "Failed to check in visitor.",
        variant: "destructive",
      });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/bookings/${id}/check-out`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/today"] });
      toast({
        title: "Checked Out",
        description: "Visitor has been checked out successfully.",
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
        description: "Failed to check out visitor.",
        variant: "destructive",
      });
    },
  });

  const createIncidentMutation = useMutation({
    mutationFn: async (data: IncidentFormValues) => {
      await apiRequest("POST", "/api/incidents", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      setIsIncidentFormOpen(false);
      form.reset();
      toast({
        title: "Incident Reported",
        description: "Incident has been logged successfully.",
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
        description: "Failed to report incident.",
        variant: "destructive",
      });
    },
  });

  const resolveIncidentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/incidents/${id}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      toast({
        title: "Incident Resolved",
        description: "Incident has been marked as resolved.",
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
        description: "Failed to resolve incident.",
        variant: "destructive",
      });
    },
  });

  const handleVerify = () => {
    if (searchReference.trim()) {
      verifyMutation.mutate(searchReference.trim().toUpperCase());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Security</h1>
        <p className="text-muted-foreground">
          Visitor check-in/out, booking verification, and incident management.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
          <TabsTrigger value="verify" data-testid="tab-verify" className="text-xs sm:text-sm px-2 sm:px-4">
            <Shield className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Verify & Check-in</span>
          </TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active" className="text-xs sm:text-sm px-2 sm:px-4">
            <UserCheck className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Active Visits</span>
          </TabsTrigger>
          <TabsTrigger value="incidents" data-testid="tab-incidents" className="text-xs sm:text-sm px-2 sm:px-4">
            <AlertTriangle className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Incidents</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="verify" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verify Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Enter booking reference (e.g., DVS-2024-ABC123)"
                    value={searchReference}
                    onChange={(e) => setSearchReference(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    className="pl-9 font-mono"
                    data-testid="input-booking-reference"
                  />
                </div>
                <Button
                  onClick={handleVerify}
                  disabled={!searchReference.trim() || verifyMutation.isPending}
                  data-testid="button-verify"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Verify
                </Button>
              </div>
            </CardContent>
          </Card>

          {verifiedBooking && (
            <Card className="border-2 border-primary">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Booking Verified
                  </CardTitle>
                  <Badge className="font-mono">{verifiedBooking.bookingReference}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Visitor Name</Label>
                      <p className="text-lg font-semibold">{verifiedBooking.visitorName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Visit Date & Time</Label>
                      <p className="font-medium">
                        {formatDate(verifiedBooking.visitDate)} at{" "}
                        {formatTime(verifiedBooking.visitTime)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Group Size</Label>
                      <p className="font-medium">
                        {verifiedBooking.numberOfPeople}{" "}
                        {verifiedBooking.numberOfPeople === 1 ? "person" : "people"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div>
                        <Label className="text-muted-foreground">Booking Status</Label>
                        <div className="mt-1">
                          <StatusBadge status={verifiedBooking.status || "pending"} />
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Payment Status</Label>
                        <div className="mt-1">
                          <PaymentStatusBadge status={verifiedBooking.paymentStatus || "pending"} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Check-in Status</Label>
                      <p className="font-medium">
                        {verifiedBooking.checkInTime ? (
                          <span className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Checked in at {new Date(verifiedBooking.checkInTime).toLocaleTimeString()}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-yellow-600">
                            <Clock className="h-4 w-4" />
                            Not checked in
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  {!verifiedBooking.checkInTime && verifiedBooking.status === "confirmed" && (
                    <Button
                      onClick={() => checkInMutation.mutate(verifiedBooking.id)}
                      disabled={checkInMutation.isPending}
                      data-testid="button-check-in"
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Check In Visitor
                    </Button>
                  )}
                  {verifiedBooking.checkInTime && !verifiedBooking.checkOutTime && (
                    <Button
                      variant="outline"
                      onClick={() => checkOutMutation.mutate(verifiedBooking.id)}
                      disabled={checkOutMutation.isPending}
                      data-testid="button-check-out"
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Check Out Visitor
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      form.setValue("bookingId", verifiedBooking.id);
                      setIsIncidentFormOpen(true);
                    }}
                    data-testid="button-report-incident"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Report Incident
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Today's Scheduled Visits</CardTitle>
            </CardHeader>
            <CardContent>
              {todaysLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : !todaysBookings || todaysBookings.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No visits today"
                  description="There are no scheduled visits for today."
                  className="py-8"
                />
              ) : (
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <Table className="min-w-[700px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Visitor</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todaysBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-mono text-sm">
                            {booking.bookingReference}
                          </TableCell>
                          <TableCell>{booking.visitorName}</TableCell>
                          <TableCell>{formatTime(booking.visitTime)}</TableCell>
                          <TableCell>{booking.numberOfPeople} people</TableCell>
                          <TableCell>
                            <StatusBadge status={booking.status || "pending"} />
                          </TableCell>
                          <TableCell>
                            {booking.checkInTime ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Checked In
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!booking.checkInTime && booking.status === "confirmed" && (
                              <Button
                                size="sm"
                                onClick={() => checkInMutation.mutate(booking.id)}
                                disabled={checkInMutation.isPending}
                              >
                                Check In
                              </Button>
                            )}
                            {booking.checkInTime && !booking.checkOutTime && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => checkOutMutation.mutate(booking.id)}
                                disabled={checkOutMutation.isPending}
                              >
                                Check Out
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                Currently Active Visits
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : !activeVisits || activeVisits.length === 0 ? (
                <EmptyState
                  icon={UserCheck}
                  title="No active visits"
                  description="There are no visitors currently checked in."
                  className="py-8"
                />
              ) : (
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <Table className="min-w-[650px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Visitor</TableHead>
                        <TableHead>Check-in Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Guide</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeVisits.map((visit) => {
                        const checkInTime = visit.checkInTime
                          ? new Date(visit.checkInTime)
                          : null;
                        const duration = checkInTime
                          ? Math.round(
                            (Date.now() - checkInTime.getTime()) / (1000 * 60)
                          )
                          : 0;
                        return (
                          <TableRow key={visit.id}>
                            <TableCell className="font-mono text-sm">
                              {visit.bookingReference}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{visit.visitorName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {visit.numberOfPeople} people
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {checkInTime?.toLocaleTimeString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  duration > 120
                                    ? "border-red-500 text-red-500"
                                    : ""
                                }
                              >
                                {Math.floor(duration / 60)}h {duration % 60}m
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {visit.guide ? (
                                `${visit.guide.firstName} ${visit.guide.lastName}`
                              ) : (
                                <span className="text-muted-foreground">
                                  Unassigned
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => checkOutMutation.mutate(visit.id)}
                                disabled={checkOutMutation.isPending}
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Check Out
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="mt-6 space-y-6">
          <div className="flex justify-end">
            <Button
              onClick={() => setIsIncidentFormOpen(true)}
              data-testid="button-new-incident"
            >
              <Plus className="mr-2 h-4 w-4" />
              Report Incident
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Incident Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {incidentsLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : !incidents || incidents.length === 0 ? (
                <EmptyState
                  icon={AlertTriangle}
                  title="No incidents"
                  description="No incidents have been reported."
                  className="py-8"
                />
              ) : (
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <Table className="min-w-[650px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incidents.map((incident) => (
                        <TableRow key={incident.id}>
                          <TableCell>
                            {incident.createdAt
                              ? new Date(incident.createdAt).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{incident.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {incident.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${severityColors[incident.severity || "medium"].bg
                                } ${severityColors[incident.severity || "medium"].text
                                }`}
                            >
                              {incident.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${statusColors[incident.status || "reported"].bg
                                } ${statusColors[incident.status || "reported"].text
                                }`}
                            >
                              {incident.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{incident.location || "-"}</TableCell>
                          <TableCell>
                            {incident.status !== "resolved" &&
                              incident.status !== "closed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    resolveIncidentMutation.mutate(incident.id)
                                  }
                                  disabled={resolveIncidentMutation.isPending}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Resolve
                                </Button>
                              )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isIncidentFormOpen} onOpenChange={setIsIncidentFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Incident</DialogTitle>
            <DialogDescription>
              Log a security incident or concern.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                createIncidentMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief description of the incident"
                        {...field}
                        data-testid="input-incident-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed description of what happened..."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="textarea-incident-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-severity">
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Where did this occur?"
                        {...field}
                        data-testid="input-incident-location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="involvedParties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Involved Parties (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Names of people involved"
                        {...field}
                        data-testid="input-involved-parties"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsIncidentFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createIncidentMutation.isPending}
                  data-testid="button-submit-incident"
                >
                  Report Incident
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
