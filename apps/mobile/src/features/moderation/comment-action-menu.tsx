import { useState } from 'react';
import { Alert } from 'react-native';

import { ActionDrawer, type ModerationAction } from '@/features/moderation/action-drawer';
import { ActionTrigger } from '@/features/moderation/action-trigger';
import { ReportReasonDrawer } from '@/features/moderation/report-reason-drawer';
import type { FeedComment } from '@/features/posts/types';
import { useUser } from '@/integrations/session/user';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation } from 'convex/react';

type CommentActionMenuProps = {
  comment: FeedComment;
  onAfterBlock?: () => void;
};

export function CommentActionMenu({ comment, onAfterBlock }: CommentActionMenuProps) {
  const currentUser = useUser();
  const reportComment = useMutation(api.moderation.report.reportComment);
  const blockUser = useMutation(api.moderation.block.blockUser);
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  if (!currentUser || String(currentUser.id) === String(comment.authorId)) {
    return null;
  }

  const canBlock =
    comment.authorName !== 'Deleted account' && comment.authorName !== 'Unknown user';

  const actions: ModerationAction[] = [
    {
      label: 'Report comment',
      iconName: 'flag-outline',
      onPress: () => setReportOpen(true),
    },
    {
      label: 'Block user',
      iconName: 'ban-outline',
      destructive: true,
      onPress: () => {
        if (!canBlock) {
          Alert.alert('Unable to block user', 'This account is no longer available to block.');
          return;
        }
        void blockUser({ userId: comment.authorId as Id<'users'> })
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
      <ActionTrigger
        onPress={() => setOpen(true)}
        size={14}
        color="#8a8a8a"
        accessibilityLabel="Comment actions"
      />
      <ActionDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Comment actions"
        actions={actions}
      />
      <ReportReasonDrawer
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report comment"
        onSubmit={(reason) => {
          void reportComment({ commentId: comment.id as Id<'comments'>, reason })
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
