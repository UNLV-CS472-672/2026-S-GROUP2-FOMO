'use client';

import { Button } from '@/components/ui/button';
import { openDirections } from '@/features/map/utils/directions';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { api } from '@fomo/backend/convex/_generated/api';
import * as Dialog from '@radix-ui/react-dialog';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import {
  Bell,
  BellOff,
  CalendarDays,
  Check,
  CheckCircle2,
  Heart,
  ImageIcon,
  MessageCircle,
  Navigation,
  PlusCircle,
  Star,
  UserRound,
  Users,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

type Events = NonNullable<FunctionReturnType<typeof api.events.queries.getEvents>>;
type MapEvent = Events[number];
type EventFeed = NonNullable<FunctionReturnType<typeof api.events.queries.getEventFeed>>;
type EventFeedPost = EventFeed[number];
type TopMediaPosts = NonNullable<FunctionReturnType<typeof api.events.queries.getTopMediaPosts>>;
type TopMediaPost = TopMediaPosts[number];
type ViewerAttendance = FunctionReturnType<typeof api.events.attendance.getViewerAttendance>;
type AttendanceStatus = NonNullable<ViewerAttendance>['attendance'];
type NotificationPref = NonNullable<ViewerAttendance>['notification'];

type MapEventFeedPanelProps = {
  event: MapEvent | null;
  onClose: () => void;
};

const AVATAR_TONES = [
  'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200',
];

const ATTENDANCE_OPTIONS: {
  value: Exclude<AttendanceStatus, null>;
  label: string;
  Icon: LucideIcon;
}[] = [
  { value: 'going', label: 'Going', Icon: CheckCircle2 },
  { value: 'interested', label: 'Interested', Icon: Star },
  { value: 'uninterested', label: 'Not interested', Icon: XCircle },
];

const NOTIFICATION_OPTIONS: {
  value: NotificationPref;
  label: string;
  Icon: LucideIcon;
}[] = [
  { value: 'all', label: 'All', Icon: Bell },
  { value: 'friends', label: 'Friends only', Icon: UserRound },
  { value: 'none', label: 'None', Icon: BellOff },
];

export function MapEventFeedPanel({ event, onClose }: MapEventFeedPanelProps) {
  const isMobile = useIsMobile();
  const topMediaPosts = useQuery(
    api.events.queries.getTopMediaPosts,
    event ? { eventId: event.id } : 'skip'
  );
  const feedPosts = useQuery(
    api.events.queries.getEventFeed,
    event ? { eventId: event.id } : 'skip'
  );
  const attendees = useQuery(
    api.events.attendance.getEventAttendees,
    event ? { eventId: event.id } : 'skip'
  );
  const viewerAttendance = useQuery(
    api.events.attendance.getViewerAttendance,
    event ? { eventId: event.id } : 'skip'
  );
  const eventImage = useQuery(
    api.files.getFile,
    event?.mediaId ? { storageId: event.mediaId } : 'skip'
  );
  const togglePostLike = useMutation(api.likes.togglePostLike);
  const setViewerAttendance = useMutation(api.events.attendance.setViewerAttendance);
  const ensureCurrentUser = useMutation(api.auth.ensureCurrentUser);
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  if (!event) {
    return null;
  }

  const content = (
    <EventFeedContent
      event={event}
      eventImageUrl={eventImage?.url ?? null}
      topMediaPosts={topMediaPosts}
      feedPosts={feedPosts}
      attendees={attendees}
      viewerAttendance={viewerAttendance}
      canMutate={isAuthenticated}
      authLoading={authLoading}
      onClose={onClose}
      onChangeRsvp={async (attendance, notification) => {
        if (!isAuthenticated) {
          return;
        }

        await ensureCurrentUser({});
        await setViewerAttendance({
          eventId: event.id,
          attendance,
          notification,
        });
      }}
      onToggleLike={async (post) => {
        if (!isAuthenticated) {
          return;
        }

        try {
          await ensureCurrentUser({});
          await togglePostLike({ postId: post.id });
        } catch (error) {
          console.error('Failed to toggle event feed post like', error);
        }
      }}
    />
  );

  if (isMobile) {
    return (
      <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[92svh] overflow-hidden rounded-t-[1.75rem] border border-border bg-background shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full">
            <Dialog.Title className="sr-only">{event.name}</Dialog.Title>
            <div className="flex justify-center pt-2">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/35" />
            </div>
            {content}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <aside className="fixed bottom-0 right-0 top-[var(--header-height,0px)] z-30 hidden w-[min(28rem,calc(100vw-2rem))] border-l border-border bg-background shadow-2xl md:flex">
      {content}
    </aside>
  );
}

type EventFeedContentProps = {
  event: MapEvent;
  eventImageUrl: string | null;
  topMediaPosts: TopMediaPosts | undefined;
  feedPosts: EventFeed | undefined;
  attendees:
    | NonNullable<FunctionReturnType<typeof api.events.attendance.getEventAttendees>>
    | undefined;
  viewerAttendance: ViewerAttendance | undefined;
  canMutate: boolean;
  authLoading: boolean;
  onClose: () => void;
  onChangeRsvp: (attendance: AttendanceStatus, notification: NotificationPref) => Promise<void>;
  onToggleLike: (post: EventFeedPost) => Promise<void>;
};

function EventFeedContent({
  event,
  eventImageUrl,
  topMediaPosts,
  feedPosts,
  attendees,
  viewerAttendance,
  canMutate,
  authLoading,
  onClose,
  onChangeRsvp,
  onToggleLike,
}: EventFeedContentProps) {
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [optimisticRsvp, setOptimisticRsvp] = useState<{
    eventId: string;
    attendance: AttendanceStatus;
    notification: NotificationPref;
  } | null>(null);
  const queriedAttendance = viewerAttendance?.attendance ?? null;
  const queriedNotification = viewerAttendance?.notification ?? 'all';
  const optimisticForEvent = optimisticRsvp?.eventId === event.id ? optimisticRsvp : null;
  const attendance = optimisticForEvent?.attendance ?? queriedAttendance;
  const notification = optimisticForEvent?.notification ?? queriedNotification;

  const handleAttendanceChange = (nextAttendance: AttendanceStatus) => {
    setOptimisticRsvp({ eventId: event.id, attendance: nextAttendance, notification });
    void onChangeRsvp(nextAttendance, notification).catch((error) => {
      console.error('Failed to update map event attendance', error);
      setOptimisticRsvp(null);
    });
  };

  const handleNotificationChange = (nextNotification: NotificationPref) => {
    setOptimisticRsvp({ eventId: event.id, attendance, notification: nextNotification });
    void onChangeRsvp(attendance, nextNotification).catch((error) => {
      console.error('Failed to update map RSVP notification preference', error);
      setOptimisticRsvp(null);
    });
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Close" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
        <h2 className="min-w-0 flex-1 truncate px-3 text-center text-sm font-semibold">
          {event.name}
        </h2>
        <div className="h-7 w-7" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        <section className="flex gap-3.5 p-4">
          <EventPoster event={event} imageUrl={eventImageUrl} />
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <h3 className="line-clamp-2 text-lg font-bold leading-tight">{event.name}</h3>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="truncate">
                  {formatEventDateRange(event.startDate, event.endDate)}
                </span>
              </p>
              <p className="mt-2 line-clamp-4 text-sm leading-5 text-foreground/90">
                {event.caption}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2.5">
              <AvatarStack attendees={attendees} attendeeCount={event.attendeeCount} />
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="size-12 rounded-2xl border-primary/70 text-primary hover:bg-primary/10 hover:text-primary"
                  aria-label="Get directions"
                  onClick={() => openDirections(event.location.latitude, event.location.longitude)}
                >
                  <Navigation className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  className={cn(
                    'size-12 rounded-2xl',
                    attendance
                      ? 'border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                  aria-label={canMutate ? (attendance ? 'Update RSVP' : 'RSVP') : 'Sign in to RSVP'}
                  disabled={authLoading || !canMutate || viewerAttendance === undefined}
                  onClick={() => setRsvpOpen(true)}
                >
                  {attendance === 'going' ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : attendance === 'interested' ? (
                    <Star className="h-6 w-6 fill-current" />
                  ) : attendance === 'uninterested' ? (
                    <XCircle className="h-6 w-6" />
                  ) : (
                    <PlusCircle className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <RsvpDialog
          open={rsvpOpen}
          attendance={attendance}
          notification={notification}
          readOnly={!canMutate}
          onOpenChange={setRsvpOpen}
          onAttendanceChange={handleAttendanceChange}
          onNotificationChange={handleNotificationChange}
        />

        {event.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 px-4">
            {event.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <section className="px-4 pt-4">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-[17px] font-bold">Top moments</h3>
            <span className="text-[12px] text-muted-foreground">Most liked</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {topMediaPosts === undefined ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="aspect-square rounded-xl bg-muted" />
              ))
            ) : topMediaPosts.length > 0 ? (
              topMediaPosts.slice(0, 3).map((post) => <TopMomentTile key={post.id} post={post} />)
            ) : (
              <EmptyMediaTile label="No media yet" />
            )}
          </div>
        </section>

        <section className="px-4 pt-4">
          <h3 className="mb-3 text-[17px] font-bold">Feed</h3>
          <div className="space-y-3">
            {feedPosts === undefined ? (
              Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="h-32 rounded-2xl border border-border bg-muted/35" />
              ))
            ) : feedPosts.length > 0 ? (
              feedPosts.map((post) => (
                <FeedPostCard
                  key={post.id}
                  post={post}
                  canMutate={canMutate}
                  onToggleLike={() => onToggleLike(post)}
                />
              ))
            ) : (
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                No one has posted from this event yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function RsvpDialog({
  open,
  attendance,
  notification,
  readOnly,
  onOpenChange,
  onAttendanceChange,
  onNotificationChange,
}: {
  open: boolean;
  attendance: AttendanceStatus;
  notification: NotificationPref;
  readOnly: boolean;
  onOpenChange: (open: boolean) => void;
  onAttendanceChange: (attendance: AttendanceStatus) => void;
  onNotificationChange: (notification: NotificationPref) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/35 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-[70] max-h-[85svh] overflow-y-auto rounded-t-[1.75rem] border border-border bg-background px-6 pb-8 pt-4 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full md:left-1/2 md:right-auto md:top-1/2 md:bottom-auto md:w-[24rem] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:pb-6 md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=open]:slide-in-from-bottom-0">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-muted-foreground/35 md:hidden" />
          <Dialog.Title className="text-xl font-bold">RSVP</Dialog.Title>
          {readOnly ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to RSVP or manage notifications.
            </p>
          ) : null}

          <section className="mt-6">
            <h3 className="text-[13px] font-semibold tracking-wide text-muted-foreground">
              ATTENDANCE
            </h3>
            <div className="mt-3 space-y-2">
              {ATTENDANCE_OPTIONS.map(({ value, label, Icon }) => {
                const selected = attendance === value;

                return (
                  <Button
                    key={value}
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-14 w-full justify-start gap-3 rounded-xl px-4 text-base font-normal',
                      selected &&
                        'border-primary/30 bg-primary/10 font-semibold text-primary hover:bg-primary/15 hover:text-primary'
                    )}
                    disabled={readOnly}
                    onClick={() => onAttendanceChange(selected ? null : value)}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        selected && value === 'interested' && 'fill-current'
                      )}
                    />
                    <span className="min-w-0 flex-1 text-left">{label}</span>
                    {selected ? <Check className="h-5 w-5" /> : null}
                  </Button>
                );
              })}
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-[13px] font-semibold tracking-wide text-muted-foreground">
              NOTIFICATIONS
            </h3>
            <div className="mt-3 space-y-2">
              {NOTIFICATION_OPTIONS.map(({ value, label, Icon }) => {
                const selected = notification === value;

                return (
                  <Button
                    key={value}
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-14 w-full justify-start gap-3 rounded-xl px-4 text-base font-normal',
                      selected &&
                        'border-primary/30 bg-primary/10 font-semibold text-primary hover:bg-primary/15 hover:text-primary'
                    )}
                    disabled={readOnly}
                    onClick={() => onNotificationChange(value)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="min-w-0 flex-1 text-left">{label}</span>
                    {selected ? <Check className="h-5 w-5" /> : null}
                  </Button>
                );
              })}
            </div>
          </section>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EventPoster({ event, imageUrl }: { event: MapEvent; imageUrl: string | null }) {
  return (
    <div className="relative h-44 w-[8.75rem] shrink-0 overflow-hidden rounded-2xl border border-border bg-muted">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={event.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-primary/10 px-3 text-center text-3xl font-black uppercase text-primary">
          {event.name.slice(0, 2)}
        </div>
      )}
      <div className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">
        {event.attendeeCount} going
      </div>
    </div>
  );
}

function AvatarStack({
  attendees,
  attendeeCount,
}: {
  attendees:
    | NonNullable<FunctionReturnType<typeof api.events.attendance.getEventAttendees>>
    | undefined;
  attendeeCount: number;
}) {
  const visibleAttendees = attendees?.slice(0, 3) ?? [];

  return (
    <div className="flex min-w-0 items-center">
      {visibleAttendees.map((attendee, index) => (
        <Avatar
          key={attendee.id}
          name={attendee.name}
          imageUrl={attendee.avatarUrl}
          className={cn(index > 0 && '-ml-2')}
          toneIndex={index}
        />
      ))}
      {attendeeCount > visibleAttendees.length ? (
        <div
          className={cn(
            'flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-background bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground',
            visibleAttendees.length > 0 && '-ml-2'
          )}
        >
          +{attendeeCount - visibleAttendees.length}
        </div>
      ) : visibleAttendees.length === 0 ? (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {attendeeCount} going
        </div>
      ) : null}
    </div>
  );
}

function Avatar({
  name,
  imageUrl,
  className,
  toneIndex = 0,
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
  toneIndex?: number;
}) {
  return (
    <div
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-background text-xs font-bold',
        AVATAR_TONES[toneIndex % AVATAR_TONES.length],
        className
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}

function TopMomentTile({ post }: { post: TopMediaPost }) {
  const mediaId = post.mediaIds[0];
  const file = useQuery(api.files.getFile, mediaId ? { storageId: mediaId } : 'skip');

  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
      <MediaPreview url={file?.url ?? null} isVideo={file?.isVideo ?? false} alt={post.caption} />
      <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white">
        <Heart className={cn('h-3 w-3', post.liked && 'fill-rose-500 text-rose-500')} />
        {post.likeCount}
      </div>
    </div>
  );
}

function EmptyMediaTile({ label }: { label: string }) {
  return (
    <div className="col-span-3 flex aspect-[3/1] items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
      <ImageIcon className="h-4 w-4" />
      {label}
    </div>
  );
}

function FeedPostCard({
  post,
  canMutate,
  onToggleLike,
}: {
  post: EventFeedPost;
  canMutate: boolean;
  onToggleLike: () => void;
}) {
  return (
    <article className="rounded-2xl border border-muted bg-surface p-3.5 shadow-xl">
      <header className="flex items-center gap-2.5">
        <Avatar name={post.authorName} imageUrl={post.authorAvatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {post.authorUsername ? `@${post.authorUsername}` : post.authorName}
          </p>
          <p className="text-xs text-muted-foreground">{formatRelativeTime(post.creationTime)}</p>
        </div>
      </header>

      {post.caption ? <p className="mt-2 text-sm leading-5">{post.caption}</p> : null}

      {post.mediaIds.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {post.mediaIds.slice(0, 4).map((mediaId, index) => (
            <FeedMediaTile
              key={mediaId}
              mediaId={mediaId}
              className={cn(post.mediaIds.length === 1 && 'col-span-2 aspect-[4/3]')}
              overlayLabel={
                index === 3 && post.mediaIds.length > 4 ? `+${post.mediaIds.length - 4}` : undefined
              }
            />
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="-ml-2 h-auto px-2 py-1 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          onClick={onToggleLike}
          aria-label={canMutate ? (post.liked ? 'Unlike post' : 'Like post') : 'Sign in to like'}
          disabled={!canMutate}
        >
          <Heart className={cn('h-4 w-4', post.liked && 'fill-rose-500 text-rose-500')} />
          <span>{post.likes}</span>
        </Button>
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="h-4 w-4" />
          {post.commentCount}
        </span>
      </div>
    </article>
  );
}

function FeedMediaTile({
  mediaId,
  className,
  overlayLabel,
}: {
  mediaId: EventFeedPost['mediaIds'][number];
  className?: string;
  overlayLabel?: string;
}) {
  const file = useQuery(api.files.getFile, { storageId: mediaId });

  return (
    <div className={cn('relative aspect-square overflow-hidden rounded-xl bg-muted', className)}>
      <MediaPreview url={file?.url ?? null} isVideo={file?.isVideo ?? false} alt="" />
      {overlayLabel ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white">
          {overlayLabel}
        </div>
      ) : null}
    </div>
  );
}

function MediaPreview({
  url,
  isVideo,
  alt,
}: {
  url: string | null;
  isVideo: boolean;
  alt: string;
}) {
  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
        <ImageIcon className="h-5 w-5" />
      </div>
    );
  }

  if (isVideo) {
    return <video src={url} className="h-full w-full object-cover" muted playsInline />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className="h-full w-full object-cover" />
  );
}

function formatEventDateRange(startDate: number, endDate: number) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const date = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const startTime = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const endTime = end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return `${date} ${startTime} - ${endTime}`;
}

function formatRelativeTime(timestamp: number, now: number = Date.now()) {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const year = 365 * day;
  const elapsed = Math.max(now - timestamp, 0);

  if (elapsed < hour) {
    return `${Math.max(1, Math.floor(elapsed / minute))}m`;
  }

  if (elapsed < day) {
    return `${Math.floor(elapsed / hour)}h`;
  }

  if (elapsed < week) {
    return `${Math.floor(elapsed / day)}d`;
  }

  if (elapsed < year) {
    return `${Math.floor(elapsed / week)}w`;
  }

  return `${Math.floor(elapsed / year)}y`;
}
