import { ScrollView, Text } from 'react-native';

export default function SettingsScreen() {
  return (
    <ScrollView
      className="flex-1 bg-app-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="grow p-6 gap-2"
    >
      <Text className="text-[30px] font-bold leading-8 text-app-text">Settings</Text>
      <Text className="text-base leading-6 text-app-text">
        Notification, privacy, and account preferences go here.
      </Text>
    </ScrollView>
  );
}
