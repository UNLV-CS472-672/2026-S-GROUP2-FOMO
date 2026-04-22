//imports for navigation and UI components
import ProfilePicture from '@/components/profile/profile-picture';
import { Button, ButtonText } from '@/components/ui/button';
import PostGrid from '@/components/ui/post-grid';
import { Screen } from '@/components/ui/screen';
import StatLabel from '@/components/ui/stat-label';
import { Authenticated, GuestOnly } from '@/features/auth/components/auth-gate';
import { useAppTheme } from '@/lib/use-app-theme';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Alert, ImageSourcePropType, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// imports for authentication and guest mode
import { GuestMode } from '@/components/profile/guest-mode';
import { allPosts, recentPosts, taggedPosts } from '@/features/posts/post-data';
import { useUser } from '@clerk/expo';
import { useState } from 'react';
import { useUniwind } from 'uniwind';

//import for icons
import { MaterialIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { theme: activeTheme } = useUniwind();
  const recentActivityButtonVariant = activeTheme === 'dark' ? 'primary' : 'tertiary';

  const { user } = useUser();
  const username = user?.username ?? 'Guest';

  //In app profile information/states
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'tagged'>('all');
  const [profileImageSource, setProfileImageSource] = useState<ImageSourcePropType>(
    require('@/assets/images/icon.png')
  );
  const description =
    'This is a placeholder bio. In a real app, this would be editable by the user and stored in the backend.';

  const handleSelectProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow photo library access to choose a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setProfileImageSource({ uri: result.assets[0].uri });
    }
  };

  return (
    <Screen className="flex-1">
      <GuestOnly>
        <GuestMode />
      </GuestOnly>
      <Authenticated>
        <ScrollView className="flex-1 bg-background pt-20" contentContainerClassName="pb-8">
          <View className="flex-row items-start p-4">
            <ProfilePicture imageSource={profileImageSource} onPress={handleSelectProfileImage} />

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
                  onPress={() => router.push('/profile/friends?source=profile')}
                />
              </View>
            </View>
          </View>

          <View className="mb-4 flex-row px-4">
            <Button variant={recentActivityButtonVariant} className="h-[82px] flex-1 rounded-2xl">
              <ButtonText variant={recentActivityButtonVariant}>Recent Activity</ButtonText>
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
        </ScrollView>
      </Authenticated>
    </Screen>
  );
}
