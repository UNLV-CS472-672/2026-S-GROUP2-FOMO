import { ProfileFriendsDialog } from '@/features/profile/components/profile-friends-dialog';
import {
  sampleFriends,
  samplePastEvents,
  sampleRecommendedFriends,
} from '@/features/profile/sample-social-data';
import Image from 'next/image';

type ProfilePageProps = {
  params: Promise<{
    handle: string;
  }>;
};

function formatHandle(handle: string) {
  return handle.replace(/^@+/, '');
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;
  const cleanHandle = formatHandle(handle);

  return (
    <section>
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 text-xl font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
              {cleanHandle.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Profile
              </div>
              <div className="mt-1 truncate text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                @{cleanHandle}
              </div>
              <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Handle-based public identity
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-zinc-100 px-3 py-3 dark:bg-zinc-900">
              <div className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                {samplePastEvents.length}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Events
              </div>
            </div>

            <ProfileFriendsDialog
              handle={cleanHandle}
              friends={sampleFriends}
              recommendedFriends={sampleRecommendedFriends}
            />
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Bio, badges, joined date, and location can live in this column without changing the
            route shape.
          </p>
        </aside>

        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Events</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {samplePastEvents.map((event) => (
              <div
                key={event.title}
                className="overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900"
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={event.imageSrc}
                    alt={event.title}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 320px, 100vw"
                  />
                </div>
                <div className="px-4 py-4 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  {event.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
