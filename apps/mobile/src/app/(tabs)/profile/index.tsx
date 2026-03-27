//imports for navigation and UI components
import ProfilePicture from '@/components/profile/profile-picture';
import { Button, ButtonText } from '@/components/ui/button';
import PostGrid from '@/components/ui/post-grid';
import { Screen } from '@/components/ui/screen';
import StatLabel from '@/components/ui/stat-label';
import { nativeTheme } from '@fomo/theme/native';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

// imports for authentication and guest mode
import { GuestMode } from '@/components/profile/guest-mode';
import { allPosts, recentPosts, taggedPosts } from '@/features/posts/post-data';
import { useGuest } from '@/integrations/session/provider';
import { useAuth, useUser } from '@clerk/expo';
import { useConvexAuth } from 'convex/react';
import { useState } from 'react';

//import for icons
import { MaterialIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? nativeTheme.dark : nativeTheme.light;

  // Authentication state from both Clerk and Convex
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut, userId } = useAuth();
  const { user } = useUser();
  const username = user?.username ?? 'Guest';
  const { isGuestMode } = useGuest();

  //In app profile information/states
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'tagged'>('all');
  const description =
    'This is a placeholder bio. In a real app, this would be editable by the user and stored in the backend.';

  return (
    <Screen className="flex-1">
      {isGuestMode ? (
        <GuestMode />
      ) : (
        <ScrollView className="flex-1 bg-app-background pt-20">
          <View className="flex-row items-start p-4">
            <ProfilePicture imageSource={require('@/assets/images/icon.png')} />

            <View className="ml-3 flex-1 pr-0">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-app-text">{username}</Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => router.push('/profile/settings')}
                  className="-mr-3 rounded-full"
                  accessibilityLabel="Open settings"
                >
                  <MaterialIcons name="settings" size={22} color={theme.mutedText} />
                </Button>
              </View>
              <Text className="text-sm leading-5 text-app-text">{description}</Text>
              {/* Placeholder bio text */}
            </View>
          </View>

          <View className="px-4 pb-4">
            <View className="flex-row w-full">
              <View className="flex-1 items-center">
                <StatLabel value={42} label="Posts" onPress={() => {}} />
              </View>
              <View className="flex-1 items-center">
                <StatLabel
                  value={24}
                  label="Followers"
                  onPress={() => router.push('/profile/friends')}
                />
              </View>
            </View>
          </View>

          <View className="mb-4 flex-row px-4">
            <Button
              variant="tertiary"
              className="h-[82px] flex-1 rounded-none border border-app-primary-soft-border bg-app-primary-soft"
            >
              <ButtonText className="text-app-primary-text">Recent Activity</ButtonText>
            </Button>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerClassName="px-4"
          />

          <View className="flex-row border-y border-app-primary-soft-border">
            <TouchableOpacity
              className={`flex-1 items-center py-3 ${activeTab === 'all' ? 'border-b-[5px] border-b-app-tint' : ''}`}
              onPress={() => setActiveTab('all')}
            >
              <Text className={activeTab === 'all' ? 'text-app-tint' : 'text-app-icon'}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 items-center py-3 ${activeTab === 'recent' ? 'border-b-[5px] border-b-app-tint' : ''}`}
              onPress={() => setActiveTab('recent')}
            >
              <Text className={activeTab === 'recent' ? 'text-app-tint' : 'text-app-icon'}>
                Recent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 items-center py-3 ${activeTab === 'tagged' ? 'border-b-[5px] border-b-app-tint' : ''}`}
              onPress={() => setActiveTab('tagged')}
            >
              <Text className={activeTab === 'tagged' ? 'text-app-tint' : 'text-app-icon'}>
                Tagged
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'all' && <PostGrid posts={allPosts} />}
          {activeTab === 'recent' && <PostGrid posts={recentPosts} />}
          {activeTab === 'tagged' && <PostGrid posts={taggedPosts} />}
        </ScrollView>
      )}
    </Screen>
  );
}
