import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BadgePercent, CalendarDays, Check, Clock, Loader2, Pause, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SEO } from "@/components/seo";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import type { PricingConfig, SpecialOffer } from "@shared/schema";

const TOUR_TYPES = [
  { id: "standard", label: "Standard tour" },
  { id: "extended", label: "Extended tour" },
  { id: "custom", label: "Custom tour" },
];

const GROUP_SIZES = [
  { id: "individual", label: "Individual" },
  { id: "small_group", label: "Small group" },
  { id: "large_group", label: "Large group" },
  { id: "custom", label: "Custom group" },
];

const WEEKDAYS = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];

const DEFAULT_FORM = {
  name: "",
  description: "",
  offerType: "standard",
  discountPercent: 15,
  activityStartDate: "",
  activityEndDate: "",
  bookingNoticeDays: 7,
  discountedSeats: "",
  tourTypes: [] as string[],
  groupSizes: [] as string[],
  weekdays: [] as string[],
  timeSlots: [] as string[],
  timeSlotInput: "",
  isActive: true,
  isPublic: true,
};

type OfferForm = typeof DEFAULT_FORM;

function formatDate(date?: string | null) {
  if (!date) return "No date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
}

function formatOfferType(type: string) {
  if (type === "early_bird") return "Early-bird";
  if (type === "last_minute") return "Last-minute";
  return "Standard";
}

function statusForOffer(offer: SpecialOffer) {
  if (!offer.isActive) return { label: "Paused", variant: "secondary" as const };
  if (new Date(offer.activityEndDate) < new Date(new Date().toISOString().split("T")[0])) {
    return { label: "Expired", variant: "outline" as const };
  }
  return { label: offer.isPublic ? "Live on site" : "Active internal", variant: "default" as const };
}

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function summarizeSelection(values: string[] | null | undefined, fallback: string, options: { id: string; label: string }[]) {
  if (!values || values.length === 0) return fallback;
  return values.map((value) => options.find((item) => item.id === value)?.label || value).join(", ");
}

