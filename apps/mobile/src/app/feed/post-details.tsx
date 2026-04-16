import { getPostById } from '@/features/posts/post-data';
import { useAppTheme } from '@/lib/use-app-theme';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FeedPostDetailsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { postId, imageSourceId } = useLocalSearchParams<{
    postId?: string | string[];
    imageSourceId?: string | string[];
  }>();

  const normalizedPostId = Array.isArray(postId) ? postId[0] : postId;
  const normalizedImageSourceId = Array.isArray(imageSourceId) ? imageSourceId[0] : imageSourceId;

  const dataPost = normalizedPostId ? getPostById(normalizedPostId) : undefined;
  const fallbackImageSource = normalizedImageSourceId ? Number(normalizedImageSourceId) : NaN;
  const post =
    dataPost ??
    (Number.isFinite(fallbackImageSource)
      ? {
          id: normalizedPostId ?? 'event-post',
          image: fallbackImageSource,
          comments: [],
          likes: 0,
        }
      : undefined);

  if (!post) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-lg text-foreground">No post found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background pt-10">
      <Stack.Screen options={{ headerShown: false }} />

      <TouchableOpacity
        className="mb-2 ml-4 mt-3 flex-row items-center gap-1 self-start"
        activeOpacity={0.7}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <MaterialIcons name="arrow-back" size={22} color={theme.tint} />
        <Text className="text-sm font-medium text-primary">Back</Text>
      </TouchableOpacity>

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
