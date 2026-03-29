import type { Locator, Page } from "playwright";
import { config } from "../config";
import type { PlaceSeed } from "../types";
import { getGoogleMapsOrigin } from "./map";
import { extractPlaceIdFromMapsUrl } from "./placeId";

function normalizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length ? cleaned : null;
}

function absolutizeGoogleMapsHref(href: string | null): string | null {
  if (!href) return null;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("/")) return `${getGoogleMapsOrigin()}${href}`;
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

/**
 * Collects `a[href]` under the card, absolutizes, then picks first non-Google href
 * or the last anchor if all are Google.
 */
function pickWebsiteHrefFromAnchors(absoluteHrefs: string[]): string | null {
  if (absoluteHrefs.length === 0) return null;
  const nonGoogle = absoluteHrefs.filter(
    (h) => !h.toLowerCase().includes(config.map.googleMapsBaseUrl),
  );
  if (nonGoogle.length > 0) {
    return nonGoogle[0] ?? null;
  }
  if (!config.scraping.allowGoogleWebsiteFallback) {
    return null;
  }
  return absoluteHrefs[absoluteHrefs.length - 1] ?? null
}

async function collectAnchorHrefs(card: Locator): Promise<string[]> {
  const links = card.locator(config.selectors.card.websiteLinks);
  const n = await links.count();
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    try {
      const raw = await links.nth(i).getAttribute("href");
      const abs = absolutizeGoogleMapsHref(raw);
      if (abs) out.push(abs.trim());
    } catch {
      console.debug("[result-card] failed to read anchor href", { index: i });
    }
  }
  return out;
}

/** Primary place link for cid / placeId / lat / lng (same as before). */
async function resolvePrimaryPlaceHref(card: Locator): Promise<string | null> {
  try {
    const anchor = card
      .locator(config.selectors.card.primaryPlaceLink)
      .first();
    if ((await anchor.count()) > 0) {
      return absolutizeGoogleMapsHref(await anchor.getAttribute("href"));
    }
  } catch {
    console.debug("[result-card] primary place link not found");
  }
  try {
    return absolutizeGoogleMapsHref(await card.getAttribute("href"));
  } catch {
    return null;
  }
}

/**
 * Parses one results-list row (`role="article"`). All selectors are scoped to `card`.
 */
export async function extractPlaceSeedFromArticleCard(
  card: Locator,
  index: number,
): Promise<PlaceSeed | null> {
  let title: string | null = null;
  let category: string | null = null;
  let address: string | null = null;
  let phone: string | null = null;
  let website: string | null = null;

  try {
    try {
      const t = await card
        .locator(config.selectors.card.title)
        .first()
        .textContent();
      title = normalizeText(t);
    } catch (e) {
      console.debug("[result-card] title extraction failed", { index, e });
    }

    try {
      const blocks = card.locator(config.selectors.card.categoryBlock);
      const blockCount = await blocks.count();
      if (blockCount >= 2) {
        const secondBlock = blocks.nth(1);
        try {
          const c = await secondBlock
            .locator(config.selectors.card.categorySecondBlockInner)
            .first()
            .textContent();
          category = normalizeText(c);
        } catch (e) {
          console.debug("[result-card] category extraction failed", { index, e });
        }
      }
    } catch (e) {
      console.debug("[result-card] category block failed", { index, e });
    }

    try {
      const addrLoc = card
        .locator(config.selectors.card.address)
        .first();
      const a = await addrLoc.textContent();
      address = normalizeText(a);
    } catch (e) {
      console.debug("[result-card] address extraction failed", { index, e });
    }

    // Log HTML
    // const html = await card.evaluate((el) => el.outerHTML);
    // console.log("=== CARD HTML ===");
    // console.log(html);

    try {
      const phoneEl = card.locator(config.selectors.card.phone);
      if ((await phoneEl.count()) > 0) {
        const raw = await phoneEl.textContent();
        phone = (normalizeText(raw) || "").replace(/\s+/g, "");
      }
    } catch (e) {
      console.debug("[result-card] phone extraction failed", { index, e });
    }

    try {
      const hrefs = await collectAnchorHrefs(card);
      website = pickWebsiteHrefFromAnchors(hrefs);
    } catch (e) {
      console.debug("[result-card] website extraction failed", { index, e });
    }

    const href = await resolvePrimaryPlaceHref(card);
    const parsed = parseGoogleMapsHref(href);
    const placeId = href ? extractPlaceIdFromMapsUrl(href) : null;
    if (href && placeId === null) {
      console.debug(`[placeId] not found in url: ${href}`);
    }

    const id = parsed.cid ?? href ?? `${title ?? "unknown"}::${index}`;

    console.debug(
      `[result-card] title=${title ?? "null"} category=${category ?? "null"} address=${address ?? "null"} phone=${phone ?? "null"} website=${website ?? "null"}`,
    );

    return {
      id,
      cid: parsed.cid,
      placeId,
      title,
      category,
      address,
      phone,
      website,
      lat: parsed.lat,
      lng: parsed.lng,
      href,
    };
  } catch (e) {
    console.debug("[result-card] failed to parse article card", { index, e });
    return null;
  }
}

export async function clickSearchThisArea(page: Page): Promise<boolean> {
  const el = page
    .locator(config.selectors.search.searchThisAreaButton)
    .first();

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
  const candidates = config.selectors.sidebar.feed;

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

  const cards = feed.locator(config.selectors.sidebar.article);
  const count = await cards.count();
  const results: PlaceSeed[] = [];

  for (let i = 0; i < count; i++) {
    const seed = await extractPlaceSeedFromArticleCard(cards.nth(i), i);
    if (seed) results.push(seed);
  }

  return results;
}
