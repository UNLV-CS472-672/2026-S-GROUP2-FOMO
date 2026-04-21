import { Button, ButtonText } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useGuest } from '@/integrations/session/provider';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';

type PostParams = {
  mediaUri?: string | string[];
  mediaType?: string | string[];
};

function getStringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toFileUri(uri: string) {
  if (uri.startsWith('file://')) return uri;
  return `file://${uri}`;
}

export default function CreatePostScreen() {
  const params = useLocalSearchParams<PostParams>();
  const { isGuestMode } = useGuest();
  const tabBarHeight = useBottomTabBarHeight();
  const [imageAspectRatio, setImageAspectRatio] = useState(4 / 3);
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const mediaUriParam = getStringParam(params.mediaUri);
  const mediaTypeParam = getStringParam(params.mediaType);
  const mediaUri = mediaUriParam ? toFileUri(mediaUriParam) : '';
  const hasPhoto = !!mediaUri && mediaTypeParam !== 'video';

  const onPostPress = () => {
    const normalizedDescription = description.trim();
    const normalizedTags = tagsInput.trim();

    Alert.alert(
      'Post Data',
      `Description: ${normalizedDescription || '(none)'}\nTags: ${normalizedTags || '(none)'}`,
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/create'),
        },
      ]
    );
  };

  if (isGuestMode) {
    return <Redirect href="/create" />;
  }

  return (
    <Screen className="flex-1">
      <ScrollView
        className="flex-1 bg-background pt-20"
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
        overScrollMode="always"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-4 px-4"
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      >
        <Text className="text-2xl font-bold text-foreground">Create Post</Text>

        <View
          className={`overflow-hidden rounded-xl border border-border bg-background ${hasPhoto ? 'w-full' : 'h-56'}`}
          style={hasPhoto ? { aspectRatio: imageAspectRatio } : undefined}
        >
          {hasPhoto ? (
            <Image
              source={{ uri: mediaUri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              onLoad={(event) => {
                const width = event.source.width;
                const height = event.source.height;
                if (width > 0 && height > 0) {
                  setImageAspectRatio(width / height);
                }
              }}
            />
          ) : (
            <View className="flex-1 items-center justify-center p-3">
              <Text className="text-center text-base font-semibold text-muted-foreground">
                Captured image
              </Text>
            </View>
          )}
        </View>

        <View className="rounded-xl border border-border bg-background px-4 py-3">
          <TextInput
            placeholder="Add description"
            placeholderTextColor="#8B8B8B"
            multiline
            textAlignVertical="top"
            className="min-h-28 text-base text-foreground"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View className="rounded-xl border border-border bg-background px-4 py-3">
          <TextInput
            placeholder="Add tags"
            placeholderTextColor="#8B8B8B"
            className="text-base text-foreground"
            value={tagsInput}
            onChangeText={setTagsInput}
          />
        </View>
      </ScrollView>

      <Button
        onPress={onPostPress}
        style={{
          position: 'absolute',
          bottom: tabBarHeight + 20,
          right: 16,
        }}
        className="rounded-full"
      >
        <ButtonText>Post</ButtonText>
      </Button>
    </Screen>
  );
}
