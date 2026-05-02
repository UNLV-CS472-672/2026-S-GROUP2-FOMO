import { Avatar } from '@/features/posts/components/avatar';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

export default function BlockedUsersScreen() {
  const blockedUsers = useQuery(api.moderation.block.getBlockedUsers, {});
  const unblockUser = useMutation(api.moderation.block.unblockUser);

  async function handleUnblock(userId: Id<'users'>, username: string) {
    Alert.alert('Unblock user', `Unblock ${username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: () => {
          void unblockUser({ userId }).catch((error) => {
            Alert.alert(
              'Unable to unblock user',
              error instanceof Error ? error.message : 'Please try again.'
            );
          });
        },
      },
    ]);
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="grow p-6 gap-4"
    >
      <Text className="text-sm leading-6 text-muted-foreground">
        Blocked users are removed from your feed and comment threads. You can unblock them here at
        any time.
      </Text>

      {blockedUsers === undefined ? (
        <Text className="text-muted-foreground">Loading blocked users...</Text>
      ) : blockedUsers.length === 0 ? (
        <Text className="text-muted-foreground">You have not blocked anyone.</Text>
      ) : (
        blockedUsers.map((blockedUser) => (
          <View
            key={blockedUser.id}
            className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5"
          >
            <View className="flex-row items-center gap-3">
              <Avatar
                name={blockedUser.displayName || blockedUser.username}
                size={40}
                source={blockedUser.avatarUrl ? { uri: blockedUser.avatarUrl } : undefined}
              />
              <View>
                <Text className="text-base font-medium text-foreground">
                  {blockedUser.username}
                </Text>
                {blockedUser.displayName ? (
                  <Text className="text-sm text-muted-foreground">{blockedUser.displayName}</Text>
                ) : null}
              </View>
            </View>

            <Pressable
              className="rounded-full border border-border px-4 py-2"
              onPress={() => void handleUnblock(blockedUser.id, blockedUser.username)}
            >
              <Text className="font-medium text-foreground">Unblock</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}
