import { Screen } from '@/components/ui/screen';
import { MediaCard } from '@/features/posts/components/media-card';
import type { FeedPost } from '@/features/posts/types';
import { useGuest } from '@/integrations/session/guest';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { FlashList } from '@shopify/flash-list';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef } from 'react';

export default function TopMomentsScreen() {
  const { eventId, initialPostId } = useLocalSearchParams<{
    eventId?: string;
    initialPostId?: string;
  }>();
  const { isGuestMode } = useGuest();
  const router = useRouter();
  const togglePostLike = useMutation(api.likes.togglePostLike);

  const posts = useQuery(
    api.events.queries.getEventFeed,
    eventId ? { eventId: eventId as Id<'events'>, sortBy: 'popular', mediaOnly: true } : 'skip'
  );

  const initialOrderRef = useRef<string[] | null>(null);
  const frozenPosts = useMemo(() => {
    if (!posts) return null;
    if (!initialOrderRef.current) {
      initialOrderRef.current = posts.map((p) => p.id);
    }
    const orderMap = new Map(initialOrderRef.current.map((id, i) => [id, i]));
    return [...posts].sort(
      (a, b) => (orderMap.get(a.id) ?? Infinity) - (orderMap.get(b.id) ?? Infinity)
    );
  }, [posts]);

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

  if (!frozenPosts) {
    return null;
  }

  const initialIndex = initialPostId
    ? Math.max(
        0,
        frozenPosts.findIndex((p) => p.id === initialPostId)
      )
    : 0;

  return (
    <Screen className="flex-1">
      <FlashList
        data={frozenPosts}
        renderItem={renderItem}
        keyExtractor={(post) => post.id}
        initialScrollIndex={initialIndex}
      />
    </Screen>
  );
}
