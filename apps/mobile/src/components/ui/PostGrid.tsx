import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';

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
      pathname: '../screens/PostDetailScreen',
      params: { postId: post.id, post: JSON.stringify(post) },
    });
  };

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity onPress={() => handlePostPress(item)} style={styles.gridItem}>
      <Image source={item.image} style={styles.gridImage} />
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      numColumns={3}
      scrollEnabled={false}
      contentContainerStyle={styles.grid}
    />
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
  },
  gridItem: {
    width: '33.333%',
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

export default PostGrid;
