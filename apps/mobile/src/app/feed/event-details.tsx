import { Screen } from '@/components/ui/screen';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Post {
  id: string | number;
  image: any;
}

interface Ad {
  id: string | number;
  image: any;
  description: string;
  hashtags?: string[];
  posts: Post[];
}

const POSTS_PAGE_SIZE = 12;

export default function EventDetails() {
  const { ad: adParam } = useLocalSearchParams<{ ad?: string | string[] }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const parsedAdParam = Array.isArray(adParam) ? adParam[0] : adParam;
  const [visibleCount, setVisibleCount] = useState(POSTS_PAGE_SIZE);

  let ad: Ad | null = null;
  if (parsedAdParam) {
    try {
      ad = JSON.parse(parsedAdParam) as Ad;
    } catch {
      ad = null;
    }
  }

  const visiblePosts = ad?.posts.slice(0, visibleCount) ?? [];
  const hasMorePosts = visibleCount < (ad?.posts.length ?? 0);

  if (!ad) {
    return (
      <Screen className="items-center justify-center">
        <Stack.Screen options={{ title: 'Event Details' }} />
        <Text className="text-app-text">Event not found</Text>
      </Screen>
    );
  }

  const hashtagsText =
    ad.hashtags && ad.hashtags.length > 0 ? ad.hashtags.join(' ') : '#event #community #trending';

  const loadMorePosts = () => {
    if (!hasMorePosts) return;
    setVisibleCount((current) => Math.min(current + POSTS_PAGE_SIZE, ad.posts.length));
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      className="aspect-square w-1/3 border border-app-border"
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: '../profile/post-details',
          params: {
            postId: String(item.id),
          },
        })
      }
      accessibilityRole="button"
      accessibilityLabel="Open post"
    >
      <Image source={item.image} className="h-full w-full" resizeMode="cover" />
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View className="px-4 pb-2 pt-3">
      <View className="relative h-56 overflow-hidden rounded-2xl border-2 border-app-border bg-black/5">
        <Image source={ad.image} className="h-full w-full" resizeMode="contain" />

        <TouchableOpacity
          className="absolute bottom-3 right-3 h-12 w-12 items-center justify-center rounded-full border border-app-border bg-background/95"
          activeOpacity={0.75}
          onPress={() => {}}
          accessibilityRole="button"
          accessibilityLabel="Like ad"
        >
          <Ionicons name="heart" size={24} color="#687076" />
        </TouchableOpacity>
      </View>

      <Text className="mt-4 text-xl font-semibold text-app-text">{ad.description}</Text>
      <Text className="mt-2 text-base font-medium text-app-text">{hashtagsText}</Text>
      <Text className="mt-8 mb-3 text-2xl font-semibold text-app-text">Event Feed</Text>
    </View>
  );

  return (
    <Screen className="flex-1">
      <Stack.Screen options={{ headerShown: false }} />

      <View
        className="flex-row items-center gap-2 px-4 pb-2"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity
          className="h-10 w-10 items-center justify-center"
          activeOpacity={0.75}
          onPress={() => router.push('/(tabs)/(map)')}
          accessibilityRole="button"
          accessibilityLabel="Back to map"
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-app-text">Feed</Text>
      </View>

      <FlatList
        data={visiblePosts}
        renderItem={renderPostItem}
        keyExtractor={(item) => String(item.id)}
        numColumns={3}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={
          hasMorePosts ? (
            <View className="items-center py-5">
              <ActivityIndicator />
            </View>
          ) : (
            <View className="py-5" />
          )
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
