import { Icon } from '@/components/icon';
import type { RecentSearch } from '@/features/map/hooks/use-recent-searches';
import { useAppTheme } from '@/lib/use-app-theme';
import { api } from '@fomo/backend/convex/_generated/api';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useQuery } from 'convex/react';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

const SEARCH_FILTERS = ['Nearby', 'Tonight', 'Coffee', 'Study spots'];

type SearchContentProps = {
  query: string;
  recentSearches: RecentSearch[];
  onChangeQuery: (value: string) => void;
  onExpand: () => void;
  onSaveRecentSearch: (value: RecentSearch) => void;
  onSelectEvent: (eventId: string) => void;
};

export function SearchContent({
  query,
  recentSearches,
  onChangeQuery,
  onExpand,
  onSaveRecentSearch,
  onSelectEvent,
}: SearchContentProps) {
  const theme = useAppTheme();
  const events = useQuery(api.events.queries.getEvents) ?? [];

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return events.slice(0, 6);
    }

    return events.filter((event) => {
      const haystack = `${event.name} ${event.caption}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [events, query]);

  return (
    <BottomSheetScrollView
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 20, paddingBottom: 24, paddingHorizontal: 16 }}
    >
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-[18px] font-semibold text-foreground">Explore right now</Text>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onExpand}>
            <Text className="text-[14px] font-semibold text-primary">See all</Text>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {SEARCH_FILTERS.map((filter) => (
            <Pressable
              key={filter}
              accessibilityRole="button"
              className="rounded-full border border-border bg-background px-4 py-2.5"
              onPress={onExpand}
            >
              <Text className="text-[13px] font-medium text-foreground">{filter}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* filtered based off search  */}
      <View className="gap-3">
        <Text className="text-[18px] font-semibold text-foreground">Suggested spots</Text>

        {filteredEvents.length > 0 ? (
          filteredEvents.slice(0, 6).map((event, index) => (
            <Pressable
              key={`${event.name}-${event.location.latitude}`}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-[24px] border border-border/70 bg-background/90 px-3 py-3"
              onPress={() => {
                onSaveRecentSearch({ type: 'event', eventId: event.id, label: event.name });
                onSelectEvent(event.id);
              }}
            >
              <View className="size-12 items-center justify-center rounded-2xl bg-primary/10">
                <Icon
                  name={index % 2 === 0 ? 'place' : 'celebration'}
                  size={22}
                  color={theme.tint}
                />
              </View>

              <View className="flex-1 gap-1">
                <Text className="text-[15px] font-semibold text-foreground" numberOfLines={1}>
                  {event.name}
                </Text>
                <Text className="text-[13px] text-muted-foreground" numberOfLines={1}>
                  {event.caption}
                </Text>
              </View>

              <View className="items-end gap-1">
                <Text className="text-[12px] font-semibold uppercase tracking-[0.8px] text-primary">
                  {(index + 2) * 3} min
                </Text>
                <Text className="text-[12px] text-muted-foreground">
                  {event.attendeeCount} going
                </Text>
              </View>
            </Pressable>
          ))
        ) : (
          <View className="rounded-[24px] border border-dashed border-border bg-background/80 px-4 py-5">
            <Text className="text-[15px] font-semibold text-foreground">
              No matching places yet
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-muted-foreground">
              Try a broader search like campus, coffee, or tonight.
            </Text>
          </View>
        )}
      </View>

      {/* recent searches */}
      <View className="gap-3">
        <Text className="text-[18px] font-semibold text-foreground">Recent searches</Text>

        {recentSearches.length > 0 ? (
          recentSearches.map((item, index) => (
            <Pressable
              key={item.type === 'event' ? item.eventId : item.label}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-[22px] bg-background/80 px-3 py-3"
              onPress={() => {
                onSaveRecentSearch(item);

                if (item.type === 'event') {
                  onSelectEvent(item.eventId);
                  return;
                }

                onChangeQuery(item.label);
                onExpand();
              }}
            >
              <View className="size-10 items-center justify-center rounded-full bg-foreground/5">
                <Icon
                  name={item.type === 'event' ? 'place' : index === 0 ? 'history' : 'search'}
                  size={18}
                  color={theme.mutedText}
                />
              </View>
              <Text className="flex-1 text-[14px] font-medium text-foreground">{item.label}</Text>
              <Icon name="chevron-right" size={18} color={theme.mutedText} />
            </Pressable>
          ))
        ) : (
          <View className="rounded-[24px] border border-dashed border-border bg-background/80 px-4 py-5">
            <Text className="text-[15px] font-semibold text-foreground">
              No recent searches yet
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-muted-foreground">
              Search for a place or event and it will show up here.
            </Text>
          </View>
        )}
      </View>
    </BottomSheetScrollView>
  );
}
