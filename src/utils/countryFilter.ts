import { config } from "../config";
import type { PlaceSeed } from "../types";
import type { Polygon } from "./geometry";
import { isPointInPolygon } from "./geometry";

function hasUsableCoords(seed: PlaceSeed): boolean {
  return (
    seed.lat != null &&
    seed.lng != null &&
    !Number.isNaN(seed.lat) &&
    !Number.isNaN(seed.lng)
  );
}

function normalizeForMatch(value: string | null | undefined): string {
  return (value ?? "").toLowerCase();
}

function containsAnyName(
  addressLower: string,
  names: readonly string[],
): boolean {
  return names.some((name) =>
    addressLower.includes(name.toLowerCase()),
  );
}

function addressHasBlockedCountry(address: string | null | undefined): boolean {
  return containsAnyName(
    normalizeForMatch(address),
    config.geo.blockedCountryNames,
  );
}

function addressHasAllowedCountry(address: string | null | undefined): boolean {
  return containsAnyName(
    normalizeForMatch(address),
    config.geo.allowedCountryNames,
  );
}

/**
 * Layered country gate: polygon (when coords exist), then blocked names in address,
 * then for no-coords seeds: allowed-name hint or accept with verification warning.
 */
export function shouldKeepSeedForCountry(
  seed: PlaceSeed,
  polygon: Polygon,
): boolean {
  const title = seed.title ?? "null";
  const address = seed.address ?? "null";

  if (hasUsableCoords(seed)) {
    const inside = isPointInPolygon(
      { lat: seed.lat as number, lng: seed.lng as number },
      polygon,
    );
    if (!inside) {
      console.log(
        `[country-filter] rejected by polygon: title=${title}, lat=${seed.lat}, lng=${seed.lng}`,
      );
      return false;
    }
  }

  if (addressHasBlockedCountry(seed.address)) {
    console.log(
      `[country-filter] rejected by blocked country: title=${title}, address=${address}`,
    );
    return false;
  }

  if (!hasUsableCoords(seed)) {
    if (addressHasAllowedCountry(seed.address)) {
      return true;
    }
    console.log(
      `[country-filter] accepted but country not fully verified: title=${title}`,
    );
    return true;
  }

  return true;
}
