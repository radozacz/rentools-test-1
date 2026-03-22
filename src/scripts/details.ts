import { chromium } from "playwright";
import { loadSeedsFromJson, saveFinalToJson } from "../utils/storage";
import type { PlaceDetails } from "../types";
import { scrapePlaceDetails } from "../utils/details-scraper";
import {
  getDedupeKey,
  shouldKeepRecord,
  detectCountryFromAddress,
} from "../utils/details-filters";
import { config } from "../config";

const { seedsJsonPath, detailsJsonPath } = config.output

async function main() {
  const seeds = loadSeedsFromJson(seedsJsonPath);

  console.log(`[details] loaded seeds: ${seeds.length}`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 30,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  const finalMap = new Map<string, PlaceDetails>();

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i]!;

    console.log(`[details] ${i + 1}/${seeds.length} -> ${seed.name ?? seed.id}`);

    try {
      const record = await scrapePlaceDetails(page, seed);
      const detectedCountry = detectCountryFromAddress(record.address);

      console.log({
        placeId: record.placeId,
        cid: record.cid,
        name: record.name,
        address: record.address,
        phone: record.phone,
        website: record.website,
        lat: record.lat,
        lng: record.lng,
        detectedCountry,
      });

      if (!shouldKeepRecord(record)) {
        console.log(`[details] skipped: not confidently in ${config.geo.countryName}`);
        continue;
      }

      const key = getDedupeKey(record);
      const existing = finalMap.get(key);

      if (!existing) {
        finalMap.set(key, record);
      } else {
        finalMap.set(key, {
          placeId: existing.placeId ?? record.placeId,
          cid: existing.cid ?? record.cid,
          sourceId: existing.sourceId ?? record.sourceId,
          name: existing.name ?? record.name,
          address: existing.address ?? record.address,
          phone: existing.phone ?? record.phone,
          website: existing.website ?? record.website,
          lat: existing.lat ?? record.lat,
          lng: existing.lng ?? record.lng,
        });
      }

      saveFinalToJson(detailsJsonPath, [...finalMap.values()]);
    } catch (error) {
      console.error("[details] failed:", seed.href, error);
    }
  }

  await browser.close();

  console.log(`[details] done. final records: ${finalMap.size}`);
  console.log(`[details] saved to: ${detailsJsonPath}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
