import type { CreateFormValues, CreateMode, CreateParams } from '@/features/create/types';
import { getModeParam, getStringParam, toFileUri } from '@/features/create/utils';
import { api } from '@fomo/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';

export function useCreateForm(selectedMode: CreateMode, onMediaReceived: () => void) {
  const params = useLocalSearchParams<CreateParams>();
  const allTags = useQuery(api.tags.getAllTags) ?? [];

  const { control, handleSubmit, setValue } = useForm<CreateFormValues>({
    defaultValues: {
      post: { description: '', tags: [], media: { uri: '', type: undefined }, eventId: undefined },
      event: { description: '', tags: [], media: { uri: '', type: undefined } },
    },
  });

  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);

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

  const onSubmit = handleSubmit((values) => {
    const activeValues = values[selectedMode];
    const normalizedDescription = activeValues.description.trim();
    const normalizedTags = activeValues.tags.join(', ');
    const noun = selectedMode === 'event' ? 'Event' : 'Post';
    Alert.alert(
      `${noun} Data`,
      `Description: ${normalizedDescription || '(none)'}\nTags: ${normalizedTags || '(none)'}`,
      [{ text: 'OK' }]
    );
  });

  return {
    control,
    setValue,
    onSubmit,
    allTags,
    isTagMenuOpen,
    setIsTagMenuOpen,
  };
}
