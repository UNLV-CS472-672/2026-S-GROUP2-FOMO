import { nativeTheme } from '@fomo/theme/native';
import { useUniwind } from 'uniwind';

export function useAppTheme() {
  const { theme } = useUniwind();

  return theme === 'dark' ? nativeTheme.dark : nativeTheme.light;
}
