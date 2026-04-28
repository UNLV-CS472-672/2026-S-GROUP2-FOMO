import { Icon } from '@/components/icon';
import { EventSearchImage } from '@/features/map/components/search/event-search-image';
import { useLocationSearch } from '@/features/map/hooks/use-location-search';
import type { RecentSearch } from '@/features/map/hooks/use-recent-searches';
import { formatFilterLabel, getEventTimeLabel, isEventLive } from '@/lib/format';
import { useAppTheme } from '@/lib/use-app-theme';
import { api } from '@fomo/backend/convex/_generated/api';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useQuery } from 'convex/react';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

const MAX_SUGGESTED_EVENTS = 6;

type ExploreFilter = { type: 'all'; label: string } | { type: 'tag'; label: string; value: string };

type SearchContentProps = {
  query: string;
  recentSearches: RecentSearch[];
  onChangeQuery: (value: string) => void;
  onExpand: () => void;
  onSaveRecentSearch: (value: RecentSearch) => void;
  onSelectEvent: (eventId: string) => void;
  onSelectLocation: (coords: { longitude: number; latitude: number }) => void;
};

export function SearchContent({
  query,
  recentSearches,
  onChangeQuery,
  onExpand,
  onSaveRecentSearch,
  onSelectEvent,
  onSelectLocation,
}: SearchContentProps) {
  const theme = useAppTheme();
  const {
    results: locationResults,
    isLoading: isLoadingLocations,
    resolveCoordinates,
  } = useLocationSearch(query);
  const events = useQuery(api.events.queries.getEvents) ?? [];
  const popularTags = useQuery(api.tags.getPopularEventTags) ?? [];
  const [activeFilter, setActiveFilter] = useState('all');

  const exploreFilters = useMemo(() => {
    return [
      { type: 'all', label: 'All' } satisfies ExploreFilter,
      ...popularTags.map(
        (tag) =>
          ({ type: 'tag', label: tag.name, value: tag.name.toLowerCase() }) satisfies ExploreFilter
      ),
    ];
  }, [popularTags]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const now = Date.now();

    const filterMatchedEvents = events.filter((event) => {
      const haystack = `${event.name} ${event.caption} ${event.tags.join(' ')}`.toLowerCase();

      if (activeFilter === 'all') {
        return true;
      }

      return haystack.includes(activeFilter);
    });

    if (!normalizedQuery) {
      return filterMatchedEvents
        .slice()
        .sort((a, b) => {
          const aLive = Number(isEventLive(a.startDate, a.endDate, now));
          const bLive = Number(isEventLive(b.startDate, b.endDate, now));

          if (aLive !== bLive) {
            return bLive - aLive;
          }

          const aDistance = Math.abs(a.startDate - now);
          const bDistance = Math.abs(b.startDate - now);
          return aDistance - bDistance;
        })
        .slice(0, MAX_SUGGESTED_EVENTS);
    }

    return filterMatchedEvents.filter((event) => {
      const haystack = `${event.name} ${event.caption} ${event.tags.join(' ')}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [activeFilter, events, query]);

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
          {exploreFilters.map((filter) => (
            <Pressable
              key={filter.label}
              accessibilityRole="button"
              className={`rounded-full border px-4 py-2.5 ${
                activeFilter === (filter.type === 'tag' ? filter.value : filter.type)
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background'
              }`}
              onPress={() => {
                setActiveFilter(filter.type === 'tag' ? filter.value : filter.type);
                onExpand();
              }}
            >
              <Text className="text-[13px] font-medium text-foreground">
                {formatFilterLabel(filter.label)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* location autocomplete results */}
      {query.trim().length > 0 && (
        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-[18px] font-semibold text-foreground">Places</Text>
            {isLoadingLocations && <ActivityIndicator size="small" color={theme.mutedText} />}
          </View>

          {locationResults.length > 0 ? (
            locationResults.map((loc) => (
              <Pressable
                key={loc.mapbox_id}
                accessibilityRole="button"
                className="flex-row items-center gap-3 rounded-[22px] bg-background/80 px-3 py-3"
                onPress={async () => {
                  onSaveRecentSearch({ type: 'query', label: loc.name });
                  const coords = await resolveCoordinates(loc.mapbox_id);
                  if (coords) onSelectLocation(coords);
                }}
              >
                <View className="size-10 items-center justify-center rounded-full bg-foreground/5">
                  <Icon name="place" size={18} color={theme.mutedText} />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-[14px] font-medium text-foreground" numberOfLines={1}>
                    {loc.name}
                  </Text>
                  <Text className="text-[12px] text-muted-foreground" numberOfLines={1}>
                    {loc.full_address}
                  </Text>
                </View>
              </Pressable>
            ))
          ) : !isLoadingLocations ? (
            <View className="rounded-[24px] border border-dashed border-border bg-background/80 px-4 py-5">
              <Text className="text-[15px] font-semibold text-foreground">No places found</Text>
              <Text className="mt-1 text-[13px] leading-5 text-muted-foreground">
                Try a different search term.
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* filtered based off search  */}
      <View className="gap-3">
        <Text className="text-[18px] font-semibold text-foreground">Suggested events</Text>

        {filteredEvents.length > 0 ? (
          filteredEvents.slice(0, MAX_SUGGESTED_EVENTS).map((event) => (
            <Pressable
              key={event.id}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-[24px] border border-border/70 bg-background/90 px-3 py-3"
              onPress={() => {
                onSaveRecentSearch({ type: 'event', eventId: event.id, label: event.name });
                onSelectEvent(event.id);
              }}
            >
              <EventSearchImage mediaId={event.mediaId} />

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
                  {getEventTimeLabel(event.startDate, event.endDate, Date.now())}
                </Text>
                <Text className="text-[12px] text-muted-foreground">
                  {event.attendeeCount} {event.endDate < Date.now() ? 'went' : 'going'}
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
              Try a broader search, or switch to a different explore filter.
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
