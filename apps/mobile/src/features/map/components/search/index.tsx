import { Drawer } from '@/components/ui/drawer';
import { SearchContent } from '@/features/map/components/search/content';
import { SearchHeader } from '@/features/map/components/search/header';
import { useVoiceSearch } from '@/features/map/hooks/use-voice-search';
import { useAppTheme } from '@/lib/use-app-theme';
import { useState } from 'react';
import type { SharedValue } from 'react-native-reanimated';

type SearchDrawerProps = {
  onSelectEvent: (h3Id: string) => void;
  animatedIndex?: SharedValue<number>;
  animatedPosition?: SharedValue<number>;
};

export function SearchDrawer({
  onSelectEvent,
  animatedIndex,
  animatedPosition,
}: SearchDrawerProps) {
  const theme = useAppTheme();
  const [sheetIndex, setSheetIndex] = useState(0);
  const [query, setQuery] = useState('');
  const { isListening, stopVoiceSearch, toggleVoiceSearch } = useVoiceSearch({
    onTranscript: setQuery,
    onExpand: () => setSheetIndex(2),
  });

  return (
    <Drawer
      index={sheetIndex}
      onChange={(nextIndex) => setSheetIndex(Math.max(nextIndex, 0))}
      snapPoints={['13%', '38%', '85%']}
      backdropAppearsOnIndex={2}
      backdropDisappearsOnIndex={1}
      animatedIndex={animatedIndex}
      animatedPosition={animatedPosition}
    >
      <SearchHeader
        query={query}
        isListening={isListening}
        placeholderTextColor={theme.mutedText}
        animatedIndex={animatedIndex}
        onChangeQuery={setQuery}
        onCancel={() => {
          if (isListening) {
            stopVoiceSearch();
          }

          setQuery('');
          setSheetIndex(0);
        }}
        onExpand={() => setSheetIndex(2)}
        onVoiceSearch={toggleVoiceSearch}
      />

      <SearchContent
        query={query}
        onChangeQuery={setQuery}
        onExpand={() => setSheetIndex(2)}
        onSelectEvent={onSelectEvent}
      />
    </Drawer>
  );
}
