export function toDatetimeLocalValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function getDefaultStartDate() {
  const date = new Date();
  date.setHours(20, 0, 0, 0);
  return toDatetimeLocalValue(date);
}

export function getDefaultEndDate() {
  const date = new Date();
  date.setHours(22, 0, 0, 0);
  return toDatetimeLocalValue(date);
}
