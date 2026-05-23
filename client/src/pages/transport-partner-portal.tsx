import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation, useRoute, useSearch } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Calendar,
  CalendarOff,
  Car,
  ChevronLeft,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  ExternalLink,
  HelpCircle,
  History,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Pencil,
  Plus,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { SEO } from "@/components/seo";
import { StatCard } from "@/components/stat-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate, formatTime, GROUP_SIZES, PRICING, TOUR_TYPES } from "@/lib/constants";
import { DEFAULT_TRANSPORT_ROUTE_ID, getTransportRoute, TRANSPORT_ROUTES } from "@/lib/transport";
import type {
  PartnerTourReferral,
  PricingConfig,
  TransportPartnerBlackout,
  TransportPartnerDriver,
  TransportPartnerPricing,
  TransportPartnerVehicle,
  TransportPartner,
  TransportRequest,
  TransportRequestActivity,
  TransportRequestStatus,
  User,
} from "@shared/schema";

const transportStatuses: TransportRequestStatus[] = [
  "pending",
  "sent_to_partner",
  "quote_sent",
  "accepted",
  "visitor_approved",
  "visitor_declined",
  "confirmed",
  "reschedule_requested",
  "completed",
  "cancelled",
];

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  sent_to_partner: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  quote_sent: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  accepted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  visitor_approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  visitor_declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  reschedule_requested: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  completed: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  submitted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  contacted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  booked: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  inactive: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
};

interface PartnerProfileResponse {
  user: User;
  partner: TransportPartner | null;
  partners?: TransportPartner[];
}

interface CreateReferralResponse {
  accountEmail?: {
    mode?: string;
    sent?: boolean;
    error?: string;
  } | null;
}

const initialReferralForm = {
  partnerId: "",
  visitorName: "",
  visitorEmail: "",
  visitorPhone: "",
  visitDate: "",
  visitTime: "10:00",
  groupSize: "individual",
  numberOfPeople: 1,
  tourType: "standard",
  notes: "",
};

const SELECT_PARTNER_PLACEHOLDER = "select-partner";

type PartnerForm = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  whatsapp: string;
  baseLocation: string;
  preferredContactMethod: "email" | "phone" | "whatsapp";
  serviceAreasText: string;
  paymentTerms: string;
  publicNotes: string;
  internalNotes: string;
  defaultCurrency: string;
  pricingNotes: string;
  status: "active" | "paused" | "inactive";
  notes: string;
};

type RequestDraft = Partial<{
  partnerId: string | null;
  status: TransportRequestStatus;
  quotedAmount: string;
  estimatedPickupTime: string;
  driverName: string;
  driverPhone: string;
  vehicleDetails: string;
  partnerNotes: string;
  adminNotes: string;
  driverId: string | null;
  vehicleId: string | null;
  requestedPickupTime: string;
  requestedVisitDate: string;
  rescheduleNotes: string;
  cancellationReason: string;
}>;

type DriverForm = {
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  status: "active" | "inactive";
  notes: string;
};

type VehicleForm = {
  label: string;
  vehicleType: string;
  plateNumber: string;
  capacity: string;
  color: string;
  status: "active" | "inactive";
  notes: string;
};

type BlackoutForm = {
  startDate: string;
  endDate: string;
  reason: string;
  status: "active" | "cancelled";
};

type PricingForm = {
  route: string;
  label: string;
  basePrice: string;
  currency: string;
  pricingType: "per_trip" | "per_person" | "per_day" | "custom";
  priceIncludes: string;
  notes: string;
  status: "active" | "inactive";
};

const initialPartnerForm: PartnerForm = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  whatsapp: "",
  baseLocation: "",
  preferredContactMethod: "whatsapp",
  serviceAreasText: "",
  paymentTerms: "",
  publicNotes: "",
  internalNotes: "",
  defaultCurrency: "MWK",
  pricingNotes: "",
  status: "active",
  notes: "",
};

const initialDriverForm: DriverForm = {
  name: "",
  phone: "",
  email: "",
  licenseNumber: "",
  status: "active",
  notes: "",
};

const initialVehicleForm: VehicleForm = {
  label: "",
  vehicleType: "",
  plateNumber: "",
  capacity: "",
  color: "",
  status: "active",
  notes: "",
};

const initialBlackoutForm: BlackoutForm = {
  startDate: "",
  endDate: "",
  reason: "",
  status: "active",
};

const initialPricingForm: PricingForm = {
  route: DEFAULT_TRANSPORT_ROUTE_ID,
  label: "",
  basePrice: "",
  currency: "MWK",
  pricingType: "per_trip",
  priceIncludes: "",
  notes: "",
  status: "active",
};

function driverToForm(driver: TransportPartnerDriver): DriverForm {
  return {
    name: driver.name || "",
    phone: driver.phone || "",
    email: driver.email || "",
    licenseNumber: driver.licenseNumber || "",
    status: driver.status === "inactive" ? "inactive" : "active",
    notes: driver.notes || "",
  };
}

function vehicleToForm(vehicle: TransportPartnerVehicle): VehicleForm {
  return {
    label: vehicle.label || "",
    vehicleType: vehicle.vehicleType || "",
    plateNumber: vehicle.plateNumber || "",
    capacity: vehicle.capacity != null ? String(vehicle.capacity) : "",
    color: vehicle.color || "",
    status: vehicle.status === "inactive" ? "inactive" : "active",
    notes: vehicle.notes || "",
  };
}

function blackoutToForm(blackout: TransportPartnerBlackout): BlackoutForm {
  return {
    startDate: blackout.startDate || "",
    endDate: blackout.endDate || "",
    reason: blackout.reason || "",
    status: blackout.status === "cancelled" ? "cancelled" : "active",
  };
}

function pricingToForm(price: TransportPartnerPricing): PricingForm {
  return {
    route: price.route || DEFAULT_TRANSPORT_ROUTE_ID,
    label: price.label || "",
    basePrice: price.basePrice != null ? String(price.basePrice) : "",
    currency: price.currency || "MWK",
    pricingType: (price.pricingType as PricingForm["pricingType"]) || "per_trip",
    priceIncludes: price.priceIncludes || "",
    notes: price.notes || "",
    status: price.status === "inactive" ? "inactive" : "active",
  };
}

type GroupSizeId = (typeof GROUP_SIZES)[number]["id"];

const fallbackBasePrices: Record<GroupSizeId, number> = {
  individual: PRICING.individual,
  small_group: PRICING.small_group,
  large_group: PRICING.large_group,
  custom: PRICING.custom,
};

function humanizeStatus(status?: string | null) {
  return (status || "pending").replace(/_/g, " ");
}

function transportPartnerSectionHref(section: string, isAdmin: boolean) {
  if (isAdmin) return `/transport-partner?tab=${section}`;
  return section === "dashboard" ? "/transport-partner/dashboard" : `/transport-partner/${section}`;
}

function getGroupSizeLabel(groupSize: string) {
  return GROUP_SIZES.find((size) => size.id === groupSize)?.name || humanizeStatus(groupSize);
}

function getTourTypeLabel(tourType: string) {
  return TOUR_TYPES.find((type) => type.id === tourType)?.name || humanizeStatus(tourType);
}

function getGroupSizeFromPeople(numberOfPeople: number): GroupSizeId {
  if (numberOfPeople <= 1) return "individual";
  if (numberOfPeople <= 5) return "small_group";
  if (numberOfPeople <= 10) return "large_group";
  return "custom";
}

function partnerToForm(partner?: TransportPartner | null): PartnerForm {
  if (!partner) return initialPartnerForm;
  return {
    companyName: partner.companyName || "",
    contactName: partner.contactName || "",
    email: partner.email || "",
    phone: partner.phone || "",
    whatsapp: partner.whatsapp || "",
    baseLocation: partner.baseLocation || "",
    preferredContactMethod: (partner.preferredContactMethod as PartnerForm["preferredContactMethod"]) || "whatsapp",
    serviceAreasText: (partner.serviceAreas || []).join(", "),
    paymentTerms: partner.paymentTerms || "",
    publicNotes: partner.publicNotes || "",
    internalNotes: partner.internalNotes || "",
    defaultCurrency: partner.defaultCurrency || "MWK",
    pricingNotes: partner.pricingNotes || "",
    status: (partner.status as PartnerForm["status"]) || "active",
    notes: partner.notes || "",
  };
}

function partnerFormPayload(form: PartnerForm) {
  return {
    companyName: form.companyName.trim(),
    contactName: form.contactName.trim() || null,
    email: form.email.trim(),
    phone: form.phone.trim() || null,
    whatsapp: form.whatsapp.trim() || null,
    baseLocation: form.baseLocation.trim() || null,
    preferredContactMethod: form.preferredContactMethod,
    serviceAreas: form.serviceAreasText
      .split(",")
      .map((area) => area.trim())
      .filter(Boolean),
    paymentTerms: form.paymentTerms.trim() || null,
    publicNotes: form.publicNotes.trim() || null,
    internalNotes: form.internalNotes.trim() || null,
    defaultCurrency: form.defaultCurrency.trim() || "MWK",
    pricingNotes: form.pricingNotes.trim() || null,
    status: form.status,
    notes: form.notes.trim() || null,
  };
}

function formatMaybeTime(time?: string | null) {
  return time ? formatTime(time) : "Not set";
}

function isOpenTransportRequest(request: Pick<TransportRequest, "status">) {
  return !["completed", "cancelled"].includes(request.status || "");
}

