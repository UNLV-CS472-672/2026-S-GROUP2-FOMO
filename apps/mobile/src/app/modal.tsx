import { Link } from "@/components/link";
import { Text, View } from "react-native";

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-app-background p-5">
      <Text className="text-[32px] font-bold leading-8 text-app-text">
        This is a modal
      </Text>
      <Link href="/" dismissTo className="mt-[15px] py-[15px]">
        <Text className="text-base leading-[30px] text-[#0a7ea4]">
          Go to home screen
        </Text>
      </Link>
    </View>
  );
}
