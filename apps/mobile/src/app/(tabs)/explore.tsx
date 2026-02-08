import { Platform } from "react-native";

import { ExternalLink } from "@/components/external-link";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { Collapsible } from "@/components/ui/collapsible";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Image } from "@/components/image";
import { Text, View } from "react-native";

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={{ position: "absolute", bottom: -90, left: -35 }}
        />
      }
    >
      <View className="flex-row gap-2">
        <Text className="font-rounded text-[32px] font-bold leading-10 text-app-text">
          Explore
        </Text>
      </View>
      <Text className="text-base leading-6 text-app-text">
        This app includes example code to help you get started.
      </Text>
      <Collapsible title="File-based routing">
        <Text className="text-base leading-6 text-app-text">
          This app has two screens:{" "}
          <Text className="text-base font-semibold leading-6">
            app/(tabs)/index.tsx
          </Text>{" "}
          and{" "}
          <Text className="text-base font-semibold leading-6">
            app/(tabs)/explore.tsx
          </Text>
        </Text>
        <Text className="text-base leading-6 text-app-text">
          The layout file in{" "}
          <Text className="text-base font-semibold leading-6">
            app/(tabs)/_layout.tsx
          </Text>{" "}
          sets up the tab navigator.
        </Text>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <Text className="text-base leading-[30px] text-[#0a7ea4]">
            Learn more
          </Text>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Android, iOS, and web support">
        <Text className="text-base leading-6 text-app-text">
          You can open this project on Android, iOS, and the web. To open the
          web version, press{" "}
          <Text className="text-base font-semibold leading-6">w</Text> in the
          terminal running this project.
        </Text>
      </Collapsible>
      <Collapsible title="Images">
        <Text className="text-base leading-6 text-app-text">
          For static images, you can use the{" "}
          <Text className="text-base font-semibold leading-6">@2x</Text> and{" "}
          <Text className="text-base font-semibold leading-6">@3x</Text>{" "}
          suffixes to provide files for different screen densities
        </Text>
        <Image
          source={require("@/assets/images/react-logo.png")}
          className="h-[100px] w-[100px] self-center"
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <Text className="text-base leading-[30px] text-[#0a7ea4]">
            Learn more
          </Text>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Light and dark mode components">
        <Text className="text-base leading-6 text-app-text">
          This template has light and dark mode support. The{" "}
          <Text className="text-base font-semibold leading-6">
            useColorScheme()
          </Text>{" "}
          hook lets you inspect what the user&apos;s current color scheme is,
          and so you can adjust UI colors accordingly.
        </Text>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <Text className="text-base leading-[30px] text-[#0a7ea4]">
            Learn more
          </Text>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Animations">
        <Text className="text-base leading-6 text-app-text">
          This template includes an example of an animated component. The{" "}
          <Text className="text-base font-semibold leading-6">
            components/HelloWave.tsx
          </Text>{" "}
          component uses the powerful{" "}
          <Text className="font-mono text-base font-semibold leading-6">
            react-native-reanimated
          </Text>{" "}
          library to create a waving hand animation.
        </Text>
        {Platform.select({
          ios: (
            <Text className="text-base leading-6 text-app-text">
              The{" "}
              <Text className="text-base font-semibold leading-6">
                components/ParallaxScrollView.tsx
              </Text>{" "}
              component provides a parallax effect for the header image.
            </Text>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}
