'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import { LogOutIcon, MapIcon, MapPinPlusIcon, UserIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from './theme-toggle';

export function UserButton() {
  const { openUserProfile, signOut } = useClerk();
  const { user } = useUser();

  const avatarUrl = user?.imageUrl;
  const handle = user?.username ?? user?.firstName;
  const displayHandle = handle ? `@${handle}` : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative gap-2 px-4 py-6 rounded-3xl hover:bg-coral-400/20"
        >
          <span className="relative size-10 shrink-0 overflow-hidden rounded-full">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayHandle ?? 'User avatar'}
                width={40}
                height={40}
                className="size-full rounded-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center bg-muted text-sm font-medium text-muted-foreground">
                {handle?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </span>
          {displayHandle && (
            <span className="min-w-0 max-w-20 truncate text-sm font-medium text-primary/70">
              {displayHandle}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5">
          {displayHandle && (
            <span className="text-sm font-medium text-foreground">{displayHandle}</span>
          )}
          {user?.fullName && (
            <span className="text-xs font-normal text-muted-foreground truncate">
              {user.fullName}
            </span>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/map" className="cursor-pointer">
              <MapIcon />
              Map
            </Link>
          </DropdownMenuItem>

          {user?.username && (
            <DropdownMenuItem asChild>
              <Link href={`/u/${user.username}`} className="cursor-pointer">
                <UserIcon />
                Profile
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild>
            <Link href="/post" className="cursor-pointer">
              <MapPinPlusIcon />
              Post
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer" onSelect={() => openUserProfile()}>
          <UserIcon />
          Manage account
        </DropdownMenuItem>

        <div className="px-3 py-2">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Theme</p>
          <ThemeToggle />
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onSelect={() => void signOut()}
        >
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
