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

function HelpCenterPanel({ isAdmin }: { isAdmin: boolean }) {
  const guides = isAdmin
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
          icon: ClipboardList,
          title: "Respond to a transport request",
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

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>{isAdmin ? "Admin Help Center" : "Partner Help Center"}</CardTitle>
          </div>
          <CardDescription>
            {isAdmin
              ? "Operational guidance for controlling partner assignments, pricing references, request exceptions, and visitor quote decisions."
              : "How to manage transport requests, route pricing, availability, and visitor tour referrals from this portal."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {guides.map((guide) => {
            const Icon = guide.icon;
            return (
              <section key={guide.title} className="border-b pb-5 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h2 className="text-sm font-semibold">{guide.title}</h2>
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
            <Button variant="outline" className="h-auto min-h-9 justify-start whitespace-normal text-left leading-snug" asChild>
              <Link href="/transport-partner?tab=requests">
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                <span className="min-w-0 break-words">Open request queue</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto min-h-9 justify-start whitespace-normal text-left leading-snug" asChild>
              <Link href="/transport-partner?tab=pricing">
                <DollarSign className="h-4 w-4" aria-hidden="true" />
                <span className="min-w-0 break-words">Open pricing</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto min-h-9 justify-start whitespace-normal text-left leading-snug" asChild>
              <Link href={isAdmin ? "/transport-partner?tab=partners" : "/transport-partner?tab=profile"}>
                <Settings className="h-4 w-4" aria-hidden="true" />
                <span className="min-w-0 break-words">{isAdmin ? "Open partner records" : "Open profile"}</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TransportPartnerPortal() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const requestedTab = params.get("tab");
  const requestedPartnerId = params.get("partner");
  const [referralForm, setReferralForm] = useState(initialReferralForm);
  const [requestDrafts, setRequestDrafts] = useState<Record<string, RequestDraft>>({});
  const [selectedActivityRequestId, setSelectedActivityRequestId] = useState<string>("");
  const [driverForm, setDriverForm] = useState(initialDriverForm);
  const [vehicleForm, setVehicleForm] = useState(initialVehicleForm);
  const [blackoutForm, setBlackoutForm] = useState(initialBlackoutForm);
  const [pricingForm, setPricingForm] = useState(initialPricingForm);
  const [adminPartnerId, setAdminPartnerId] = useState<string>("new");
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
    : ["requests", "referrals", "roster", "availability", "pricing", "profile", "help"];
  const activeTab = availableTabs.includes(requestedTab || "") ? requestedTab! : "requests";
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
    ? (adminPartnerId !== "new" ? adminPartnerId : partners[0]?.id || "")
    : profile?.partner?.id || "";
  const selectedAdminPartner = adminPartnerId === "new"
    ? null
    : partners.find((partner) => partner.id === adminPartnerId) || null;

  useEffect(() => {
    if (!isAdminView && profile?.partner) {
      setSelfProfileForm(partnerToForm(profile.partner));
    }
  }, [isAdminView, profile?.partner]);

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
      await apiRequest("DELETE", `/api/transport-partners/${id}`);
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
      toast({ title: "Driver saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not save driver", description: error.message, variant: "destructive" });
    },
  });

  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/transport-partner/drivers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/drivers"] });
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
      toast({ title: "Vehicle saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not save vehicle", description: error.message, variant: "destructive" });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/transport-partner/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/vehicles"] });
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
      toast({ title: "Availability block saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not save availability", description: error.message, variant: "destructive" });
    },
  });

  const deleteBlackoutMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/transport-partner/blackouts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/blackouts"] });
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
      toast({ title: "Transport price saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not save pricing", description: error.message, variant: "destructive" });
    },
  });

  const deletePricingMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/transport-partner/pricing/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-partner/pricing"] });
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
  const pageTitle = isAdminView ? "Transport Operations" : "Transport Partner Portal";
  const pageDescription = isAdminView
    ? "Manage transport requests, partner records, route pricing, fleet readiness, and transport exceptions."
    : "Manage visitor transport requests and refer your own guests for guided Dzaleka experiences.";

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
                      onClick={() => navigate(`/transport-partner?tab=${queue.tab}`)}
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
                        onClick={() => navigate(`/transport-partner?tab=${action.tab}`)}
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
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.slice(0, 5).map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell>
                            <p className="font-medium">{partner.companyName}</p>
                            <p className="text-xs text-muted-foreground">{partner.baseLocation || "Base not set"}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{partner.contactName || partner.email}</p>
                            <p className="text-xs text-muted-foreground">{partner.phone || partner.whatsapp || "No phone saved"}</p>
                          </TableCell>
                          <TableCell><StatusBadge status={partner.status || "active"} /></TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAdminPartnerId(partner.id);
                                navigate("/transport-partner?tab=partners");
                              }}
                            >
                              Open
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(value) => navigate(`/transport-partner?tab=${value}`)}
        className="mt-6"
      >
        <TabsList className="flex h-auto w-full max-w-full flex-wrap justify-start gap-1">
          <TabsTrigger className="h-auto whitespace-normal text-center leading-tight" value="requests">
            {isAdminView ? "Request Queue" : "Transport Requests"}
          </TabsTrigger>
          <TabsTrigger className="h-auto whitespace-normal text-center leading-tight" value="referrals">
            {isAdminView ? "Referral Intake" : "Tour Referrals"}
          </TabsTrigger>
          <TabsTrigger className="h-auto whitespace-normal text-center leading-tight" value="roster">
            {isAdminView ? "Fleet Records" : "Roster"}
          </TabsTrigger>
          <TabsTrigger className="h-auto whitespace-normal text-center leading-tight" value="availability">
            {isAdminView ? "Blackout Controls" : "Availability"}
          </TabsTrigger>
          <TabsTrigger className="h-auto whitespace-normal text-center leading-tight" value="pricing">
            {isAdminView ? "Partner Prices" : "Pricing"}
          </TabsTrigger>
          {isAdminView ? (
            <TabsTrigger className="h-auto whitespace-normal text-center leading-tight" value="partners">
              Partner Records
            </TabsTrigger>
          ) : (
            <TabsTrigger className="h-auto whitespace-normal text-center leading-tight" value="profile">
              Profile
            </TabsTrigger>
          )}
          <TabsTrigger className="h-auto whitespace-normal text-center leading-tight" value="help">
            Help Center
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{isAdminView ? "Transport Request Queue" : "Visitor Transport Requests"}</CardTitle>
              <CardDescription>
                {isAdminView
                  ? "Assign partners, review quotes, manage internal notes, and track visitor quote decisions before final confirmation."
                  : "Manage assigned visitor requests, quotes, pickup time, driver details, vehicle details, and partner notes."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading requests…
                </div>
              ) : transportRequests.length === 0 ? (
                <EmptyState
                  icon={Car}
                  title="No transport requests yet"
                  description="New transport requests will appear here after visitors ask for pickup or day-trip support."
                />
              ) : (
                <div className="space-y-4">
                  {transportRequests.map((request) => {
                    const route = getTransportRoute(request.route);
                    const draft = requestDrafts[request.id] || {};
                    const currentPartnerId = draft.partnerId ?? request.partnerId ?? "unassigned";
                    const assignedPartnerId = currentPartnerId === "unassigned" ? null : currentPartnerId;
                    const partnerDrivers = drivers.filter((driver) => !assignedPartnerId || driver.partnerId === assignedPartnerId);
                    const partnerVehicles = vehicles.filter((vehicle) => !assignedPartnerId || vehicle.partnerId === assignedPartnerId);
                    const currentStatus = draft.status || request.status || "pending";
                    const quotedAmount = draft.quotedAmount ?? (request.quotedAmount != null ? String(request.quotedAmount) : "");

                    return (
                      <div key={request.id} className="rounded-lg border p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-base font-semibold">{request.visitorName}</h2>
                              <StatusBadge status={currentStatus} />
                            </div>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <span className="inline-flex min-w-0 items-center gap-1">
                                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                                <span className="truncate">{request.visitorEmail}</span>
                              </span>
                              {request.visitorPhone && (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                                  {request.visitorPhone}
                                </span>
                              )}
                              <span>{request.visitDate ? formatDate(request.visitDate) : "Date pending"}</span>
                              {request.visitTime && <span>{formatTime(request.visitTime)}</span>}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            disabled={updateRequestMutation.isPending}
                            onClick={() => updateRequestMutation.mutate({ id: request.id, updates: requestDrafts[request.id] || {} })}
                          >
                            {updateRequestMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Save
                          </Button>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor={`request-status-${request.id}`}>Status</Label>
                            <Select
                              value={currentStatus}
                              onValueChange={(status: TransportRequestStatus) =>
                                setRequestDrafts((current) => ({
                                  ...current,
                                  [request.id]: { ...current[request.id], status },
                                }))
                              }
                            >
                              <SelectTrigger id={`request-status-${request.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {transportStatuses.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {humanizeStatus(status)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {isAdminView && (
                            <div className="space-y-2">
                              <Label htmlFor={`request-partner-${request.id}`}>Assigned partner</Label>
                              <Select
                                value={currentPartnerId}
                                onValueChange={(partnerId) =>
                                  setRequestDrafts((current) => ({
                                    ...current,
                                    [request.id]: { ...current[request.id], partnerId: partnerId === "unassigned" ? null : partnerId },
                                  }))
                                }
                              >
                                <SelectTrigger id={`request-partner-${request.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {partners.map((partner) => (
                                    <SelectItem key={partner.id} value={partner.id}>
                                      {partner.companyName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label htmlFor={`request-quote-${request.id}`}>Transport quote</Label>
                            <Input
                              id={`request-quote-${request.id}`}
                              type="number"
                              min="0"
                              inputMode="numeric"
                              placeholder="MWK amount…"
                              value={quotedAmount}
                              onChange={(event) =>
                                setRequestDrafts((current) => ({
                                  ...current,
                                  [request.id]: { ...current[request.id], quotedAmount: event.target.value },
                                }))
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`request-pickup-time-${request.id}`}>Pickup time</Label>
                            <Input
                              id={`request-pickup-time-${request.id}`}
                              type="time"
                              value={draft.estimatedPickupTime ?? request.estimatedPickupTime ?? ""}
                              onChange={(event) =>
                                setRequestDrafts((current) => ({
                                  ...current,
                                  [request.id]: { ...current[request.id], estimatedPickupTime: event.target.value },
                                }))
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`request-driver-roster-${request.id}`}>Saved driver</Label>
                            <Select
                              value={draft.driverId ?? request.driverId ?? "manual"}
                              onValueChange={(driverId) =>
                                setRequestDrafts((current) => ({
                                  ...current,
                                  [request.id]: { ...current[request.id], driverId: driverId === "manual" ? null : driverId },
                                }))
                              }
                            >
                              <SelectTrigger id={`request-driver-roster-${request.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="manual">Manual entry</SelectItem>
                                {partnerDrivers.map((driver) => (
                                  <SelectItem key={driver.id} value={driver.id}>
                                    {driver.name}{driver.phone ? ` · ${driver.phone}` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`request-driver-${request.id}`}>Driver</Label>
                            <Input
                              id={`request-driver-${request.id}`}
                              placeholder="Driver name…"
                              value={draft.driverName ?? request.driverName ?? ""}
                              onChange={(event) =>
                                setRequestDrafts((current) => ({
                                  ...current,
                                  [request.id]: { ...current[request.id], driverName: event.target.value },
                                }))
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`request-driver-phone-${request.id}`}>Driver phone</Label>
                            <Input
                              id={`request-driver-phone-${request.id}`}
                              inputMode="tel"
                              placeholder="+265…"
                              value={draft.driverPhone ?? request.driverPhone ?? ""}
                              onChange={(event) =>
                                setRequestDrafts((current) => ({
                                  ...current,
                                  [request.id]: { ...current[request.id], driverPhone: event.target.value },
                                }))
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`request-vehicle-roster-${request.id}`}>Saved vehicle</Label>
                            <Select
                              value={draft.vehicleId ?? request.vehicleId ?? "manual"}
                              onValueChange={(vehicleId) =>
                                setRequestDrafts((current) => ({
                                  ...current,
                                  [request.id]: { ...current[request.id], vehicleId: vehicleId === "manual" ? null : vehicleId },
                                }))
                              }
                            >
                              <SelectTrigger id={`request-vehicle-roster-${request.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="manual">Manual entry</SelectItem>
                                {partnerVehicles.map((vehicle) => (
                                  <SelectItem key={vehicle.id} value={vehicle.id}>
                                    {vehicle.label}{vehicle.plateNumber ? ` · ${vehicle.plateNumber}` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Route</Label>
                            <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm">{route.shortLabel}</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Pickup</Label>
                            <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm">{request.pickupLocation || "Not specified"}</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Pickup time status</Label>
                            <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm">{formatMaybeTime(draft.estimatedPickupTime ?? request.estimatedPickupTime)}</p>
                          </div>
                        </div>

                        {(request.quoteDecision || request.quoteDecisionAt) && (
                          <div className="mt-4 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">Visitor quote decision</span>
                              <StatusBadge status={request.quoteDecision || request.status} />
                              {request.quoteDecisionAt && (
                                <span className="text-xs text-muted-foreground">{formatDate(request.quoteDecisionAt)}</span>
                              )}
                            </div>
                            {request.quoteDecisionNotes && (
                              <p className="mt-1 text-muted-foreground">{request.quoteDecisionNotes}</p>
                            )}
                          </div>
                        )}

                        <div className="mt-4 grid gap-4 lg:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor={`request-new-date-${request.id}`}>Requested new date</Label>
                            <Input
                              id={`request-new-date-${request.id}`}
                              type="date"
                              value={draft.requestedVisitDate ?? request.requestedVisitDate ?? ""}
                              onChange={(event) =>
                                setRequestDrafts((current) => ({
                                  ...current,
                                  [request.id]: { ...current[request.id], requestedVisitDate: event.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`request-new-pickup-${request.id}`}>Requested new pickup</Label>
                            <Input
                              id={`request-new-pickup-${request.id}`}
                              type="time"
                              value={draft.requestedPickupTime ?? request.requestedPickupTime ?? ""}
                              onChange={(event) =>
                                setRequestDrafts((current) => ({
                                  ...current,
                                  [request.id]: { ...current[request.id], requestedPickupTime: event.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`request-cancel-reason-${request.id}`}>Cancellation reason</Label>
                            <Input
                              id={`request-cancel-reason-${request.id}`}
                              placeholder="Reason if cancelled…"
                              value={draft.cancellationReason ?? request.cancellationReason ?? ""}
                              onChange={(event) =>
                                setRequestDrafts((current) => ({
                                  ...current,
                                  [request.id]: { ...current[request.id], cancellationReason: event.target.value },
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`request-vehicle-${request.id}`}>Vehicle details</Label>
                            <Textarea
                              id={`request-vehicle-${request.id}`}
                              placeholder="Vehicle type, plate, capacity…"
                              value={draft.vehicleDetails ?? request.vehicleDetails ?? ""}
                              onChange={(event) =>
                                setRequestDrafts((current) => ({
                                  ...current,
                                  [request.id]: { ...current[request.id], vehicleDetails: event.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`request-partner-notes-${request.id}`}>Partner notes</Label>
                            <Textarea
                              id={`request-partner-notes-${request.id}`}
                              placeholder="Availability, quote conditions, pickup notes…"
                              value={draft.partnerNotes ?? request.partnerNotes ?? ""}
                              onChange={(event) =>
                                setRequestDrafts((current) => ({
                                  ...current,
                                  [request.id]: { ...current[request.id], partnerNotes: event.target.value },
                                }))
                              }
                            />
                          </div>
                          {isAdminView && (
                            <div className="space-y-2 lg:col-span-2">
                              <Label htmlFor={`request-admin-notes-${request.id}`}>Internal admin notes</Label>
                              <Textarea
                                id={`request-admin-notes-${request.id}`}
                                placeholder="Internal follow-up, risk, payment, or assignment notes…"
                                value={draft.adminNotes ?? request.adminNotes ?? ""}
                                onChange={(event) =>
                                  setRequestDrafts((current) => ({
                                    ...current,
                                    [request.id]: { ...current[request.id], adminNotes: event.target.value },
                                  }))
                                }
                              />
                            </div>
                          )}
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                          <div className="rounded-md border bg-muted/20 p-3 text-sm">
                            <p className="font-medium">Partner pricing reference</p>
                            <p className="mt-1 text-muted-foreground">
                              Use the Pricing tab for saved route prices. The transport quote above is the actual amount sent to the visitor for this request.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="self-start"
                            onClick={() => setSelectedActivityRequestId(selectedActivityRequestId === request.id ? "" : request.id)}
                          >
                            <History className="h-4 w-4" />
                            {selectedActivityRequestId === request.id ? "Hide timeline" : "View timeline"}
                          </Button>
                        </div>

                        {selectedActivityRequestId === request.id && (
                          <div className="mt-4 rounded-lg border bg-muted/20 p-4">
                            <h3 className="text-sm font-semibold">Request timeline</h3>
                            {requestActivity.length === 0 ? (
                              <p className="mt-2 text-sm text-muted-foreground">No activity recorded yet.</p>
                            ) : (
                              <div className="mt-3 space-y-3">
                                {requestActivity.map((activity) => (
                                  <div key={activity.id} className="rounded-md border bg-background p-3 text-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="font-medium">{humanizeStatus(activity.action)}</span>
                                      <span className="text-xs text-muted-foreground">{activity.createdAt ? formatDate(activity.createdAt) : ""}</span>
                                    </div>
                                    {(activity.oldStatus || activity.newStatus) && (
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        {activity.oldStatus || "none"} → {activity.newStatus || "none"}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                {isAdminView && (
                  <div className="space-y-2">
                    <Label htmlFor="driver-partner">Partner</Label>
                    <Select value={rosterPartnerId || ""} onValueChange={setAdminPartnerId}>
                      <SelectTrigger id="driver-partner">
                        <SelectValue placeholder="Select partner…" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    createDriverMutation.mutate(driverForm);
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input placeholder="Driver name…" value={driverForm.name} onChange={(event) => setDriverForm({ ...driverForm, name: event.target.value })} required />
                    <Input placeholder="+265…" inputMode="tel" value={driverForm.phone} onChange={(event) => setDriverForm({ ...driverForm, phone: event.target.value })} />
                    <Input placeholder="driver@example.com…" type="email" value={driverForm.email} onChange={(event) => setDriverForm({ ...driverForm, email: event.target.value })} />
                    <Input placeholder="License number…" value={driverForm.licenseNumber} onChange={(event) => setDriverForm({ ...driverForm, licenseNumber: event.target.value })} />
                  </div>
                  <Textarea placeholder="Driver notes…" value={driverForm.notes} onChange={(event) => setDriverForm({ ...driverForm, notes: event.target.value })} />
                  <Button type="submit" disabled={createDriverMutation.isPending || !rosterPartnerId}>
                    {createDriverMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Save driver
                  </Button>
                </form>
                <div className="space-y-2">
                  {drivers.filter((driver) => !rosterPartnerId || driver.partnerId === rosterPartnerId).map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{driver.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{driver.phone || driver.email || "No contact saved"}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${driver.name}`} onClick={() => deleteDriverMutation.mutate(driver.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                    createVehicleMutation.mutate(vehicleForm);
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input placeholder="Vehicle label…" value={vehicleForm.label} onChange={(event) => setVehicleForm({ ...vehicleForm, label: event.target.value })} required />
                    <Input placeholder="Vehicle type…" value={vehicleForm.vehicleType} onChange={(event) => setVehicleForm({ ...vehicleForm, vehicleType: event.target.value })} />
                    <Input placeholder="Plate number…" value={vehicleForm.plateNumber} onChange={(event) => setVehicleForm({ ...vehicleForm, plateNumber: event.target.value })} />
                    <Input placeholder="Capacity…" type="number" min="1" inputMode="numeric" value={vehicleForm.capacity} onChange={(event) => setVehicleForm({ ...vehicleForm, capacity: event.target.value })} />
                    <Input placeholder="Color…" value={vehicleForm.color} onChange={(event) => setVehicleForm({ ...vehicleForm, color: event.target.value })} />
                  </div>
                  <Textarea placeholder="Vehicle notes…" value={vehicleForm.notes} onChange={(event) => setVehicleForm({ ...vehicleForm, notes: event.target.value })} />
                  <Button type="submit" disabled={createVehicleMutation.isPending || !rosterPartnerId}>
                    {createVehicleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Save vehicle
                  </Button>
                </form>
                <div className="space-y-2">
                  {vehicles.filter((vehicle) => !rosterPartnerId || vehicle.partnerId === rosterPartnerId).map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{vehicle.label}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[vehicle.vehicleType, vehicle.plateNumber, vehicle.capacity ? `${vehicle.capacity} seats` : null].filter(Boolean).join(" · ") || "No vehicle details"}
                        </p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${vehicle.label}`} onClick={() => deleteVehicleMutation.mutate(vehicle.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
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
                className="grid gap-3 lg:grid-cols-[1fr_1fr_2fr_auto]"
                onSubmit={(event) => {
                  event.preventDefault();
                  createBlackoutMutation.mutate(blackoutForm);
                }}
              >
                <Input type="date" value={blackoutForm.startDate} onChange={(event) => setBlackoutForm({ ...blackoutForm, startDate: event.target.value })} required />
                <Input type="date" value={blackoutForm.endDate} onChange={(event) => setBlackoutForm({ ...blackoutForm, endDate: event.target.value })} required />
                <Input placeholder="Reason…" value={blackoutForm.reason} onChange={(event) => setBlackoutForm({ ...blackoutForm, reason: event.target.value })} />
                <Button type="submit" disabled={createBlackoutMutation.isPending || !rosterPartnerId}>
                  {createBlackoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarOff className="h-4 w-4" />}
                  Block dates
                </Button>
              </form>
              {blackouts.length === 0 ? (
                <EmptyState icon={CalendarOff} title="No blackout dates" description="Blocked dates will appear here." />
              ) : (
                <div className="space-y-2">
                  {blackouts.filter((blackout) => !rosterPartnerId || blackout.partnerId === rosterPartnerId).map((blackout) => (
                    <div key={blackout.id} className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{formatDate(blackout.startDate)} to {formatDate(blackout.endDate)}</p>
                        <p className="text-xs text-muted-foreground">{blackout.reason || "No reason added"}</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => deleteBlackoutMutation.mutate(blackout.id)}>
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="mt-4">
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
                  createPricingMutation.mutate(pricingForm);
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
                <Button type="submit" disabled={createPricingMutation.isPending || !rosterPartnerId} className="lg:col-span-4">
                  {createPricingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                  Save transport price
                </Button>
              </form>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnerPricing.filter((price) => !rosterPartnerId || price.partnerId === rosterPartnerId).map((price) => {
                      const routeInfo = getTransportRoute(price.route);
                      const displayLabel = price.label === "Lilongwe round trip" && routeInfo.id !== DEFAULT_TRANSPORT_ROUTE_ID
                        ? routeInfo.shortLabel
                        : price.label;

                      return (
                        <TableRow key={price.id}>
                          <TableCell>{routeInfo.shortLabel}</TableCell>
                          <TableCell>{displayLabel}</TableCell>
                          <TableCell className="tabular-nums">{formatCurrency(price.basePrice, price.currency || "MWK")}</TableCell>
                          <TableCell>{humanizeStatus(price.pricingType)}</TableCell>
                          <TableCell><StatusBadge status={price.status || "active"} /></TableCell>
                          <TableCell className="text-right">
                            <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${displayLabel}`} onClick={() => deletePricingMutation.mutate(price.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
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

      {stats.confirmedRequests > 0 && (
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
