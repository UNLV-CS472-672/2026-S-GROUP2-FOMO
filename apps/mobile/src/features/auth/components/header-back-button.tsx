import { HeaderBackButton } from '@react-navigation/elements';
import { useRouter } from 'expo-router';

type AuthHeaderBackButtonProps = {
  onPress?: () => void;
};

export function AuthHeaderBackButton({ onPress }: AuthHeaderBackButtonProps) {
  const router = useRouter();

  return (
    <HeaderBackButton
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
