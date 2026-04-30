import { useUploadPendingAvatar } from '@/features/auth/hooks/use-upload-pending-avatar';
import { useTabBarHidden } from '@/lib/tab-bar-visibility';
import { useAppTheme } from '@/lib/use-app-theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useUniwind } from 'uniwind';

export const unstable_settings = {
  anchor: 'map',
};

const TAB_BAR_HIDE_DURATION = 180;
const TAB_BAR_HIDE_TRANSLATE_Y = 120;

function AnimatedTabBar(props: BottomTabBarProps) {
  const isTabBarHidden = useTabBarHidden();
  const progress = useRef(new Animated.Value(isTabBarHidden ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: isTabBarHidden ? 1 : 0,
      duration: TAB_BAR_HIDE_DURATION,
      useNativeDriver: true,
    }).start();
  }, [isTabBarHidden, progress]);

  return (
    <Animated.View
      pointerEvents={isTabBarHidden ? 'none' : 'auto'}
      style={{
        opacity: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0],
        }),
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, TAB_BAR_HIDE_TRANSLATE_Y],
            }),
          },
        ],
      }}
    >
      <BottomTabBar {...props} />
    </Animated.View>
  );
}

export default function TabLayout() {
  useUploadPendingAvatar(); // NOTE: uploads avatar picked during signup once the user session is available
  const { theme: activeTheme } = useUniwind();
  const isDark = activeTheme === 'dark';
  const theme = useAppTheme();
  const isTabBarHidden = useTabBarHidden();

  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.mutedText,
        tabBarStyle: {
          display: isTabBarHidden ? 'none' : 'flex',
          backgroundColor: theme.surface,
          borderTopColor: 'transparent',
          shadowColor: isDark ? '#000000' : '#7e1810',
        },
      }}
    >
      <Tabs.Screen
        name="(map)"
        options={{
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialCommunityIcons
              name={focused ? 'map' : 'map-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          popToTopOnBlur: true,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: theme.surface,
            borderTopColor: 'transparent',
            shadowColor: isDark ? '#000000' : '#7e1810',
          },
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialCommunityIcons
              name={focused ? 'plus-circle' : 'plus-circle-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialCommunityIcons
              name={focused ? 'account' : 'account-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
