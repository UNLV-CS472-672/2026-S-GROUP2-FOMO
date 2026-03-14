import { useUserLocation } from '@/features/map/hooks/use-user-location';
import MapboxGL from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

export default function MapScreen() {
  const { push } = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const { centerCoordinate, hasResolvedLocation, locationGranted } = useUserLocation();

  return (
    <View className="absolute inset-0">
      <MapboxGL.MapView
        style={StyleSheet.absoluteFill}
        styleURL={MapboxGL.StyleURL.Dark}
        logoEnabled={false}
        attributionEnabled={false}
        onPress={() => push('/feed/demo-cell')}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          centerCoordinate={centerCoordinate}
          zoomLevel={13}
          animationMode={hasResolvedLocation ? 'flyTo' : 'none'}
          animationDuration={1200}
        />
        {locationGranted && (
          <MapboxGL.LocationPuck
            puckBearing="heading"
            puckBearingEnabled
            pulsing={{ isEnabled: true, color: '#4A90D9', radius: 50 }}
          />
        )}
      </MapboxGL.MapView>

      {/* Search bar overlay */}
      <View className="absolute left-4 right-4" style={{ top: insets.top + 12 }}>
        <Pressable
          className="rounded-xl border border-white/[0.12] bg-[rgba(18,18,18,0.92)] px-4 py-3 active:bg-[rgba(38,38,38,0.92)]"
          onPress={() => push('/(tabs)/(map)/search')}
        >
          <Text className="text-[15px] text-white/40">Search places...</Text>
        </Pressable>
      </View>
    </View>
  );
}
