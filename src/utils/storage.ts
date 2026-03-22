import * as fs from "fs";
import * as path from "path";
import type { PlaceDetails, PlaceSeed } from "../types";

export function saveSeedsToJson(filePath: string, records: PlaceSeed[]): void {
  const absolutePath = path.join(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, JSON.stringify(records, null, 2), "utf-8");
}

export function loadSeedsFromJson(filePath: string): PlaceSeed[] {
  const absolutePath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Seeds file not found: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, "utf-8");
  return JSON.parse(raw) as PlaceSeed[];
}

export function saveFinalToJson(filePath: string, records: PlaceDetails[]): void {
  const absolutePath = path.join(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, JSON.stringify(records, null, 2), "utf-8");
}
