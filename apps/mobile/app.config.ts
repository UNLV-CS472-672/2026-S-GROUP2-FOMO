import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Fomo',
  slug: 'fomo',
  version: '1.0.1',
  orientation: 'portrait',
  icon: './assets/logos/icon.png',
  scheme: 'fomo',
  userInterfaceStyle: 'automatic',
  platforms: ['ios', 'android'],
  updates: {
    url: 'https://u.expo.dev/7e8eeb89-68f2-4ecb-b307-052383bb1f68',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
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
        'Fomo uses your location to show nearby events on the map, such as helping you discover what is happening around your current area.',
      NSCameraUsageDescription:
        'Fomo uses your camera so you can capture photos and videos to create posts and update your profile.',
      NSPhotoLibraryUsageDescription:
        'Fomo needs access to your photo library so you can select photos and videos to include in your posts and profile.',
      NSPhotoLibraryAddUsageDescription:
        'Fomo needs permission to save photos and videos you create or export in the app back to your photo library.',
      NSMicrophoneUsageDescription:
        'Fomo uses your microphone when you record videos or use voice search to find events.',
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
    ['@clerk/expo', { appleSignIn: true }],
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
        locationWhenInUsePermission:
          'Fomo uses your location to show nearby events on the map, such as helping you discover what is happening around your current area.',
      },
    ],
    [
      'expo-speech-recognition',
      {
        microphonePermission:
          'Fomo uses your microphone so you can search for events with your voice instead of typing.',
        speechRecognitionPermission:
          'Fomo uses speech recognition to turn your voice into text when you search for events hands-free.',
        androidSpeechServicePackages: ['com.google.android.googlequicksearchbox'],
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission:
          'Fomo needs access to your photo library so you can select photos and videos to include in your posts and profile.',
        savePhotosPermission:
          'Fomo needs permission to save photos and videos you create or export in the app back to your photo library.',
        isAccessMediaLocationEnabled: true,
      },
    ],
    [
      'react-native-vision-camera',
      {
        enableMicrophonePermission: true,
        cameraPermissionText:
          'Fomo needs access to your camera so you can capture photos and videos to create posts and update your profile.',
        microphonePermissionText:
          'Fomo needs access to your microphone so you can record audio in videos and search for events with your voice.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Fomo needs access to your photo library so you can select photos and videos to include in your posts and profile.',
        cameraPermission:
          'Fomo uses your camera so you can capture photos and videos to create posts and update your profile.',
        microphonePermission:
          'Fomo uses your microphone when you record videos or use voice search to find events.',
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
