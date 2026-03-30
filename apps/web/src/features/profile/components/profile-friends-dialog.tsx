'use client';

import { FriendsDirectory } from '@/features/profile/components/friends-directory';
import type { SampleSocialProfile } from '@/features/profile/sample-social-data';
import * as Dialog from '@radix-ui/react-dialog';
import { Users, X } from 'lucide-react';

type ProfileFriendsDialogProps = {
  handle: string;
  friends: SampleSocialProfile[];
  recommendedFriends: SampleSocialProfile[];
};

export function ProfileFriendsDialog({
  handle,
  friends,
  recommendedFriends,
}: ProfileFriendsDialogProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="rounded-xl bg-zinc-100 px-3 py-3 text-center transition-colors hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <div className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            {friends.length}
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Friends
          </div>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-[min(88vh,900px)] w-[min(96vw,880px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[2rem] border border-zinc-200 bg-zinc-50 shadow-2xl outline-none dark:border-zinc-800 dark:bg-black">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-5 dark:border-zinc-800 sm:px-6">
            <div className="min-w-0">
              <Dialog.Title className="flex items-center gap-2 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                <Users className="h-5 w-5" />
                Friends
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Explore @{handle}&apos;s friends and recommended connections.
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close friends dialog"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-50"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            <FriendsDirectory friends={friends} recommendedFriends={recommendedFriends} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
