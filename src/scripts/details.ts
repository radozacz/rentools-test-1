import { chromium } from "playwright";
import { loadSeedsFromJson, loadFinalFromJson, saveFinalToJson } from "../utils/storage";
import { scrapePlaceDetails } from "../utils/details-scraper";
import {
  shouldKeepRecord,
  detectCountryFromAddress,
} from "../utils/details-filters";
import { DetailsState } from "../utils/details-state";
import { config } from "../config";

const { seedsJsonPath, detailsJsonPath } = config.output;

async function main() {
  const seeds = loadSeedsFromJson(seedsJsonPath);
  const existingFinal = loadFinalFromJson(detailsJsonPath);
  const finalState = new DetailsState(existingFinal);

  console.log(`[startup] loaded existing seeds: ${seeds.length}`);
  console.log(`[startup] loaded existing final records: ${existingFinal.length}`);
  console.log(`[details] processing seeds: ${seeds.length}`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 30,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

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

      finalState.addOrMerge(record);
      saveFinalToJson(detailsJsonPath, finalState.getAll());
    } catch (error) {
      console.error("[details] failed:", seed.href, error);
    }
  }

  await browser.close();

  console.log(`[details] done. final records: ${finalState.size}`);
  console.log(`[details] saved to: ${detailsJsonPath}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
