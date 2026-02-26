import { ScrollView, Text } from "react-native";

export default function MapSearchScreen() {
  return (
    <ScrollView
      className="flex-1 bg-app-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ flexGrow: 1, padding: 24, rowGap: 8 }}
    >
      <Text className="text-[30px] font-bold leading-8 text-app-text">
        Search
      </Text>
      <Text className="text-base leading-6 text-app-text">
        Search by event title, tag, or place name.
      </Text>
    </ScrollView>
  );
}
