/// <reference path="../types.d.ts" />
import type { Express, Request, Response } from "express";
import type { Booking } from "@shared/schema";
import crypto from "crypto";
import { getGygStore, formatGygReservationExpiration, type GygReservationState } from "./getyourguide-store";
import { isGygAuthorizationValid } from "./getyourguide-auth";
import { logger } from "./logger";
import { logError } from "../utils/errors";

type GygPricingMode = "individual" | "group";
type GygTimeMode = "time_point" | "time_period";
type GygAvailabilityMode = "total" | "by_category";

interface GygProductConfig {
  productId: string;
  pricingMode: GygPricingMode;
  timeMode: GygTimeMode;
  availabilityMode: GygAvailabilityMode;
}

const GYG_TIMEZONE_OFFSET = "+02:00";
const GYG_PRODUCT_TITLE = "Dzaleka Refugee Camp Guided Walking Tour";
export const GYG_SUPPLIER_ID = process.env.GETYOURGUIDE_SUPPLIER_ID || "visit-dzaleka";
const GYG_SUPPLIER_NAME = process.env.GETYOURGUIDE_SUPPLIER_NAME || "Visit Dzaleka";
export const GYG_DEFAULT_START_TIMES = (process.env.GETYOURGUIDE_START_TIMES || "10:00,14:00")
  .split(",")
  .map((time) => time.trim())
  .filter(Boolean);
const GYG_SUPPORTED_INDIVIDUAL_CATEGORIES = (process.env.GETYOURGUIDE_INDIVIDUAL_CATEGORIES || "ADULT,CHILD")
  .split(",")
  .map((category) => category.trim().toUpperCase())
  .filter(Boolean);
const GYG_BLOCKED_DATES = new Set(
  (process.env.GETYOURGUIDE_UNAVAILABLE_DATES || "2026-05-27,2026-05-28")
    .split(",")
    .map((date) => date.trim())
    .filter(Boolean)
);
const GYG_MAX_PEOPLE_PER_SLOT = Number(process.env.GETYOURGUIDE_MAX_CAPACITY || 20);
const GYG_MAX_GROUPS_PER_SLOT = Number(process.env.GETYOURGUIDE_MAX_GROUPS_PER_SLOT || 2);
const GYG_CUTOFF_SECONDS = Number(process.env.GETYOURGUIDE_CUTOFF_SECONDS || 3600);
export const GYG_CURRENCY = process.env.GETYOURGUIDE_CURRENCY || "USD";
export const GYG_PRODUCT_TIMEZONE = process.env.GETYOURGUIDE_PRODUCT_TIMEZONE || "Africa/Blantyre";

function getGygBaseProductId() {
  return process.env.GETYOURGUIDE_EXTERNAL_PRODUCT_ID
    || process.env.GETYOURGUIDE_PRODUCT_ID
    || "dzaleka-refugee-camp-guided-walking-tour";
}

export function getGygAvailabilityPushProductId() {
  return process.env.GETYOURGUIDE_AVAILABILITY_PRODUCT_ID
    || process.env.GETYOURGUIDE_NOTIFY_PRODUCT_ID
    || process.env.GETYOURGUIDE_CONNECTED_PRODUCT_ID
    || "";
}

export function getGygSelfTestProductIds() {
  const base = getGygBaseProductId();
  return {
    timePointIndividual: `${base}-time-point-individual`,
    timePointIndividualByCategory: `${base}-time-point-individual-by-category`,
    timePointGroup: `${base}-time-point-group`,
    timePeriodIndividual: `${base}-time-period-individual`,
    timePeriodIndividualByCategory: `${base}-time-period-individual-by-category`,
    timePeriodGroup: `${base}-time-period-group`,
  };
}

