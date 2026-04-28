import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Fomo',
  slug: 'fomo',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/logos/icon.png',
  scheme: 'fomo',
  userInterfaceStyle: 'automatic',
  platforms: ['ios', 'android'],
  ios: {
    icon: {
      light: './assets/logos/icon-ios-light.png',
      dark: './assets/logos/icon-ios-dark.png',
      tinted: './assets/logos/icon-ios-tinted.png',
    },
    supportsTablet: true,
    bundleIdentifier: 'com.fomo.mobile',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      LSApplicationQueriesSchemes: ['comgooglemaps'],
      NSLocationWhenInUseUsageDescription:
        'Fomo uses your location to show events near you on the map.',
      NSCameraUsageDescription:
        'Fomo uses your camera so you can capture photos and videos for posts.',
      NSPhotoLibraryUsageDescription:
        'Fomo needs access to your photos so you can choose media for posts.',
      NSPhotoLibraryAddUsageDescription:
        'Fomo needs permission to save photos and videos to your library.',
      NSMicrophoneUsageDescription: 'Fomo uses your microphone when recording videos.',
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#fffdfb',
      foregroundImage: './assets/logos/android-icon-foreground.png',
      backgroundImage: './assets/logos/android-icon-background.png',
      monochromeImage: './assets/logos/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    package: 'com.fomo.mobile',
  },
  plugins: [
    'expo-router',
    '@rnmapbox/maps',
    ['@clerk/expo', { appleSignIn: false }],
    [
      'expo-build-properties',
      {
        android: {
          extraMavenRepos: ['https://api.mapbox.com/downloads/v2/releases/maven'],
          usesCleartextTraffic: true,
        },
      },
    ],
    ['expo-font', { fonts: ['./assets/fonts/CabinetGrotesk-Variable.ttf'] }],
    [
      'expo-splash-screen',
      {
        image: './assets/logos/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#fffdfb',
        dark: { backgroundColor: '#181311' },
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Fomo uses your location to show events near you on the map.',
      },
    ],
    [
      'expo-speech-recognition',
      {
        microphonePermission: 'Fomo uses your microphone so you can search with your voice.',
        speechRecognitionPermission:
          'Fomo uses speech recognition so you can search events with your voice.',
        androidSpeechServicePackages: ['com.google.android.googlequicksearchbox'],
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission: 'Allow $(PRODUCT_NAME) to access your photos.',
        savePhotosPermission: 'Allow $(PRODUCT_NAME) to save photos.',
        isAccessMediaLocationEnabled: true,
      },
    ],
    [
      'react-native-vision-camera',
      {
        enableMicrophonePermission: true,
        cameraPermissionText: '$(PRODUCT_NAME) needs access to your Camera.',
        microphonePermissionText: '$(PRODUCT_NAME) needs access to your Microphone.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Fomo needs access to your photos so you can choose media for posts.',
        cameraPermission: 'Fomo uses your camera so you can take photos for posts.',
        microphonePermission: 'Fomo uses your microphone when recording videos.',
      },
    ],
    'expo-video',
    'expo-secure-store',
    'expo-web-browser',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: '7e8eeb89-68f2-4ecb-b307-052383bb1f68',
    },
    EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID,
    EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID,
    EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID:
      process.env.EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID,
    EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME: process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME,
  },
});
