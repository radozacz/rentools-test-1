export type LatLng = { lat: number; lng: number };

export type PlaceSeed = {
  id: string;
  cid: string | null;
  name: string | null;
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
