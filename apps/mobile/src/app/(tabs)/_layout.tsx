import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from "expo-router/unstable-native-tabs";

export const unstable_settings = {
  anchor: "map",
};

export default function TabLayout() {
  return (
    <NativeTabs
      disableTransparentOnScrollEdge
      backgroundColor="#0a0a0a"
      iconColor={{ default: "#888", selected: "#fff" }}
      labelStyle={{ color: "#888", fontSize: 10 }}
      blurEffect="systemChromeMaterialDark"
      rippleColor="rgba(255,255,255,0.1)"
    >
      <NativeTabs.Trigger name="(map)">
        <Label hidden />
        <Icon
          sf="map.fill"
          androidSrc={<VectorIcon family={MaterialIcons} name="map" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="create">
        <Label hidden />
        <Icon
          sf="plus.circle.fill"
          androidSrc={<VectorIcon family={MaterialIcons} name="add-circle" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label hidden />
        <Icon
          sf="person.fill"
          androidSrc={<VectorIcon family={MaterialIcons} name="person" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
