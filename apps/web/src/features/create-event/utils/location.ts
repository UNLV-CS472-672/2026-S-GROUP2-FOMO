const LOCATION_COORDINATE_DECIMALS = 7;

export function roundGeographicCoordinate(value: number): number {
  const factor = 10 ** LOCATION_COORDINATE_DECIMALS;
  return Math.round(value * factor) / factor;
}
