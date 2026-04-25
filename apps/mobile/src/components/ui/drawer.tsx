import { useAppTheme } from '@/lib/use-app-theme';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, type FC, type ReactNode } from 'react';
import { Keyboard } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type DrawerProps = {
  children: ReactNode;
  index?: number;
  onChange?: (index: number) => void;
  snapPoints?: (number | string)[];
  backdropAppearsOnIndex?: number;
  backdropDisappearsOnIndex?: number;
  enablePanDownToClose?: boolean;
  showHandle?: boolean;
  animatedIndex?: SharedValue<number>;
  animatedPosition?: SharedValue<number>;
  bottomInset?: number | undefined;
};

export function Drawer({
  children,
  index = 0,
  onChange,
  snapPoints = ['15%', '35%', '75%'],
  backdropAppearsOnIndex = 1,
  backdropDisappearsOnIndex = 0,
  enablePanDownToClose = false,
  showHandle = true,
  animatedIndex,
  animatedPosition,
}: DrawerProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const hasMountedRef = useRef(false);
  const theme = useAppTheme();

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

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
        pressBehavior={enablePanDownToClose ? 'close' : 'collapse'}
      />
    ),
    [backdropAppearsOnIndex, backdropDisappearsOnIndex, enablePanDownToClose]
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
      animateOnMount={false}
      snapPoints={snapPoints}
      enablePanDownToClose={enablePanDownToClose}
      enableDynamicSizing={false}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      onChange={handleChange}
      animatedIndex={animatedIndex}
      animatedPosition={animatedPosition}
      handleComponent={showHandle ? undefined : () => null}
      handleIndicatorStyle={
        showHandle ? { backgroundColor: theme.mutedText, width: 40 } : undefined
      }
      backgroundStyle={{ backgroundColor: theme.surface, borderRadius: 40 }}
    >
      {children}
    </BottomSheet>
  );
}

type DrawerModalProps = {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  snapPoints?: (number | string)[];
  backdropAppearsOnIndex?: number;
  backdropDisappearsOnIndex?: number;
  enablePanDownToClose?: boolean;
  /** `extend` shrinks content when the keyboard opens; `interactive` lifts the whole sheet. */
  keyboardBehavior?: 'interactive' | 'extend' | 'fillParent';
  /** Sticky footer (e.g. composer) — Gorhom keeps this above the keyboard. */
  footerComponent?: FC<BottomSheetFooterProps>;
  /** Passed through for correct snap / keyboard insets (e.g. `useSafeAreaInsets().bottom`). */
  bottomInset?: number;
  /** Fires when snap index updates (e.g. `0` when the modal finishes opening). */
  onSheetChange?: (index: number) => void;
  enableBlurKeyboardOnGesture?: boolean;
  keyboardBlurBehavior?: 'none' | 'restore';
  /**
   * When false, vertical pans on the sheet body scroll inner scrollables instead
   * of dragging the sheet.
   */
  enableContentPanningGesture?: boolean;
};

/**
 * Same visuals as {@link Drawer}, but uses `BottomSheetModal` so the backdrop
 * covers the whole window (including native stack headers). Use for screens
 * that show a stack `headerShown: true` above the sheet host view.
 */
export function DrawerModal({
  children,
  open,
  onClose,
  snapPoints = ['15%', '35%', '75%'],
  backdropAppearsOnIndex = 1,
  backdropDisappearsOnIndex = 0,
  enablePanDownToClose = false,
  keyboardBehavior = 'extend',
  footerComponent,
  bottomInset,
  onSheetChange,
  enableBlurKeyboardOnGesture = false,
  keyboardBlurBehavior = 'restore',
  enableContentPanningGesture = true,
}: DrawerModalProps) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const theme = useAppTheme();

  const dismissKeyboardWhenClosing = useCallback(
    (_fromIndex: number, toIndex: number, _fromPosition: number, _toPosition: number) => {
      if (toIndex === -1) {
        Keyboard.dismiss();
      }
    },
    []
  );

  useEffect(() => {
    if (open) {
      bottomSheetModalRef.current?.present();
    } else {
      Keyboard.dismiss();
      bottomSheetModalRef.current?.dismiss();
    }
  }, [open]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.7}
        disappearsOnIndex={backdropDisappearsOnIndex}
        appearsOnIndex={backdropAppearsOnIndex}
        pressBehavior={enablePanDownToClose ? 'close' : 'collapse'}
      />
    ),
    [backdropAppearsOnIndex, backdropDisappearsOnIndex, enablePanDownToClose]
  );

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={snapPoints}
      enablePanDownToClose={enablePanDownToClose}
      enableContentPanningGesture={enableContentPanningGesture}
      enableDynamicSizing={false}
      keyboardBehavior={keyboardBehavior}
      keyboardBlurBehavior={keyboardBlurBehavior}
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      onAnimate={dismissKeyboardWhenClosing}
      onChange={(index) => onSheetChange?.(index)}
      footerComponent={footerComponent}
      bottomInset={bottomInset}
      enableBlurKeyboardOnGesture={enableBlurKeyboardOnGesture}
      handleIndicatorStyle={{ backgroundColor: theme.mutedText, width: 40 }}
      backgroundStyle={{ backgroundColor: theme.surface, borderRadius: 40 }}
    >
      {children}
    </BottomSheetModal>
  );
}
