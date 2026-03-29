import PostGrid from '@/components/ui/post-grid';
import { Screen } from '@/components/ui/screen';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface Post {
  id: string | number;
  image: any;
}

interface Ad {
  id: string | number;
  image: any;
  description: string;
  posts: Post[];
}

export default function EventDetails() {
  const { ad: adParam } = useLocalSearchParams<{ ad?: string | string[] }>();
  const parsedAdParam = Array.isArray(adParam) ? adParam[0] : adParam;

  let ad: Ad | null = null;
  if (parsedAdParam) {
    try {
      ad = JSON.parse(parsedAdParam) as Ad;
    } catch {
      ad = null;
    }
  }

  if (!ad) {
    return (
      <Screen className="items-center justify-center">
        <Stack.Screen options={{ title: 'Event Details' }} />
        <Text className="text-app-text">Event not found</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Event Details' }} />
      <View className="flex-1 flex-row px-4 pb-4 pt-3">
        <View className="w-[40%] justify-between pr-2">
          <View>
            <Image
              source={ad.image}
              className="h-44 w-full rounded-2xl border border-app-border"
              resizeMode="cover"
            />
            <Text className="mt-3 text-base font-semibold text-app-text">{ad.description}</Text>
          </View>
          <TouchableOpacity
            className="h-12 w-12 items-center justify-center rounded-full border border-app-border bg-background"
            activeOpacity={0.75}
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="Like ad"
          >
            <Ionicons name="heart" size={24} color="#687076" />
          </TouchableOpacity>
        </View>

        <View className="w-[60%] overflow-hidden rounded-2xl border border-app-border bg-background">
          <View className="flex-1">
            <PostGrid posts={ad.posts} />
          </View>
        </View>
      </View>
    </Screen>
  );
}
