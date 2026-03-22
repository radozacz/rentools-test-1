import type { PlaceDetails } from "../types";
import { config } from "../config";
import { isPointInPolygon, loadCountryPolygon } from "./geometry";

const countryPolygon = loadCountryPolygon(config.geo.polygonPath);
const allowedTerms = config.geo.allowedCountryNames.map((n) => n.toLowerCase());
const blockedTerms = config.geo.blockedCountryNames.map((n) => n.toLowerCase());

export function isInsideCountryPolygon(lat: number | null, lng: number | null): boolean {
  if (lat === null || lng === null) return false;

  return isPointInPolygon({ lat, lng }, countryPolygon);
}

export function normalizeAddress(address: string | null): string | null {
  if (!address) return null;
  const value = address.replace(/\s+/g, " ").trim();
  return value.length ? value : null;
}

export function detectCountryFromAddress(address: string | null): string | null {
  const normalized = normalizeAddress(address)?.toLowerCase() ?? null;
  if (!normalized) return null;

  if (allowedTerms.some((term) => normalized.includes(term))) {
    return config.geo.countryName;
  }

  const blockedMatch = config.geo.blockedCountryNames.find((name) =>
    normalized.includes(name.toLowerCase()),
  );
  if (blockedMatch) return blockedMatch;

  return null;
}

export function hasBlockedCountryInAddress(address: string | null): boolean {
  const normalized = normalizeAddress(address)?.toLowerCase() ?? null;
  if (!normalized) return false;

  return blockedTerms.some((term) => normalized.includes(term));
}

export function shouldKeepRecord(record: PlaceDetails): boolean {
  const insideCountry = isInsideCountryPolygon(record.lat, record.lng);
  if (!insideCountry) return false;

  if (hasBlockedCountryInAddress(record.address)) {
    return false;
  }

  return true;
}

export function getDedupeKey(record: PlaceDetails): string {
  return (
    record.placeId ??
    record.cid ??
    record.sourceId ??
    `${record.name ?? "unknown"}::${record.address ?? "unknown"}`
  );
}
