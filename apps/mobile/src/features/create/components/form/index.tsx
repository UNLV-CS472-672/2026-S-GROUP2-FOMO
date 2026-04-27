import { DatetimeField } from '@/features/create/components/form/datetime/field';
import { DescriptionField } from '@/features/create/components/form/description-field';
import { EventField } from '@/features/create/components/form/event-field';
import { MediaField } from '@/features/create/components/form/media-field';
import { NameField } from '@/features/create/components/form/name-field';
import { TagsField } from '@/features/create/components/form/tags-field';
import type { CreateFormValues, CreateMedia, CreateMode } from '@/features/create/types';
import type { Dispatch, SetStateAction } from 'react';
import { useController, useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import { View } from 'react-native';

type CreateFormProps = {
  control: Control<CreateFormValues>;
  setValue: UseFormSetValue<CreateFormValues>;
  mode: CreateMode;
  /** When false, fields skip validation (both panels stay mounted for the mode swipe). */
  formActive: boolean;
  mediaHeight: number;
  isTagMenuOpen: boolean;
  setIsTagMenuOpen: Dispatch<SetStateAction<boolean>>;
  allTags: { id: string; name: string }[];
  openCamera: () => void;
};

export function CreateForm({
  control,
  setValue,
  mode,
  formActive,
  mediaHeight,
  isTagMenuOpen,
  setIsTagMenuOpen,
  allTags,
  openCamera,
}: CreateFormProps) {
  const mediaFieldName = mode === 'event' ? 'event.media' : 'post.media';
  const media = (useWatch({ control, name: mediaFieldName }) ?? {
    uri: '',
    type: undefined,
  }) as CreateMedia;
  const hasPhoto = !!media.uri && media.type !== 'video';
  const shouldShowMediaSection = mode === 'event' || hasPhoto;

  const {
    fieldState: { error: eventMediaUriError },
  } = useController({
    control,
    name: 'event.media.uri',
    disabled: !formActive || mode !== 'event',
    rules: mode === 'event' ? { required: 'Add a cover image for the event.' } : undefined,
  });

  return (
    <View className="gap-4 pt-1">
      {shouldShowMediaSection ? (
        <MediaField
          mode={mode}
          media={media}
          mediaHeight={mediaHeight}
          openCamera={openCamera}
          clearMedia={() => {
            if (mode === 'event') {
              setValue(
                'event.media',
                { uri: '', type: undefined },
                { shouldDirty: true, shouldValidate: true }
              );
            } else {
              setValue(
                'post.media',
                { uri: '', type: undefined },
                { shouldDirty: true, shouldValidate: true }
              );
            }
          }}
          errorMessage={mode === 'event' ? eventMediaUriError?.message : undefined}
        />
      ) : null}
      {mode === 'event' ? <NameField control={control} formActive={formActive} /> : null}
      {mode === 'event' ? <DatetimeField control={control} formActive={formActive} /> : null}
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
