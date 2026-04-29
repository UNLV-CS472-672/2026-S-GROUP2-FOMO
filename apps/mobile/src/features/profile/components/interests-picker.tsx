import { Button, ButtonText } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type InterestsPickerProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  saveLabel: string;
  savingLabel: string;
  successMessage?: string;
  onSaved?: () => void | Promise<void>;
  variant?: 'card' | 'page' | 'sheet';
};

export function InterestsPicker({
  title,
  subtitle,
  eyebrow,
  saveLabel,
  savingLabel,
  successMessage,
  onSaved,
  variant = 'card',
}: InterestsPickerProps) {
  const preferences = useQuery(api.tags.getCurrentUserTagPreferences, {});
  const savePreferences = useMutation(api.tags.saveCurrentUserTagPreferences);
  const [selectedTagIds, setSelectedTagIds] = useState<Id<'tags'>[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!preferences) {
      return;
    }

    setSelectedTagIds(preferences.tags.filter((tag) => tag.selected).map((tag) => tag.id));
  }, [preferences]);

  if (!preferences) {
    return (
      <View
        className={cn(
          'items-center justify-center',
          variant === 'card'
            ? 'rounded-3xl border border-border bg-card px-6 py-10'
            : variant === 'sheet'
              ? 'px-6 py-10'
              : 'flex-1 px-8 py-10'
        )}
      >
        <ActivityIndicator />
        <Text className="mt-3 text-sm text-muted-foreground">Loading your interests...</Text>
      </View>
    );
  }

  const hasChanges = preferences.tags.some(
    (tag) => selectedTagIds.includes(tag.id) !== tag.selected
  );
  const selectedCount = selectedTagIds.length;
  const canSubmit = !isSaving && (hasChanges || !preferences.hasCompletedSelection);

  async function handleSave() {
    if (!canSubmit) {
      return;
    }

    setIsSaving(true);

    try {
      await savePreferences({ tagIds: selectedTagIds });
      if (successMessage) {
        Alert.alert('Saved', successMessage);
      }
      await onSaved?.();
    } catch (error) {
      Alert.alert(
        'Unable to save interests',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (variant === 'page') {
    return (
      <View
        className="flex-1 px-8 pt-4 justify-between"
        style={{ paddingBottom: Math.max(insets.bottom + 64, 50) }}
      >
        <View className="flex-1">
          {eyebrow ? (
            <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-primary">
              {eyebrow}
            </Text>
          ) : null}

          <Text className="mt-3 text-3xl font-bold leading-9 text-foreground">{title}</Text>
          <Text className="mt-2 text-base leading-6 text-muted-foreground">{subtitle}</Text>

          <Text className="mt-6 text-sm font-medium text-muted-foreground">
            {selectedCount === 0
              ? 'No interests selected yet.'
              : `${selectedCount} interest${selectedCount === 1 ? '' : 's'} selected`}
          </Text>

          <View className="mt-4 flex-row flex-wrap gap-2.5">
            {preferences.tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);

              return (
                <Pressable
                  key={tag.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  className={cn(
                    'rounded-full border px-4 py-2.5',
                    isSelected
                      ? 'border-primary bg-primary'
                      : 'border-border bg-background dark:bg-secondary'
                  )}
                  onPress={() => {
                    setSelectedTagIds((current) => {
                      if (current.includes(tag.id)) {
                        return current.filter((id) => id !== tag.id);
                      }

                      return [...current, tag.id];
                    });
                  }}
                >
                  <Text
                    className={cn(
                      'text-sm font-semibold capitalize',
                      isSelected ? 'text-primary-foreground' : 'text-foreground'
                    )}
                  >
                    {tag.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button className="mt-8" onPress={() => void handleSave()} disabled={!canSubmit}>
          <ButtonText>{isSaving ? savingLabel : saveLabel}</ButtonText>
        </Button>
      </View>
    );
  }

  if (variant === 'sheet') {
    return (
      <View className="px-6 pb-6">
        <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-muted-foreground">
          {selectedCount === 0 ? 'None selected' : `${selectedCount} selected`}
        </Text>

        <View className="mt-3 flex-row flex-wrap gap-2">
          {preferences.tags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);

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
                onPress={() => {
                  setSelectedTagIds((current) => {
                    if (current.includes(tag.id)) {
                      return current.filter((id) => id !== tag.id);
                    }

                    return [...current, tag.id];
                  });
                }}
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

        <Button className="mt-5" onPress={() => void handleSave()} disabled={!canSubmit}>
          <ButtonText>{isSaving ? savingLabel : saveLabel}</ButtonText>
        </Button>
      </View>
    );
  }

  return (
    <View className="rounded-3xl border border-border bg-card p-5">
      <Text className="text-xl font-bold text-foreground">{title}</Text>
      <Text className="mt-1.5 text-sm leading-5 text-muted-foreground">{subtitle}</Text>

      <Text className="mt-4 text-xs font-semibold uppercase tracking-[1.2px] text-muted-foreground">
        {selectedCount === 0 ? 'None selected' : `${selectedCount} selected`}
      </Text>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {preferences.tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);

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
              onPress={() => {
                setSelectedTagIds((current) => {
                  if (current.includes(tag.id)) {
                    return current.filter((id) => id !== tag.id);
                  }

                  return [...current, tag.id];
                });
              }}
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

      <Button className="mt-5" onPress={() => void handleSave()} disabled={!canSubmit}>
        <ButtonText>{isSaving ? savingLabel : saveLabel}</ButtonText>
      </Button>
    </View>
  );
}
