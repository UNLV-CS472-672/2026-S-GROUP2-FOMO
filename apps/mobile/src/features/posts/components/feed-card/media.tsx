import { MediaMosaic } from '@/components/media/media-mosaic';
import type { FeedPost } from '@/features/posts/types';
import { MediaTile } from './media-tile';

type MediaFile = FeedPost['mediaFiles'][number];

export function FeedCardMedia({
  mediaFiles,
  onPressMedia,
}: {
  mediaFiles: MediaFile[];
  onPressMedia: (index: number) => void;
}) {
  if (mediaFiles.length === 0) return null;

  const heightClassName = mediaFiles.length <= 2 ? 'h-55' : 'h-60';

  return (
    <MediaMosaic
      items={mediaFiles}
      className={heightClassName}
      renderItem={({ item: file, index, overlayLabel }) => (
        <MediaTile
          file={file}
          className={mediaFiles.length === 1 ? 'h-55 w-full' : 'flex-1'}
          overlayLabel={overlayLabel}
          onPress={() => onPressMedia(index)}
        />
      )}
    />
  );
}
