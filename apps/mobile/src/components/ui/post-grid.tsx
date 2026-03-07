import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Image, TouchableOpacity } from 'react-native';

interface Post {
  id: string | number;
  image: any;
  comments?: string[];
}

interface PostGridProps {
  posts: Post[];
}

const PostGrid = ({ posts }: PostGridProps) => {
  const router = useRouter();

  const handlePostPress = (post: Post) => {
    router.push({
      pathname: '/profile/post-details',
      params: { postId: post.id, post: JSON.stringify(post) },
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
      contentContainerClassName="flex-row"
    />
  );
};

export default PostGrid;
