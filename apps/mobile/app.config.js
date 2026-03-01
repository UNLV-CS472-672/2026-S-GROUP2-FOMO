const appJson = require('./app.json');

// reads mapbox tokens & android id
module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      package: (() => {
        if (!process.env.EXPO_PUBLIC_ANDROID_PACKAGE) {
          throw new Error('EXPO_PUBLIC_ANDROID_PACKAGE is required. Set it in your .env file.');
        }
        return process.env.EXPO_PUBLIC_ANDROID_PACKAGE;
      })(),
    },
  },
};
