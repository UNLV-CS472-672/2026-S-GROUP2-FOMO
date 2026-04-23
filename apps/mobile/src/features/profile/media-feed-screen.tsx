import { Screen } from '@/components/ui/screen';
import { MediaCard } from '@/features/posts/components/media-card';
import { useGuest } from '@/integrations/session/guest';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';

export function MediaFeedScreen() {
  const { userId, initialPostId } = useLocalSearchParams<{
    userId?: string;
    initialPostId?: string;
  }>();
  const { isGuestMode } = useGuest();
  const togglePostLike = useMutation(api.likes.togglePostLike);
  const scrollViewRef = useRef<ScrollView>(null);
  const itemOffsetsRef = useRef<Record<string, number>>({});

  const posts = useQuery(
    api.users.getProfileFeed,
    userId ? { userId: userId as Id<'users'> } : 'skip'
  );

  useEffect(() => {
    if (!posts || !initialPostId) return;
    const timer = setTimeout(() => {
      const y = itemOffsetsRef.current[initialPostId];
      if (typeof y === 'number') {
        scrollViewRef.current?.scrollTo({ y, animated: false });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [posts, initialPostId]);

  if (!posts) {
    return (
      <Screen className="flex-1 items-center justify-center">
        <Text className="text-muted-foreground">Loading...</Text>
      </Screen>
    );
  }

  return (
    <Screen className="flex-1">
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 0 }}
      >
        {posts.map((post) => (
          <View
            key={post.id}
            onLayout={(e) => {
              itemOffsetsRef.current[post.id] = e.nativeEvent.layout.y;
            }}
          >
            <MediaCard
              post={post}
              readOnly={isGuestMode}
              onToggleLike={() => {
                if (isGuestMode) return;
                void togglePostLike({ postId: post.id as Id<'posts'> }).catch((error) => {
                  console.error('Failed to toggle like in media feed', error);
                });
              }}
            />
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
