import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

type ClerkImageInput = {
  uri: string;
  base64?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
};

const MIME_BY_EXT: Record<string, string> = {
  avif: 'image/avif',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function inferMimeType(input: ClerkImageInput): string {
  if (input.mimeType) return input.mimeType;
  const source = input.fileName ?? input.uri;
  const ext = source.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)?.[1]?.toLowerCase();
  return (ext && MIME_BY_EXT[ext]) ?? 'image/jpeg';
}

function inferFileName(input: ClerkImageInput): string {
  if (input.fileName) return input.fileName;
  const segment = input.uri.split('?')[0]?.split('/').pop();
  return segment ?? 'profile-image';
}

// Formats Clerk's API accepts.
const CLERK_SUPPORTED = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

export async function buildClerkImageFile(input: ClerkImageInput) {
  if (Platform.OS !== 'web') {
    let uri = input.uri;
    let type = inferMimeType(input);
    let name = inferFileName(input);

    // NOTE: HEIC/HEIF and other unsupported formats must be transcoded; keep everything else as-is.
    if (!CLERK_SUPPORTED.has(type)) {
      const result = await manipulateAsync(uri, [], { compress: 0.92, format: SaveFormat.JPEG });
      uri = result.uri;
      type = 'image/jpeg';
      name = name.replace(/\.[^.]+$/, '.jpg');
    }

    // NOTE: { uri, type, name } is Clerk RN SDK's accepted format at runtime;
    // cast to File so the shared TS types are satisfied.
    return { uri, type, name } as unknown as File;
  }

  // Web: fetch and wrap in a File so the browser FormData picks up the type.
  const response = await fetch(input.uri);
  if (!response.ok) throw new Error('Failed to fetch profile image');
  const blob = await response.blob();
  const mimeType = blob.type || inferMimeType(input);
  const typed = blob.type === mimeType ? blob : blob.slice(0, blob.size, mimeType);

  if (typeof File !== 'undefined') {
    return new File([typed], inferFileName(input), { type: mimeType });
  }

  if (input.base64) return `data:${mimeType};base64,${input.base64}`;

  throw new Error('Failed to prepare profile image');
}
