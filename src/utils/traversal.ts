import type { Page } from "playwright";
import { config } from "../config";
import type { Bounds, HorizontalDirection, LatLng } from "../types";
import {
  getTopLeftCorner,
  isBelowBounds,
  isPastHorizontalBounds,
} from "./geometry";
import { focusMap, getMapCenterFromUrl, pressArrow } from "./map";
import { clickSearchThisArea, collectVisibleSeeds } from "./scraper";
import { saveSeedsToJson } from "./storage";
import { SeedState } from "./state";

export async function collectSeedsAndPersist(
  page: Page,
  state: SeedState,
  label: string,
): Promise<void> {
  const clicked = await clickSearchThisArea(page);
  const visible = await collectVisibleSeeds(page);
  const added = state.addMany(visible);

  saveSeedsToJson(config.output.seedsJsonPath, state.getAll());

  console.log(
    `[collect] ${label} searchThisAreaClicked=${clicked} visible=${visible.length} new=${added} total=${state.size}`,
  );

  for (const item of visible) {
    console.log(
      `[seed] id=${item.id} | cid=${item.cid} | name=${item.name ?? "null"} | lat=${item.lat} | lng=${item.lng}`,
    );
  }

  await focusMap(page);
  await page.waitForTimeout(250);
}

export async function moveHorizontallyUntilOutside(
  page: Page,
  bounds: Bounds,
  direction: HorizontalDirection,
  rowIndex: number,
  state: SeedState,
): Promise<LatLng | null> {
  let step = 0;

  while (true) {
    step += 1;

    for (let i = 0; i < config.movement.horizontalStepCount; i++) {
      await pressArrow(page, direction, config.movement.horizontalStepSleepMs);
    }

    const center = await getMapCenterFromUrl(page);
    const url = page.url();

    console.log(`[row ${rowIndex}] [${direction} step ${step}] url=${url}`);
    console.log(`[row ${rowIndex}] [${direction} step ${step}] center=`, center);

    if (!center) {
      console.log(
        `[row ${rowIndex}] [${direction} step ${step}] could not read center from URL.`,
      );
      return null;
    }

    await collectSeedsAndPersist(
      page,
      state,
      `row-${rowIndex}-${direction}-step-${step}`,
    );

    if (isPastHorizontalBounds(center, bounds, direction)) {
      console.log(
        `[row ${rowIndex}] [${direction} step ${step}] crossed ${direction} edge.`,
      );
      return center;
    }
  }
}

export async function moveDownByConfiguredAmount(
  page: Page,
  nextRowIndex: number,
  state: SeedState,
): Promise<LatLng | null> {
  console.log(
    `[row ${nextRowIndex}] [down] moving down by ${config.movement.verticalStepCount} steps...`,
  );

  let lastCenter: LatLng | null = null;

  for (let i = 0; i < config.movement.verticalStepCount; i++) {
    await pressArrow(page, "down", config.movement.verticalStepSleepMs);

    const center = await getMapCenterFromUrl(page);
    console.log(
      `[row ${nextRowIndex}] [down ${i + 1}/${config.movement.verticalStepCount}] center=`,
      center,
    );

    if (!center) {
      console.log(
        `[row ${nextRowIndex}] [down ${i + 1}/${config.movement.verticalStepCount}] could not read center.`,
      );
      return null;
    }

    await collectSeedsAndPersist(
      page,
      state,
      `row-${nextRowIndex}-down-${i + 1}`,
    );

    lastCenter = center;
  }

  return lastCenter;
}
