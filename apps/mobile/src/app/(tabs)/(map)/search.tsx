import { ScrollView, Text } from 'react-native';

export default function MapSearchScreen() {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ flexGrow: 1, padding: 24, rowGap: 8 }}
    >
      <Text className="text-[30px] font-bold leading-8 text-foreground">Search</Text>
      <Text className="text-base leading-6 text-foreground">
        Search by event title, tag, or place name.
      </Text>
    </ScrollView>
  );
}
