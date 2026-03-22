import type { PlaceDetails } from "../types";
import { getDedupeKey, mergePlaceDetails } from "./details-filters";

export class DetailsState {
  private items = new Map<string, PlaceDetails>();

  constructor(existingRecords: PlaceDetails[] = []) {
    for (const record of existingRecords) {
      const key = getDedupeKey(record);
      this.items.set(key, record);
    }
  }

  addOrMerge(record: PlaceDetails): void {
    const key = getDedupeKey(record);
    const existing = this.items.get(key);

    if (!existing) {
      this.items.set(key, record);
    } else {
      this.items.set(key, mergePlaceDetails(existing, record));
    }
  }

  getAll(): PlaceDetails[] {
    return [...this.items.values()];
  }

  get size(): number {
    return this.items.size;
  }
}
