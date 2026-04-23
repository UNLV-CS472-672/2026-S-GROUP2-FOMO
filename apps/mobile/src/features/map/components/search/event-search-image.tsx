import { Icon } from '@/components/icon';
import { Image } from '@/components/image';
import { useAppTheme } from '@/lib/use-app-theme';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { View } from 'react-native';

type EventSearchImageProps = {
  mediaId: Id<'_storage'> | null;
};

export function EventSearchImage({ mediaId }: EventSearchImageProps) {
  const theme = useAppTheme();
  const file = useQuery(api.files.getFile, mediaId ? { storageId: mediaId } : 'skip');

  return (
    <View className="size-12 overflow-hidden rounded-2xl bg-primary/10">
      {file?.url ? (
        <Image source={file.url} className="h-full w-full" contentFit="cover" />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Icon name="place" size={22} color={theme.tint} />
        </View>
      )}
    </View>
  );
}
