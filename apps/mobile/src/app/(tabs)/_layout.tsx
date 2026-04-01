import { useAppTheme } from '@/lib/use-app-theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';
import { useUniwind } from 'uniwind';

export const unstable_settings = {
  anchor: 'map',
};

export default function TabLayout() {
  const { theme: activeTheme } = useUniwind();
  const isDark = activeTheme === 'dark';
  const theme = useAppTheme();
  const selectedTabColor = Platform.OS === 'android' ? theme.background : theme.tint;

  return (
    <NativeTabs
      backgroundColor={theme.surface}
      disableTransparentOnScrollEdge
      blurEffect={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterial'}
      iconColor={{ default: theme.mutedText, selected: selectedTabColor }}
      tintColor={theme.tint}
      labelStyle={{
        default: {
          color: theme.mutedText,
          fontSize: 11,
          fontWeight: '600',
        },
        selected: {
          color: theme.background,
          fontSize: 11,
          fontWeight: '700',
        },
      }}
      indicatorColor={theme.tint}
      shadowColor={isDark ? '#000000' : '#7e1810'}
    >
      {/* map screen */}
      <NativeTabs.Trigger name="(map)">
        <Label hidden />
        <Icon
          sf={{ default: 'map', selected: 'map.fill' }}
          androidSrc={{
            default: <VectorIcon family={MaterialCommunityIcons} name="map-outline" />,
            selected: <VectorIcon family={MaterialCommunityIcons} name="map" />,
          }}
          selectedColor={selectedTabColor}
        />
      </NativeTabs.Trigger>
      {/* create post/event screen */}
      <NativeTabs.Trigger name="create">
        <Label hidden />
        <Icon
          sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }}
          androidSrc={{
            default: <VectorIcon family={MaterialCommunityIcons} name="plus-circle-outline" />,
            selected: <VectorIcon family={MaterialCommunityIcons} name="plus-circle" />,
          }}
          selectedColor={selectedTabColor}
        />
      </NativeTabs.Trigger>
      {/* profile screen */}
      <NativeTabs.Trigger name="profile">
        <Label hidden />
        <Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          androidSrc={{
            default: <VectorIcon family={MaterialCommunityIcons} name="account-outline" />,
            selected: <VectorIcon family={MaterialCommunityIcons} name="account" />,
          }}
          selectedColor={selectedTabColor}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
