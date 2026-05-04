import {
  AppleAuthenticationButton,
  AppleAuthenticationButtonStyle,
  AppleAuthenticationButtonType,
} from 'expo-apple-authentication';
import { useColorScheme, View } from 'react-native';

type AppleButtonProps = {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  mode?: 'login' | 'signup';
};

export function AppleButton({ onPress, loading, disabled, mode = 'login' }: AppleButtonProps) {
  const colorScheme = useColorScheme();
  const isDisabled = Boolean(disabled || loading);

  return (
    <View className={isDisabled ? 'opacity-50 -mb-2.5' : '-mb-2.5'}>
      <AppleAuthenticationButton
        buttonType={
          mode === 'signup'
            ? AppleAuthenticationButtonType.SIGN_UP
            : AppleAuthenticationButtonType.SIGN_IN
        }
        buttonStyle={
          colorScheme === 'dark'
            ? AppleAuthenticationButtonStyle.WHITE
            : AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={16}
        style={{ width: '100%', height: 48 }}
        onPress={isDisabled ? () => {} : onPress}
      />
    </View>
  );
}
