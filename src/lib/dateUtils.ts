const TZ = 'Europe/Berlin';
const MONTHS_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const WEEKDAYS_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Heutiges Datum (YYYY-MM-DD) in Europe/Berlin. Im Dev-Modus mit ?today=YYYY-MM-DD überschreibbar. */
export function todayISO(): string {
  if (import.meta.env?.DEV) {
    const o = new URLSearchParams(window.location.search).get('today');
    if (o && /^\d{4}-\d{2}-\d{2}$/.test(o)) return o;
  }
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function parts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

function utc(iso: string): Date {
  const { y, m, d } = parts(iso);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(iso: string, n: number): string {
  const dt = utc(iso);
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** Montag = 0 … Sonntag = 6 */
export function weekdayIndex(iso: string): number {
  return (utc(iso).getUTCDay() + 6) % 7;
}

export function weekRange(today: string): [string, string] {
  const start = addDays(today, -weekdayIndex(today));
  return [start, addDays(start, 6)];
}

/** „Dieses Wochenende“: laufendes Wochenende, sonst das kommende (Samstag/Sonntag). */
export function weekendRange(today: string): [string, string] {
  const w = weekdayIndex(today);
  if (w === 5) return [today, addDays(today, 1)];
  if (w === 6) return [today, today];
  const sat = addDays(today, 5 - w);
  return [sat, addDays(sat, 1)];
}

export function monthRange(month: string): [string, string] {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [`${month}-01`, `${y}-${pad(m)}-${pad(last)}`];
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS_LONG[m - 1]} ${y}`;
}

export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function dayParts(iso: string) {
  const dt = utc(iso);
  return {
    day: dt.getUTCDate(),
    month: MONTHS_SHORT[dt.getUTCMonth()],
    weekday: WEEKDAYS_SHORT[dt.getUTCDay()],
    weekdayLong: WEEKDAYS_LONG[dt.getUTCDay()],
  };
}

export function formatDateLong(iso: string): string {
  const dt = utc(iso);
  return `${WEEKDAYS_LONG[dt.getUTCDay()]}, ${dt.getUTCDate()}. ${MONTHS_LONG[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}

export function formatDateShort(iso: string): string {
  const dt = utc(iso);
  return `${dt.getUTCDate()}. ${MONTHS_SHORT[dt.getUTCMonth()]}`;
}

export function formatDateRange(from: string, to: string): string {
  const a = utc(from);
  const b = utc(to);
  if (a.getUTCFullYear() === b.getUTCFullYear()) {
    return `${a.getUTCDate()}. ${MONTHS_LONG[a.getUTCMonth()]} – ${b.getUTCDate()}. ${MONTHS_LONG[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
  }
  return `${formatDateLong(from)} – ${formatDateLong(to)}`;
}

function hhmm(t: string): string {
  const [h, m] = t.split(':');
  return m === '00' ? `${Number(h)}` : `${Number(h)}:${m}`;
}

/** „11 Uhr“, „11–16 Uhr“, „12:30–13 Uhr“; null wenn unbekannt. */
export function formatTimeRange(start: string | null, end: string | null, approximate = false): string | null {
  if (!start) return null;
  if (!end) return `${hhmm(start)} Uhr`;
  if (approximate) return `${hhmm(start)} Uhr bis ca. ${hhmm(end)} Uhr`;
  return `${hhmm(start)}–${hhmm(end)} Uhr`;
}
