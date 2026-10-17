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

export function formatLocalDate(key: string): string {
  const match = ISO_LOCAL_DATE.exec(key);
  if (!match) {
    return key;
  }
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return key;
  }
}
