import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  CalendarDays,
  Camera,
  Clock,
  Eye,
  EyeOff,
  Filter,
  Grid3X3,
  Info,
  List,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Compass,
  MoreHorizontal,
  Home,
  Building,
  Store,
  Mountain,
  Search,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Zone, PointOfInterest, MeetingPoint } from "@shared/schema";
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
import { useLocation } from "wouter";

const optionalPositiveInteger = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
  z.number().int().min(0).optional()
);

const zoneFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  zoneType: z.string().default("route_area"),
  isPublic: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
  internalNotes: z.string().optional(),
  lastReviewedAt: z.string().optional(),
  lastReviewedBy: z.string().optional(),
  isActive: z.boolean().default(true),
});

const poiFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  visitorDescription: z.string().optional(),
  internalNotes: z.string().optional(),
  estimatedDurationMinutes: optionalPositiveInteger,
  photoPolicy: z.string().default("ask_first"),
  mobilityLevel: z.string().default("easy"),
  bestVisitDays: z.string().optional(),
  requiresPermission: z.boolean().default(false),
  serviceDirectoryUrl: z.string().optional(),
  isPublic: z.boolean().default(true),
  lastReviewedAt: z.string().optional(),
  lastReviewedBy: z.string().optional(),
  isActive: z.boolean().default(true),
});

const meetingPointFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  googleMapsUrl: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  meetingInstructions: z.string().optional(),
  guideIdentificationNote: z.string().optional(),
  arrivalBufferMinutes: optionalPositiveInteger,
  backupMeetingPoint: z.string().optional(),
  safetyNotes: z.string().optional(),
  isDefault: z.boolean().default(false),
  lastReviewedAt: z.string().optional(),
  lastReviewedBy: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ZoneFormValues = z.infer<typeof zoneFormSchema>;
type PoiFormValues = z.infer<typeof poiFormSchema>;
type MeetingPointFormValues = z.infer<typeof meetingPointFormSchema>;

const iconMap: Record<string, any> = {
  home: Home,
  building: Building,
  store: Store,
  mountain: Mountain,
  default: MapPin,
};

const zoneTypeOptions = [
  { value: "residential", label: "Residential" },
  { value: "market", label: "Market" },
  { value: "education", label: "Education" },
  { value: "organization", label: "Organization" },
  { value: "viewpoint", label: "Viewpoint" },
  { value: "admin", label: "Admin" },
  { value: "route_area", label: "Route area" },
];

const poiCategoryOptions = [
  "culture",
  "market",
  "education",
  "organization",
  "health",
  "youth",
  "arts",
  "food",
  "viewpoint",
];

const photoPolicyOptions = [
  { value: "allowed", label: "Allowed" },
  { value: "ask_first", label: "Ask first" },
  { value: "restricted", label: "Restricted" },
];

const mobilityLevelOptions = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "difficult", label: "Difficult" },
];

type LocationDetail =
  | { type: "zone"; item: Zone }
  | { type: "poi"; item: PointOfInterest }
  | { type: "meeting"; item: MeetingPoint };

type ViewMode = "cards" | "table";

