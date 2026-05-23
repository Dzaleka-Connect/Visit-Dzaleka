export const DEFAULT_TRANSPORT_PARTNER_ID = "ashraf-taxi-tours";
export const DEFAULT_TRANSPORT_ROUTE_ID = "lilongwe-dzaleka";
export const UNASSIGNED_TRANSPORT_PARTNER_ID = "unassigned";

export const TRANSPORT_PARTNERS = [
  {
    id: DEFAULT_TRANSPORT_PARTNER_ID,
    slug: "ashraf",
    name: "Ashraf's Taxi & Tours Malawi",
    address: "Lilongwe Mall Malawi, Lilongwe, Malawi",
    website: "https://www.tripadvisor.com/Attraction_Review-g293811-d26631753-Reviews-Ashraf_s_Taxi_Tours_Malawi-Lilongwe_Central_Region.html",
    websiteLabel: "Tripadvisor profile",
    description:
      "Highly rated Lilongwe-based transport and tour service trusted by international travellers for airport transfers, private tours, and long-distance travel across Malawi.",
    strengths: [
      "Reliable airport pickups and drop-offs",
      "Private cultural and city tours",
      "Lake Malawi and regional travel routes",
      "English-speaking professional driving service",
      "Comfortable long-distance transport",
    ],
  },
  {
    id: "anake-taxi-tours-services",
    slug: "anake",
    name: "Anake Taxi & Tours Services",
    address: "Lilongwe, Malawi",
    website: "https://www.anaketaxi.com/",
    websiteLabel: "Official website",
    description:
      "Professional Malawi tour operator offering structured travel experiences, airport transfers, and guided tours across the country.",
    strengths: [
      "Airport transfers between Kamuzu International Airport and Lilongwe",
      "Private and group transport services",
      "Safari and Lake Malawi tour packages",
      "Long-distance travel across Malawi",
      "Multi-day curated travel experiences",
    ],
  },
] as const;

export const TRANSPORT_ROUTES = [
  {
    id: "lilongwe-dzaleka",
    label: "Lilongwe - Dzaleka round trip",
    shortLabel: "Lilongwe round trip",
    description: "Private transfer from Lilongwe to Dzaleka and back after the guided tour.",
  },
  {
    id: "airport-dzaleka",
    label: "Airport pickup - Dzaleka",
    shortLabel: "Airport pickup",
    description: "Meet visitors at Kamuzu International Airport and continue to Dzaleka.",
  },
  {
    id: "lilongwe-dzaleka-lake-malawi",
    label: "Lilongwe - Dzaleka - Lake Malawi",
    shortLabel: "Dzaleka + Lake Malawi",
    description: "Combine a Dzaleka visit with a same-day Lake Malawi or Senga Bay extension.",
  },
  {
    id: "custom-route",
    label: "Custom transport request",
    shortLabel: "Custom route",
    description: "For visitor groups, research teams, or custom pickup and drop-off plans.",
  },
] as const;

export type TransportRouteId = (typeof TRANSPORT_ROUTES)[number]["id"];
export type TransportPartnerId = (typeof TRANSPORT_PARTNERS)[number]["id"];

const TRANSPORT_PARTNER_ALIASES: Record<string, TransportPartnerId> = {
  ashraf: DEFAULT_TRANSPORT_PARTNER_ID,
  anake: "anake-taxi-tours-services",
};

const LEGACY_TRANSPORT_ROUTE_IDS: Record<string, TransportRouteId> = {
  lilongwe_dzaleka: "lilongwe-dzaleka",
  airport_dzaleka: "airport-dzaleka",
  lilongwe_dzaleka_lake_malawi: "lilongwe-dzaleka-lake-malawi",
  custom: "custom-route",
  custom_route: "custom-route",
};

export interface TransportRequestDraft {
  transportRequested?: boolean;
  transportRoute?: string;
  transportPartnerId?: string;
  transportPartnerName?: string;
  transportPickup?: string;
  transportNotes?: string;
}

export function normalizeTransportRouteId(routeId?: string | null): TransportRouteId {
  const trimmedRouteId = (routeId || "").trim();
  if (!trimmedRouteId) return DEFAULT_TRANSPORT_ROUTE_ID;
  return LEGACY_TRANSPORT_ROUTE_IDS[trimmedRouteId] || (trimmedRouteId as TransportRouteId);
}

export function getTransportRoute(routeId?: string | null) {
  const normalizedRouteId = normalizeTransportRouteId(routeId);
  return TRANSPORT_ROUTES.find((route) => route.id === normalizedRouteId) || TRANSPORT_ROUTES[0];
}

export function getTransportPartner(partnerId?: string) {
  return TRANSPORT_PARTNERS.find((partner) => partner.id === partnerId);
}

export function createTransportRequestFromSearch(search: string): TransportRequestDraft {
  const params = new URLSearchParams(search);
  const routeParam = params.get("route") || params.get("transportRoute");
  const normalizedRouteParam = normalizeTransportRouteId(routeParam);
  const transportParam = params.get("transport") || params.get("partner");
  const normalizedPartnerParam = (transportParam || "").trim();
  const hasRoute = !!routeParam && TRANSPORT_ROUTES.some((route) => route.id === normalizedRouteParam);
  const partnerId = normalizedPartnerParam === "true"
    ? ""
    : TRANSPORT_PARTNER_ALIASES[normalizedPartnerParam] || normalizedPartnerParam;
  const hasPartner = TRANSPORT_PARTNERS.some((partner) => partner.id === partnerId);

  return {
    transportRequested: normalizedPartnerParam === "true" || hasPartner || hasRoute || params.get("transportNeeded") === "true",
    transportRoute: hasRoute ? normalizedRouteParam : DEFAULT_TRANSPORT_ROUTE_ID,
    transportPartnerId: hasPartner ? partnerId : "",
    transportPartnerName: hasPartner ? getTransportPartner(partnerId)?.name || "" : "",
    transportPickup: params.get("pickup") || "",
    transportNotes: params.get("transportNotes") || "",
  };
}

export function buildTransportSpecialRequests(existingNotes: string | undefined, request: TransportRequestDraft) {
  const baseNotes = (existingNotes || "").trim();

  if (!request.transportRequested) {
    return baseNotes;
  }

  const route = getTransportRoute(request.transportRoute);
  const partner = getTransportPartner(request.transportPartnerId);
  const partnerName = partner?.name || (request.transportPartnerName || "").trim();
  const pickup = (request.transportPickup || "").trim();
  const notes = (request.transportNotes || "").trim();
  const partnerLine = partnerName
    ? `Preferred partner: ${partnerName}`
    : request.transportPartnerId
      ? "Preferred partner: Selected transport partner"
      : "Preferred partner: No preference - match with an available partner";
  const transportLines = [
    "[Transport request]",
    partnerLine,
    `Route: ${route.label}`,
    `Route note: ${route.description}`,
    "Pricing/confirmation: Partner quote required; transport is not final until price, availability, driver, vehicle, pickup details, and payment terms are confirmed.",
    pickup ? `Pickup/drop-off: ${pickup}` : null,
    notes ? `Transport notes: ${notes}` : null,
  ].filter(Boolean);

  return [baseNotes, transportLines.join("\n")].filter(Boolean).join("\n\n");
}
