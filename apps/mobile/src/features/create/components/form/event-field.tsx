import { Icon } from '@/components/icon';
import type { CreateFormValues } from '@/features/create/types';
import { EventSearchImage } from '@/features/map/components/search/event-search-image';
import { api } from '@fomo/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useMemo, useState } from 'react';
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

type EventFieldProps = {
  control: Control<CreateFormValues>;
  setValue: UseFormSetValue<CreateFormValues>;
};

export function EventField({ control, setValue }: EventFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const allEvents = useQuery(api.events.queries.getEvents) ?? [];
  const eventId = useWatch({ control, name: 'post.eventId' });

  const selectedEvent = allEvents.find((e) => e.id === eventId);

  const filtered = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    const source = trimmed
      ? allEvents.filter((e) => e.name.toLowerCase().includes(trimmed))
      : allEvents;
    return source.slice(0, 10);
  }, [allEvents, search]);

  const selectEvent = (id: string) => {
    setValue('post.eventId', id, { shouldDirty: true });
    setIsOpen(false);
    setSearch('');
  };

  const clearEvent = () => {
    setValue('post.eventId', undefined, { shouldDirty: true });
    setIsOpen(false);
    setSearch('');
  };

  return (
    <View className="gap-2">
      <Text className="text-[13px] font-semibold tracking-wide text-muted-foreground">EVENT</Text>
      <View className="gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={selectedEvent ? selectedEvent.name : 'Attach an event'}
          className="rounded-2xl border border-muted bg-surface px-4 py-3.5 shadow-md"
          onPress={() => setIsOpen((v) => !v)}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 gap-1 pr-3">
              <Text className="text-[13px] font-semibold tracking-wide text-muted-foreground">
                {selectedEvent ? 'Event attached' : 'Attach to an event'}
              </Text>
              <Text
                className={`text-[15px] ${selectedEvent ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {selectedEvent ? selectedEvent.name : 'Tap to search and select an event.'}
              </Text>
            </View>
            {selectedEvent ? (
              <Pressable
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Remove event"
                onPress={clearEvent}
              >
                <Icon name="close" size={20} className="text-muted-foreground" />
              </Pressable>
            ) : (
              <Icon
                name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={20}
                className="text-muted-foreground"
              />
            )}
          </View>
        </Pressable>

        {isOpen ? (
          <View className="overflow-hidden rounded-2xl border border-muted bg-surface shadow-md">
            <View className="border-b border-muted px-4 py-3">
              <TextInput
                autoFocus
                placeholder="Search events..."
                value={search}
                onChangeText={setSearch}
                className="text-[15px] text-foreground"
                placeholderTextColor="#8B8B8B"
              />
            </View>
            <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled">
              {filtered.length ? (
                filtered.map((event, index) => (
                  <Pressable
                    key={event.id}
                    onPress={() => selectEvent(event.id)}
                    className={`flex-row items-center gap-2 px-4 py-3 ${index < filtered.length - 1 ? 'border-b border-muted' : ''}`}
                  >
                    <EventSearchImage
                      mediaId={event.mediaId}
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
                ))
              ) : (
                <View className="px-4 py-3">
                  <Text className="text-[13px] text-muted-foreground">
                    {allEvents.length === 0 ? 'Loading events...' : 'No events found.'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </View>
  );
}
