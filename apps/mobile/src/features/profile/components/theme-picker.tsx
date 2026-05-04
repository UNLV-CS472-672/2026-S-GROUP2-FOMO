import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { Uniwind, useUniwind } from 'uniwind';

type ThemeOption = 'light' | 'dark' | 'system';

const OPTIONS: { value: ThemeOption; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export function ThemePicker() {
  const { theme: activeTheme, hasAdaptiveThemes } = useUniwind();
  const appTheme = useAppTheme();

  const selected: ThemeOption = hasAdaptiveThemes
    ? 'system'
    : activeTheme === 'dark'
      ? 'dark'
      : 'light';

  return (
    <View className="rounded-xl bg-card px-4 py-3 gap-2">
      <Text className="text-sm font-medium text-muted-foreground">Appearance</Text>
      <View className="flex-row gap-2">
        {OPTIONS.map(({ value, label, icon }) => {
          const isActive = selected === value;
          return (
            <Pressable
              key={value}
              onPress={() => Uniwind.setTheme(value)}
              className={`flex-1 items-center gap-1.5 rounded-lg py-2.5 ${isActive ? 'bg-primary' : 'bg-background'}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${label} mode`}
            >
              <Ionicons name={icon} size={18} color={isActive ? '#fff' : appTheme.mutedText} />
              <Text
                className={`text-xs font-medium ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
