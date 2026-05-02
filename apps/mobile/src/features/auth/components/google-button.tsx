import { Image, Pressable, Text, useColorScheme } from 'react-native';

type GoogleButtonProps = {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  mode?: 'login' | 'signup';
};

export function GoogleButton({ onPress, loading, disabled, mode = 'login' }: GoogleButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const label = mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={
        disabled || loading
          ? 'h-14 w-full flex-row items-center justify-center opacity-50'
          : 'h-14 w-full flex-row items-center justify-center'
      }
      style={{
        backgroundColor: isDark ? '#131314' : '#FFFFFF',
        borderColor: isDark ? '#8E918F' : '#747775',
        borderWidth: 1,
        borderRadius: 16,
      }}
    >
      <Image
        source={require('../../../../../../assets/auth/google/g-logo.png')}
        style={{ width: 20, height: 20, marginRight: 12 }}
        resizeMode="contain"
        accessible={false}
      />
      <Text
        style={{
          color: isDark ? '#E3E3E3' : '#1F1F1F',
          fontSize: 20,
          lineHeight: 24,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
