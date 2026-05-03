import { useState } from 'react';
import { Alert, Pressable } from 'react-native';

import { ActionDrawer, type ModerationAction } from '@/features/moderation/action-drawer';
import { ReportReasonDrawer } from '@/features/moderation/report-reason-drawer';
import { useUser } from '@/integrations/session/user';
import { cn } from '@/lib/utils';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation } from 'convex/react';

type ProfileActionMenuProps = {
  userId: Id<'users'>;
  mutedColor: string;
  onAfterBlock?: () => void;
};

export function ProfileActionMenu({ userId, mutedColor, onAfterBlock }: ProfileActionMenuProps) {
  const currentUser = useUser();
  const reportUser = useMutation(api.moderation.report.reportUser);
  const blockUser = useMutation(api.moderation.block.blockUser);
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  if (!currentUser || String(currentUser.id) === String(userId)) {
    return null;
  }

  const actions: ModerationAction[] = [
    {
      label: 'Report user',
      iconName: 'flag-outline',
      onPress: () => setReportOpen(true),
    },
    {
      label: 'Block user',
      iconName: 'ban-outline',
      destructive: true,
      onPress: () => {
        void blockUser({ userId })
          .then(() => {
            Alert.alert('User blocked', 'Their content will no longer appear in your feed.');
            onAfterBlock?.();
          })
          .catch((error) =>
            Alert.alert(
              'Unable to block user',
              error instanceof Error ? error.message : 'Try again.'
            )
          );
      },
    },
  ];

  return (
    <>
      <Pressable
        accessibilityLabel="Profile actions"
        accessibilityRole="button"
        className={cn('size-12 items-center justify-center rounded-full bg-card shadow-sm')}
        hitSlop={10}
        style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] }]}
        onPress={() => setOpen(true)}
      >
        <MaterialIcons name="more-horiz" size={20} color={mutedColor} />
      </Pressable>
      <ActionDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Profile actions"
        actions={actions}
      />
      <ReportReasonDrawer
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report user"
        onSubmit={(reason) => {
          void reportUser({ userId, reason })
            .then(() => Alert.alert('Report submitted', 'Thanks. We will review this report.'))
            .catch((error) =>
              Alert.alert(
                'Unable to submit report',
                error instanceof Error ? error.message : 'Try again.'
              )
            );
        }}
      />
    </>
  );
}
