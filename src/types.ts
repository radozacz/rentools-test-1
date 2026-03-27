export type LatLng = { lat: number; lng: number };

export type PlaceSeed = {
  id: string;
  cid: string | null;
  /** Google Place ID from `!19s` in the listing href, when present. */
  placeId: string | null;
  /** Display title from the results card (`.fontHeadlineSmall`). */
  title: string | null;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
  href: string | null;
};

export type PlaceDetails = {
  placeId: string | null;
  cid: string | null;
  sourceId: string | null;
  name: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
};

export type Bounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type HorizontalDirection = "left" | "right";
