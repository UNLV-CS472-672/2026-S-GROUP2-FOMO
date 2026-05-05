import { EventSearchImage } from '@/features/map/components/search/event-search-image';
import { getDateLabel } from '@/lib/format';
import { api } from '@fomo/backend/convex/_generated/api';
import type { FunctionReturnType } from 'convex/server';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type PastEvent = NonNullable<
  FunctionReturnType<typeof api.events.queries.getAttendedPastEvents>
>[0];

interface PastEventsListProps {
  events: PastEvent[];
}

export function PastEventsList({ events }: PastEventsListProps) {
  const router = useRouter();

  if (events.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-muted-foreground">No past events yet</Text>
      </View>
    );
  }

  return (
    <View>
      {events.map((event) => (
        <Pressable
          key={event.id}
          accessibilityRole="button"
          className="flex-row items-center gap-3 border-b border-border/60 px-4 py-3"
          onPress={() =>
            router.push({
              pathname: event.isExternal
                ? '/(tabs)/(map)/external-event/[eventId]'
                : '/(tabs)/(map)/event/[eventId]',
              params: { eventId: event.id },
            })
          }
        >
          <EventSearchImage mediaId={event.mediaId} />

          <View className="flex-1 gap-1">
            <Text className="text-[15px] font-semibold text-foreground" numberOfLines={1}>
              {event.name}
            </Text>
            {event.organization ? (
              <Text className="text-[13px] text-muted-foreground" numberOfLines={1}>
                {event.organization}
              </Text>
            ) : event.caption ? (
              <Text className="text-[13px] text-muted-foreground" numberOfLines={1}>
                {event.caption}
              </Text>
            ) : null}
          </View>

          <Text className="text-[12px] font-semibold uppercase tracking-[0.8px] text-muted-foreground">
            {getDateLabel(event.endDate)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
