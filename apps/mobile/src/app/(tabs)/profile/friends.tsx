import { friends, type Friend } from '@/app/(tabs)/profile/friends-data';
import FriendCell from '@/components/profile/friend-cell';
import { Screen } from '@/components/ui/screen';
import { useAppTheme } from '@/lib/use-app-theme';
import { api } from '@fomo/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

type FriendRec = { userId: string; score: number };

/** Friends UI from this screen; embed in profile or use via {@link FriendsScreen}. */
export function FriendsScreenContent() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string | string[] }>();
  const theme = useAppTheme();
  const [searchText, setSearchText] = useState('');
  const [isRecommendedCollapsed, setIsRecommendedCollapsed] = useState(false);
  const source = Array.isArray(params.source) ? params.source[0] : params.source;
  const showRecommendedFriends = source !== 'visit-friend-profile';

  const friendRecResult = useQuery(api.data_ml.friends.getFriendRecs);

  const recommendedFriends = useMemo<Friend[]>(
    () =>
      (friendRecResult?.recs ?? []).map((rec) => ({
        id: rec.userId,
        username: rec.userId,
        realName: `Score: ${rec.score.toFixed(2)}`,
        imageSource: require('@/assets/images/icon.png'),
        posts: {
          all: [],
          recent: [],
          tagged: [],
        },
      })),
    [friendRecResult]
  );

  const filteredRecommended = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return recommendedFriends.filter(
      (f) => f.username.toLowerCase().includes(q) || f.realName?.toLowerCase().includes(q)
    );
  }, [recommendedFriends, searchText]);

  const filteredFriends = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return friends.filter(
      (f) => f.username.toLowerCase().includes(q) || f.realName?.toLowerCase().includes(q)
    );
  }, [friends, searchText]);

  const handleFriendPress = (friendId: string) => {
    router.push(`/profile/visit-friend-profile?id=${friendId}`);
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
                    realName={f.realName}
                    imageSource={f.imageSource}
                    onPress={() => handleFriendPress(f.id)}
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
                realName={f.realName}
                imageSource={f.imageSource}
                onPress={() => handleFriendPress(f.id)}
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
