//imports for navigation and UI components
import ProfilePicture from '@/components/profile/profile-picture';
import { Button, ButtonText } from '@/components/ui/button';
import PostGrid from '@/components/ui/post-grid';
import { Screen } from '@/components/ui/screen';
import StatLabel from '@/components/ui/stat-label';
import { useAppTheme } from '@/lib/use-app-theme';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

// imports for authentication and guest mode
import { GuestMode } from '@/components/profile/guest-mode';
import { allPosts, recentPosts, taggedPosts } from '@/features/posts/post-data';
import { useGuest } from '@/integrations/session/provider';
import { useUser } from '@clerk/expo';
import { useState } from 'react';
import { FriendsScreenContent } from './friends';

//import for icons
import { MaterialIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useAppTheme();

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
        <ScrollView className="flex-1 bg-background pt-20" contentContainerClassName="pb-8">
          <View className="flex-row items-start p-4">
            <ProfilePicture imageSource={require('@/assets/images/icon.png')} />

            <View className="ml-3 flex-1 pr-0">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-foreground">{username}</Text>
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
              <Text className="text-sm leading-5 text-foreground">{description}</Text>
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
                  label="Friends"
                  onPress={() => router.push('/profile/friends')}
                />
              </View>
            </View>
          </View>

          <View className="mb-4 flex-row px-4">
            <Button variant="tertiary" className="h-[82px] flex-1 rounded-none">
              <ButtonText variant="tertiary">Recent Activity</ButtonText>
            </Button>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerClassName="px-4"
          />

          <View className="flex-row border-y border-primary-soft-border">
            <TouchableOpacity
              className={`flex-1 items-center py-3 ${activeTab === 'all' ? 'border-b-[5px] border-b-primary' : ''}`}
              onPress={() => setActiveTab('all')}
            >
              <Text className={activeTab === 'all' ? 'text-primary' : 'text-muted-foreground'}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 items-center py-3 ${activeTab === 'recent' ? 'border-b-[5px] border-b-primary' : ''}`}
              onPress={() => setActiveTab('recent')}
            >
              <Text className={activeTab === 'recent' ? 'text-primary' : 'text-muted-foreground'}>
                Recent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 items-center py-3 ${activeTab === 'tagged' ? 'border-b-[5px] border-b-primary' : ''}`}
              onPress={() => setActiveTab('tagged')}
            >
              <Text className={activeTab === 'tagged' ? 'text-primary' : 'text-muted-foreground'}>
                Tagged
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'all' && <PostGrid posts={allPosts} />}
          {activeTab === 'recent' && <PostGrid posts={recentPosts} />}
          {activeTab === 'tagged' && <PostGrid posts={taggedPosts} />}

          <View className="mt-6 border-t border-primary-soft-border pt-2">
            <FriendsScreenContent />
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
