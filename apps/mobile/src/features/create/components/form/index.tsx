import { DatetimeField } from '@/features/create/components/form/datetime/field';
import { DescriptionField } from '@/features/create/components/form/description-field';
import { EventField } from '@/features/create/components/form/event-field';
import { LocationField } from '@/features/create/components/form/location-field';
import { MediaField } from '@/features/create/components/form/media-field';
import { NameField } from '@/features/create/components/form/name-field';
import { TagsField } from '@/features/create/components/form/tags-field';
import { useCreateContext } from '@/features/create/context';
import type { CreateMediaItem, CreateMode } from '@/features/create/types';
import { useCallback } from 'react';
import { useController, useWatch } from 'react-hook-form';
import { View } from 'react-native';

export function CreateForm({
  mode,
  openManagePostMedia,
}: {
  mode: CreateMode;
  openManagePostMedia?: () => void;
}) {
  const {
    control,
    setValue,
    removePostMedia,
    clearPostMedia,
    isEventMode,
    mediaHeight,
    isTagMenuOpen,
    setIsTagMenuOpen,
    allTags,
    openCamera,
    getCurrentLocation,
  } = useCreateContext();

  const formActive = mode === 'event' ? isEventMode : !isEventMode;
  const eventMedia = useWatch({ control, name: 'event.media' }) as CreateMediaItem | undefined;
  const postMedia = useWatch({ control, name: 'post.media' }) as CreateMediaItem[] | undefined;
  const shouldShowMediaSection =
    mode === 'event' || (mode === 'post' && (postMedia?.length ?? 0) > 0);

  const {
    fieldState: { error: eventMediaUriError },
  } = useController({
    control,
    name: 'event.media.uri',
    disabled: !formActive || mode !== 'event',
    rules: mode === 'event' ? { required: 'Add a cover image for the event.' } : undefined,
  });

  const clearMedia = useCallback(() => {
    if (mode === 'event') {
      setValue(
        'event.media',
        { uri: '', type: undefined },
        { shouldDirty: true, shouldValidate: true }
      );
    } else {
      clearPostMedia();
    }
  }, [mode, setValue, clearPostMedia]);

  const removePostMediaAtIndex = useCallback(
    (index: number) => removePostMedia(index),
    [removePostMedia]
  );

  return (
    <View className="gap-4 pt-1">
      {shouldShowMediaSection ? (
        <MediaField
          mode={mode}
          media={
            mode === 'event' ? (eventMedia ?? { uri: '', type: undefined }) : (postMedia ?? [])
          }
          mediaHeight={mediaHeight}
          openCamera={openCamera}
          openManage={mode === 'post' ? openManagePostMedia : undefined}
          clearMedia={clearMedia}
          removePostMediaAtIndex={mode === 'post' ? removePostMediaAtIndex : undefined}
          errorMessage={mode === 'event' ? eventMediaUriError?.message : undefined}
        />
      ) : null}
      {mode === 'event' ? <NameField control={control} formActive={formActive} /> : null}
      {mode === 'event' ? <DatetimeField control={control} formActive={formActive} /> : null}
      {mode === 'event' ? (
        <LocationField
          control={control}
          setValue={setValue}
          formActive={formActive}
          getCurrentLocation={getCurrentLocation}
        />
      ) : null}
      {mode === 'post' ? (
        <EventField control={control} setValue={setValue} formActive={formActive} />
      ) : null}
      <DescriptionField control={control} mode={mode} formActive={formActive} />
      <TagsField
        control={control}
        setValue={setValue}
        mode={mode}
        isTagMenuOpen={isTagMenuOpen}
        setIsTagMenuOpen={setIsTagMenuOpen}
        allTags={allTags}
      />
    </View>
  );
}
