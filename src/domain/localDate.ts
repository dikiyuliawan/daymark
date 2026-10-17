export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const ISO_LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isLocalDateKey(value: unknown): value is string {
  return typeof value === "string" && ISO_LOCAL_DATE.test(value);
}

function parseLocalDate(key: string): Date | null {
  const match = ISO_LOCAL_DATE.exec(key);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function formatLocalDate(key: string): string {
  return formatWith(key, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatLocalDateCompact(key: string): string {
  return formatWith(key, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatLocalDateShort(key: string): string {
  return formatWith(key, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatWith(key: string, options: Intl.DateTimeFormatOptions): string {
  const date = parseLocalDate(key);
  if (date === null) {
    return key;
  }
  try {
    return new Intl.DateTimeFormat(undefined, options).format(date);
  } catch {
    return key;
  }
}

export function addDays(key: string, days: number): string {
  const date = parseLocalDate(key);
  if (date === null) {
    return key;
  }
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export function lastNDaysKeys(n: number, from: string = localDateKey()): string[] {
  const keys: string[] = [];
  for (let offset = n - 1; offset >= 0; offset -= 1) {
    keys.push(addDays(from, -offset));
  }
  return keys;
}

export function dateKeyToUtcMs(key: string): number {
  const date = parseLocalDate(key);
  return date === null ? Number.NaN : date.getTime();
}

export function diffDays(a: string, b: string): number {
  const da = dateKeyToUtcMs(a);
  const db = dateKeyToUtcMs(b);
  if (Number.isNaN(da) || Number.isNaN(db)) {
    return Number.NaN;
  }
  return Math.round((da - db) / 86_400_000);
}

export function isBefore(a: string, b: string): boolean {
  return a < b;
}
