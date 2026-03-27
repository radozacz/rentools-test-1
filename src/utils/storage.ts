import * as fs from "fs";
import * as path from "path";
import type { PlaceDetails, PlaceSeed } from "../types";
import { extractPlaceIdFromMapsUrl } from "./placeId";

export function saveSeedsToJson(filePath: string, records: PlaceSeed[]): void {
  const absolutePath = path.join(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, JSON.stringify(records, null, 2), "utf-8");
}

export function loadSeedsFromJson(filePath: string): PlaceSeed[] {
  const absolutePath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    return [];
  }

  const raw = fs.readFileSync(absolutePath, "utf-8");
  const parsed = JSON.parse(raw) as PlaceSeed[];
  return parsed.map((r) => ({
    ...r,
    title: r.title ?? r.name ?? null,
    name: r.name ?? r.title ?? null,
    address: r.address ?? null,
    phone: r.phone ?? null,
    website: r.website ?? null,
    placeId:
      r.placeId ??
      (r.href ? extractPlaceIdFromMapsUrl(r.href) : null) ??
      null,
  }));
}

export function loadFinalFromJson(filePath: string): PlaceDetails[] {
  const absolutePath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    return [];
  }

  const raw = fs.readFileSync(absolutePath, "utf-8");
  return JSON.parse(raw) as PlaceDetails[];
}

export function saveFinalToJson(filePath: string, records: PlaceDetails[]): void {
  const absolutePath = path.join(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, JSON.stringify(records, null, 2), "utf-8");
}
