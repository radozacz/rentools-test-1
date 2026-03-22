import type { PlaceSeed } from "../types";

export class SeedState {
  private items = new Map<string, PlaceSeed>();

  addMany(records: PlaceSeed[]): number {
    let added = 0;

    for (const record of records) {
      if (!this.items.has(record.id)) {
        this.items.set(record.id, record);
        added += 1;
      }
    }

    return added;
  }

  getAll(): PlaceSeed[] {
    return [...this.items.values()];
  }

  get size(): number {
    return this.items.size;
  }
}
