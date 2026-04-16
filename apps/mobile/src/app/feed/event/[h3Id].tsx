import PostGrid from '@/components/ui/post-grid';
import { Screen } from '@/components/ui/screen';
import { coordsToH3Cell } from '@/features/map/utils/h3';
import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { eventSeedAttendees, eventSeeds } from '@fomo/backend/convex/seed';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface GridPost {
  id: string | number;
  image: any;
}

const EVENT_IMAGES = [
  require('@/assets/images/Battle Blast.png'),
  require('@/assets/images/Board Game Night.png'),
  require('@/assets/images/Boxing Match Ad.jpg'),
  require('@/assets/images/EDC.png'),
  require('@/assets/images/rigrig.jpg'),
  require('@/assets/images/Grinch Rave.png'),
  require('@/assets/images/Jimmy Ad.png'),
  require('@/assets/images/jonah-mog.png'),
  require('@/assets/images/Matchaaa.png'),
  require('@/assets/images/Odds.png'),
  require('@/assets/images/Paper Lantern Event.jpg'),
  require('@/assets/images/Reecius.png'),
  require('@/assets/images/Sema Ad.png'),
  require('@/assets/images/UNLV football.png'),
  require('@/assets/images/git-learning-class.png'),
  require('@/assets/images/rate-my-date.jpg'),
];

const SAMPLE_POSTS: GridPost[] = [
  { id: 'p1', image: require('@/assets/images/rigrig.jpg') },
  { id: 'p2', image: require('@/assets/images/jonah-mog.png') },
  { id: 'p3', image: require('@/assets/images/git-learning-class.png') },
  { id: 'p4', image: require('@/assets/images/rate-my-date.jpg') },
];

// Per-event feed post overrides keyed by eventSeeds index
const EVENT_POSTS: Record<number, GridPost[]> = {
  6: [
    {
      id: 'stj1',
      image: require('@/assets/images/St Jimmy Event Feed Imgs/St Jimmy Concert Fake 1.jpg'),
    },
    {
      id: 'stj2',
      image: require('@/assets/images/St Jimmy Event Feed Imgs/St Jimmy Concert Fake 2.jpg'),
    },
    {
      id: 'stj3',
      image: require('@/assets/images/St Jimmy Event Feed Imgs/St Jimmy Concert Fake 3.jpg'),
    },
    {
      id: 'stj4',
      image: require('@/assets/images/St Jimmy Event Feed Imgs/St Jimmy Concert Fake 4.png'),
    },
    {
      id: 'stj5',
      image: require('@/assets/images/St Jimmy Event Feed Imgs/St Jimmy Concert Fake 5.png'),
    },
  ],
};

export default function EventDetails() {
  const theme = useAppTheme();
  const router = useRouter();
  const [rsvped, setRsvped] = useState(false);
  const [imageVisible, setImageVisible] = useState(false);
  const { h3Id } = useLocalSearchParams<{ h3Id?: string | string[] }>();
  const resolvedH3Id = Array.isArray(h3Id) ? h3Id[0] : h3Id;

  const event = useMemo(() => {
    if (!resolvedH3Id) return null;

    const eventIndex = eventSeeds.findIndex(
      (seed) => coordsToH3Cell(seed.location.longitude, seed.location.latitude) === resolvedH3Id
    );

    if (eventIndex === -1) return null;

    const seed = eventSeeds[eventIndex];
    const attendeeCount = eventSeedAttendees[eventIndex] ?? 0;

    return {
      id: resolvedH3Id,
      image: EVENT_IMAGES[eventIndex] ?? EVENT_IMAGES[EVENT_IMAGES.length - 1],
      name: seed.name,
      organization: seed.organization,
      description: seed.description,
      attendeeCount,
      posts: EVENT_POSTS[eventIndex] ?? SAMPLE_POSTS,
    };
  }, [resolvedH3Id]);

  if (!event) {
    return (
      <Screen className="items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-foreground">Event not found</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerClassName="pb-6">
        {/* Back button */}
        <TouchableOpacity
          className="mx-4 mt-14 mb-1 flex-row items-center gap-1 self-start"
          activeOpacity={0.7}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={theme.tint} />
          <Text className="text-sm font-medium text-primary">Back</Text>
        </TouchableOpacity>
        {/* Full-screen image overlay */}
        <Modal
          visible={imageVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setImageVisible(false)}
        >
          <Pressable
            className="flex-1 items-center justify-center bg-black/80"
            onPress={() => setImageVisible(false)}
          >
            <Pressable onPress={() => {}}>
              <Image
                source={event.image}
                style={{ width: 360, height: 480, borderRadius: 16 }}
                resizeMode="contain"
              />
            </Pressable>
          </Pressable>
        </Modal>

        {/* Top row: image + caption */}
        <View className="flex-row gap-3 px-4 pb-4 pt-3">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setImageVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="View full image"
          >
            <Image
              source={event.image}
              className="h-44 w-44 rounded-2xl border border-border"
              resizeMode="cover"
            />
          </TouchableOpacity>
          <View className="flex-1 justify-start gap-1 pt-1">
            <Text className="text-base font-bold text-foreground" numberOfLines={2}>
              {event.name}
            </Text>
            <Text className="text-sm font-medium text-primary" numberOfLines={1}>
              {event.organization}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {event.attendeeCount.toLocaleString()} attending
            </Text>
            <Text className="mt-1 text-xs leading-5 text-foreground">{event.description}</Text>
            <TouchableOpacity
              className={`mt-3 flex-row items-center justify-center gap-2 rounded-full border px-4 py-2 ${
                rsvped ? 'border-primary bg-primary' : 'border-border bg-background'
              }`}
              activeOpacity={0.75}
              onPress={() => setRsvped((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={rsvped ? 'Cancel RSVP' : 'RSVP to event'}
            >
              <Ionicons
                name={rsvped ? 'heart' : 'heart-outline'}
                size={16}
                color={rsvped ? theme.background : theme.tint}
              />
              <Text
                className={`text-xs font-semibold ${rsvped ? 'text-background' : 'text-primary'}`}
              >
                {rsvped ? 'RSVPed' : 'RSVP'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Full-width post grid */}
        <View className="border-t border-border">
          <PostGrid posts={event.posts} detailPathname="/feed/post-details" />
        </View>
      </ScrollView>
    </Screen>
  );
}
