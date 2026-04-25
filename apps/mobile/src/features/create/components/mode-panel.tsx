import { Icon } from '@/components/icon';
import type { CreateFormValues, CreateMedia, CreateMode } from '@/features/create/types';
import { Image } from 'expo-image';
import type { Dispatch, SetStateAction } from 'react';
import { useController, useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';

type CreateModePanelProps = {
  control: Control<CreateFormValues>;
  setValue: UseFormSetValue<CreateFormValues>;
  mode: CreateMode;
  mediaHeight: number;
  isTagMenuOpen: boolean;
  setIsTagMenuOpen: Dispatch<SetStateAction<boolean>>;
  allTags: { id: string; name: string }[];
  openCamera: () => void;
};

export function CreateModePanel({
  control,
  setValue,
  mode,
  mediaHeight,
  isTagMenuOpen,
  setIsTagMenuOpen,
  allTags,
  openCamera,
}: CreateModePanelProps) {
  const descriptionFieldName = mode === 'event' ? 'event.description' : 'post.description';
  const tagsFieldName = mode === 'event' ? 'event.tags' : 'post.tags';
  const mediaFieldName = mode === 'event' ? 'event.media' : 'post.media';
  const isEventMode = mode === 'event';
  const { field: descriptionField } = useController({
    control,
    name: descriptionFieldName,
  });
  const tags = useWatch({ control, name: tagsFieldName }) ?? [];
  const media = (useWatch({ control, name: mediaFieldName }) ?? {
    uri: '',
    type: undefined,
  }) as CreateMedia;
  const hasPhoto = !!media.uri && media.type !== 'video';
  const shouldShowMediaSection = isEventMode || hasPhoto;

  const toggleTag = (tagName: string) => {
    setValue(
      tagsFieldName,
      tags.includes(tagName)
        ? tags.filter((currentTag) => currentTag !== tagName)
        : [...tags, tagName],
      { shouldDirty: true }
    );
  };

  return (
    <View className="gap-4 pt-1">
      {shouldShowMediaSection ? (
        <View className="gap-2">
          <Text className="text-[13px] font-semibold tracking-wide text-muted-foreground">
            MEDIA
          </Text>
          <Pressable onPress={hasPhoto ? undefined : openCamera} className="rounded-2xl shadow-md">
            <View
              className="overflow-hidden rounded-2xl border border-muted bg-surface"
              style={{ height: mediaHeight, borderCurve: 'continuous' }}
            >
              {hasPhoto ? (
                <Image
                  source={{ uri: media.uri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center gap-2 p-6">
                  <Text className="text-center text-[15px] font-semibold text-foreground">
                    {isEventMode ? 'Add event cover' : 'Add photo or video'}
                  </Text>
                  <Text className="text-center text-[13px] leading-5 text-muted-foreground">
                    {isEventMode
                      ? 'Tap to capture a cover image for the event'
                      : 'Tap to capture something for your post'}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>
      ) : null}

      <View className="gap-2">
        <Text className="text-[13px] font-semibold tracking-wide text-muted-foreground">
          DETAILS
        </Text>
        <View className="h-32 rounded-2xl border border-muted bg-surface px-4 py-3.5 shadow-md">
          <TextInput
            placeholder={isEventMode ? 'What should people know?' : 'What do you want to share?'}
            placeholderTextColor="#8B8B8B"
            multiline
            textAlignVertical="top"
            className="flex-1 text-[15px] text-foreground"
            value={descriptionField.value}
            onChangeText={descriptionField.onChange}
          />
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-[13px] font-semibold tracking-wide text-muted-foreground">TAGS</Text>
        <View className="gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose tags"
            className="rounded-2xl border border-muted bg-surface px-4 py-3.5 shadow-md"
            onPress={() => setIsTagMenuOpen((currentValue) => !currentValue)}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 gap-1 pr-3">
                <Text className="text-[13px] font-semibold tracking-wide text-muted-foreground">
                  {tags.length ? `${tags.length} selected` : 'Choose from existing tags'}
                </Text>
                <Text
                  className={`text-[15px] ${tags.length ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {tags.length ? tags.join(', ') : 'Tap to browse and select tags.'}
                </Text>
              </View>
              <Icon
                name={isTagMenuOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={20}
                className="text-muted-foreground"
              />
            </View>
          </Pressable>

          {isTagMenuOpen ? (
            <View className="rounded-2xl border border-muted bg-surface p-3 shadow-md">
              {allTags.length ? (
                <View className="flex-row flex-wrap gap-2">
                  {allTags.map((tag) => {
                    const isSelected = tags.includes(tag.name);
                    return (
                      <Pressable
                        key={tag.id}
                        accessibilityRole="button"
                        className={`flex-row items-center gap-1 rounded-full border px-3 py-2 ${isSelected ? 'border-primary bg-primary' : 'border-border bg-background'}`}
                        onPress={() => toggleTag(tag.name)}
                      >
                        <Text
                          className={`text-[13px] font-medium ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}
                        >
                          {tag.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text className="text-[13px] text-muted-foreground">Loading tags...</Text>
              )}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