export function resolveGygProduct(productId?: string): GygProductConfig | null {
  const rawProductId = (productId || "").trim();
  if (!rawProductId || rawProductId.includes("%")) return null;

  const base = getGygBaseProductId().toLowerCase();
  const raw = rawProductId.toLowerCase();
  const aliases = new Set([
    base,
    String(process.env.GETYOURGUIDE_PRODUCT_ID || "").toLowerCase(),
    String(process.env.GETYOURGUIDE_ACTIVITY_ID || "").toLowerCase(),
    String(process.env.GETYOURGUIDE_AVAILABILITY_PRODUCT_ID || "").toLowerCase(),
    String(process.env.GETYOURGUIDE_NOTIFY_PRODUCT_ID || "").toLowerCase(),
    String(process.env.GETYOURGUIDE_CONNECTED_PRODUCT_ID || "").toLowerCase(),
    "1188868",
  ].filter(Boolean));

  const isKnownProduct = aliases.has(raw) || raw.startsWith(`${base}-`);
  if (!isKnownProduct) return null;

  return {
    productId: rawProductId,
    pricingMode: raw.includes("group")
      ? "group"
      : process.env.GETYOURGUIDE_DEFAULT_PRICING_MODE === "group"
        ? "group"
        : "individual",
    timeMode: raw.includes("period")
      ? "time_period"
      : process.env.GETYOURGUIDE_DEFAULT_TIME_MODE === "time_period"
        ? "time_period"
        : "time_point",
    availabilityMode: raw.includes("category") || process.env.GETYOURGUIDE_AVAILABILITY_MODE === "by_category"
      ? "by_category"
      : "total",
  };
}

function gygError(errorCode: string, errorMessage: string, extra: Record<string, unknown> = {}) {
  return { errorCode, errorMessage, ...extra };
}

function sendGygResponse(res: Response, payload: any) {
  if (res.locals.gygAuthenticated) {
    // Telemetry must not sit on the certification critical path. Availability is
    // measured end-to-end; a second write (and 90-day prune) pushed 1-day calls over 4s.
    void getGygStore().recordActivity(
      `${res.req.path.replace(/\/$/, "")}/`,
      res.req.body?.data?.productId || res.req.query.productId || res.req.params.productId || null,
      !payload?.errorCode && res.req.body?.data?.notificationType !== "PRODUCT_DEACTIVATION", payload?.errorCode || (res.req.body?.data?.notificationType === "PRODUCT_DEACTIVATION" ? "PRODUCT_DEACTIVATION" : null),
      res.req.get("X-Dzaleka-Diagnostic") === "true" || Object.values(getGygSelfTestProductIds()).includes(String(res.req.body?.data?.productId || res.req.query.productId || res.req.params.productId || "")),
    ).catch((error) => { logError("GetYourGuide activity recording failed", error); });
  }
  const started = (res.req as Request & { gygStartedAt?: number }).gygStartedAt;
  if (typeof started === "number") {
    res.set("Server-Timing", `app;dur=${Date.now() - started}`);
  }
  return res.status(200).type("application/json").json(payload);
}

function requireGygAuth(req: Request, res: Response) {
  if (isGygAuthorizationValid(req.get("authorization") || "")) { res.locals.gygAuthenticated = true; return true; }
  sendGygResponse(res, gygError("AUTHORIZATION_FAILURE", "The provided authentication credentials are not valid."));
  return false;
}

function gygDateParts(dateTime?: string) {
  const value = (dateTime || "").trim().replace(" ", "+");
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!match || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?\+02:00$/.test(value)
    || !Number.isFinite(Date.parse(value))
    || new Date(`${match[1]}T00:00:00Z`).toISOString().slice(0, 10) !== match[1]
    || Number(match[2].slice(0, 2)) > 23 || Number(match[2].slice(3)) > 59) return null;
  return { date: match[1], time: match[2], normalized: value };
}

function formatGygDateTime(date: string, time: string) {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return `${date}T${normalizedTime}${GYG_TIMEZONE_OFFSET}`;
}

