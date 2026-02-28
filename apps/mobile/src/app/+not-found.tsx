import { Link } from 'expo-router';
import { ScrollView, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <ScrollView
      className="flex-1 bg-app-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        rowGap: 12,
      }}
    >
      <Text className="text-[28px] font-bold leading-8 text-app-text">Page not found</Text>
      <Link href="/" className="rounded-xl bg-app-tint px-4 py-2">
        <Text className="font-semibold text-white">Go home</Text>
      </Link>
    </ScrollView>
  );
}
