import { Image } from '@/components/image';
import { VideoThumbnail } from '@/components/video';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { FlatList, TouchableOpacity, View } from 'react-native';

export type GridMediaItem = {
  id: string;
  postId: string;
  mediaId: Id<'_storage'>;
};

type PostGridProps = {
  posts: GridMediaItem[];
};

function MediaGridItem({ item }: { item: GridMediaItem }) {
  const router = useRouter();
  const mediaUrl = useQuery(api.files.getUrl, { storageId: item.mediaId });
  const mediaMetadata = useQuery(api.files.getMetadata, { storageId: item.mediaId });
  const mediaTypeResolved = mediaMetadata !== undefined;
  const isVideo = mediaMetadata?.contentType?.startsWith('video/') ?? false;

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '../profile/post-details',
          params: { postId: item.postId },
        })
      }
      className="aspect-square w-1/3 bg-surface-muted"
    >
      {isVideo ? (
        <VideoThumbnail
          uri={mediaUrl}
          className="h-full w-full"
          fallbackClassName="h-full w-full bg-surface-muted"
        />
      ) : mediaTypeResolved && mediaUrl ? (
        <Image source={mediaUrl} className="h-full w-full" contentFit="cover" />
      ) : (
        <View className="h-full w-full bg-surface-muted" />
      )}
    </TouchableOpacity>
  );
}

const PostGrid = ({ posts }: PostGridProps) => {
  return (
    <FlatList
      data={posts}
      renderItem={({ item }) => <MediaGridItem item={item} />}
      keyExtractor={(item) => item.id.toString()}
      numColumns={3}
      scrollEnabled={false}
      initialNumToRender={6}
      maxToRenderPerBatch={6}
      windowSize={2}
      removeClippedSubviews
      contentContainerStyle={{ paddingBottom: 100 }}
    />
  );
};
export default PostGrid;
