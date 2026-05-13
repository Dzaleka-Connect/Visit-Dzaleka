import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DEFAULT_TRANSPORT_ROUTE_ID,
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

export function TransportRequestFields({
  idPrefix,
  transportRequested,
  transportRoute,
  transportPartnerId,
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
  const partnerOptions = publicPartners.map((partner) => ({ id: partner.id, name: partner.companyName }));

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
          <span className="font-medium">Request trusted transport support</span>
          <span className={cn("text-muted-foreground", descriptionClassName)}>
            Add a Lilongwe, airport, or Lake Malawi transfer request to this booking.
          </span>
        </Label>
      </div>

      {requested && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
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
          </div>

          <div className="space-y-2">
            <Label className={textClassName}>Preferred partner</Label>
            <Select
              value={transportPartnerId || UNASSIGNED_TRANSPORT_PARTNER_ID}
              onValueChange={(value) =>
                onChange({ transportPartnerId: value === UNASSIGNED_TRANSPORT_PARTNER_ID ? "" : value })
              }
            >
              <SelectTrigger className={inputClassName}>
                <SelectValue placeholder="Select a partner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED_TRANSPORT_PARTNER_ID}>
                  Assign in admin
                </SelectItem>
                {partnerOptions.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-transport-notes`} className={textClassName}>
              Transport notes
            </Label>
            <Textarea
              id={`${idPrefix}-transport-notes`}
              name="transportNotes"
              placeholder="Flight time, luggage, Lake Malawi plans…"
              value={transportNotes || ""}
              onChange={(event) => onChange({ transportNotes: event.target.value })}
              className={inputClassName}
            />
          </div>
        </div>
      )}
    </div>
  );
}
