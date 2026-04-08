import PostGrid from '@/components/ui/post-grid';
import { Screen } from '@/components/ui/screen';
import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface GridPost {
  id: string | number;
  image: any;
}

interface Event {
  id: string | number;
  image: any;
  description: string;
  posts: GridPost[];
}

const EVENT_IMAGES = [
  require('@/assets/images/rigrig.jpg'),
  require('@/assets/images/jonah-mog.png'),
  require('@/assets/images/git-learning-class.png'),
  require('@/assets/images/rate-my-date.jpg'),
];

const SAMPLE_POSTS: GridPost[] = [
  { id: 'p1', image: require('@/assets/images/rigrig.jpg') },
  { id: 'p2', image: require('@/assets/images/jonah-mog.png') },
  { id: 'p3', image: require('@/assets/images/git-learning-class.png') },
  { id: 'p4', image: require('@/assets/images/rate-my-date.jpg') },
];

export default function EventDetails() {
  const theme = useAppTheme();
  const events = useQuery(api.data_ml.events.getEvents) ?? [];
  const { h3Id } = useLocalSearchParams<{ h3Id?: string | string[] }>();
  const resolvedH3Id = Array.isArray(h3Id) ? h3Id[0] : h3Id;

  const event = useMemo(() => {
    if (!resolvedH3Id) return null;

    const eventIndex = events.findIndex((event) => event.location.h3Index === resolvedH3Id);

    if (eventIndex === -1) return null;

    const event = events[eventIndex];
    const attendeeCount = event?.attendeeCount ?? 0;

    return {
      id: resolvedH3Id,
      image: EVENT_IMAGES[eventIndex % EVENT_IMAGES.length],
      description: `${event.name}\n${event.organization}\n${attendeeCount} attending\n\n${event.description}`,
      posts: SAMPLE_POSTS,
    } satisfies Event;
  }, [events, resolvedH3Id]);

  if (!event) {
    return (
      <Screen className="items-center justify-center">
        <Stack.Screen options={{ title: 'Event Details' }} />
        <Text className="text-foreground">Event not found</Text>
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
              source={event.image}
              className="h-44 w-full rounded-2xl border border-border"
              resizeMode="cover"
            />
            <Text className="mt-3 text-base font-semibold text-foreground">
              {event.description}
            </Text>
          </View>
          <TouchableOpacity
            className="h-12 w-12 items-center justify-center rounded-full border border-border bg-background"
            activeOpacity={0.75}
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="Like post"
          >
            <Ionicons name="heart" size={24} color={theme.mutedText} />
          </TouchableOpacity>
        </View>

        <View className="w-[60%] overflow-hidden rounded-2xl border border-border bg-background">
          <View className="flex-1">
            <PostGrid posts={event.posts} />
          </View>
        </View>
      </View>
    </Screen>
  );
}
