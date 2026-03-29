import { config } from "../config";

/** Private-use Unicode range used by Google Maps for icon glyphs. */
const PRIVATE_USE_REGEX = /[\uE000-\uF8FF]/g;

/**
 * Cleans text scraped from Google Maps: removes icon glyphs, leading symbols,
 * normalizes whitespace.
 */
export function cleanScrapedText(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") return null;

  let result = value
    .replace(PRIVATE_USE_REGEX, "")
    .replace(/\s+/g, " ")
    .trim();

  result = result.replace(/^[^\p{L}\p{N}]+/u, "").trim();

  return result.length ? result : null;
}

/**
 * Normalizes address for output: cleans scraped text and removes trailing
 * country name (e.g. ", Germany", ", Deutschland").
 */
export function normalizeAddressForOutput(address: string | null): string | null {
  const cleaned = cleanScrapedText(address);
  if (!cleaned) return null;

  const countryNamesToRemove = [...config.geo.allowedCountryNames];

  let result = cleaned;
  for (const name of countryNamesToRemove) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`,\\s*${escaped}\\s*$`, "i");
    result = result.replace(regex, "").trim();
  }

  return result.length ? result : null;
}
