import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Building2,
  HeartHandshake,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
  AlertTriangle,
  Loader2,
  Compass,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SEO } from "@/components/seo";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import {
  insertCommunityListingSchema,
  type CommunityExperienceRequest,
  type CommunityListing,
  type InsertCommunityListing,
} from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const defaultListingValues: InsertCommunityListing = {
  name: "",
  type: "business",
  category: "",
  description: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  location: "",
  imageUrl: "",
  needs: "",
  offersExperience: false,
  experienceDetails: "",
  experiencePrice: null,
  experienceCurrency: "MWK",
  experienceDurationMinutes: null,
  experienceMinGuests: 1,
  experienceMaxGuests: null,
  experienceBookingNotes: "",
  impactStatement: "",
  status: "approved",
  moderationNotes: "",
};

const PAGE_SIZE = 20;

function trimListingValues(values: InsertCommunityListing): InsertCommunityListing {
  const offersExperience = Boolean(values.offersExperience);
  return {
    ...values,
    name: values.name.trim(),
    type: values.type.trim(),
    category: values.category.trim(),
    description: values.description.trim(),
    contactName: values.contactName.trim(),
    contactPhone: values.contactPhone.trim(),
    contactEmail: values.contactEmail?.trim() || null,
    location: values.location.trim(),
    imageUrl: values.imageUrl?.trim() || null,
    needs: values.needs?.trim() || null,
    offersExperience,
    experienceDetails: offersExperience ? values.experienceDetails?.trim() || null : null,
    experiencePrice: offersExperience ? Number(values.experiencePrice) || null : null,
    experienceCurrency: values.experienceCurrency?.trim() || "MWK",
    experienceDurationMinutes: offersExperience ? Number(values.experienceDurationMinutes) || null : null,
    experienceMinGuests: offersExperience ? Number(values.experienceMinGuests) || 1 : null,
    experienceMaxGuests: offersExperience ? Number(values.experienceMaxGuests) || null : null,
    experienceBookingNotes: offersExperience ? values.experienceBookingNotes?.trim() || null : null,
    impactStatement: offersExperience ? values.impactStatement?.trim() || null : null,
    status: values.status || "approved",
    moderationNotes: values.moderationNotes?.trim() || null,
  };
}

const publicListingStatuses = new Set(["approved", "live", "published"]);

function isLiveListing(listing: Pick<CommunityListing, "status">) {
  return publicListingStatuses.has(String(listing.status || ""));
}

function listingTypeLabel(type?: string | null) {
  return type === "initiative" ? "Project or initiative" : "Business or artisan";
}

function formatAdminDate(date?: string | Date | null) {
  if (!date) return "No date";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
}

function formatRequestDateTime(date?: string | Date | null, time?: string | null) {
  const dateText = formatAdminDate(date);
  return time ? `${dateText} at ${time}` : dateText;
}

interface AdminCommunityExperienceRequest extends CommunityExperienceRequest {
  listing?: CommunityListing | null;
}

