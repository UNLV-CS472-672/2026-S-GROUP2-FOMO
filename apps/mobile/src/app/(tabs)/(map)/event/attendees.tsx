import { Screen } from '@/components/ui/screen';
import { Avatar } from '@/features/events/components/avatar';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

function avatarColorForSeed(seed: string, index = 0) {
  const colors = ['#64748b', '#94a3b8', '#FF7F50', '#4A90D9', '#50C878'];
  let value = index;
  for (let i = 0; i < seed.length; i++) {
    value += seed.charCodeAt(i) * (i + 1);
  }
  return colors[Math.abs(value) % colors.length] ?? colors[0]!;
}

export default function EventAttendeesPage() {
  const { eventId: rawEventId, eventName } = useLocalSearchParams<{
    eventId?: string | string[];
    eventName?: string | string[];
  }>();
  const eventId = (Array.isArray(rawEventId) ? rawEventId[0] : rawEventId) as
    | Id<'events'>
    | undefined;
  const resolvedEventName = Array.isArray(eventName) ? eventName[0] : eventName;
  const attendees = useQuery(api.events.queries.getEventAttendees, eventId ? { eventId } : 'skip');

  if (attendees === undefined) {
    return (
      <Screen className="items-center justify-center">
        <Stack.Screen options={{ title: resolvedEventName ?? 'Attendees' }} />
        <Text className="text-foreground">Loading attendees...</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: `${resolvedEventName ?? 'Event'} Attendees` }} />
      <ScrollView contentContainerClassName="gap-3 px-4 pb-8 pt-4">
        {attendees.map((attendee, index) => (
          <View
            key={attendee.id}
            className="flex-row items-center gap-3 rounded-3xl border border-border bg-surface px-4 py-3"
          >
            <Avatar
              name={attendee.name}
              size={44}
              color={avatarColorForSeed(attendee.name, index)}
            />
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">{attendee.name}</Text>
              <Text className="text-sm text-muted-foreground">@{attendee.username}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
