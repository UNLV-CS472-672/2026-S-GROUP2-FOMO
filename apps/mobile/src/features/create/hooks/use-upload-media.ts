import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useCallback } from 'react';
import { Image } from 'react-native';

async function getImageSize(uri: string) {
  return await new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
}

async function prepareUpload(uri: string, mimeType: string) {
  if (!mimeType.startsWith('image/') || mimeType === 'image/gif') {
    return { uri, mimeType };
  }

  const { width, height } = await getImageSize(uri);
  const result = await manipulateAsync(uri, [{ resize: { width, height } }], {
    compress: 0.92,
    format: SaveFormat.JPEG,
  });

  return { uri: result.uri, mimeType: 'image/jpeg' };
}

export function useUploadMedia() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const uploadMedia = useCallback(
    async (uri: string, mimeType: string): Promise<Id<'_storage'>> => {
      const prepared = await prepareUpload(uri, mimeType);
      const uploadUrl = await generateUploadUrl();
      const fileResponse = await fetch(prepared.uri);
      const blob = await fileResponse.blob();
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': prepared.mimeType || blob.type || 'image/jpeg' },
        body: blob,
      });
      const { storageId } = (await uploadResponse.json()) as { storageId: Id<'_storage'> };
      return storageId;
    },
    [generateUploadUrl]
  );

  return { uploadMedia };
}
