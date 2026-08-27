/**
 * Thin client over the Visit Dzaleka public API.
 *
 * Split from the command layer so it can be unit tested against a stub fetch
 * without spawning a process. No dependencies: Node 18+ has global fetch.
 */

export const DEFAULT_BASE_URL = "https://visit.dzaleka.com";

/** Error carrying the API's structured `code`/`hint` so commands can print them. */
export class ApiError extends Error {
  constructor(message, { status, code, hint, requestId } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.hint = hint;
    this.requestId = requestId;
  }
}

/**
 * GET a path and parse the JSON body.
 *
 * The API answers errors as JSON with a stable `code`, so a failure is unpacked
 * into an ApiError rather than surfacing an HTTP status alone.
 */
export async function apiGet(path, { baseUrl = DEFAULT_BASE_URL, fetchImpl = globalThis.fetch } = {}) {
  const url = `${baseUrl.replace(/\/+$/, "")}${path}`;
  let response;

  try {
    response = await fetchImpl(url, {
      headers: { accept: "application/json", "user-agent": "visit-dzaleka-cli" },
    });
  } catch (cause) {
    throw new ApiError(`Could not reach ${url}: ${cause.message}`, { code: "network_error" });
  }

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError(`Expected JSON from ${url} but got ${response.status} ${response.headers.get("content-type") || "unknown"}.`, {
      status: response.status,
      code: "invalid_response",
    });
  }

  if (!response.ok) {
    throw new ApiError(body?.message || `Request failed with ${response.status}.`, {
      status: response.status,
      code: body?.code,
      hint: body?.hint,
      requestId: body?.requestId,
    });
  }

  return body;
}

export const endpoints = {
  pricing: "/api/public/pricing",
  zones: "/api/public/zones",
  meetingPoints: "/api/public/meeting-points",
  pointsOfInterest: "/api/public/points-of-interest",
  offers: "/api/public/special-offers",
  transport: "/api/public/transport-partners",
  events: "/api/community/events",
  blog: "/api/blog",
  index: "/api",
  verify: (reference) => `/api/public/bookings/verify/${encodeURIComponent(reference)}`,
  search: (query) => `/api/community/search?q=${encodeURIComponent(query)}`,
};

/** Format an integer MWK amount the way the site displays it. */
export function formatMwk(amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "—";
  return `MWK ${amount.toLocaleString("en-US")}`;
}

const GROUP_LABELS = {
  individual: "Individual (1 person)",
  small_group: "Small group (2-5 people)",
  large_group: "Medium group (6-10 people)",
  custom: "Large group (10+ people)",
};

export function labelForGroupSize(groupSize) {
  return GROUP_LABELS[groupSize] || groupSize;
}
