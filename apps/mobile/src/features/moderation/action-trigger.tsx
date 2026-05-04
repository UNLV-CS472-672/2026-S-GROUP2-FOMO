import { MaterialIcons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

type ActionTriggerProps = {
  onPress: () => void;
  color?: string;
  size?: number;
  accessibilityLabel: string;
};

export function ActionTrigger({
  onPress,
  color = '#8a8a8a',
  size = 18,
  accessibilityLabel,
}: ActionTriggerProps) {
  return (
    <Pressable hitSlop={8} onPress={onPress} accessibilityLabel={accessibilityLabel}>
      <MaterialIcons name="more-horiz" size={size} color={color} />
    </Pressable>
  );
}
