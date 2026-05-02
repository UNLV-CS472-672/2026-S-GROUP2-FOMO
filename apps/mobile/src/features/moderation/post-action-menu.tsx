import { useState } from 'react';
import { Alert } from 'react-native';

import { ActionDrawer, type ModerationAction } from '@/features/moderation/action-drawer';
import { ActionTrigger } from '@/features/moderation/action-trigger';
import { ReportReasonDrawer } from '@/features/moderation/report-reason-drawer';
import type { FeedPost } from '@/features/posts/types';
import { useUser } from '@/integrations/session/user';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation } from 'convex/react';

type PostActionMenuProps = {
  post: FeedPost;
};

export function PostActionMenu({ post }: PostActionMenuProps) {
  const currentUser = useUser();
  const reportPost = useMutation(api.moderation.report.reportPost);
  const blockUser = useMutation(api.moderation.block.blockUser);
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  if (!currentUser || String(currentUser.id) === String(post.authorId)) {
    return null;
  }

  const canBlock = Boolean(post.authorUsername?.trim());

  const actions: ModerationAction[] = [
    {
      label: 'Report post',
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
        void blockUser({ userId: post.authorId as Id<'users'> })
          .then(() =>
            Alert.alert('User blocked', 'Their content will no longer appear in your feed.')
          )
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
      <ActionTrigger onPress={() => setOpen(true)} accessibilityLabel="Post actions" />
      <ActionDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Post actions"
        actions={actions}
      />
      <ReportReasonDrawer
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report post"
        onSubmit={(reason) => {
          void reportPost({ postId: post.id as Id<'posts'>, reason })
            .then(() =>
              Alert.alert(
                'Report submitted',
                'Thanks. We will review this report, and this post has been removed from your view.'
              )
            )
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