export function addDaysToDateString(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function getGygLocalDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: GYG_PRODUCT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function getGygDateRange(fromDateTime?: string, toDateTime?: string) {
  const from = gygDateParts(fromDateTime);
  const to = gygDateParts(toDateTime);
  if (!from || !to || from.normalized > to.normalized || (Date.parse(to.normalized) - Date.parse(from.normalized)) / 86400000 > 366) return null;

  const dates: string[] = [];
  let cursor = from.date;
  let guard = 0;
  while (cursor <= to.date && guard < 370) {
    dates.push(cursor);
    cursor = addDaysToDateString(cursor, 1);
    guard += 1;
  }
  return dates;
}

function getGygParticipantCount(bookingItems: any[] = []) {
  return bookingItems.reduce((total, item) => {
    const count = Math.max(0, Number(item?.count || 0));
    if (item?.category === "GROUP") {
      return total + count * Math.max(1, Number(item?.groupSize || 1));
    }
    return total + count;
  }, 0);
}

function getGygUnitCount(config: GygProductConfig, bookingItems: any[] = []) {
  if (config.pricingMode === "group") {
    return bookingItems.reduce((total, item) => total + Math.max(0, Number(item?.count || 0)), 0);
  }

  return getGygParticipantCount(bookingItems);
}

function validateGygBookingItems(config: GygProductConfig, bookingItems: any[] = []) {
  if (!Array.isArray(bookingItems) || bookingItems.length === 0) {
    return gygError("VALIDATION_FAILURE", "bookingItems must contain at least one ticket category.");
  }

  const allowedCategories = config.pricingMode === "group" ? ["GROUP"] : GYG_SUPPORTED_INDIVIDUAL_CATEGORIES;
  const invalidCategoryIndex = bookingItems.findIndex((item) => !allowedCategories.includes(String(item?.category || "")));
  if (invalidCategoryIndex !== -1) {
    const invalidCategory = bookingItems[invalidCategoryIndex] || {};
    return gygError(
      "INVALID_TICKET_CATEGORY",
      `The ticket category ${invalidCategory.category} is not sellable for this product.`,
      { ticketCategory: invalidCategory.category }
    );
  }

  if (bookingItems.some(item => !Number.isInteger(item.count) || item.count < 1
    || (item.category === "GROUP" && (!Number.isInteger(item.groupSize) || item.groupSize < 1)))) {
    return gygError("VALIDATION_FAILURE", "Ticket counts and group sizes must be positive integers.");
  }
  const participantCount = getGygParticipantCount(bookingItems);
  if (participantCount < 1 || participantCount > GYG_MAX_PEOPLE_PER_SLOT) {
    return gygError(
      "INVALID_PARTICIPANTS_CONFIGURATION",
      `The activity requires between 1 and ${GYG_MAX_PEOPLE_PER_SLOT} participants.`,
      { participantsConfiguration: { min: 1, max: GYG_MAX_PEOPLE_PER_SLOT }, ...(config.pricingMode === "group" ? { groupConfiguration: { max: GYG_MAX_GROUPS_PER_SLOT } } : {}) }
    );
  }

  if (config.pricingMode === "group") {
    const groupCount = getGygUnitCount(config, bookingItems);
    if (groupCount < 1 || groupCount > GYG_MAX_GROUPS_PER_SLOT) {
      return gygError(
        "INVALID_PARTICIPANTS_CONFIGURATION",
        `The activity can be booked for up to ${GYG_MAX_GROUPS_PER_SLOT} groups per timeslot.`,
        {
          participantsConfiguration: { min: 1, max: GYG_MAX_PEOPLE_PER_SLOT },
          groupConfiguration: { max: GYG_MAX_GROUPS_PER_SLOT },
        }
      );
    }
  }

  return null;
}

export async function getGygRetailPrice(config: GygProductConfig) {
  const configuredPrice = config.pricingMode === "group"
    ? process.env.GETYOURGUIDE_GROUP_PRICE || process.env.GETYOURGUIDE_PRICE
    : process.env.GETYOURGUIDE_ADULT_PRICE || process.env.GETYOURGUIDE_PRICE;
  if (configuredPrice && Number.isFinite(Number(configuredPrice))) {
    return Number(configuredPrice);
  }

  if (GYG_CURRENCY === "USD") {
    return config.pricingMode === "group" ? 8000 : 4900;
  }

  const groupSize = config.pricingMode === "group" ? "large_group" : "individual";
  return getGygStore().standardRetailPrice(groupSize);
}

async function getGygRetailPrices(config: GygProductConfig) {
  const basePrice = await getGygRetailPrice(config);
  if (config.pricingMode === "group") {
    return [{ category: "GROUP", price: basePrice }];
  }

  return GYG_SUPPORTED_INDIVIDUAL_CATEGORIES.map((category) => ({
    category,
    price: category === "CHILD"
      ? Number(process.env.GETYOURGUIDE_CHILD_PRICE || process.env.GETYOURGUIDE_PRICE || (GYG_CURRENCY === "USD" ? 1500 : basePrice))
      : basePrice,
  }));
}

function isGygDateBlocked(config: GygProductConfig, date: string) {
  return GYG_BLOCKED_DATES.has(date) || (Object.values(getGygSelfTestProductIds()).includes(config.productId)
    && [28, 29].some(day => date === addDaysToDateString(getGygLocalDate(), day)));
}

type GygInventory = { bookings: Pick<Booking, "visitDate" | "visitTime" | "numberOfPeople" | "status">[]; reservations: GygReservationState[] };
type GygRetailPrice = { category: string; price: number };
function getGygAvailabilityUnits(config: GygProductConfig, visitDate: string, visitTime: string, inventory: GygInventory) {
  if (isGygDateBlocked(config, visitDate)) {
    return 0;
  }

  const matchingBookings = inventory.bookings.filter((booking) => {
    if (booking.status === "cancelled" || booking.status === "no_show") return false;
    if (booking.visitDate !== visitDate) return false;
    if (config.timeMode === "time_period") return true;
    return String(booking.visitTime || "").slice(0, 5) === visitTime;
  });

  const matchingReservations = inventory.reservations.filter((reservation) => {
    if (reservation.visitDate !== visitDate) return false;
    if (config.timeMode === "time_period" || reservation.timeMode === "time_period") return true;
    return reservation.visitTime === visitTime;
  });

  if (config.pricingMode === "group") {
    const reservedGroups = matchingReservations.reduce((total, reservation) => total + (reservation.pricingMode === "group" ? reservation.unitCount : 1), 0);
    const peopleUsed = matchingBookings.reduce((total, booking) => total + (booking.numberOfPeople || 1), 0)
      + matchingReservations.reduce((total, reservation) => total + reservation.participantCount, 0);
    // Only advertise groups whose maximum configured size can be accommodated.
    return Math.max(0, Math.min(GYG_MAX_GROUPS_PER_SLOT - matchingBookings.length - reservedGroups,
      Math.floor((GYG_MAX_PEOPLE_PER_SLOT - peopleUsed) / GYG_MAX_PEOPLE_PER_SLOT)));
  }

  const bookedPeople = matchingBookings.reduce((total, booking) => total + (booking.numberOfPeople || 1), 0);
  const reservedPeople = matchingReservations.reduce((total, reservation) => total + reservation.participantCount, 0);
  return Math.max(0, GYG_MAX_PEOPLE_PER_SLOT - bookedPeople - reservedPeople);
}

function buildGygAvailability(config: GygProductConfig, visitDate: string, visitTime: string, inventory: GygInventory, retailPrices: GygRetailPrice[]) {
  const vacancies = getGygAvailabilityUnits(config, visitDate, visitTime, inventory);
  const availability: Record<string, unknown> = {
    dateTime: config.timeMode === "time_period"
      ? formatGygDateTime(visitDate, "00:00")
      : formatGygDateTime(visitDate, visitTime),
    productId: config.productId,
    cutoffSeconds: GYG_CUTOFF_SECONDS,
    currency: GYG_CURRENCY,
    pricesByCategory: { retailPrices },
  };

  if (config.pricingMode === "individual" && config.availabilityMode === "by_category") {
    availability.vacanciesByCategory = GYG_SUPPORTED_INDIVIDUAL_CATEGORIES.map((category) => ({
      category,
      vacancies,
    }));
  } else {
    availability.vacancies = vacancies;
  }

  if (config.timeMode === "time_period") {
    availability.openingTimes = [{ fromTime: "09:00", toTime: "17:00" }];
  }

  return availability;
}

function makeGygReservationReference() {
  return `res_${crypto.randomBytes(8).toString("hex")}`;
}

function makeGygBookingReference() {
  return `GYG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

function buildGygTickets(bookingReference: string, bookingItems: any[] = []) {
  const tickets: Array<{ category: string; ticketCode: string; ticketCodeType: "QR_CODE" }> = [];
  let index = 1;

  [...bookingItems].sort((a, b) => String(a.category).localeCompare(String(b.category))).forEach((item) => {
    const count = Math.max(1, Number(item?.count || 1));
    for (let i = 0; i < count; i += 1) {
      tickets.push({
        category: item?.category || "ADULT",
        ticketCode: `${bookingReference}-${String(index).padStart(2, "0")}`,
        ticketCodeType: "QR_CODE",
      });
      index += 1;
    }
  });

  return tickets.length > 0 ? tickets : [{
    category: "COLLECTIVE",
    ticketCode: `${bookingReference}-01`,
    ticketCodeType: "QR_CODE" as const,
  }];
}

export async function pushGygAvailability(product: GygProductConfig, options: { days?: number; fromDate?: string; useSandbox?: boolean }) {
  const requestedDays = Number(options.days || 30);
  const days = Number.isFinite(requestedDays) ? Math.min(60, Math.max(1, requestedDays)) : 30;
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(String(options.fromDate || ""))
    ? String(options.fromDate)
    : getGygLocalDate();
  const useSandbox = typeof options.useSandbox === "boolean"
    ? options.useSandbox
    : process.env.GETYOURGUIDE_SYNC_USE_SANDBOX === "true";

  const endDate = addDaysToDateString(startDate, days - 1);
  const [inventory, retailPrices] = await Promise.all([
    getGygStore().inventory(startDate, endDate),
    getGygRetailPrices(product),
  ]);
  const availabilities: Record<string, unknown>[] = [];
  for (let day = 0; day < days; day += 1) {
    const visitDate = addDaysToDateString(startDate, day);
    if (product.timeMode === "time_period") {
      availabilities.push(buildGygAvailability(product, visitDate, "09:00", inventory, retailPrices));
    } else {
      for (const visitTime of GYG_DEFAULT_START_TIMES) {
        availabilities.push(buildGygAvailability(product, visitDate, visitTime, inventory, retailPrices));
      }
    }
  }

  const { notifyAvailabilityBatch } = await import("./getyourguide");
  const result = await notifyAvailabilityBatch(product.productId, availabilities as any, useSandbox);
  await getGygStore().recordActivity("availability-push", product.productId, true, null, useSandbox);
  logger.info("GetYourGuide availability sync completed", {
    productId: product.productId,
    availabilityCount: availabilities.length,
    useSandbox,
  });

  return { ...result, useSandbox };
}

// Scheduled pushes start only after a successful production push for this exact product.
export async function syncConfiguredGygAvailability() {
  const productId = getGygAvailabilityPushProductId();
  if (process.env.GETYOURGUIDE_AUTO_SYNC_ENABLED === "false" || !productId
    || !process.env.GETYOURGUIDE_API_USERNAME || !process.env.GETYOURGUIDE_API_PASSWORD) return { skipped: true, reason: "Configuration incomplete or automatic sync disabled" };
  const product = resolveGygProduct(productId);
  if (!product || !(await getGygStore().activity(productId)).lastSuccessfulPush) return { skipped: true, reason: "A successful production push is required first" };
  try {
    try { await getGygStore().pruneActivity(); } catch (error) { logError("GetYourGuide activity prune failed", error); }
    return await pushGygAvailability(product, { days: 30, useSandbox: false });
  }
  catch (error) {
    await getGygStore().recordActivity("availability-push", productId, false, "SYNC_FAILED");
    throw error;
  }
}

export function registerGetYourGuideSupplierApiRoutes(app: Express) {
  app.get("/1/get-availabilities/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    try {
      const productId = String(req.query.productId || "");
      const config = resolveGygProduct(productId);
      if (!config) {
        return sendGygResponse(res, gygError("INVALID_PRODUCT", "This activity should be deactivated; not sellable."));
      }

      const dates = getGygDateRange(String(req.query.fromDateTime || ""), String(req.query.toDateTime || ""));
      if (!dates) {
        return sendGygResponse(res, gygError("VALIDATION_FAILURE", "fromDateTime and toDateTime must be valid ISO 8601 datetime values."));
      }

      const [inventory, retailPrices] = await Promise.all([
        getGygStore().inventory(dates[0], dates[dates.length - 1]),
        getGygRetailPrices(config),
      ]);
      const availabilities = [];
      for (const date of dates) {
        if (config.timeMode === "time_period") {
          availabilities.push(buildGygAvailability(config, date, "09:00", inventory, retailPrices));
        } else {
          for (const time of GYG_DEFAULT_START_TIMES) {
            availabilities.push(buildGygAvailability(config, date, time, inventory, retailPrices));
          }
        }
      }

      const from = Date.parse(String(req.query.fromDateTime).replace(" ", "+"));
      const to = Date.parse(String(req.query.toDateTime).replace(" ", "+"));
      return sendGygResponse(res, { data: { availabilities: availabilities.filter(slot => {
        const timestamp = Date.parse(String(slot.dateTime));
        return timestamp >= from && timestamp <= to;
      }) } });
    } catch (error: any) {
      logError("GetYourGuide availability endpoint failed", error, req.requestId);
      return sendGygResponse(res, gygError(error.errorCode || "INTERNAL_SYSTEM_FAILURE", error.message || "Failed to fetch availability."));
    }
  });

  app.post("/1/reserve/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    try {
      const data = req.body?.data || {};
      logger.info("GetYourGuide reserve request", {
        productId: data.productId,
        dateTime: data.dateTime,
        gygBookingReference: data.gygBookingReference,
        bookingItems: data.bookingItems,
      });
      const config = resolveGygProduct(data.productId);
      if (!config) {
        return sendGygResponse(res, gygError("INVALID_PRODUCT", "This activity should be deactivated; not sellable."));
      }

      const parts = gygDateParts(data.dateTime);
      if (!parts || !data.gygBookingReference) {
        return sendGygResponse(res, gygError("VALIDATION_FAILURE", "productId, dateTime, bookingItems, and gygBookingReference are required."));
      }

      const itemError = validateGygBookingItems(config, data.bookingItems);
      if (itemError) return sendGygResponse(res, itemError);

      const visitTime = config.timeMode === "time_period" ? "09:00" : parts.time;
      const requestedUnits = getGygUnitCount(config, data.bookingItems);
      if (isGygDateBlocked(config, parts.date)
        || (config.timeMode === "time_point" && !GYG_DEFAULT_START_TIMES.includes(visitTime))
        || Date.parse(formatGygDateTime(parts.date, visitTime)) <= Date.now() + GYG_CUTOFF_SECONDS * 1000) {
        return sendGygResponse(res, gygError("NO_AVAILABILITY", "This departure is unavailable or past its booking cutoff."));
      }

      const reservationReference = makeGygReservationReference();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      const reservation = await getGygStore().reserve({
        reservationReference,
        gygBookingReference: data.gygBookingReference,
        productId: config.productId,
        dateTime: data.dateTime,
        visitDate: parts.date,
        visitTime,
        pricingMode: config.pricingMode,
        timeMode: config.timeMode,
        participantCount: getGygParticipantCount(data.bookingItems),
        unitCount: requestedUnits,
        bookingItems: data.bookingItems,
        expiresAt,
        status: "reserved",
      }, GYG_MAX_PEOPLE_PER_SLOT, GYG_MAX_GROUPS_PER_SLOT);

      return sendGygResponse(res, {
        data: {
          reservationReference: reservation.reservationReference,
          reservationExpiration: formatGygReservationExpiration(reservation.expiresAt),
        },
      });
    } catch (error: any) {
      logError("GetYourGuide reserve endpoint failed", error, req.requestId);
      return sendGygResponse(res, gygError(error.errorCode || "INTERNAL_SYSTEM_FAILURE", error.message || "Failed to reserve availability."));
    }
  });

  app.post("/1/cancel-reservation/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    try {
      const data = req.body?.data || {};
      logger.info("GetYourGuide cancel-reservation request", {
        reservationReference: data.reservationReference,
        gygBookingReference: data.gygBookingReference,
      });
      if (!data.reservationReference || !data.gygBookingReference) {
        return sendGygResponse(res, gygError("VALIDATION_FAILURE", "Reservation and GetYourGuide references are required."));
      }
      await getGygStore().cancelReservation(data.reservationReference, data.gygBookingReference);
      return sendGygResponse(res, { data: {} });
    } catch (error: any) {
      logError("GetYourGuide cancel-reservation endpoint failed", error, req.requestId);
      return sendGygResponse(res, gygError(error.errorCode || "INTERNAL_SYSTEM_FAILURE", error.message || "Failed to cancel reservation."));
    }
  });

  app.post("/1/book/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    try {
      const data = req.body?.data || {};
      logger.info("GetYourGuide book request", {
        productId: data.productId,
        dateTime: data.dateTime,
        reservationReference: data.reservationReference,
        gygBookingReference: data.gygBookingReference,
      });
      const config = resolveGygProduct(data.productId);
      if (!config) {
        return sendGygResponse(res, gygError("INVALID_PRODUCT", "This activity should be deactivated; not sellable."));
      }

      const parts = gygDateParts(data.dateTime);
      const itemError = validateGygBookingItems(config, data.bookingItems);
      if (!parts || itemError) {
        return sendGygResponse(res, itemError || gygError("VALIDATION_FAILURE", "A valid dateTime and bookingItems are required."));
      }

      const traveler = data.travelers?.[0] || {};
      const visitorName = [traveler.firstName, traveler.lastName].filter(Boolean).join(" ").trim() || "GetYourGuide Traveler";
      const participantCount = getGygParticipantCount(data.bookingItems);
      const visitTime = config.timeMode === "time_period" ? "09:00" : parts.time;
      const retailPrices = await getGygRetailPrices(config);
      const totalAmount = data.bookingItems.reduce((total: number, item: any) => total
        + (Number.isInteger(item.retailPrice) && item.retailPrice >= 0 ? item.retailPrice : retailPrices.find(price => price.category === item.category)?.price || 0) * item.count, 0);
      const bookingReference = makeGygBookingReference();

      const booking = await getGygStore().confirm(data, {
        bookingReference,
        source: "getyourguide",
        externalReferenceId: data.gygBookingReference,
        visitorName,
        visitorEmail: traveler.email || `gyg-${data.gygBookingReference}@getyourguide.invalid`,
        visitorPhone: traveler.phoneNumber || "Not provided",
        visitorCountry: traveler.country || traveler.countryCode || data.country || null,
        visitDate: parts.date,
        visitTime,
        groupSize: participantCount > 5 ? "large_group" : participantCount > 1 ? "small_group" : "individual",
        numberOfPeople: participantCount,
        tourType: "standard",
        paymentMethod: "card",
        paymentStatus: "paid",
        status: "confirmed",
        totalAmount,
        specialRequests: [
          data.comment || "",
          "Created by GetYourGuide Supplier API.",
          `GYG booking reference: ${data.gygBookingReference}`,
          `Reservation reference: ${data.reservationReference}`,
          data.language ? `Language: ${data.language}` : "",
          data.travelerHotel ? `Traveler hotel: ${data.travelerHotel}` : "",
        ].filter(Boolean).join("\n"),
      });

      return sendGygResponse(res, {
        data: {
          bookingReference: booking.bookingReference,
          tickets: buildGygTickets(booking.bookingReference, data.bookingItems),
        },
      });
    } catch (error: any) {
      logError("GetYourGuide book endpoint failed", error, req.requestId);
      return sendGygResponse(res, gygError(error.errorCode || "INTERNAL_SYSTEM_FAILURE", error.message || "Failed to create booking."));
    }
  });

  app.post("/1/cancel-booking/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    try {
      const data = req.body?.data || {};
      logger.info("GetYourGuide cancel-booking request", {
        productId: data.productId,
        bookingReference: data.bookingReference,
        gygBookingReference: data.gygBookingReference,
      });
      const config = resolveGygProduct(data.productId);
      if (!config) {
        return sendGygResponse(res, gygError("INVALID_PRODUCT", "This activity should be deactivated; not sellable."));
      }

      if (!data.bookingReference || !data.gygBookingReference) {
        return sendGygResponse(res, gygError("VALIDATION_FAILURE", "Booking and GetYourGuide references are required."));
      }
      await getGygStore().cancelBooking(data.bookingReference, data.gygBookingReference,
        typeof data.cancellationReason === "string" ? data.cancellationReason : typeof data.reason === "string" ? data.reason : null,
        getGygLocalDate());

      return sendGygResponse(res, { data: {} });
    } catch (error: any) {
      logError("GetYourGuide cancel-booking endpoint failed", error, req.requestId);
      return sendGygResponse(res, gygError(error.errorCode || "INTERNAL_SYSTEM_FAILURE", error.message || "Failed to cancel booking."));
    }
  });

  app.get("/1/products/:productId/pricing-categories/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    const config = resolveGygProduct(req.params.productId);
    if (!config) {
      return sendGygResponse(res, gygError("INVALID_PRODUCT", "This product does not exist."));
    }

    const retailPrices = await getGygRetailPrices(config);
    return sendGygResponse(res, {
      data: {
        pricingCategories: retailPrices.map(({ category, price }) => ({
          category,
          minTicketAmount: 1,
          maxTicketAmount: config.pricingMode === "group" ? GYG_MAX_GROUPS_PER_SLOT : GYG_MAX_PEOPLE_PER_SLOT,
          groupSizeMin: config.pricingMode === "group" ? 1 : null,
          groupSizeMax: config.pricingMode === "group" ? GYG_MAX_PEOPLE_PER_SLOT : null,
          ageFrom: category === "ADULT" ? 18 : category === "CHILD" ? 0 : null,
          ageTo: category === "ADULT" ? 99 : category === "CHILD" ? 17 : null,
          bookingCategory: "STANDARD",
          price: [{ priceType: "RETAIL_PRICE", price, currency: GYG_CURRENCY }],
        })),
      },
    });
  });

  app.get("/1/products/:productId/addons/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    const config = resolveGygProduct(req.params.productId);
    if (!config) {
      return sendGygResponse(res, gygError("INVALID_PRODUCT", "This product does not exist."));
    }

    return sendGygResponse(res, { data: { addons: [] } });
  });

  app.get("/1/products/:productId", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    const config = resolveGygProduct(req.params.productId);
    if (!config) {
      return sendGygResponse(res, gygError("INVALID_PRODUCT", "This product does not exist."));
    }

    return sendGygResponse(res, {
      data: {
        supplierId: GYG_SUPPLIER_ID,
        productTitle: GYG_PRODUCT_TITLE,
        productDescription: "A guided walking tour of Dzaleka Refugee Camp led by local community guides.",
        destinationLocation: {
          city: "Dowa",
          country: "MWI",
        },
        configuration: {
          participantsConfiguration: {
            min: 1,
            max: GYG_MAX_PEOPLE_PER_SLOT,
          },
        },
      },
    });
  });

  app.get("/1/suppliers/:supplierId/products/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    if (req.params.supplierId !== GYG_SUPPLIER_ID) {
      return sendGygResponse(res, gygError("INVALID_SUPPLIER", "Supplier does not exist in the system."));
    }

    const ids = getGygSelfTestProductIds();
    return sendGygResponse(res, {
      data: {
        supplierId: GYG_SUPPLIER_ID,
        supplierName: GYG_SUPPLIER_NAME,
        products: [
          { productId: ids.timePointIndividual, productTitle: `${GYG_PRODUCT_TITLE} - Fixed time individual` },
          { productId: ids.timePointGroup, productTitle: `${GYG_PRODUCT_TITLE} - Fixed time group` },
          { productId: ids.timePeriodIndividual, productTitle: `${GYG_PRODUCT_TITLE} - Operating hours individual` },
          { productId: ids.timePeriodGroup, productTitle: `${GYG_PRODUCT_TITLE} - Operating hours group` },
        ],
      },
    });
  });

  app.post("/1/notify/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;
    logger.warn("GetYourGuide product notification received", req.body?.data || {});
    return sendGygResponse(res, { data: {} });
  });
}

