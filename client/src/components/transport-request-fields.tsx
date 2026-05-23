import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Car, CheckCircle2, Clock, CreditCard, Info, MessageCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DEFAULT_TRANSPORT_ROUTE_ID,
  getTransportPartner,
  getTransportRoute,
  TRANSPORT_PARTNERS,
  TRANSPORT_ROUTES,
  UNASSIGNED_TRANSPORT_PARTNER_ID,
  type TransportRequestDraft,
} from "@/lib/transport";

interface TransportRequestFieldsProps extends TransportRequestDraft {
  idPrefix: string;
  onChange: (updates: Partial<TransportRequestDraft>) => void;
  inputClassName?: string;
  textClassName?: string;
  descriptionClassName?: string;
}

interface PublicTransportPartner {
  id: string;
  companyName: string;
}

interface PartnerOption {
  id: string;
  name: string;
}

function normalizePartnerName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(malawi|services?|company|co|limited|ltd)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniquePartnerOptions(...groups: PartnerOption[][]) {
  const seen = new Set<string>();
  const options: PartnerOption[] = [];

  for (const group of groups) {
    for (const partner of group) {
      const nameKey = normalizePartnerName(partner.name);
      const key = nameKey || partner.id;
      if (seen.has(partner.id) || seen.has(key)) continue;
      seen.add(partner.id);
      seen.add(key);
      options.push(partner);
    }
  }

  return options;
}

