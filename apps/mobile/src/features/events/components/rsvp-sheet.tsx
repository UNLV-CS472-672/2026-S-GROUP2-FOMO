import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Pressable, Text, View } from 'react-native';

import type { AttendanceStatus, NotificationPref } from '../types';

type RsvpSheetProps = {
  attendance: AttendanceStatus;
  notification: NotificationPref;
  onAttendanceChange: (s: AttendanceStatus) => void;
  onNotificationChange: (n: NotificationPref) => void;
  readOnly?: boolean;
};

const ATTENDANCE_OPTIONS: { value: AttendanceStatus; label: string; icon: string }[] = [
  { value: 'going', label: 'Going', icon: 'checkmark-circle' },
  { value: 'interested', label: 'Interested', icon: 'star' },
  { value: 'uninterested', label: 'Not interested', icon: 'close-circle' },
];

const NOTIF_OPTIONS: { value: NotificationPref; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: 'notifications' },
  { value: 'friends', label: 'Friends only', icon: 'people' },
  { value: 'none', label: 'None', icon: 'notifications-off' },
];

export function RsvpSheet({
  attendance,
  notification,
  onAttendanceChange,
  onNotificationChange,
  readOnly = false,
}: RsvpSheetProps) {
  const theme = useAppTheme();

  return (
    <BottomSheetScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
      <Text className="text-xl font-bold text-foreground">RSVP</Text>
      {readOnly ? (
        <Text className="text-sm text-muted-foreground">
          Guest mode is read-only. Sign in to RSVP or manage notifications.
        </Text>
      ) : null}

      <View className="gap-3">
        <Text className="text-[13px] font-semibold tracking-wide text-muted-foreground">
          ATTENDANCE
        </Text>
        <View className="gap-2">
          {ATTENDANCE_OPTIONS.map((opt) => {
            const selected = attendance === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => onAttendanceChange(selected ? null : opt.value)}
                className="flex-row items-center gap-3 rounded-xl border px-4 py-3"
                disabled={readOnly}
                style={{
                  borderCurve: 'continuous',
                  backgroundColor: selected ? theme.primarySoft : 'transparent',
                  borderColor: selected ? theme.primarySoftBorder : theme.border,
                  opacity: readOnly ? 0.5 : 1,
                }}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={22}
                  color={selected ? theme.primaryText : theme.mutedText}
                />
                <Text
                  className="flex-1 text-base"
                  style={{
                    color: selected ? theme.primaryText : theme.text,
                    fontWeight: selected ? '600' : '400',
                  }}
                >
                  {opt.label}
                </Text>
                {selected && <Ionicons name="checkmark" size={20} color={theme.primaryText} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-3">
        <Text className="text-[13px] font-semibold tracking-wide text-muted-foreground">
          NOTIFICATIONS
        </Text>
        <View className="gap-2">
          {NOTIF_OPTIONS.map((opt) => {
            const selected = notification === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => onNotificationChange(opt.value)}
                className="flex-row items-center gap-3 rounded-xl border px-4 py-3"
                disabled={readOnly}
                style={{
                  borderCurve: 'continuous',
                  backgroundColor: selected ? theme.primarySoft : 'transparent',
                  borderColor: selected ? theme.primarySoftBorder : theme.border,
                  opacity: readOnly ? 0.5 : 1,
                }}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={22}
                  color={selected ? theme.primaryText : theme.mutedText}
                />
                <Text
                  className="flex-1 text-base"
                  style={{
                    color: selected ? theme.primaryText : theme.text,
                    fontWeight: selected ? '600' : '400',
                  }}
                >
                  {opt.label}
                </Text>
                {selected && <Ionicons name="checkmark" size={20} color={theme.primaryText} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </BottomSheetScrollView>
  );
}
