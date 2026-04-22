import { ActionSheetIOS, Alert, Linking, Platform } from 'react-native';

async function tryOpenUrl(url: string) {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

async function canOpenUrl(url: string) {
  try {
    return await Linking.canOpenURL(url);
  } catch {
    return false;
  }
}

export async function openDirections(lat: number, lng: number, label: string) {
  const encodedLabel = encodeURIComponent(label);
  const appleMapsScheme = 'maps://';
  const googleMapsScheme = 'comgooglemaps://';
  const appleMapsUrl = `maps://?daddr=${lat},${lng}&q=${encodedLabel}`;
  const googleMapsApp = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving&q=${encodedLabel}`;
  const googleMapsWeb = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  const androidMapsIntent = `geo:0,0?q=${lat},${lng}(${encodedLabel})`;

  if (Platform.OS === 'ios') {
    const [canOpenAppleMaps, canOpenGoogleMaps] = await Promise.all([
      canOpenUrl(appleMapsScheme),
      canOpenUrl(googleMapsScheme),
    ]);

    const options = ['Cancel'];
    const actions: (() => Promise<void>)[] = [];

    if (canOpenAppleMaps) {
      options.push('Apple Maps');
      actions.push(async () => {
        await tryOpenUrl(appleMapsUrl);
      });
    }

    if (canOpenGoogleMaps) {
      options.push('Google Maps');
      actions.push(async () => {
        if (!(await tryOpenUrl(googleMapsApp))) {
          await tryOpenUrl(googleMapsWeb);
        }
      });
    }

    if (actions.length === 0) {
      if ((await canOpenUrl(googleMapsWeb)) && (await tryOpenUrl(googleMapsWeb))) {
        return;
      }

      Alert.alert('Unable to open directions', 'No supported maps app was found on this device.');
      return;
    }

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 0,
      },
      async (index) => {
        const action = actions[index - 1];

        if (action) {
          await action();
        }
      }
    );
  } else {
    const canOpenMapsApp = await canOpenUrl(androidMapsIntent);

    if (canOpenMapsApp && (await tryOpenUrl(androidMapsIntent))) {
      return;
    }

    const canOpenGoogleMapsWeb = await canOpenUrl(googleMapsWeb);

    if (canOpenGoogleMapsWeb && (await tryOpenUrl(googleMapsWeb))) {
      return;
    }

    Alert.alert('Unable to open directions', 'No supported maps app was found on this device.');
  }
}
