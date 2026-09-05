export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

/** Preserve deep links after authentication without allowing external redirects. */
export function getPostAuthPath(search: string, role?: string | null): string {
  const fallback = role === "transport_partner" ? "/transport-partner/dashboard" : "/";
  const next = new URLSearchParams(search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//") || /[\\\s]/.test(next)) {
    return fallback;
  }

  const url = new URL(next, "https://visit.dzaleka.com");
  if (url.origin !== "https://visit.dzaleka.com" || /^\/(login|auth)(\/|$)/.test(url.pathname)) {
    return fallback;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
