import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive = false,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | number;
  onPress: () => void;
  destructive?: boolean;
  isLast?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <>
      <Pressable
        className="flex-row items-center px-4 py-3.5"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View className="mr-3 w-6 items-center">
          <Ionicons name={icon} size={20} color={destructive ? '#dc2626' : theme.tint} />
        </View>
        <Text
          className={`flex-1 text-base font-medium ${destructive ? 'text-destructive' : 'text-foreground'}`}
        >
          {label}
        </Text>
        {value !== undefined && (
          <Text className="mr-1.5 text-sm text-muted-foreground">{value}</Text>
        )}
        <Ionicons name="chevron-forward" size={16} color={theme.mutedText} />
      </Pressable>
      {!isLast && <View className="border-b border-border" />}
    </>
  );
}
