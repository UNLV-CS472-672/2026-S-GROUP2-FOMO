import { Screen } from '@/components/ui/screen';
import { NavigateButton } from '@/features/events/components/navigate-button';
import { formatDateTimeRange } from '@/lib/format';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

export default function ExternalEventPage() {
  const { eventId: rawEventId } = useLocalSearchParams<{ eventId?: string | string[] }>();
  const eventId = (Array.isArray(rawEventId) ? rawEventId[0] : rawEventId) as
    | Id<'externalEvents'>
    | undefined;

  const event = useQuery(api.events.queries.getExternalEventsById, eventId ? { eventId } : 'skip');

  if (!eventId || event === undefined) {
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
        <View className="flex-row gap-3.5 p-4">
          <View
            className="w-35 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface-muted"
            style={{ height: 180 }}
          >
            <Text className="text-5xl font-black uppercase text-foreground">
              {event.name[0] ?? '?'}
            </Text>
          </View>

          <View className="flex-1 justify-between">
            <View className="gap-1.5">
              <Text className="text-lg font-bold text-foreground" numberOfLines={2}>
                {event.name}
              </Text>
              {event.organization ? (
                <Text className="text-sm font-medium text-muted-foreground">
                  {event.organization}
                </Text>
              ) : null}
              <Text className="text-sm text-muted-foreground">
                {formatDateTimeRange(event.startDate, event.endDate)}
              </Text>
              {event.caption ? (
                <Text className="mt-1 text-sm leading-4 text-foreground" numberOfLines={4}>
                  {event.caption}
                </Text>
              ) : null}

              <View className="mt-3 flex-row items-center gap-2">
                <NavigateButton
                  latitude={event.location.latitude}
                  longitude={event.location.longitude}
                  label={event.name}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
