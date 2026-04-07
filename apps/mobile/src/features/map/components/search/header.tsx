import { Icon } from '@/components/icon';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { View } from 'react-native';

interface SearchHeaderProps {
  query: string;
  placeholderTextColor: string;
  onChangeQuery: (value: string) => void;
  onExpand: () => void;
}

export function SearchHeader({
  query,
  placeholderTextColor,
  onChangeQuery,
  onExpand,
}: SearchHeaderProps) {
  return (
    <View className="z-10 mx-4 mt-2 mb-8 flex-row items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 pb-4">
      <Icon name="search" size={24} className="text-muted-foreground" />
      <BottomSheetTextInput
        value={query}
        onChangeText={onChangeQuery}
        onPressIn={onExpand}
        onFocus={onExpand}
        placeholder="Search places, events, or vibes"
        placeholderTextColor={placeholderTextColor}
        className="flex-1 text-base text-foreground"
        accessibilityLabel="Search events or places"
      />
    </View>
  );
}
