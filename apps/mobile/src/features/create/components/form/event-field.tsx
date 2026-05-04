import { Icon } from '@/components/icon';
import type { CreateFormValues } from '@/features/create/types';
import { EventSearchImage } from '@/features/map/components/search/event-search-image';
import { api } from '@fomo/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useMemo, useState } from 'react';
import { useController, type Control, type UseFormSetValue } from 'react-hook-form';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

type EventFieldProps = {
  control: Control<CreateFormValues>;
  setValue: UseFormSetValue<CreateFormValues>;
  formActive: boolean;
};

export function EventField({ control, setValue, formActive }: EventFieldProps) {
  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const allEvents = useQuery(api.events.queries.getEvents) ?? [];
  const { field, fieldState } = useController({
    control,
    name: 'post.eventId',
    disabled: !formActive,
    rules: { required: 'Select an event to attach this post to.' },
  });
  const eventId = field.value;
  const selectedEvent = allEvents.find((e) => e.id === eventId);

  const filtered = useMemo(() => {
    if (selectedEvent || !isFocused) return [];
    const trimmed = search.trim().toLowerCase();
    const source = trimmed
      ? allEvents.filter((e) => e.name.toLowerCase().includes(trimmed))
      : allEvents;
    return source.slice(0, 10);
  }, [allEvents, search, selectedEvent, isFocused]);

  const selectEvent = (id: string) => {
    setValue('post.eventId', id, { shouldDirty: true, shouldValidate: true });
    setSearch('');
    setIsFocused(false);
  };

  const clearEvent = () => {
    setValue('post.eventId', undefined, { shouldDirty: true, shouldValidate: true });
    setSearch('');
    setIsFocused(false);
  };

  return (
    <View className="gap-2">
      <Text className="text-[13px] font-semibold tracking-wide text-muted-foreground">EVENT</Text>

      <View
        className={`overflow-hidden rounded-2xl border bg-surface shadow-md ${fieldState.error ? 'border-destructive' : 'border-muted'}`}
      >
        {selectedEvent ? (
          <View className="flex-row items-center gap-2 px-4 py-3">
            <EventSearchImage
              mediaUrl={selectedEvent.mediaUrl}
              className="size-[18px] overflow-hidden rounded-full bg-primary/10"
            />
            <Text className="flex-1 text-[15px] text-foreground" numberOfLines={1}>
              {selectedEvent.name}
            </Text>
            <Pressable
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Remove event"
              onPress={clearEvent}
            >
              <Icon name="close" size={18} className="text-muted-foreground" />
            </Pressable>
          </View>
        ) : (
          <View className="flex-row items-center gap-2 px-4 py-3">
            <Icon name="search" size={18} className="text-muted-foreground" />
            <TextInput
              placeholder="Search events..."
              value={search}
              editable={!field.disabled}
              onChangeText={setSearch}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="flex-1 text-[15px] text-foreground"
              placeholderTextColor="#8B8B8B"
              returnKeyType="search"
            />
            {search.length > 0 ? (
              <Pressable hitSlop={8} onPress={() => setSearch('')}>
                <Icon name="close" size={18} className="text-muted-foreground" />
              </Pressable>
            ) : null}
          </View>
        )}

        {filtered.length > 0 ? (
          <ScrollView
            style={{ maxHeight: 240 }}
            keyboardShouldPersistTaps="handled"
            className="border-t border-muted"
          >
            {filtered.map((event, index) => (
              <Pressable
                key={event.id}
                onPress={() => selectEvent(event.id)}
                className={`flex-row items-center gap-3 px-4 py-3 ${index < filtered.length - 1 ? 'border-b border-muted' : ''}`}
              >
                <EventSearchImage
                  mediaUrl={event.mediaUrl}
                  className="size-10 overflow-hidden rounded-full bg-primary/10"
                />
                <View className="flex-1">
                  <Text className="text-[15px] font-medium text-foreground">{event.name}</Text>
                  <Text className="mt-0.5 text-[12px] text-muted-foreground">
                    {new Date(event.startDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : !selectedEvent && isFocused && search.trim().length > 0 ? (
          <View className="border-t border-muted px-4 py-3">
            <Text className="text-[13px] text-muted-foreground">
              {allEvents.length === 0 ? 'Loading events...' : 'No events found.'}
            </Text>
          </View>
        ) : null}
      </View>

      {fieldState.error?.message ? (
        <Text className="text-[13px] text-destructive" accessibilityRole="alert">
          {fieldState.error.message}
        </Text>
      ) : null}
    </View>
  );
}
