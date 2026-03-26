import type { Locator, Page } from "playwright";
import { config } from "../config";
import { getResultsFeed, collectVisibleSeeds } from "./scraper";
import { saveSeedsToJson } from "./storage";
import type { SeedState } from "./state";

const SCROLL_SETTLE_MS = 1500;
/** Stop when this many iterations pass with no new seeds and no scroll movement. */
const IDLE_STREAK_TO_STOP = 4;
const MAX_PANEL_ITERATIONS = 120;
const SCROLL_BOTTOM_EPSILON = 12;
const SCROLL_MOVE_EPSILON = 3;

type ScrollMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

function isAtBottom(m: ScrollMetrics): boolean {
  return m.scrollTop + m.clientHeight >= m.scrollHeight - SCROLL_BOTTOM_EPSILON;
}

/**
 * Read scroll metrics from the scrollable ancestor of the feed (browser context only — logic inlined).
 */
async function getScrollMetrics(feed: Locator): Promise<ScrollMetrics | null> {
  try {
    return await feed.evaluate((el: unknown) => {
      type N = {
        scrollTop: number;
        scrollHeight: number;
        clientHeight: number;
        parentElement: N | null;
      };
      const findScrollable = (start: N | null): N | null => {
        let node = start;
        while (node) {
          if (node.scrollHeight > node.clientHeight + 5) {
            return node;
          }
          node = node.parentElement;
        }
        return null;
      };
      const node = el as N;
      const t = findScrollable(node) ?? node;
      return {
        scrollTop: t.scrollTop,
        scrollHeight: t.scrollHeight,
        clientHeight: t.clientHeight,
      };
    });
  } catch {
    return null;
  }
}

async function scrollPanelDownByChunk(feed: Locator): Promise<void> {
  await feed.evaluate((el: unknown) => {
    type N = {
      scrollTop: number;
      scrollHeight: number;
      clientHeight: number;
      parentElement: N | null;
    };
    const findScrollable = (start: N | null): N | null => {
      let node = start;
      while (node) {
        if (node.scrollHeight > node.clientHeight + 5) {
          return node;
        }
        node = node.parentElement;
      }
      return null;
    };
    const node = el as N;
    const target = findScrollable(node) ?? node;
    const room = target.scrollHeight - target.scrollTop - target.clientHeight;
    const step = Math.floor(target.clientHeight * 0.85);
    const delta = Math.min(step, Math.max(0, room));
    target.scrollTop += delta;
  });
}

/**
 * Incrementally collects seeds while scrolling the results panel (virtualized list safe).
 */
export async function collectAllSeedsFromResultsPanel(
  page: Page,
  state: SeedState,
  contextLabel: string,
): Promise<void> {
  console.log(
    `[collect-panel] ${contextLabel} starting incremental collect (virtualization-safe)…`,
  );

  let feed: Locator | null;

  try {
    feed = await getResultsFeed(page);
  } catch {
    console.warn(
      "[collect-panel] could not resolve results feed (exception). Falling back to single collect.",
    );
    const visible = await collectVisibleSeeds(page);
    const { added } = state.addManyWithNew(visible);
    saveSeedsToJson(config.output.seedsJsonPath, state.getAll());
    console.log(
      `[collect-panel] ${contextLabel} fallback visible=${visible.length} new=${added} total=${state.size}`,
    );
    return;
  }

  if (!feed) {
    console.warn(
      "[collect-panel] results feed not found — falling back to single collectVisibleSeeds.",
    );
    const visible = await collectVisibleSeeds(page);
    const { added } = state.addManyWithNew(visible);
    saveSeedsToJson(config.output.seedsJsonPath, state.getAll());
    console.log(
      `[collect-panel] ${contextLabel} fallback visible=${visible.length} new=${added} total=${state.size}`,
    );
    return;
  }

  let idleStreak = 0;
  let iteration = 0;

  while (true) {
    iteration += 1;
    if (iteration > MAX_PANEL_ITERATIONS) {
      console.warn(
        `[collect-panel] ${contextLabel} stopped at safety limit (${MAX_PANEL_ITERATIONS} iterations). totalUnique=${state.size}`,
      );
      break;
    }

    const visible = await collectVisibleSeeds(page);
    const { added, newSeeds } = state.addManyWithNew(visible);

    saveSeedsToJson(config.output.seedsJsonPath, state.getAll());

    const metrics = await getScrollMetrics(feed);
    const scrollInfo =
      metrics !== null
        ? `scrollTop=${Math.round(metrics.scrollTop)} scrollHeight=${Math.round(metrics.scrollHeight)} clientH=${Math.round(metrics.clientHeight)} atBottom=${isAtBottom(metrics)}`
        : "scroll=(unavailable)";

    console.log(
      `[collect-panel] ${contextLabel} iter=${iteration}/${MAX_PANEL_ITERATIONS} visible=${visible.length} newUnique=${added} totalUnique=${state.size} idleStreak=${idleStreak} ${scrollInfo}`,
    );

    for (const item of newSeeds) {
      console.log(
        `[seed] id=${item.id} | cid=${item.cid} | name=${item.name ?? "null"} | lat=${item.lat} | lng=${item.lng}`,
      );
    }

    if (metrics && isAtBottom(metrics)) {
      console.log(
        `[collect-panel] ${contextLabel} reached bottom of results list (iter=${iteration}).`,
      );
      break;
    }

    const scrollTopBefore = metrics?.scrollTop ?? 0;

    try {
      await scrollPanelDownByChunk(feed);
    } catch (err) {
      console.warn("[collect-panel] scroll chunk failed:", err);
    }

    await page.waitForTimeout(SCROLL_SETTLE_MS);

    const after = await getScrollMetrics(feed);
    const scrollMoved =
      metrics !== null &&
      after !== null &&
      Math.abs(after.scrollTop - scrollTopBefore) > SCROLL_MOVE_EPSILON;

    if (metrics === null || after === null) {
      console.warn(
        "[collect-panel] scroll metrics unavailable after scroll; not counting as idle.",
      );
    }

    if (added === 0 && !scrollMoved && metrics !== null && after !== null) {
      idleStreak += 1;
    } else {
      idleStreak = 0;
    }

    if (idleStreak >= IDLE_STREAK_TO_STOP) {
      console.log(
        `[collect-panel] ${contextLabel} stopping: no new unique seeds and scroll idle for ${IDLE_STREAK_TO_STOP} iterations (iter=${iteration}).`,
      );
      break;
    }
  }

  console.log(
    `[collect-panel] ${contextLabel} finished lastIter=${iteration} totalUnique=${state.size}`,
  );
}
