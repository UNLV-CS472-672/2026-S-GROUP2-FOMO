import { useColorScheme } from "react-native";
import { StyleSheet, Text, type TextProps } from "react-native";

import { useCSSVariable } from "uniwind";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const themeColor = useCSSVariable("--color-app-text") as string | undefined;
  const linkColor = useCSSVariable("--color-app-tint") as string | undefined;
  const colorScheme = useColorScheme();
  const color =
    lightColor !== undefined || darkColor !== undefined
      ? (colorScheme === "dark" ? darkColor : lightColor) ?? themeColor
      : type === "link"
        ? linkColor ?? themeColor
        : themeColor;

  return (
    <Text
      style={[
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
  },
});
