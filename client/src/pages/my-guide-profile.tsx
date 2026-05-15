import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ArrowRight,
  Camera,
  CheckCircle,
  Clock,
  Eye,
  Languages,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { SEO } from "@/components/seo";
import { useToast } from "@/hooks/use-toast";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { uploadAvatarImage, validateProfileImage } from "@/lib/uploads";
import type { Guide, GuideProfileChangeRequest } from "@shared/schema";

const dayOptions = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const timeOptions = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

const guideProfileFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(120),
  lastName: z.string().trim().min(1, "Last name is required").max(120),
  email: z.string().trim().email("Use a valid email address").optional().or(z.literal("")),
  phone: z.string().trim().min(1, "Phone number is required").max(80),
  profileImageUrl: z.string().trim().url("Use a valid image URL").optional().or(z.literal("")),
  bio: z.string().trim().max(2000, "Keep the bio under 2,000 characters").optional(),
  languagesText: z.string().trim().max(1000, "Keep languages under 1,000 characters").optional(),
  specialtiesText: z.string().trim().max(1000, "Keep specialties under 1,000 characters").optional(),
  availableDays: z.array(z.string()).default([]),
  preferredTimes: z.array(z.string()).default([]),
});

type GuideProfileFormValues = z.infer<typeof guideProfileFormSchema>;

function createGuideSlug(firstName: string, lastName: string) {
  return `${firstName}-${lastName}`
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase() || "G";
}

function listToText(values?: string[] | null) {
  return (values || []).filter(Boolean).join(", ");
}

function textToList(value?: string) {
  if (!value) return [];
  return Array.from(new Set(value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)));
}

