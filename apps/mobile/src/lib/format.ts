const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

export function getDateLabel(ts: number, now: number = Date.now()): string {
  const date = new Date(ts || now);
  date.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000);

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff >= 2 && diff <= 6) return date.toLocaleDateString('en-US', { weekday: 'long' });
  if (diff === 7) return `Next ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatTime(ts: number): string {
  const d = new Date(ts || Date.now());
  const h = d.getHours();
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(d.getMinutes()).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`;
}

export function formatDateTime(ts: number, now: number = Date.now()): string {
  return `${getDateLabel(ts, now)} · ${formatTime(ts)}`;
}

export function formatDateTimeRange(
  startTs: number,
  endTs: number,
  now: number = Date.now()
): string {
  return `${formatDateTime(startTs, now)} — ${formatDateTime(endTs, now)}`;
}

export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const elapsed = Math.max(now - timestamp, 0);

  if (elapsed < HOUR_MS) {
    return `${Math.max(1, Math.floor(elapsed / MINUTE_MS))}m`;
  }

  if (elapsed < DAY_MS) {
    return `${Math.floor(elapsed / HOUR_MS)}h`;
  }

  if (elapsed < WEEK_MS) {
    return `${Math.floor(elapsed / DAY_MS)}d`;
  }

  if (elapsed < YEAR_MS) {
    return `${Math.floor(elapsed / WEEK_MS)}w`;
  }

  return `${Math.floor(elapsed / YEAR_MS)}y`;
}

// NOTE :: mainly to capitalize in js since tailwind/uniwind gives weird cutoff styling
export function formatFilterLabel(label: string) {
  return label
    .split('&')
    .map((segment) =>
      segment
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    )
    .join('&');
}

export function isEventLive(startDate: number, endDate: number, now: number) {
  return startDate <= now && endDate >= now;
}

function isSameDay(timestamp: number, now: Date) {
  const date = new Date(timestamp);

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function getEventTimeLabel(startDate: number, endDate: number, now: number) {
  if (isEventLive(startDate, endDate, now)) {
    return 'Now';
  }

  const startDeltaMinutes = Math.round((startDate - now) / 60000);

  if (startDeltaMinutes > 0 && startDeltaMinutes < 60) {
    return `${startDeltaMinutes} min`;
  }

  const nowDate = new Date(now);

  if (isSameDay(startDate, nowDate)) {
    return new Date(startDate).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(nowDate.getDate() + 1);

  if (isSameDay(startDate, tomorrow)) {
    return 'Tomorrow';
  }

  return new Date(startDate).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}
