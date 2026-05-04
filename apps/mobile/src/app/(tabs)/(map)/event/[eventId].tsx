import { Image } from '@/components/image';
import { DrawerModal } from '@/components/ui/drawer';
import { Screen } from '@/components/ui/screen';
import { Feed } from '@/features/events/components/feed';
import { NavigateButton } from '@/features/events/components/navigate-button';
import { RsvpButton } from '@/features/events/components/rsvp-button';
import { RsvpSheet } from '@/features/events/components/rsvp-sheet';
import { TopMoments } from '@/features/events/components/top-moments/preview';
import type { AttendanceStatus, NotificationPref } from '@/features/events/types';
import { EventActionMenu } from '@/features/moderation/event-action-menu';
import { Avatar } from '@/features/posts/components/avatar';
import { MediaCarousel } from '@/features/posts/components/media-carousel';
import { useGuest } from '@/integrations/session/guest';
import { formatDateTimeRange } from '@/lib/format';
import { useAppTheme } from '@/lib/use-app-theme';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

const AVATAR_W = 40; // size-36 + 2px border each side
const AVATAR_STEP = 32; // minus 8px overlap
const BUBBLE_W = 44; // min-w-10 + 2px border each side
const BUBBLE_STEP = 36; // minus 8px overlap
const ROW_GAP = 10; // gap-2.5

export default function EventPage() {
  const { isGuestMode } = useGuest();
  const router = useRouter();
  const theme = useAppTheme();
  const { eventId: rawEventId } = useLocalSearchParams<{ eventId?: string | string[] }>();
  const eventId = (Array.isArray(rawEventId) ? rawEventId[0] : rawEventId) as
    | Id<'events'>
    | undefined;

  const event = useQuery(api.events.queries.getEventById, eventId ? { eventId } : 'skip');
  const attendees = useQuery(
    api.events.attendance.getEventAttendees,
    eventId ? { eventId } : 'skip'
  );
  const topMediaPosts = useQuery(
    api.events.queries.getTopMediaPosts,
    eventId ? { eventId } : 'skip'
  );
  const viewerAttendance = useQuery(
    api.events.attendance.getViewerAttendance,
    eventId ? { eventId } : 'skip'
  );
  const setViewerAttendance = useMutation(api.events.attendance.setViewerAttendance);
  const [attendance, setAttendance] = useState<AttendanceStatus>(null);
  const [notification, setNotification] = useState<NotificationPref>('all');
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);
  const [headerCarouselOpen, setHeaderCarouselOpen] = useState(false);
  const [attendeeRowWidth, setAttendeeRowWidth] = useState(0);
  const [buttonsWidth, setButtonsWidth] = useState(0);
  const [rightSideHeight, setRightSideHeight] = useState<number | undefined>(undefined);

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

  if (
    !eventId ||
    event === undefined ||
    attendees === undefined ||
    topMediaPosts === undefined ||
    viewerAttendance === undefined
  ) {
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

  const attendeeSample = attendees.slice(0, 3);

  const visibleAvatarCount = (() => {
    if (attendeeRowWidth === 0 || buttonsWidth === 0) return attendeeSample.length;
    const available = attendeeRowWidth - buttonsWidth - ROW_GAP;
    for (let n = attendeeSample.length; n >= 0; n--) {
      const hasMore = event.attendeeCount > n;
      const needed =
        n === 0
          ? hasMore
            ? BUBBLE_W
            : 0
          : AVATAR_W + (n - 1) * AVATAR_STEP + (hasMore ? BUBBLE_STEP : 0);
      if (needed <= available) return n;
    }
    return 0;
  })();
  return (
    <Screen>
      <Stack.Screen options={{ title: event.name }} />

      <ScrollView contentContainerClassName="pb-10" showsVerticalScrollIndicator={false}>
        {/* Event Header */}
        <View className="flex-row gap-3.5 p-4">
          <Pressable
            className="w-35 overflow-hidden rounded-2xl border border-border bg-surface-muted"
            style={rightSideHeight !== undefined ? { height: rightSideHeight } : { height: 180 }}
            onPress={() => event.mediaUrl != null && setHeaderCarouselOpen(true)}
            disabled={event.mediaUrl == null}
          >
            {event.mediaUrl != null ? (
              <>
                {headerCarouselOpen && (
                  <MediaCarousel
                    mediaIds={[event.mediaId!]}
                    initialIndex={0}
                    onClose={() => setHeaderCarouselOpen(false)}
                  />
                )}
                <Image source={event.mediaUrl} className="h-full w-full" contentFit="cover" />
              </>
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
          </Pressable>
          <View
            className="flex-1 justify-between"
            onLayout={(e) => setRightSideHeight(e.nativeEvent.layout.height)}
          >
            <View className="gap-1.5">
              <View className="flex-row items-start gap-2">
                <Text className="flex-1 text-lg font-bold text-foreground" numberOfLines={2}>
                  {event.name}
                </Text>
                <EventActionMenu eventId={eventId} mutedColor={theme.mutedText} />
              </View>
              <Text className="text-sm text-muted-foreground">
                {formatDateTimeRange(event.startDate, event.endDate)}
              </Text>
              <Text className="mt-1 text-sm leading-4 text-foreground" numberOfLines={4}>
                {event.caption}
              </Text>

              <View
                className="mt-3 flex-row items-center justify-between gap-2.5"
                onLayout={(e) => setAttendeeRowWidth(e.nativeEvent.layout.width)}
              >
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/(map)/event/attendees',
                      params: { eventId: event.id, eventName: event.name },
                    })
                  }
                  className="flex-row items-center"
                  style={{ flexShrink: 1, minWidth: 0 }}
                  hitSlop={6}
                >
                  {attendeeSample.slice(0, visibleAvatarCount).map((attendee, index) => (
                    <View
                      key={attendee.id}
                      className="rounded-full border-2 border-surface"
                      style={{ marginLeft: index === 0 ? 0 : -8 }}
                    >
                      <Avatar
                        name={attendee.name}
                        size={36}
                        source={attendee.avatarUrl ? { uri: attendee.avatarUrl } : undefined}
                      />
                    </View>
                  ))}
                  {event.attendeeCount > visibleAvatarCount ? (
                    <View
                      className="h-10 min-w-10 items-center justify-center rounded-full border-2 border-surface bg-muted px-2"
                      style={{ marginLeft: visibleAvatarCount > 0 ? -8 : 0 }}
                    >
                      <Text className="text-[10px] font-semibold text-muted-foreground">
                        +{event.attendeeCount - visibleAvatarCount}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>

                <View
                  className="flex-row items-center gap-2"
                  style={{ flexShrink: 0 }}
                  onLayout={(e) => setButtonsWidth(e.nativeEvent.layout.width)}
                >
                  <NavigateButton
                    latitude={event.location.latitude}
                    longitude={event.location.longitude}
                    label={event.name}
                  />

                  <RsvpButton
                    attendance={attendance}
                    disabled={isGuestMode}
                    onPress={openRsvpSheet}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        <TopMoments posts={topMediaPosts} eventId={eventId} />
        <Feed eventId={eventId} />
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
