import { Button } from '@/components/ui/button';
import PostGrid from '@/components/ui/post-grid';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ProfileDescription from './components/profile-description';
import ProfilePicture from './components/profile-picture';
import ProfileUsername from './components/profile-username';
import StatLabel from './components/stat-label';

export default function ProfileScreen() {
  const { push } = useRouter();

  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'tagged'>('all');

  const allPosts = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    image: require('@/assets/images/icon.png'),
    comments: ['Great post!', 'Love this!', 'Amazing!'],
  }));

  const recentPosts = Array.from({ length: 6 }, (_, i) => ({
    id: `recent-${i}`,
    image: require('@/assets/images/icon.png'),
    comments: ['Just posted!', 'Fresh content!', 'Love it!'],
  }));

  const taggedPosts = Array.from({ length: 4 }, (_, i) => ({
    id: `tagged-${i}`,
    image: require('@/assets/images/icon.png'),
    comments: ['Tagged in this!', 'Amazing moment!', 'Great shot!'],
  }));

  return (
    <ScrollView className="flex-1 bg-background pt-20">
      {/* removed separate top-right settings row */}

      <View className="flex-row items-start p-4">
        <ProfilePicture imageSource={require('@/assets/images/icon.png')} />

        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between">
            <ProfileUsername username="Pandamanawesome" />

            <Button
              variant="icon"
              size="sm"
              accessibilityLabel="Open settings"
              onPress={() => push('/profile/settings')}
            >
              <MaterialIcons name="settings" size={22} />
            </Button>
          </View>

          <ProfileDescription description={`WOOOOO FOMO✨\nBazinga! YAY`} />
        </View>
      </View>

      <View className="px-4 pb-4">
        <View className="flex-row w-full">
          <View className="flex-1 items-center">
            <StatLabel value={42} label="Posts" onPress={() => {}} />
          </View>
          <View className="flex-1 items-center">
            <StatLabel value={180} label="Following" onPress={() => push('/profile/following')} />
          </View>
          <View className="flex-1 items-center">
            <StatLabel value={24} label="Followers" onPress={() => push('/profile/followers')} />
          </View>
        </View>
      </View>

      <View className="mb-4 flex-row px-4">
        <TouchableOpacity className="h-[82px] flex-1 items-center justify-center rounded-2xl border border-app-border">
          <Text className="text-sm font-semibold text-app-text">Recent Activity</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        contentContainerClassName="px-4"
      />

      <View className="flex-row border-y border-neutral-300">
        <TouchableOpacity
          className={`flex-1 items-center py-3 ${activeTab === 'all' ? 'border-b-[5px] border-b-app-border' : ''}`}
          onPress={() => setActiveTab('all')}
        >
          <Text className={activeTab === 'all' ? 'text-app-border' : 'text-muted-foreground'}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 items-center py-3 ${activeTab === 'recent' ? 'border-b-[5px] border-b-app-border' : ''}`}
          onPress={() => setActiveTab('recent')}
        >
          <Text className={activeTab === 'recent' ? 'text-app-border' : 'text-muted-foreground'}>
            Recent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 items-center py-3 ${activeTab === 'tagged' ? 'border-b-[5px] border-b-app-border' : ''}`}
          onPress={() => setActiveTab('tagged')}
        >
          <Text className={activeTab === 'tagged' ? 'text-app-border' : 'text-muted-foreground'}>
            Tagged
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'all' && <PostGrid posts={allPosts} />}
      {activeTab === 'recent' && <PostGrid posts={recentPosts} />}
      {activeTab === 'tagged' && <PostGrid posts={taggedPosts} />}
    </ScrollView>
  );
}