function formatReviewDate(value?: string | Date | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function guideToFormValues(guide: Guide): GuideProfileFormValues {
  return {
    firstName: guide.firstName || "",
    lastName: guide.lastName || "",
    email: guide.email || "",
    phone: guide.phone || "",
    profileImageUrl: guide.profileImageUrl || "",
    bio: guide.bio || "",
    languagesText: listToText(guide.languages),
    specialtiesText: listToText(guide.specialties),
    availableDays: guide.availableDays || [],
    preferredTimes: guide.preferredTimes || [],
  };
}

export default function MyGuideProfile() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { data: guide, isLoading } = useQuery<Guide>({
    queryKey: ["/api/guides/me"],
  });

  const { data: profileChangeRequests = [] } = useQuery<GuideProfileChangeRequest[]>({
    queryKey: ["/api/guides/me/profile-change-requests"],
    enabled: !!guide,
  });

  const form = useForm<GuideProfileFormValues>({
    resolver: zodResolver(guideProfileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      profileImageUrl: "",
      bio: "",
      languagesText: "",
      specialtiesText: "",
      availableDays: [],
      preferredTimes: [],
    },
  });

  const watchedValues = form.watch();
  const watchedProfileImageUrl = watchedValues.profileImageUrl;
  const previewLanguages = textToList(watchedValues.languagesText);
  const previewSpecialties = textToList(watchedValues.specialtiesText);
  const guideSlug = createGuideSlug(watchedValues.firstName, watchedValues.lastName);

  useUnsavedChanges(form.formState.isDirty);

  useEffect(() => {
    if (guide) {
      form.reset(guideToFormValues(guide));
    }
  }, [form, guide]);

  const saveMutation = useMutation({
    mutationFn: async (values: GuideProfileFormValues) => {
      const response = await apiRequest("PATCH", "/api/guides/me", {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email?.trim() || null,
        phone: values.phone.trim(),
        profileImageUrl: values.profileImageUrl?.trim() || null,
        bio: values.bio?.trim() || null,
        languages: textToList(values.languagesText),
        specialties: textToList(values.specialtiesText),
        availableDays: values.availableDays,
        preferredTimes: values.preferredTimes,
      });

      return response.json() as Promise<{
        guide: Guide;
        changeRequest: GuideProfileChangeRequest;
        message?: string;
      }>;
    },
    onSuccess: () => {
      if (guide) {
        form.reset(guideToFormValues(guide));
      }
      queryClient.invalidateQueries({ queryKey: ["/api/guides/me/profile-change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile changes submitted",
        description: "An admin will review your public guide profile before it is published.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      validateProfileImage(file);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please choose a different image.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    setIsUploadingImage(true);
    try {
      const { publicUrl } = await uploadAvatarImage(file, "guide_profile");
      form.setValue("profileImageUrl", publicUrl, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      toast({
        title: "Guide photo uploaded",
        description: "Submit your profile changes for admin review to publish this photo.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  if (isLoading) {
    return (
      <PageContainer className="page-spacing">
        <div className="flex min-h-[320px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading guide profile" />
        </div>
      </PageContainer>
    );
  }

  if (!guide) {
    return (
      <PageContainer className="page-spacing">
        <Card>
          <CardContent className="py-10 text-center">
            <User className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <h1 className="mt-4 text-xl font-semibold">Guide profile not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">Ask an administrator to link your user account to a guide profile.</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="page-spacing">
      <SEO
        title="My Public Guide Profile"
        description="Manage the public guide profile visitors see after assignment."
      />
      <PageHeader
        title="My Public Guide Profile"
        description="Submit updates to the public profile visitors see when you are assigned to their tour."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Photo</CardTitle>
                <CardDescription>Use a clear headshot so visitors can recognize their guide.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="profileImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
                        <Avatar className="h-24 w-24 border">
                          <AvatarImage src={watchedProfileImageUrl || undefined} className="object-cover" />
                          <AvatarFallback className="text-xl">
                            {getInitials(watchedValues.firstName, watchedValues.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 space-y-3">
                          <FormLabel>Profile image URL</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              inputMode="url"
                              placeholder="https://example.com/guide-photo.jpg…"
                              {...field}
                            />
                          </FormControl>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="sr-only"
                            aria-label="Upload guide profile photo"
                            onChange={handleImageUpload}
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploadingImage}
                            >
                              {isUploadingImage ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                              ) : (
                                <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
                              )}
                              Upload photo
                            </Button>
                            {watchedProfileImageUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => form.setValue("profileImageUrl", "", { shouldDirty: true, shouldTouch: true })}
                              >
                                Remove photo
                              </Button>
                            )}
                          </div>
                          <FormDescription>JPG, PNG, WEBP, or GIF. Maximum 5 MB.</FormDescription>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Details</CardTitle>
                <CardDescription>These details help visitors and staff identify and contact you.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name…" autoComplete="given-name" {...field} />
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
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name…" autoComplete="family-name" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" inputMode="email" placeholder="name@example.com…" autoComplete="email" spellCheck={false} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" inputMode="tel" placeholder="+265…" autoComplete="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Public Story</CardTitle>
                <CardDescription>Describe your background, languages, and the tours you are strongest at.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Share a short introduction for visitors…" rows={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="languagesText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Languages</FormLabel>
                      <FormControl>
                        <Input placeholder="English, Chichewa, Swahili…" {...field} />
                      </FormControl>
                      <FormDescription>Separate languages with commas.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specialtiesText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialties</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Culture, storytelling, food, arts, community projects…" rows={3} {...field} />
                      </FormControl>
                      <FormDescription>Separate specialties with commas or new lines.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Public Availability</CardTitle>
                <CardDescription>This helps staff match you with suitable tour requests.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="availableDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available days</FormLabel>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {dayOptions.map((day) => (
                          <label key={day.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border p-3 text-sm">
                            <Checkbox
                              checked={field.value?.includes(day.value)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                field.onChange(
                                  checked
                                    ? [...current, day.value]
                                    : current.filter((value) => value !== day.value)
                                );
                              }}
                            />
                            <span>{day.label}</span>
                          </label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredTimes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred times</FormLabel>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {timeOptions.map((time) => (
                          <label key={time.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border p-3 text-sm">
                            <Checkbox
                              checked={field.value?.includes(time.value)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                field.onChange(
                                  checked
                                    ? [...current, time.value]
                                    : current.filter((value) => value !== time.value)
                                );
                              }}
                            />
                            <span>{time.label}</span>
                          </label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" asChild>
                <Link href="/my-availability">Manage weekly availability</Link>
              </Button>
              <Button type="submit" disabled={saveMutation.isPending || !form.formState.isDirty}>
                {saveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                Submit for review
              </Button>
            </div>
          </form>
        </Form>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Review Status</CardTitle>
              <CardDescription>Recent public-profile edits submitted to admins.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {profileChangeRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No profile changes have been submitted yet.</p>
              ) : (
                profileChangeRequests.slice(0, 4).map((request) => {
                  const status = request.status || "pending";
                  const StatusIcon = status === "approved" ? CheckCircle : status === "rejected" ? XCircle : Clock;
                  return (
                    <div key={request.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2 font-medium">
                          <StatusIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          <span className="truncate capitalize">{status.replace(/_/g, " ")}</span>
                        </div>
                        <Badge variant={status === "rejected" ? "destructive" : status === "approved" ? "default" : "secondary"}>
                          {Object.keys((request.proposedData as Record<string, unknown>) || {}).length} fields
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Submitted {formatReviewDate(request.createdAt)}
                      </p>
                      {request.reviewNotes && (
                        <p className="mt-2 break-words text-xs text-muted-foreground">{request.reviewNotes}</p>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="xl:sticky xl:top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5" aria-hidden="true" />
                Visitor Preview
              </CardTitle>
              <CardDescription>A quick check of what visitors and staff will see.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 border">
                  <AvatarImage src={watchedProfileImageUrl || undefined} className="object-cover" />
                  <AvatarFallback className="text-lg">
                    {getInitials(watchedValues.firstName, watchedValues.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-lg font-semibold">
                    {`${watchedValues.firstName || "Guide"} ${watchedValues.lastName || ""}`.trim()}
                  </h2>
                  <p className="text-sm text-muted-foreground">Professional Tour Guide</p>
                  <Badge variant={guide.isActive ? "default" : "secondary"} className="mt-2">
                    {guide.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              {watchedValues.bio && (
                <p className="break-words text-sm text-muted-foreground">{watchedValues.bio}</p>
              )}

              <div className="space-y-3 text-sm">
                {watchedValues.phone && (
                  <div className="flex min-w-0 items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="break-words">{watchedValues.phone}</span>
                  </div>
                )}
                {watchedValues.email && (
                  <div className="flex min-w-0 items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="break-words">{watchedValues.email}</span>
                  </div>
                )}
              </div>

              {previewLanguages.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Languages className="h-4 w-4" aria-hidden="true" />
                    Languages
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {previewLanguages.map((language) => (
                      <Badge key={language} variant="secondary" className="break-words">{language}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {previewSpecialties.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Specialties
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {previewSpecialties.map((specialty) => (
                      <Badge key={specialty} variant="outline" className="break-words">{specialty}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-md border p-3 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  Assignment fit
                </div>
                <p className="mt-1 break-words text-muted-foreground">
                  {watchedValues.availableDays.length
                    ? `${watchedValues.availableDays.length} preferred day${watchedValues.availableDays.length === 1 ? "" : "s"} selected.`
                    : "No preferred days selected yet."}
                </p>
              </div>

              {guideSlug && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/guide/${guideSlug}`}>
                    View full profile
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
