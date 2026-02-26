import { ScrollView, Text } from 'react-native';

export default function CreatePostScreen() {
  return (
    <ScrollView
      className="flex-1 bg-app-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        rowGap: 8,
      }}
    >
      <Text className="text-[30px] font-bold leading-8 text-app-text">Create Post</Text>
      <Text className="text-center text-base leading-6 text-app-text">
        Post composer form goes here.
      </Text>
    </ScrollView>
  );
}
