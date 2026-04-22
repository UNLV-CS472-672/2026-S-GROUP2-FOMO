import { FeedCard } from '@/features/events/components/feed-card';
import { useGuest } from '@/integrations/session/provider';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Text, View } from 'react-native';

type FeedProps = {
  eventId: Id<'events'>;
};

export function Feed({ eventId }: FeedProps) {
  const { isGuestMode } = useGuest();
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
