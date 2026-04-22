export function openDirections(lat: number, lng: number) {
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
}
