import { Drawer } from '@/components/ui/drawer';
import {
  SEARCH_DRAWER_SNAP_POINTS,
  SEARCH_DRAWER_STATE,
} from '@/features/map/components/search/constants';
import { SearchContent } from '@/features/map/components/search/content';
import { SearchHeader } from '@/features/map/components/search/header';
import { useVoiceSearch } from '@/features/map/hooks/use-voice-search';
import { useAppTheme } from '@/lib/use-app-theme';
import { useEffect, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type SearchDrawerProps = {
  onSelectEvent: (eventId: string) => void;
  animatedIndex?: SharedValue<number>;
  animatedPosition?: SharedValue<number>;
  isFocused?: boolean;
};

export function SearchDrawer({
  onSelectEvent,
  animatedIndex,
  animatedPosition,
  isFocused = true,
}: SearchDrawerProps) {
  const theme = useAppTheme();
  const [sheetIndex, setSheetIndex] = useState<number>(SEARCH_DRAWER_STATE.collapsed);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const { isListening, stopVoiceSearch, toggleVoiceSearch } = useVoiceSearch({
    onTranscript: setQuery,
    onExpand: () => setSheetIndex(SEARCH_DRAWER_STATE.expanded),
  });

  useEffect(() => {
    if (isFocused) {
      return;
    }

    inputRef.current?.blur();

    if (isListening) {
      stopVoiceSearch();
    }
  }, [isFocused, isListening, stopVoiceSearch]);

  return (
    <Drawer
      index={sheetIndex}
      onChange={(nextIndex) => setSheetIndex(Math.max(nextIndex, SEARCH_DRAWER_STATE.collapsed))}
      snapPoints={[...SEARCH_DRAWER_SNAP_POINTS]}
      backdropAppearsOnIndex={SEARCH_DRAWER_STATE.expanded}
      backdropDisappearsOnIndex={SEARCH_DRAWER_STATE.peek}
      animatedIndex={animatedIndex}
      animatedPosition={animatedPosition}
    >
      <SearchHeader
        query={query}
        isListening={isListening}
        placeholderTextColor={theme.mutedText}
        animatedIndex={animatedIndex}
        inputRef={inputRef}
        onChangeQuery={setQuery}
        onCancel={() => {
          inputRef.current?.blur();

          if (isListening) {
            stopVoiceSearch();
          }

          setQuery('');
          setSheetIndex(SEARCH_DRAWER_STATE.collapsed);
        }}
        onExpand={() => setSheetIndex(SEARCH_DRAWER_STATE.expanded)}
        onVoiceSearch={toggleVoiceSearch}
      />

      <SearchContent
        query={query}
        onChangeQuery={setQuery}
        onExpand={() => setSheetIndex(SEARCH_DRAWER_STATE.expanded)}
        onSelectEvent={onSelectEvent}
      />
    </Drawer>
  );
}
