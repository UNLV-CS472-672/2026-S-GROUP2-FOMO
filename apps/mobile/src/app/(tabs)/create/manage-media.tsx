import { Icon } from '@/components/icon';
import { Screen } from '@/components/ui/screen';
import type { CreateMediaItem } from '@/features/create/types';
import { getStringParam } from '@/features/create/utils';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ManageMediaParams = {
  postMedia?: string | string[];
};

type MediaRow = CreateMediaItem & { key: string };

function parsePostMediaParam(value: string | undefined): MediaRow[] {
  if (!value) return [];
  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v): v is { uri: string; type?: string | undefined } => {
        return (
          typeof v === 'object' &&
          v !== null &&
          'uri' in v &&
          typeof (v as { uri?: unknown }).uri === 'string'
        );
      })
      .map((v, index) => ({
        key: `${v.uri}::${index}`,
        uri: v.uri,
        type: typeof v.type === 'string' ? v.type : undefined,
      }));
  } catch {
    return [];
  }
}

export default function ManageMediaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<ManageMediaParams>();
  const initial = useMemo(
    () => parsePostMediaParam(getStringParam(params.postMedia)),
    [params.postMedia]
  );
  const [items, setItems] = useState<MediaRow[]>(initial);

  const handleDone = () => {
    const payload: CreateMediaItem[] = items.map(({ uri, type }) => ({ uri, type }));
    router.dismissTo({
      pathname: '/(tabs)/create' as never,
      params: {
        mode: 'post',
        postMedia: encodeURIComponent(JSON.stringify(payload)),
      } as never,
    });
  };

  return (
    <Screen className="flex-1">
      <View
        className="flex-1 pt-8"
        style={{
          paddingBottom: Math.max(insets.bottom, 8),
        }}
      >
        <View className="flex-row items-center px-4 pb-1">
          <View className="w-20 items-start">
            <Pressable
              className="rounded-full bg-surface px-3 py-2"
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Text className="text-[15px] font-semibold text-foreground">Back</Text>
            </Pressable>
          </View>
          <View className="min-w-0 flex-1 items-center px-1">
            <Text className="text-center text-base font-semibold text-foreground" numberOfLines={1}>
              Manage media
            </Text>
          </View>
          <View className="w-20 items-end justify-center">
            <Pressable onPress={handleDone} accessibilityRole="button" accessibilityLabel="Done">
              <Text className="text-base font-bold text-primary">Done</Text>
            </Pressable>
          </View>
        </View>

        <DraggableFlatList
          data={items}
          keyExtractor={(item) => item.key}
          activationDistance={12}
          containerStyle={{ flex: 1 }}
          contentContainerClassName="p-3 pb-6"
          contentContainerStyle={{ rowGap: 8 }}
          onDragEnd={({ data }) => setItems(data)}
          renderItem={({ item, getIndex, drag, isActive }: RenderItemParams<MediaRow>) => {
            const index = getIndex() ?? 0;
            const isVideo = item.type === 'video';
            return (
              <ScaleDecorator activeScale={0.98}>
                <Pressable
                  onLongPress={drag}
                  delayLongPress={150}
                  className={`flex-row items-center gap-3 rounded-2xl border px-3 py-1 my-1.5 ${
                    isActive ? 'border-primary/40 bg-muted' : 'border-border bg-surface'
                  }`}
                >
                  <Pressable
                    onLongPress={drag}
                    delayLongPress={0}
                    className="items-center justify-center "
                    accessibilityRole="button"
                    accessibilityLabel="Drag handle"
                  >
                    <Icon name="drag-handle" size={22} className="text-muted-foreground" />
                  </Pressable>

                  <View
                    className="overflow-hidden rounded-xl border border-border bg-muted"
                    style={{ width: 74, height: 74, borderCurve: 'continuous' }}
                  >
                    {!isVideo ? (
                      <Image
                        source={{ uri: item.uri }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="flex-1 items-center justify-center bg-black/80">
                        <Icon name="play-arrow" size={32} className="text-white" />
                      </View>
                    )}
                  </View>

                  <View className="min-w-0 flex-1 gap-2 flex-row justify-between items-center">
                    <Text className="text-[15px] font-semibold text-foreground">
                      {isVideo ? 'Video' : 'Photo'} {index + 1}
                    </Text>

                    <View className="flex-row items-center">
                      <Pressable
                        onPress={() =>
                          setItems((prev) => {
                            const next = prev.slice();
                            next.splice(index, 1);
                            return next;
                          })
                        }
                        className="ml-auto flex-row items-center gap-1 rounded-full bg-foreground/5 p-2"
                        accessibilityRole="button"
                        accessibilityLabel={`Remove media ${index + 1}`}
                      >
                        <Icon name="close" size={18} />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              </ScaleDecorator>
            );
          }}
          ListEmptyComponent={
            <View className="items-center justify-center px-6 py-12">
              <Text className="text-center text-2xl font-bold text-foreground">No media</Text>
              <Text className="mt-2 text-center text-[15px] leading-6 text-muted-foreground">
                Go back and tap "Add more" to attach photos or videos.
              </Text>
            </View>
          }
        />
      </View>
    </Screen>
  );
}