function labelFor(value?: string | null) {
  if (!value) return "Not set";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function trimOrUndefined(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function splitCommaList(value?: string | null) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOptionalNumber(value?: string | number | null) {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatReviewDate(value?: string | Date | null) {
  if (!value) return "Not reviewed";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function needsReview(value?: string | Date | null) {
  if (!value) return true;
  const reviewedAt = new Date(value).getTime();
  const reviewWindowMs = 180 * 24 * 60 * 60 * 1000;
  return Number.isNaN(reviewedAt) || Date.now() - reviewedAt > reviewWindowMs;
}

function getInitialTab() {
  if (typeof window === "undefined") return "zones";
  const section = new URLSearchParams(window.location.search).get("section");
  return section === "poi" || section === "meeting" || section === "zones" ? section : "zones";
}

export default function Zones() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, statusFilter, categoryFilter]);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedLocation, setSelectedLocation] = useState<LocationDetail | null>(null);
  const [isZoneFormOpen, setIsZoneFormOpen] = useState(false);
  const [isPoiFormOpen, setIsPoiFormOpen] = useState(false);
  const [isMeetingPointFormOpen, setIsMeetingPointFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editingPoi, setEditingPoi] = useState<PointOfInterest | null>(null);
  const [editingMeetingPoint, setEditingMeetingPoint] =
    useState<MeetingPoint | null>(null);
  const [deleteItem, setDeleteItem] = useState<{
    type: "zone" | "poi" | "meetingPoint";
    item: Zone | PointOfInterest | MeetingPoint;
  } | null>(null);

  const { data: zones, isLoading: isLoadingZones, isError: isZonesError } = useQuery<Zone[]>({
    queryKey: ["/api/zones"],
  });

  const { data: pointsOfInterest, isLoading: isLoadingPois, isError: isPoisError } = useQuery<PointOfInterest[]>({
    queryKey: ["/api/points-of-interest"],
  });

  const { data: meetingPoints, isLoading: isLoadingMeetingPoints, isError: isMeetingPointsError } = useQuery<MeetingPoint[]>({
    queryKey: ["/api/meeting-points"],
  });

  useEffect(() => {
    const nextTab = getInitialTab();
    setActiveTab(nextTab);
  }, [location]);

  const zoneForm = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneFormSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      zoneType: "route_area",
      isPublic: true,
      sortOrder: 0,
      internalNotes: "",
      lastReviewedAt: "",
      lastReviewedBy: "",
      isActive: true,
    },
  });

  const poiForm = useForm<PoiFormValues>({
    resolver: zodResolver(poiFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      visitorDescription: "",
      internalNotes: "",
      estimatedDurationMinutes: undefined,
      photoPolicy: "ask_first",
      mobilityLevel: "easy",
      bestVisitDays: "",
      requiresPermission: false,
      serviceDirectoryUrl: "",
      isPublic: true,
      lastReviewedAt: "",
      lastReviewedBy: "",
      isActive: true,
    },
  });

  const meetingPointForm = useForm<MeetingPointFormValues>({
    resolver: zodResolver(meetingPointFormSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      googleMapsUrl: "",
      latitude: "",
      longitude: "",
      meetingInstructions: "",
      guideIdentificationNote: "",
      arrivalBufferMinutes: 10,
      backupMeetingPoint: "",
      safetyNotes: "",
      isDefault: false,
      lastReviewedAt: "",
      lastReviewedBy: "",
      isActive: true,
    },
  });

  const activeZones = useMemo(() => (zones || []).filter((zone) => zone.isActive !== false), [zones]);
  const publicVisitorStops = useMemo(
    () => (pointsOfInterest || []).filter((poi) => poi.isActive !== false && poi.isPublic !== false),
    [pointsOfInterest]
  );
  const activeMeetingPoints = useMemo(
    () => (meetingPoints || []).filter((point) => point.isActive !== false),
    [meetingPoints]
  );
  const locationsNeedingReview = useMemo(() => {
    const zoneCount = (zones || []).filter((zone) => needsReview(zone.lastReviewedAt)).length;
    const poiCount = (pointsOfInterest || []).filter((poi) => needsReview(poi.lastReviewedAt)).length;
    const meetingCount = (meetingPoints || []).filter((point) => needsReview(point.lastReviewedAt)).length;
    return zoneCount + poiCount + meetingCount;
  }, [meetingPoints, pointsOfInterest, zones]);

  const filterText = searchTerm.trim().toLowerCase();
  const filteredZones = useMemo(() => {
    return (zones || []).filter((zone) => {
      const haystack = [
        zone.name,
        zone.description,
        zone.zoneType,
        zone.internalNotes,
        zone.lastReviewedBy,
      ].join(" ").toLowerCase();
      const matchesSearch = !filterText || haystack.includes(filterText);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && zone.isActive !== false) ||
        (statusFilter === "inactive" && zone.isActive === false) ||
        (statusFilter === "public" && zone.isPublic !== false) ||
        (statusFilter === "internal" && zone.isPublic === false) ||
        (statusFilter === "needs_review" && needsReview(zone.lastReviewedAt));
      const matchesCategory = categoryFilter === "all" || zone.zoneType === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, filterText, statusFilter, zones]);

  const filteredPois = useMemo(() => {
    return (pointsOfInterest || []).filter((poi) => {
      const haystack = [
        poi.name,
        poi.description,
        poi.visitorDescription,
        poi.category,
        poi.internalNotes,
        poi.serviceDirectoryUrl,
        poi.lastReviewedBy,
      ].join(" ").toLowerCase();
      const matchesSearch = !filterText || haystack.includes(filterText);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && poi.isActive !== false) ||
        (statusFilter === "inactive" && poi.isActive === false) ||
        (statusFilter === "public" && poi.isPublic !== false) ||
        (statusFilter === "internal" && poi.isPublic === false) ||
        (statusFilter === "permission" && poi.requiresPermission === true) ||
        (statusFilter === "needs_review" && needsReview(poi.lastReviewedAt));
      const matchesCategory = categoryFilter === "all" || poi.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, filterText, pointsOfInterest, statusFilter]);

  const filteredMeetingPoints = useMemo(() => {
    return (meetingPoints || []).filter((point) => {
      const haystack = [
        point.name,
        point.description,
        point.address,
        point.meetingInstructions,
        point.guideIdentificationNote,
        point.backupMeetingPoint,
        point.safetyNotes,
        point.lastReviewedBy,
      ].join(" ").toLowerCase();
      const matchesSearch = !filterText || haystack.includes(filterText);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && point.isActive !== false) ||
        (statusFilter === "inactive" && point.isActive === false) ||
        (statusFilter === "default" && point.isDefault === true) ||
        (statusFilter === "needs_review" && needsReview(point.lastReviewedAt));
      return matchesSearch && matchesStatus;
    });
  }, [filterText, meetingPoints, statusFilter]);

  const paginatedZones = useMemo(() => {
    return filteredZones.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredZones, currentPage]);

  const paginatedPois = useMemo(() => {
    return filteredPois.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredPois, currentPage]);

  const paginatedMeetingPoints = useMemo(() => {
    return filteredMeetingPoints.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredMeetingPoints, currentPage]);

  const visibleCategoryOptions = activeTab === "zones" ? zoneTypeOptions : poiCategoryOptions.map((value) => ({ value, label: labelFor(value) }));

  const serializeZoneForm = (data: ZoneFormValues) => ({
    ...data,
    name: data.name.trim(),
    description: trimOrUndefined(data.description),
    icon: trimOrUndefined(data.icon),
    internalNotes: trimOrUndefined(data.internalNotes),
    lastReviewedAt: trimOrUndefined(data.lastReviewedAt),
    lastReviewedBy: trimOrUndefined(data.lastReviewedBy),
  });

  const serializePoiForm = (data: PoiFormValues) => ({
    ...data,
    name: data.name.trim(),
    description: trimOrUndefined(data.description),
    category: trimOrUndefined(data.category),
    visitorDescription: trimOrUndefined(data.visitorDescription),
    internalNotes: trimOrUndefined(data.internalNotes),
    estimatedDurationMinutes: parseOptionalNumber(data.estimatedDurationMinutes),
    bestVisitDays: splitCommaList(data.bestVisitDays),
    serviceDirectoryUrl: trimOrUndefined(data.serviceDirectoryUrl),
    lastReviewedAt: trimOrUndefined(data.lastReviewedAt),
    lastReviewedBy: trimOrUndefined(data.lastReviewedBy),
  });

  const serializeMeetingPointForm = (data: MeetingPointFormValues) => ({
    ...data,
    name: data.name.trim(),
    description: trimOrUndefined(data.description),
    address: trimOrUndefined(data.address),
    googleMapsUrl: trimOrUndefined(data.googleMapsUrl),
    latitude: parseOptionalNumber(data.latitude),
    longitude: parseOptionalNumber(data.longitude),
    meetingInstructions: trimOrUndefined(data.meetingInstructions),
    guideIdentificationNote: trimOrUndefined(data.guideIdentificationNote),
    arrivalBufferMinutes: parseOptionalNumber(data.arrivalBufferMinutes) ?? 10,
    backupMeetingPoint: trimOrUndefined(data.backupMeetingPoint),
    safetyNotes: trimOrUndefined(data.safetyNotes),
    lastReviewedAt: trimOrUndefined(data.lastReviewedAt),
    lastReviewedBy: trimOrUndefined(data.lastReviewedBy),
  });

  const createZoneMutation = useMutation({
    mutationFn: async (data: ZoneFormValues) => {
      await apiRequest("POST", "/api/zones", serializeZoneForm(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
      setIsZoneFormOpen(false);
      zoneForm.reset();
      toast({ title: "Zone added", description: "New zone has been created." });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create zone.",
        variant: "destructive",
      });
    },
  });

  const updateZoneMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ZoneFormValues }) => {
      await apiRequest("PATCH", `/api/zones/${id}`, serializeZoneForm(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
      setIsZoneFormOpen(false);
      setEditingZone(null);
      zoneForm.reset();
      toast({ title: "Zone updated" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update zone.",
        variant: "destructive",
      });
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/zones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
      setDeleteItem(null);
      toast({ title: "Zone deleted" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete zone.",
        variant: "destructive",
      });
    },
  });

  // POI Mutations
  const createPoiMutation = useMutation({
    mutationFn: async (data: PoiFormValues & { zoneId?: string }) => {
      await apiRequest("POST", "/api/points-of-interest", serializePoiForm(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/points-of-interest"] });
      setIsPoiFormOpen(false);
      poiForm.reset();
      toast({ title: "Point of Interest added", description: "New POI has been created." });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create point of interest.",
        variant: "destructive",
      });
    },
  });

  const updatePoiMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PoiFormValues }) => {
      await apiRequest("PATCH", `/api/points-of-interest/${id}`, serializePoiForm(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/points-of-interest"] });
      setIsPoiFormOpen(false);
      setEditingPoi(null);
      poiForm.reset();
      toast({ title: "Point of Interest updated" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update point of interest.",
        variant: "destructive",
      });
    },
  });

  const deletePoiMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/points-of-interest/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/points-of-interest"] });
      setDeleteItem(null);
      toast({ title: "Point of Interest deleted" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete point of interest.",
        variant: "destructive",
      });
    },
  });

  // Meeting Point Mutations
  const createMeetingPointMutation = useMutation({
    mutationFn: async (data: MeetingPointFormValues) => {
      await apiRequest("POST", "/api/meeting-points", serializeMeetingPointForm(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meeting-points"] });
      setIsMeetingPointFormOpen(false);
      meetingPointForm.reset();
      toast({ title: "Meeting Point added", description: "New meeting point has been created." });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create meeting point.",
        variant: "destructive",
      });
    },
  });

  const updateMeetingPointMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MeetingPointFormValues }) => {
      await apiRequest("PATCH", `/api/meeting-points/${id}`, serializeMeetingPointForm(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meeting-points"] });
      setIsMeetingPointFormOpen(false);
      setEditingMeetingPoint(null);
      meetingPointForm.reset();
      toast({ title: "Meeting Point updated" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update meeting point.",
        variant: "destructive",
      });
    },
  });

  const deleteMeetingPointMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/meeting-points/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meeting-points"] });
      setDeleteItem(null);
      toast({ title: "Meeting Point deleted" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete meeting point.",
        variant: "destructive",
      });
    },
  });

  const onPoiSubmit = (data: PoiFormValues) => {
    if (editingPoi) {
      updatePoiMutation.mutate({ id: editingPoi.id, data });
    } else {
      createPoiMutation.mutate(data);
    }
  };

  const onMeetingPointSubmit = (data: MeetingPointFormValues) => {
    if (editingMeetingPoint) {
      updateMeetingPointMutation.mutate({ id: editingMeetingPoint.id, data });
    } else {
      createMeetingPointMutation.mutate(data);
    }
  };

  const handleEditZone = (zone: Zone) => {
    setEditingZone(zone);
    zoneForm.reset({
      name: zone.name,
      description: zone.description || "",
      icon: zone.icon || "",
      zoneType: zone.zoneType || "route_area",
      isPublic: zone.isPublic ?? true,
      sortOrder: zone.sortOrder || 0,
      internalNotes: zone.internalNotes || "",
      lastReviewedAt: zone.lastReviewedAt || "",
      lastReviewedBy: zone.lastReviewedBy || "",
      isActive: zone.isActive ?? true,
    });
    setIsZoneFormOpen(true);
  };

  const handleAddZone = () => {
    setEditingZone(null);
    zoneForm.reset({
      name: "",
      description: "",
      icon: "",
      zoneType: "route_area",
      isPublic: true,
      sortOrder: 0,
      internalNotes: "",
      lastReviewedAt: "",
      lastReviewedBy: "",
      isActive: true,
    });
    setIsZoneFormOpen(true);
  };

  const handleAddPoi = () => {
    setEditingPoi(null);
    poiForm.reset({
      name: "",
      description: "",
      category: "",
      visitorDescription: "",
      internalNotes: "",
      estimatedDurationMinutes: undefined,
      photoPolicy: "ask_first",
      mobilityLevel: "easy",
      bestVisitDays: "",
      requiresPermission: false,
      serviceDirectoryUrl: "",
      isPublic: true,
      lastReviewedAt: "",
      lastReviewedBy: "",
      isActive: true,
    });
    setIsPoiFormOpen(true);
  };

  const handleEditPoi = (poi: PointOfInterest) => {
    setEditingPoi(poi);
    poiForm.reset({
      name: poi.name,
      description: poi.description || "",
      category: poi.category || "",
      visitorDescription: poi.visitorDescription || "",
      internalNotes: poi.internalNotes || "",
      estimatedDurationMinutes: poi.estimatedDurationMinutes ?? undefined,
      photoPolicy: poi.photoPolicy || "ask_first",
      mobilityLevel: poi.mobilityLevel || "easy",
      bestVisitDays: (poi.bestVisitDays || []).join(", "),
      requiresPermission: poi.requiresPermission ?? false,
      serviceDirectoryUrl: poi.serviceDirectoryUrl || "",
      isPublic: poi.isPublic ?? true,
      lastReviewedAt: poi.lastReviewedAt || "",
      lastReviewedBy: poi.lastReviewedBy || "",
      isActive: poi.isActive ?? true,
    });
    setIsPoiFormOpen(true);
  };

  const handleAddMeetingPoint = () => {
    setEditingMeetingPoint(null);
    meetingPointForm.reset({
      name: "",
      description: "",
      address: "",
      googleMapsUrl: "",
      latitude: "",
      longitude: "",
      meetingInstructions: "",
      guideIdentificationNote: "",
      arrivalBufferMinutes: 10,
      backupMeetingPoint: "",
      safetyNotes: "",
      isDefault: false,
      lastReviewedAt: "",
      lastReviewedBy: "",
      isActive: true,
    });
    setIsMeetingPointFormOpen(true);
  };

  const handleEditMeetingPoint = (meetingPoint: MeetingPoint) => {
    setEditingMeetingPoint(meetingPoint);
    meetingPointForm.reset({
      name: meetingPoint.name,
      description: meetingPoint.description || "",
      address: meetingPoint.address || "",
      googleMapsUrl: meetingPoint.googleMapsUrl || "",
      latitude: meetingPoint.latitude?.toString() || "",
      longitude: meetingPoint.longitude?.toString() || "",
      meetingInstructions: meetingPoint.meetingInstructions || "",
      guideIdentificationNote: meetingPoint.guideIdentificationNote || "",
      arrivalBufferMinutes: meetingPoint.arrivalBufferMinutes ?? 10,
      backupMeetingPoint: meetingPoint.backupMeetingPoint || "",
      safetyNotes: meetingPoint.safetyNotes || "",
      isDefault: meetingPoint.isDefault ?? false,
      lastReviewedAt: meetingPoint.lastReviewedAt || "",
      lastReviewedBy: meetingPoint.lastReviewedBy || "",
      isActive: meetingPoint.isActive ?? true,
    });
    setIsMeetingPointFormOpen(true);
  };

  const onZoneSubmit = (data: ZoneFormValues) => {
    if (editingZone) {
      updateZoneMutation.mutate({ id: editingZone.id, data });
    } else {
      createZoneMutation.mutate(data);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCategoryFilter("all");
    setStatusFilter("all");
    navigate(`/zones?section=${value}`);
  };

  const getIcon = (iconName?: string | null) => {
    const IconComponent = iconMap[iconName || "default"] || MapPin;
    return <IconComponent className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Zones & Points of Interest
        </h1>
        <p className="text-muted-foreground">
          Manage visitor-facing stops, internal operational notes, and guide handoff locations.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Active zones</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{isLoadingZones ? "…" : activeZones.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Public visitor stops</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{isLoadingPois ? "…" : publicVisitorStops.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Meeting points</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{isLoadingMeetingPoints ? "…" : activeMeetingPoints.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Locations needing review</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{isLoadingZones || isLoadingPois || isLoadingMeetingPoints ? "…" : locationsNeedingReview}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search locations, notes, categories…"
              className="pl-9"
              aria-label="Search locations"
              data-testid="input-location-search"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="min-w-[180px]" aria-label="Filter by status">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="permission">Needs permission</SelectItem>
                <SelectItem value="default">Default meeting point</SelectItem>
                <SelectItem value="needs_review">Needs review</SelectItem>
              </SelectContent>
            </Select>
            {activeTab !== "meeting" && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="min-w-[180px]" aria-label="Filter by type or category">
                  <SelectValue placeholder="Type or category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {visibleCategoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex rounded-md border bg-background p-1">
              <Button
                type="button"
                size="sm"
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                onClick={() => setViewMode("cards")}
                aria-label="Show cards"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "table" ? "secondary" : "ghost"}
                onClick={() => setViewMode("table")}
                aria-label="Show table"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="zones" data-testid="tab-zones">
            Camp Zones ({isZonesError ? "!" : isLoadingZones ? "…" : zones?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="poi" data-testid="tab-poi">
            Points of Interest ({isPoisError ? "!" : isLoadingPois ? "…" : pointsOfInterest?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="meeting" data-testid="tab-meeting">
            Meeting Points ({isMeetingPointsError ? "!" : isLoadingMeetingPoints ? "…" : meetingPoints?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="mt-6">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Camp zones</h2>
              <p className="text-sm text-muted-foreground">
                Keep broad route areas separate from meeting points and organization stops.
              </p>
            </div>
            <Button onClick={handleAddZone} data-testid="button-add-zone">
              <Plus className="mr-2 h-4 w-4" />
              Add Zone
            </Button>
          </div>
          {isZonesError ? (
            <EmptyState
              icon={MapPin}
              title="Could not load zones"
              description="The zones API returned an error. Check the server logs or refresh after the migration is applied."
            />
          ) : !zones || zones.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No zones found"
              description="Add camp zones to help visitors explore different areas."
              action={
                <Button onClick={handleAddZone}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Zone
                </Button>
              }
            />
          ) : filteredZones.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No zones match"
              description="Try a different search or filter."
            />
          ) : viewMode === "table" ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead className="w-[90px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedZones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          className="text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => setSelectedLocation({ type: "zone", item: zone })}
                        >
                          {zone.name}
                        </button>
                      </TableCell>
                      <TableCell>{labelFor(zone.zoneType)}</TableCell>
                      <TableCell>{zone.isPublic === false ? "Internal" : "Public"}</TableCell>
                      <TableCell>{formatReviewDate(zone.lastReviewedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEditZone(zone)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedZones.map((zone) => (
                <Card
                  key={zone.id}
                  className="hover-elevate"
                  data-testid={`zone-card-${zone.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {getIcon(zone.icon)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words font-semibold">{zone.name}</h3>
                            <Badge variant="outline">{labelFor(zone.zoneType)}</Badge>
                            {zone.isPublic === false ? (
                              <Badge variant="secondary" className="gap-1">
                                <EyeOff className="h-3 w-3" />
                                Internal
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <Eye className="h-3 w-3" />
                                Public
                              </Badge>
                            )}
                            {zone.isActive ? (
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
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Zone actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedLocation({ type: "zone", item: zone })}>
                            <Info className="mr-2 h-4 w-4" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditZone(zone)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setDeleteItem({ type: "zone", item: zone })
                            }
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {zone.description && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {zone.description}
                        </p>
                      )}
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatReviewDate(zone.lastReviewedAt)}
                      </span>
                      {needsReview(zone.lastReviewedAt) && (
                        <Badge variant="destructive">Needs review</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredZones && filteredZones.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border rounded-lg bg-card mt-6">
              <div className="text-sm text-muted-foreground font-medium">
                Showing <span className="font-semibold text-foreground">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredZones.length)}
                </span>{" "}
                of <span className="font-semibold text-foreground">{filteredZones.length}</span> entries
              </div>
              <nav className="flex items-center gap-1" aria-label="Zones Pagination Navigation">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous Page"
                  className="h-9 w-9 touch-manipulation focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.ceil(filteredZones.length / ITEMS_PER_PAGE) }, (_, i) => i + 1)
                  .filter((page, _, arr) => {
                    const totalPages = arr.length;
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    const showEllipsis = index > 0 && page - array[index - 1] > 1;
                    return (
                      <div key={page} className="flex items-center">
                        {showEllipsis && (
                          <span className="px-2 text-muted-foreground select-none" aria-hidden="true">
                            …
                          </span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => setCurrentPage(page)}
                          aria-label={`Page ${page}`}
                          aria-current={currentPage === page ? "page" : undefined}
                          className={`h-9 w-9 p-0 touch-manipulation focus-visible:ring-2 focus-visible:ring-primary ${
                            currentPage === page ? "pointer-events-none" : ""
                          }`}
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredZones.length / ITEMS_PER_PAGE), p + 1))}
                  disabled={currentPage === Math.ceil(filteredZones.length / ITEMS_PER_PAGE)}
                  aria-label="Next Page"
                  className="h-9 w-9 touch-manipulation focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            </div>
          )}
        </TabsContent>

        <TabsContent value="poi" className="mt-6">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Visitor stops and organizations</h2>
              <p className="text-sm text-muted-foreground">
                Use POIs for route stops, community organizations, and places visitors may request.
              </p>
            </div>
            <Button onClick={handleAddPoi} data-testid="button-add-poi">
              <Plus className="mr-2 h-4 w-4" />
              Add Point of Interest
            </Button>
          </div>
          {isPoisError ? (
            <EmptyState
              icon={Compass}
              title="Could not load points of interest"
              description="The points of interest API returned an error. Check the server logs or refresh after the migration is applied."
            />
          ) : !pointsOfInterest || pointsOfInterest.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="No points of interest"
              description="Add interesting locations for visitors to explore."
              action={
                <Button onClick={handleAddPoi}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Point of Interest
                </Button>
              }
            />
          ) : filteredPois.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No points match"
              description="Try a different search or filter."
            />
          ) : viewMode === "table" ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead className="w-[90px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPois.map((poi) => (
                    <TableRow key={poi.id}>
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          className="text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => setSelectedLocation({ type: "poi", item: poi })}
                        >
                          {poi.name}
                        </button>
                      </TableCell>
                      <TableCell>{poi.category ? labelFor(poi.category) : "Not set"}</TableCell>
                      <TableCell>{poi.isPublic === false ? "Internal" : "Public"}</TableCell>
                      <TableCell>{poi.requiresPermission ? "Permission needed" : labelFor(poi.photoPolicy)}</TableCell>
                      <TableCell>{formatReviewDate(poi.lastReviewedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEditPoi(poi)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedPois.map((poi) => (
                <Card
                  key={poi.id}
                  className="hover-elevate"
                  data-testid={`poi-card-${poi.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words font-semibold">{poi.name}</h3>
                          {poi.category && (
                            <Badge variant="outline" className="capitalize">
                              {poi.category}
                            </Badge>
                          )}
                          {poi.isPublic === false ? (
                            <Badge variant="secondary" className="gap-1">
                              <EyeOff className="h-3 w-3" />
                              Internal
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Eye className="h-3 w-3" />
                              Public
                            </Badge>
                          )}
                          {poi.requiresPermission && (
                            <Badge variant="outline" className="gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              Permission needed
                            </Badge>
                          )}
                          {poi.photoPolicy === "restricted" && (
                            <Badge variant="destructive">Photo restricted</Badge>
                          )}
                          {poi.isActive ? (
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
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Point of interest actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedLocation({ type: "poi", item: poi })}>
                            <Info className="mr-2 h-4 w-4" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditPoi(poi)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setDeleteItem({ type: "poi", item: poi })
                            }
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {(poi.visitorDescription || poi.description) && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {poi.visitorDescription || poi.description}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {poi.estimatedDurationMinutes != null && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {poi.estimatedDurationMinutes} min
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Camera className="h-3.5 w-3.5" />
                        {labelFor(poi.photoPolicy)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatReviewDate(poi.lastReviewedAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredPois && filteredPois.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border rounded-lg bg-card mt-6">
              <div className="text-sm text-muted-foreground font-medium">
                Showing <span className="font-semibold text-foreground">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredPois.length)}
                </span>{" "}
                of <span className="font-semibold text-foreground">{filteredPois.length}</span> entries
              </div>
              <nav className="flex items-center gap-1" aria-label="POIs Pagination Navigation">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous Page"
                  className="h-9 w-9 touch-manipulation focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.ceil(filteredPois.length / ITEMS_PER_PAGE) }, (_, i) => i + 1)
                  .filter((page, _, arr) => {
                    const totalPages = arr.length;
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    const showEllipsis = index > 0 && page - array[index - 1] > 1;
                    return (
                      <div key={page} className="flex items-center">
                        {showEllipsis && (
                          <span className="px-2 text-muted-foreground select-none" aria-hidden="true">
                            …
                          </span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => setCurrentPage(page)}
                          aria-label={`Page ${page}`}
                          aria-current={currentPage === page ? "page" : undefined}
                          className={`h-9 w-9 p-0 touch-manipulation focus-visible:ring-2 focus-visible:ring-primary ${
                            currentPage === page ? "pointer-events-none" : ""
                          }`}
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredPois.length / ITEMS_PER_PAGE), p + 1))}
                  disabled={currentPage === Math.ceil(filteredPois.length / ITEMS_PER_PAGE)}
                  aria-label="Next Page"
                  className="h-9 w-9 touch-manipulation focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            </div>
          )}
        </TabsContent>

        <TabsContent value="meeting" className="mt-6">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Guide handoff locations</h2>
              <p className="text-sm text-muted-foreground">
                Store exact meeting instructions, backup locations, map links, and guide identification notes.
              </p>
            </div>
            <Button onClick={handleAddMeetingPoint} data-testid="button-add-meeting-point">
              <Plus className="mr-2 h-4 w-4" />
              Add Meeting Point
            </Button>
          </div>
          {isMeetingPointsError ? (
            <EmptyState
              icon={MapPin}
              title="Could not load meeting points"
              description="The meeting points API returned an error. Check the server logs or refresh after the migration is applied."
            />
          ) : !meetingPoints || meetingPoints.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No meeting points"
              description="Add locations where visitors can meet their guides."
              action={
                <Button onClick={handleAddMeetingPoint}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Meeting Point
                </Button>
              }
            />
          ) : filteredMeetingPoints.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No meeting points match"
              description="Try a different search or filter."
            />
          ) : viewMode === "table" ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Buffer</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead className="w-[90px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMeetingPoints.map((mp) => (
                    <TableRow key={mp.id}>
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          className="text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => setSelectedLocation({ type: "meeting", item: mp })}
                        >
                          {mp.name}
                        </button>
                      </TableCell>
                      <TableCell>{mp.address || "Not set"}</TableCell>
                      <TableCell>{mp.arrivalBufferMinutes ?? 10} min</TableCell>
                      <TableCell>{mp.isDefault ? "Yes" : "No"}</TableCell>
                      <TableCell>{formatReviewDate(mp.lastReviewedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEditMeetingPoint(mp)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedMeetingPoints.map((mp) => (
                <Card
                  key={mp.id}
                  className="hover-elevate"
                  data-testid={`meeting-point-card-${mp.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words font-semibold">{mp.name}</h3>
                            {mp.isDefault && (
                              <Badge variant="outline" className="gap-1">
                                <ShieldCheck className="h-3 w-3" />
                                Default
                              </Badge>
                            )}
                            {mp.isActive ? (
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
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Meeting point actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedLocation({ type: "meeting", item: mp })}>
                            <Info className="mr-2 h-4 w-4" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditMeetingPoint(mp)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setDeleteItem({ type: "meetingPoint", item: mp })
                            }
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {mp.description && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {mp.description}
                      </p>
                    )}
                    {mp.address && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {mp.address}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {mp.arrivalBufferMinutes ?? 10} min arrival buffer
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatReviewDate(mp.lastReviewedAt)}
                      </span>
                      {mp.googleMapsUrl && (
                        <Badge variant="outline">Map linked</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredMeetingPoints && filteredMeetingPoints.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border rounded-lg bg-card mt-6">
              <div className="text-sm text-muted-foreground font-medium">
                Showing <span className="font-semibold text-foreground">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredMeetingPoints.length)}
                </span>{" "}
                of <span className="font-semibold text-foreground">{filteredMeetingPoints.length}</span> entries
              </div>
              <nav className="flex items-center gap-1" aria-label="Meeting Points Pagination Navigation">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous Page"
                  className="h-9 w-9 touch-manipulation focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.ceil(filteredMeetingPoints.length / ITEMS_PER_PAGE) }, (_, i) => i + 1)
                  .filter((page, _, arr) => {
                    const totalPages = arr.length;
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    const showEllipsis = index > 0 && page - array[index - 1] > 1;
                    return (
                      <div key={page} className="flex items-center">
                        {showEllipsis && (
                          <span className="px-2 text-muted-foreground select-none" aria-hidden="true">
                            …
                          </span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => setCurrentPage(page)}
                          aria-label={`Page ${page}`}
                          aria-current={currentPage === page ? "page" : undefined}
                          className={`h-9 w-9 p-0 touch-manipulation focus-visible:ring-2 focus-visible:ring-primary ${
                            currentPage === page ? "pointer-events-none" : ""
                          }`}
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredMeetingPoints.length / ITEMS_PER_PAGE), p + 1))}
                  disabled={currentPage === Math.ceil(filteredMeetingPoints.length / ITEMS_PER_PAGE)}
                  aria-label="Next Page"
                  className="h-9 w-9 touch-manipulation focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isZoneFormOpen} onOpenChange={setIsZoneFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingZone ? "Edit Zone" : "Add Zone"}</DialogTitle>
            <DialogDescription>
              {editingZone
                ? "Update zone information."
                : "Add a new camp zone."}
            </DialogDescription>
          </DialogHeader>
          <Form {...zoneForm}>
            <form
              onSubmit={zoneForm.handleSubmit(onZoneSubmit)}
              className="space-y-4"
            >
              <FormField
                control={zoneForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Zone name…"
                        {...field}
                        data-testid="input-zone-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={zoneForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief visitor-facing description…"
                        {...field}
                        data-testid="textarea-zone-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={zoneForm.control}
                  name="zoneType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {zoneTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={zoneForm.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort order</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} inputMode="numeric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={zoneForm.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon key</FormLabel>
                      <FormControl>
                        <Input placeholder="home, store, mountain…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={zoneForm.control}
                name="internalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Staff-only access, route, or context notes…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={zoneForm.control}
                  name="lastReviewedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last reviewed date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={zoneForm.control}
                  name="lastReviewedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last reviewed by</FormLabel>
                      <FormControl>
                        <Input placeholder="Staff name…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={zoneForm.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Public</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Public zones can appear on visitor-facing pages and booking flows.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={zoneForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Inactive zones won't appear in booking options.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsZoneFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createZoneMutation.isPending || updateZoneMutation.isPending
                  }
                  data-testid="button-save-zone"
                >
                  {editingZone ? "Update" : "Add"} Zone
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* POI Form Dialog */}
      <Dialog open={isPoiFormOpen} onOpenChange={setIsPoiFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPoi ? "Edit Point of Interest" : "Add Point of Interest"}</DialogTitle>
            <DialogDescription>
              {editingPoi
                ? "Update point of interest information."
                : "Add a new point of interest for visitors."}
            </DialogDescription>
          </DialogHeader>
          <Form {...poiForm}>
            <form
              onSubmit={poiForm.handleSubmit(onPoiSubmit)}
              className="space-y-4"
            >
              <FormField
                control={poiForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Point of interest name…"
                        {...field}
                        data-testid="input-poi-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={poiForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief internal summary…"
                        {...field}
                        data-testid="textarea-poi-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={poiForm.control}
                name="visitorDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visitor description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What visitors should see in itineraries or public pages…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={poiForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="input-poi-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {poiCategoryOptions.map((category) => (
                          <SelectItem key={category} value={category}>
                            {labelFor(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={poiForm.control}
                  name="estimatedDurationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} inputMode="numeric" placeholder="15…" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={poiForm.control}
                  name="photoPolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo policy</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select policy" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {photoPolicyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={poiForm.control}
                  name="mobilityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobility</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mobilityLevelOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={poiForm.control}
                  name="bestVisitDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Best visit days</FormLabel>
                      <FormControl>
                        <Input placeholder="Tuesday, Saturday…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={poiForm.control}
                  name="serviceDirectoryUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service directory URL</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://services.dzaleka.com/services/…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={poiForm.control}
                name="internalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Access, permission, host contact, or route notes…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={poiForm.control}
                  name="lastReviewedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last reviewed date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={poiForm.control}
                  name="lastReviewedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last reviewed by</FormLabel>
                      <FormControl>
                        <Input placeholder="Staff name…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={poiForm.control}
                name="requiresPermission"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Requires permission</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Mark this when staff should confirm access before adding the stop.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={poiForm.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Public</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Public stops can appear in visitor itineraries and public tour content.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={poiForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Inactive POIs won't appear in tours.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPoiFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createPoiMutation.isPending || updatePoiMutation.isPending
                  }
                  data-testid="button-save-poi"
                >
                  {editingPoi ? "Update" : "Add"} POI
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Meeting Point Form Dialog */}
      <Dialog open={isMeetingPointFormOpen} onOpenChange={setIsMeetingPointFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingMeetingPoint ? "Edit Meeting Point" : "Add Meeting Point"}</DialogTitle>
            <DialogDescription>
              {editingMeetingPoint
                ? "Update meeting point information."
                : "Add a new meeting location for guides and visitors."}
            </DialogDescription>
          </DialogHeader>
          <Form {...meetingPointForm}>
            <form
              onSubmit={meetingPointForm.handleSubmit(onMeetingPointSubmit)}
              className="space-y-4"
            >
              <FormField
                control={meetingPointForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="UNHCR Office / Plan International Compound…"
                        {...field}
                        data-testid="input-meeting-point-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={meetingPointForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Short summary for staff and visitors…"
                        {...field}
                        data-testid="textarea-meeting-point-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={meetingPointForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Main gate, UNHCR/Plan International Compound…"
                        {...field}
                        data-testid="input-meeting-point-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={meetingPointForm.control}
                  name="googleMapsUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Maps URL</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://maps.google.com/…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={meetingPointForm.control}
                  name="arrivalBufferMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival buffer</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} inputMode="numeric" placeholder="10…" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={meetingPointForm.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input inputMode="decimal" placeholder="-13.68…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={meetingPointForm.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input inputMode="decimal" placeholder="34.00…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={meetingPointForm.control}
                name="meetingInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting instructions</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Where to stand, who to ask for, and what visitors should expect…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={meetingPointForm.control}
                name="guideIdentificationNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guide identification note</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Badge, t-shirt, phone call, or coordinator handoff instructions…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={meetingPointForm.control}
                name="backupMeetingPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Backup meeting point</FormLabel>
                    <FormControl>
                      <Input placeholder="Alternative location if the main gate is busy…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={meetingPointForm.control}
                name="safetyNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Safety notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Staff-only safety, access, or escalation notes…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={meetingPointForm.control}
                  name="lastReviewedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last reviewed date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={meetingPointForm.control}
                  name="lastReviewedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last reviewed by</FormLabel>
                      <FormControl>
                        <Input placeholder="Staff name…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={meetingPointForm.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Default meeting point</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Use for common visitor handoffs and booking defaults.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={meetingPointForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Inactive meeting points won't appear in booking options.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMeetingPointFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMeetingPointMutation.isPending || updateMeetingPointMutation.isPending
                  }
                  data-testid="button-save-meeting-point"
                >
                  {editingMeetingPoint ? "Update" : "Add"} Meeting Point
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Sheet
        open={Boolean(selectedLocation)}
        onOpenChange={(open) => {
          if (!open) setSelectedLocation(null);
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedLocation?.item.name || "Location details"}</SheetTitle>
            <SheetDescription>
              {selectedLocation?.type === "zone" && "Zone operational details and review status."}
              {selectedLocation?.type === "poi" && "Point of interest guidance for staff and itineraries."}
              {selectedLocation?.type === "meeting" && "Meeting instructions and guide handoff details."}
            </SheetDescription>
          </SheetHeader>

          {selectedLocation && (
            <div className="mt-6 space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant={selectedLocation.item.isActive !== false ? "secondary" : "outline"}>
                  {selectedLocation.item.isActive !== false ? "Active" : "Inactive"}
                </Badge>
                {selectedLocation.type !== "meeting" && (
                  <Badge variant="outline">
                    {selectedLocation.item.isPublic === false ? "Internal" : "Public"}
                  </Badge>
                )}
                {needsReview(selectedLocation.item.lastReviewedAt) && (
                  <Badge variant="destructive">Needs review</Badge>
                )}
              </div>

              {selectedLocation.type === "zone" && (
                <>
                  <div>
                    <h3 className="text-sm font-medium">Visitor description</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedLocation.item.description || "No visitor description added."}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium">Zone type</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{labelFor(selectedLocation.item.zoneType)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Sort order</h3>
                      <p className="mt-1 text-sm text-muted-foreground tabular-nums">{selectedLocation.item.sortOrder || 0}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Internal notes</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {selectedLocation.item.internalNotes || "No internal notes added."}
                    </p>
                  </div>
                </>
              )}

              {selectedLocation.type === "poi" && (
                <>
                  <div>
                    <h3 className="text-sm font-medium">Visitor description</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {selectedLocation.item.visitorDescription || selectedLocation.item.description || "No visitor description added."}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium">Category</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{labelFor(selectedLocation.item.category)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Estimated duration</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedLocation.item.estimatedDurationMinutes != null ? `${selectedLocation.item.estimatedDurationMinutes} minutes` : "Not set"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Photo policy</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{labelFor(selectedLocation.item.photoPolicy)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Mobility level</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{labelFor(selectedLocation.item.mobilityLevel)}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Best visit days</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedLocation.item.bestVisitDays?.length ? selectedLocation.item.bestVisitDays.join(", ") : "Not set"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Internal notes</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {selectedLocation.item.internalNotes || "No internal notes added."}
                    </p>
                  </div>
                </>
              )}

              {selectedLocation.type === "meeting" && (
                <>
                  <div>
                    <h3 className="text-sm font-medium">Address</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedLocation.item.address || "No address added."}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Meeting instructions</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {selectedLocation.item.meetingInstructions || selectedLocation.item.description || "No meeting instructions added."}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Guide identification</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {selectedLocation.item.guideIdentificationNote || "No guide identification note added."}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium">Arrival buffer</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedLocation.item.arrivalBufferMinutes ?? 10} minutes</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Default</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedLocation.item.isDefault ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Latitude</h3>
                      <p className="mt-1 text-sm text-muted-foreground tabular-nums">{selectedLocation.item.latitude ?? "Not set"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Longitude</h3>
                      <p className="mt-1 text-sm text-muted-foreground tabular-nums">{selectedLocation.item.longitude ?? "Not set"}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Backup meeting point</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedLocation.item.backupMeetingPoint || "Not set"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Safety notes</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {selectedLocation.item.safetyNotes || "No safety notes added."}
                    </p>
                  </div>
                </>
              )}

              <div className="rounded-lg border p-4">
                <h3 className="text-sm font-medium">Review info</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatReviewDate(selectedLocation.item.lastReviewedAt)}
                  {selectedLocation.item.lastReviewedBy ? ` by ${selectedLocation.item.lastReviewedBy}` : ""}
                </p>
              </div>

              <Button
                type="button"
                onClick={() => {
                  if (selectedLocation.type === "zone") handleEditZone(selectedLocation.item);
                  if (selectedLocation.type === "poi") handleEditPoi(selectedLocation.item);
                  if (selectedLocation.type === "meeting") handleEditMeetingPoint(selectedLocation.item);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit location
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteItem}
        onOpenChange={() => setDeleteItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.item.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteItem?.type === "zone") {
                  deleteZoneMutation.mutate(deleteItem.item.id);
                } else if (deleteItem?.type === "poi") {
                  deletePoiMutation.mutate(deleteItem.item.id);
                } else if (deleteItem?.type === "meetingPoint") {
                  deleteMeetingPointMutation.mutate(deleteItem.item.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
