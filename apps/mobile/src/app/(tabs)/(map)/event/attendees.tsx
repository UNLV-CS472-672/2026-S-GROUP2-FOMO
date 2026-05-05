import { Screen } from '@/components/ui/screen';
import { FriendCell } from '@/features/profile/components/friend-cell';
import { useUser } from '@/integrations/session/user';
import { useAppTheme } from '@/lib/use-app-theme';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

export default function EventAttendeesPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const currentUser = useUser();
  const { eventId: rawEventId, eventName } = useLocalSearchParams<{
    eventId?: string | string[];
    eventName?: string | string[];
  }>();
  const eventId = (Array.isArray(rawEventId) ? rawEventId[0] : rawEventId) as
    | Id<'events'>
    | Id<'externalEvents'>
    | undefined;
  const resolvedEventName = Array.isArray(eventName) ? eventName[0] : eventName;
  const [searchText, setSearchText] = useState('');
  const attendees = useQuery(
    api.events.attendance.getEventAttendees,
    eventId ? { eventId } : 'skip'
  );

  const filteredAttendees = useMemo(() => {
    if (!attendees) {
      return [];
    }

    const query = searchText.trim().toLowerCase();
    if (!query) {
      return attendees;
    }

    return attendees.filter(
      (attendee) =>
        attendee.username.toLowerCase().includes(query) ||
        attendee.name.toLowerCase().includes(query)
    );
  }, [attendees, searchText]);

  if (attendees === undefined) {
    return (
      <Screen className="items-center justify-center">
        <Stack.Screen options={{ title: resolvedEventName ?? 'Attendees' }} />
        <Text className="text-foreground">Loading attendees...</Text>
      </Screen>
    );
  }

  return (
    <Screen className="flex-1">
      <Stack.Screen options={{ title: 'Attending' }} />
      <ScrollView className="flex-1 bg-background pt-5" contentContainerClassName="pb-6">
        {resolvedEventName ? (
          <View className="px-4 pb-2">
            <Text className="text-sm text-muted-foreground">{resolvedEventName}</Text>
          </View>
        ) : null}

        <View className="px-4 pb-4">
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search attendees"
            placeholderTextColor={theme.mutedText}
            className="rounded-lg border border-border bg-background px-4 py-2 text-base text-foreground"
            accessibilityLabel="Search attendees"
          />
        </View>

        <View className="border-y border-border">
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-lg font-bold text-foreground">{attendees.length} Attending</Text>
          </View>
          <View className="px-4 pb-1">
            {filteredAttendees.length > 0 ? (
              filteredAttendees.map((attendee) => (
                <FriendCell
                  key={attendee.id}
                  username={attendee.username}
                  avatarUrl={attendee.avatarUrl ?? undefined}
                  onPress={() =>
                    currentUser?.username === attendee.username
                      ? router.push('/(tabs)/profile')
                      : router.push({
                          pathname: '/(tabs)/(map)/event/profile/[username]',
                          params: { username: attendee.username },
                        })
                  }
                />
              ))
            ) : (
              <Text className="py-2 text-sm text-muted-foreground">
                {attendees.length === 0 ? 'No attendees yet.' : 'No attendees found.'}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
