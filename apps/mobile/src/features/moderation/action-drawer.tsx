import { DrawerModal } from '@/components/ui/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

export type ModerationAction = {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
};

type ActionDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  actions: ModerationAction[];
};

export function ActionDrawer({ open, onClose, title, actions }: ActionDrawerProps) {
  return (
    <DrawerModal
      open={open}
      onClose={onClose}
      snapPoints={['32%']}
      enablePanDownToClose
      backdropAppearsOnIndex={0}
      backdropDisappearsOnIndex={-1}
    >
      <View className="px-6 pb-8 pt-2">
        <Text className="mb-4 text-[17px] font-bold text-foreground">{title}</Text>
        <View className="gap-3">
          {actions.map((action) => (
            <Pressable
              key={action.label}
              className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-4"
              onPress={() => {
                onClose();
                action.onPress();
              }}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons
                  name={action.iconName}
                  size={18}
                  color={action.destructive ? '#dc2626' : '#8a8a8a'}
                />
                <Text
                  className={
                    action.destructive
                      ? 'text-base font-medium text-destructive'
                      : 'text-base font-medium text-foreground'
                  }
                >
                  {action.label}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={action.destructive ? '#dc2626' : '#8a8a8a'}
              />
            </Pressable>
          ))}
        </View>
      </View>
    </DrawerModal>
  );
}
