import type { GeoPoint } from "@/types";

/** Equirectangular projection helpers for the schematic SVG world map. */
export function lngToX(lng: number): number {
  return ((lng + 180) / 360) * 100;
}
export function latToY(lat: number): number {
  return ((90 - lat) / 180) * 100;
}

function pt(label: string, lat: number, lng: number): GeoPoint {
  return { label, lat, lng, x: lngToX(lng), y: latToY(lat) };
}

export const HUBS: Record<string, GeoPoint> = {
  losAngeles: pt("Los Angeles, US", 34.05, -118.24),
  newYork: pt("New York, US", 40.71, -74.01),
  chicago: pt("Chicago, US", 41.88, -87.63),
  houston: pt("Houston, US", 29.76, -95.37),
  saoPaulo: pt("São Paulo, BR", -23.55, -46.63),
  london: pt("London, UK", 51.51, -0.13),
  rotterdam: pt("Rotterdam, NL", 51.92, 4.48),
  hamburg: pt("Hamburg, DE", 53.55, 9.99),
  dubai: pt("Dubai, AE", 25.2, 55.27),
  mumbai: pt("Mumbai, IN", 19.08, 72.88),
  singapore: pt("Singapore, SG", 1.35, 103.82),
  shanghai: pt("Shanghai, CN", 31.23, 121.47),
  shenzhen: pt("Shenzhen, CN", 22.54, 114.06),
  tokyo: pt("Tokyo, JP", 35.68, 139.65),
  sydney: pt("Sydney, AU", -33.87, 151.21),
  capeTown: pt("Cape Town, ZA", -33.92, 18.42),
  cairo: pt("Cairo, EG", 30.04, 31.24),
  istanbul: pt("Istanbul, TR", 41.01, 28.98),
  moscow: pt("Moscow, RU", 55.76, 37.62),
  toronto: pt("Toronto, CA", 43.65, -79.38),
};

export const HUB_LIST: GeoPoint[] = Object.values(HUBS);
