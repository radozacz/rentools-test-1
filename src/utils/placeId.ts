/**
 * Extracts Google Maps placeId from the `!19s...` segment of a Maps URL.
 * Stops at `!`, `?`, `&`, or `#` so query strings and fragments are never included.
 *
 * Test-style examples (input fragment → output):
 * 1. `.../data=!4m7!19sChIJabc!3m1` → `ChIJabc` (stops at `!`)
 * 2. `...!19sChIJIaemDQDdl0cRco53XGDpJOw?authuser=0&hl=de&rclk=1` → `ChIJIaemDQDdl0cRco53XGDpJOw` (stops at `?`)
 * 3. `https://www.google.com/maps/place/Foo/@1,2,3z` → `null` (no `!19s`)
 */
export function extractPlaceIdFromMapsUrl(url: string): string | null {
  if (typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const match = trimmed.match(/!19s([^!?#&]+)/);
    const raw = match?.[1];
    if (!raw) {
      return null;
    }

    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  } catch {
    return null;
  }
}
