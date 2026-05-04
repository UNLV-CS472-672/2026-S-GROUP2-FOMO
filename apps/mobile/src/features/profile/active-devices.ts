export function formatActivityTimestamp(date: Date): string {
  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const dayLabel = isToday
    ? 'Today'
    : yesterday.toDateString() === date.toDateString()
      ? 'Yesterday'
      : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return `${dayLabel} at ${date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

export function deviceIcon(
  isMobile: boolean | undefined
): 'phone-portrait-outline' | 'laptop-outline' {
  return isMobile ? 'phone-portrait-outline' : 'laptop-outline';
}

export function getDeviceLabel(
  deviceType: string | null | undefined,
  isMobile: boolean | undefined
): string {
  if (deviceType?.trim()) return deviceType;
  return isMobile ? 'Mobile device' : 'Desktop device';
}

export function getBrowserLabel(
  browserName: string | null | undefined,
  browserVersion: string | null | undefined
): string | null {
  const name = browserName?.trim();
  if (!name) return null;
  const version = browserVersion?.trim();
  return version ? `${name} ${version}` : name;
}

export function getLocationLabel(
  ipAddress: string | null | undefined,
  city: string | null | undefined,
  country: string | null | undefined
): string | null {
  const ip = ipAddress?.trim();
  const place = [city, country].filter(Boolean).join(', ');
  if (ip && place) return `${ip} (${place})`;
  if (ip) return ip;
  if (place) return place;
  return null;
}
