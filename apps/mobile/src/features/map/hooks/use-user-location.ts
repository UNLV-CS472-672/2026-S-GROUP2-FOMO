import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

type Coordinates = [number, number];

// Las Vegas Coords
const FALLBACK_COORDS: Coordinates = [-115.1398, 36.1699];

export function useUserLocation() {
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function requestLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        if (status !== 'granted') {
          setUserCoords(FALLBACK_COORDS);
          return;
        }

        setLocationGranted(true);

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (cancelled) return;
        setUserCoords([position.coords.longitude, position.coords.latitude]);
      } catch {
        if (!cancelled) {
          setUserCoords(FALLBACK_COORDS);
        }
      }
    }

    requestLocation();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    centerCoordinate: userCoords ?? FALLBACK_COORDS,
    hasResolvedLocation: userCoords !== null,
    locationGranted,
  };
}
