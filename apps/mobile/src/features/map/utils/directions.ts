import { ActionSheetIOS, Linking, Platform } from 'react-native';

export function openDirections(lat: number, lng: number, label: string) {
  const encodedLabel = encodeURIComponent(label);
  const appleMapsUrl = `maps://?daddr=${lat},${lng}&q=${encodedLabel}`;
  const googleMapsApp = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
  const googleMapsWeb = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Apple Maps', 'Google Maps'],
        cancelButtonIndex: 0,
      },
      async (index) => {
        if (index === 1) {
          Linking.openURL(appleMapsUrl);
        } else if (index === 2) {
          const canOpen = await Linking.canOpenURL(googleMapsApp);
          Linking.openURL(canOpen ? googleMapsApp : googleMapsWeb);
        }
      }
    );
  } else {
    Linking.canOpenURL(googleMapsApp).then((canOpen) => {
      Linking.openURL(canOpen ? googleMapsApp : googleMapsWeb);
    });
  }
}
