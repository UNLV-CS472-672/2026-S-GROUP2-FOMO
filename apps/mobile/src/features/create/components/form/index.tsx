import { DescriptionField } from '@/features/create/components/form/description-field';
import { MediaField } from '@/features/create/components/form/media-field';
import { TagsField } from '@/features/create/components/form/tags-field';
import type { CreateFormValues, CreateMedia, CreateMode } from '@/features/create/types';
import type { Dispatch, SetStateAction } from 'react';
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import { View } from 'react-native';

type CreateFormProps = {
  control: Control<CreateFormValues>;
  setValue: UseFormSetValue<CreateFormValues>;
  mode: CreateMode;
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

  return (
    <View className="gap-4 pt-1">
      {shouldShowMediaSection ? (
        <MediaField mode={mode} media={media} mediaHeight={mediaHeight} openCamera={openCamera} />
      ) : null}
      <DescriptionField control={control} mode={mode} />
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
