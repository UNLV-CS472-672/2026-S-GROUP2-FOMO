// Zoom level where the smallest marker (t=0) is fully gone.
const SMALL_MARKER_HIDE_ZOOM = 10;
// Zoom level where the largest marker (t=1) is fully gone.
const LARGE_MARKER_HIDE_ZOOM = 7;
// How many zoom levels the fade takes (same for all markers).
const FADE_RANGE = 2;

/**
 * Returns fade thresholds for a marker given its normalized weight t ∈ [0, 1].
 * Small markers vanish first; large ones stick around longer.
 */
export function markerFadeZooms(t: number): { fadeInZoom: number; fadeOutZoom: number } {
  const fadeOutZoom =
    SMALL_MARKER_HIDE_ZOOM - t * (SMALL_MARKER_HIDE_ZOOM - LARGE_MARKER_HIDE_ZOOM);
  return { fadeOutZoom, fadeInZoom: fadeOutZoom + FADE_RANGE };
}
