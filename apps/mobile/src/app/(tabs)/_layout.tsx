import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

export const unstable_settings = {
  anchor: 'map',
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <NativeTabs
      disableTransparentOnScrollEdge
      blurEffect={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterial'}
    >
      {/* map screen */}
      <NativeTabs.Trigger name="(map)">
        <Label hidden />
        <Icon sf="map.fill" androidSrc={<VectorIcon family={MaterialIcons} name="map" />} />
      </NativeTabs.Trigger>
      {/* create post/event screen */}
      <NativeTabs.Trigger name="create">
        <Label hidden />
        <Icon
          sf="plus.circle.fill"
          androidSrc={<VectorIcon family={MaterialIcons} name="add-circle" />}
        />
      </NativeTabs.Trigger>
      {/* profile screen */}
      <NativeTabs.Trigger name="profile">
        <Label hidden />
        <Icon sf="person.fill" androidSrc={<VectorIcon family={MaterialIcons} name="person" />} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
