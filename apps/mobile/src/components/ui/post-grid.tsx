import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Image, TouchableOpacity } from 'react-native';

interface Post {
  id: string | any;
  image: any;
  comments?: string[];
  likes?: number;
}

interface PostGridProps {
  posts: Post[];
  detailPathname?: '/(tabs)/profile/post-details' | '/feed/post-details';
}

const PostGrid = ({ posts, detailPathname = '/(tabs)/profile/post-details' }: PostGridProps) => {
  const router = useRouter();

  const handlePostPress = (post: Post) => {
    router.push({
      pathname: detailPathname,
      params: {
        postId: String(post.id),
        imageSourceId: String(post.image),
      },
    });
  };

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      onPress={() => handlePostPress(item)}
      className="aspect-square w-1/3 items-center justify-center border border-zinc-300"
    >
      <Image source={item.image} className="h-full w-full" />
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
