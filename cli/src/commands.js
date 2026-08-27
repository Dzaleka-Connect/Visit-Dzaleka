/**
 * Command implementations. Each returns the lines to print, so they can be
 * asserted in tests without capturing stdout.
 */

import { apiGet, endpoints, formatMwk, labelForGroupSize } from "./api.js";

const pad = (value, width) => String(value).padEnd(width);

export const HELP = `visit-dzaleka - query the Visit Dzaleka public API

Usage
  visit-dzaleka <command> [options]

Commands
  pricing              Current tour prices by group size
  zones                Camp zones a tour can cover
  meeting-points       Where a guided tour can start
  points-of-interest   Markets, cultural sites and community projects
  offers               Active public discounts
  transport            Operators driving visitors from Lilongwe
  events               Community events (add --upcoming to filter)
  blog                 Published articles and travel guides
  search <query>       Search community services, events and resources
  verify <reference>   Check a booking reference such as DVS-2024-001
  endpoints            List every public API operation
  help                 Show this message

Options
  --json               Print the raw JSON response
  --upcoming           events only: hide events that have already happened
  --limit <n>          Limit rows where the command supports it
  --base-url <url>     Point at another deployment (default https://visit.dzaleka.com)

Examples
  visit-dzaleka pricing
  visit-dzaleka events --upcoming --limit 5
  visit-dzaleka pricing --json | jq '.[0].basePrice'

No API key is required. Docs: https://visit.dzaleka.com/developers`;

/** Parse argv into a command, positional arguments and flags. */
export function parseArgs(argv) {
  const [command = "help", ...rest] = argv;
  const positional = [];
  const flags = { json: false, upcoming: false, limit: null, baseUrl: undefined };

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === "--json") flags.json = true;
    else if (arg === "--upcoming") flags.upcoming = true;
    else if (arg === "--limit") flags.limit = Number.parseInt(rest[++i], 10) || null;
    else if (arg === "--base-url") flags.baseUrl = rest[++i];
    else if (!arg.startsWith("--")) positional.push(arg);
  }

  return { command, positional, flags };
}

function limited(items, limit) {
  return typeof limit === "number" && limit > 0 ? items.slice(0, limit) : items;
}

async function pricing(_positional, flags, options) {
  const configs = await apiGet(endpoints.pricing, options);
  if (flags.json) return [JSON.stringify(configs, null, 2)];

  const lines = ["Tour pricing", ""];
  for (const config of configs) {
    lines.push(`  ${pad(labelForGroupSize(config.groupSize), 28)} ${formatMwk(config.basePrice)}`);
  }
  const extra = configs.find((c) => c.additionalHourPrice != null);
  if (extra) {
    lines.push("", `  Each hour beyond the standard 2: ${formatMwk(extra.additionalHourPrice)}`);
  }
  lines.push("", "  Prices change; read them live rather than caching.");
  return lines;
}

function namedList(title, path, { nameKey = "name", descriptionKey = "description" } = {}) {
  return async (_positional, flags, options) => {
    const items = await apiGet(path, options);
    if (flags.json) return [JSON.stringify(items, null, 2)];
    if (!items.length) return [`No ${title.toLowerCase()} found.`];

    const lines = [title, ""];
    for (const item of limited(items, flags.limit)) {
      lines.push(`  ${item[nameKey] ?? item.title ?? item.id}`);
      const description = item[descriptionKey];
      if (description) lines.push(`    ${String(description).slice(0, 140)}`);
    }
    return lines;
  };
}

async function events(_positional, flags, options) {
  const payload = await apiGet(endpoints.events, options);
  let list = payload?.data?.events ?? [];
  if (flags.upcoming) list = list.filter((event) => event.status === "upcoming");
  if (flags.json) return [JSON.stringify(list, null, 2)];
  if (!list.length) return [flags.upcoming ? "No upcoming events." : "No events found."];

  const lines = [flags.upcoming ? "Upcoming events" : "Community events", ""];
  for (const event of limited(list, flags.limit)) {
    const date = event.date ? new Date(event.date).toISOString().slice(0, 10) : "date TBC";
    lines.push(`  ${pad(date, 12)} ${event.title}`);
    if (event.location) lines.push(`               ${event.location}`);
  }
  return lines;
}

async function blog(_positional, flags, options) {
  const posts = await apiGet(endpoints.blog, options);
  if (flags.json) return [JSON.stringify(posts, null, 2)];
  const lines = ["Blog posts", ""];
  for (const post of limited(posts, flags.limit)) {
    lines.push(`  ${post.title}`);
    lines.push(`    https://visit.dzaleka.com/blog/${post.slug}`);
  }
  return lines;
}

async function search(positional, flags, options) {
  const query = positional.join(" ").trim();
  if (!query) throw new Error("search needs a query, e.g. `visit-dzaleka search music`");
  const payload = await apiGet(endpoints.search(query), options);
  if (flags.json) return [JSON.stringify(payload, null, 2)];
  return [`Results for "${query}"`, "", JSON.stringify(payload?.data ?? {}, null, 2)];
}

async function verify(positional, flags, options) {
  const [reference] = positional;
  if (!reference) throw new Error("verify needs a booking reference, e.g. `visit-dzaleka verify DVS-2024-001`");
  const result = await apiGet(endpoints.verify(reference), options);
  if (flags.json) return [JSON.stringify(result, null, 2)];
  if (!result?.valid) return [`${reference} is not a recognised booking reference.`];
  return [
    `${reference} is valid.`,
    result.status ? `  Status: ${result.status}` : null,
    result.tourDate ? `  Tour date: ${result.tourDate}` : null,
  ].filter(Boolean);
}

async function endpointList(_positional, flags, options) {
  const index = await apiGet(endpoints.index, options);
  if (flags.json) return [JSON.stringify(index, null, 2)];
  const lines = [`${index.name} v${index.version}`, "", `  ${index.endpointCount} public operations, no authentication`, ""];
  for (const endpoint of index.endpoints ?? []) {
    lines.push(`  ${pad(endpoint.method, 5)} ${pad(endpoint.path, 44)} ${endpoint.summary}`);
  }
  lines.push("", `  Spec: ${index.openapi}`);
  return lines;
}

export const COMMANDS = {
  pricing,
  zones: namedList("Camp zones", endpoints.zones),
  "meeting-points": namedList("Meeting points", endpoints.meetingPoints),
  "points-of-interest": namedList("Points of interest", endpoints.pointsOfInterest),
  offers: namedList("Special offers", endpoints.offers),
  transport: namedList("Transport partners", endpoints.transport),
  events,
  blog,
  search,
  verify,
  endpoints: endpointList,
};

/** Run a parsed command. Returns printable lines. */
export async function run(argv, options = {}) {
  const { command, positional, flags } = parseArgs(argv);

  if (command === "help" || command === "--help" || command === "-h") return [HELP];
  if (command === "--version" || command === "version") return ["visit-dzaleka 1.0.0"];

  const handler = COMMANDS[command];
  if (!handler) {
    throw new Error(`Unknown command "${command}". Run \`visit-dzaleka help\` for the list.`);
  }

  return handler(positional, flags, { ...options, baseUrl: flags.baseUrl ?? options.baseUrl });
}
