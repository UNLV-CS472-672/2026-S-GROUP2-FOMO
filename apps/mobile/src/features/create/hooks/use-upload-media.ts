import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation } from 'convex/react';

export function useUploadMedia() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  async function uploadMedia(uri: string, mimeType: string): Promise<Id<'_storage'>> {
    const uploadUrl = await generateUploadUrl();
    const fileResponse = await fetch(uri);
    const blob = await fileResponse.blob();
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': mimeType || blob.type || 'image/jpeg' },
      body: blob,
    });
    const { storageId } = (await uploadResponse.json()) as { storageId: Id<'_storage'> };
    return storageId;
  }

  return { uploadMedia };
}
