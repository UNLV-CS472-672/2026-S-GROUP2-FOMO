import { Screen } from '@/components/ui/screen';
import { MediaCard } from '@/features/posts/components/media-card';
import type { FeedPost } from '@/features/posts/types';
import { useGuest } from '@/integrations/session/guest';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { FlashList } from '@shopify/flash-list';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

export default function TopMomentsScreen() {
  const { eventId, initialPostId, sortBy } = useLocalSearchParams<{
    eventId?: string;
    initialPostId?: string;
    sortBy?: string;
  }>();
  const { isGuestMode } = useGuest();
  const router = useRouter();
  const togglePostLike = useMutation(api.likes.togglePostLike);

  const posts = useQuery(
    api.events.queries.getEventFeed,
    eventId
      ? { eventId: eventId as Id<'events'>, sortBy: sortBy === 'popular' ? 'popular' : undefined }
      : 'skip'
  );

  const renderItem = useCallback(
    ({ item: post }: { item: FeedPost }) => (
      <MediaCard
        post={post}
        readOnly={isGuestMode}
        onToggleLike={() => {
          if (isGuestMode) return;
          void togglePostLike({ postId: post.id as Id<'posts'> }).catch((error) => {
            console.error('Failed to toggle like in top moments feed', error);
          });
        }}
        onPressAuthor={
          post.authorUsername
            ? () =>
                router.push({
                  pathname: '/(tabs)/(map)/event/profile/[username]',
                  params: { username: post.authorUsername },
                })
            : undefined
        }
      />
    ),
    [isGuestMode, togglePostLike, router]
  );

  if (!posts) {
    return null;
  }

  const initialIndex = initialPostId
    ? Math.max(
        0,
        posts.findIndex((p) => p.id === initialPostId)
      )
    : 0;

  return (
    <Screen className="flex-1">
      <FlashList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(post) => post.id}
        initialScrollIndex={initialIndex}
      />
    </Screen>
  );
}
