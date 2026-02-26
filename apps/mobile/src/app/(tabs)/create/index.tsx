import { useRouter } from "expo-router";
import { ScrollView, Text } from "react-native";

import { Button, ButtonText } from "@/components/ui/button";

export default function CreateScreen() {
  const { push } = useRouter();

  return (
    <ScrollView
      className="flex-1  gap-3 bg-app-background p-6"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        rowGap: 12,
      }}
    >
      <Text className="text-[30px] font-bold leading-8 text-app-text">
        Create
      </Text>
      <Text className="text-base leading-6 text-app-text">
        Choose what you want to publish.
      </Text>

      <Button
        variant="secondary"
        size="lg"
        className="items-start"
        onPress={() => push("/create/event")}
      >
        <ButtonText
          variant="secondary"
          className="text-xl font-semibold text-app-text"
        >
          Create Event
        </ButtonText>
        <Text className="mt-1 text-base leading-6 text-app-text">
          Host an event with location, time, and details.
        </Text>
      </Button>

      <Button
        variant="secondary"
        size="lg"
        className="items-start"
        onPress={() => push("/create/post")}
      >
        <ButtonText
          variant="secondary"
          className="text-xl font-semibold text-app-text"
        >
          Create Post
        </ButtonText>
        <Text className="mt-1 text-base leading-6 text-app-text">
          Share an update, photo, or thought with the community.
        </Text>
      </Button>
    </ScrollView>
  );
}
