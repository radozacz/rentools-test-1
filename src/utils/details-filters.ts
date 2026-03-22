import type { PlaceDetails } from "../types";
import { isPointInPolygon, loadGermanyPolygon } from "./geometry";

const ALLOWED_COUNTRY_TERMS = ["germany", "deutschland"];
const BLOCKED_COUNTRY_TERMS = [
  "poland",
  "polska",
  "czechia",
  "czech republic",
  "czechy",
  "austria",
  "österreich",
  "netherlands",
  "belgium",
  "france",
  "switzerland",
  "luxembourg",
  "denmark",
];

const germanyPolygon = loadGermanyPolygon();

export function isInsideGermany(lat: number | null, lng: number | null): boolean {
  if (lat === null || lng === null) return false;

  return isPointInPolygon({ lat, lng }, germanyPolygon);
}

export function normalizeAddress(address: string | null): string | null {
  if (!address) return null;
  const value = address.replace(/\s+/g, " ").trim();
  return value.length ? value : null;
}

export function detectCountryFromAddress(address: string | null): string | null {
  const normalized = normalizeAddress(address)?.toLowerCase() ?? null;
  if (!normalized) return null;

  if (ALLOWED_COUNTRY_TERMS.some((term) => normalized.includes(term))) {
    return "Germany";
  }

  if (normalized.includes("poland") || normalized.includes("polska")) return "Poland";
  if (
    normalized.includes("czechia") ||
    normalized.includes("czech republic") ||
    normalized.includes("czechy")
  ) {
    return "Czechia";
  }
  if (normalized.includes("austria") || normalized.includes("österreich")) return "Austria";
  if (normalized.includes("netherlands")) return "Netherlands";
  if (normalized.includes("belgium")) return "Belgium";
  if (normalized.includes("france")) return "France";
  if (normalized.includes("switzerland")) return "Switzerland";
  if (normalized.includes("luxembourg")) return "Luxembourg";
  if (normalized.includes("denmark")) return "Denmark";

  return null;
}

export function isSuspiciousForeignAddress(address: string | null): boolean {
  const normalized = normalizeAddress(address)?.toLowerCase() ?? null;
  if (!normalized) return false;

  return BLOCKED_COUNTRY_TERMS.some((term) => normalized.includes(term));
}

export function shouldKeepGermanRecord(record: PlaceDetails): boolean {
  const insideGermany = isInsideGermany(record.lat, record.lng);
  if (!insideGermany) return false;

  if (isSuspiciousForeignAddress(record.address)) {
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