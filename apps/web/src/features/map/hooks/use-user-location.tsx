import { useEffect, useState } from 'react';

import { FALLBACK_COORDS, type Coordinates } from '@/features/map/utils/load-mapbox-assets';

export function useUserLocation() {
  const geolocationAvailable =
    typeof navigator !== 'undefined' && typeof navigator.geolocation !== 'undefined';
  const [userCoords, setUserCoords] = useState<Coordinates>(FALLBACK_COORDS);
  const [hasResolvedLocation, setHasResolvedLocation] = useState(!geolocationAvailable);
  const [locationGranted, setLocationGranted] = useState(false);

  useEffect(() => {
    if (!geolocationAvailable) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationGranted(true);
        setUserCoords([coords.longitude, coords.latitude]);
        setHasResolvedLocation(true);
      },
      () => {
        setHasResolvedLocation(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [geolocationAvailable]);

  return {
    centerCoordinate: userCoords,
    hasResolvedLocation,
    locationGranted,
  };
}
