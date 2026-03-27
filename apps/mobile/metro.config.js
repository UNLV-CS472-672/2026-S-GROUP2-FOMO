const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
const monorepoRoot = path.resolve(__dirname, '../..');
config.watchFolders = [monorepoRoot];
config.resolver.extraNodeModules = {
  '@fomo/backend': path.resolve(monorepoRoot, 'packages/backend'),
};
// Disable web platform resolution
config.resolver.platforms = ['ios', 'android'];
// Required for h3-js v4 (uses package.json "exports" field)
config.resolver.unstable_enablePackageExports = true;

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
