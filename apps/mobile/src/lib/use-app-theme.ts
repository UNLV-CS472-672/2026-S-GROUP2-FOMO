import { nativeTheme } from '@fomo/theme/native';
import { useColorScheme } from 'react-native';

export function useAppTheme() {
  const colorScheme = useColorScheme();

  return colorScheme === 'dark' ? nativeTheme.dark : nativeTheme.light;
}
