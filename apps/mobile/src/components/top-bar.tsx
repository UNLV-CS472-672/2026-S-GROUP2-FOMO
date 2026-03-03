import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export type TopBarProps = {
  title?: string;
  style?: any;
};

export function TopBar({ title, style }: TopBarProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  return (
    <ThemedView style={[styles.container, { backgroundColor }, style]}>
      {title && <ThemedText style={[styles.title, { color: textColor }]}>{'fomo'}</ThemedText>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 4,
    borderBottomColor: '#eebd54',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'bottom',
    paddingTop: 40,
  },
});
