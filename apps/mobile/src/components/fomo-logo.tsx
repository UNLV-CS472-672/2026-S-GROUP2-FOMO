import darkLogo from '@/assets/logos/fomo-dark.png';
import lightLogo from '@/assets/logos/fomo-light.png';
import { Image } from '@/components/image';
import type { ImageStyle, StyleProp } from 'react-native';
import { useUniwind } from 'uniwind';

type FomoLogoProps = {
  width: number;
  height: number;
  className?: string;
  style?: StyleProp<ImageStyle>;
};

export function FomoLogo({ width, height, className, style }: FomoLogoProps) {
  const { theme } = useUniwind();
  const source = theme === 'dark' ? darkLogo : lightLogo;

  return (
    <Image
      source={source}
      className={className}
      style={[{ width, height }, style]}
      contentFit="contain"
    />
  );
}
