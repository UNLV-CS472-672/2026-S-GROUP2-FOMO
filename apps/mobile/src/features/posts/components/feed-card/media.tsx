import { MediaMosaic } from '@/components/media/media-mosaic';
import type { FeedPost } from '@/features/posts/types';
import { MediaTile } from './media-tile';

export function FeedCardMedia({
  mediaIds,
  onPressMedia,
}: {
  mediaIds: FeedPost['mediaIds'];
  onPressMedia: (index: number) => void;
}) {
  if (mediaIds.length === 0) return null;

  const heightClassName = mediaIds.length <= 2 ? 'h-55' : 'h-60';

  return (
    <MediaMosaic
      items={mediaIds}
      className={heightClassName}
      renderItem={({ item, index, overlayLabel }) => (
        <MediaTile
          mediaId={item}
          className={mediaIds.length === 1 ? 'h-55 w-full' : 'flex-1'}
          overlayLabel={overlayLabel}
          onPress={() => onPressMedia(index)}
        />
      )}
    />
  );
}
