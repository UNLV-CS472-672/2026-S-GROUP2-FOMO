import { takePendingSignupAvatar } from '@/features/auth/utils/pending-signup-avatar';
import { buildClerkImageFile } from '@/features/profile/clerk-image';
import { useUser } from '@clerk/expo';
import { useEffect } from 'react';

export function useUploadPendingAvatar() {
  const { user } = useUser();

  useEffect(() => {
    // console.log('[useUploadPendingAvatar] effect fired, user:', user?.id ?? null);
    if (!user) return;
    const pending = takePendingSignupAvatar();
    // console.log('[useUploadPendingAvatar] pending avatar:', pending);
    if (!pending) return;

    void (async () => {
      try {
        // console.log('[useUploadPendingAvatar] building file for uri:', pending.uri);
        const file = await buildClerkImageFile({ uri: pending.uri, fileName: pending.fileName });
        // console.log('[useUploadPendingAvatar] uploading file:', file);
        await user.setProfileImage({ file });
        // console.log('[useUploadPendingAvatar] upload complete');
      } catch (e) {
        console.error('[useUploadPendingAvatar] upload failed:', e);
      }
    })();
  }, [user]);
}
