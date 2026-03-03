import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Simple billboard component that renders a background image (default or passed-in)
// and lays out any children on top. This allows the parent to position clickable
// ads of arbitrary size on the billboard surface.

import { StyleProp, View, ViewStyle } from 'react-native';

interface BillboardProps {
  /** Optional custom background image for the billboard */
  backgroundImage?: any;
  /** Children elements rendered on top of the background */
  children?: React.ReactNode;
  /** Style applied to the container that wraps children (defaults to full size) */
  overlayStyle?: StyleProp<ViewStyle>;
}

const defaultBackground = require('@/assets/images/billboard_background.png');

const Billboard: React.FC<BillboardProps> = ({
  backgroundImage = defaultBackground,
  children,
  overlayStyle,
}) => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.image}>
          {/* overlay view ensures callers can absolutely position multiple
              ad elements without needing to wrap themselves */}
          <View style={[styles.overlay, overlayStyle]}>{children}</View>
        </ImageBackground>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default Billboard;
