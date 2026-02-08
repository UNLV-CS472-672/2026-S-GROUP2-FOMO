import type { PropsWithChildren, ReactElement } from "react";
import { Platform } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { View } from "react-native";
import { useCSSVariable } from "uniwind";

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const backgroundColor = useCSSVariable("--color-app-background") as
    | string
    | undefined;
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75],
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [2, 1, 1],
          ),
        },
      ],
    };
  });

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      <Animated.ScrollView
        ref={scrollRef}
        style={{
          flex: 1,
          backgroundColor:
            Platform.OS === "web" ? backgroundColor : "transparent",
        }}
        contentContainerStyle={{ flexGrow: 1 }}
        scrollEventThrottle={16}
      >
        <Animated.View
          style={[
            headerAnimatedStyle,
            {
              height: HEADER_HEIGHT,
              backgroundColor: headerBackgroundColor[colorScheme],
            },
          ]}
        >
          {headerImage}
        </Animated.View>
        <View className="flex-1 gap-4 p-8" style={{ backgroundColor }}>
          {children}
        </View>
      </Animated.ScrollView>
    </View>
  );
}
