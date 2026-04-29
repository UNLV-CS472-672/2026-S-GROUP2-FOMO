import { GalleryGrid } from '@/components/gallery/gallery-grid';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';

const PHOTO_ONLY: MediaLibrary.MediaTypeValue[] = [MediaLibrary.MediaType.photo];

export default function ProfileGalleryPickerScreen() {
  const router = useRouter();

  const handleSelectAsset = (uri: string) => {
    router.dismissTo({
      pathname: '/profile/edit',
      params: {
        avatarUri: uri,
        avatarNonce: String(Date.now()),
      },
    });
  };

  return (
    <GalleryGrid
      mediaTypes={PHOTO_ONLY}
      onSelectAsset={handleSelectAsset}
      emptyMessage="No photos found in your gallery."
      permissionDescription="Allow access to your photo library so you can pick a profile photo from your device."
    />
  );
}
