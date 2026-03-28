import { Text, View } from 'react-native';

type AuthErrorBannerProps = {
  message?: string;
};

export function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  if (!message) return null;

  return (
    <View className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
      <Text className="text-sm font-medium leading-5 text-red-800">{message}</Text>
    </View>
  );
}