export default function SpecialOffersPage() {
  const { toast } = useToast();
  const [form, setForm] = useState<OfferForm>(DEFAULT_FORM);
  const hasUnsavedChanges = JSON.stringify(form) !== JSON.stringify(DEFAULT_FORM);
  useUnsavedChanges(hasUnsavedChanges);

  const { data: offers = [], isLoading } = useQuery<SpecialOffer[]>({
    queryKey: ["/api/special-offers"],
  });

  const { data: pricing = [] } = useQuery<PricingConfig[]>({
    queryKey: ["/api/pricing"],
  });

  const activeOffers = offers.filter((offer) => offer.isActive);
  const publicOffers = activeOffers.filter((offer) => offer.isPublic);

  const payload = useMemo(() => ({
    name: form.name.trim(),
    description: form.description.trim() || null,
    offerType: form.offerType,
    discountPercent: Number(form.discountPercent),
    activityStartDate: form.activityStartDate,
    activityEndDate: form.activityEndDate,
    bookingNoticeDays: form.offerType === "standard" ? null : Number(form.bookingNoticeDays),
    discountedSeats: form.discountedSeats ? Number(form.discountedSeats) : null,
    tourTypes: form.tourTypes,
    groupSizes: form.groupSizes,
    weekdays: form.weekdays,
    timeSlots: form.timeSlots,
    isActive: form.isActive,
    isPublic: form.isPublic,
  }), [form]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/special-offers", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/special-offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/special-offers"] });
      setForm(DEFAULT_FORM);
      toast({ title: "Special offer created", description: "The offer is ready for eligible booking dates." });
    },
    onError: () => {
      toast({ title: "Offer not created", description: "Check the required fields and try again.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SpecialOffer> }) => {
      const response = await apiRequest("PATCH", `/api/special-offers/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/special-offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/special-offers"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/special-offers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/special-offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/special-offers"] });
      toast({ title: "Special offer deleted" });
    },
  });

  const addTimeSlot = () => {
    const value = form.timeSlotInput.trim();
    if (!/^\d{2}:\d{2}$/.test(value) || form.timeSlots.includes(value)) return;
    setForm({ ...form, timeSlots: [...form.timeSlots, value], timeSlotInput: "" });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    createMutation.mutate();
  };

  return (
    <>
      <SEO title="Special Offers | Visit Dzaleka" description="Create and manage limited-time discounts for Visit Dzaleka tours." />
      <div className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <BadgePercent className="h-6 w-6 text-primary" />
              <Badge variant="outline">Special offers</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Create a special offer</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Sell more tickets with limited-time discounts. Public, active offers appear on the homepage and are applied to eligible booking prices.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg border bg-card p-2 text-center text-xs">
            <div>
              <div className="font-semibold">{offers.length}</div>
              <div className="text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="font-semibold">{activeOffers.length}</div>
              <div className="text-muted-foreground">Active</div>
            </div>
            <div>
              <div className="font-semibold">{publicOffers.length}</div>
              <div className="text-muted-foreground">On site</div>
            </div>
          </div>
        </div>

        <Alert>
          <CalendarDays className="h-4 w-4" />
          <AlertDescription>
            Activity dates are the dates visitors take the tour, not the dates they book. Keep temporary discounts short and avoid raising prices before discounting.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Visit Dzaleka special offer setup guide</CardTitle>
            <CardDescription>Use this workflow when you want to promote a real, temporary Visit Dzaleka discount.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-semibold">1. Choose the listing scope</div>
              <p className="text-sm text-muted-foreground">Select the guided walking tour products and group-size options. Leave choices blank only when the offer applies to every tour and option.</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-semibold">2. Set visit dates</div>
              <p className="text-sm text-muted-foreground">Pick the dates visitors will actually take the tour. Use weekdays or time slots for slower periods such as weekday mornings.</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-semibold">3. Publish and monitor</div>
              <p className="text-sm text-muted-foreground">Publish only genuine discounts, cap seats if needed, and pause the offer when the slow period or campaign ends.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/things-to-do/dzaleka-refugee-camp-guided-walking-tour">View public tour listing</Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">1</span>
                  <div>
                    <CardTitle>Products & options</CardTitle>
                    <CardDescription>Choose which tours and group sizes this offer applies to. Leave blank to apply to all.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="offer-name">Special offer name</Label>
                  <Input
                    id="offer-name"
                    name="offerName"
                    placeholder="E.g. Summer Promo or Early Bookers"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">This is for your own use. Customers won’t see this name.</p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label>Tour products</Label>
                    {TOUR_TYPES.map((type) => (
                      <label key={type.id} className="flex min-h-11 items-center gap-3 rounded-md border p-3 text-sm">
                        <Checkbox
                          checked={form.tourTypes.includes(type.id)}
                          onCheckedChange={() => setForm({ ...form, tourTypes: toggleValue(form.tourTypes, type.id) })}
                        />
                        <span>{type.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <Label>Options / group sizes</Label>
                    {GROUP_SIZES.map((size) => (
                      <label key={size.id} className="flex min-h-11 items-center gap-3 rounded-md border p-3 text-sm">
                        <Checkbox
                          checked={form.groupSizes.includes(size.id)}
                          onCheckedChange={() => setForm({ ...form, groupSizes: toggleValue(form.groupSizes, size.id) })}
                        />
                        <span>{size.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">2</span>
                  <div>
                    <CardTitle>Details</CardTitle>
                    <CardDescription>Set the activity dates, visibility, days, and time slots.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="activity-start">Activity start date</Label>
                    <Input
                      id="activity-start"
                      name="activityStartDate"
                      type="date"
                      value={form.activityStartDate}
                      onChange={(event) => setForm({ ...form, activityStartDate: event.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activity-end">Activity end date</Label>
                    <Input
                      id="activity-end"
                      name="activityEndDate"
                      type="date"
                      value={form.activityEndDate}
                      onChange={(event) => setForm({ ...form, activityEndDate: event.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offer-description">Customer-facing message</Label>
                  <Textarea
                    id="offer-description"
                    name="description"
                    placeholder="E.g. Save on weekday guided visits this month."
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Specific weekdays</Label>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {WEEKDAYS.map((day) => (
                      <label key={day.id} className="flex min-h-11 items-center justify-center gap-2 rounded-md border p-2 text-sm">
                        <Checkbox
                          checked={form.weekdays.includes(day.id)}
                          onCheckedChange={() => setForm({ ...form, weekdays: toggleValue(form.weekdays, day.id) })}
                        />
                        <span>{day.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Leave all days unchecked to apply to every day in the date range.</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="time-slot">Specific time slots</Label>
                  <div className="flex gap-2">
                    <Input
                      id="time-slot"
                      name="timeSlot"
                      type="time"
                      value={form.timeSlotInput}
                      onChange={(event) => setForm({ ...form, timeSlotInput: event.target.value })}
                    />
                    <Button type="button" variant="outline" onClick={addTimeSlot}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.timeSlots.length === 0 ? (
                      <span className="text-xs text-muted-foreground">Applies to all start times.</span>
                    ) : form.timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className="rounded-full border px-3 py-1 text-xs"
                        onClick={() => setForm({ ...form, timeSlots: form.timeSlots.filter((item) => item !== slot) })}
                      >
                        {slot} ×
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex min-h-12 items-center justify-between gap-3 rounded-md border p-3">
                    <span>
                      <span className="block text-sm font-medium">Active</span>
                      <span className="text-xs text-muted-foreground">Eligible bookings can receive this discount.</span>
                    </span>
                    <Switch checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} />
                  </label>
                  <label className="flex min-h-12 items-center justify-between gap-3 rounded-md border p-3">
                    <span>
                      <span className="block text-sm font-medium">Show on homepage</span>
                      <span className="text-xs text-muted-foreground">Public visitors can see this offer.</span>
                    </span>
                    <Switch checked={form.isPublic} onCheckedChange={(checked) => setForm({ ...form, isPublic: checked })} />
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">3</span>
                  <div>
                    <CardTitle>Discount</CardTitle>
                    <CardDescription>Choose the offer type, discount percent, and optional seat cap.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Offer type</Label>
                    <Select value={form.offerType} onValueChange={(value) => setForm({ ...form, offerType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Offer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="early_bird">Early-bird</SelectItem>
                        <SelectItem value="last_minute">Last-minute</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount-percent">Discount percentage</Label>
                    <Input
                      id="discount-percent"
                      name="discountPercent"
                      type="number"
                      min={1}
                      max={90}
                      value={form.discountPercent}
                      onChange={(event) => setForm({ ...form, discountPercent: Number(event.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discounted-seats">Discounted seats</Label>
                    <Input
                      id="discounted-seats"
                      name="discountedSeats"
                      type="number"
                      min={1}
                      placeholder="All seats"
                      value={form.discountedSeats}
                      onChange={(event) => setForm({ ...form, discountedSeats: event.target.value })}
                    />
                  </div>
                </div>

                {form.offerType !== "standard" && (
                  <div className="space-y-2">
                    <Label htmlFor="booking-notice">Booking notice days</Label>
                    <Input
                      id="booking-notice"
                      name="bookingNoticeDays"
                      type="number"
                      min={0}
                      value={form.bookingNoticeDays}
                      onChange={(event) => setForm({ ...form, bookingNoticeDays: Number(event.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Early-bird requires visitors to book at least this many days before the visit. Last-minute applies within this many days.
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Create special offer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Offer preview</CardTitle>
                <CardDescription>This is the customer-friendly version shown on the homepage.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <Badge variant="default">{form.discountPercent || 0}% off</Badge>
                    <span className="text-xs text-muted-foreground">{formatOfferType(form.offerType)}</span>
                  </div>
                  <h3 className="text-lg font-semibold">{form.description || "Limited-time guided visit offer"}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {summarizeSelection(form.tourTypes, "All tour types", TOUR_TYPES)} · {summarizeSelection(form.groupSizes, "All group sizes", GROUP_SIZES)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {form.activityStartDate && form.activityEndDate
                      ? `${formatDate(form.activityStartDate)} – ${formatDate(form.activityEndDate)}`
                      : "Choose activity dates to complete the offer."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current pricing</CardTitle>
                <CardDescription>Use this to choose sensible discounts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pricing.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span className="capitalize">{item.groupSize.replace("_", " ")}</span>
                    <span className="font-semibold">MWK {Number(item.basePrice || 0).toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manage offers</CardTitle>
                <CardDescription>Pause offers before deleting them when bookings may have used the discount.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading offers…
                  </div>
                ) : offers.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <BadgePercent className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <h3 className="font-semibold">You don’t have special offers yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Create one to show discounted prices for a limited time.</p>
                  </div>
                ) : offers.map((offer) => {
                  const status = statusForOffer(offer);
                  return (
                    <div key={offer.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{offer.name}</h3>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{offer.discountPercent}% off · {formatOfferType(offer.offerType)}</p>
                        </div>
                        <Badge variant="outline">{offer.usedSeats || 0}{offer.discountedSeats ? `/${offer.discountedSeats}` : ""} seats</Badge>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {formatDate(offer.activityStartDate)} – {formatDate(offer.activityEndDate)}</div>
                        <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {offer.timeSlots?.length ? offer.timeSlots.join(", ") : "All time slots"}</div>
                        <div>{summarizeSelection(offer.tourTypes, "All tour types", TOUR_TYPES)}</div>
                        <div>{summarizeSelection(offer.groupSizes, "All group sizes", GROUP_SIZES)}</div>
                      </div>
                      <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={updateMutation.isPending}
                          onClick={() => updateMutation.mutate({ id: offer.id, updates: { isActive: !offer.isActive } })}
                        >
                          {offer.isActive ? <Pause className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                          {offer.isActive ? "Pause" : "Publish"}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm("Delete this special offer? This cannot be undone.")) {
                              deleteMutation.mutate(offer.id);
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
