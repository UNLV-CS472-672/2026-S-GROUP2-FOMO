import { Screen } from '@/components/ui/screen';
import { FriendCell } from '@/features/profile/components/friend-cell';
import { useUser } from '@clerk/expo';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

export default function FriendRequestsScreen() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const requests = useQuery(api.friends.getFriendRequests, isSignedIn ? {} : 'skip');
  const acceptFriendRequest = useMutation(api.friends.acceptFriendRequest);
  const declineFriendRequest = useMutation(api.friends.declineFriendRequest);
  const cancelFriendRequest = useMutation(api.friends.cancelFriendRequest);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  async function handleRespond(requesterId: Id<'users'>, action: 'accept' | 'decline') {
    if (pendingUserId === requesterId) {
      return;
    }

    setPendingUserId(requesterId);
    try {
      if (action === 'accept') {
        await acceptFriendRequest({ requesterId });
      } else {
        await declineFriendRequest({ requesterId });
      }
    } catch (error) {
      console.error(`Failed to ${action} friend request`, error);
      Alert.alert(
        'Unable to update request',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleCancel(recipientId: Id<'users'>) {
    if (pendingUserId === recipientId) {
      return;
    }

    setPendingUserId(recipientId);
    try {
      await cancelFriendRequest({ recipientId });
    } catch (error) {
      console.error('Failed to cancel friend request', error);
      Alert.alert(
        'Unable to remove request',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <Screen className="flex-1">
      <ScrollView className="flex-1 bg-background pt-5" contentContainerClassName="px-4 pb-8">
        <Text className="mb-4 text-2xl font-bold text-foreground">Friend Requests</Text>
        {requests === undefined ? (
          <Text className="text-muted-foreground">Loading requests...</Text>
        ) : requests.received.length === 0 && requests.sent.length === 0 ? (
          <Text className="text-muted-foreground">No pending friend requests.</Text>
        ) : (
          <View className="gap-4">
            <RequestSection title="Received">
              {requests.received.length === 0 ? (
                <Text className="text-sm text-muted-foreground">No received requests.</Text>
              ) : (
                requests.received.map((request) => {
                  const isPending = pendingUserId === String(request.id);

                  return (
                    <ReceivedRequestRow
                      key={`received-${request.id}`}
                      username={request.username}
                      displayName={request.displayName}
                      avatarUrl={request.avatarUrl}
                      isPending={isPending}
                      onPress={() =>
                        router.push({
                          pathname: '/profile/[username]',
                          params: { id: String(request.id), username: request.username },
                        })
                      }
                      onAccept={() => {
                        void handleRespond(request.id, 'accept');
                      }}
                      onDecline={() => {
                        void handleRespond(request.id, 'decline');
                      }}
                    />
                  );
                })
              )}
            </RequestSection>

            <RequestSection title="Sent">
              {requests.sent.length === 0 ? (
                <Text className="text-sm text-muted-foreground">No sent requests.</Text>
              ) : (
                requests.sent.map((request) => {
                  const isPending = pendingUserId === String(request.id);

                  return (
                    <SentRequestRow
                      key={`sent-${request.id}`}
                      username={request.username}
                      displayName={request.displayName}
                      avatarUrl={request.avatarUrl}
                      isPending={isPending}
                      onPress={() =>
                        router.push({
                          pathname: '/profile/[username]',
                          params: { id: String(request.id), username: request.username },
                        })
                      }
                      onRemove={() => {
                        void handleCancel(request.id);
                      }}
                    />
                  );
                })
              )}
            </RequestSection>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function RequestSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-lg font-semibold text-foreground">{title}</Text>
      <View className="border-y border-border px-4">{children}</View>
    </View>
  );
}

function SentRequestRow({
  username,
  displayName,
  avatarUrl,
  isPending,
  onPress,
  onRemove,
}: {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isPending: boolean;
  onPress: () => void;
  onRemove: () => void;
}) {
  return (
    <FriendCell
      username={username}
      displayName={displayName}
      avatarUrl={avatarUrl}
      onPress={onPress}
      className="py-3"
      rightAccessory={
        <ProfileRequestIconButton
          accessibilityLabel="Remove sent friend request"
          iconName="close"
          tone="decline"
          onPress={onRemove}
          disabled={isPending}
        />
      }
    />
  );
}

function ReceivedRequestRow({
  username,
  displayName,
  avatarUrl,
  isPending,
  onPress,
  onAccept,
  onDecline,
}: {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isPending: boolean;
  onPress: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <FriendCell
      username={username}
      displayName={displayName}
      avatarUrl={avatarUrl}
      onPress={onPress}
      className="py-3"
      rightAccessory={
        <View className="flex-row items-center gap-2">
          <ProfileRequestIconButton
            accessibilityLabel="Accept friend request"
            iconName="check"
            tone="accept"
            onPress={onAccept}
            disabled={isPending}
          />
          <ProfileRequestIconButton
            accessibilityLabel="Decline friend request"
            iconName="close"
            tone="decline"
            onPress={onDecline}
            disabled={isPending}
          />
        </View>
      }
    />
  );
}

function ProfileRequestIconButton({
  accessibilityLabel,
  disabled,
  iconName,
  tone,
  onPress,
}: {
  accessibilityLabel: string;
  disabled: boolean;
  iconName: 'check' | 'close';
  tone: 'accept' | 'decline';
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={`size-10 items-center justify-center rounded-full ${
        tone === 'accept' ? 'bg-green-500/15' : 'bg-destructive/10'
      }`}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] },
        disabled && { opacity: 0.5 },
      ]}
      onPress={onPress}
    >
      <MaterialIcons name={iconName} size={20} color={tone === 'accept' ? '#16a34a' : '#dc2626'} />
    </Pressable>
  );
}
