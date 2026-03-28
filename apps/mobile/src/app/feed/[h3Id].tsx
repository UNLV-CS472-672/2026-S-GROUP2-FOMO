import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, LayoutChangeEvent, TouchableOpacity, View } from 'react-native';
import Billboard from './billboard';

interface Ad {
  id: string | number;
  image: any;
  description: string;
  posts: Array<{ id: string | number; image: any }>;
}

interface BillboardItem {
  id: string | number;
  image: any;
  size: { width: number; height: number };
  style?: {
    width?: number;
    height?: number;
    position?: string;
    top?: number;
    left?: number;
  };
  ad: Ad;
}

export default function FeedModal() {
  const { h3Id } = useLocalSearchParams<{ h3Id: string }>(); //stores the hash value for the respective hexagon on the map
  const router = useRouter();
  const resolvedH3Id = Array.isArray(h3Id) ? h3Id[0] : h3Id;

  const samplePosts = [
    { id: 'p1', image: require('@/assets/images/rigrig.jpg') },
    { id: 'p2', image: require('@/assets/images/jonah-mog.png') },
    { id: 'p3', image: require('@/assets/images/git-learning-class.png') },
    { id: 'p4', image: require('@/assets/images/rate-my-date.jpg') },
  ];

  const baseItems: BillboardItem[] = [
    {
      id: 'small',
      image: require('@/assets/images/rigrig.jpg'),
      size: { width: 80, height: 80 },
      ad: {
        id: 'small',
        image: require('@/assets/images/rigrig.jpg'),
        description: 'Small ad description',
        posts: samplePosts,
      },
    },
    {
      id: 'medium',
      image: require('@/assets/images/jonah-mog.png'),
      size: { width: 120, height: 100 },
      ad: {
        id: 'medium',
        image: require('@/assets/images/jonah-mog.png'),
        description: 'Medium ad description',
        posts: samplePosts,
      },
    },
    {
      id: 'large',
      image: require('@/assets/images/rate-my-date.jpg'),
      size: { width: 160, height: 140 },
      ad: {
        id: 'large',
        image: require('@/assets/images/rate-my-date.jpg'),
        description: 'Large ad description',
        posts: samplePosts,
      },
    },
    {
      id: 'large2',
      image: require('@/assets/images/git-learning-class.png'),
      size: { width: 160, height: 140 },
      ad: {
        id: 'large2',
        image: require('@/assets/images/git-learning-class.png'),
        description: 'Another large ad description',
        posts: samplePosts,
      },
    },
  ];

  const [placedItems, setPlacedItems] = useState<BillboardItem[]>([]);
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });

  useFocusEffect(
    useCallback(() => {
      setPlacedItems([]);
      // trigger the placement effect by updating layoutSize reference
      setLayoutSize((ls) => ({ ...ls }));
      return () => {};
    }, [])
  );

  useEffect(() => {
    if (layoutSize.width === 0 || layoutSize.height === 0) return;

    const placed: BillboardItem[] = [];

    const intersects = (
      a: { left: number; top: number; right: number; bottom: number },
      b: { left: number; top: number; right: number; bottom: number }
    ) => !(a.left >= b.right || a.right <= b.left || a.top >= b.bottom || a.bottom <= b.top);

    for (const item of baseItems) {
      let attempts = 0;
      let placedSuccessfully = false;

      while (attempts < 500 && !placedSuccessfully) {
        attempts++;
        const left = Math.floor(Math.random() * Math.max(1, layoutSize.width - item.size.width));
        const top = Math.floor(Math.random() * Math.max(1, layoutSize.height - item.size.height));

        const rect = {
          left,
          top,
          right: left + item.size.width,
          bottom: top + item.size.height,
        };

        let collision = false;
        for (const p of placed) {
          const pRect = {
            left: p.style!.left!,
            top: p.style!.top!,
            right: p.style!.left! + p.size.width,
            bottom: p.style!.top! + p.size.height,
          };
          if (intersects(rect, pRect)) {
            collision = true;
            break;
          }
        }

        if (!collision) {
          placed.push({
            ...item,
            style: {
              width: item.size.width,
              height: item.size.height,
              position: 'absolute',
              top,
              left,
            },
          });
          placedSuccessfully = true;
        }
      }

      if (!placedSuccessfully) {
        // fallback stacking
        const left = 8;
        const top = 8 + placed.length * (item.size.height + 8);
        placed.push({
          ...item,
          style: {
            width: item.size.width,
            height: item.size.height,
            position: 'absolute',
            top,
            left,
          },
        });
      }
    }

    setPlacedItems(placed);
  }, [layoutSize]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== layoutSize.width || height !== layoutSize.height)
      setLayoutSize({ width, height });
  };

  return (
    <View className="flex-1 bg-app-background" onLayout={onLayout}>
      <Stack.Screen options={{ title: 'Feed' }} />
      <Billboard>
        <View className="flex-1">
          {placedItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={item.style as any}
              onPress={() =>
                router.push({
                  pathname: './event-details',
                  params: {
                    ad: JSON.stringify(item.ad),
                    h3Id: resolvedH3Id ?? '',
                  },
                })
              }
            >
              <Image source={item.image} className="h-full w-full" />
            </TouchableOpacity>
          ))}
        </View>
      </Billboard>
    </View>
  );
}
