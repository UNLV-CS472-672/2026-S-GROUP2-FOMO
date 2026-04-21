import { Image } from '@/components/image';
import { Screen } from '@/components/ui/screen';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

export default function EventPage() {
  const { eventId: rawEventId } = useLocalSearchParams<{ eventId?: string | string[] }>();
  const eventId = (Array.isArray(rawEventId) ? rawEventId[0] : rawEventId) as
    | Id<'events'>
    | undefined;

  const event = useQuery(api.events.queries.getEventById, eventId ? { eventId } : 'skip');
  const eventImageUrl = useQuery(
    api.files.getUrl,
    event?.mediaId ? { storageId: event.mediaId } : 'skip'
  );

  if (event === undefined) {
    return (
      <Screen className="items-center justify-center">
        <Stack.Screen options={{ title: 'Event Details' }} />
        <Text className="text-foreground">Loading…</Text>
      </Screen>
    );
  }

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
      <Stack.Screen options={{ title: event.name }} />

      <ScrollView contentContainerClassName="pb-10" showsVerticalScrollIndicator={false}>
        {/* Event Header */}
        <View className="flex-row gap-3.5 p-4">
          <View className="h-[180px] w-[140px] overflow-hidden rounded-2xl border border-border bg-surface-muted">
            {eventImageUrl ? (
              <Image source={eventImageUrl} className="h-full w-full" contentFit="cover" />
            ) : (
              <View
                className="h-full items-center justify-center px-4"
                style={{ borderCurve: 'continuous' }}
              >
                <Text className="text-5xl font-black uppercase text-foreground">
                  {event.name[0] ?? '?'}
                </Text>
              </View>
            )}
          </View>
          <View className="flex-1 justify-between">
            <View className="gap-1.5">
              <Text className="text-lg font-bold text-foreground">{event.name}</Text>
              <Text className="text-sm text-muted-foreground">
                {new Date(event.startDate).toLocaleString()}
              </Text>
              <Text className="mt-1 text-sm leading-4 text-foreground" numberOfLines={4}>
                {event.caption}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
