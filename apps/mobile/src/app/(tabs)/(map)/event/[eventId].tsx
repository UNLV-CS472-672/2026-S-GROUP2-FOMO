import { Screen } from '@/components/ui/screen';
import { api } from '@fomo/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function EventPage() {
  const { eventId: rawEventId } = useLocalSearchParams<{ eventId?: string | string[] }>();
  const eventId = Array.isArray(rawEventId) ? rawEventId[0] : rawEventId;

  const eventDetail = useQuery(
    api.data_ml.events.getEventById,
    eventId ? { eventId: eventId } : 'skip'
  );

  const event = useMemo(() => {
    if (!eventDetail) return null;
    return {
      id: eventDetail.id,
      name: eventDetail.name,
      organization: eventDetail.organization,
      description: eventDetail.description,
      attendeeCount: eventDetail.attendeeCount,
    };
  }, [eventDetail]);

  if (eventDetail === undefined) {
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
          <View
            className="h-[180px] w-[140px] items-center justify-center rounded-2xl border border-border bg-surface-muted px-4"
            style={{ borderCurve: 'continuous' }}
          >
            <Text className="text-5xl font-black uppercase text-foreground">
              {event.name[0] ?? '?'}
            </Text>
            <Text className="mt-3 text-center text-xs font-medium text-muted-foreground">
              {event.organization}
            </Text>
          </View>
          <View className="flex-1 justify-between">
            <View className="gap-1.5">
              <Text className="text-lg font-bold text-foreground">{event.name}</Text>
              <Text className="text-sm text-muted-foreground">{event.organization}</Text>
              <Text className="mt-1 text-sm leading-4 text-foreground" numberOfLines={4}>
                {event.description}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
