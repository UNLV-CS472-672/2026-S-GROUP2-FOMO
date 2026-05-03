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
          ? 'h-12 w-full flex-row items-center justify-center opacity-50 rounded-full'
          : 'h-12 w-full flex-row items-center justify-center rounded-full'
      }
      style={{
        backgroundColor: isDark ? '#131314' : '#FFFFFF',
        borderColor: isDark ? '#8E918F' : '#747775',
        borderWidth: 1,
      }}
    >
      <Image
        source={require('../../../../../../assets/auth/google/g-logo.png')}
        style={{ width: 16, height: 16, marginRight: 5 }}
        resizeMode="contain"
        accessible={false}
      />
      <Text
        style={{
          color: isDark ? '#E3E3E3' : '#1F1F1F',
          fontSize: 17,
          lineHeight: 26,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
