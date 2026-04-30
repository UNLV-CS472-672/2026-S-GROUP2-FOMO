import { GalleryGrid } from '@/components/gallery/gallery-grid';
import { useCreateContext } from '@/features/create/context';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';

type GalleryParams = {
  mode?: string | string[];
  replaceIndex?: string | string[];
  returnTo?: string | string[];
};

const POST_GALLERY_MEDIA_TYPES: MediaLibrary.MediaTypeValue[] = [
  MediaLibrary.MediaType.photo,
  MediaLibrary.MediaType.video,
];

const EVENT_GALLERY_MEDIA_TYPES: MediaLibrary.MediaTypeValue[] = [MediaLibrary.MediaType.photo];

function getStringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function CreateGalleryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<GalleryParams>();
  const { control, replacePostMedia } = useCreateContext();
  const currentPostMedia = useWatch({ control, name: 'post.media' });

  const mode = useMemo(() => {
    return getStringParam(params.mode) === 'event' ? 'event' : 'post';
  }, [params.mode]);

  const replaceIndex = useMemo(() => getStringParam(params.replaceIndex), [params.replaceIndex]);
  const isReplaceFlow = mode === 'post' && replaceIndex != null && replaceIndex !== '';
  const returnTo = useMemo(() => getStringParam(params.returnTo), [params.returnTo]);

  const mediaTypesForQuery = useMemo(
    () => (mode === 'event' ? EVENT_GALLERY_MEDIA_TYPES : POST_GALLERY_MEDIA_TYPES),
    [mode]
  );

  const handleSelectAsset = (mediaUri: string, mediaType: 'photo' | 'video') => {
    if (isReplaceFlow) {
      const idx = parseInt(replaceIndex!, 10);
      if (!Number.isNaN(idx) && idx >= 0) {
        const next = Array.isArray(currentPostMedia) ? [...currentPostMedia] : [];
        next[idx] = { uri: mediaUri, type: mediaType };
        replacePostMedia(next);
      }
      router.back();
      return;
    }

    router.push({
      pathname: '/create/media-preview',
      params: { mode, mediaUri, mediaType, ...(returnTo ? { returnTo } : {}) },
    });
  };

  return (
    <GalleryGrid
      mediaTypes={mediaTypesForQuery}
      onSelectAsset={handleSelectAsset}
      emptyMessage={
        mode === 'event'
          ? 'No photos found in your gallery.'
          : 'No photos or videos found in your gallery.'
      }
      permissionDescription={
        mode === 'event'
          ? 'Allow access to your photo library so you can pick a cover image from your device.'
          : 'Allow access to your library so you can pick photos and videos from your device.'
      }
    />
  );
}
