import { Screen } from '@/components/ui/screen';
import {
  deviceIcon,
  formatActivityTimestamp,
  getBrowserLabel,
  getDeviceLabel,
  getLocationLabel,
} from '@/features/profile/active-devices';
import { DevicesLoadingSkeleton } from '@/features/profile/components/security/active-devices-skeleton';
import { useAppTheme } from '@/lib/use-app-theme';
import { useSession, useUser } from '@clerk/expo';
import type { SessionWithActivitiesResource as SessionWithActivities } from '@clerk/shared/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

export default function SignedInDevicesScreen() {
  const theme = useAppTheme();
  const { user } = useUser();
  const { session: currentSession } = useSession();
  const [sessions, setSessions] = useState<SessionWithActivities[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // user.reload() updates the user reference, which would cause loadSessions to
  // re-initialize and trigger useFocusEffect in an infinite loop — so we read
  // user through a ref to keep loadSessions stable with no deps.
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const loadSessions = useCallback(async () => {
    if (!userRef.current) return;
    try {
      await userRef.current.reload();
      const data = await userRef.current.getSessions();
      setSessions(data);
    } finally {
      setIsLoaded(true);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSessions();
    }, [loadSessions])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void loadSessions();
  }, [loadSessions]);

  async function handleRevoke(sessionId: string) {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) return;

    Alert.alert('Sign out device', 'Sign out this device from your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void target
            .revoke()
            .then(() => {
              setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            })
            .catch((err: unknown) => {
              Alert.alert(
                'Unable to sign out device',
                err instanceof Error ? err.message : 'Please try again.'
              );
            });
        },
      },
    ]);
  }

  const activeSessions = sessions
    .filter((s) => s.status === 'active')
    .sort((a, b) => {
      if (a.id === currentSession?.id) return -1;
      if (b.id === currentSession?.id) return 1;
      return b.lastActiveAt.getTime() - a.lastActiveAt.getTime();
    });

  return (
    <Screen>
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="p-6 gap-5"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {!isLoaded ? (
          <DevicesLoadingSkeleton />
        ) : (
          <>
            <View className="gap-2">
              <Text className="text-lg font-semibold text-foreground">Active devices</Text>
              <Text className="text-sm leading-6 text-muted-foreground">
                Review every device that is currently signed in to your account and sign out
                anything that looks unfamiliar.
              </Text>
            </View>

            {activeSessions.length === 0 ? (
              <View className="rounded-3xl border border-border bg-card px-5 py-4">
                <Text className="text-muted-foreground">No active sessions found.</Text>
              </View>
            ) : (
              <View className="overflow-hidden rounded-3xl border border-border bg-card">
                {activeSessions.map((session, index) => {
                  const isCurrent = session.id === currentSession?.id;
                  const activity = session.latestActivity;
                  const isMobile = activity?.isMobile;
                  const deviceLabel = getDeviceLabel(activity?.deviceType, isMobile);
                  const browserLabel = getBrowserLabel(
                    activity?.browserName,
                    activity?.browserVersion
                  );
                  const locationLabel = getLocationLabel(
                    activity?.ipAddress,
                    activity?.city,
                    activity?.country
                  );
                  const timestamp = formatActivityTimestamp(session.lastActiveAt);

                  return (
                    <View
                      key={session.id}
                      className={`flex-row gap-4 px-5 py-4 ${
                        index < activeSessions.length - 1 ? 'border-b border-border' : ''
                      }`}
                    >
                      <View className="items-center pt-0.5">
                        <View className="h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background">
                          <Ionicons name={deviceIcon(isMobile)} size={20} color={theme.tint} />
                        </View>
                      </View>

                      <View className="flex-1 gap-1">
                        <View className="flex-row flex-wrap items-center gap-2">
                          <Text className="text-[17px] font-semibold text-foreground">
                            {deviceLabel}
                          </Text>
                          {isCurrent ? (
                            <View className="rounded-xl border border-border bg-background px-2.5 py-1">
                              <Text className="text-[11px] font-medium text-muted-foreground">
                                This device
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {browserLabel ? (
                          <Text className="text-sm text-muted-foreground">{browserLabel}</Text>
                        ) : null}

                        {locationLabel ? (
                          <Text className="text-sm text-muted-foreground">{locationLabel}</Text>
                        ) : null}

                        <Text className="text-sm text-muted-foreground">{timestamp}</Text>
                      </View>

                      {!isCurrent ? (
                        <Pressable
                          className="mt-1 h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background"
                          onPress={() => void handleRevoke(session.id)}
                        >
                          <Ionicons name="ellipsis-horizontal" size={18} color={theme.tint} />
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
