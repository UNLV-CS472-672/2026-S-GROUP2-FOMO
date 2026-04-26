import { DrawerModal } from '@/components/ui/drawer';
import { BottomSheetFlatList, BottomSheetFlatListMethods } from '@gorhom/bottom-sheet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Calendar } from './calendar';

type TimeSlot = { label: string; hour: number; minute: number };
const SLOT_H = 45;
const ALL_TIME_SLOTS = makeTimeSlots();

export function formatDateTime(ts: number): string {
  const d = new Date(ts || Date.now());
  const h = d.getHours();
  const hour12 = h % 12 || 12;
  const time = `${hour12}:${String(d.getMinutes()).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`;
  return `${getDateLabel(ts)} · ${time}`;
}

export function getDateLabel(ts: number): string {
  const date = new Date(ts || Date.now());
  date.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000);

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff >= 2 && diff <= 6) return date.toLocaleDateString('en-US', { weekday: 'long' });
  if (diff === 7) return `Next ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function makeTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour12 = h % 12 || 12;
      slots.push({
        label: `${hour12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`,
        hour: h,
        minute: m,
      });
    }
  }
  return slots;
}
function applySlotToTs(ts: number, slot: TimeSlot): number {
  const d = new Date(ts || Date.now());
  d.setHours(slot.hour, slot.minute, 0, 0);
  return d.getTime();
}

function applyDayToTs(year: number, month: number, day: number, ts: number): number {
  const d = new Date(year, month, day);
  const existing = new Date(ts || Date.now());
  d.setHours(existing.getHours(), existing.getMinutes(), 0, 0);
  return d.getTime();
}

export function DateTimePickerSheet({
  open,
  onClose,
  startTs,
  endTs,
  onStartChange,
  onEndChange,
}: {
  open: boolean;
  onClose: () => void;
  startTs: number;
  endTs: number;
  onStartChange: (ts: number) => void;
  onEndChange: (ts: number) => void;
}) {
  const listRef = useRef<BottomSheetFlatListMethods>(null);
  const [editing, setEditing] = useState<'start' | 'end'>('start');
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const tabProgress = useSharedValue(0);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const activeTs = (editing === 'start' ? startTs : endTs) || Date.now();
  const selHour = new Date(activeTs).getHours();
  const selMinute = new Date(activeTs).getMinutes();

  const [viewYear, setViewYear] = useState(() => new Date(activeTs).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date(activeTs).getMonth());

  useEffect(() => {
    if (!open) return;

    setEditing('start');

    const d = new Date(startTs || Date.now());
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [open, startTs]);

  const selectedSlotIndex = useMemo(() => {
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;

    for (let i = 0; i < ALL_TIME_SLOTS.length; i++) {
      const s = ALL_TIME_SLOTS[i];
      const dist = Math.abs(s.hour * 60 + s.minute - (selHour * 60 + selMinute));

      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    return bestIdx;
  }, [selHour, selMinute]);

  const centerList = (idx: number) => {
    listRef.current?.scrollToIndex({
      index: idx,
      animated: false,
      viewPosition: 0.5,
    });
  };

  const handleDrawerOpenComplete = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        centerList(selectedSlotIndex);
      });
    });
  };

  useEffect(() => {
    if (!open) return;

    centerList(selectedSlotIndex);
  }, [open, editing, selectedSlotIndex]);

  const handleTabChange = (tab: 'start' | 'end') => {
    setEditing(tab);
    tabProgress.value = withTiming(tab === 'end' ? 1 : 0, { duration: 200 });

    const d = new Date((tab === 'start' ? startTs : endTs) || Date.now());
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const tabIndicatorStyle = useAnimatedStyle(() => {
    const inset = 6;
    const segmentWidth = tabContainerWidth > 0 ? (tabContainerWidth - inset * 2) / 2 : 0;
    return {
      width: segmentWidth,
      transform: [{ translateX: segmentWidth * tabProgress.value }],
      opacity: segmentWidth > 0 ? 1 : 0,
    };
  }, [tabContainerWidth]);

  const handleDayPress = (day: number) => {
    const newTs = applyDayToTs(viewYear, viewMonth, day, activeTs);

    if (editing === 'start') {
      onStartChange(newTs);
      if (endTs <= newTs) onEndChange(newTs + 2 * 60 * 60 * 1000);
    } else {
      onEndChange(newTs);
    }
  };

  const handleTimePress = (slot: TimeSlot) => {
    const newTs = applySlotToTs(activeTs, slot);

    if (editing === 'start') {
      onStartChange(newTs);
      if (endTs <= newTs) onEndChange(newTs + 2 * 60 * 60 * 1000);
    } else {
      onEndChange(newTs);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const header = (
    <View>
      <View className="flex-row items-center justify-between px-5 py-3.5">
        <View style={{ width: 40 }} />
        <Text className="text-[15px] font-bold text-foreground">Date & Time</Text>
        <Pressable hitSlop={12} onPress={onClose}>
          <Text className="text-[15px] font-semibold text-primary">Done</Text>
        </Pressable>
      </View>

      <View
        className="mx-4 mb-4 flex-row rounded-2xl border border-border bg-surface p-1.5"
        onLayout={(e) => setTabContainerWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View
          pointerEvents="none"
          className="absolute bottom-1.5 left-1.5 top-1.5 rounded-xl bg-primary"
          style={tabIndicatorStyle}
        />
        {(['start', 'end'] as const).map((tab) => {
          const ts = tab === 'start' ? startTs : endTs;
          const active = editing === tab;

          return (
            <Pressable key={tab} onPress={() => handleTabChange(tab)} className="flex-1 px-4 py-3">
              <Text
                className={`text-[11px] font-semibold tracking-wide ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
              >
                {tab === 'start' ? 'START' : 'END'}
              </Text>
              <Text
                className={`mt-0.5 text-[14px] font-semibold ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                numberOfLines={1}
              >
                {formatDateTime(ts)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Calendar
        viewYear={viewYear}
        viewMonth={viewMonth}
        selectedTs={activeTs}
        today={today}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onDayPress={handleDayPress}
      />

      <View className="mt-3 border-t border-muted" />
    </View>
  );

  return (
    <DrawerModal
      open={open}
      onClose={onClose}
      snapPoints={['93%']}
      enablePanDownToClose
      onSheetChange={(index) => {
        if (index === 0) handleDrawerOpenComplete();
      }}
    >
      {header}

      <BottomSheetFlatList
        ref={listRef}
        data={ALL_TIME_SLOTS}
        keyExtractor={(_item: TimeSlot, i: number) => String(i)}
        getItemLayout={(_data: ArrayLike<TimeSlot> | null | undefined, index: number) => ({
          length: SLOT_H,
          offset: index * SLOT_H,
          index,
        })}
        onScrollToIndexFailed={(info: {
          index: number;
          highestMeasuredFrameIndex: number;
          averageItemLength: number;
        }) => {
          listRef.current?.scrollToOffset({
            offset: info.index * SLOT_H,
            animated: false,
          });

          setTimeout(() => {
            centerList(info.index);
          }, 50);
        }}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, marginBottom: 20 }}
        renderItem={({ item: slot }: { item: TimeSlot }) => {
          const isSelected = slot.hour === selHour && slot.minute === selMinute;

          return (
            <Pressable
              onPress={() => handleTimePress(slot)}
              style={{ height: SLOT_H }}
              className={`items-center justify-center ${isSelected ? 'bg-muted/50' : ''}`}
            >
              <Text
                className={`text-[14px] ${
                  isSelected ? 'font-semibold text-foreground' : 'text-muted-foreground'
                }`}
              >
                {slot.label}
              </Text>
            </Pressable>
          );
        }}
      />
    </DrawerModal>
  );
}
