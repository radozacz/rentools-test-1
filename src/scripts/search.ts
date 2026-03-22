import { chromium } from "playwright";
import { config } from "../config";
import {
  getPolygonBounds,
  getTopLeftCorner,
  isBelowBounds,
  loadCountryPolygon,
} from "../utils/geometry";
import { buildMapUrl, focusMap, getMapCenterFromUrl } from "../utils/map";
import { SeedState } from "../utils/state";
import { saveSeedsToJson } from "../utils/storage";
import {
  collectSeedsAndPersist,
  moveDownByConfiguredAmount,
  moveHorizontallyUntilOutside,
} from "../utils/traversal";
import type { HorizontalDirection } from "../types";

async function main() {
  const polygon = loadCountryPolygon(config.geo.polygonPath);
  const bounds = getPolygonBounds(polygon);
  const state = new SeedState();

  const startPoint = getTopLeftCorner(bounds);
  const startUrl = buildMapUrl(startPoint, config.map.zoom);

  console.log("[bounds]", bounds);
  console.log("[startPoint]", startPoint);
  console.log("[startUrl]", startUrl);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
  });

  const context = await browser.newContext({
    viewport: config.map.viewport,
  });

  const page = await context.newPage();

  console.log("[browser] opening map...");
  await page.goto(startUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  await page.waitForTimeout(5000);

  console.log("[map] initial activation...");
  await focusMap(page);

  const initialCenter = await getMapCenterFromUrl(page);
  console.log("[initial center]", initialCenter);

  await collectSeedsAndPersist(page, state, "initial");

  let rowIndex = 1;
  let direction: HorizontalDirection = "right";

  while (rowIndex <= config.traversal.maxRows) {
    console.log(
      `[row ${rowIndex}] starting horizontal traversal: ${direction}`,
    );

    const horizontalEndCenter = await moveHorizontallyUntilOutside(
      page,
      bounds,
      direction,
      rowIndex,
      state,
    );

    if (!horizontalEndCenter) {
      console.log(
        `[row ${rowIndex}] failed to read center after horizontal move. Stopping.`,
      );
      break;
    }

    const nextRowIndex = rowIndex + 1;
    const afterDownCenter = await moveDownByConfiguredAmount(
      page,
      nextRowIndex,
      state,
    );

    if (!afterDownCenter) {
      console.log(
        `[row ${nextRowIndex}] failed to read center after moving down. Stopping.`,
      );
      break;
    }

    console.log(
      `[row ${nextRowIndex}] center after moving down=`,
      afterDownCenter,
    );

    if (isBelowBounds(afterDownCenter, bounds)) {
      console.log(
        `[row ${nextRowIndex}] crossed bottom edge of bounding box. Finished.`,
      );
      break;
    }

    direction = direction === "right" ? "left" : "right";
    rowIndex += 1;
  }

  saveSeedsToJson(config.output.seedsJsonPath, state.getAll());

  console.log("[done] full snake traversal finished.");
  console.log("[summary] total unique seeds:", state.size);
  console.log("[summary] saved to:", config.output.seedsJsonPath);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
