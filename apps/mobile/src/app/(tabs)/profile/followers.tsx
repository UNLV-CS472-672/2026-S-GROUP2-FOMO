import { ScrollView, Text } from 'react-native';

export default function FollowersScreen() {
  return (
    <ScrollView
      className="flex-1 bg-app-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ flexGrow: 1, padding: 24, rowGap: 8 }}
    >
      <Text className="text-[30px] font-bold leading-8 text-app-text">Followers List</Text>
      <Text className="text-base leading-6 text-app-text">
        People who follow the user will appear here, with options to view their profiles or remove
        them as followers.
      </Text>
    </ScrollView>
  );
}
