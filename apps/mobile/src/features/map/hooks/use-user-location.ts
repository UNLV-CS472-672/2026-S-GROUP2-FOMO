import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

type Coordinates = [number, number];

export function useUserLocation() {
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function requestLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        if (status !== 'granted') {
          setLocationError('Location access is required to use the map.');
          setIsResolvingLocation(false);
          return;
        }

        setLocationGranted(true);

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (cancelled) return;
        setUserCoords([position.coords.longitude, position.coords.latitude]);
        setIsResolvingLocation(false);
      } catch {
        if (!cancelled) {
          setLocationError('Unable to determine your location.');
          setIsResolvingLocation(false);
        }
      }
    }

    requestLocation();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    centerCoordinate: userCoords,
    hasResolvedLocation: userCoords !== null,
    isResolvingLocation,
    locationError,
    locationGranted,
  };
}
