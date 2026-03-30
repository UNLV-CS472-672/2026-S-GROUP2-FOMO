import { Text, View } from 'react-native';

type AuthErrorBannerProps = {
  message?: string;
};

export function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  if (!message) return null;

  return (
    <View className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3">
      <Text className="text-sm font-medium leading-5 text-destructive">{message}</Text>
    </View>
  );
}
