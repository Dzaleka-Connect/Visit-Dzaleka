import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  Phone,
  Mail,
  Globe,
  Users,
  DollarSign,
  Star,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/empty-state";
import { CardGridSkeleton } from "@/components/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatCurrency, LANGUAGES } from "@/lib/constants";
import type { Guide, InsertGuide } from "@shared/schema";
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
import { Checkbox } from "@/components/ui/checkbox";
import { SEO } from "@/components/seo";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";

const guideFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone number is required"),
  bio: z.string().optional(),
  languages: z.array(z.string()).default([]),
  specialties: z.array(z.string()).default([]),
  availableDays: z.array(z.string()).default([]),
  preferredTimes: z.array(z.string()).default([]),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  preferredPaymentMethod: z.string().default("cash"),
  additionalNotes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type GuideFormValues = z.infer<typeof guideFormSchema>;

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const TOUR_TIMES = [
  { value: "morning", label: "Morning (8:00 AM - 12:00 PM)" },
  { value: "afternoon", label: "Afternoon (12:00 PM - 4:00 PM)" },
  { value: "evening", label: "Evening (4:00 PM - 7:00 PM)" },
];

// Helper function to create consistent URL slugs
const createGuideSlug = (firstName: string, lastName: string) => {
  return `${firstName}-${lastName}`
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

export default function Guides() {
  const { toast } = useToast();
  const searchString = useSearch();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [deleteGuide, setDeleteGuide] = useState<Guide | null>(null);
  const [expandedGuides, setExpandedGuides] = useState<Set<string>>(new Set());

  const { data: guides, isLoading } = useQuery<Guide[]>({
    queryKey: ["/api/guides"],
  });

  // Handle ?edit=<guideId> query parameter
  useEffect(() => {
    if (!guides || isLoading) return;

    const params = new URLSearchParams(searchString);
    const editId = params.get("edit");

    if (editId) {
      const guideToEdit = guides.find(g => g.id === editId);
      if (guideToEdit) {
        handleEdit(guideToEdit);
        // Clear the query param from URL without navigation
        window.history.replaceState({}, '', '/guides');
      }
    }
  }, [guides, isLoading, searchString]);

  const form = useForm<GuideFormValues>({
    resolver: zodResolver(guideFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      bio: "",
      languages: [],
      specialties: [],
      availableDays: [],
      preferredTimes: [],
      emergencyContactName: "",
      emergencyContactPhone: "",
      preferredPaymentMethod: "cash",
      additionalNotes: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertGuide) => {
      await apiRequest("POST", "/api/guides", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setIsFormOpen(false);
      form.reset();
      toast({
        title: "Guide added",
        description: "New guide has been added successfully.",
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
        description: "Failed to add guide.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Guide> }) => {
      await apiRequest("PATCH", `/api/guides/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guides"] });
      setIsFormOpen(false);
      setEditingGuide(null);
      form.reset();
      toast({
        title: "Guide updated",
        description: "Guide information has been updated.",
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
        description: "Failed to update guide.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/guides/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setDeleteGuide(null);
      toast({
        title: "Guide removed",
        description: "Guide has been removed from the system.",
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
        description: "Failed to remove guide.",
        variant: "destructive",
      });
    },
  });

  const filteredGuides = guides?.filter(
    (guide) =>
      guide.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.phone.includes(searchQuery)
  );

  const handleEdit = (guide: Guide) => {
    setEditingGuide(guide);
    form.reset({
      firstName: guide.firstName,
      lastName: guide.lastName,
      email: guide.email || "",
      phone: guide.phone,
      bio: guide.bio || "",
      languages: guide.languages || [],
      specialties: guide.specialties || [],
      availableDays: (guide as any).availableDays || [],
      preferredTimes: (guide as any).preferredTimes || [],
      emergencyContactName: (guide as any).emergencyContactName || "",
      emergencyContactPhone: (guide as any).emergencyContactPhone || "",
      preferredPaymentMethod: (guide as any).preferredPaymentMethod || "cash",
      additionalNotes: (guide as any).additionalNotes || "",
      isActive: guide.isActive ?? true,
    });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingGuide(null);
    form.reset({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      bio: "",
      languages: [],
      specialties: [],
      availableDays: [],
      preferredTimes: [],
      emergencyContactName: "",
      emergencyContactPhone: "",
      preferredPaymentMethod: "cash",
      additionalNotes: "",
      isActive: true,
    });
    setIsFormOpen(true);
  };

  const onSubmit = (data: GuideFormValues) => {
    const guideData = {
      ...data,
      email: data.email || null,
      bio: data.bio || null,
    };

    if (editingGuide) {
      updateMutation.mutate({ id: editingGuide.id, data: guideData });
    } else {
      createMutation.mutate(guideData as InsertGuide);
    }
  };

  if (isLoading) {
    return <CardGridSkeleton count={6} />;
  }

  return (
    <PageContainer className="page-spacing">
      <SEO
        title="Our Guides"
        description="Meet our expert local guides. Each guide brings a unique perspective and deep knowledge of Dzaleka's history and culture."
      />
      <PageHeader
        title="Guides"
        description="Manage your tour guides and their availability."
      >
        <Button onClick={handleAddNew} data-testid="button-add-guide">
          <Plus className="mr-2 h-4 w-4" />
          Add Guide
        </Button>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search guides..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-guides"
        />
      </div>

      {!filteredGuides || filteredGuides.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No guides found"
          description={
            searchQuery
              ? "Try adjusting your search."
              : "Add your first guide to get started."
          }
          action={
            !searchQuery && (
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Guide
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGuides.map((guide) => (
            <Card
              key={guide.id}
              className="hover-elevate"
              data-testid={`guide-card-${guide.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <Link href={`/guide/${createGuideSlug(guide.firstName, guide.lastName)}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={guide.profileImageUrl || undefined}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {guide.firstName[0]}
                        {guide.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-primary hover:underline">
                          {guide.firstName} {guide.lastName}
                        </h3>
                        {guide.isActive ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {guide.phone}
                      </p>
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-guide-actions-${guide.id}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/guide/${createGuideSlug(guide.firstName, guide.lastName)}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(guide)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteGuide(guide)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {guide.bio && (
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                    {guide.bio}
                  </p>
                )}

                {guide.languages && guide.languages.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1">
                    {guide.languages.slice(0, 3).map((lang) => (
                      <Badge
                        key={lang}
                        variant="outline"
                        className="text-xs"
                      >
                        <Globe className="mr-1 h-3 w-3" />
                        {lang}
                      </Badge>
                    ))}
                    {guide.languages.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{guide.languages.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{guide.totalTours || 0} tours</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-amber-600">
                      <Star className="h-4 w-4 fill-amber-400" />
                      <span>{guide.rating || 0}/5</span>
                      {guide.totalRatings ? (
                        <span className="text-xs text-muted-foreground">({guide.totalRatings})</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                    <DollarSign className="h-4 w-4" />
                    <span>{formatCurrency(guide.totalEarnings || 0)}</span>
                  </div>
                </div>

                {/* Expand/Collapse Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => {
                    const newExpanded = new Set(expandedGuides);
                    if (newExpanded.has(guide.id)) {
                      newExpanded.delete(guide.id);
                    } else {
                      newExpanded.add(guide.id);
                    }
                    setExpandedGuides(newExpanded);
                  }}
                >
                  {expandedGuides.has(guide.id) ? (
                    <>
                      <ChevronUp className="mr-2 h-4 w-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-4 w-4" />
                      View Details
                    </>
                  )}
                </Button>

                {/* Expanded Details */}
                {expandedGuides.has(guide.id) && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    {/* Availability */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        Availability
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Available Days:</p>
                          <div className="flex flex-wrap gap-1">
                            {(guide as any).availableDays?.length > 0 ? (
                              (guide as any).availableDays.map((day: string) => (
                                <Badge key={day} variant="outline" className="text-xs capitalize">
                                  {day}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">Not specified</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Preferred Times:</p>
                          <div className="flex flex-wrap gap-1">
                            {(guide as any).preferredTimes?.length > 0 ? (
                              (guide as any).preferredTimes.map((time: string) => (
                                <Badge key={time} variant="outline" className="text-xs capitalize">
                                  {time}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">Not specified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Preference */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-green-500" />
                        Payment Preference
                      </h4>
                      <Badge variant="secondary">
                        {(guide as any).preferredPaymentMethod === "both"
                          ? "Cash & Mobile Money"
                          : (guide as any).preferredPaymentMethod === "mobile_money"
                            ? "Mobile Money"
                            : (guide as any).preferredPaymentMethod === "cash"
                              ? "Cash"
                              : "Not specified"}
                      </Badge>
                    </div>

                    {/* Emergency Contact */}
                    {((guide as any).emergencyContactName || (guide as any).emergencyContactPhone) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Emergency Contact
                        </h4>
                        <div className="text-sm">
                          {(guide as any).emergencyContactName && (
                            <p>{(guide as any).emergencyContactName}</p>
                          )}
                          {(guide as any).emergencyContactPhone && (
                            <p className="text-muted-foreground">{(guide as any).emergencyContactPhone}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Additional Notes */}
                    {(guide as any).additionalNotes && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Notes</h4>
                        <p className="text-sm text-muted-foreground">{(guide as any).additionalNotes}</p>
                      </div>
                    )}

                    {/* Email */}
                    {guide.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {guide.email}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGuide ? "Edit Guide" : "Add New Guide"}
            </DialogTitle>
            <DialogDescription>
              {editingGuide
                ? "Update guide information and availability settings."
                : "Add a new guide to your team."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          {...field}
                          data-testid="input-first-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          {...field}
                          data-testid="input-last-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+265 999 123 456"
                        {...field}
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description about the guide..."
                        className="min-h-[80px]"
                        {...field}
                        data-testid="textarea-bio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="languages"
                render={() => (
                  <FormItem>
                    <FormLabel>Languages</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {LANGUAGES.map((language) => (
                        <FormField
                          key={language}
                          control={form.control}
                          name="languages"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(language)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, language]);
                                    } else {
                                      field.onChange(
                                        current.filter((l) => l !== language)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {language}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Available Days */}
              <FormField
                control={form.control}
                name="availableDays"
                render={() => (
                  <FormItem>
                    <FormLabel>Available Days (Select All That Apply)</FormLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <FormField
                          key={day.value}
                          control={form.control}
                          name="availableDays"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(day.value)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, day.value]);
                                    } else {
                                      field.onChange(
                                        current.filter((d) => d !== day.value)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {day.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Preferred Tour Times */}
              <FormField
                control={form.control}
                name="preferredTimes"
                render={() => (
                  <FormItem>
                    <FormLabel>Preferred Tour Times</FormLabel>
                    <div className="grid gap-2">
                      {TOUR_TIMES.map((time) => (
                        <FormField
                          key={time.value}
                          control={form.control}
                          name="preferredTimes"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(time.value)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, time.value]);
                                    } else {
                                      field.onChange(
                                        current.filter((t) => t !== time.value)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {time.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Emergency Contact */}
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-medium">Emergency Contact</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact person name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+265..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Payment Preferences */}
              <FormField
                control={form.control}
                name="preferredPaymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Method of Payment</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "cash", label: "Cash Only" },
                        { value: "mobile_money", label: "Mobile Money Only" },
                        { value: "both", label: "Both (Cash & Mobile Money)" },
                      ].map((method) => (
                        <div
                          key={method.value}
                          className={`flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-colors ${field.value === method.value
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-muted-foreground/50"
                            } ${method.value === "both" ? "col-span-2" : ""}`}
                          onClick={() => field.onChange(method.value)}
                        >
                          <span className="text-sm font-medium">{method.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mobile Money includes Airtel Money and TNM Mpamba based on your number.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Additional Notes */}
              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Comments or Questions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information, availability notes, or questions..."
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Inactive guides won't appear in assignment options.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-guide"
                >
                  {editingGuide ? "Update Guide" : "Add Guide"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteGuide} onOpenChange={() => setDeleteGuide(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Guide</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deleteGuide?.firstName}{" "}
              {deleteGuide?.lastName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteGuide && deleteMutation.mutate(deleteGuide.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
