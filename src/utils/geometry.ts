import * as fs from "fs";
import * as path from "path";
import type { Bounds, HorizontalDirection, LatLng } from "../types";

export type Polygon = LatLng[];

interface GeoJsonFeature {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

interface GeoJsonCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export function loadCountryPolygon(polygonPath: string): Polygon {
  const filePath = path.join(process.cwd(), polygonPath);
  const raw = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(raw) as GeoJsonCollection;
  const ring = json.features[0]!.geometry.coordinates[0]!;
  return ring.map(([lng, lat]) => ({ lat, lng }));
}

export function getPolygonBounds(polygon: Polygon): Bounds {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const p of polygon) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }

  return { minLat, maxLat, minLng, maxLng };
}

export function isPointInPolygon(point: LatLng, polygon: Polygon): boolean {
  const { lat, lng } = point;
  const n = polygon.length;
  let inside = false;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i]!.lng;
    const yi = polygon[i]!.lat;
    const xj = polygon[j]!.lng;
    const yj = polygon[j]!.lat;

    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

export function getTopLeftCorner(bounds: Bounds): LatLng {
  return { lat: bounds.maxLat, lng: bounds.minLng };
}

export function isBelowBounds(point: LatLng, bounds: Bounds): boolean {
  return point.lat < bounds.minLat;
}

export function isPastHorizontalBounds(
  point: LatLng,
  bounds: Bounds,
  direction: HorizontalDirection,
): boolean {
  return direction === "right" ? point.lng > bounds.maxLng : point.lng < bounds.minLng;
}