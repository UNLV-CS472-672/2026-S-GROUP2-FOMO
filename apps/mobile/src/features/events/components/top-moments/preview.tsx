import type { TopMediaPost } from '@/features/events/types';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { Text, useWindowDimensions, View } from 'react-native';
import { EventMediaTile } from './card';

type TopMomentsProps = {
  posts: TopMediaPost[];
  eventId: Id<'events'>;
};

const H_PAD = 16;
const COL_GAP = 6;
const ROW_GAP = 6;
const NUM_COLS = 3;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export function TopMoments({ posts, eventId }: TopMomentsProps) {
  const { width } = useWindowDimensions();

  if (posts.length === 0) return null;

  const inner = width - H_PAD * 2;
  const cell = (inner - COL_GAP * (NUM_COLS - 1)) / NUM_COLS;
  const rows = chunk(posts, NUM_COLS);

  return (
    <View className="gap-2 px-4 pt-4">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-[17px] font-bold text-foreground">Top moments</Text>
        <Text className="text-[12px] text-muted-foreground">Most liked</Text>
      </View>

      <View style={{ gap: ROW_GAP }}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row" style={{ gap: COL_GAP }}>
            {row.map((post) => (
              <EventMediaTile key={post.id} post={post} cell={cell} eventId={eventId} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
