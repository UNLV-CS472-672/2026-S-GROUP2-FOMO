import { useState } from 'react';
import { Alert } from 'react-native';

import { ActionDrawer, type ModerationAction } from '@/features/moderation/action-drawer';
import { ActionTrigger } from '@/features/moderation/action-trigger';
import { ReportReasonDrawer } from '@/features/moderation/report-reason-drawer';
import { useGuest } from '@/integrations/session/guest';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation } from 'convex/react';

type EventActionMenuProps = {
  eventId: Id<'events'>;
  mutedColor: string;
};

export function EventActionMenu({ eventId, mutedColor }: EventActionMenuProps) {
  const { isGuestMode } = useGuest();
  const reportEvent = useMutation(api.moderation.report.reportEvent);
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  if (isGuestMode) {
    return null;
  }

  const actions: ModerationAction[] = [
    {
      label: 'Report event',
      iconName: 'flag-outline',
      onPress: () => setReportOpen(true),
    },
  ];

  return (
    <>
      <ActionTrigger
        onPress={() => setOpen(true)}
        color={mutedColor}
        accessibilityLabel="Event actions"
      />
      <ActionDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Event actions"
        actions={actions}
      />
      <ReportReasonDrawer
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report event"
        onSubmit={(reason) => {
          void reportEvent({ eventId, reason })
            .then(() => Alert.alert('Report submitted', 'Thanks. We will review this report.'))
            .catch((error) =>
              Alert.alert(
                'Unable to submit report',
                error instanceof Error ? error.message : 'Please try again.'
              )
            );
        }}
      />
    </>
  );
}