export default function AdminCommunityListings() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("requests");
  const [listingPage, setListingPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<CommunityListing | null>(null);
  const [rejectingListing, setRejectingListing] = useState<CommunityListing | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState("");

  const createForm = useForm<InsertCommunityListing>({
    resolver: zodResolver(insertCommunityListingSchema),
    defaultValues: defaultListingValues,
  });
  const watchOffersExperience = createForm.watch("offersExperience");

  // Fetch all community listings for admin
  const { data: listings = [], isLoading, isError } = useQuery<CommunityListing[]>({
    queryKey: ["/api/admin/community-listings"],
  });

  const { data: experienceRequests = [] } = useQuery<AdminCommunityExperienceRequest[]>({
    queryKey: ["/api/admin/community-experience-requests"],
  });

  // Create Listing Mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertCommunityListing) => {
      const response = await apiRequest("POST", "/api/admin/community-listings", trimListingValues(data));
      return response.json();
    },
    onSuccess: (_createdListing, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/community-listings"] });
      toast({
        title: "Listing created",
        description: "The community listing has been added successfully.",
      });
      createForm.reset(defaultListingValues);
      setIsAddOpen(false);
      setActiveTab(publicListingStatuses.has(String(variables.status || "")) ? "live" : variables.status || "live");
    },
    onError: (error: Error) => {
      toast({
        title: "Create failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const requestStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      adminNotes,
    }: {
      id: string;
      status: "contacted" | "confirmed" | "declined" | "cancelled";
      adminNotes?: string | null;
    }) => {
      const response = await apiRequest("PATCH", `/api/admin/community-experience-requests/${id}`, {
        status,
        adminNotes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community-experience-requests"] });
      toast({
        title: "Experience request updated",
        description: "The request status has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Request update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Moderate Status Mutation
  const moderateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      moderationNotes,
    }: {
      id: string;
      status: "approved" | "rejected";
      moderationNotes?: string;
    }) => {
      const response = await apiRequest("PATCH", `/api/admin/community-listings/${id}`, {
        status,
        moderationNotes,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/community-listings"] });
      toast({
        title: variables.status === "approved" ? "Listing is live" : "Listing rejected",
        description: variables.status === "approved"
          ? "This listing can now appear on the public Community Hub."
          : "The listing has been moved to the rejected queue.",
      });
      setRejectingListing(null);
      setRejectionNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Moderation action failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Edit Listing Mutation
  const editMutation = useMutation({
    mutationFn: async (data: Partial<CommunityListing> & { id: string }) => {
      const { id, ...payload } = data;
      const response = await apiRequest("PATCH", `/api/admin/community-listings/${id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/community-listings"] });
      toast({
        title: "Listing updated",
        description: "The listing details have been updated successfully.",
      });
      setEditingListing(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete Listing Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/community-listings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/community-listings"] });
      toast({
        title: "Listing deleted",
        description: "The community listing has been soft-deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    setListingPage(1);
    setRequestPage(1);
  }, [activeTab, searchTerm]);

  // Filter listings by tab and search query
  const filteredListings = listings.filter((item) => {
    // 1. Filter by Tab status
    if (activeTab === "pending" && item.status !== "pending") return false;
    if (activeTab === "live" && !isLiveListing(item)) return false;
    if (activeTab === "rejected" && item.status !== "rejected") return false;

    // 2. Filter by Search Query
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.contactName.toLowerCase().includes(term) ||
      item.location.toLowerCase().includes(term)
    );
  });

  const filteredExperienceRequests = experienceRequests.filter((request) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      request.visitorName.toLowerCase().includes(term) ||
      request.visitorEmail.toLowerCase().includes(term) ||
      Boolean(request.visitorPhone?.toLowerCase().includes(term)) ||
      Boolean(request.listing?.name?.toLowerCase().includes(term)) ||
      Boolean(request.message?.toLowerCase().includes(term))
    );
  });

  const getListingIcon = (type: string) => {
    return type === "business" ? (
      <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
    ) : (
      <HeartHandshake className="h-4 w-4 text-emerald-600" aria-hidden="true" />
    );
  };

  const getStatusBadge = (status: string | null) => {
    if (publicListingStatuses.has(String(status || ""))) {
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">Live</Badge>;
    }
    if (status === "rejected") {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200">Rejected</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">Needs review</Badge>;
  };

  const formatRequestDate = (date: string | Date | null) => {
    if (!date) return "No date";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
  };

  const openExperienceRequests = experienceRequests.filter((request) =>
    request.status === "submitted" || request.status === "contacted"
  );
  const requestCounts = useMemo(() => ({
    open: openExperienceRequests.length,
    total: experienceRequests.length,
  }), [experienceRequests, openExperienceRequests.length]);
  const pendingCount = listings.filter((item) => item.status === "pending").length;
  const liveCount = listings.filter(isLiveListing).length;
  const rejectedCount = listings.filter((item) => item.status === "rejected").length;
  const listingTotalPages = Math.max(1, Math.ceil(filteredListings.length / PAGE_SIZE));
  const requestTotalPages = Math.max(1, Math.ceil(filteredExperienceRequests.length / PAGE_SIZE));
  const paginatedListings = filteredListings.slice((listingPage - 1) * PAGE_SIZE, listingPage * PAGE_SIZE);
  const paginatedRequests = filteredExperienceRequests.slice((requestPage - 1) * PAGE_SIZE, requestPage * PAGE_SIZE);
  const showingListingsFrom = filteredListings.length === 0 ? 0 : (listingPage - 1) * PAGE_SIZE + 1;
  const showingListingsTo = Math.min(listingPage * PAGE_SIZE, filteredListings.length);
  const showingRequestsFrom = filteredExperienceRequests.length === 0 ? 0 : (requestPage - 1) * PAGE_SIZE + 1;
  const showingRequestsTo = Math.min(requestPage * PAGE_SIZE, filteredExperienceRequests.length);

  return (
    <PageContainer>
      <SEO title="Community Listings | Visit Dzaleka Admin" />

      <PageHeader
        title="Community Listings"
        description="Review provider submissions, publish listings, and keep contact, needs, and experience details accurate."
      >
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add Listing
        </Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Open visitor requests</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{requestCounts.open}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Listings to review</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Live listings</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{liveCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">All requests</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{requestCounts.total}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Filter Controls */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="requests">Experience requests ({requestCounts.open})</TabsTrigger>
              <TabsTrigger value="pending">Review queue ({pendingCount})</TabsTrigger>
              <TabsTrigger value="live">Live ({liveCount})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search listings or requests…"
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Content Display */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
            <CardContent className="flex items-center gap-3 p-6 text-red-900 dark:text-red-200">
              <AlertTriangle className="h-5 w-5" />
              <p>Failed to load community listings. Please check connection and try again.</p>
            </CardContent>
          </Card>
        ) : activeTab === "requests" ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Compass className="h-5 w-5 text-primary" aria-hidden="true" />
                Experience requests
              </CardTitle>
              <CardDescription>
                Visitor requests from Community Hub listing detail pages. Check host availability before confirming.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {filteredExperienceRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <Compass className="h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-semibold">No requests found</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    New visitor experience requests from the public directory will appear here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Experience</TableHead>
                        <TableHead>Visitor</TableHead>
                        <TableHead className="hidden md:table-cell">Preferred time</TableHead>
                        <TableHead className="hidden lg:table-cell">Guests</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="min-w-0">
                              <Link
                                href={`/admin/community-listings/requests/${request.id}`}
                                className="line-clamp-1 font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              >
                                {request.listing?.name || "Community experience"}
                              </Link>
                              {request.message && (
                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{request.message}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="min-w-0 text-sm">
                              <p className="line-clamp-1 font-medium">{request.visitorName}</p>
                              <p className="line-clamp-1 text-xs text-muted-foreground">{request.visitorEmail}</p>
                              {request.visitorPhone && (
                                <p className="line-clamp-1 text-xs text-muted-foreground">{request.visitorPhone}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {formatRequestDateTime(request.preferredDate, request.preferredTime)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell tabular-nums">
                            {request.groupSize}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">{request.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/admin/community-listings/requests/${request.id}`}>Details</Link>
                              </Button>
                              {(request.status === "submitted" || request.status === "contacted") && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => requestStatusMutation.mutate({ id: request.id, status: "contacted" })}
                                    disabled={requestStatusMutation.isPending}
                                  >
                                    Contacted
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => requestStatusMutation.mutate({ id: request.id, status: "confirmed" })}
                                    disabled={requestStatusMutation.isPending}
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                                    onClick={() => requestStatusMutation.mutate({ id: request.id, status: "declined" })}
                                    disabled={requestStatusMutation.isPending}
                                  >
                                    Decline
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                  <div className="flex flex-col gap-3 border-t p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      Showing {showingRequestsFrom}-{showingRequestsTo} of {filteredExperienceRequests.length} requests
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRequestPage((page) => Math.max(1, page - 1))}
                        disabled={requestPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRequestPage((page) => Math.min(requestTotalPages, page + 1))}
                        disabled={requestPage === requestTotalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : filteredListings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No listings found</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                No {activeTab === "live" ? "live" : activeTab} listings match the current search.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Contact</TableHead>
                    <TableHead className="hidden xl:table-cell">Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedListings.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                width={96}
                                height={96}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-muted/60">
                                {getListingIcon(item.type)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/community-listings/${item.id}`}
                              className="line-clamp-1 font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              {item.name}
                            </Link>
                            <p className="line-clamp-1 text-xs text-muted-foreground">{item.category}</p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">{item.location}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="max-w-full">
                          <span className="mr-1 shrink-0">{getListingIcon(item.type)}</span>
                          <span className="truncate">{listingTypeLabel(item.type)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="min-w-0 text-sm">
                          <p className="line-clamp-1">{item.contactName}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">{item.contactPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                        {formatAdminDate(item.updatedAt || item.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/community-listings/${item.id}`}>Details</Link>
                          </Button>
                          {item.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => moderateMutation.mutate({ id: item.id, status: "approved" })}
                                disabled={moderateMutation.isPending}
                              >
                                Publish
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                                onClick={() => setRejectingListing(item)}
                                disabled={moderateMutation.isPending}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {isLiveListing(item) && (
                            <Button asChild size="sm" variant="outline">
                              <a href={`/community-hub/${item.id}`} target="_blank" rel="noopener noreferrer">
                                <ArrowUpRight className="mr-1 h-4 w-4" aria-hidden="true" />
                                Public
                              </a>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingListing(item)}
                            disabled={editMutation.isPending}
                          >
                            <Edit className="mr-1 h-4 w-4" aria-hidden="true" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                            onClick={() => {
                              if (confirm("Delete this listing? It will be removed from the public Community Hub.")) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              <div className="flex flex-col gap-3 border-t p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing {showingListingsFrom}-{showingListingsTo} of {filteredListings.length} listings
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setListingPage((page) => Math.max(1, page - 1))}
                    disabled={listingPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setListingPage((page) => Math.min(listingTotalPages, page + 1))}
                    disabled={listingPage === listingTotalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Listing Dialog */}
      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) createForm.reset(defaultListingValues);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add listing</DialogTitle>
            <DialogDescription>
              Create a public listing or save it to the review queue.
            </DialogDescription>
          </DialogHeader>

          <Form {...createForm}>
            <form
              className="space-y-4 py-2"
              onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listing type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose type…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="business">Business or artisan</SelectItem>
                          <SelectItem value="initiative">Project or initiative</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select value={field.value || "approved"} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose status…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="approved">Live on Community Hub</SelectItem>
                          <SelectItem value="pending">Save for review</SelectItem>
                          <SelectItem value="rejected">Save as rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Example: Dzaleka Tailoring Cooperative…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Tailoring, dining, crafts…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this listing offers visitors or the community…"
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Dzaleka Market, Zone 4…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/photo.jpg…" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact person…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone / WhatsApp</FormLabel>
                      <FormControl>
                        <Input type="tel" inputMode="tel" placeholder="+265 999 000 000…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        inputMode="email"
                        placeholder="name@example.com…"
                        spellCheck={false}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="needs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Needs / Material Support</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Items visitors can bring, purchase, or help source…"
                        className="min-h-20"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="offersExperience"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border bg-muted/40 p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Offers visitor experience</FormLabel>
                      <FormDescription>
                        Use this for workshops, cooking classes, art lessons, or other hosted experiences.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {watchOffersExperience && (
                <div className="space-y-4 rounded-md border p-4">
                  <FormField
                    control={createForm.control}
                    name="experienceDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe what visitors will do, duration, host, and cultural context…"
                            className="min-h-20"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={createForm.control}
                      name="experiencePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              inputMode="numeric"
                              placeholder="25000…"
                              {...field}
                              value={field.value || ""}
                              onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="experienceCurrency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <FormControl>
                            <Input placeholder="MWK…" {...field} value={field.value || "MWK"} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="experienceDurationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              inputMode="numeric"
                              placeholder="90…"
                              {...field}
                              value={field.value || ""}
                              onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={createForm.control}
                      name="experienceMinGuests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Guests</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              inputMode="numeric"
                              {...field}
                              value={field.value || 1}
                              onChange={(event) => field.onChange(Number(event.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="experienceMaxGuests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Guests</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              inputMode="numeric"
                              placeholder="8…"
                              {...field}
                              value={field.value || ""}
                              onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createForm.control}
                    name="impactStatement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impact Statement</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explain how this supports the host or community…"
                            className="min-h-16"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="experienceBookingNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Booking Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Availability, lead time, meeting point, materials, or restrictions…"
                            className="min-h-16"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={createForm.control}
                name="moderationNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional admin context for this listing…"
                        className="min-h-16"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                  Create Listing
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={!!rejectingListing} onOpenChange={(open) => !open && setRejectingListing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Listing: {rejectingListing?.name}</DialogTitle>
            <DialogDescription>
              Provide moderation notes explaining why this listing is being rejected (e.g. invalid phone number, outside camp territory).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reasons…"
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              className="min-h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingListing(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectingListing) {
                  moderateMutation.mutate({
                    id: rejectingListing.id,
                    status: "rejected",
                    moderationNotes: rejectionNotes,
                  });
                }
              }}
              disabled={moderateMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingListing} onOpenChange={(open) => !open && setEditingListing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit listing</DialogTitle>
            <DialogDescription>
              Update the public listing details and visibility.
            </DialogDescription>
          </DialogHeader>

          {editingListing && (
            <div className="space-y-4 py-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Name</label>
                <Input
                  value={editingListing.name}
                  onChange={(e) => setEditingListing({ ...editingListing, name: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Listing type</label>
                  <Select
                    value={editingListing.type || "business"}
                    onValueChange={(value) => setEditingListing({ ...editingListing, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose type…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Business or artisan</SelectItem>
                      <SelectItem value="initiative">Project or initiative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Visibility</label>
                  <Select
                    value={isLiveListing(editingListing) ? "approved" : editingListing.status || "pending"}
                    onValueChange={(value) => setEditingListing({ ...editingListing, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose visibility…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Live on Community Hub</SelectItem>
                      <SelectItem value="pending">Needs review</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Category</label>
                  <Input
                    value={editingListing.category}
                    onChange={(e) => setEditingListing({ ...editingListing, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Location</label>
                  <Input
                    value={editingListing.location}
                    onChange={(e) => setEditingListing({ ...editingListing, location: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Description</label>
                <Textarea
                  value={editingListing.description}
                  onChange={(e) => setEditingListing({ ...editingListing, description: e.target.value })}
                  className="min-h-20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Contact name</label>
                  <Input
                    value={editingListing.contactName}
                    onChange={(e) => setEditingListing({ ...editingListing, contactName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Phone / WhatsApp</label>
                  <Input
                    value={editingListing.contactPhone}
                    onChange={(e) => setEditingListing({ ...editingListing, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Needs / material support</label>
                <Textarea
                  value={editingListing.needs || ""}
                  onChange={(e) => setEditingListing({ ...editingListing, needs: e.target.value })}
                  className="min-h-16"
                />
              </div>

              <label className="flex items-start gap-3 rounded-md border bg-muted/40 p-3 text-sm">
                <Checkbox
                  checked={editingListing.offersExperience || false}
                  onCheckedChange={(checked) => setEditingListing({ ...editingListing, offersExperience: Boolean(checked) })}
                />
                <span>
                  <span className="block font-semibold">Bookable impact experience</span>
                  <span className="text-muted-foreground">Show request-to-book controls on the public Community Hub.</span>
                </span>
              </label>

              <div>
                <label className="mb-1 block text-sm font-semibold">Experience details</label>
                <Textarea
                  value={editingListing.experienceDetails || ""}
                  onChange={(e) => setEditingListing({ ...editingListing, experienceDetails: e.target.value })}
                  className="min-h-16"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Experience price</label>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={editingListing.experiencePrice || ""}
                    onChange={(e) => setEditingListing({ ...editingListing, experiencePrice: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Currency</label>
                  <Input
                    value={editingListing.experienceCurrency || "MWK"}
                    onChange={(e) => setEditingListing({ ...editingListing, experienceCurrency: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Duration minutes</label>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={editingListing.experienceDurationMinutes || ""}
                    onChange={(e) => setEditingListing({ ...editingListing, experienceDurationMinutes: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Max guests</label>
                  <Input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={editingListing.experienceMaxGuests || ""}
                    onChange={(e) => setEditingListing({ ...editingListing, experienceMaxGuests: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Impact statement</label>
                <Textarea
                  value={editingListing.impactStatement || ""}
                  onChange={(e) => setEditingListing({ ...editingListing, impactStatement: e.target.value })}
                  className="min-h-16"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Experience booking notes</label>
                <Textarea
                  value={editingListing.experienceBookingNotes || ""}
                  onChange={(e) => setEditingListing({ ...editingListing, experienceBookingNotes: e.target.value })}
                  className="min-h-16"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Image URL</label>
                <Input
                  value={editingListing.imageUrl || ""}
                  onChange={(e) => setEditingListing({ ...editingListing, imageUrl: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingListing(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingListing) {
                  editMutation.mutate(editingListing);
                }
              }}
              disabled={editMutation.isPending}
            >
              {editMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
