import { Pressable, Text, View } from 'react-native';

type StatLabelProps = {
  value: number | string;
  label: string;
  onPress: () => void;
};

export default function StatLabel({ value, label, onPress }: StatLabelProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-lg px-4 py-2"
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      hitSlop={8}
    >
      <View className="items-center">
        <Text className="text-lg font-bold text-foreground">{value}</Text>
        <Text className="text-center text-muted-foreground">{label}</Text>
      </View>
    </Pressable>
  );
}
