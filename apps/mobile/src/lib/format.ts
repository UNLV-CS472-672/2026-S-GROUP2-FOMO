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
