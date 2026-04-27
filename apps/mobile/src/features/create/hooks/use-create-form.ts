import { useUploadMedia } from '@/features/create/hooks/use-upload-media';
import type { CreateFormValues, CreateMode } from '@/features/create/types';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { latLngToCell } from 'h3-js';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Alert } from 'react-native';

const H3_RESOLUTION = 9;
/** WGS84 coordinates rounded for storage (~1 cm precision; avoids float noise from GPS). */
const LOCATION_COORDINATE_DECIMALS = 7;

function roundGeographicCoordinate(value: number): number {
  const factor = 10 ** LOCATION_COORDINATE_DECIMALS;
  return Math.round(value * factor) / factor;
}

async function getDeviceLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const latitude = roundGeographicCoordinate(position.coords.latitude);
    const longitude = roundGeographicCoordinate(position.coords.longitude);
    const h3Index = latLngToCell(latitude, longitude, H3_RESOLUTION);
    return { latitude, longitude, h3Index };
  } catch {
    return null;
  }
}

export function useCreateForm(selectedMode: CreateMode) {
  const router = useRouter();
  const allTags = useQuery(api.tags.getAllTags) ?? [];

  const { uploadMedia } = useUploadMedia();
  const createPost = useMutation(api.posts.createPost);
  const createEvent = useMutation(api.events.mutations.createEvent);

  const { control, handleSubmit, setValue, reset } = useForm<CreateFormValues>({
    defaultValues: {
      post: { description: '', tags: [], media: [], eventId: undefined },
      event: {
        name: '',
        description: '',
        tags: [],
        media: { uri: '', type: undefined },
        startDate: (() => {
          const d = new Date();
          d.setHours(20, 0, 0, 0);
          return d.getTime();
        })(),
        endDate: (() => {
          const d = new Date();
          d.setHours(22, 0, 0, 0);
          return d.getTime();
        })(),
      },
    },
  });

  const { append: appendPostMedia, remove: removePostMedia, replace: replacePostMedia } =
    useFieldArray({ control, name: 'post.media' });

  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = handleSubmit(async (values) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const activeValues = values[selectedMode];
      const tagIds = activeValues.tags.flatMap((name) => {
        const found = allTags.find((t) => t.name === name);
        return found ? [found.id as Id<'tags'>] : [];
      });

      let eventId: Id<'events'>;
      if (selectedMode === 'post') {
        const postValues = values.post;
        eventId = postValues.eventId as Id<'events'>;
        const caption = postValues.description.trim() || undefined;

        const mediaItems = Array.isArray(postValues.media) ? postValues.media : [];
        const mediaIds: Id<'_storage'>[] = [];
        for (const item of mediaItems) {
          if (!item?.uri) continue;
          const storageId = await uploadMedia(
            item.uri,
            item.type === 'video' ? 'video/mp4' : 'image/jpeg'
          );
          mediaIds.push(storageId);
        }

        await createPost({ caption, mediaIds, eventId, tagIds });
      } else {
        const eventValues = values.event;
        const location = (await getDeviceLocation()) ?? {
          latitude: 0,
          longitude: 0,
          h3Index: latLngToCell(0, 0, H3_RESOLUTION),
        };
        let storageId: Id<'_storage'> | undefined;
        if (eventValues.media.uri) {
          storageId = await uploadMedia(
            eventValues.media.uri,
            eventValues.media.type === 'video' ? 'video/mp4' : 'image/jpeg'
          );
        }

        eventId = await createEvent({
          name: eventValues.name.trim(),
          caption: eventValues.description.trim(),
          startDate: eventValues.startDate,
          endDate: eventValues.endDate,
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
    appendPostMedia,
    removePostMedia,
    replacePostMedia,
    clearPostMedia: () => replacePostMedia([]),
    onSubmit,
    allTags,
    isTagMenuOpen,
    setIsTagMenuOpen,
    isSubmitting,
  };
}
