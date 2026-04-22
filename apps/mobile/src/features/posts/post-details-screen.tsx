import { Screen } from '@/components/ui/screen';
import {
  PostDetailsNotFound,
  PostDetailsView,
  type PostDetailsViewModel,
} from '@/features/posts/post-details-view';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo } from 'react';

export default function PostDetailsScreen() {
  const navigation = useNavigation();
  const { postId } = useLocalSearchParams<{ postId?: string | string[] }>();
  const normalizedPostId = (Array.isArray(postId) ? postId[0] : postId) as Id<'posts'> | undefined;

  const post = useQuery(
    api.posts.getPostById,
    normalizedPostId ? { postId: normalizedPostId } : 'skip'
  );
  const primaryMediaId = post?.mediaIds[0];
  const mediaUrl = useQuery(
    api.files.getUrl,
    primaryMediaId ? { storageId: primaryMediaId } : 'skip'
  );

  const model = useMemo((): PostDetailsViewModel | undefined => {
    if (!post) {
      return undefined;
    }

    return {
      id: String(post.id),
      image: mediaUrl ? { uri: mediaUrl } : undefined,
      authorName: post.authorName,
      authorAvatarSrc: post.authorAvatarUrl ? { uri: post.authorAvatarUrl } : undefined,
      caption: post.caption,
      likes: post.likeCount,
      commentCount: post.comments.length,
      comments: post.comments.map((comment) => ({
        id: String(comment.id),
        author: comment.authorName,
        authorAvatarSrc: comment.authorAvatarUrl ? { uri: comment.authorAvatarUrl } : undefined,
        text: comment.text,
      })),
    };
  }, [mediaUrl, post]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: model?.authorName ?? 'Post' });
  }, [navigation, model?.authorName]);

  if (post === undefined) {
    return (
      <Screen className="flex-1 items-center justify-center">
        <PostDetailsNotFound message="Loading post..." />
      </Screen>
    );
  }

  if (!model) {
    return (
      <Screen className="flex-1">
        <PostDetailsNotFound message="No post found." />
      </Screen>
    );
  }

  return (
    <Screen className="flex-1">
      <PostDetailsView model={model} />
    </Screen>
  );
}
