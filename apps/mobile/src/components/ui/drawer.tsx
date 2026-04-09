import { useAppTheme } from '@/lib/use-app-theme';
import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';

type DrawerProps = {
  children: ReactNode;
  index?: number;
  onChange?: (index: number) => void;
  snapPoints?: (number | string)[];
  backdropAppearsOnIndex?: number;
  backdropDisappearsOnIndex?: number;
  animatedIndex?: SharedValue<number>;
  animatedPosition?: SharedValue<number>;
};

export function Drawer({
  children,
  index = 0,
  onChange,
  snapPoints = ['15%', '35%', '75%'],
  backdropAppearsOnIndex = 1,
  backdropDisappearsOnIndex = 0,
  animatedIndex,
  animatedPosition,
}: DrawerProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const theme = useAppTheme();

  useEffect(() => {
    if (index < 0) {
      bottomSheetRef.current?.close();
    } else {
      bottomSheetRef.current?.snapToIndex(index);
    }
  }, [index]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.7}
        disappearsOnIndex={backdropDisappearsOnIndex}
        appearsOnIndex={backdropAppearsOnIndex}
        pressBehavior={'collapse'}
      />
    ),
    [backdropAppearsOnIndex, backdropDisappearsOnIndex]
  );

  const handleChange = useCallback(
    (nextIndex: number) => {
      onChange?.(nextIndex);
    },
    [onChange]
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={index}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      onChange={handleChange}
      animatedIndex={animatedIndex}
      animatedPosition={animatedPosition}
      handleIndicatorStyle={{ backgroundColor: theme.mutedText, width: 40 }}
      backgroundStyle={{ backgroundColor: theme.surface, borderRadius: 40 }}
    >
      {children}
    </BottomSheet>
  );
}
