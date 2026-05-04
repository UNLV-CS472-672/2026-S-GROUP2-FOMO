import { Icon } from '@/components/icon';
import type { CreateFormValues, CreateMode } from '@/features/create/types';
import { cn } from '@/lib/utils';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';

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
  const [search, setSearch] = useState('');
  const inputRef = useRef<TextInput>(null);

  const filteredTags = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    return trimmed ? allTags.filter((t) => t.name.toLowerCase().includes(trimmed)) : allTags;
  }, [allTags, search]);

  const toggleTag = useCallback(
    (tagName: string) => {
      setValue(
        tagsFieldName,
        tags.includes(tagName) ? tags.filter((t) => t !== tagName) : [...tags, tagName],
        { shouldDirty: true }
      );
    },
    [setValue, tagsFieldName, tags]
  );

  const open = useCallback(() => {
    setIsTagMenuOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [setIsTagMenuOpen]);

  const close = useCallback(() => {
    setIsTagMenuOpen(false);
    setSearch('');
    inputRef.current?.blur();
  }, [setIsTagMenuOpen]);

  return (
    <View className="gap-2">
      <Text className="text-[13px] font-semibold tracking-wide text-muted-foreground">TAGS</Text>
      <View className="overflow-hidden rounded-2xl border border-muted bg-surface shadow-md">
        {/* Collapsed trigger — shows selected tags or placeholder */}
        {!isTagMenuOpen ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose tags"
            className="flex-row items-center gap-2 px-4 py-3"
            onPress={open}
          >
            <Icon name="label" size={18} className="text-muted-foreground" />
            {tags.length > 0 ? (
              <>
                <Text className="flex-1 text-[15px] text-foreground" numberOfLines={1}>
                  {tags.join(', ')}
                </Text>
                <View className="min-w-[22px] items-center justify-center rounded-full bg-primary px-1.5 py-0.5">
                  <Text className="text-[11px] font-bold text-primary-foreground">
                    {tags.length}
                  </Text>
                </View>
              </>
            ) : (
              <Text className="flex-1 text-[15px] text-muted-foreground">Add tags...</Text>
            )}
            <Icon name="keyboard-arrow-down" size={20} className="text-muted-foreground" />
          </Pressable>
        ) : (
          /* Search input row — shown when open */
          <View className="flex-row items-center gap-2 px-4 py-3">
            <Icon name="search" size={18} className="text-muted-foreground" />
            <TextInput
              ref={inputRef}
              className="flex-1 text-[15px] text-foreground"
              placeholder="Search tags..."
              placeholderTextColor="#8B8B8B"
              value={search}
              onChangeText={setSearch}
              returnKeyType="done"
              onSubmitEditing={close}
            />
            {search.length > 0 ? (
              <Pressable hitSlop={8} onPress={() => setSearch('')}>
                <Icon name="close" size={18} className="text-muted-foreground" />
              </Pressable>
            ) : (
              <Pressable hitSlop={8} onPress={close}>
                <Icon name="keyboard-arrow-up" size={20} className="text-muted-foreground" />
              </Pressable>
            )}
          </View>
        )}

        {/* Tag chips */}
        {isTagMenuOpen ? (
          <View className="border-t border-muted p-3">
            {allTags.length === 0 ? (
              <Text className="text-[13px] text-muted-foreground">Loading tags...</Text>
            ) : filteredTags.length === 0 ? (
              <Text className="text-[13px] text-muted-foreground">No tags found.</Text>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {filteredTags.map((tag) => {
                  const isSelected = tags.includes(tag.name);
                  return (
                    <Pressable
                      key={tag.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      className={cn(
                        'rounded-full border px-3.5 py-2',
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-border bg-background dark:bg-secondary'
                      )}
                      onPress={() => toggleTag(tag.name)}
                    >
                      <Text
                        className={cn(
                          'text-xs font-semibold capitalize',
                          isSelected ? 'text-primary-foreground' : 'text-foreground'
                        )}
                      >
                        {tag.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}
