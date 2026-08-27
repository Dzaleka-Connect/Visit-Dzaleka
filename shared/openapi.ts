/**
 * OpenAPI 3.1 description of the public Visit Dzaleka API.
 *
 * This is the single source of truth for the spec: `script/generate-agent-files.ts`
 * writes it to `client/public/openapi.json` at build time, and `server/agent.ts`
 * serves the same object at `/openapi.json` in development and self-hosted runs.
 *
 * Only genuinely unauthenticated endpoints belong here. Anything behind
 * `isAuthenticated` / `requireRole` is documented in `docs/api.md` instead, so an
 * agent reading this spec never plans a call it cannot make.
 *
 * Every operation carries a unique `operationId`, a `summary`, a `description`
 * and a typed response schema so the document converts cleanly into LLM
 * function-calling definitions.
 */

export const SITE_URL = "https://visit.dzaleka.com";

const ERROR_RESPONSE = {
  description: "Structured error. `code` is stable and safe to branch on.",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
    },
  },
} as const;

function jsonArray(ref: string, description: string) {
  return {
    description,
    content: {
      "application/json": {
        schema: { type: "array", items: { $ref: `#/components/schemas/${ref}` } },
      },
    },
  };
}

function jsonObject(ref: string, description: string) {
  return {
    description,
    content: {
      "application/json": {
        schema: { $ref: `#/components/schemas/${ref}` },
      },
    },
  };
}

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Visit Dzaleka Public API",
    version: "1.0.0",
    summary: "Read-only access to tours, pricing, zones, events and community content in Dzaleka Refugee Camp, Malawi.",
    description: [
      "The Visit Dzaleka public API exposes the information an agent needs to answer questions about",
      "visiting Dzaleka Refugee Camp in Dowa District, Malawi, and to prepare a booking request:",
      "tour pricing, camp zones, meeting points, guided-tour availability, community events and blog content.",
      "",
      "**No authentication is required for any operation in this document.** Endpoints that create or",
      "modify bookings require a session or an API key and are documented separately at /docs.",
      "",
      "All prices are integers in Malawi Kwacha (MWK) with no decimal component.",
      "Responses are `application/json`. Errors use the `Error` schema with a stable `code` field.",
      "",
      "Please send no more than 100 requests per minute per IP.",
    ].join("\n"),
    contact: {
      name: "Visit Dzaleka",
      email: "contact@mail.dzaleka.com",
      url: `${SITE_URL}/developers`,
    },
    license: { name: "Content © Visit Dzaleka", url: `${SITE_URL}/disclaimer` },
  },
  servers: [{ url: SITE_URL, description: "Production" }],
  externalDocs: { description: "Developer portal", url: `${SITE_URL}/developers` },
  tags: [
    { name: "Tours", description: "Pricing and tour options." },
    { name: "Places", description: "Camp zones, meeting points and points of interest." },
    { name: "Community", description: "Events, services, news and listings from the community." },
    { name: "Content", description: "Blog posts and long-form travel guidance." },
    { name: "Bookings", description: "Unauthenticated booking lookups." },
  ],
  paths: {
    "/api/public/pricing": {
      get: {
        operationId: "getTourPricing",
        tags: ["Tours"],
        summary: "List current tour prices",
        description:
          "Returns the live price for each group size. Use this rather than hard-coding prices: rates are edited by administrators and change without notice. `basePrice` covers a standard 2-hour tour; each extra hour adds `additionalHourPrice`.",
        responses: {
          "200": jsonArray("PricingConfig", "Active pricing tiers, one per group size."),
          "500": ERROR_RESPONSE,
        },
      },
    },
    "/api/public/zones": {
      get: {
        operationId: "listZones",
        tags: ["Places"],
        summary: "List camp zones",
        description:
          "Returns the named zones of Dzaleka Refugee Camp that tours may cover, such as Kawale, Likuni and Dzaleka Hill, with a description of each.",
        responses: {
          "200": jsonArray("Zone", "All active zones."),
          "500": ERROR_RESPONSE,
        },
      },
    },
    "/api/public/meeting-points": {
      get: {
        operationId: "listMeetingPoints",
        tags: ["Places"],
        summary: "List tour meeting points",
        description:
          "Returns the places a guided tour can start from, including the camp entrance and partner offices. Use the `address` field when giving a visitor directions.",
        responses: {
          "200": jsonArray("MeetingPoint", "All active meeting points."),
          "500": ERROR_RESPONSE,
        },
      },
    },
    "/api/public/points-of-interest": {
      get: {
        operationId: "listPointsOfInterest",
        tags: ["Places"],
        summary: "List points of interest",
        description:
          "Returns the markets, cultural sites, community projects and other stops a tour can include.",
        responses: {
          "200": jsonArray("PointOfInterest", "All active points of interest."),
          "500": ERROR_RESPONSE,
        },
      },
    },
    "/api/public/special-offers": {
      get: {
        operationId: "listSpecialOffers",
        tags: ["Tours"],
        summary: "List active public discounts",
        description:
          "Returns time-limited public offers that are currently valid. An empty array means no discount is running; quote the standard price from `getTourPricing` in that case.",
        responses: {
          "200": jsonArray("SpecialOffer", "Currently valid public offers, possibly empty."),
          "500": ERROR_RESPONSE,
        },
      },
    },
    "/api/public/transport-partners": {
      get: {
        operationId: "listTransportPartners",
        tags: ["Places"],
        summary: "List transport partners",
        description:
          "Returns vetted operators who can drive visitors between Lilongwe and Dzaleka, roughly a 45 km trip.",
        responses: {
          "200": jsonArray("TransportPartner", "Active transport partners."),
          "500": ERROR_RESPONSE,
        },
      },
    },
    "/api/public/community-listings": {
      get: {
        operationId: "listCommunityListings",
        tags: ["Community"],
        summary: "List community businesses and experiences",
        description:
          "Returns resident-run businesses, artists and experiences that have been published to the community hub.",
        responses: {
          "200": jsonArray("CommunityListing", "Published community listings."),
          "500": ERROR_RESPONSE,
        },
      },
    },
    "/api/public/community-listings/{id}": {
      get: {
        operationId: "getCommunityListing",
        tags: ["Community"],
        summary: "Get one community listing",
        description: "Returns a single published community listing by its identifier.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Listing identifier returned by `listCommunityListings`.",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": jsonObject("CommunityListing", "The requested listing."),
          "404": ERROR_RESPONSE,
          "500": ERROR_RESPONSE,
        },
      },
    },
    "/api/public/reviews": {
      get: {
        operationId: "listPublicReviews",
        tags: ["Content"],
        summary: "List published visitor reviews",
        description: "Returns approved visitor reviews, most recent first.",
        parameters: [
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Maximum number of reviews to return. Defaults to 10.",
            schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
          },
        ],
        responses: {
          "200": jsonArray("Review", "Approved reviews."),
          "500": ERROR_RESPONSE,
        },
      },
    },
    "/api/public/bookings/verify/{reference}": {
      get: {
        operationId: "verifyBooking",
        tags: ["Bookings"],
        summary: "Verify a booking reference",
        description:
          "Confirms whether a booking reference such as `DVS-2024-001` is genuine and returns its status. Rate limited; it returns no personal data.",
        parameters: [
          {
            name: "reference",
            in: "path",
            required: true,
            description: "Booking reference in the form `DVS-<year>-<sequence>`.",
            schema: { type: "string", pattern: "^DVS-\\d{4}-\\d{3,}$" },
          },
        ],
        responses: {
          "200": jsonObject("BookingVerification", "Verification result."),
          "404": ERROR_RESPONSE,
          "429": ERROR_RESPONSE,
        },
      },
    },
    "/api/blog": {
      get: {
        operationId: "listBlogPosts",
        tags: ["Content"],
        summary: "List published blog posts",
        description:
          "Returns published travel guides and articles about visiting Dzaleka. Use `getBlogPost` for the full body of a single post.",
        responses: {
          "200": jsonArray("BlogPost", "Published posts, newest first."),
          "500": ERROR_RESPONSE,
        },
      },
    },
    "/api/blog/{slug}": {
      get: {
        operationId: "getBlogPost",
        tags: ["Content"],
        summary: "Get one blog post",
        description: "Returns a single published post, including its full markdown body.",
        parameters: [
          {
            name: "slug",
            in: "path",
            required: true,
            description: "URL slug returned by `listBlogPosts`.",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": jsonObject("BlogPost", "The requested post."),
          "404": ERROR_RESPONSE,
        },
      },
    },
    "/api/community/events": {
      get: {
        operationId: "listCommunityEvents",
        tags: ["Community"],
        summary: "List community events",
        description:
          "Returns cultural events connected to Dzaleka, including Tumaini Festival dates. Each event carries a `status` of `upcoming` or `past`; filter on it before recommending an event to a visitor.",
        responses: {
          "200": jsonObject("CommunityEventsResponse", "Envelope containing the event list."),
          "500": ERROR_RESPONSE,
        },
      },
    },
    "/api/community/services": {
      get: {
        operationId: "listCommunityServices",
        tags: ["Community"],
        summary: "List community services",
        description: "Returns services offered by organisations and residents in Dzaleka.",
        responses: {
          "200": jsonObject("CommunityCollectionResponse", "Envelope containing the service list."),
          "500": ERROR_RESPONSE,
        },
      },
    },
    "/api/community/resources": {
      get: {
        operationId: "listCommunityResources",
        tags: ["Community"],
        summary: "List community resources",
        description: "Returns guides, documents and support resources published for the community.",
        responses: {
          "200": jsonObject("CommunityCollectionResponse", "Envelope containing the resource list."),
          "500": ERROR_RESPONSE,
        },
      },
    },
    "/api/community/news": {
      get: {
        operationId: "listCommunityNews",
        tags: ["Community"],
        summary: "List community news",
        description: "Returns news items published by and about the Dzaleka community.",
        responses: {
          "200": jsonObject("CommunityCollectionResponse", "Envelope containing the news list."),
          "500": ERROR_RESPONSE,
        },
      },
    },
    "/api/community/search": {
      get: {
        operationId: "searchCommunity",
        tags: ["Community"],
        summary: "Search community content",
        description:
          "Full-text search across community services, events, resources and news. Use this when a visitor asks about a topic rather than a specific collection.",
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            description: "Search terms.",
            schema: { type: "string", minLength: 2 },
          },
        ],
        responses: {
          "200": jsonObject("CommunityCollectionResponse", "Envelope containing matching items."),
          "400": ERROR_RESPONSE,
          "500": ERROR_RESPONSE,
        },
      },
    },
    "/api/public/feeds/things-to-do": {
      get: {
        operationId: "getThingsToDoFeed",
        tags: ["Tours"],
        summary: "Get the Google Things to Do product feed",
        description:
          "Returns the guided walking tour as a Google Things to Do product feed, including live prices. Useful as a single structured summary of the bookable tour.",
        responses: {
          "200": {
            description: "Product feed.",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "500": ERROR_RESPONSE,
        },
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: "object",
        description: "Returned for every 4xx and 5xx response.",
        required: ["error", "code", "message"],
        properties: {
          error: { type: "boolean", const: true, description: "Always true; lets a client branch without inspecting the status." },
          code: {
            type: "string",
            description: "Stable machine-readable code.",
            examples: ["not_found", "validation_failed", "rate_limited", "internal_error"],
          },
          message: { type: "string", description: "Human-readable explanation." },
          hint: { type: "string", description: "Suggested next step to resolve the error." },
          status: { type: "integer", description: "HTTP status code, repeated for convenience." },
          requestId: { type: "string", description: "Correlation id. Quote it when reporting a problem." },
          documentation: { type: "string", format: "uri", description: "Link to relevant documentation." },
        },
      },
      PricingConfig: {
        type: "object",
        description: "One price tier, keyed by group size.",
        required: ["groupSize", "basePrice", "currency"],
        properties: {
          id: { type: "string", description: "Identifier." },
          name: { type: "string", description: "Display name, e.g. `small group`." },
          groupSize: {
            type: "string",
            enum: ["individual", "small_group", "large_group", "custom"],
            description:
              "Tier key. `individual` is 1 person, `small_group` 2-5, `large_group` 6-10, `custom` 10 or more.",
          },
          minPeople: { type: ["integer", "null"], description: "Smallest group this tier covers." },
          maxPeople: { type: ["integer", "null"], description: "Largest group this tier covers; null means unbounded." },
          basePrice: { type: "integer", description: "Price for a standard 2-hour tour, in whole MWK." },
          additionalHourPrice: { type: ["integer", "null"], description: "Cost of each hour beyond the standard 2, in whole MWK." },
          currency: { type: "string", const: "MWK", description: "Always Malawi Kwacha." },
          isActive: { type: "boolean", description: "Whether the tier is currently offered." },
        },
      },
      Zone: {
        type: "object",
        description: "A named area of the camp.",
        required: ["id", "name"],
        properties: {
          id: { type: "string" },
          name: { type: "string", description: "Zone name, e.g. `Kawale`." },
          description: { type: ["string", "null"], description: "What the zone is and how it is used." },
          zoneType: { type: ["string", "null"], description: "Classification, e.g. `route_area`." },
          isActive: { type: "boolean" },
        },
      },
      MeetingPoint: {
        type: "object",
        description: "A place a tour can start from.",
        required: ["id", "name"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: ["string", "null"] },
          address: { type: ["string", "null"], description: "Postal or descriptive address." },
          isActive: { type: "boolean" },
        },
      },
      PointOfInterest: {
        type: "object",
        description: "A stop a tour can include.",
        required: ["id", "name"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: ["string", "null"] },
          category: { type: ["string", "null"], description: "e.g. `culture`, `commerce`, `history`." },
          isActive: { type: "boolean" },
        },
      },
      SpecialOffer: {
        type: "object",
        description: "A time-limited public discount.",
        required: ["id", "name", "discountPercent"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: ["string", "null"] },
          offerType: { type: "string", enum: ["standard", "early_bird", "last_minute"] },
          discountPercent: { type: "integer", minimum: 1, maximum: 100 },
          activityStartDate: { type: "string", format: "date", description: "First date the offer applies to." },
          activityEndDate: { type: "string", format: "date", description: "Last date the offer applies to." },
          groupSizes: {
            type: "array",
            items: { type: "string" },
            description: "Group-size keys the offer applies to. Empty means all.",
          },
        },
      },
      TransportPartner: {
        type: "object",
        description: "A vetted operator driving visitors to the camp.",
        required: ["id", "name"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: ["string", "null"] },
          status: { type: "string", description: "`active` partners are bookable." },
        },
      },
      CommunityListing: {
        type: "object",
        description: "A resident-run business, artist or experience.",
        required: ["id", "title"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: ["string", "null"] },
          category: { type: ["string", "null"] },
          status: { type: "string" },
        },
      },
      Review: {
        type: "object",
        description: "An approved visitor review.",
        required: ["id"],
        properties: {
          id: { type: "string" },
          visitorName: { type: ["string", "null"], description: "Display name, may be withheld." },
          rating: { type: ["integer", "null"], minimum: 1, maximum: 5 },
          comment: { type: ["string", "null"] },
          createdAt: { type: ["string", "null"], format: "date-time" },
        },
      },
      BookingVerification: {
        type: "object",
        description: "Whether a booking reference is genuine.",
        required: ["valid"],
        properties: {
          valid: { type: "boolean", description: "True when the reference exists." },
          reference: { type: ["string", "null"] },
          status: {
            type: ["string", "null"],
            enum: ["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show", null],
            description: "Current booking status.",
          },
          tourDate: { type: ["string", "null"], format: "date" },
        },
      },
      BlogPost: {
        type: "object",
        description: "A published article.",
        required: ["id", "title", "slug"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          slug: { type: "string", description: "URL segment; the post is readable at /blog/{slug}." },
          content: { type: ["string", "null"], description: "Full body, markdown." },
          excerpt: { type: ["string", "null"] },
          coverImage: { type: ["string", "null"], format: "uri" },
          published: { type: "boolean" },
          publishedAt: { type: ["string", "null"], format: "date-time" },
        },
      },
      CommunityEvent: {
        type: "object",
        description: "A cultural event connected to Dzaleka.",
        required: ["id", "title"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: ["string", "null"] },
          date: { type: ["string", "null"], format: "date-time", description: "Start time, ISO 8601." },
          endDate: { type: ["string", "null"], format: "date-time" },
          location: { type: ["string", "null"] },
          category: { type: ["string", "null"] },
          organizer: { type: ["string", "null"] },
          status: {
            type: ["string", "null"],
            enum: ["upcoming", "past", null],
            description: "Filter on this before recommending an event.",
          },
          image: { type: ["string", "null"], format: "uri" },
        },
      },
      CommunityEventsResponse: {
        type: "object",
        description: "Envelope returned by the community events endpoint.",
        required: ["status", "data"],
        properties: {
          status: { type: "string", const: "success" },
          count: { type: "integer", description: "Number of items in `data.events`." },
          data: {
            type: "object",
            properties: {
              events: { type: "array", items: { $ref: "#/components/schemas/CommunityEvent" } },
            },
          },
        },
      },
      CommunityCollectionResponse: {
        type: "object",
        description: "Generic envelope used by the other community collections.",
        required: ["status", "data"],
        properties: {
          status: { type: "string", const: "success" },
          count: { type: "integer" },
          data: { type: "object", description: "Collection payload; the item array is keyed by collection name." },
        },
      },
    },
  },
} as const;

export type OpenApiDocument = typeof openApiDocument;
