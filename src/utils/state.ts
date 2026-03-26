import type { PlaceSeed } from "../types";

export class SeedState {
  private items = new Map<string, PlaceSeed>();

  addMany(records: PlaceSeed[]): number {
    return this.addManyWithNew(records).added;
  }

  addManyWithNew(records: PlaceSeed[]): { added: number; newSeeds: PlaceSeed[] } {
    const newSeeds: PlaceSeed[] = [];

    for (const record of records) {
      if (!this.items.has(record.id)) {
        this.items.set(record.id, record);
        newSeeds.push(record);
      }
    }

    return { added: newSeeds.length, newSeeds };
  }

  getAll(): PlaceSeed[] {
    return [...this.items.values()];
  }

  get size(): number {
    return this.items.size;
  }
}
