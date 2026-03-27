import { Button, ButtonText } from '@/components/ui/button';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

type GoogleButtonProps = {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  mode?: 'login' | 'signup';
};

export function GoogleButton({ onPress, loading, disabled, mode = 'login' }: GoogleButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const label = mode === 'signup' ? 'Sign up with Google' : 'Log in with Google';

  return (
    <Button
      variant="secondary"
      size="lg"
      onPress={onPress}
      disabled={disabled || loading}
      className="flex-row items-center justify-center gap-2"
    >
      <Ionicons name="logo-google" size={20} color={isDark ? 'white' : 'black'} />
      <ButtonText variant="secondary">{label}</ButtonText>
    </Button>
  );
}