export function TransportRequestFields({
  idPrefix,
  transportRequested,
  transportRoute,
  transportPartnerId,
  transportPartnerName,
  transportPickup,
  transportNotes,
  onChange,
  inputClassName,
  textClassName,
  descriptionClassName,
}: TransportRequestFieldsProps) {
  const requested = Boolean(transportRequested);
  const checkboxId = `${idPrefix}-transport-requested`;
  const { data: publicPartners = [] } = useQuery<PublicTransportPartner[]>({
    queryKey: ["/api/public/transport-partners"],
    enabled: requested,
  });
  const publicPartnerOptions = publicPartners.map((partner) => ({ id: partner.id, name: partner.companyName }));
  const staticPartnerOptions = TRANSPORT_PARTNERS.map((partner) => ({ id: partner.id, name: partner.name }));
  const partnerOptions = uniquePartnerOptions(publicPartnerOptions, staticPartnerOptions);
  const selectedRoute = getTransportRoute(transportRoute);
  const selectedStaticPartner = getTransportPartner(transportPartnerId);
  const selectedPartnerOption = partnerOptions.find((partner) => partner.id === transportPartnerId);
  const selectedPartnerName = selectedPartnerOption?.name || selectedStaticPartner?.name || transportPartnerName || "";
  const matchingPublicPartner = selectedStaticPartner
    ? publicPartnerOptions.find((partner) => normalizePartnerName(partner.name) === normalizePartnerName(selectedStaticPartner.name))
    : undefined;
  const processSteps = [
    {
      icon: MessageCircle,
      title: "Partner sends a quote",
      description: "The route, date, pickup point, group size, luggage, and timing are reviewed before price is set.",
    },
    {
      icon: CreditCard,
      title: "Price is separate",
      description: "Transport is not included in the tour price unless your final confirmation says so.",
    },
    {
      icon: CheckCircle2,
      title: "You approve first",
      description: "We share the fare, currency, vehicle, driver contact, and pickup details before transport is final.",
    },
  ];

  useEffect(() => {
    if (!requested || !transportPartnerId || !matchingPublicPartner || matchingPublicPartner.id === transportPartnerId) {
      return;
    }

    onChange({
      transportPartnerId: matchingPublicPartner.id,
      transportPartnerName: matchingPublicPartner.name,
    });
  }, [matchingPublicPartner?.id, matchingPublicPartner?.name, onChange, requested, transportPartnerId]);

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex gap-3">
        <Checkbox
          id={checkboxId}
          checked={requested}
          onCheckedChange={(checked) =>
            onChange({
              transportRequested: checked === true,
              transportRoute: transportRoute || DEFAULT_TRANSPORT_ROUTE_ID,
              transportPartnerId: transportPartnerId || "",
            })
          }
        />
        <Label htmlFor={checkboxId} className={cn("grid cursor-pointer gap-1 text-sm leading-relaxed", textClassName)}>
          <span className="font-medium">Request a transport quote</span>
          <span className={cn("text-muted-foreground", descriptionClassName)}>
            Add a Lilongwe, airport, or Lake Malawi transfer request. A verified partner sets the price and confirms the
            ride details after reviewing your visit plan.
          </span>
        </Label>
      </div>

      <div className="mt-3 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="min-w-0 break-words">
          <span className="font-medium">No transport payment is taken now.</span>{" "}
          Your tour request can be submitted first. Transport is confirmed only after a partner provides a quote and
          availability is accepted.
        </p>
      </div>

      {requested && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {processSteps.map((step) => (
              <div key={step.title} className="rounded-md border bg-background p-3">
                <div className="flex items-start gap-2">
                  <step.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className={cn("text-sm font-medium", textClassName)}>{step.title}</p>
                    <p className={cn("mt-1 text-xs leading-relaxed text-muted-foreground", descriptionClassName)}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label className={textClassName}>Preferred route</Label>
              <Select
                value={transportRoute || DEFAULT_TRANSPORT_ROUTE_ID}
                onValueChange={(value) => onChange({ transportRoute: value })}
              >
                <SelectTrigger className={inputClassName}>
                  <SelectValue placeholder="Select a route" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSPORT_ROUTES.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.shortLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className={cn("text-xs leading-relaxed text-muted-foreground", descriptionClassName)}>
                {selectedRoute.description}
              </p>
            </div>

            <div className="min-w-0 space-y-2">
              <Label className={textClassName}>Preferred partner</Label>
              <Select
                value={transportPartnerId || UNASSIGNED_TRANSPORT_PARTNER_ID}
                onValueChange={(value) => {
                  const nextPartner = partnerOptions.find((partner) => partner.id === value);
                  onChange({
                    transportPartnerId: value === UNASSIGNED_TRANSPORT_PARTNER_ID ? "" : value,
                    transportPartnerName: value === UNASSIGNED_TRANSPORT_PARTNER_ID ? "" : nextPartner?.name || "",
                  });
                }}
              >
                <SelectTrigger className={inputClassName}>
                  <SelectValue placeholder="Select a partner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED_TRANSPORT_PARTNER_ID}>
                    No preference - match me with an available partner
                  </SelectItem>
                  {partnerOptions.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className={cn("text-xs leading-relaxed text-muted-foreground", descriptionClassName)}>
                {selectedPartnerName
                  ? `${selectedPartnerName} will still need to confirm availability and price.`
                  : "A preferred partner helps us route the request, but final availability is confirmed by the operator."}
              </p>
            </div>

            <div className="min-w-0 space-y-2">
              <Label htmlFor={`${idPrefix}-transport-pickup`} className={textClassName}>
                Pickup or drop-off details
              </Label>
              <Input
                id={`${idPrefix}-transport-pickup`}
                name="transportPickup"
                placeholder="Hotel, airport, or area…"
                value={transportPickup || ""}
                onChange={(event) => onChange({ transportPickup: event.target.value })}
                className={inputClassName}
                autoComplete="street-address"
              />
              <p className={cn("text-xs leading-relaxed text-muted-foreground", descriptionClassName)}>
                Share the hotel name, airport arrival point, accommodation, or planned drop-off location.
              </p>
            </div>

            <div className="min-w-0 space-y-2">
              <Label htmlFor={`${idPrefix}-transport-notes`} className={textClassName}>
                Quote details for the partner
              </Label>
              <Textarea
                id={`${idPrefix}-transport-notes`}
                name="transportNotes"
                placeholder="Flight number, luggage count, return time, Lake Malawi stop, accessibility needs…"
                value={transportNotes || ""}
                onChange={(event) => onChange({ transportNotes: event.target.value })}
                className={cn("min-h-24", inputClassName)}
              />
              <p className={cn("text-xs leading-relaxed text-muted-foreground", descriptionClassName)}>
                The more detail you share, the easier it is for a partner to quote accurately.
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-md border bg-background p-3 text-xs leading-relaxed text-muted-foreground sm:grid-cols-2">
            <div className="flex gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>We match the transport request to your tour date and preferred start time.</span>
            </div>
            <div className="flex gap-2">
              <Car className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>Final confirmation should include driver, vehicle, pickup point, and payment terms.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
