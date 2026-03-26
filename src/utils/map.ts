import type { Page } from "playwright";
import { config } from "../config";
import type { LatLng } from "../types";

export function getGoogleMapsOrigin(): string {
  return new URL(config.map.googleMapsBaseUrl).origin;
}

export type MoveDirection = "up" | "down" | "left" | "right";

const directionToKey: Record<MoveDirection, string> = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
};

export async function focusMap(page: Page): Promise<void> {
  const viewport = page.viewportSize();

  if (!viewport) {
    throw new Error("Viewport size is not available.");
  }

  const x = Math.round(viewport.width * 0.78);
  const y = Math.round(viewport.height * 0.52);

  await page.mouse.move(x, y);
  await page.waitForTimeout(80);

  await page.mouse.down();
  await page.waitForTimeout(50);
  await page.mouse.move(x + 3, y + 2, { steps: 3 });
  await page.waitForTimeout(50);

  await page.mouse.up();
  await page.waitForTimeout(150);
}

export async function pressArrow(
  page: Page,
  direction: MoveDirection,
  stepSleepMs: number,
): Promise<void> {
  await page.keyboard.press(directionToKey[direction]);
  await page.waitForTimeout(stepSleepMs);
}

export function parseCenterFromGoogleMapsUrl(url: string): {
  center: LatLng | null;
  zoom: number | null;
} {
  const atMatch = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(\d+(?:\.\d+)?)z/);
  if (atMatch) {
    const lat = Number(atMatch[1]);
    const lng = Number(atMatch[2]);
    const zoom = Number(atMatch[3]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && !Number.isNaN(zoom)) {
      return { center: { lat, lng }, zoom };
    }
  }

  const latMatch = url.match(/!3d(-?\d+(?:\.\d+)?)/);
  const lngMatch = url.match(/!4d(-?\d+(?:\.\d+)?)/);
  if (latMatch && lngMatch) {
    const lat = Number(latMatch[1]);
    const lng = Number(lngMatch[1]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { center: { lat, lng }, zoom: null };
    }
  }

  return { center: null, zoom: null };
}

export async function getMapCenterFromUrl(page: Page): Promise<LatLng | null> {
  return parseCenterFromGoogleMapsUrl(page.url()).center;
}

export function buildMapUrl(point: LatLng, zoom: number): string {
  return `${config.map.googleMapsBaseUrl}/@${point.lat},${point.lng},${zoom}z/search/${encodeURIComponent(config.search.query)}`;
}