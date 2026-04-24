import type { ImageSourcePropType } from 'react-native';
import { Image, Text, View } from 'react-native';

type AvatarProps = {
  name: string;
  size?: number;
  color?: string;
  source?: ImageSourcePropType;
};

export function Avatar({ name, size = 36, color = '#94a3b8', source }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  if (source) {
    return (
      <Image
        source={source}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: color }}
    >
      <Text style={{ fontSize: Math.max(12, size * 0.33), fontWeight: '600', color: '#fff' }}>
        {initials || '?'}
      </Text>
    </View>
  );
}
