import dns from "dns";
import { promisify } from "util";

const dnsLookup = promisify(dns.lookup);

/**
 * Validates whether a URL string meets basic public endpoint criteria:
 * - Must use HTTPS protocol
 * - Hostname cannot be localhost, loopback, or a private/link-local IP block.
 */
export function isValidWebhookUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;

    const hostname = url.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "loopback" || hostname === "[::1]") return false;

    // IPv4 check:
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv4Match = hostname.match(ipv4Regex);
    if (ipv4Match) {
      const p1 = parseInt(ipv4Match[1]);
      const p2 = parseInt(ipv4Match[2]);
      if (p1 === 127 || p1 === 10 || p1 === 0 || p1 >= 224) return false;
      if (p1 === 172 && p2 >= 16 && p2 <= 31) return false;
      if (p1 === 192 && p2 === 168) return false;
      if (p1 === 169 && p2 === 254) return false;
      return true;
    }

    // IPv6 check:
    if (hostname.startsWith("[") && hostname.endsWith("]")) {
      const ipv6 = hostname.slice(1, -1);
      if (
        ipv6 === "::1" ||
        ipv6 === "::" ||
        ipv6.startsWith("fe80:") ||
        ipv6.startsWith("fc00:") ||
        ipv6.startsWith("fd00:")
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves the hostname of the URL to ensure it does not map to a private or local IP.
 */
export async function isSafeDestination(urlStr: string): Promise<boolean> {
  if (!isValidWebhookUrl(urlStr)) return false;
  const url = new URL(urlStr);
  try {
    const { address } = await dnsLookup(url.hostname);
    return isValidWebhookUrl(`https://${address}`);
  } catch {
    // If DNS resolution fails, block the request to be safe
    return false;
  }
}
