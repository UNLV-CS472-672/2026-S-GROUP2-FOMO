import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type Post = {
  image: any;
  comments?: string[];
};

export default function PostDetailScreen() {
  const router = useRouter();
  const { post: postJson } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#fbbf24' : '#f59e0b';

  let post: Post | null = null;
  if (postJson && typeof postJson === 'string') {
    try {
      post = JSON.parse(postJson) as Post;
    } catch {
      post = null;
    }
  }

  if (!post) {
    return (
      <ScrollView className="flex-1 bg-background pt-12">
        <View className="flex-1 items-center justify-center">
          <Text className="text-foreground">Post not found</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background pt-10">
      <View className="flex-row items-center border-b border-border px-4 py-4">
        <TouchableOpacity onPress={() => router.back()} className="-ml-2 p-2">
          <MaterialIcons name="chevron-left" size={24} color={iconColor} />
        </TouchableOpacity>

        <Text className="flex-1 text-center text-lg font-bold text-foreground">Post</Text>

        <View className="w-10" />
      </View>

      <View className="aspect-square w-full bg-muted">
        <Image source={post.image} className="h-full w-full" />
      </View>

      <View className="px-4 py-4">
        <Text className="mb-3 text-base font-bold text-foreground">Comments</Text>

        {post.comments && post.comments.length > 0 ? (
          post.comments.map((comment, index) => (
            <View key={index} className="mb-3 flex-row">
              <View className="mr-3">
                <MaterialIcons name="person" size={32} color={iconColor} />
              </View>

              <View className="flex-1">
                <Text className="mb-1 text-sm font-semibold text-foreground">User {index + 1}</Text>
                <Text className="text-sm text-muted-foreground">{comment}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text className="py-5 text-center text-sm text-muted-foreground">No comments yet</Text>
        )}
      </View>

      <View className="border-t border-border px-4 pb-5">
        <View className="mt-3 flex-row items-center">
          <MaterialIcons name="person" size={32} color={iconColor} />
          <Text className="ml-3 flex-1 text-sm text-muted-foreground">Add a comment...</Text>
        </View>
      </View>
    </ScrollView>
  );
}
