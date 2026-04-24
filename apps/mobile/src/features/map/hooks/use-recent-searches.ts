import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

const RECENT_SEARCHES_STORAGE_KEY = 'fomo_recent_searches';
const MAX_RECENT_SEARCHES = 6;

export type RecentSearch =
  | {
      type: 'query';
      label: string;
    }
  | {
      type: 'event';
      eventId: string;
      label: string;
    };

function isRecentSearch(value: unknown): value is RecentSearch {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<RecentSearch>;

  if (item.type === 'query') {
    return typeof item.label === 'string';
  }

  if (item.type === 'event') {
    return typeof item.label === 'string' && typeof item.eventId === 'string';
  }

  return false;
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    let isMounted = true;

    const hydrateRecentSearches = async () => {
      try {
        const stored = await SecureStore.getItemAsync(RECENT_SEARCHES_STORAGE_KEY);

        if (!stored || !isMounted) {
          return;
        }

        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setRecentSearches(
            parsed.flatMap((item) => {
              if (typeof item === 'string') {
                return [{ type: 'query', label: item } satisfies RecentSearch];
              }

              return isRecentSearch(item) ? [item] : [];
            })
          );
        }
      } catch {
        if (isMounted) {
          setRecentSearches([]);
        }
      }
    };

    void hydrateRecentSearches();

    return () => {
      isMounted = false;
    };
  }, []);

  const addRecentSearch = useCallback(async (search: RecentSearch) => {
    const nextLabel = search.label.trim();

    if (!nextLabel) {
      return;
    }

    setRecentSearches((current) => {
      const nextSearch: RecentSearch =
        search.type === 'query'
          ? { type: 'query', label: nextLabel }
          : { type: 'event', eventId: search.eventId, label: nextLabel };

      const nextSearches = [
        nextSearch,
        ...current.filter((item) => {
          if (nextSearch.type !== item.type) {
            return true;
          }

          if (nextSearch.type === 'query') {
            return item.label !== nextSearch.label;
          }

          if (item.type !== 'event') {
            return true;
          }

          return item.eventId !== nextSearch.eventId;
        }),
      ].slice(0, MAX_RECENT_SEARCHES);

      void SecureStore.setItemAsync(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(nextSearches));
      return nextSearches;
    });
  }, []);

  return {
    recentSearches,
    addRecentSearch,
  };
}
