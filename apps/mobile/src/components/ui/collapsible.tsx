import { PropsWithChildren, useState } from "react";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Pressable, Text, View } from "react-native";
import { useCSSVariable } from "uniwind";

export function Collapsible({
  children,
  title,
}: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const iconColor = (useCSSVariable("--color-app-icon") as string | undefined) ?? "#687076";

  return (
    <View>
      <Pressable onPress={() => setIsOpen((value) => !value)}>
        <View className="flex-row items-center gap-1.5">
          <IconSymbol
            name="chevron.right"
            size={18}
            weight="medium"
            color={iconColor}
            style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}
          />
          <Text className="text-base font-semibold leading-6 text-app-text">
            {title}
          </Text>
        </View>
      </Pressable>
      {isOpen && (
        <View className="ml-6 mt-1.5">{children}</View>
      )}
    </View>
  );
}