function transportRequestTimestamp(
  request: Pick<TransportRequest, "visitDate" | "visitTime" | "createdAt">
) {
  const fallbackTimestamp = request.createdAt ? new Date(request.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
  if (!request.visitDate) return Number.isNaN(fallbackTimestamp) ? Number.MAX_SAFE_INTEGER : fallbackTimestamp;

  const dateValue = String(request.visitDate).slice(0, 10);
  const timeValue = request.visitTime ? String(request.visitTime).slice(0, 5) : "00:00";
  const timestamp = new Date(`${dateValue}T${timeValue}`).getTime();

  return Number.isNaN(timestamp) ? fallbackTimestamp : timestamp;
}

function formatRequestSchedule(request: Pick<TransportRequest, "visitDate" | "visitTime">) {
  if (!request.visitDate) return "Date pending";
  return `${formatDate(request.visitDate)}${request.visitTime ? ` at ${formatTime(request.visitTime)}` : ""}`;
}

function requestNeedsQuote(request: TransportRequest) {
  const status = request.status || "pending";
  return ["pending", "sent_to_partner"].includes(status) || (status === "accepted" && request.quotedAmount == null);
}

function getPartnerRequestAction(request: TransportRequest) {
  const status = request.status || "pending";
  if (status === "reschedule_requested") return "Review reschedule";
  if (status === "visitor_declined") return "Review declined quote";
  if (status === "visitor_approved") return "Confirm pickup";
  if (status === "confirmed") return "Prepare driver";
  if (requestNeedsQuote(request)) return "Add quote";
  if (["quote_sent", "accepted"].includes(status)) return "Await visitor";
  return "Review request";
}

function requestDateKey(request: Pick<TransportRequest, "visitDate" | "createdAt">) {
  const value = request.visitDate || request.createdAt;
  if (value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }
  return "unscheduled";
}

function formatShortDateLabel(dateKey: string) {
  if (dateKey === "unscheduled") return "Date pending";
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Date pending";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function PartnerProfileFields({
  form,
  onChange,
  isAdmin,
}: {
  form: PartnerForm;
  onChange: (form: PartnerForm) => void;
  isAdmin: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="partner-company">Company name</Label>
          <Input
            id="partner-company"
            value={form.companyName}
            onChange={(event) => onChange({ ...form, companyName: event.target.value })}
            placeholder="Company name…"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner-email">Email</Label>
          <Input
            id="partner-email"
            type="email"
            value={form.email}
            onChange={(event) => onChange({ ...form, email: event.target.value })}
            placeholder="partner@example.com…"
            disabled={!isAdmin}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner-contact">Contact person</Label>
          <Input
            id="partner-contact"
            value={form.contactName}
            onChange={(event) => onChange({ ...form, contactName: event.target.value })}
            placeholder="Contact name…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner-base">Base location</Label>
          <Input
            id="partner-base"
            value={form.baseLocation}
            onChange={(event) => onChange({ ...form, baseLocation: event.target.value })}
            placeholder="Lilongwe…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner-phone">Phone</Label>
          <Input
            id="partner-phone"
            inputMode="tel"
            value={form.phone}
            onChange={(event) => onChange({ ...form, phone: event.target.value })}
            placeholder="+265…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner-whatsapp">WhatsApp</Label>
          <Input
            id="partner-whatsapp"
            inputMode="tel"
            value={form.whatsapp}
            onChange={(event) => onChange({ ...form, whatsapp: event.target.value })}
            placeholder="+265…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner-contact-method">Preferred contact</Label>
          <Select
            value={form.preferredContactMethod}
            onValueChange={(preferredContactMethod: PartnerForm["preferredContactMethod"]) =>
              onChange({ ...form, preferredContactMethod })
            }
          >
            <SelectTrigger id="partner-contact-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isAdmin && (
          <div className="space-y-2">
            <Label htmlFor="partner-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(status: PartnerForm["status"]) => onChange({ ...form, status })}
            >
              <SelectTrigger id="partner-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="partner-service-areas">Service areas</Label>
        <Input
          id="partner-service-areas"
          value={form.serviceAreasText}
          onChange={(event) => onChange({ ...form, serviceAreasText: event.target.value })}
          placeholder="Lilongwe, Dzaleka, Senga Bay…"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="partner-public-notes">Partner service notes</Label>
          <Textarea
            id="partner-public-notes"
            value={form.publicNotes}
            onChange={(event) => onChange({ ...form, publicNotes: event.target.value })}
            placeholder="Fleet, routes, operating hours, visitor-facing service notes…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner-notes">Partner notes</Label>
          <Textarea
            id="partner-notes"
            value={form.notes}
            onChange={(event) => onChange({ ...form, notes: event.target.value })}
            placeholder="General partnership notes…"
          />
        </div>
      </div>

      {isAdmin && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            <div className="space-y-2">
              <Label htmlFor="partner-default-currency">Default quote currency</Label>
              <Input
                id="partner-default-currency"
                value={form.defaultCurrency}
                onChange={(event) => onChange({ ...form, defaultCurrency: event.target.value.toUpperCase() })}
                placeholder="MWK…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-pricing-notes">Pricing notes</Label>
              <Input
                id="partner-pricing-notes"
                value={form.pricingNotes}
                onChange={(event) => onChange({ ...form, pricingNotes: event.target.value })}
                placeholder="How this partner prices routes…"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="partner-payment-terms">Payment terms</Label>
            <Textarea
              id="partner-payment-terms"
              value={form.paymentTerms}
              onChange={(event) => onChange({ ...form, paymentTerms: event.target.value })}
              placeholder="Transport payment terms, deposits, cancellation terms…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partner-internal-notes">Internal admin notes</Label>
            <Textarea
              id="partner-internal-notes"
              value={form.internalNotes}
              onChange={(event) => onChange({ ...form, internalNotes: event.target.value })}
              placeholder="Private admin notes about quality, risk, follow-up…"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  return (
    <Badge className={`max-w-full whitespace-normal break-words text-center leading-tight ${statusStyles[status || "pending"] || statusStyles.pending}`}>
      {humanizeStatus(status)}
    </Badge>
  );
}

function displayValue(value?: string | number | null) {
  if (value === null || value === undefined || String(value).trim() === "") return "Not recorded";
  return String(value);
}

function formatOptionalDate(value?: string | Date | null) {
  return value ? formatDate(value) : "Not recorded";
}

function InfoBlock({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | number | null;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-md border bg-muted/20 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 min-w-0 break-words text-sm">{children || displayValue(value)}</div>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function partnerCompletion(partner: TransportPartner) {
  const fields = [
    ["Company name", partner.companyName],
    ["Contact person", partner.contactName],
    ["Email", partner.email],
    ["Phone", partner.phone],
    ["WhatsApp", partner.whatsapp],
    ["Base location", partner.baseLocation],
    ["Service areas", partner.serviceAreas?.length ? partner.serviceAreas.join(", ") : ""],
    ["Preferred contact", partner.preferredContactMethod],
    ["Default currency", partner.defaultCurrency],
    ["Pricing notes", partner.pricingNotes],
    ["Payment terms", partner.paymentTerms],
    ["Public service notes", partner.publicNotes],
    ["Internal notes", partner.internalNotes],
  ];
  const completed = fields.filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "").length;
  const missing = fields
    .filter(([, value]) => value === null || value === undefined || String(value).trim() === "")
    .map(([label]) => label);

  return {
    completed,
    total: fields.length,
    percent: Math.round((completed / fields.length) * 100),
    missing,
  };
}

function PartnerRecordOverview({
  partner,
  requests,
  referrals,
  drivers,
  vehicles,
  blackouts,
  pricing,
}: {
  partner: TransportPartner;
  requests: TransportRequest[];
  referrals: PartnerTourReferral[];
  drivers: TransportPartnerDriver[];
  vehicles: TransportPartnerVehicle[];
  blackouts: TransportPartnerBlackout[];
  pricing: TransportPartnerPricing[];
}) {
  const completion = partnerCompletion(partner);
  const closedStatuses = ["completed", "cancelled"];
  const partnerRequests = requests.filter((request) => request.partnerId === partner.id);
  const partnerReferrals = referrals.filter((referral) => referral.partnerId === partner.id);
  const partnerDrivers = drivers.filter((driver) => driver.partnerId === partner.id);
  const partnerVehicles = vehicles.filter((vehicle) => vehicle.partnerId === partner.id);
  const partnerBlackouts = blackouts.filter((blackout) => blackout.partnerId === partner.id);
  const partnerPricing = pricing.filter((price) => price.partnerId === partner.id);
  const activeDrivers = partnerDrivers.filter((driver) => driver.status !== "inactive").length;
  const activeVehicles = partnerVehicles.filter((vehicle) => vehicle.status !== "inactive").length;
  const activePrices = partnerPricing.filter((price) => price.status !== "inactive").length;
  const activeBlackouts = partnerBlackouts.filter((blackout) => blackout.status !== "cancelled").length;
  const openRequests = partnerRequests.filter((request) => !closedStatuses.includes(request.status || "")).length;
  const awaitingVisitor = partnerRequests.filter((request) =>
    ["quote_sent", "accepted"].includes(request.status || "") && !request.quoteDecision
  ).length;
  const completedRequests = partnerRequests.filter((request) => request.status === "completed").length;
  const completedReferrals = partnerReferrals.filter((referral) => referral.status === "completed" || referral.status === "booked").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <CardTitle>Partner Profile Snapshot</CardTitle>
            <CardDescription>
              Full admin view of saved profile details, portal status, operational readiness, and recent setup records.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={partner.status || "active"} />
            <Badge variant={partner.userId ? "default" : "outline"}>
              {partner.userId ? "Portal linked" : "Invite needed"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold">{partner.companyName}</h3>
              <p className="text-sm text-muted-foreground">
                {completion.completed} of {completion.total} profile fields complete
              </p>
            </div>
            <div className="text-sm font-semibold tabular-nums">{completion.percent}% complete</div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
            <div className="h-full rounded-full bg-primary" style={{ width: `${completion.percent}%` }} />
          </div>
          {completion.missing.length > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              Missing: {completion.missing.slice(0, 6).join(", ")}
              {completion.missing.length > 6 ? `, +${completion.missing.length - 6} more` : ""}
            </p>
          )}
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Operational Summary</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryPill label="Open requests" value={openRequests} />
            <SummaryPill label="Awaiting visitor" value={awaitingVisitor} />
            <SummaryPill label="Completed trips" value={completedRequests} />
            <SummaryPill label="Tour referrals" value={partnerReferrals.length} />
            <SummaryPill label="Booked referrals" value={completedReferrals} />
            <SummaryPill label="Active drivers" value={activeDrivers} />
            <SummaryPill label="Active vehicles" value={activeVehicles} />
            <SummaryPill label="Active prices" value={activePrices} />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Contact and Service Profile</h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <InfoBlock label="Contact person" value={partner.contactName} />
            <InfoBlock label="Email" value={partner.email} />
            <InfoBlock label="Phone" value={partner.phone} />
            <InfoBlock label="WhatsApp" value={partner.whatsapp} />
            <InfoBlock label="Preferred contact" value={humanizeStatus(partner.preferredContactMethod)} />
            <InfoBlock label="Base location" value={partner.baseLocation} />
            <InfoBlock label="Service areas">
              {partner.serviceAreas?.length ? (
                <div className="flex flex-wrap gap-1">
                  {partner.serviceAreas.map((area) => (
                    <Badge key={area} variant="outline">{area}</Badge>
                  ))}
                </div>
              ) : (
                "Not recorded"
              )}
            </InfoBlock>
            <InfoBlock label="Default currency" value={partner.defaultCurrency || "MWK"} />
            <InfoBlock label="Created" value={formatOptionalDate(partner.createdAt)} />
            <InfoBlock label="Last updated" value={formatOptionalDate(partner.updatedAt)} />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Agreement and Notes</h3>
          <div className="grid gap-3 lg:grid-cols-2">
            <InfoBlock label="Payment terms" value={partner.paymentTerms} />
            <InfoBlock label="Pricing notes" value={partner.pricingNotes} />
            <InfoBlock label="Partner service notes" value={partner.publicNotes} />
            <InfoBlock label="Partner notes" value={partner.notes} />
            <InfoBlock label="Private internal notes" value={partner.internalNotes} />
            <InfoBlock label="Availability blackouts" value={`${activeBlackouts} active blackout${activeBlackouts === 1 ? "" : "s"}`} />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-semibold">Saved Drivers</h3>
            <div className="mt-3 space-y-2">
              {partnerDrivers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved drivers yet.</p>
              ) : (
                partnerDrivers.slice(0, 4).map((driver) => (
                  <div key={driver.id} className="rounded-md bg-muted/30 p-2 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{driver.name}</span>
                      <StatusBadge status={driver.status || "active"} />
                    </div>
                    <p className="mt-1 text-muted-foreground">{displayValue(driver.phone)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-semibold">Saved Vehicles</h3>
            <div className="mt-3 space-y-2">
              {partnerVehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved vehicles yet.</p>
              ) : (
                partnerVehicles.slice(0, 4).map((vehicle) => (
                  <div key={vehicle.id} className="rounded-md bg-muted/30 p-2 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{vehicle.label}</span>
                      <StatusBadge status={vehicle.status || "active"} />
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {[vehicle.vehicleType, vehicle.plateNumber, vehicle.capacity ? `${vehicle.capacity} seats` : null]
                        .filter(Boolean)
                        .join(" · ") || "Details not recorded"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-semibold">Route Prices</h3>
            <div className="mt-3 space-y-2">
              {partnerPricing.length === 0 ? (
                <p className="text-sm text-muted-foreground">No route pricing yet.</p>
              ) : (
                partnerPricing.slice(0, 4).map((price) => (
                  <div key={price.id} className="rounded-md bg-muted/30 p-2 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{price.label || getTransportRoute(price.route).shortLabel}</span>
                      <StatusBadge status={price.status || "active"} />
                    </div>
                    <p className="mt-1 text-muted-foreground tabular-nums">
                      {formatCurrency(price.basePrice || 0, price.currency || partner.defaultCurrency || "MWK")} · {humanizeStatus(price.pricingType)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function PartnerScopePanel({
  title,
  description,
  partners,
  selectedPartnerId,
  onPartnerChange,
  children,
}: {
  title: string;
  description: string;
  partners: TransportPartner[];
  selectedPartnerId: string;
  onPartnerChange: (partnerId: string) => void;
  children?: ReactNode;
}) {
  const selectedPartner = partners.find((partner) => partner.id === selectedPartnerId) || null;
  const selectedContact = selectedPartner
    ? [selectedPartner.contactName, selectedPartner.phone || selectedPartner.whatsapp || selectedPartner.email]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="w-full lg:w-80">
          <Label htmlFor="admin-transport-partner-scope">Partner workspace</Label>
          <Select
            value={selectedPartnerId || SELECT_PARTNER_PLACEHOLDER}
            onValueChange={(partnerId) => {
              if (partnerId !== SELECT_PARTNER_PLACEHOLDER) onPartnerChange(partnerId);
            }}
            disabled={partners.length === 0}
          >
            <SelectTrigger id="admin-transport-partner-scope" className="mt-2">
              <SelectValue placeholder="Select partner…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_PARTNER_PLACEHOLDER} disabled>
                Select a transport partner
              </SelectItem>
              {partners.map((partner) => (
                <SelectItem key={partner.id} value={partner.id}>
                  {partner.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {partners.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No transport partners configured"
            description="Create a transport partner profile before managing fleet, availability, pricing, or requests."
          />
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoBlock label="Selected partner" value={selectedPartner?.companyName || "No partner selected"} />
              <InfoBlock label="Contact" value={selectedContact || "Contact not recorded"} />
              <InfoBlock label="Base" value={selectedPartner?.baseLocation || "Base not recorded"} />
              <InfoBlock label="Status">
                <StatusBadge status={selectedPartner?.status || "active"} />
              </InfoBlock>
            </div>
            {children}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function HelpCenterPanel({ isAdmin }: { isAdmin: boolean }) {
  const workflowGuides = isAdmin
    ? [
        {
          icon: ShieldCheck,
          title: "Run the request queue",
          steps: [
            "Open Request Queue and check the visitor route, pickup location, visit date, and current status.",
            "Assign an active transport partner, or set the partner back to Unassigned if Visit Dzaleka needs to review it first.",
            "Check the quote amount, driver, vehicle, and internal notes before saving an Accepted, Quote sent, or Confirmed status.",
          ],
        },
        {
          icon: DollarSign,
          title: "Review partner pricing",
          steps: [
            "Use Partner Prices to see the route prices partners maintain for their own services.",
            "Keep Visit Dzaleka guiding prices separate from transport charges when reviewing referrals.",
            "Use the actual Transport quote field on each request for the amount sent to the visitor.",
          ],
        },
        {
          icon: Users,
          title: "Control partner records",
          steps: [
            "Use Partner Records to create partners, pause partners, update contact details, unlink accounts, or delete unused partner records.",
            "Use Fleet Records and Blackout Controls to check whether a partner has usable drivers, vehicles, and availability.",
            "Use the request timeline before changing disputed, declined, rescheduled, or cancelled requests.",
          ],
        },
      ]
    : [
        {
          icon: ShieldCheck,
          title: "Use the dashboard first",
          steps: [
            "Start with Today's transport desk to see open work, exceptions, next best action, and quick actions.",
            "Use the metric tiles to jump into quotes to send, visitor decisions, confirmed pickups, or pricing.",
            "Check Attention queue and Readiness checklist before the next pickup so driver, phone, vehicle, and pricing details are complete.",
          ],
        },
        {
          icon: ClipboardList,
          title: "Quote and confirm a request",
          steps: [
            "Open Transport Requests and review the visitor route, pickup location, visit date, and requested time.",
            "Add your quote amount, pickup time, driver, driver phone, and vehicle details.",
            "Save the request as Quote sent or Accepted so the visitor receives an email to approve or decline the quote.",
          ],
        },
        {
          icon: Car,
          title: "Reuse drivers and vehicles",
          steps: [
            "Add your regular drivers in Roster with phone numbers that visitors can use on the travel day.",
            "Add vehicle labels, plate numbers, and capacity so each booking has clear transport details.",
            "Select saved drivers and vehicles inside a request instead of retyping the same details each time.",
          ],
        },
        {
          icon: Send,
          title: "Refer visitors for Dzaleka tours",
          steps: [
            "Open Tour Referrals and enter the visitor details, visit date, group size, and tour type.",
            "Review the Visit Dzaleka guiding fee shown in the referral form before submitting.",
            "Submit the referral so the visitor receives account access to manage their tour booking.",
          ],
        },
      ];

  const dashboardCards = [
    {
      icon: ClipboardList,
      title: "Metric tiles",
      detail: "Shows quotes to send, visitor decisions, confirmed pickups, and quoted value. Each tile opens the matching work area.",
    },
    {
      icon: Send,
      title: "Quick actions",
      detail: "One-tap shortcuts for requests, referrals, drivers, vehicles, availability blocks, and pricing updates.",
    },
    {
      icon: Clock,
      title: "Request pipeline",
      detail: "Tracks requests from requested to quoted, approved, confirmed, and completed so workload is easy to scan.",
    },
    {
      icon: HelpCircle,
      title: "Attention queue",
      detail: "Highlights stale quote requests, missing fleet details, and exceptions that need follow-up.",
    },
    {
      icon: MapPin,
      title: "Route and date charts",
      detail: "Shows popular routes and upcoming visit-date volume to help plan driver and vehicle coverage.",
    },
    {
      icon: CheckCircle2,
      title: "Readiness checklist",
      detail: "Confirms profile contacts, active drivers, active vehicles, and route pricing are ready for bookings.",
    },
  ];

  const partnerPages = isAdmin
    ? [
        {
          icon: ClipboardList,
          title: "Request Queue",
          detail: "Assign transport partners, review quote details, monitor visitor approval, and handle exceptions.",
          href: transportPartnerSectionHref("requests", true),
        },
        {
          icon: Send,
          title: "Referral Intake",
          detail: "Create or review tour referrals that came through transport partners.",
          href: transportPartnerSectionHref("referrals", true),
        },
        {
          icon: Car,
          title: "Fleet Records",
          detail: "Check saved drivers and vehicles before urgent transport assignment.",
          href: transportPartnerSectionHref("roster", true),
        },
        {
          icon: CalendarOff,
          title: "Blackout Controls",
          detail: "Review unavailable dates so requests are assigned to partners who can actually operate.",
          href: transportPartnerSectionHref("availability", true),
        },
        {
          icon: DollarSign,
          title: "Partner Prices",
          detail: "Review partner-maintained route prices separately from visitor-specific quotes.",
          href: transportPartnerSectionHref("pricing", true),
        },
        {
          icon: Users,
          title: "Partner Records",
          detail: "Create, pause, edit, invite, unlink, or delete transport partner records.",
          href: transportPartnerSectionHref("partners", true),
        },
      ]
    : [
        {
          icon: ShieldCheck,
          title: "Dashboard",
          detail: "Your operations desk for stats, next best action, pipeline, attention items, charts, and priority requests.",
          href: transportPartnerSectionHref("dashboard", false),
        },
        {
          icon: ClipboardList,
          title: "Transport Requests",
          detail: "Quote visitor transport, add pickup time, assign driver and vehicle details, and track approval status.",
          href: transportPartnerSectionHref("requests", false),
        },
        {
          icon: Send,
          title: "Tour Referrals",
          detail: "Send guests to Visit Dzaleka for guided tour booking and follow the submitted referral list.",
          href: transportPartnerSectionHref("referrals", false),
        },
        {
          icon: Car,
          title: "Roster",
          detail: "Save regular drivers and vehicles so request handling is faster and visitor details stay consistent.",
          href: transportPartnerSectionHref("roster", false),
        },
        {
          icon: CalendarOff,
          title: "Availability",
          detail: "Block dates when the team, vehicle, or driver roster cannot accept new transport requests.",
          href: transportPartnerSectionHref("availability", false),
        },
        {
          icon: DollarSign,
          title: "Pricing",
          detail: "Maintain route price references. Request-specific quotes are still saved on each transport request.",
          href: transportPartnerSectionHref("pricing", false),
        },
        {
          icon: Settings,
          title: "Profile",
          detail: "Keep company contact, WhatsApp, service areas, and operating notes current for staff.",
          href: transportPartnerSectionHref("profile", false),
        },
        {
          icon: HelpCircle,
          title: "Help Center",
          detail: "Use this page when you need the map of dashboard sections, statuses, and partner workflows.",
          href: transportPartnerSectionHref("help", false),
        },
      ];

  const quickRules = isAdmin
    ? [
        "Transport partners set their own transport prices; Visit Dzaleka guiding fees stay separate.",
        "Partners can only see visitors linked to their own requests and can message admin staff.",
        "Visitor approval is needed before a quoted transport request is treated as final.",
        "Blackout dates and inactive records should be checked before assigning urgent transport.",
      ]
    : [
        "Set route prices in Pricing so Visit Dzaleka can understand your usual transport rates.",
        "Use Availability to block dates when you cannot accept bookings.",
        "Keep your Profile current so staff have the right contact, WhatsApp, and operating notes.",
        "Visitor tour fees are shown in Tour Referrals; transport is quoted separately by you.",
      ];

  const statusGuide = [
    {
      status: "pending / sent to partner",
      meaning: isAdmin ? "Partner assignment or quote follow-up is needed." : "Open the request and send a quote or acceptance details.",
    },
    {
      status: "quote sent / accepted",
      meaning: "The visitor has pricing and needs to approve or decline the quote.",
    },
    {
      status: "visitor approved",
      meaning: "Final pickup details should be confirmed with driver and vehicle information.",
    },
    {
      status: "confirmed",
      meaning: "Transport is scheduled and should be prepared for the travel day.",
    },
    {
      status: "visitor declined / reschedule requested",
      meaning: "The request needs follow-up before it can move forward.",
    },
    {
      status: "completed / cancelled",
      meaning: "The request is closed and no longer counted as open operational work.",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold">{isAdmin ? "Admin Help Center" : "Partner Help Center"}</h2>
            </div>
            <p className="mt-2 max-w-3xl break-words text-sm text-muted-foreground">
              {isAdmin
                ? "Operational guidance for assignments, partner records, pricing references, request exceptions, and visitor quote decisions."
                : "Reference for the transport partner dashboard, sidebar pages, transport request statuses, and daily partner workflows."}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:w-[360px] lg:grid-cols-1">
            <Button variant="outline" className="h-auto min-h-10 justify-start whitespace-normal text-left leading-snug" asChild>
              <Link href={transportPartnerSectionHref(isAdmin ? "requests" : "dashboard", isAdmin)}>
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                <span className="min-w-0 break-words">{isAdmin ? "Open request queue" : "Open dashboard"}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto min-h-10 justify-start whitespace-normal text-left leading-snug" asChild>
              <Link href={transportPartnerSectionHref("requests", isAdmin)}>
                <Car className="h-4 w-4" aria-hidden="true" />
                <span className="min-w-0 break-words">Open transport requests</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {!isAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle>Dashboard Map</CardTitle>
            </div>
            <CardDescription>
              What each dashboard section is showing and where it sends you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dashboardCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-md border bg-background p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-semibold">{item.title}</h3>
                        <p className="mt-1 break-words text-sm text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle>{isAdmin ? "Admin Pages" : "Partner Sidebar Pages"}</CardTitle>
            </div>
            <CardDescription>
              {isAdmin ? "What each transport operations page controls." : "What each transport partner page is for."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {partnerPages.map((page) => {
                const Icon = page.icon;
                return (
                  <Button
                    key={page.title}
                    variant="outline"
                    className="h-auto min-h-24 justify-start whitespace-normal p-4 text-left leading-snug"
                    asChild
                  >
                    <Link href={page.href}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-semibold">{page.title}</span>
                        <span className="mt-1 block break-words text-xs font-normal text-muted-foreground">{page.detail}</span>
                      </span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle>Quick Reference</CardTitle>
            </div>
            <CardDescription>
              {isAdmin ? "Rules to keep admin handling consistent." : "Details to keep bookings clear for visitors."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {quickRules.map((rule) => (
                <div key={rule} className="flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 break-words">{rule}</span>
                </div>
              ))}
            </div>
            <div className="grid gap-2">
              {(isAdmin ? partnerPages.slice(0, 3) : partnerPages.filter((page) => ["Dashboard", "Transport Requests", "Pricing"].includes(page.title))).map((page) => {
                const Icon = page.icon;
                return (
                  <Button key={page.title} variant="outline" className="h-auto min-h-9 justify-start whitespace-normal text-left leading-snug" asChild>
                    <Link href={page.href}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span className="min-w-0 break-words">Open {page.title.toLowerCase()}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle>Common Workflows</CardTitle>
            </div>
            <CardDescription>
              {isAdmin ? "Recommended order for admin transport handling." : "Recommended order for partner transport handling."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {workflowGuides.map((guide) => {
              const Icon = guide.icon;
              return (
                <section key={guide.title} className="border-b pb-5 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    <h3 className="text-sm font-semibold">{guide.title}</h3>
                  </div>
                  <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {guide.steps.map((step, index) => (
                      <li key={step} className="flex gap-2">
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary tabular-nums">
                          {index + 1}
                        </span>
                        <span className="min-w-0 break-words">{step}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle>Status Guide</CardTitle>
            </div>
            <CardDescription>
              How request status connects to the dashboard pipeline and attention queue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y rounded-md border">
              {statusGuide.map((item) => (
                <div key={item.status} className="grid gap-2 p-4 sm:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="min-w-0">
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="min-w-0 break-words text-sm text-muted-foreground">{item.meaning}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TransportPartnerPortal() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const pathSection = location.match(/^\/transport-partner\/([^/?#]+)/)?.[1] || "";
  const requestedTab = pathSection || params.get("tab");
  const requestedPartnerId = params.get("partner");
  const [referralForm, setReferralForm] = useState(initialReferralForm);
  const [requestDrafts, setRequestDrafts] = useState<Record<string, RequestDraft>>({});
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [isBlackoutDialogOpen, setIsBlackoutDialogOpen] = useState(false);
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  const [selectedActivityRequestId, setSelectedActivityRequestId] = useState<string>("");
  const [driverForm, setDriverForm] = useState(initialDriverForm);
  const [vehicleForm, setVehicleForm] = useState(initialVehicleForm);
  const [blackoutForm, setBlackoutForm] = useState(initialBlackoutForm);
  const [pricingForm, setPricingForm] = useState(initialPricingForm);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editingBlackoutId, setEditingBlackoutId] = useState<string | null>(null);
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null);
  const [adminPartnerId, setAdminPartnerId] = useState<string>("new");
  const [adminOperationsPartnerId, setAdminOperationsPartnerId] = useState<string>("");
  const [adminPartnerForm, setAdminPartnerForm] = useState<PartnerForm>(initialPartnerForm);
  const [selfProfileForm, setSelfProfileForm] = useState<PartnerForm>(initialPartnerForm);

  const { data: profile, isLoading: profileLoading } = useQuery<PartnerProfileResponse>({
    queryKey: ["/api/transport-partner/me"],
  });

  const { data: transportRequests = [], isLoading: requestsLoading } = useQuery<TransportRequest[]>({
    queryKey: ["/api/transport-partner/requests"],
  });

  const { data: referrals = [], isLoading: referralsLoading } = useQuery<PartnerTourReferral[]>({
    queryKey: ["/api/transport-partner/referrals"],
  });

  const { data: drivers = [] } = useQuery<TransportPartnerDriver[]>({
    queryKey: ["/api/transport-partner/drivers"],
  });

  const { data: vehicles = [] } = useQuery<TransportPartnerVehicle[]>({
    queryKey: ["/api/transport-partner/vehicles"],
  });

  const { data: blackouts = [] } = useQuery<TransportPartnerBlackout[]>({
    queryKey: ["/api/transport-partner/blackouts"],
  });

  const { data: partnerPricing = [] } = useQuery<TransportPartnerPricing[]>({
    queryKey: ["/api/transport-partner/pricing"],
  });

  const { data: requestActivity = [] } = useQuery<TransportRequestActivity[]>({
    queryKey: [`/api/transport-partner/requests/${selectedActivityRequestId}/activity`],
    enabled: !!selectedActivityRequestId,
  });

  const { data: pricingConfigs = [] } = useQuery<PricingConfig[]>({
    queryKey: ["/api/pricing"],
  });

  const userRole = profile?.user?.role;
  const isAdminView = userRole === "admin" || userRole === "coordinator";
  const canDeletePartners = userRole === "admin";
  const availableTabs = isAdminView
    ? ["requests", "referrals", "roster", "availability", "pricing", "partners", "help"]
    : ["dashboard", "requests", "referrals", "roster", "availability", "pricing", "profile", "help"];
  const activeTab = availableTabs.includes(requestedTab || "") ? requestedTab! : isAdminView ? "requests" : "dashboard";
  const navigateToSection = (section: string) => navigate(transportPartnerSectionHref(section, isAdminView));
  const partners = useMemo(() => (
    profile?.partners?.length
      ? profile.partners
      : profile?.partner
        ? [profile.partner]
        : []
  ), [profile]);
  const activePartners = partners.filter((partner) => partner.status !== "inactive");
  const selectedPartnerId = isAdminView
    ? referralForm.partnerId
    : referralForm.partnerId || profile?.partner?.id || "";
  const rosterPartnerId = isAdminView
    ? adminOperationsPartnerId || partners[0]?.id || ""
    : profile?.partner?.id || "";
  const selectedAdminPartner = adminPartnerId === "new"
    ? null
    : partners.find((partner) => partner.id === adminPartnerId) || null;
  const selectedOperationsPartner = partners.find((partner) => partner.id === rosterPartnerId) || null;
  const partnerNameFor = (partnerId?: string | null) => {
    if (!partnerId) return "Unassigned";
    return partners.find((partner) => partner.id === partnerId)?.companyName || "Unknown partner";
  };
  const partnerContactFor = (partnerId?: string | null) => {
    const partner = partners.find((item) => item.id === partnerId);
    if (!partner) return partnerId ? "Partner record not found" : "Needs assignment";
    return partner.phone || partner.whatsapp || partner.email || "Contact not recorded";
  };
  const scopedDrivers = drivers.filter((driver) => !rosterPartnerId || driver.partnerId === rosterPartnerId);
  const scopedVehicles = vehicles.filter((vehicle) => !rosterPartnerId || vehicle.partnerId === rosterPartnerId);
  const scopedBlackouts = blackouts.filter((blackout) => !rosterPartnerId || blackout.partnerId === rosterPartnerId);
  const scopedPartnerPricing = partnerPricing.filter((price) => !rosterPartnerId || price.partnerId === rosterPartnerId);
  const scopedTransportRequests = transportRequests.filter((request) => !rosterPartnerId || request.partnerId === rosterPartnerId);
  const scopedReferrals = referrals.filter((referral) => !rosterPartnerId || referral.partnerId === rosterPartnerId);

  useEffect(() => {
    if (!isAdminView && profile?.partner) {
      setSelfProfileForm(partnerToForm(profile.partner));
    }
  }, [isAdminView, profile?.partner]);

  useEffect(() => {
    if (!isAdminView) return;
    if (requestedPartnerId && partners.some((partner) => partner.id === requestedPartnerId)) {
      setAdminOperationsPartnerId(requestedPartnerId);
      return;
    }
    if (!adminOperationsPartnerId && partners[0]) {
      setAdminOperationsPartnerId(partners[0].id);
      return;
    }
    if (adminOperationsPartnerId && !partners.some((partner) => partner.id === adminOperationsPartnerId)) {
      setAdminOperationsPartnerId(partners[0]?.id || "");
    }
  }, [adminOperationsPartnerId, isAdminView, partners, requestedPartnerId]);

  useEffect(() => {
    if (!isAdminView) return;
    if (requestedPartnerId && adminPartnerId !== requestedPartnerId && partners.some((partner) => partner.id === requestedPartnerId)) {
      setAdminPartnerId(requestedPartnerId);
      return;
    }
    if (adminPartnerId === "new") {
      setAdminPartnerForm(initialPartnerForm);
      return;
    }
    setAdminPartnerForm(partnerToForm(partners.find((partner) => partner.id === adminPartnerId)));
  }, [adminPartnerId, isAdminView, partners, requestedPartnerId]);

  const pricingGuide = useMemo(() => {
    const configsByGroup = new Map(pricingConfigs.map((config) => [config.groupSize, config]));

    return GROUP_SIZES.map((size) => {
      const config = configsByGroup.get(size.id);
      return {
        ...size,
        basePrice: config?.basePrice ?? fallbackBasePrices[size.id],
        additionalHourPrice: config?.additionalHourPrice ?? PRICING.additional_hour,
        currency: config?.currency || "MWK",
      };
    });
  }, [pricingConfigs]);

  const selectedPricing = pricingGuide.find((item) => item.id === referralForm.groupSize) || pricingGuide[0];
  const estimatedTourFee = selectedPricing
    ? selectedPricing.basePrice + (referralForm.tourType === "extended" ? selectedPricing.additionalHourPrice * 2 : 0)
    : 0;
  const estimatedFeeLabel = selectedPricing
    ? formatCurrency(estimatedTourFee, selectedPricing.currency)
    : formatCurrency(estimatedTourFee);
  const isCustomTour = referralForm.tourType === "custom";

  const stats = useMemo(() => {
    const closedStatuses = ["completed", "cancelled"];
    const openRequests = transportRequests.filter((request) => !closedStatuses.includes(request.status || "")).length;
    const confirmedRequests = transportRequests.filter((request) => request.status === "confirmed").length;
    const submittedReferrals = referrals.filter((referral) => referral.status === "submitted").length;
    const activePrices = partnerPricing.filter((item) => item.status !== "inactive").length;
    const unassignedRequests = transportRequests.filter((request) => !request.partnerId && !closedStatuses.includes(request.status || "")).length;
    const awaitingVisitorDecision = transportRequests.filter((request) =>
      ["quote_sent", "accepted"].includes(request.status || "") && !request.quoteDecision
    ).length;
    const visitorApprovedRequests = transportRequests.filter((request) => request.status === "visitor_approved").length;
    const issueRequests = transportRequests.filter((request) =>
      ["visitor_declined", "reschedule_requested"].includes(request.status || "")
    ).length;
    const needsAdminReview = transportRequests.filter((request) => {
      const status = request.status || "pending";
      return !closedStatuses.includes(status) && (!request.partnerId || ["visitor_declined", "reschedule_requested"].includes(status));
    }).length;
    const activeBlackouts = blackouts.filter((blackout) => blackout.status !== "cancelled").length;
    return {
      openRequests,
      confirmedRequests,
      submittedReferrals,
      activePrices,
      unassignedRequests,
      awaitingVisitorDecision,
      visitorApprovedRequests,
      issueRequests,
      needsAdminReview,
      activeBlackouts,
    };
  }, [transportRequests, referrals, partnerPricing, blackouts]);

  const partnerOperations = useMemo(() => {
    if (isAdminView) {
      return {
        activeDrivers: 0,
        activeVehicles: 0,
        activePrices: 0,
        activeBlackouts: 0,
        awaitingVisitor: 0,
        needsQuote: 0,
        issueRequests: 0,
        completedRequests: 0,
        quotedRevenue: 0,
        quoteCurrency: "MWK",
        missingFleetDetails: 0,
        staleQuoteRequests: 0,
        openRequests: [] as TransportRequest[],
        priorityRequests: [] as TransportRequest[],
        nextPickup: null as TransportRequest | null,
        pipelineStages: [] as Array<{ label: string; value: number; detail: string }>,
        routeVolume: [] as Array<{ label: string; value: number }>,
        visitVolume: [] as Array<{ label: string; value: number }>,
        readiness: [] as Array<{ label: string; detail: string; complete: boolean; tab: string; icon: typeof CheckCircle2 }>,
      };
    }

    const partnerId = profile?.partner?.id;
    const partnerDrivers = drivers.filter((driver) => !partnerId || driver.partnerId === partnerId);
    const partnerVehicles = vehicles.filter((vehicle) => !partnerId || vehicle.partnerId === partnerId);
    const partnerPrices = partnerPricing.filter((price) => !partnerId || price.partnerId === partnerId);
    const partnerBlackouts = blackouts.filter((blackout) => !partnerId || blackout.partnerId === partnerId);
    const openRequests = transportRequests.filter(isOpenTransportRequest);
    const statusRank = (request: TransportRequest) => {
      const status = request.status || "pending";
      if (["visitor_declined", "reschedule_requested"].includes(status)) return 0;
      if (requestNeedsQuote(request)) return 1;
      if (status === "visitor_approved") return 2;
      if (status === "confirmed") return 3;
      if (["quote_sent", "accepted"].includes(status)) return 4;
      return 5;
    };
    const priorityRequests = [...openRequests]
      .sort((a, b) => statusRank(a) - statusRank(b) || transportRequestTimestamp(a) - transportRequestTimestamp(b))
      .slice(0, 3);
    const nextPickup = [...openRequests]
      .filter((request) => ["visitor_approved", "confirmed"].includes(request.status || ""))
      .sort((a, b) => transportRequestTimestamp(a) - transportRequestTimestamp(b))[0] || null;
    const activeDrivers = partnerDrivers.filter((driver) => driver.status !== "inactive").length;
    const activeVehicles = partnerVehicles.filter((vehicle) => vehicle.status !== "inactive").length;
    const activePrices = partnerPrices.filter((price) => price.status !== "inactive").length;
    const activeBlackouts = partnerBlackouts.filter((blackout) => blackout.status !== "cancelled").length;
    const completedRequests = transportRequests.filter((request) => request.status === "completed").length;
    const quoteCurrency = profile?.partner?.defaultCurrency || transportRequests.find((request) => request.currency)?.currency || "MWK";
    const quotedRevenue = transportRequests
      .filter((request) => !["cancelled", "visitor_declined"].includes(request.status || "") && request.quotedAmount != null)
      .reduce((total, request) => total + (request.quotedAmount || 0), 0);
    const missingFleetDetails = openRequests.filter((request) =>
      ["visitor_approved", "confirmed"].includes(request.status || "")
      && (!request.driverName || !request.driverPhone || !request.vehicleDetails)
    ).length;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const staleQuoteRequests = openRequests.filter((request) => {
      const status = request.status || "pending";
      if (!["pending", "sent_to_partner"].includes(status)) return false;
      const createdAt = request.createdAt ? new Date(request.createdAt).getTime() : Date.now();
      return !Number.isNaN(createdAt) && createdAt < oneDayAgo;
    }).length;
    const pipelineStages = [
      {
        label: "Requested",
        value: openRequests.filter((request) => ["pending", "sent_to_partner"].includes(request.status || "pending")).length,
        detail: "Needs partner quote",
      },
      {
        label: "Quoted",
        value: openRequests.filter((request) => ["quote_sent", "accepted"].includes(request.status || "") && !request.quoteDecision).length,
        detail: "Visitor deciding",
      },
      {
        label: "Approved",
        value: openRequests.filter((request) => request.status === "visitor_approved").length,
        detail: "Ready to confirm",
      },
      {
        label: "Confirmed",
        value: openRequests.filter((request) => request.status === "confirmed").length,
        detail: "Pickup scheduled",
      },
      {
        label: "Completed",
        value: completedRequests,
        detail: "Trips finished",
      },
    ];
    const routeCounts = new Map<string, number>();
    transportRequests.forEach((request) => {
      const routeLabel = getTransportRoute(request.route).shortLabel;
      routeCounts.set(routeLabel, (routeCounts.get(routeLabel) || 0) + 1);
    });
    const routeVolume = Array.from(routeCounts, ([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    const visitCounts = new Map<string, number>();
    transportRequests.forEach((request) => {
      const key = requestDateKey(request);
      visitCounts.set(key, (visitCounts.get(key) || 0) + 1);
    });
    const visitVolume = Array.from(visitCounts, ([key, value]) => ({ key, label: formatShortDateLabel(key), value }))
      .sort((a, b) => {
        if (a.key === "unscheduled") return 1;
        if (b.key === "unscheduled") return -1;
        return a.key.localeCompare(b.key);
      })
      .slice(0, 6)
      .map(({ label, value }) => ({ label, value }));
    const profileReady = !!profile?.partner?.companyName
      && !!profile.partner.email
      && (!!profile.partner.phone || !!profile.partner.whatsapp);

    return {
      activeDrivers,
      activeVehicles,
      activePrices,
      activeBlackouts,
      completedRequests,
      quotedRevenue,
      quoteCurrency,
      missingFleetDetails,
      staleQuoteRequests,
      awaitingVisitor: openRequests.filter((request) =>
        ["quote_sent", "accepted"].includes(request.status || "") && !request.quoteDecision
      ).length,
      needsQuote: openRequests.filter(requestNeedsQuote).length,
      issueRequests: openRequests.filter((request) =>
        ["visitor_declined", "reschedule_requested"].includes(request.status || "")
      ).length,
      openRequests,
      priorityRequests,
      nextPickup,
      pipelineStages,
      routeVolume,
      visitVolume,
      readiness: [
        {
          label: "Profile contacts",
          detail: profileReady ? "Company, email, and phone or WhatsApp are saved." : "Add company, email, and phone or WhatsApp.",
          complete: profileReady,
          tab: "profile",
          icon: Settings,
        },
        {
          label: "Driver roster",
          detail: activeDrivers > 0 ? `${activeDrivers} active driver${activeDrivers === 1 ? "" : "s"} ready.` : "Add at least one active driver.",
          complete: activeDrivers > 0,
          tab: "roster",
          icon: Users,
        },
        {
          label: "Vehicle roster",
          detail: activeVehicles > 0 ? `${activeVehicles} active vehicle${activeVehicles === 1 ? "" : "s"} ready.` : "Add at least one active vehicle.",
          complete: activeVehicles > 0,
          tab: "roster",
          icon: Car,
        },
        {
          label: "Route pricing",
          detail: activePrices > 0 ? `${activePrices} active route price${activePrices === 1 ? "" : "s"} saved.` : "Set your regular route pricing.",
          complete: activePrices > 0,
          tab: "pricing",
          icon: DollarSign,
        },
      ],
    };
  }, [blackouts, drivers, isAdminView, partnerPricing, profile?.partner, transportRequests, vehicles]);

  const editDriver = (driver: TransportPartnerDriver) => {
    if (isAdminView) {
      setAdminPartnerId(driver.partnerId);
      setAdminOperationsPartnerId(driver.partnerId);
    }
    setEditingDriverId(driver.id);
    setDriverForm(driverToForm(driver));
    setIsDriverDialogOpen(true);
  };

  const cancelDriverEdit = () => {
    setEditingDriverId(null);
    setDriverForm(initialDriverForm);
    setIsDriverDialogOpen(false);
  };

  const editVehicle = (vehicle: TransportPartnerVehicle) => {
    if (isAdminView) {
      setAdminPartnerId(vehicle.partnerId);
      setAdminOperationsPartnerId(vehicle.partnerId);
    }
    setEditingVehicleId(vehicle.id);
    setVehicleForm(vehicleToForm(vehicle));
    setIsVehicleDialogOpen(true);
  };

  const cancelVehicleEdit = () => {
    setEditingVehicleId(null);
    setVehicleForm(initialVehicleForm);
    setIsVehicleDialogOpen(false);
  };

  const editBlackout = (blackout: TransportPartnerBlackout) => {
    if (isAdminView) {
      setAdminPartnerId(blackout.partnerId);
      setAdminOperationsPartnerId(blackout.partnerId);
    }
    setEditingBlackoutId(blackout.id);
    setBlackoutForm(blackoutToForm(blackout));
    setIsBlackoutDialogOpen(true);
  };

  const cancelBlackoutEdit = () => {
    setEditingBlackoutId(null);
    setBlackoutForm(initialBlackoutForm);
    setIsBlackoutDialogOpen(false);
  };

  const editPricing = (price: TransportPartnerPricing) => {
    if (isAdminView) {
      setAdminPartnerId(price.partnerId);
      setAdminOperationsPartnerId(price.partnerId);
    }
    setEditingPricingId(price.id);
    setPricingForm(pricingToForm(price));
    setIsPricingDialogOpen(true);
  };

  const cancelPricingEdit = () => {
    setEditingPricingId(null);
    setPricingForm(initialPricingForm);
    setIsPricingDialogOpen(false);
  };

  const changeOperationsPartner = (partnerId: string) => {
    setAdminOperationsPartnerId(partnerId);
    setEditingDriverId(null);
    setEditingVehicleId(null);
    setEditingBlackoutId(null);
    setEditingPricingId(null);
    setDriverForm(initialDriverForm);
    setVehicleForm(initialVehicleForm);
    setBlackoutForm(initialBlackoutForm);
    setPricingForm(initialPricingForm);
  };

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RequestDraft }) => {
      const response = await apiRequest("PATCH", `/api/transport-partner/requests/${id}`, {
        ...updates,
        quotedAmount: updates.quotedAmount === "" || updates.quotedAmount == null ? null : Number(updates.quotedAmount),
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      setRequestDrafts((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/requests"] });
      setActiveRequestId(null);
      toast({
        title: "Transport request saved",
        description: data?.driverDetailsEmail?.sent
          ? "The visitor was emailed the driver and pickup details."
          : data?.driverDetailsEmail?.error
            ? "Saved, but the visitor email could not be sent."
            : undefined,
      });
    },
    onError: () => {
      toast({
        title: "Could not update request",
        description: "Please try again or contact the Visit Dzaleka team.",
        variant: "destructive",
      });
    },
  });

  const savePartnerMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: PartnerForm }) => {
      const payload = partnerFormPayload(form);
      const response = id === "new"
        ? await apiRequest("POST", "/api/transport-partners", payload)
        : await apiRequest("PATCH", `/api/transport-partners/${id}`, payload);
      return response.json() as Promise<TransportPartner>;
    },
    onSuccess: (partner) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/me"] });
      setAdminPartnerId(partner.id);
      setAdminOperationsPartnerId(partner.id);
      toast({ title: "Transport partner saved" });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not save partner",
        description: error.message || "Please check the partner details and try again.",
        variant: "destructive",
      });
    },
  });

  const saveSelfProfileMutation = useMutation({
    mutationFn: async (form: PartnerForm) => {
      const payload = partnerFormPayload(form);
      const response = await apiRequest("PATCH", "/api/transport-partner/me", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/me"] });
      toast({ title: "Profile updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not update profile",
        description: error.message || "Please check the details and try again.",
        variant: "destructive",
      });
    },
  });

  const unlinkPartnerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/transport-partners/${id}/link-user`, { userId: null });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/me"] });
      toast({ title: "Partner account unlinked" });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not unlink account",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendPartnerInviteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/transport-partners/${id}/send-invite`);
      return response.json() as Promise<{
        mode?: string;
        sent?: boolean;
        error?: string;
        linkedUserId?: string;
      }>;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/me"] });
      if (result.mode === "existing_user") {
        toast({
          title: "Partner account linked",
          description: "This partner already had a transport partner login, so the record was linked.",
        });
        return;
      }

      toast({
        title: result.sent ? "Portal invite sent" : "Invite saved",
        description: result.sent
          ? "The partner received an email to create their portal account."
          : result.error || "The invite exists, but the email could not be sent. Check Email History or email settings.",
        variant: result.sent ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not send invite",
        description: error.message || "Please check the partner email and try again.",
        variant: "destructive",
      });
    },
  });

  const deletePartnerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/transport-partners/${id}`, { approvalConfirmed: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/referrals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/drivers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/blackouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/pricing"] });
      setAdminPartnerId("new");
      setAdminPartnerForm(initialPartnerForm);
      toast({ title: "Transport partner deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not delete partner",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const createReferralMutation = useMutation({
    mutationFn: async (payload: typeof referralForm) => {
      const response = await apiRequest("POST", "/api/transport-partner/referrals", payload);
      return response.json() as Promise<CreateReferralResponse>;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/referrals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setReferralForm({ ...initialReferralForm, partnerId: selectedPartnerId });
      toast({
        title: "Referral submitted",
        description: result.accountEmail?.sent
          ? "The visitor received an email with account access to manage this booking."
          : "The referral was saved, but the visitor email was not sent. Check Email History or email settings.",
      });
    },
    onError: () => {
      toast({
        title: "Could not submit referral",
        description: "Please check the visitor details and try again.",
        variant: "destructive",
      });
    },
  });

  const createDriverMutation = useMutation({
    mutationFn: async (form: DriverForm) => {
      const response = await apiRequest("POST", "/api/transport-partner/drivers", {
        ...form,
        partnerId: rosterPartnerId || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/drivers"] });
      setDriverForm(initialDriverForm);
      setEditingDriverId(null);
      setIsDriverDialogOpen(false);
      toast({ title: "Driver saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not save driver", description: error.message, variant: "destructive" });
    },
  });

  const updateDriverMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: DriverForm }) => {
      const response = await apiRequest("PATCH", `/api/transport-partner/drivers/${id}`, {
        ...form,
        partnerId: rosterPartnerId || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/drivers"] });
      setDriverForm(initialDriverForm);
      setEditingDriverId(null);
      setIsDriverDialogOpen(false);
      toast({ title: "Driver updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not update driver", description: error.message, variant: "destructive" });
    },
  });

  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/transport-partner/drivers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/drivers"] });
      if (editingDriverId) {
        setEditingDriverId(null);
        setDriverForm(initialDriverForm);
      }
      toast({ title: "Driver removed" });
    },
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (form: VehicleForm) => {
      const response = await apiRequest("POST", "/api/transport-partner/vehicles", {
        ...form,
        partnerId: rosterPartnerId || undefined,
        capacity: form.capacity ? Number(form.capacity) : null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/vehicles"] });
      setVehicleForm(initialVehicleForm);
      setEditingVehicleId(null);
      setIsVehicleDialogOpen(false);
      toast({ title: "Vehicle saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not save vehicle", description: error.message, variant: "destructive" });
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: VehicleForm }) => {
      const response = await apiRequest("PATCH", `/api/transport-partner/vehicles/${id}`, {
        ...form,
        partnerId: rosterPartnerId || undefined,
        capacity: form.capacity ? Number(form.capacity) : null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/vehicles"] });
      setVehicleForm(initialVehicleForm);
      setEditingVehicleId(null);
      setIsVehicleDialogOpen(false);
      toast({ title: "Vehicle updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not update vehicle", description: error.message, variant: "destructive" });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/transport-partner/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/vehicles"] });
      if (editingVehicleId) {
        setEditingVehicleId(null);
        setVehicleForm(initialVehicleForm);
      }
      toast({ title: "Vehicle removed" });
    },
  });

  const createBlackoutMutation = useMutation({
    mutationFn: async (form: BlackoutForm) => {
      const response = await apiRequest("POST", "/api/transport-partner/blackouts", {
        ...form,
        partnerId: rosterPartnerId || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/blackouts"] });
      setBlackoutForm(initialBlackoutForm);
      setEditingBlackoutId(null);
      setIsBlackoutDialogOpen(false);
      toast({ title: "Availability block saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not save availability", description: error.message, variant: "destructive" });
    },
  });

  const updateBlackoutMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: BlackoutForm }) => {
      const response = await apiRequest("PATCH", `/api/transport-partner/blackouts/${id}`, {
        ...form,
        partnerId: rosterPartnerId || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/blackouts"] });
      setBlackoutForm(initialBlackoutForm);
      setEditingBlackoutId(null);
      setIsBlackoutDialogOpen(false);
      toast({ title: "Availability block updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not update availability", description: error.message, variant: "destructive" });
    },
  });

  const deleteBlackoutMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/transport-partner/blackouts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/blackouts"] });
      if (editingBlackoutId) {
        setEditingBlackoutId(null);
        setBlackoutForm(initialBlackoutForm);
      }
      toast({ title: "Availability block removed" });
    },
  });

  const createPricingMutation = useMutation({
    mutationFn: async (form: PricingForm) => {
      const response = await apiRequest("POST", "/api/transport-partner/pricing", {
        ...form,
        partnerId: rosterPartnerId || undefined,
        basePrice: Number(form.basePrice) || 0,
        currency: form.currency.toUpperCase(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/pricing"] });
      setPricingForm(initialPricingForm);
      setEditingPricingId(null);
      setIsPricingDialogOpen(false);
      toast({ title: "Transport price saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not save pricing", description: error.message, variant: "destructive" });
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: PricingForm }) => {
      const response = await apiRequest("PATCH", `/api/transport-partner/pricing/${id}`, {
        ...form,
        partnerId: rosterPartnerId || undefined,
        basePrice: Number(form.basePrice) || 0,
        currency: form.currency.toUpperCase(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/pricing"] });
      setPricingForm(initialPricingForm);
      setEditingPricingId(null);
      setIsPricingDialogOpen(false);
      toast({ title: "Transport price updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not update pricing", description: error.message, variant: "destructive" });
    },
  });

  const deletePricingMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/transport-partner/pricing/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/pricing"] });
      if (editingPricingId) {
        setEditingPricingId(null);
        setPricingForm(initialPricingForm);
      }
      toast({ title: "Transport price removed" });
    },
  });

  const updateReferralMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PartnerTourReferral> }) => {
      const response = await apiRequest("PATCH", `/api/transport-partner/referrals/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/referrals"] });
      toast({ title: "Referral updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not update referral", description: error.message, variant: "destructive" });
    },
  });

  const partnerName = profile?.partner?.companyName || "Transport Partner";
  const partnerSectionMeta: Record<string, { title: string; description: string }> = {
    dashboard: {
      title: "Transport Partner Dashboard",
      description: "Stats, priority requests, next pickup, readiness checks, and quick actions.",
    },
    requests: {
      title: "Transport Requests",
      description: "Quote visitor pickup requests, assign drivers and vehicles, and track approval status.",
    },
    referrals: {
      title: "Tour Referrals",
      description: "Send visitors to Visit Dzaleka for guided tour booking and follow referral status.",
    },
    roster: {
      title: "Roster",
      description: "Manage saved drivers and vehicles so request handling is faster and clearer.",
    },
    availability: {
      title: "Availability",
      description: "Block dates when your team cannot accept transport requests.",
    },
    pricing: {
      title: "Pricing",
      description: "Maintain route prices and quote references for common transport journeys.",
    },
    profile: {
      title: "Profile",
      description: "Keep company, contact, service area, and operating notes current.",
    },
    help: {
      title: "Help Center",
      description: "Use partner guidance for requests, referrals, pricing, availability, and profile setup.",
    },
  };
  const currentPartnerSection = partnerSectionMeta[activeTab] || partnerSectionMeta.dashboard;
  const pageTitle = isAdminView ? "Transport Operations" : currentPartnerSection.title;
  const pageDescription = isAdminView
    ? "Manage transport requests, partner records, route pricing, fleet readiness, and transport exceptions."
    : currentPartnerSection.description;
  const dashboardMetrics = [
    {
      label: "Quotes to send",
      value: partnerOperations.needsQuote,
      detail: "Requests waiting for your price",
      icon: ClipboardList,
      action: "Quote requests",
      section: "requests",
    },
    {
      label: "Awaiting visitor",
      value: partnerOperations.awaitingVisitor,
      detail: "Quotes sent, decision pending",
      icon: Clock,
      action: "View queue",
      section: "requests",
    },
    {
      label: "Confirmed pickups",
      value: stats.confirmedRequests,
      detail: "Ready for transport team",
      icon: CheckCircle2,
      action: "Review pickups",
      section: "requests",
    },
    {
      label: "Quoted value",
      value: formatCurrency(partnerOperations.quotedRevenue, partnerOperations.quoteCurrency),
      detail: "Active non-cancelled quotes",
      icon: DollarSign,
      action: "Open pricing",
      section: "pricing",
    },
  ];
  const dashboardActions = [
    { label: "Open requests", section: "requests", icon: ClipboardList },
    { label: "Refer visitor", section: "referrals", icon: Send },
    { label: "Add driver", section: "roster", icon: Users },
    { label: "Add vehicle", section: "roster", icon: Car },
    { label: "Block date", section: "availability", icon: CalendarOff },
    { label: "Update pricing", section: "pricing", icon: DollarSign },
  ];
  const attentionItems = [
    {
      label: "Quote requests over 24h",
      value: partnerOperations.staleQuoteRequests,
      detail: "Older requests can delay visitor decisions.",
      icon: Clock,
      section: "requests",
    },
    {
      label: "Missing driver or vehicle",
      value: partnerOperations.missingFleetDetails,
      detail: "Confirmed trips should include driver phone and vehicle details.",
      icon: Car,
      section: "requests",
    },
    {
      label: "Open exceptions",
      value: partnerOperations.issueRequests,
      detail: "Declined quotes or reschedule requests need follow-up.",
      icon: HelpCircle,
      section: "requests",
    },
  ];

  return (
    <PageContainer maxWidth="2xl">
      <SEO
        title={`${pageTitle} | Visit Dzaleka`}
        description={pageDescription}
      />
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={isAdminView ? (
          <>
            <Button variant="outline" asChild>
              <Link href="/users">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Invite partner
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/bookings">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                View bookings
              </Link>
            </Button>
          </>
        ) : undefined}
      />

      {isAdminView && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title={isAdminView ? "Partner records" : "Partner account"}
            value={profileLoading ? "Loading…" : isAdminView ? activePartners.length : "Active"}
            subtitle={isAdminView ? "Active transport companies" : partnerName}
            icon={Car}
            compactNumbers={isAdminView}
          />
          <StatCard
            title={isAdminView ? "Needs admin review" : "Open transport requests"}
            value={isAdminView ? stats.needsAdminReview : stats.openRequests}
            subtitle={isAdminView ? "Unassigned, declined, or reschedule" : "Awaiting transport partner follow-up"}
            icon={isAdminView ? ShieldCheck : MapPin}
            highlight={isAdminView ? stats.needsAdminReview > 0 : stats.openRequests > 0}
          />
          <StatCard
            title={isAdminView ? "Unassigned requests" : "Submitted tour referrals"}
            value={isAdminView ? stats.unassignedRequests : stats.submittedReferrals}
            subtitle={isAdminView ? "Needs partner assignment" : "New partner visitor referrals"}
            icon={isAdminView ? ClipboardList : Send}
            highlight={isAdminView ? stats.unassignedRequests > 0 : stats.submittedReferrals > 0}
          />
          <StatCard
            title={isAdminView ? "Awaiting visitor decision" : "Confirmed transport"}
            value={isAdminView ? stats.awaitingVisitorDecision : stats.confirmedRequests}
            subtitle={isAdminView ? "Quote sent, waiting response" : "Accepted and ready for visitors"}
            icon={isAdminView ? Clock : CheckCircle2}
            highlight={isAdminView ? stats.awaitingVisitorDecision > 0 : false}
          />
          <StatCard
            title="Active route prices"
            value={stats.activePrices}
            subtitle="Set by transport partners"
            icon={DollarSign}
            compactNumbers
          />
        </div>
      )}

      {isAdminView && (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                <CardTitle>Operations Overview</CardTitle>
              </div>
              <CardDescription>
                Queues for assignments, visitor quote decisions, partner records, pricing readiness, and request exceptions.
              </CardDescription>
            </div>
            <Badge variant="outline">{stats.openRequests} open requests</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section>
                <h2 className="text-sm font-semibold">Operational queues</h2>
                <div className="mt-3 divide-y rounded-md border">
                  {[
                    {
                      label: "Unassigned transport requests",
                      value: stats.unassignedRequests,
                      detail: "Assign a partner or keep internal review active.",
                      tab: "requests",
                    },
                    {
                      label: "Awaiting visitor quote decision",
                      value: stats.awaitingVisitorDecision,
                      detail: "Visitor approval or decline is still pending.",
                      tab: "requests",
                    },
                    {
                      label: "Visitor approved quotes",
                      value: stats.visitorApprovedRequests,
                      detail: "Ready for confirmation after final checks.",
                      tab: "requests",
                    },
                    {
                      label: "Exceptions",
                      value: stats.issueRequests,
                      detail: "Declined or reschedule requests need handling.",
                      tab: "requests",
                    },
                    {
                      label: "Active blackout dates",
                      value: stats.activeBlackouts,
                      detail: "Availability blocks affecting partner assignment.",
                      tab: "availability",
                    },
                  ].map((queue) => (
                    <button
                      key={queue.label}
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-[background-color] hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => navigateToSection(queue.tab)}
                    >
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-medium">{queue.label}</span>
                        <span className="mt-1 block break-words text-xs text-muted-foreground">{queue.detail}</span>
                      </span>
                      <span className="shrink-0 text-lg font-semibold tabular-nums">{queue.value}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold">Actions</h2>
                <div className="mt-3 grid gap-2">
                  {[
                    { label: "Assign requests", tab: "requests", icon: ClipboardList },
                    { label: "Review referrals", tab: "referrals", icon: Send },
                    { label: "Check fleet records", tab: "roster", icon: Car },
                    { label: "Review blackouts", tab: "availability", icon: CalendarOff },
                    { label: "Audit prices", tab: "pricing", icon: DollarSign },
                    { label: "Manage partner records", tab: "partners", icon: Users },
                    { label: "Open help center", tab: "help", icon: HelpCircle },
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={action.label}
                        type="button"
                        variant="outline"
                        className="h-auto min-h-9 justify-start whitespace-normal text-left leading-snug"
                        onClick={() => navigateToSection(action.tab)}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span className="min-w-0 break-words">{action.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </section>
            </div>

            <section>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Partner records snapshot</h2>
                <Badge variant="outline">{activePartners.length} active</Badge>
              </div>
              {partners.length === 0 ? (
                <EmptyState
                  icon={Car}
                  title="No transport partners configured"
                  description="Invite a transport partner or add a transport partner profile before assigning requests."
                />
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <Table>
                    <TableHeader>
	                      <TableRow>
	                        <TableHead>Partner</TableHead>
	                        <TableHead>Contact</TableHead>
	                        <TableHead>Operations</TableHead>
	                        <TableHead>Status</TableHead>
	                        <TableHead className="text-right">Action</TableHead>
	                      </TableRow>
                    </TableHeader>
                    <TableBody>
	                      {partners.slice(0, 5).map((partner) => {
	                        const partnerRequestCount = transportRequests.filter((request) => request.partnerId === partner.id && isOpenTransportRequest(request)).length;
	                        const partnerFleetCount = drivers.filter((driver) => driver.partnerId === partner.id).length
	                          + vehicles.filter((vehicle) => vehicle.partnerId === partner.id).length;
	                        const partnerPriceCount = partnerPricing.filter((price) => price.partnerId === partner.id && price.status !== "inactive").length;

	                        return (
	                          <TableRow key={partner.id}>
	                            <TableCell>
	                              <p className="font-medium">{partner.companyName}</p>
	                              <p className="text-xs text-muted-foreground">{partner.baseLocation || "Base not set"}</p>
	                            </TableCell>
	                            <TableCell>
	                              <p className="text-sm">{partner.contactName || partner.email}</p>
	                              <p className="text-xs text-muted-foreground">{partner.phone || partner.whatsapp || "No phone saved"}</p>
	                            </TableCell>
	                            <TableCell>
	                              <div className="flex flex-wrap gap-1">
	                                <Badge variant="outline">{partnerRequestCount} open</Badge>
	                                <Badge variant="outline">{partnerFleetCount} fleet</Badge>
	                                <Badge variant="outline">{partnerPriceCount} prices</Badge>
	                              </div>
	                            </TableCell>
	                            <TableCell><StatusBadge status={partner.status || "active"} /></TableCell>
	                            <TableCell className="text-right">
	                              <div className="flex justify-end gap-1">
	                                <Button
	                                  type="button"
	                                  variant="ghost"
	                                  size="sm"
	                                  onClick={() => {
	                                    setAdminPartnerId(partner.id);
	                                    setAdminOperationsPartnerId(partner.id);
	                                    navigateToSection("partners");
	                                  }}
	                                >
	                                  Edit
	                                </Button>
	                                <Button
	                                  type="button"
	                                  variant="ghost"
	                                  size="sm"
	                                  asChild
	                                >
	                                  <Link href={`/transport-partner/partners/${partner.id}`}>
	                                    Profile
	                                  </Link>
	                                </Button>
	                              </div>
	                            </TableCell>
	                          </TableRow>
	                        );
	                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </CardContent>
        </Card>
      )}

      {!isAdminView && !profileLoading && activeTab === "dashboard" && (
        <div className="space-y-6">
          <section className="rounded-lg border bg-card p-5 shadow-sm sm:p-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{partnerName}</Badge>
                  <Badge variant={partnerOperations.openRequests.length > 0 ? "default" : "secondary"}>
                    {partnerOperations.openRequests.length} open
                  </Badge>
                  <Badge variant={partnerOperations.issueRequests > 0 ? "destructive" : "outline"}>
                    {partnerOperations.issueRequests} exceptions
                  </Badge>
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight">Today&apos;s transport desk</h2>
                <p className="mt-2 max-w-2xl break-words text-sm text-muted-foreground">
                  Quote new requests, prepare confirmed pickups, and keep fleet readiness visible for Visit Dzaleka.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {dashboardActions.slice(0, 3).map((action) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={action.label}
                        type="button"
                        variant={action.section === "requests" ? "default" : "outline"}
                        onClick={() => navigateToSection(action.section)}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-md border bg-muted/20 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next best action</p>
                <p className="mt-2 break-words text-base font-semibold">
                  {partnerOperations.needsQuote > 0
                    ? `${partnerOperations.needsQuote} quote${partnerOperations.needsQuote === 1 ? "" : "s"} need pricing`
                    : partnerOperations.missingFleetDetails > 0
                      ? `${partnerOperations.missingFleetDetails} pickup${partnerOperations.missingFleetDetails === 1 ? "" : "s"} need fleet details`
                      : partnerOperations.awaitingVisitor > 0
                        ? `${partnerOperations.awaitingVisitor} quote${partnerOperations.awaitingVisitor === 1 ? "" : "s"} awaiting visitor approval`
                        : "No urgent transport action right now"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {partnerOperations.nextPickup
                    ? `Next pickup: ${partnerOperations.nextPickup.visitorName}, ${formatRequestSchedule(partnerOperations.nextPickup)}.`
                    : "Confirmed pickups will appear here when visitors approve transport."}
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Transport dashboard metrics">
            {dashboardMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <button
                  key={metric.label}
                  type="button"
                  className="group rounded-lg border bg-card p-4 text-left shadow-sm transition-[border-color,background-color] hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => navigateToSection(metric.section)}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-muted-foreground">{metric.label}</span>
                      <span className="mt-2 block break-words text-2xl font-semibold tabular-nums">{metric.value}</span>
                    </span>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </span>
                  <span className="mt-3 block break-words text-sm text-muted-foreground">{metric.detail}</span>
                  <span className="mt-4 block text-xs font-semibold text-primary">{metric.action}</span>
                </button>
              );
            })}
          </section>

          <section className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold">Quick actions</h2>
                <p className="mt-1 text-sm text-muted-foreground">Jump straight into the work partners handle most often.</p>
              </div>
              <Badge variant="outline">{partnerOperations.activeDrivers + partnerOperations.activeVehicles} fleet records</Badge>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {dashboardActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    type="button"
                    variant="outline"
                    className="h-auto min-h-11 justify-start whitespace-normal text-left leading-snug"
                    onClick={() => navigateToSection(action.section)}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="min-w-0 break-words">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>Request pipeline</CardTitle>
                    <CardDescription>Where current transport work sits from first request to completed trip.</CardDescription>
                  </div>
                  <Badge variant="outline">{transportRequests.length} total requests</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 lg:grid-cols-5">
                  {partnerOperations.pipelineStages.map((stage) => {
                    const maxValue = Math.max(...partnerOperations.pipelineStages.map((item) => item.value), 1);
                    const width = stage.value > 0 ? `${Math.max(12, (stage.value / maxValue) * 100)}%` : "0%";

                    return (
                      <button
                        key={stage.label}
                        type="button"
                        className="rounded-md border bg-background p-3 text-left transition-[border-color,background-color] hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => navigateToSection("requests")}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block break-words text-sm font-medium">{stage.label}</span>
                            <span className="mt-1 block break-words text-xs text-muted-foreground">{stage.detail}</span>
                          </span>
                          <span className="shrink-0 text-lg font-semibold tabular-nums">{stage.value}</span>
                        </span>
                        <span className="mt-3 block h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                          <span className="block h-full rounded-full bg-primary" style={{ width }} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" aria-hidden="true" />
                  <CardTitle>Attention queue</CardTitle>
                </div>
                <CardDescription>Items that can slow down visitor confirmation or pickup readiness.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y rounded-md border">
                  {attentionItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-[background-color] hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => navigateToSection(item.section)}
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-3">
                            <span className="break-words text-sm font-medium">{item.label}</span>
                            <span className="shrink-0 font-semibold tabular-nums">{item.value}</span>
                          </span>
                          <span className="mt-1 block break-words text-xs text-muted-foreground">{item.detail}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>Popular routes</CardTitle>
                    <CardDescription>Route demand based on assigned transport requests.</CardDescription>
                  </div>
                  <Badge variant="outline">{partnerOperations.routeVolume.length} routes</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {partnerOperations.routeVolume.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Route activity will appear after transport requests are assigned.</p>
                  ) : (
                    partnerOperations.routeVolume.map((route) => {
                      const maxValue = Math.max(...partnerOperations.routeVolume.map((item) => item.value), 1);
                      const width = `${Math.max(10, (route.value / maxValue) * 100)}%`;

                      return (
                        <div key={route.label} className="space-y-1">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="min-w-0 break-words">{route.label}</span>
                            <span className="shrink-0 font-medium tabular-nums">{route.value}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                            <div className="h-full rounded-full bg-primary/80" style={{ width }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>Visit-date volume</CardTitle>
                    <CardDescription>Upcoming workload by visitor date.</CardDescription>
                  </div>
                  <Badge variant="outline">{partnerOperations.visitVolume.length} dates</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {partnerOperations.visitVolume.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Upcoming visit volume will appear when requests include visit dates.</p>
                  ) : (
                    partnerOperations.visitVolume.map((day) => {
                      const maxValue = Math.max(...partnerOperations.visitVolume.map((item) => item.value), 1);
                      const width = `${Math.max(10, (day.value / maxValue) * 100)}%`;

                      return (
                        <div key={day.label} className="space-y-1">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="min-w-0 break-words">{day.label}</span>
                            <span className="shrink-0 font-medium tabular-nums">{day.value}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>Next pickup</CardTitle>
                    <CardDescription>The next visitor-approved or confirmed transport job.</CardDescription>
                  </div>
                  {partnerOperations.activeBlackouts > 0 && (
                    <Badge variant="outline">
                      {partnerOperations.activeBlackouts} blackout{partnerOperations.activeBlackouts === 1 ? "" : "s"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border bg-background p-4">
                  {partnerOperations.nextPickup ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-base font-semibold">{partnerOperations.nextPickup.visitorName}</p>
                        <StatusBadge status={partnerOperations.nextPickup.status} />
                      </div>
                      <div className="grid gap-3 text-sm sm:grid-cols-2">
                        <InfoBlock label="Schedule" value={formatRequestSchedule(partnerOperations.nextPickup)} />
                        <InfoBlock label="Route" value={getTransportRoute(partnerOperations.nextPickup.route).shortLabel} />
                        <InfoBlock label="Pickup" value={partnerOperations.nextPickup.pickupLocation} />
                        <InfoBlock
                          label="Quote"
                          value={partnerOperations.nextPickup.quotedAmount != null
                            ? formatCurrency(partnerOperations.nextPickup.quotedAmount, partnerOperations.nextPickup.currency || "MWK")
                            : "Not quoted"}
                        />
                      </div>
                      <Button type="button" variant="outline" onClick={() => navigateToSection("requests")}>
                        <ClipboardList className="h-4 w-4" aria-hidden="true" />
                        Review pickup details
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">No confirmed pickup is queued.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          New approved or confirmed transport requests will appear here.
                        </p>
                      </div>
                      <Button type="button" variant="outline" onClick={() => navigateToSection("requests")}>
                        View requests
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                  <CardTitle>Readiness checklist</CardTitle>
                </div>
                <CardDescription>Profile, roster, vehicle, and pricing details that keep bookings clear.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y rounded-md border bg-background">
                  {partnerOperations.readiness.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-[background-color] hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => navigateToSection(item.tab)}
                      >
                        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.complete ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>
                          {item.complete ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block break-words text-sm font-medium">{item.label}</span>
                          <span className="mt-1 block break-words text-xs text-muted-foreground">{item.detail}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>Priority requests</CardTitle>
                  <CardDescription>Requests sorted by urgency: exceptions, new quotes, approvals, and confirmed pickups.</CardDescription>
                </div>
                <Badge variant="outline">{partnerOperations.openRequests.length} open</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Loading priority requests…
                </div>
              ) : partnerOperations.priorityRequests.length === 0 ? (
                <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
                  No transport requests need attention right now.
                </div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-3">
                  {partnerOperations.priorityRequests.map((request) => (
                    <button
                      key={request.id}
                      type="button"
                      className="min-w-0 rounded-md border bg-background p-4 text-left transition-[border-color,background-color] hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => navigateToSection("requests")}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="break-words font-medium">{request.visitorName}</span>
                        <StatusBadge status={request.status} />
                      </span>
                      <span className="mt-3 block text-xs font-semibold uppercase tracking-wide text-primary">
                        {getPartnerRequestAction(request)}
                      </span>
                      <span className="mt-2 block break-words text-sm text-muted-foreground">
                        {formatRequestSchedule(request)}
                      </span>
                      <span className="mt-1 block break-words text-sm text-muted-foreground">
                        {getTransportRoute(request.route).shortLabel}
                        {request.pickupLocation ? ` · ${request.pickupLocation}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {(isAdminView || activeTab !== "dashboard") && (
        <Tabs
          value={activeTab}
          onValueChange={(value) => navigateToSection(value)}
          className={isAdminView ? "mt-6" : ""}
        >
          {isAdminView && (
            <TabsList className="flex h-auto w-full max-w-full flex-wrap justify-start gap-1">
              <TabsTrigger className="h-auto whitespace-normal text-center leading-tight" value="requests">
                Request Queue
              </TabsTrigger>
              <TabsTrigger className="h-auto whitespace-normal text-center leading-tight" value="referrals">
                Referral Intake
              </TabsTrigger>
              <TabsTrigger className="h-auto whitespace-normal text-center leading-tight" value="roster">
                Fleet Records
              </TabsTrigger>
              <TabsTrigger className="h-auto whitespace-normal text-center leading-tight" value="availability">
                Blackout Controls
              </TabsTrigger>
              <TabsTrigger className="h-auto whitespace-normal text-center leading-tight" value="pricing">
                Partner Prices
              </TabsTrigger>
              <TabsTrigger className="h-auto whitespace-normal text-center leading-tight" value="partners">
                Partner Records
              </TabsTrigger>
              <TabsTrigger className="h-auto whitespace-normal text-center leading-tight" value="help">
                Help Center
              </TabsTrigger>
            </TabsList>
          )}

        <TabsContent value="requests" className="mt-4">
          <Card className="bg-gradient-to-br from-card/85 via-card to-card/95 backdrop-blur-md border-muted/30 shadow-xl shadow-black/5">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/75 bg-clip-text text-transparent">{isAdminView ? "Transport Request Queue" : "Visitor Transport Requests"}</CardTitle>
              <CardDescription className="text-muted-foreground/80">
                {isAdminView
                  ? "Assign partners, review quotes, manage internal notes, and track visitor quote decisions before final confirmation."
                  : "Manage assigned visitor requests, quotes, pickup time, driver details, vehicle details, and partner notes."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-6 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span>Loading requests…</span>
                </div>
              ) : transportRequests.length === 0 ? (
                <EmptyState
                  icon={Car}
                  title="No transport requests yet"
                  description="New transport requests will appear here after visitors ask for pickup or day-trip support."
                />
              ) : (
                <div className="space-y-4">
                  <div className="hidden md:block overflow-x-auto rounded-lg border border-muted/30 bg-background/50">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="font-semibold">Visitor & Route</TableHead>
                          {isAdminView && <TableHead className="font-semibold">Partner</TableHead>}
                          <TableHead className="font-semibold">Schedule</TableHead>
                          <TableHead className="font-semibold">Driver & Vehicle</TableHead>
                          <TableHead className="font-semibold">Price</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transportRequests.map((request) => {
                          const route = getTransportRoute(request.route);
                          const driverName = request.driverName || (request.driverId && drivers.find(d => d.id === request.driverId)?.name) || null;
                          const vehicleLabel = request.vehicleDetails || (request.vehicleId && vehicles.find(v => v.id === request.vehicleId)?.label) || null;
                          const priceDisplay = request.quotedAmount != null ? formatCurrency(request.quotedAmount, request.currency || "MWK") : "Quote pending";
                          const requestPartnerName = partnerNameFor(request.partnerId);
                          const requestPartnerContact = partnerContactFor(request.partnerId);

                          return (
                            <TableRow key={request.id} className="hover:bg-muted/10 transition-colors border-b border-muted/20">
                              <TableCell className="font-medium py-3.5">
                                <div>
                                  <p className="font-semibold text-foreground">{request.visitorName}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{route.shortLabel}</p>
                                </div>
                              </TableCell>
                              {isAdminView && (
                                <TableCell className="py-3.5">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{requestPartnerName}</p>
                                    <p className="truncate text-xs text-muted-foreground">{requestPartnerContact}</p>
                                  </div>
                                </TableCell>
                              )}
                              <TableCell className="py-3.5">
                                <div>
                                  <p className="text-sm font-medium">{request.visitDate ? formatDate(request.visitDate) : "Date pending"}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{request.visitTime ? formatTime(request.visitTime) : ""}</p>
                                </div>
                              </TableCell>
                              <TableCell className="py-3.5">
                                <div>
                                  {driverName || vehicleLabel ? (
                                    <div className="space-y-0.5">
                                      {driverName && <p className="text-xs font-semibold text-foreground">{driverName}</p>}
                                      {vehicleLabel && <p className="text-[11px] text-muted-foreground">{vehicleLabel}</p>}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground/60 italic">None assigned</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-3.5 tabular-nums font-semibold text-sm">
                                {priceDisplay}
                              </TableCell>
                              <TableCell className="py-3.5">
                                <div className="flex flex-col gap-1 items-start">
                                  <StatusBadge status={request.status} />
                                  {request.quoteDecision && (
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal border-muted/50">
                                      Visitor: {humanizeStatus(request.quoteDecision)}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-3.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 hover:bg-primary hover:text-primary-foreground border-muted/50 transition-all duration-200"
                                  onClick={() => setActiveRequestId(request.id)}
                                >
                                  Manage
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {transportRequests.map((request) => {
                      const route = getTransportRoute(request.route);
                      const priceDisplay = request.quotedAmount != null ? formatCurrency(request.quotedAmount, request.currency || "MWK") : "Quote pending";
                      const requestPartnerName = partnerNameFor(request.partnerId);
                      return (
                        <div key={request.id} className="rounded-lg border border-muted/30 p-4 space-y-3 bg-background/40 backdrop-blur-sm shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-sm text-foreground">{request.visitorName}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">{route.shortLabel}</p>
                              {isAdminView && (
                                <p className="mt-1 text-xs text-muted-foreground">Partner: {requestPartnerName}</p>
                              )}
                            </div>
                            <StatusBadge status={request.status} />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-muted/20">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Schedule</span>
                              <span className="font-medium text-foreground">
                                {request.visitDate ? formatDate(request.visitDate) : "Date pending"} {request.visitTime ? `at ${formatTime(request.visitTime)}` : ""}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Price</span>
                              <span className="font-semibold text-foreground">{priceDisplay}</span>
                            </div>
                          </div>
                          <div className="flex justify-end pt-2 border-t border-muted/10">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs h-9 hover:bg-primary hover:text-primary-foreground border-muted/50 transition-all duration-200"
                              onClick={() => setActiveRequestId(request.id)}
                            >
                              Manage Request
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>{isAdminView ? "Create Partner Referral" : "Refer a Visitor"}</CardTitle>
                <CardDescription>
                  {isAdminView
                    ? "Create a tour referral on behalf of a transport partner and email the visitor account access."
                    : "Submit guests who want a guided Visit Dzaleka tour. They will receive account access by email."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    createReferralMutation.mutate({
                      ...referralForm,
                      partnerId: selectedPartnerId,
                    });
                  }}
                >
                  {isAdminView && (
                    <div className="space-y-2">
                      <Label htmlFor="referral-partner">Transport partner</Label>
                      <Select
                        value={selectedPartnerId || SELECT_PARTNER_PLACEHOLDER}
                        onValueChange={(partnerId) =>
                          setReferralForm({
                            ...referralForm,
                            partnerId: partnerId === SELECT_PARTNER_PLACEHOLDER ? "" : partnerId,
                          })
                        }
                        disabled={partners.length === 0}
                      >
                        <SelectTrigger id="referral-partner">
                          <SelectValue placeholder="Select partner…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={SELECT_PARTNER_PLACEHOLDER} disabled>
                            Select a transport partner
                          </SelectItem>
                          {partners.map((partner) => (
                            <SelectItem key={partner.id} value={partner.id}>
                              {partner.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="referral-name">Visitor name</Label>
                      <Input
                        id="referral-name"
                        name="visitorName"
                        placeholder="Full name…"
                        value={referralForm.visitorName}
                        onChange={(event) => setReferralForm({ ...referralForm, visitorName: event.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referral-phone">Phone</Label>
                      <Input
                        id="referral-phone"
                        name="visitorPhone"
                        inputMode="tel"
                        placeholder="+265…"
                        value={referralForm.visitorPhone}
                        onChange={(event) => setReferralForm({ ...referralForm, visitorPhone: event.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referral-email">Email</Label>
                    <Input
                      id="referral-email"
                      name="visitorEmail"
                      type="email"
                      placeholder="visitor@example.com…"
                      value={referralForm.visitorEmail}
                      onChange={(event) => setReferralForm({ ...referralForm, visitorEmail: event.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="referral-date">Visit date</Label>
                      <Input
                        id="referral-date"
                        name="visitDate"
                        type="date"
                        value={referralForm.visitDate}
                        onChange={(event) => setReferralForm({ ...referralForm, visitDate: event.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referral-time">Visit time</Label>
                      <Input
                        id="referral-time"
                        name="visitTime"
                        type="time"
                        value={referralForm.visitTime}
                        onChange={(event) => setReferralForm({ ...referralForm, visitTime: event.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="referral-group-size">Group size</Label>
                      <Select
                        value={referralForm.groupSize}
                        onValueChange={(groupSize) => setReferralForm({ ...referralForm, groupSize })}
                      >
                        <SelectTrigger id="referral-group-size">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GROUP_SIZES.map((size) => (
                            <SelectItem key={size.id} value={size.id}>
                              {size.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referral-people">People</Label>
                      <Input
                        id="referral-people"
                        name="numberOfPeople"
                        type="number"
                        min="1"
                        value={referralForm.numberOfPeople}
                        onChange={(event) => {
                          const numberOfPeople = Number(event.target.value) || 1;
                          setReferralForm({
                            ...referralForm,
                            numberOfPeople,
                            groupSize: getGroupSizeFromPeople(numberOfPeople),
                          });
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referral-tour-type">Tour type</Label>
                    <Select
                      value={referralForm.tourType}
                      onValueChange={(tourType) => setReferralForm({ ...referralForm, tourType })}
                    >
                      <SelectTrigger id="referral-tour-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TOUR_TYPES.map((tourType) => (
                          <SelectItem key={tourType.id} value={tourType.id}>
                            {tourType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div
                    className="rounded-lg border border-primary/20 bg-primary/5 p-4"
                    aria-live="polite"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Estimated Visit Dzaleka guide fee</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {getGroupSizeLabel(referralForm.groupSize)} · {getTourTypeLabel(referralForm.tourType)}
                        </p>
                      </div>
                      <p className="shrink-0 text-right text-lg font-bold tabular-nums">
                        {isCustomTour ? `From ${estimatedFeeLabel}` : estimatedFeeLabel}
                      </p>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      This is the tour guiding price charged by Visit Dzaleka. Transport is quoted separately by the transport partner.
                      {isCustomTour ? " Custom requests may need a confirmed quote from the Visit Dzaleka team." : ""}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referral-notes">Notes</Label>
                    <Textarea
                      id="referral-notes"
                      name="notes"
                      placeholder="Guest interests, transport plan, timing notes…"
                      value={referralForm.notes}
                      onChange={(event) => setReferralForm({ ...referralForm, notes: event.target.value })}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createReferralMutation.isPending || (isAdminView && !selectedPartnerId)}
                  >
                    {createReferralMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Submit and email visitor
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Visit Dzaleka Pricing</CardTitle>
                  <CardDescription>
                    Current guiding charges shown before you refer a guest.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pricingGuide.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-md border p-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Standard tour · extended adds {formatCurrency(item.additionalHourPrice * 2, item.currency)}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold tabular-nums">{formatCurrency(item.basePrice, item.currency)}</p>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Prices are for Visit Dzaleka guiding only. Transport charges stay separate from the tour fee.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Submitted Referrals</CardTitle>
                  <CardDescription>Tour requests your account has sent to Visit Dzaleka.</CardDescription>
                </CardHeader>
                <CardContent>
                  {referralsLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading referrals…
                    </div>
                  ) : referrals.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="No tour referrals yet"
                      description="Referral bookings you submit will appear here."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Visitor</TableHead>
                            {isAdminView && <TableHead>Partner</TableHead>}
                            <TableHead>Visit</TableHead>
                            <TableHead>Group</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {referrals.map((referral) => (
                            <TableRow key={referral.id}>
                              <TableCell>
                                <p className="font-medium">{referral.visitorName}</p>
                                <p className="text-xs text-muted-foreground">{referral.visitorEmail}</p>
                              </TableCell>
                              {isAdminView && (
                                <TableCell>
                                  <p className="font-medium">{partnerNameFor(referral.partnerId)}</p>
                                  <p className="text-xs text-muted-foreground">{partnerContactFor(referral.partnerId)}</p>
                                </TableCell>
                              )}
                              <TableCell>
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                                  {formatDate(referral.visitDate)}
                                </span>
                                <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                  {formatTime(referral.visitTime)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div>{getGroupSizeLabel(referral.groupSize)}</div>
                                <div className="text-xs text-muted-foreground tabular-nums">
                                  {referral.numberOfPeople || 1} people
                                </div>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={referral.status} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="roster" className="mt-4">
          <div className="space-y-6">
            {isAdminView && (
              <PartnerScopePanel
                title="Partner Fleet Workspace"
                description="Choose the transport company whose drivers and vehicles you are reviewing or editing."
                partners={partners}
                selectedPartnerId={rosterPartnerId}
                onPartnerChange={changeOperationsPartner}
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryPill label="Saved drivers" value={scopedDrivers.length} />
                  <SummaryPill label="Active drivers" value={scopedDrivers.filter((driver) => driver.status !== "inactive").length} />
                  <SummaryPill label="Saved vehicles" value={scopedVehicles.length} />
                  <SummaryPill label="Active vehicles" value={scopedVehicles.filter((vehicle) => vehicle.status !== "inactive").length} />
                </div>
              </PartnerScopePanel>
            )}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{isAdminView ? "Driver Records" : "Saved Drivers"}</CardTitle>
                <CardDescription>
                  {isAdminView
                    ? "Review or add saved drivers for the selected transport partner."
                    : "Reuse driver details when accepting transport requests."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (editingDriverId) {
                      updateDriverMutation.mutate({ id: editingDriverId, form: driverForm });
                    } else {
                      createDriverMutation.mutate(driverForm);
                    }
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input placeholder="Driver name…" value={driverForm.name} onChange={(event) => setDriverForm({ ...driverForm, name: event.target.value })} required />
                    <Input placeholder="+265…" inputMode="tel" value={driverForm.phone} onChange={(event) => setDriverForm({ ...driverForm, phone: event.target.value })} />
                    <Input placeholder="driver@example.com…" type="email" value={driverForm.email} onChange={(event) => setDriverForm({ ...driverForm, email: event.target.value })} />
                    <Input placeholder="License number…" value={driverForm.licenseNumber} onChange={(event) => setDriverForm({ ...driverForm, licenseNumber: event.target.value })} />
                    <Select value={driverForm.status} onValueChange={(status: DriverForm["status"]) => setDriverForm({ ...driverForm, status })}>
                      <SelectTrigger aria-label="Driver status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea placeholder="Driver notes…" value={driverForm.notes} onChange={(event) => setDriverForm({ ...driverForm, notes: event.target.value })} />
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={createDriverMutation.isPending || updateDriverMutation.isPending || !rosterPartnerId}>
                      {createDriverMutation.isPending || updateDriverMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingDriverId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {editingDriverId ? "Update driver" : "Save driver"}
                    </Button>
                    {editingDriverId && (
                      <Button type="button" variant="outline" onClick={cancelDriverEdit}>
                        Cancel edit
                      </Button>
                    )}
                  </div>
                </form>
                <div className="space-y-2">
                  {scopedDrivers.map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{driver.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {isAdminView ? `${partnerNameFor(driver.partnerId)} · ` : ""}{driver.phone || driver.email || "No contact saved"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${driver.name}`} onClick={() => editDriver(driver)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${driver.name}`} onClick={() => deleteDriverMutation.mutate(driver.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isAdminView ? "Vehicle Records" : "Saved Vehicles"}</CardTitle>
                <CardDescription>
                  {isAdminView
                    ? "Review or add vehicles for the selected transport partner."
                    : "Keep vehicle, plate, and capacity details ready for requests."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (editingVehicleId) {
                      updateVehicleMutation.mutate({ id: editingVehicleId, form: vehicleForm });
                    } else {
                      createVehicleMutation.mutate(vehicleForm);
                    }
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input placeholder="Vehicle label…" value={vehicleForm.label} onChange={(event) => setVehicleForm({ ...vehicleForm, label: event.target.value })} required />
                    <Input placeholder="Vehicle type…" value={vehicleForm.vehicleType} onChange={(event) => setVehicleForm({ ...vehicleForm, vehicleType: event.target.value })} />
                    <Input placeholder="Plate number…" value={vehicleForm.plateNumber} onChange={(event) => setVehicleForm({ ...vehicleForm, plateNumber: event.target.value })} />
                    <Input placeholder="Capacity…" type="number" min="1" inputMode="numeric" value={vehicleForm.capacity} onChange={(event) => setVehicleForm({ ...vehicleForm, capacity: event.target.value })} />
                    <Input placeholder="Color…" value={vehicleForm.color} onChange={(event) => setVehicleForm({ ...vehicleForm, color: event.target.value })} />
                    <Select value={vehicleForm.status} onValueChange={(status: VehicleForm["status"]) => setVehicleForm({ ...vehicleForm, status })}>
                      <SelectTrigger aria-label="Vehicle status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea placeholder="Vehicle notes…" value={vehicleForm.notes} onChange={(event) => setVehicleForm({ ...vehicleForm, notes: event.target.value })} />
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={createVehicleMutation.isPending || updateVehicleMutation.isPending || !rosterPartnerId}>
                      {createVehicleMutation.isPending || updateVehicleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingVehicleId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {editingVehicleId ? "Update vehicle" : "Save vehicle"}
                    </Button>
                    {editingVehicleId && (
                      <Button type="button" variant="outline" onClick={cancelVehicleEdit}>
                        Cancel edit
                      </Button>
                    )}
                  </div>
                </form>
                <div className="space-y-2">
                  {scopedVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{vehicle.label}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {isAdminView ? `${partnerNameFor(vehicle.partnerId)} · ` : ""}
                          {[vehicle.vehicleType, vehicle.plateNumber, vehicle.capacity ? `${vehicle.capacity} seats` : null].filter(Boolean).join(" · ") || "No vehicle details"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${vehicle.label}`} onClick={() => editVehicle(vehicle)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${vehicle.label}`} onClick={() => deleteVehicleMutation.mutate(vehicle.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <div className="space-y-6">
            {isAdminView && (
              <PartnerScopePanel
                title="Partner Availability Workspace"
                description="Select the transport company whose blackout dates and availability risks you are managing."
                partners={partners}
                selectedPartnerId={rosterPartnerId}
                onPartnerChange={changeOperationsPartner}
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryPill label="Blackout records" value={scopedBlackouts.length} />
                  <SummaryPill label="Active blackouts" value={scopedBlackouts.filter((blackout) => blackout.status !== "cancelled").length} />
                  <SummaryPill label="Open requests" value={scopedTransportRequests.filter(isOpenTransportRequest).length} />
                  <SummaryPill label="Confirmed pickups" value={scopedTransportRequests.filter((request) => request.status === "confirmed").length} />
                </div>
              </PartnerScopePanel>
            )}
          <Card>
            <CardHeader>
              <CardTitle>{isAdminView ? "Partner Blackout Controls" : "Partner Availability"}</CardTitle>
              <CardDescription>
                {isAdminView
                  ? "Review and record blackout dates before assigning new transport requests."
                  : "Block dates when you cannot accept transport requests."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_2fr_auto]"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (editingBlackoutId) {
                    updateBlackoutMutation.mutate({ id: editingBlackoutId, form: blackoutForm });
                  } else {
                    createBlackoutMutation.mutate(blackoutForm);
                  }
                }}
              >
                <Input type="date" value={blackoutForm.startDate} onChange={(event) => setBlackoutForm({ ...blackoutForm, startDate: event.target.value })} required />
                <Input type="date" value={blackoutForm.endDate} onChange={(event) => setBlackoutForm({ ...blackoutForm, endDate: event.target.value })} required />
                <Select value={blackoutForm.status} onValueChange={(status: BlackoutForm["status"]) => setBlackoutForm({ ...blackoutForm, status })}>
                  <SelectTrigger aria-label="Availability block status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Reason…" value={blackoutForm.reason} onChange={(event) => setBlackoutForm({ ...blackoutForm, reason: event.target.value })} />
                <Button type="submit" disabled={createBlackoutMutation.isPending || updateBlackoutMutation.isPending || !rosterPartnerId}>
                  {createBlackoutMutation.isPending || updateBlackoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingBlackoutId ? <Save className="h-4 w-4" /> : <CalendarOff className="h-4 w-4" />}
                  {editingBlackoutId ? "Update block" : "Block dates"}
                </Button>
              </form>
              {editingBlackoutId && (
                <Button type="button" variant="outline" size="sm" onClick={cancelBlackoutEdit}>
                  Cancel availability edit
                </Button>
              )}
              {scopedBlackouts.length === 0 ? (
                <EmptyState icon={CalendarOff} title="No blackout dates" description="Blocked dates will appear here." />
              ) : (
                <div className="space-y-2">
                  {scopedBlackouts.map((blackout) => (
                    <div key={blackout.id} className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{formatDate(blackout.startDate)} to {formatDate(blackout.endDate)}</p>
                        <p className="text-xs text-muted-foreground">
                          {isAdminView ? `${partnerNameFor(blackout.partnerId)} · ` : ""}{blackout.reason || "No reason added"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => editBlackout(blackout)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => deleteBlackoutMutation.mutate(blackout.id)}>
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="mt-4">
          <div className="space-y-6">
            {isAdminView && (
              <PartnerScopePanel
                title="Partner Pricing Workspace"
                description="Select one transport company before adding or editing route prices. Price rows also show the owning partner."
                partners={partners}
                selectedPartnerId={rosterPartnerId}
                onPartnerChange={changeOperationsPartner}
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryPill label="Route prices" value={scopedPartnerPricing.length} />
                  <SummaryPill label="Active prices" value={scopedPartnerPricing.filter((price) => price.status !== "inactive").length} />
                  <SummaryPill label="Quoted requests" value={scopedTransportRequests.filter((request) => request.quotedAmount != null).length} />
                  <SummaryPill
                    label="Default currency"
                    value={selectedOperationsPartner?.defaultCurrency || "MWK"}
                  />
                </div>
              </PartnerScopePanel>
            )}
          <Card>
            <CardHeader>
              <CardTitle>{isAdminView ? "Partner Transport Prices" : "Partner Transport Pricing"}</CardTitle>
              <CardDescription>
                {isAdminView
                  ? "Review partner-maintained route prices and compare them with request-specific visitor quotes."
                  : "Set your own route prices. These prices are references for quotes sent to visitors."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="grid gap-3 lg:grid-cols-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (editingPricingId) {
                    updatePricingMutation.mutate({ id: editingPricingId, form: pricingForm });
                  } else {
                    createPricingMutation.mutate(pricingForm);
                  }
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="pricing-route">Route</Label>
                  <Select
                    value={pricingForm.route}
                    onValueChange={(route) => {
                      const routeInfo = getTransportRoute(route);
                      setPricingForm({ ...pricingForm, route, label: pricingForm.label || routeInfo.shortLabel });
                    }}
                  >
                    <SelectTrigger id="pricing-route">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSPORT_ROUTES.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.shortLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricing-label">Label</Label>
                  <Input
                    id="pricing-label"
                    value={pricingForm.label}
                    onChange={(event) => setPricingForm({ ...pricingForm, label: event.target.value })}
                    placeholder="Round trip…"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricing-amount">Price</Label>
                  <Input
                    id="pricing-amount"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={pricingForm.basePrice}
                    onChange={(event) => setPricingForm({ ...pricingForm, basePrice: event.target.value })}
                    placeholder="MWK amount…"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricing-currency">Currency</Label>
                  <Input
                    id="pricing-currency"
                    value={pricingForm.currency}
                    onChange={(event) => setPricingForm({ ...pricingForm, currency: event.target.value.toUpperCase() })}
                    placeholder="MWK…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricing-type">Pricing type</Label>
                  <Select
                    value={pricingForm.pricingType}
                    onValueChange={(pricingType: PricingForm["pricingType"]) => setPricingForm({ ...pricingForm, pricingType })}
                  >
                    <SelectTrigger id="pricing-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_trip">Per trip</SelectItem>
                      <SelectItem value="per_person">Per person</SelectItem>
                      <SelectItem value="per_day">Per day</SelectItem>
                      <SelectItem value="custom">Custom quote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricing-status">Status</Label>
                  <Select
                    value={pricingForm.status}
                    onValueChange={(status: PricingForm["status"]) => setPricingForm({ ...pricingForm, status })}
                  >
                    <SelectTrigger id="pricing-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 lg:col-span-3">
                  <Label htmlFor="pricing-includes">Includes</Label>
                  <Input
                    id="pricing-includes"
                    value={pricingForm.priceIncludes}
                    onChange={(event) => setPricingForm({ ...pricingForm, priceIncludes: event.target.value })}
                    placeholder="Fuel, waiting time, airport parking…"
                  />
                </div>
                <div className="space-y-2 lg:col-span-4">
                  <Label htmlFor="pricing-notes">Notes</Label>
                  <Textarea
                    id="pricing-notes"
                    value={pricingForm.notes}
                    onChange={(event) => setPricingForm({ ...pricingForm, notes: event.target.value })}
                    placeholder="When this price applies, exclusions, seasonal notes…"
                  />
                </div>
                <div className="flex flex-wrap gap-2 lg:col-span-4">
                  <Button type="submit" disabled={createPricingMutation.isPending || updatePricingMutation.isPending || !rosterPartnerId}>
                    {createPricingMutation.isPending || updatePricingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingPricingId ? <Save className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                    {editingPricingId ? "Update transport price" : "Save transport price"}
                  </Button>
                  {editingPricingId && (
                    <Button type="button" variant="outline" onClick={cancelPricingEdit}>
                      Cancel edit
                    </Button>
                  )}
                </div>
              </form>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isAdminView && <TableHead>Partner</TableHead>}
                      <TableHead>Route</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scopedPartnerPricing.map((price) => {
                      const routeInfo = getTransportRoute(price.route);
                      const displayLabel = price.label === "Lilongwe round trip" && routeInfo.id !== DEFAULT_TRANSPORT_ROUTE_ID
                        ? routeInfo.shortLabel
                        : price.label;

                      return (
                        <TableRow key={price.id}>
                          {isAdminView && (
                            <TableCell>
                              <p className="font-medium">{partnerNameFor(price.partnerId)}</p>
                              <p className="text-xs text-muted-foreground">{partnerContactFor(price.partnerId)}</p>
                            </TableCell>
                          )}
                          <TableCell>{routeInfo.shortLabel}</TableCell>
                          <TableCell>{displayLabel}</TableCell>
                          <TableCell className="tabular-nums">{formatCurrency(price.basePrice, price.currency || "MWK")}</TableCell>
                          <TableCell>{humanizeStatus(price.pricingType)}</TableCell>
                          <TableCell><StatusBadge status={price.status || "active"} /></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${displayLabel}`} onClick={() => editPricing(price)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${displayLabel}`} onClick={() => deletePricingMutation.mutate(price.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        <TabsContent value="help" className="mt-4">
          <HelpCenterPanel isAdmin={isAdminView} />
        </TabsContent>

        {isAdminView ? (
          <TabsContent value="partners" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>Partner Directory</CardTitle>
                  <CardDescription>Select an existing partner or create a new one.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    type="button"
                    variant={adminPartnerId === "new" ? "default" : "outline"}
                    className="h-auto min-h-9 w-full justify-start whitespace-normal text-left leading-snug"
                    onClick={() => setAdminPartnerId("new")}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span className="min-w-0 break-words">New transport partner</span>
                  </Button>
                  {partners.length === 0 ? (
                    <EmptyState
                      icon={Car}
                      title="No partners yet"
                      description="Create a partner profile before assigning transport requests."
                    />
                  ) : (
                    <div className="space-y-2">
                      {partners.map((partner) => (
                        <button
                          key={partner.id}
                          type="button"
                          className={`w-full rounded-lg border p-3 text-left transition-[background-color,border-color] hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${adminPartnerId === partner.id ? "border-primary bg-primary/5" : ""}`}
                          onClick={() => setAdminPartnerId(partner.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="min-w-0 truncate text-sm font-medium">{partner.companyName}</span>
                            <StatusBadge status={partner.status || "active"} />
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">{partner.email}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{adminPartnerId === "new" ? "Create Partner" : "Edit Partner"}</CardTitle>
                    <CardDescription>
                      Manage assignment readiness, contact details, service areas, and internal agreement notes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      className="space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        savePartnerMutation.mutate({ id: adminPartnerId, form: adminPartnerForm });
                      }}
                    >
                      <PartnerProfileFields form={adminPartnerForm} onChange={setAdminPartnerForm} isAdmin />
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" disabled={savePartnerMutation.isPending}>
                          {savePartnerMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save partner
                        </Button>
                        {adminPartnerId !== "new" && (
                          <Button type="button" variant="outline" asChild>
                            <Link href={`/transport-partner/partners/${adminPartnerId}`}>
                              <ExternalLink className="h-4 w-4" />
                              Open full profile
                            </Link>
                          </Button>
                        )}
                        {adminPartnerId !== "new" && (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={sendPartnerInviteMutation.isPending || Boolean(selectedAdminPartner?.userId)}
                            onClick={() => sendPartnerInviteMutation.mutate(adminPartnerId)}
                          >
                            {sendPartnerInviteMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                            {selectedAdminPartner?.userId ? "Portal linked" : "Send portal invite"}
                          </Button>
                        )}
                        {adminPartnerId !== "new" && selectedAdminPartner?.userId && (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={unlinkPartnerMutation.isPending}
                            onClick={() => unlinkPartnerMutation.mutate(adminPartnerId)}
                          >
                            {unlinkPartnerMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserPlus className="h-4 w-4" />
                            )}
                            Unlink account
                          </Button>
                        )}
                        {canDeletePartners && adminPartnerId !== "new" && (
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={deletePartnerMutation.isPending}
                            onClick={() => {
                              const partnerLabel = selectedAdminPartner?.companyName || "this partner";
                              if (window.confirm(`Delete ${partnerLabel}? Existing transport requests and tour referrals will stay in the system, but this partner record, pricing, drivers, vehicles, and blackout dates will be removed.`)) {
                                deletePartnerMutation.mutate(adminPartnerId);
                              }
                            }}
                          >
                            {deletePartnerMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Delete partner
                          </Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ) : (
          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Partner Profile</CardTitle>
                <CardDescription>
                  Keep your contact details, service areas, and operating notes current for Visit Dzaleka staff.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveSelfProfileMutation.mutate(selfProfileForm);
                  }}
                >
                  <PartnerProfileFields form={selfProfileForm} onChange={setSelfProfileForm} isAdmin={false} />
                  <Button type="submit" disabled={saveSelfProfileMutation.isPending}>
                    {saveSelfProfileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Settings className="h-4 w-4" />
                    )}
                    Update profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        </Tabs>
      )}

      {stats.confirmedRequests > 0 && (isAdminView || activeTab === "dashboard") && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
          {stats.confirmedRequests} transport request{stats.confirmedRequests === 1 ? "" : "s"} confirmed.
        </div>
      )}
    </PageContainer>
  );
}

export function TransportPartnerRecordPage() {
  const [, params] = useRoute("/transport-partner/partners/:partnerId");
  const partnerId = params?.partnerId ? decodeURIComponent(params.partnerId) : "";

  const { data: profile, isLoading: profileLoading } = useQuery<PartnerProfileResponse>({
    queryKey: ["/api/transport-partner/me"],
  });

  const { data: transportRequests = [], isLoading: requestsLoading } = useQuery<TransportRequest[]>({
    queryKey: ["/api/transport-partner/requests"],
  });

  const { data: referrals = [], isLoading: referralsLoading } = useQuery<PartnerTourReferral[]>({
    queryKey: ["/api/transport-partner/referrals"],
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery<TransportPartnerDriver[]>({
    queryKey: ["/api/transport-partner/drivers"],
  });

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<TransportPartnerVehicle[]>({
    queryKey: ["/api/transport-partner/vehicles"],
  });

  const { data: blackouts = [], isLoading: blackoutsLoading } = useQuery<TransportPartnerBlackout[]>({
    queryKey: ["/api/transport-partner/blackouts"],
  });

  const { data: partnerPricing = [], isLoading: pricingLoading } = useQuery<TransportPartnerPricing[]>({
    queryKey: ["/api/transport-partner/pricing"],
  });

  const loading = profileLoading || requestsLoading || referralsLoading || driversLoading || vehiclesLoading || blackoutsLoading || pricingLoading;
  const partners = profile?.partners || [];
  const partner = partners.find((item) => item.id === partnerId) || null;

  return (
    <PageContainer>
      <SEO
        title={partner ? `${partner.companyName} Transport Partner Profile` : "Transport Partner Profile"}
        description="Admin profile view for a transport partner record."
        robots="noindex"
      />
      <PageHeader
        title={partner ? partner.companyName : "Transport Partner Profile"}
        description="Complete admin view of the partner profile, setup completeness, fleet readiness, pricing, availability, requests, and referrals."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/transport-partner?tab=partners">
                <ChevronLeft className="h-4 w-4" />
                Back to Partner Records
              </Link>
            </Button>
            {partner && (
              <Button asChild>
                <Link href={`/transport-partner?tab=partners&partner=${encodeURIComponent(partner.id)}`}>
                  <Settings className="h-4 w-4" />
                  Edit Partner
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {loading ? (
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading partner profile…
          </CardContent>
        </Card>
      ) : !partner ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Car}
              title="Partner not found"
              description="This partner may have been deleted or you may not have access to the record."
            />
          </CardContent>
        </Card>
      ) : (
        <PartnerRecordOverview
          partner={partner}
          requests={transportRequests}
          referrals={referrals}
          drivers={drivers}
          vehicles={vehicles}
          blackouts={blackouts}
          pricing={partnerPricing}
        />
      )}
    </PageContainer>
  );
}
