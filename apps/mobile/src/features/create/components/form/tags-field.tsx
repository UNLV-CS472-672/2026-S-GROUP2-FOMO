import { Icon } from '@/components/icon';
import type { CreateFormValues, CreateMode } from '@/features/create/types';
import type { Dispatch, SetStateAction } from 'react';
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

type TagsFieldProps = {
  control: Control<CreateFormValues>;
  setValue: UseFormSetValue<CreateFormValues>;
  mode: CreateMode;
  isTagMenuOpen: boolean;
  setIsTagMenuOpen: Dispatch<SetStateAction<boolean>>;
  allTags: { id: string; name: string }[];
};

export function TagsField({
  control,
  setValue,
  mode,
  isTagMenuOpen,
  setIsTagMenuOpen,
  allTags,
}: TagsFieldProps) {
  const tagsFieldName = mode === 'event' ? 'event.tags' : 'post.tags';
  const tags = useWatch({ control, name: tagsFieldName }) ?? [];

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
    <View className="gap-2">
      <Text className="text-[13px] font-semibold tracking-wide text-muted-foreground">TAGS</Text>
      <View className="gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose tags"
          className="rounded-2xl border border-muted bg-surface px-4 py-3.5 shadow-md"
          onPress={() => setIsTagMenuOpen((current) => !current)}
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
  );
}
