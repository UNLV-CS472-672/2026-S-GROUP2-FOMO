// NOTE: Clerk's signup API has no image field — profile images can only be set
// on an existing UserResource. We store the picked URI here before setActive,
// then upload it in RootNavigator once clerk.user is loaded.

let pendingUri: string | null = null;
let pendingFileName: string | null = null;

export function setPendingSignupAvatar(uri: string, fileName?: string | null) {
  pendingUri = uri;
  pendingFileName = fileName ?? null;
}

export function takePendingSignupAvatar() {
  if (!pendingUri) return null;
  const result = { uri: pendingUri, fileName: pendingFileName };
  pendingUri = null;
  pendingFileName = null;
  return result;
}
