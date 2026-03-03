import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

export default function FriendsScreen() {
  const router = useRouter();

  return (
    <ScrollView
      className="flex-1 bg-app-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 110, rowGap: 8 }}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => (router.canGoBack() ? router.back() : router.push('/profile'))}
        style={{
          alignSelf: 'flex-start',
          width: 44,
          height: 44,
          justifyContent: 'center',
          marginTop: -60,
        }}
      >
        <MaterialIcons name="arrow-back" size={30} color="#ff8420" />
      </TouchableOpacity>
      <Text className="text-[30px] font-bold leading-8 text-app-text">Friends</Text>
      <Text className="text-base leading-6 text-app-text">
        Friends list, requests, and suggestions will appear here.
      </Text>
    </ScrollView>
  );
}
