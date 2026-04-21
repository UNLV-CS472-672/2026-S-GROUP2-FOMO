import { Text, View } from 'react-native';

type AvatarProps = {
  name: string;
  size?: number;
  color: string;
};

export function Avatar({ name, size = 36, color }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: color }}
    >
      <Text className="text-xs font-semibold text-white">{initials || '?'}</Text>
    </View>
  );
}
