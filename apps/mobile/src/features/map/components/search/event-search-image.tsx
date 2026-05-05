import { Icon } from '@/components/icon';
import { Image } from '@/components/image';
import { useAppTheme } from '@/lib/use-app-theme';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { View } from 'react-native';

type EventSearchImageProps = {
  /** Prefer this when the parent query already resolved a public URL (avoids an extra fetch). */
  mediaUrl?: string | null;
  /** When `mediaUrl` is absent, loads the file URL from storage (may be null). */
  mediaId?: Id<'_storage'> | null;
  className?: string;
};

export function EventSearchImage({ mediaUrl, mediaId, className }: EventSearchImageProps) {
  const theme = useAppTheme();
  const file = useQuery(api.files.getFile, !mediaUrl && mediaId ? { storageId: mediaId } : 'skip');
  const url = mediaUrl ?? file?.url ?? null;

  return (
    <View className={className ?? 'size-12 overflow-hidden rounded-2xl bg-primary/10'}>
      {url ? (
        <Image source={url} className="h-full w-full" contentFit="cover" />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Icon name="place" size={22} color={theme.tint} />
        </View>
      )}
    </View>
  );
}
