import type { Locator, Page } from "playwright";
import { config } from "../config";
import type { PlaceSeed } from "../types";

function normalizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length ? cleaned : null;
}

function absolutizeGoogleMapsHref(href: string | null): string | null {
  if (!href) return null;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("/")) return `https://www.google.com${href}`;
  return href;
}

function parseGoogleMapsHref(href: string | null): {
  cid: string | null;
  lat: number | null;
  lng: number | null;
} {
  if (!href) {
    return {
      cid: null,
      lat: null,
      lng: null,
    };
  }

  const cidMatch = href.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i);
  const latMatch = href.match(/!3d(-?\d+(?:\.\d+)?)/);
  const lngMatch = href.match(/!4d(-?\d+(?:\.\d+)?)/);

  return {
    cid: cidMatch ? cidMatch[1] : null,
    lat: latMatch ? Number(latMatch[1]) : null,
    lng: lngMatch ? Number(lngMatch[1]) : null,
  };
}

export async function clickSearchThisArea(page: Page): Promise<boolean> {
  const el = page.locator(config.search.searchThisAreaButtonSelector).first();

  try {
    if (!(await el.isVisible())) {
      console.log("[search] button not found");
      await page.waitForTimeout(config.search.resultsSettleMs);
      return false;
    }

    console.log("[search] clicking 'Search this area'...");
    await el.click();
    await page.waitForTimeout(config.search.resultsSettleMs);
    return true;
  } catch {
    console.log("[search] button not found");
    await page.waitForTimeout(config.search.resultsSettleMs);
    return false;
  }
}

export async function getResultsFeed(page: Page): Promise<Locator | null> {
  const candidates = [
    'div[role="feed"]',
    '.m6QErb[aria-label]',
    '[role="main"] [role="feed"]',
    'div.m6QErb.DxyBCb',
  ];

  for (const selector of candidates) {
    const locator = page.locator(selector).first();

    try {
      if (!(await locator.isVisible())) continue;

      const box = await locator.boundingBox();
      if (!box) continue;
      if (box.width < 250 || box.height < 300) continue;

      return locator;
    } catch {
      // ignore
    }
  }

  return null;
}

export async function collectVisibleSeeds(page: Page): Promise<PlaceSeed[]> {
  const feed = await getResultsFeed(page);
  if (!feed) return [];

  const cards = feed.locator('.Nv2PK');
  const count = await cards.count();
  const results: PlaceSeed[] = [];

  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);

    try {
      const text = normalizeText(await card.textContent());
      if (!text) continue;

      const lines = text
        .split("\n")
        .map((line) => normalizeText(line))
        .filter((line): line is string => Boolean(line));

      const name = lines[0] ?? null;

      let href: string | null = null;

      try {
        const anchor = card.locator('a[href*="/maps/place/"], a[href*="/place/"]').first();
        if (await anchor.count()) {
          href = await anchor.getAttribute("href");
        }
      } catch {
        // ignore
      }

      if (!href) {
        try {
          href = await card.getAttribute("href");
        } catch {
          // ignore
        }
      }

      href = absolutizeGoogleMapsHref(href);

      const parsed = parseGoogleMapsHref(href);
      const id = parsed.cid ?? href ?? `${name ?? "unknown"}::${i}`;

      results.push({
        id,
        cid: parsed.cid,
        name,
        lat: parsed.lat,
        lng: parsed.lng,
        href,
      });
    } catch {
      // ignore broken card
    }
  }

  return results;
}