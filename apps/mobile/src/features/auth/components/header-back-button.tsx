import { nativeTheme } from '@fomo/theme/native';
import { HeaderBackButton } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';

type AuthHeaderBackButtonProps = {
  onPress?: () => void;
};

export function AuthHeaderBackButton({ onPress }: AuthHeaderBackButtonProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? nativeTheme.dark : nativeTheme.light;

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
