import { Image } from '@/components/image';
import { DrawerModal } from '@/components/ui/drawer';
import { Screen } from '@/components/ui/screen';
import { RsvpSheet } from '@/features/events/components/rsvp-sheet';
import type { AttendanceStatus, NotificationPref } from '@/features/events/types';
import { useGuest } from '@/integrations/session/provider';
import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export default function EventPage() {
  const theme = useAppTheme();
  const { isGuestMode } = useGuest();
  const { eventId: rawEventId } = useLocalSearchParams<{ eventId?: string | string[] }>();
  const eventId = (Array.isArray(rawEventId) ? rawEventId[0] : rawEventId) as
    | Id<'events'>
    | undefined;

  const event = useQuery(api.events.queries.getEventById, eventId ? { eventId } : 'skip');
  const viewerAttendance = useQuery(
    api.events.attendance.getViewerAttendance,
    eventId ? { eventId } : 'skip'
  );
  const setViewerAttendance = useMutation(api.events.attendance.setViewerAttendance);
  const eventImageUrl = useQuery(
    api.files.getUrl,
    event?.mediaId ? { storageId: event.mediaId } : 'skip'
  );
  const [attendance, setAttendance] = useState<AttendanceStatus>(null);
  const [notification, setNotification] = useState<NotificationPref>('all');
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);

  useEffect(() => {
    if (!viewerAttendance) {
      return;
    }

    setAttendance(viewerAttendance.attendance);
    setNotification(viewerAttendance.notification);
  }, [viewerAttendance]);

  const saveAttendance = useCallback(
    async (nextAttendance: AttendanceStatus, nextNotification: NotificationPref) => {
      if (!eventId || isGuestMode) {
        return;
      }

      await setViewerAttendance({
        eventId,
        attendance: nextAttendance,
        notification: nextNotification,
      });
    },
    [eventId, isGuestMode, setViewerAttendance]
  );

  const handleAttendanceChange = useCallback(
    (nextAttendance: AttendanceStatus) => {
      const previousAttendance = attendance;
      setAttendance(nextAttendance);
      void saveAttendance(nextAttendance, notification).catch((error) => {
        console.error('Failed to update attendance', error);
        setAttendance(previousAttendance);
      });
    },
    [attendance, notification, saveAttendance]
  );

  const handleNotificationChange = useCallback(
    (nextNotification: NotificationPref) => {
      const previousNotification = notification;
      setNotification(nextNotification);
      void saveAttendance(attendance, nextNotification).catch((error) => {
        console.error('Failed to update RSVP notification preference', error);
        setNotification(previousNotification);
      });
    },
    [attendance, notification, saveAttendance]
  );

  const openRsvpSheet = useCallback(() => {
    if (isGuestMode) {
      return;
    }

    setIsRsvpOpen(true);
  }, [isGuestMode]);

  if (event === undefined || viewerAttendance === undefined) {
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

              <View className="mt-3 flex-row items-center justify-end">
                <Pressable
                  onPress={openRsvpSheet}
                  accessibilityRole="button"
                  accessibilityLabel={
                    attendance === 'going'
                      ? 'Going'
                      : attendance === 'interested'
                        ? 'Interested'
                        : attendance === 'uninterested'
                          ? 'Not interested'
                          : 'RSVP'
                  }
                  className="h-12 w-12 items-center justify-center rounded-2xl"
                  hitSlop={8}
                  disabled={isGuestMode}
                  style={{
                    borderCurve: 'continuous',
                    backgroundColor: attendance ? theme.primarySoft : theme.tint,
                    borderWidth: attendance ? 1 : 0,
                    borderColor: theme.primarySoftBorder,
                    opacity: isGuestMode ? 0.5 : 1,
                  }}
                >
                  <Ionicons
                    name={
                      attendance === 'going'
                        ? 'checkmark-circle'
                        : attendance === 'interested'
                          ? 'star'
                          : attendance === 'uninterested'
                            ? 'close-circle'
                            : 'add-circle-outline'
                    }
                    size={26}
                    color={attendance ? theme.primaryText : theme.tintForeground}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <DrawerModal
        open={isRsvpOpen}
        onClose={() => setIsRsvpOpen(false)}
        snapPoints={['60%']}
        enablePanDownToClose
        backdropAppearsOnIndex={0}
        backdropDisappearsOnIndex={-1}
      >
        <RsvpSheet
          attendance={attendance}
          notification={notification}
          onAttendanceChange={handleAttendanceChange}
          onNotificationChange={handleNotificationChange}
        />
      </DrawerModal>
    </Screen>
  );
}
