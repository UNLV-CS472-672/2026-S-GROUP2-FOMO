import { FeedCard } from '@/features/posts/components/feed-card';
import { useGuest } from '@/integrations/session/guest';
import { useUser } from '@/integrations/session/user';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

type FeedProps = {
  eventId: Id<'events'>;
};

export function Feed({ eventId }: FeedProps) {
  const { isGuestMode } = useGuest();
  const router = useRouter();
  const currentUser = useUser();
  const posts = useQuery(api.events.queries.getEventFeed, { eventId });
  const togglePostLike = useMutation(api.likes.togglePostLike);

  if (posts === undefined) {
    return (
      <View className="gap-3 px-4 pt-4">
        <Text className="text-[17px] font-bold text-foreground">Feed</Text>
        <Text className="text-sm text-muted-foreground">Loading feed...</Text>
      </View>
    );
  }

  return (
    <View className="gap-3 px-4 pt-4">
      <Text className="text-[17px] font-bold text-foreground">Feed</Text>
      {posts.length > 0 ? (
        posts.map((post) => (
          <FeedCard
            key={post.id}
            post={post}
            readOnly={isGuestMode}
            onPressAuthor={
              currentUser?.username === post.authorUsername
                ? () => router.push('/(tabs)/profile')
                : undefined
            }
            onToggleLike={() => {
              if (isGuestMode) {
                return;
              }

              void togglePostLike({ postId: post.id }).catch((error) => {
                console.error('Failed to toggle event post like', error);
              });
            }}
          />
        ))
      ) : (
        <Text className="text-sm text-muted-foreground">No posts for this event yet.</Text>
      )}
    </View>
  );
}
