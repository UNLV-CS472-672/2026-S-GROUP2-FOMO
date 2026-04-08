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
  if (__DEV__) {
    console.log('[clerk-sign-out] start', { platform: Platform.OS });
  }

  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    const native = TurboModuleRegistry.get('ClerkExpo') as ClerkExpoNative | null;

    if (__DEV__) {
      console.log('[clerk-sign-out] native module', { available: Boolean(native?.signOut) });
    }

    if (native?.signOut) {
      try {
        await native.signOut();
        if (__DEV__) {
          console.log('[clerk-sign-out] native sign out complete');
        }
      } catch (error) {
        if (__DEV__) {
          console.log('[clerk-sign-out] native sign out skipped', { error });
        }
        // May already be signed out at the native layer
      }
    }
  }

  try {
    await clerk.signOut();
    if (__DEV__) {
      console.log('[clerk-sign-out] clerk sign out complete');
    }
  } catch (error) {
    if (__DEV__) {
      console.log('[clerk-sign-out] clerk sign out failed, trying reload fallback', { error });
    }

    const withReload = clerk as ClerkWithSignOut & {
      __internal_reloadInitialResources?: () => Promise<void>;
    };

    if (typeof withReload.__internal_reloadInitialResources === 'function') {
      try {
        await withReload.__internal_reloadInitialResources();
        if (__DEV__) {
          console.log('[clerk-sign-out] clerk resource reload complete');
        }
      } catch (reloadError) {
        if (__DEV__) {
          console.log('[clerk-sign-out] clerk resource reload failed', { error: reloadError });
        }
        // Best-effort recovery; same idea as @clerk/expo UserButton
      }
    } else if (__DEV__) {
      console.log('[clerk-sign-out] no clerk reload fallback available');
    }
  }

  if (__DEV__) {
    console.log('[clerk-sign-out] end');
  }
}
