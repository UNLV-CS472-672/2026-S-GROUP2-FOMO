import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { nativeTheme } from '@fomo/theme/native';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

export const unstable_settings = {
  anchor: 'map',
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? nativeTheme.dark : nativeTheme.light;

  return (
    <NativeTabs
      backgroundColor={theme.surface}
      disableTransparentOnScrollEdge
      blurEffect={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterial'}
      iconColor={{ default: theme.mutedText, selected: theme.tint }}
      tintColor={theme.tint}
      labelStyle={{
        default: {
          color: theme.mutedText,
          fontSize: 11,
          fontWeight: '600',
        },
        selected: {
          color: theme.tint,
          fontSize: 11,
          fontWeight: '700',
        },
      }}
      rippleColor={theme.primarySoft}
      indicatorColor={theme.tint}
      shadowColor={isDark ? '#000000' : '#7e1810'}
    >
      {/* map screen */}
      <NativeTabs.Trigger name="(map)">
        <Label hidden />
        <Icon
          sf={{ default: 'map', selected: 'map.fill' }}
          androidSrc={<VectorIcon family={MaterialIcons} name="map" />}
          selectedColor={theme.tint}
        />
      </NativeTabs.Trigger>
      {/* create post/event screen */}
      <NativeTabs.Trigger name="create">
        <Label hidden />
        <Icon
          sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }}
          androidSrc={<VectorIcon family={MaterialIcons} name="add-circle" />}
          selectedColor={theme.tint}
        />
      </NativeTabs.Trigger>
      {/* profile screen */}
      <NativeTabs.Trigger name="profile">
        <Label hidden />
        <Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          androidSrc={<VectorIcon family={MaterialIcons} name="person" />}
          selectedColor={theme.tint}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
