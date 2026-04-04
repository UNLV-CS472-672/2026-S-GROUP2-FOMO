'use client';

import type { SampleSocialProfile } from '@/features/profile/sample-social-data';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';

type FriendsDirectoryProps = {
  friends: SampleSocialProfile[];
  recommendedFriends: SampleSocialProfile[];
};

const avatarToneClasses = {
  amber:
    'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200',
  sky: 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/50 dark:bg-sky-500/10 dark:text-sky-200',
  emerald:
    'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-200',
  rose: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-200',
  indigo:
    'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/50 dark:bg-indigo-500/10 dark:text-indigo-200',
  cyan: 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-500/50 dark:bg-cyan-500/10 dark:text-cyan-200',
} as const;

function getAvatarText(username: string) {
  return username
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function FriendRow({ friend, isLast }: { friend: SampleSocialProfile; isLast: boolean }) {
  return (
    <Link
      href={`/profile/${friend.handle}`}
      className={`flex items-center gap-4 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60 ${
        isLast ? '' : 'border-b border-zinc-200 dark:border-zinc-800'
      }`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-semibold ${avatarToneClasses[friend.avatarTone]}`}
      >
        {getAvatarText(friend.username)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-semibold text-zinc-950 dark:text-zinc-50">
          {friend.username}
        </div>
        {friend.realName ? (
          <div className="truncate text-sm text-zinc-500 dark:text-zinc-400">{friend.realName}</div>
        ) : null}
      </div>
    </Link>
  );
}

function FriendSection({
  title,
  subtitle,
  friends,
  action,
}: {
  title: string;
  subtitle?: string;
  friends: SampleSocialProfile[];
  action?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>

      <div className="px-5 sm:px-6">
        {friends.length > 0 ? (
          friends.map((friend, index) => (
            <FriendRow key={friend.handle} friend={friend} isLast={index === friends.length - 1} />
          ))
        ) : (
          <div className="py-4 text-sm text-zinc-500 dark:text-zinc-400">No friends found.</div>
        )}
      </div>
    </section>
  );
}

export function FriendsDirectory({ friends, recommendedFriends }: FriendsDirectoryProps) {
  const [isRecommendedHidden, setIsRecommendedHidden] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const normalizedQuery = searchValue.trim().toLowerCase();

  const filteredRecommendedFriends = useMemo(() => {
    if (!normalizedQuery) {
      return recommendedFriends;
    }

    return recommendedFriends.filter(
      (friend) =>
        friend.username.toLowerCase().includes(normalizedQuery) ||
        friend.realName?.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery, recommendedFriends]);

  const filteredFriends = useMemo(() => {
    if (!normalizedQuery) {
      return friends;
    }

    return friends.filter(
      (friend) =>
        friend.username.toLowerCase().includes(normalizedQuery) ||
        friend.realName?.toLowerCase().includes(normalizedQuery)
    );
  }, [friends, normalizedQuery]);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <input
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search friends"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:bg-zinc-950"
        />
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:px-6">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Recommended Friends
          </h2>
          <button
            type="button"
            onClick={() => setIsRecommendedHidden((current) => !current)}
            className="rounded-full px-3 py-1 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          >
            {isRecommendedHidden ? 'Show' : 'Hide'}
          </button>
        </div>

        {!isRecommendedHidden ? (
          <div className="px-5 sm:px-6">
            {filteredRecommendedFriends.length > 0 ? (
              filteredRecommendedFriends.map((friend, index) => (
                <FriendRow
                  key={friend.handle}
                  friend={friend}
                  isLast={index === filteredRecommendedFriends.length - 1}
                />
              ))
            ) : (
              <div className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
                No recommended friends found.
              </div>
            )}
          </div>
        ) : (
          <div className="px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400 sm:px-6">
            Recommendations are hidden for now.
          </div>
        )}
      </section>

      <FriendSection title="Friends" friends={filteredFriends} />
    </div>
  );
}
