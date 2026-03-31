import { HeaderBackButton } from '@react-navigation/elements';
import { useRouter } from 'expo-router';

import { useAppTheme } from '@/lib/use-app-theme';

type AppHeaderBackButtonProps = {
  onPress?: () => void;
};

export function AppHeaderBackButton({ onPress }: AppHeaderBackButtonProps) {
  const router = useRouter();
  const theme = useAppTheme();

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
