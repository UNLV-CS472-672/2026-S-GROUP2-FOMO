import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

export type GridPost = {
  id: string;
  title: string;
  subtitle?: string;
};

interface PostGridProps {
  posts: GridPost[];
}

const PostGrid = ({ posts }: PostGridProps) => {
  const router = useRouter();

  const handlePostPress = (post: GridPost) => {
    router.push({
      pathname: '../profile/post-details',
      params: {
        postId: String(post.id),
      },
    });
  };

  const renderItem = ({ item }: { item: GridPost }) => (
    <TouchableOpacity
      onPress={() => handlePostPress(item)}
      className="aspect-square w-1/3 border border-zinc-300 bg-primary/5 p-3"
    >
      <View className="flex-1 justify-between">
        <Text className="text-base font-semibold text-foreground" numberOfLines={3}>
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text className="text-xs text-muted-foreground" numberOfLines={2}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      numColumns={3}
      scrollEnabled={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    />
  );
};
export default PostGrid;
