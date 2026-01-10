import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { SEO } from "@/components/seo";

const zoneFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
});

const poiFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
});

const meetingPointFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  address: z.string().optional(),
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

export default function Zones() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("zones");
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

  const { data: zones } = useQuery<Zone[]>({
    queryKey: ["/api/zones"],
  });

  const { data: pointsOfInterest } = useQuery<PointOfInterest[]>({
    queryKey: ["/api/points-of-interest"],
  });

  const { data: meetingPoints } = useQuery<MeetingPoint[]>({
    queryKey: ["/api/meeting-points"],
  });

  const zoneForm = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneFormSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      isActive: true,
    },
  });

  const poiForm = useForm<PoiFormValues>({
    resolver: zodResolver(poiFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      isActive: true,
    },
  });

  const meetingPointForm = useForm<MeetingPointFormValues>({
    resolver: zodResolver(meetingPointFormSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      isActive: true,
    },
  });

  const createZoneMutation = useMutation({
    mutationFn: async (data: ZoneFormValues) => {
      await apiRequest("POST", "/api/zones", data);
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
          window.location.href = "/api/login";
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
      await apiRequest("PATCH", `/api/zones/${id}`, data);
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
          window.location.href = "/api/login";
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
          window.location.href = "/api/login";
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
      await apiRequest("POST", "/api/points-of-interest", data);
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
          window.location.href = "/api/login";
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
      await apiRequest("PATCH", `/api/points-of-interest/${id}`, data);
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
          window.location.href = "/api/login";
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
          window.location.href = "/api/login";
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
      await apiRequest("POST", "/api/meeting-points", data);
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
          window.location.href = "/api/login";
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
      await apiRequest("PATCH", `/api/meeting-points/${id}`, data);
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
          window.location.href = "/api/login";
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
          window.location.href = "/api/login";
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
      isActive: true,
    });
    setIsZoneFormOpen(true);
  };

  const onZoneSubmit = (data: ZoneFormValues) => {
    if (editingZone) {
      updateZoneMutation.mutate({ id: editingZone.id, data });
    } else {
      createZoneMutation.mutate(data);
    }
  };

  const getIcon = (iconName?: string | null) => {
    const IconComponent = iconMap[iconName || "default"] || MapPin;
    return <IconComponent className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <SEO 
        title="Camp Zones" 
        description="Explore the different zones of Dzaleka Refugee Camp. Find points of interest, markets, and cultural centers."
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Zones & Points of Interest
        </h1>
        <p className="text-muted-foreground">
          Manage camp zones, points of interest, and meeting locations.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="zones" data-testid="tab-zones">
            Camp Zones
          </TabsTrigger>
          <TabsTrigger value="poi" data-testid="tab-poi">
            Points of Interest
          </TabsTrigger>
          <TabsTrigger value="meeting" data-testid="tab-meeting">
            Meeting Points
          </TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button onClick={handleAddZone} data-testid="button-add-zone">
              <Plus className="mr-2 h-4 w-4" />
              Add Zone
            </Button>
          </div>
          {!zones || zones.length === 0 ? (
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
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {zones.map((zone) => (
                <Card
                  key={zone.id}
                  className="hover-elevate"
                  data-testid={`zone-card-${zone.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {getIcon(zone.icon)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{zone.name}</h3>
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
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="poi" className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button
              onClick={() => {
                setEditingPoi(null);
                poiForm.reset();
                setIsPoiFormOpen(true);
              }}
              data-testid="button-add-poi"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Point of Interest
            </Button>
          </div>
          {!pointsOfInterest || pointsOfInterest.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="No points of interest"
              description="Add interesting locations for visitors to explore."
              action={
                <Button
                  onClick={() => {
                    setEditingPoi(null);
                    poiForm.reset();
                    setIsPoiFormOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Point of Interest
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pointsOfInterest.map((poi) => (
                <Card
                  key={poi.id}
                  className="hover-elevate"
                  data-testid={`poi-card-${poi.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{poi.name}</h3>
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
                        {poi.category && (
                          <Badge variant="outline" className="mt-2 capitalize">
                            {poi.category}
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingPoi(poi);
                              poiForm.reset({
                                name: poi.name,
                                description: poi.description || "",
                                category: poi.category || "",
                                isActive: poi.isActive ?? true,
                              });
                              setIsPoiFormOpen(true);
                            }}
                          >
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
                    {poi.description && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {poi.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="meeting" className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button
              onClick={() => {
                setEditingMeetingPoint(null);
                meetingPointForm.reset();
                setIsMeetingPointFormOpen(true);
              }}
              data-testid="button-add-meeting-point"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Meeting Point
            </Button>
          </div>
          {!meetingPoints || meetingPoints.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No meeting points"
              description="Add locations where visitors can meet their guides."
              action={
                <Button
                  onClick={() => {
                    setEditingMeetingPoint(null);
                    meetingPointForm.reset();
                    setIsMeetingPointFormOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Meeting Point
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {meetingPoints.map((mp) => (
                <Card
                  key={mp.id}
                  className="hover-elevate"
                  data-testid={`meeting-point-card-${mp.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{mp.name}</h3>
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
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingMeetingPoint(mp);
                              meetingPointForm.reset({
                                name: mp.name,
                                description: mp.description || "",
                                address: mp.address || "",
                                isActive: mp.isActive ?? true,
                              });
                              setIsMeetingPointFormOpen(true);
                            }}
                          >
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isZoneFormOpen} onOpenChange={setIsZoneFormOpen}>
        <DialogContent>
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
                        placeholder="Zone name"
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
                        placeholder="Brief description..."
                        {...field}
                        data-testid="textarea-zone-description"
                      />
                    </FormControl>
                    <FormMessage />
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
        <DialogContent>
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
                        placeholder="Point of interest name"
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description..."
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., cultural, education, health"
                        {...field}
                        data-testid="input-poi-category"
                      />
                    </FormControl>
                    <FormMessage />
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
        <DialogContent>
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
                        placeholder="Meeting point name"
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
                        placeholder="Brief description..."
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
                        placeholder="Physical address or location details"
                        {...field}
                        data-testid="input-meeting-point-address"
                      />
                    </FormControl>
                    <FormMessage />
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
