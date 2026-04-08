import { Platform, TurboModuleRegistry } from 'react-native';

type ClerkExpoNative = {
  signOut?: () => Promise<void>;
};

type ClerkWithSignOut = {
  signOut: (options?: object) => Promise<void>;
};

/**
 * On native dev builds, Clerk keeps a session in the ClerkExpo TurboModule as well as
 * in JS. `clerk.signOut()` alone can leave native state behind, which breaks the next
 * sign-in (matches the sequence in @clerk/expo's UserButton).
 */
export async function signOutClerkExpo(clerk: ClerkWithSignOut) {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    const native = TurboModuleRegistry.get('ClerkExpo') as ClerkExpoNative | null;
    if (native?.signOut) {
      try {
        await native.signOut();
      } catch {
        // May already be signed out at the native layer
      }
    }
  }

  try {
    await clerk.signOut();
    console.log('Signed out');
  } catch {
    const withReload = clerk as ClerkWithSignOut & {
      __internal_reloadInitialResources?: () => Promise<void>;
    };
    if (typeof withReload.__internal_reloadInitialResources === 'function') {
      try {
        await withReload.__internal_reloadInitialResources();
      } catch {
        // Best-effort recovery; same idea as @clerk/expo UserButton
      }
    }
  }
}
