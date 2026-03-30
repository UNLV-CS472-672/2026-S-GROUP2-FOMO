import { nativeTheme } from '@fomo/theme/native';
import { HeaderBackButton } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { useUniwind } from 'uniwind';

type AuthHeaderBackButtonProps = {
  onPress?: () => void;
};

export function AuthHeaderBackButton({ onPress }: AuthHeaderBackButtonProps) {
  const router = useRouter();
  const { theme: activeTheme } = useUniwind();
  const theme = activeTheme === 'dark' ? nativeTheme.dark : nativeTheme.light;

  return (
    <HeaderBackButton
      tintColor={theme.tint}
      pressColor={theme.primarySoft}
      onPress={() => {
        if (onPress) {
          onPress();
          return;
        }

        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/profile');
        }
      }}
    />
  );
}
