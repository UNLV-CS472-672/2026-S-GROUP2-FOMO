import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text } from 'react-native';

export default function FeedModal() {
  const { h3Id } = useLocalSearchParams<{ h3Id: string }>();

  return (
    <ScrollView
      className="flex-1 bg-app-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ flexGrow: 1, padding: 24, rowGap: 12 }}
    >
      <Stack.Screen options={{ title: 'Feed' }} />
      <Text className="text-base leading-6 text-app-text">
        Showing posts/events for H3 cell: <Text className="font-semibold">{h3Id ?? 'unknown'}</Text>
      </Text>
    </ScrollView>
  );
}
