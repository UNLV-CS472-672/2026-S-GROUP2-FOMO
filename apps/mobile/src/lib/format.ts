const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

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
