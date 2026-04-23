import { Image } from '@/components/image';
import { VideoThumbnail } from '@/components/video';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from 'convex/react';
import { TouchableOpacity, useWindowDimensions, View } from 'react-native';

export type GridMediaItem = {
  id: string;
  postId: string;
  mediaId: Id<'_storage'>;
};

type MediaGridProps = {
  posts: GridMediaItem[];
  onPressItem: (item: GridMediaItem) => void;
};

function MediaGridItem({
  item,
  onPress,
  size,
}: {
  item: GridMediaItem;
  onPress: () => void;
  size: number;
}) {
  const file = useQuery(api.files.getFile, { storageId: item.mediaId });
  const mediaTypeResolved = file !== undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ width: size, height: size }}
      className="bg-surface-muted"
    >
      {file?.isVideo ? (
        <VideoThumbnail
          uri={file?.url}
          className="h-full w-full"
          fallbackClassName="h-full w-full bg-surface-muted"
        />
      ) : mediaTypeResolved && file?.url ? (
        <Image source={file.url} className="h-full w-full" contentFit="cover" />
      ) : (
        <View className="h-full w-full bg-surface-muted" />
      )}
    </TouchableOpacity>
  );
}

export const MediaGrid = ({ posts, onPressItem }: MediaGridProps) => {
  const { width } = useWindowDimensions();
  const cellSize = Math.floor(width / 3);

  return (
    <FlashList
      data={posts}
      renderItem={({ item }) => (
        <MediaGridItem item={item} onPress={() => onPressItem(item)} size={cellSize} />
      )}
      keyExtractor={(item) => item.id.toString()}
      numColumns={3}
      scrollEnabled={false}
      extraData={cellSize}
      contentContainerStyle={{ paddingBottom: 100 }}
    />
  );
};
