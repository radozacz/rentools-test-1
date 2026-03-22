import type { Page } from "playwright";
import type { PlaceDetails, PlaceSeed } from "../types";
import { parseCenterFromGoogleMapsUrl } from "./map";

function normalizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length ? cleaned : null;
}

async function getTextFromFirstVisible(
  page: Page,
  selectors: string[],
): Promise<string | null> {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();

    try {
      if (!(await locator.count())) continue;
      if (!(await locator.isVisible())) continue;

      const text = normalizeText(await locator.textContent());
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

function extractPlaceIdFromPageUrl(url: string): string | null {
  // This is best-effort only. Real Google placeId is not always exposed clearly.
  const placeIdParam = url.match(/[?&]ftid=0x([0-9a-f:]+)/i);
  if (placeIdParam) {
    return placeIdParam[1];
  }

  const cidLike = url.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i);
  if (cidLike) {
    return cidLike[1];
  }

  return null;
}

export async function scrapePlaceDetails(
  page: Page,
  seed: PlaceSeed,
): Promise<PlaceDetails> {
  if (!seed.href) {
    return {
      placeId: null,
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

  const name = await getTextFromFirstVisible(page, [
    "h1",
    ".DUwDvf",
  ]);

  const address = await getTextFromFirstVisible(page, [
    'button[data-item-id*="address"]',
    'button[aria-label*="Address"]',
    'button[aria-label*="Adres"]',
    'button[aria-label*="Adresse"]',
  ]);

  const phone = await getTextFromFirstVisible(page, [
    'button[data-item-id^="phone"]',
    'button[aria-label*="Phone"]',
    'button[aria-label*="Telefon"]',
  ]);

  const website = await getHrefFromFirstVisible(page, [
    'a[data-item-id="authority"]',
    'a[aria-label*="Website"]',
    'a[aria-label*="Witryna"]',
    'a[aria-label*="Webseite"]',
  ]);

  const placeId = extractPlaceIdFromPageUrl(currentUrl);
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