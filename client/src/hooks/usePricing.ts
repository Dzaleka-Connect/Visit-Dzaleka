import { useQuery } from "@tanstack/react-query";
import type { PricingConfig } from "@shared/schema";
import { PRICING } from "@/lib/constants";

export type GroupSizeKey = keyof typeof PRICING;

export type PricingMap = {
  individual: number;
  small_group: number;
  large_group: number;
  custom: number;
  additional_hour: number;
};

const FALLBACK: PricingMap = {
  individual: PRICING.individual,
  small_group: PRICING.small_group,
  large_group: PRICING.large_group,
  custom: PRICING.custom,
  additional_hour: PRICING.additional_hour,
};

function toMap(configs: PricingConfig[] | undefined): PricingMap {
  if (!configs?.length) return FALLBACK;

  const byGroup = new Map(configs.map((c) => [c.groupSize, c]));
  const priceFor = (key: keyof typeof FALLBACK) =>
    byGroup.get(key as PricingConfig["groupSize"])?.basePrice ?? FALLBACK[key];

  return {
    individual: priceFor("individual"),
    small_group: priceFor("small_group"),
    large_group: priceFor("large_group"),
    custom: priceFor("custom"),
    additional_hour:
      configs.find((c) => c.additionalHourPrice != null)?.additionalHourPrice ??
      FALLBACK.additional_hour,
  };
}

/**
 * Live tour pricing from the database, with the constants in `lib/constants`
 * as a fallback while loading or if the request fails.
 *
 * Reads the public endpoint so it works on unauthenticated marketing pages.
 */
export function usePricing() {
  const { data, isLoading, isError } = useQuery<PricingConfig[]>({
    queryKey: ["/api/public/pricing"],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const pricing = toMap(data ?? undefined);

  /** e.g. 15000 -> "MWK 15,000" */
  const price = (key: keyof PricingMap) => `MWK ${pricing[key].toLocaleString("en-US")}`;

  /** e.g. 15000 -> "15000", for schema.org offers */
  const priceValue = (key: keyof PricingMap) => String(pricing[key]);

  return { pricing, price, priceValue, isLoading, isError };
}
