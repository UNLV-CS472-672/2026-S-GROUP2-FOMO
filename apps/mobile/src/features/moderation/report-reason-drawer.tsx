import { DrawerModal } from '@/components/ui/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

const REASONS = [
  'Spam',
  'Inappropriate content',
  'Harassment or bullying',
  'Hate speech',
  'Violence or threats',
  'Other',
];

type ReportReasonDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (reason: string) => void;
};

export function ReportReasonDrawer({ open, onClose, title, onSubmit }: ReportReasonDrawerProps) {
  return (
    <DrawerModal
      open={open}
      onClose={onClose}
      snapPoints={['58%']}
      enablePanDownToClose
      backdropAppearsOnIndex={0}
      backdropDisappearsOnIndex={-1}
    >
      <View className="px-6 pb-8 pt-2">
        <Text className="mb-4 text-[17px] font-bold text-foreground">{title}</Text>
        <View className="gap-3">
          {REASONS.map((reason) => (
            <Pressable
              key={reason}
              className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-4"
              onPress={() => {
                onSubmit(reason);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel={reason}
            >
              <Text className="text-base font-medium text-foreground">{reason}</Text>
              <Ionicons name="chevron-forward" size={16} color="#8a8a8a" />
            </Pressable>
          ))}
        </View>
      </View>
    </DrawerModal>
  );
}
