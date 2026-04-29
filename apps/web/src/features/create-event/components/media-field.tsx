import { cn } from '@/lib/utils';
import { ImagePlus, X } from 'lucide-react';
import Image from 'next/image';
import type { ChangeEvent } from 'react';

import { CreateEventField } from './field';

type MediaFieldProps = {
  coverFile: File | null;
  error?: string;
  previewUrl: string;
  onClear: () => void;
  onSelectFile: (file: File | null) => void;
};

export function MediaField({
  coverFile,
  error,
  previewUrl,
  onClear,
  onSelectFile,
}: MediaFieldProps) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSelectFile(event.target.files?.[0] ?? null);
  };

  return (
    <CreateEventField label="Media" error={error}>
      <div
        className={cn(
          'relative flex aspect-[16/10] min-h-64 overflow-hidden rounded-2xl border bg-surface shadow-md',
          error ? 'border-destructive' : 'border-muted'
        )}
      >
        {previewUrl ? (
          <>
            <Image
              src={previewUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 768px, 100vw"
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur transition hover:bg-background"
              aria-label="Remove image"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <label className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 p-6 text-center">
            <ImagePlus className="size-8 text-muted-foreground" aria-hidden="true" />
            <span className="text-[15px] font-semibold text-muted-foreground">Add event cover</span>
            <span className="text-[13px] leading-5 text-muted-foreground">
              Choose a photo for the event
            </span>
            <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
          </label>
        )}
      </div>
      {coverFile?.type.startsWith('image/') === false ? (
        <p className="text-xs text-muted-foreground">Only images are supported for event covers.</p>
      ) : null}
    </CreateEventField>
  );
}
