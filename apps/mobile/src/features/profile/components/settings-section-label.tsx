import { Text } from 'react-native';

export function SettingsSectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </Text>
  );
}
