import { Screen } from '@/components/ui/screen';
import { FriendCell } from '@/features/profile/components/friend-cell';
import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

/** Friends UI from this screen; embed in profile or use via {@link FriendsScreen}. */
export function FriendsScreenContent() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string | string[] }>();
  const theme = useAppTheme();
  const { isAuthenticated } = useConvexAuth();
  const [searchText, setSearchText] = useState('');
  const [isRecommendedCollapsed, setIsRecommendedCollapsed] = useState(false);
  const source = Array.isArray(params.source) ? params.source[0] : params.source;
  const showRecommendedFriends = source !== 'profile-visit';

  const friendRecResult = useQuery(
    api.data_ml.friends.getFriendRecs,
    isAuthenticated ? {} : 'skip'
  );
  const friendsResult = useQuery(api.data_ml.friends.getFriends, isAuthenticated ? {} : 'skip');
  const removeFriend = useMutation(api.friends.removeFriend);

  function handleRemoveFriend(friendId: Id<'users'>, username: string) {
    Alert.alert('Remove friend', `Remove ${username} as a friend?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => void removeFriend({ friendId }),
      },
    ]);
  }

  const recommendedFriends = friendRecResult?.recs ?? [];

  const filteredRecommended = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return recommendedFriends.filter(
      (friend) =>
        friend.username.toLowerCase().includes(q) || friend.displayName?.toLowerCase().includes(q)
    );
  }, [recommendedFriends, searchText]);

  const filteredFriends = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return (friendsResult ?? []).filter(
      (friend) =>
        friend.username.toLowerCase().includes(q) || friend.displayName?.toLowerCase().includes(q)
    );
  }, [friendsResult, searchText]);

  const handleFriendPress = (friendId: string, username: string) => {
    router.push({ pathname: '/profile/[username]', params: { id: friendId, username } });
  };

  return (
    <>
      {/* Search */}
      <View className="px-4 pb-4">
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search friends"
          placeholderTextColor={theme.mutedText}
          className="rounded-lg border border-border bg-background px-4 py-2 text-base text-foreground"
          accessibilityLabel="Search friends"
        />
      </View>

      {/* Recommended Friends */}
      {showRecommendedFriends ? (
        <View className="mb-4 border-y border-border">
          <TouchableOpacity
            onPress={() => setIsRecommendedCollapsed((current) => !current)}
            className="flex-row items-center justify-between px-4 py-3"
            accessibilityRole="button"
            accessibilityLabel="Toggle recommended friends"
          >
            <Text className="text-lg font-bold text-foreground">Recommended Friends</Text>
            <Text className="text-sm text-muted-foreground">
              {isRecommendedCollapsed ? 'Show' : 'Hide'}
            </Text>
          </TouchableOpacity>

          {!isRecommendedCollapsed && (
            <View className="px-4 pb-1">
              {filteredRecommended.length > 0 ? (
                filteredRecommended.map((f) => (
                  <FriendCell
                    key={f.id}
                    username={f.username}
                    displayName={f.displayName}
                    avatarUrl={f.avatarUrl}
                    onPress={() => handleFriendPress(String(f.id), f.username)}
                  />
                ))
              ) : (
                <Text className="py-2 text-sm text-muted-foreground">
                  No recommendations found.
                </Text>
              )}
            </View>
          )}
        </View>
      ) : null}

      {/* Friends List */}
      <View className="border-y border-border">
        <View className="px-4 py-3">
          <Text className="text-lg font-bold text-foreground">Friends</Text>
        </View>
        <View className="px-4 pb-1">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((f) => (
              <FriendCell
                key={f.id}
                username={f.username}
                displayName={f.displayName}
                avatarUrl={f.avatarUrl}
                onPress={() => handleFriendPress(String(f.id), f.username)}
                rightAccessory={
                  <Pressable
                    onPress={() => handleRemoveFriend(f.id, f.username)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${f.username}`}
                  >
                    <Ionicons name="person-remove-outline" size={20} color={'#dc2626'} />
                  </Pressable>
                }
              />
            ))
          ) : (
            <Text className="py-2 text-sm text-muted-foreground">No friends found.</Text>
          )}
        </View>
      </View>
    </>
  );
}

export default function FriendsScreen() {
  return (
    <Screen className="flex-1">
      <ScrollView className="flex-1 bg-background pt-5" contentContainerClassName="pb-6">
        <FriendsScreenContent />
      </ScrollView>
    </Screen>
  );
}
