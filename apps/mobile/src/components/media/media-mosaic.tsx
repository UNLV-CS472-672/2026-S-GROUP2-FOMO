import { View } from 'react-native';

type RenderItem<T> = (args: { item: T; index: number; overlayLabel?: string }) => React.ReactNode;

const DEFAULT_MAX_SIZE = 4;

export function MediaMosaic<T>({
  items,
  maxSize = DEFAULT_MAX_SIZE,
  className,
  renderItem,
}: {
  items: T[];
  maxSize?: number;
  className?: string;
  renderItem: RenderItem<T>;
}) {
  if (items.length === 0) return null;

  if (items.length === 1) {
    return <View className={className}>{renderItem({ item: items[0]!, index: 0 })}</View>;
  }

  if (items.length === 2) {
    return (
      <View className={className}>
        <View className="flex-1 flex-row gap-2">
          {renderItem({ item: items[0]!, index: 0 })}
          {renderItem({ item: items[1]!, index: 1 })}
        </View>
      </View>
    );
  }

  if (items.length === 3) {
    return (
      <View className={className}>
        <View className="flex-1 gap-2">
          <View className="flex-[1.2]">{renderItem({ item: items[0]!, index: 0 })}</View>
          <View className="flex-1 flex-row gap-2">
            {renderItem({ item: items[1]!, index: 1 })}
            {renderItem({ item: items[2]!, index: 2 })}
          </View>
        </View>
      </View>
    );
  }

  const showOverlay = items.length > maxSize;
  const visible = items.slice(0, maxSize);
  const overlayLabel = showOverlay ? `+${items.length - maxSize}` : undefined;

  return (
    <View className={className}>
      <View className="flex-1 gap-2">
        <View className="flex-1 flex-row gap-2">
          {renderItem({ item: visible[0]!, index: 0 })}
          {renderItem({ item: visible[1]!, index: 1 })}
        </View>
        <View className="flex-1 flex-row gap-2">
          {renderItem({ item: visible[2]!, index: 2 })}
          {renderItem({ item: visible[3]!, index: 3, overlayLabel })}
        </View>
      </View>
    </View>
  );
}
