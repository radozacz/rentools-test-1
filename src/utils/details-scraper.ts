import type { Page } from "playwright";
import type { PlaceDetails, PlaceSeed } from "../types";
import { cleanScrapedText, normalizeAddressForOutput } from "./text";
import { parseCenterFromGoogleMapsUrl } from "./map";
import { extractPlaceIdFromMapsUrl } from "./placeId";

async function getTextFromFirstVisible(
  page: Page,
  selectors: string[],
): Promise<string | null> {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();

    try {
      if (!(await locator.count())) continue;
      if (!(await locator.isVisible())) continue;

      const text = cleanScrapedText(await locator.textContent());
      if (text) return text;
    } catch {
      // ignore
    }
  }

  return null;
}

async function getHrefFromFirstVisible(
  page: Page,
  selectors: string[],
): Promise<string | null> {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();

    try {
      if (!(await locator.count())) continue;
      if (!(await locator.isVisible())) continue;

      const href = await locator.getAttribute("href");
      if (href) return href;
    } catch {
      // ignore
    }
  }

  return null;
}

function extractCidFromUrl(url: string): string | null {
  const match = url.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i);
  return match ? match[1] : null;
}

export async function scrapePlaceDetails(
  page: Page,
  seed: PlaceSeed,
): Promise<PlaceDetails> {
  if (!seed.href) {
    return {
      placeId: seed.placeId ?? null,
      cid: seed.cid,
      sourceId: seed.id,
      name: seed.name,
      address: null,
      phone: null,
      website: null,
      lat: seed.lat,
      lng: seed.lng,
    };
  }

  await page.goto(seed.href, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  await page.waitForTimeout(3500);

  const currentUrl = page.url();
  const { center: parsedCenter } = parseCenterFromGoogleMapsUrl(currentUrl);

  const rawName = await getTextFromFirstVisible(page, [
    "h1",
    ".DUwDvf",
  ]);

  const rawAddress = await getTextFromFirstVisible(page, [
    'button[data-item-id*="address"]',
    'button[aria-label*="Address"]',
    'button[aria-label*="Adres"]',
    'button[aria-label*="Adresse"]',
  ]);

  const rawPhone = await getTextFromFirstVisible(page, [
    'button[data-item-id^="phone"]',
    'button[aria-label*="Phone"]',
    'button[aria-label*="Telefon"]',
  ]);

  const name = rawName;
  const address = normalizeAddressForOutput(rawAddress);
  const phone = rawPhone;

  const website = await getHrefFromFirstVisible(page, [
    'a[data-item-id="authority"]',
    'a[aria-label*="Website"]',
    'a[aria-label*="Witryna"]',
    'a[aria-label*="Webseite"]',
  ]);

  const placeIdFromPage = extractPlaceIdFromMapsUrl(currentUrl);
  if (placeIdFromPage === null && !(seed.placeId ?? null)) {
    console.debug(`[placeId] not found in url: ${currentUrl}`);
  }
  const placeId = placeIdFromPage ?? seed.placeId ?? null;
  const cid = extractCidFromUrl(currentUrl) ?? seed.cid;

  return {
    placeId,
    cid,
    sourceId: seed.id,
    name: name ?? seed.name,
    address,
    phone,
    website,
    lat: parsedCenter?.lat ?? seed.lat ?? null,
    lng: parsedCenter?.lng ?? seed.lng ?? null,
  };
}