import type { AttendanceStatus } from '@/features/events/types';
import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

type RsvpButtonProps = {
  attendance: AttendanceStatus;
  disabled?: boolean;
  onPress: () => void;
};

export function RsvpButton({ attendance, disabled = false, onPress }: RsvpButtonProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        attendance === 'going'
          ? 'Going'
          : attendance === 'interested'
            ? 'Interested'
            : attendance === 'uninterested'
              ? 'Not interested'
              : 'RSVP'
      }
      className="h-12 w-12 items-center justify-center rounded-2xl"
      hitSlop={8}
      disabled={disabled}
      style={{
        borderCurve: 'continuous',
        backgroundColor: attendance ? theme.primarySoft : theme.tint,
        borderWidth: attendance ? 1 : 0,
        borderColor: theme.primarySoftBorder,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Ionicons
        name={
          attendance === 'going'
            ? 'checkmark-circle'
            : attendance === 'interested'
              ? 'star'
              : attendance === 'uninterested'
                ? 'close-circle'
                : 'add-circle-outline'
        }
        size={26}
        color={attendance ? theme.primaryText : theme.tintForeground}
      />
    </Pressable>
  );
}
