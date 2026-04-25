import { useUploadMedia } from '@/features/create/hooks/use-upload-media';
import type { CreateFormValues, CreateMode, CreateParams } from '@/features/create/types';
import { getModeParam, getStringParam, toFileUri } from '@/features/create/utils';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { latLngToCell } from 'h3-js';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';

const H3_RESOLUTION = 9;

async function getDeviceLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = position.coords;
    const h3Index = latLngToCell(latitude, longitude, H3_RESOLUTION);
    return { latitude, longitude, h3Index };
  } catch {
    return null;
  }
}

export function useCreateForm(selectedMode: CreateMode, onMediaReceived: () => void) {
  const params = useLocalSearchParams<CreateParams>();
  const router = useRouter();
  const allTags = useQuery(api.tags.getAllTags) ?? [];

  const { uploadMedia } = useUploadMedia();
  const createPost = useMutation(api.posts.createPost);
  const createEvent = useMutation(api.events.mutations.createEvent);

  const { control, handleSubmit, setValue, reset } = useForm<CreateFormValues>({
    defaultValues: {
      post: { description: '', tags: [], media: { uri: '', type: undefined }, eventId: undefined },
      event: { name: '', description: '', tags: [], media: { uri: '', type: undefined } },
    },
  });

  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaUriParam = getStringParam(params.mediaUri);
  const mediaTypeParam = getStringParam(params.mediaType);
  const incomingMode = getModeParam(params.mode);

  useEffect(() => {
    if (!mediaUriParam) return;
    setValue(
      incomingMode === 'event' ? 'event.media' : 'post.media',
      { uri: toFileUri(mediaUriParam), type: mediaTypeParam },
      { shouldDirty: true }
    );
    onMediaReceived();
  }, [incomingMode, mediaTypeParam, mediaUriParam, onMediaReceived, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const activeValues = values[selectedMode];
      const tagIds = activeValues.tags.flatMap((name) => {
        const found = allTags.find((t) => t.name === name);
        return found ? [found.id as Id<'tags'>] : [];
      });

      let storageId: Id<'_storage'> | undefined;
      if (activeValues.media.uri) {
        storageId = await uploadMedia(
          activeValues.media.uri,
          activeValues.media.type === 'video' ? 'video/mp4' : 'image/jpeg'
        );
      }

      let eventId: Id<'events'>;
      if (selectedMode === 'post') {
        const postValues = values.post;
        eventId = postValues.eventId as Id<'events'>;
        const caption = postValues.description.trim() || undefined;
        await createPost({
          caption,
          mediaIds: storageId ? [storageId] : [],
          eventId,
          tagIds,
        });
      } else {
        const eventValues = values.event;
        const now = Date.now();
        const location = (await getDeviceLocation()) ?? {
          latitude: 0,
          longitude: 0,
          h3Index: latLngToCell(0, 0, H3_RESOLUTION),
        };
        eventId = await createEvent({
          name: eventValues.name.trim(),
          caption: eventValues.description.trim(),
          startDate: now,
          endDate: now + 3 * 60 * 60 * 1000,
          location,
          mediaId: storageId,
          tagIds,
        });
      }

      reset();
      router.replace(`/(tabs)/(map)/event/${eventId}`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Something went wrong.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    control,
    setValue,
    onSubmit,
    allTags,
    isTagMenuOpen,
    setIsTagMenuOpen,
    isSubmitting,
  };
}
