import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Building2,
  HeartHandshake,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
  AlertTriangle,
  Loader2,
  MessageSquare,
  Package,
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

interface AdminCommunityExperienceRequest extends CommunityExperienceRequest {
  listing?: CommunityListing | null;
}

export default function AdminCommunityListings() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
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
      setActiveTab(variables.status || "approved");
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
        title: variables.status === "approved" ? "Listing Approved" : "Listing Rejected",
        description: `The listing has been successfully marked as ${variables.status}.`,
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

  // Filter listings by tab and search query
  const filteredListings = listings.filter((item) => {
    // 1. Filter by Tab status
    if (activeTab === "pending" && item.status !== "pending") return false;
    if (activeTab === "approved" && item.status !== "approved") return false;
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

  const getListingIcon = (type: string) => {
    return type === "business" ? (
      <Building2 className="h-5 w-5 text-indigo-500" />
    ) : (
      <HeartHandshake className="h-5 w-5 text-emerald-500" />
    );
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Pending Review</Badge>;
    }
  };

  const formatRequestDate = (date: string | Date | null) => {
    if (!date) return "No date";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
  };

  const openExperienceRequests = experienceRequests.filter((request) =>
    request.status === "submitted" || request.status === "contacted"
  );

  return (
    <PageContainer>
      <SEO title="Community Listings Moderation | Visit Dzaleka Admin" />

      <PageHeader
        title="Community Listings Moderation"
        description="Moderate and vet local business directories, craft makers, local eateries, and community projects/supply lists."
      >
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add Listing
        </Button>
      </PageHeader>

      {openExperienceRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Compass className="h-5 w-5 text-primary" aria-hidden="true" />
              Community Impact Experience Requests
            </CardTitle>
            <CardDescription>
              New visitor requests that need host availability checked before confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-2">
            {openExperienceRequests.slice(0, 6).map((request) => (
              <div key={request.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words font-medium">{request.listing?.name || "Community experience"}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.visitorName} · {formatRequestDate(request.preferredDate)}{request.preferredTime ? ` at ${request.preferredTime}` : ""}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{request.status}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <span className="break-words">{request.visitorEmail}</span>
                  <span>{request.visitorPhone || "No phone"}</span>
                  <span>{request.groupSize} guest{request.groupSize === 1 ? "" : "s"}</span>
                </div>
                {request.message && (
                  <p className="mt-3 line-clamp-3 break-words rounded-md bg-muted/50 p-2 text-sm text-muted-foreground">
                    {request.message}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => requestStatusMutation.mutate({ id: request.id, status: "contacted" })}
                    disabled={requestStatusMutation.isPending}
                  >
                    Mark contacted
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
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {/* Filter Controls */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="pending">Pending Queue</TabsTrigger>
              <TabsTrigger value="approved">Approved Listings</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, category, contact…"
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
        ) : filteredListings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No listings found</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                There are no listings in the "{activeTab}" state matching your parameters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {filteredListings.map((item) => (
              <Card key={item.id} className="flex flex-col justify-between border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {getListingIcon(item.type)}
                        {item.category}
                      </span>
                      <CardTitle className="text-lg font-bold mt-1">{item.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {item.location}
                      </CardDescription>
                    </div>
                    <div>{getStatusBadge(item.status)}</div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pb-4">
                  <p className="text-sm text-muted-foreground">{item.description}</p>

                  {item.needs && (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5">
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <Package className="h-3.5 w-3.5" />
                        Requested Supplies / Needs:
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground whitespace-pre-line">{item.needs}</p>
                    </div>
                  )}

                  {item.offersExperience && item.experienceDetails && (
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-2.5">
                      <span className="flex items-center gap-1 text-xs font-bold text-indigo-800 dark:text-indigo-300">
                        <Compass className="h-3.5 w-3.5" />
                        Community Impact Experience:
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">{item.experienceDetails}</p>
                      <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                        {item.experiencePrice && (
                          <span>
                            {new Intl.NumberFormat(undefined, {
                              style: "currency",
                              currency: item.experienceCurrency || "MWK",
                              maximumFractionDigits: 0,
                            }).format(item.experiencePrice)}
                          </span>
                        )}
                        {item.experienceDurationMinutes && <span>{item.experienceDurationMinutes} minutes</span>}
                        {item.experienceMaxGuests && (
                          <span>
                            {item.experienceMinGuests || 1}-{item.experienceMaxGuests} guests
                          </span>
                        )}
                      </div>
                      {item.impactStatement && (
                        <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">{item.impactStatement}</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border">
                    <div>
                      <span className="font-semibold block text-slate-500">Contact Person</span>
                      {item.contactName}
                    </div>
                    <div>
                      <span className="font-semibold block text-slate-500">Phone / WhatsApp</span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {item.contactPhone}
                      </span>
                    </div>
                    {item.contactEmail && (
                      <div className="col-span-2 mt-1">
                        <span className="font-semibold block text-slate-500">Email</span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {item.contactEmail}
                        </span>
                      </div>
                    )}
                  </div>

                  {item.moderationNotes && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-2.5 rounded-lg text-xs">
                      <span className="font-semibold text-amber-800 dark:text-amber-300">Moderator Feedback:</span>
                      <p className="mt-0.5 text-muted-foreground">{item.moderationNotes}</p>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
                    {item.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 text-white hover:bg-green-500 flex-1 min-w-[100px]"
                          onClick={() => moderateMutation.mutate({ id: item.id, status: "approved" })}
                          disabled={moderateMutation.isPending}
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 flex-1 min-w-[100px]"
                          onClick={() => setRejectingListing(item)}
                          disabled={moderateMutation.isPending}
                        >
                          <XCircle className="mr-1.5 h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingListing(item)}
                      disabled={editMutation.isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-600 border-red-100 hover:bg-red-50"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this listing?")) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
            <DialogTitle>Add Community Listing</DialogTitle>
            <DialogDescription>
              Add a local business, artisan, project, or experience directly from the admin dashboard.
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
                      <FormLabel>Listing Type</FormLabel>
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
                      <FormLabel>Publishing Status</FormLabel>
                      <Select value={field.value || "approved"} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose status…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="approved">Publish now</SelectItem>
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
            <DialogTitle>Edit Listing: {editingListing?.name}</DialogTitle>
            <DialogDescription>
              Make direct administrative corrections to listing details.
            </DialogDescription>
          </DialogHeader>

          {editingListing && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-semibold block mb-1">Name</label>
                <Input
                  value={editingListing.name}
                  onChange={(e) => setEditingListing({ ...editingListing, name: e.target.value })}
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="text-sm font-semibold block mb-1">Category</label>
                  <Input
                    value={editingListing.category}
                    onChange={(e) => setEditingListing({ ...editingListing, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1">Location</label>
                  <Input
                    value={editingListing.location}
                    onChange={(e) => setEditingListing({ ...editingListing, location: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1">Description</label>
                <Textarea
                  value={editingListing.description}
                  onChange={(e) => setEditingListing({ ...editingListing, description: e.target.value })}
                  className="min-h-20"
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="text-sm font-semibold block mb-1">Contact Name</label>
                  <Input
                    value={editingListing.contactName}
                    onChange={(e) => setEditingListing({ ...editingListing, contactName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1">Contact Phone</label>
                  <Input
                    value={editingListing.contactPhone}
                    onChange={(e) => setEditingListing({ ...editingListing, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1">Needs / Material Support</label>
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
                <label className="text-sm font-semibold block mb-1">Experience Details</label>
                <Textarea
                  value={editingListing.experienceDetails || ""}
                  onChange={(e) => setEditingListing({ ...editingListing, experienceDetails: e.target.value })}
                  className="min-h-16"
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="text-sm font-semibold block mb-1">Experience Price</label>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={editingListing.experiencePrice || ""}
                    onChange={(e) => setEditingListing({ ...editingListing, experiencePrice: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1">Currency</label>
                  <Input
                    value={editingListing.experienceCurrency || "MWK"}
                    onChange={(e) => setEditingListing({ ...editingListing, experienceCurrency: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1">Duration Minutes</label>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={editingListing.experienceDurationMinutes || ""}
                    onChange={(e) => setEditingListing({ ...editingListing, experienceDurationMinutes: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1">Max Guests</label>
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
                <label className="text-sm font-semibold block mb-1">Impact Statement</label>
                <Textarea
                  value={editingListing.impactStatement || ""}
                  onChange={(e) => setEditingListing({ ...editingListing, impactStatement: e.target.value })}
                  className="min-h-16"
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1">Experience Booking Notes</label>
                <Textarea
                  value={editingListing.experienceBookingNotes || ""}
                  onChange={(e) => setEditingListing({ ...editingListing, experienceBookingNotes: e.target.value })}
                  className="min-h-16"
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1">Image URL</label>
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
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
