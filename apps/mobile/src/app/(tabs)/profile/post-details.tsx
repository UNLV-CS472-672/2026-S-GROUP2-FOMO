import { friends } from '@/app/(tabs)/profile/friends-data';
import { getPostById } from '@/features/posts/post-data';
import { useAppTheme } from '@/lib/use-app-theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Image, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PostDetailsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { postId } = useLocalSearchParams<{ postId?: string | string[] }>();
  const normalizedPostId = Array.isArray(postId) ? postId[0] : postId;
  const friendPost = normalizedPostId
    ? friends.flatMap((friend) => friend.posts.all).find((entry) => entry.id === normalizedPostId)
    : undefined;
  const post = friendPost ?? (normalizedPostId ? getPostById(normalizedPostId) : undefined);

  if (!post) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg text-foreground">No post found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background pt-10">
      <View className="aspect-square w-full bg-surface-muted">
        <Image source={post.image} className="h-full w-full" />
      </View>

      <View className="flex-1 px-4 py-4">
        <Text className="mb-3 text-base font-bold text-foreground">Comments</Text>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 25 }}
        >
          {(post.comments?.length ?? 0) > 0 ? (
            post.comments?.map((comment, index) => (
              <View key={index} className="mb-3 flex-row">
                <View className="mr-3">
                  <MaterialIcons name="person" size={32} color={theme.text} />
                </View>

                <View className="flex-1">
                  <Text className="mb-1 text-sm font-semibold text-foreground">User</Text>
                  <Text className="text-sm text-muted-foreground">{comment}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text className="text-sm text-muted-foreground">No comments yet.</Text>
          )}
        </ScrollView>
      </View>

      <View className="border-t border-border px-4 pb-4">
        <View className="mt-3 flex-row items-center">
          <MaterialIcons name="person" size={20} color={theme.text} />
          <Text className="ml-3 flex-1 text-sm text-muted-foreground">Add a comment</Text>
        </View>
      </View>
    </View>
  );
}
