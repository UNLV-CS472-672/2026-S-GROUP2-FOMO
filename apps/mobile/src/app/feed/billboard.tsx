import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

// Simple billboard component that renders a background image (default or passed-in)
// and lays out any children on top. This allows the parent to position clickable
// ads of arbitrary size on the billboard surface.

import { StyleProp, ViewStyle } from 'react-native';

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
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.background}>
      {/* overlay view ensures callers can absolutely position multiple
          ad elements without needing to wrap themselves */}
      <View style={[styles.overlay, overlayStyle]}>{children}</View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default Billboard;
