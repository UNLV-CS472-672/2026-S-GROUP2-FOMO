import { Icon } from '@/components/icon';
import { Image } from '@/components/image';
import { useAppTheme } from '@/lib/use-app-theme';
import { View } from 'react-native';

type EventSearchImageProps = {
  mediaUrl: string | null;
  className?: string;
};

export function EventSearchImage({ mediaUrl, className }: EventSearchImageProps) {
  const theme = useAppTheme();

  return (
    <View className={className ?? 'size-12 overflow-hidden rounded-2xl bg-primary/10'}>
      {mediaUrl ? (
        <Image source={mediaUrl} className="h-full w-full" contentFit="cover" />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Icon name="place" size={22} color={theme.tint} />
        </View>
      )}
    </View>
  );
}
