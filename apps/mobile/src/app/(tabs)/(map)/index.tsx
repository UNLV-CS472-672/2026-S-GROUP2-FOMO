import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { Button, ButtonText } from "@/components/ui/button";

export default function MapScreen() {
  const { push } = useRouter();

  return (
    <View className="flex-1 items-center justify-center gap-3 bg-app-background p-6">
      <Text className="text-[30px] font-bold leading-8 text-app-text">Map</Text>
      <Text className="text-center text-base leading-6 text-app-text">
        Marker taps will open a nearby H3 feed for that location.
      </Text>

      <Button className="mt-3" onPress={() => push("/feed/demo-cell")}>
        <ButtonText>Open Nearby Feed Demo</ButtonText>
      </Button>

      <Button
        variant="secondary"
        className="mt-2"
        onPress={() => push("/(tabs)/(map)/search")}
      >
        <ButtonText variant="secondary">Open Search</ButtonText>
      </Button>
    </View>
  );
}
