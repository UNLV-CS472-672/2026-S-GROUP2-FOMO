import { FriendsDirectory } from '@/features/profile/components/friends-directory';
import { sampleFriends, sampleRecommendedFriends } from '@/features/profile/sample-social-data';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type ProfileFriendsPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

function formatHandle(handle: string) {
  return handle.replace(/^@+/, '');
}

export default async function ProfileFriendsPage({ params }: ProfileFriendsPageProps) {
  const { handle } = await params;
  const cleanHandle = formatHandle(handle);

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <Link
        href={`/profile/${cleanHandle}`}
        aria-label={`Back to @${cleanHandle}`}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-50"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <FriendsDirectory friends={sampleFriends} recommendedFriends={sampleRecommendedFriends} />
    </section>
  );
}
