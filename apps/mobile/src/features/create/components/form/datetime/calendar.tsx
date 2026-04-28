import { Icon } from '@/components/icon';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const ROW_HEIGHT = 40;
const GRID_HEIGHT = 6 * ROW_HEIGHT;

const START_YEAR = 1900;
const END_YEAR = 2200;
const MONTH_COUNT = (END_YEAR - START_YEAR + 1) * 12;
const MONTH_ITEMS = Array.from({ length: MONTH_COUNT }, (_, i) => i);

interface MonthGridProps {
  year: number;
  month: number;
  selectedTs: number;
  today: Date;
  onDayPress: (day: number) => void;
}

const MonthGrid = memo(function MonthGrid({
  year,
  month,
  selectedTs,
  today,
  onDayPress,
}: MonthGridProps) {
  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: (number | null)[] = Array(firstDay).fill(null);

    for (let d = 1; d <= daysInMonth; d++) {
      result.push(d);
    }

    while (result.length < 42) {
      result.push(null);
    }

    return result;
  }, [year, month]);

  const selectedDay = useMemo(() => {
    const d = new Date(selectedTs);

    return d.getFullYear() === year && d.getMonth() === month ? d.getDate() : null;
  }, [selectedTs, year, month]);

  const todayStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime(),
    [today]
  );

  const isPast = (day: number) => new Date(year, month, day).getTime() < todayStart;

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <View style={{ height: GRID_HEIGHT }}>
      {Array.from({ length: 6 }, (_, row) => (
        <View key={row} className="flex-row" style={{ height: ROW_HEIGHT }}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => (
            <View key={col} className="flex-1 items-center justify-center">
              {day ? (
                <Pressable
                  disabled={isPast(day)}
                  onPress={() => onDayPress(day)}
                  className={`size-9 items-center justify-center rounded-full ${
                    day === selectedDay ? 'bg-primary' : ''
                  }`}
                >
                  <Text
                    className={`text-[14px] ${
                      day === selectedDay
                        ? 'font-bold text-primary-foreground'
                        : isPast(day)
                          ? 'text-muted-foreground/40'
                          : isToday(day)
                            ? 'font-semibold text-primary'
                            : 'text-foreground'
                    }`}
                  >
                    {day}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
});

interface CalendarProps {
  viewYear: number;
  viewMonth: number;
  selectedTs: number;
  today: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayPress: (day: number) => void;
}

function toMonthIndex(year: number, month: number) {
  return (year - START_YEAR) * 12 + month;
}

function fromMonthIndex(index: number) {
  const totalMonths = START_YEAR * 12 + index;

  return {
    year: Math.floor(totalMonths / 12),
    month: totalMonths % 12,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function Calendar({
  viewYear,
  viewMonth,
  selectedTs,
  today,
  onPrevMonth,
  onNextMonth,
  onDayPress,
}: CalendarProps) {
  const listRef = useRef<FlatList<number>>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const propIndex = useMemo(
    () => clamp(toMonthIndex(viewYear, viewMonth), 0, MONTH_COUNT - 1),
    [viewYear, viewMonth]
  );

  const [visibleIndex, setVisibleIndex] = useState(propIndex);
  const visibleIndexRef = useRef(propIndex);

  useEffect(() => {
    if (visibleIndexRef.current === propIndex) return;

    visibleIndexRef.current = propIndex;
    setVisibleIndex(propIndex);

    if (containerWidth > 0) {
      listRef.current?.scrollToIndex({
        index: propIndex,
        animated: false,
      });
    }
  }, [containerWidth, propIndex]);

  const visibleDate = useMemo(() => fromMonthIndex(visibleIndex), [visibleIndex]);

  const scrollToMonth = useCallback((delta: number) => {
    const nextIndex = clamp(visibleIndexRef.current + delta, 0, MONTH_COUNT - 1);

    listRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
  }, []);

  const handleMomentumEnd = useCallback(
    (e: any) => {
      if (!containerWidth) return;

      const nextIndex = clamp(
        Math.round(e.nativeEvent.contentOffset.x / containerWidth),
        0,
        MONTH_COUNT - 1
      );

      if (nextIndex === visibleIndexRef.current) return;

      const delta = nextIndex - visibleIndexRef.current;

      visibleIndexRef.current = nextIndex;
      setVisibleIndex(nextIndex);

      if (delta > 0) {
        for (let i = 0; i < delta; i++) {
          onNextMonth();
        }
      } else {
        for (let i = 0; i < Math.abs(delta); i++) {
          onPrevMonth();
        }
      }
    },
    [containerWidth, onNextMonth, onPrevMonth]
  );

  return (
    <View className="px-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable hitSlop={12} onPress={() => scrollToMonth(-1)}>
          <Icon name="keyboard-arrow-left" size={22} className="text-foreground" />
        </Pressable>

        <Text className="text-[15px] font-bold text-foreground">
          {MONTH_NAMES[visibleDate.month]} {visibleDate.year}
        </Text>

        <Pressable hitSlop={12} onPress={() => scrollToMonth(1)}>
          <Icon name="keyboard-arrow-right" size={22} className="text-foreground" />
        </Pressable>
      </View>

      <View className="mb-1 flex-row">
        {DAY_LABELS.map((d, i) => (
          <Text
            key={i}
            className="flex-1 text-center text-[12px] font-semibold text-muted-foreground"
          >
            {d}
          </Text>
        ))}
      </View>

      <View
        style={{ height: GRID_HEIGHT }}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        {containerWidth > 0 && (
          <FlatList
            ref={listRef}
            data={MONTH_ITEMS}
            horizontal
            pagingEnabled
            bounces={false}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            removeClippedSubviews={false}
            initialScrollIndex={propIndex}
            windowSize={3}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            getItemLayout={(_, index) => ({
              length: containerWidth,
              offset: containerWidth * index,
              index,
            })}
            onMomentumScrollEnd={handleMomentumEnd}
            onScrollToIndexFailed={(info) => {
              requestAnimationFrame(() => {
                listRef.current?.scrollToIndex({
                  index: info.index,
                  animated: false,
                });
              });
            }}
            keyExtractor={(item) => item.toString()}
            renderItem={({ item }) => {
              const { year, month } = fromMonthIndex(item);

              return (
                <View style={{ width: containerWidth, height: GRID_HEIGHT }}>
                  <MonthGrid
                    year={year}
                    month={month}
                    selectedTs={selectedTs}
                    today={today}
                    onDayPress={onDayPress}
                  />
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}
