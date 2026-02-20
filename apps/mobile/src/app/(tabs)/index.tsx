import { Platform, Text, View } from "react-native";

import { HelloWave } from "@/components/hello-wave";
import { Image } from "@/components/image";
import type { Href } from "expo-router";

import { Link } from "@/components/link";
import ParallaxScrollView from "@/components/parallax-scroll-view";

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          className="absolute bottom-0 left-0 h-[178px] w-[290px]"
        />
      }
    >
      {/* Title */}
      <View className="flex-row items-center gap-2">
        <Text className="text-[32px] leading-8 font-bold text-app-text">
          Welcome!
        </Text>
        <HelloWave />
      </View>

      {/* Step 1 */}
      <View className="mb-2 gap-2">
        <Text className="text-[20px] font-bold text-app-text">
          Step 1: Try it
        </Text>

        <Text className="text-base leading-6 text-app-text">
          Edit{" "}
          <Text className="text-base leading-6 font-semibold">
            app/(tabs)/index.tsx
          </Text>{" "}
          to see changes. Press{" "}
          <Text className="text-base leading-6 font-semibold">
            {Platform.select({
              ios: "cmd + d",
              android: "cmd + m",
              web: "F12",
            })}
          </Text>{" "}
          to open developer tools.
        </Text>
      </View>

      {/* Step 2 */}
      <View className="mb-2 gap-2">
        <Link href={"/modal" as Href}>
          <Link.Trigger>
            <Text className="text-[20px] font-bold text-app-text!">
              Step 2: Explore
            </Text>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction
              title="Action"
              icon="cube"
              onPress={() => alert("Action pressed")}
            />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert("Share pressed")}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert("Delete pressed")}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <Text className="text-base leading-6 text-app-text">
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </Text>
      </View>

      {/* Step 3 */}
      <View className="mb-2 gap-2">
        <Text className="text-[20px] font-bold text-app-text">
          Step 3: Get a fresh start
        </Text>

        <Text className="text-base leading-6 text-app-text">
          {`When you're ready, run `}
          <Text className="text-base leading-6 font-semibold">
            npm run reset-project
          </Text>{" "}
          to get a fresh{" "}
          <Text className="text-base leading-6 font-semibold">app</Text>{" "}
          directory. This will move the current{" "}
          <Text className="text-base leading-6 font-semibold">app</Text> to{" "}
          <Text className="text-base leading-6 font-semibold">app-example</Text>
          .
        </Text>
      </View>
    </ParallaxScrollView>
  );
}
