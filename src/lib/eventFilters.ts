import type { CategoryId, EventRecord, EventsFile, Filters, Item, TimeFilter, UserLocation, Venue } from '../types';
import { monthRange, overlaps, weekRange, weekendRange } from './dateUtils.ts';

export const CATEGORY_ORDER: CategoryId[] = ['natur', 'wald', 'botanik', 'fuehrungen', 'tiere', 'familie', 'kultur', 'sonstige'];

export const EMPTY_FILTERS: Filters = {
  query: '', time: { kind: 'upcoming' }, categories: [], free: false, registration: false,
  family: false, favoritesOnly: false, venueId: null,
};

/** Für die Suche: klein schreiben, Diakritika und ß vereinheitlichen. */
export function normalize(text: string): string {
  return text.toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function buildItems(data: EventsFile, venues: Map<string, Venue>): Item[] {
  const items: Item[] = [];
  for (const event of data.events) {
    const venue = event.venueId ? venues.get(event.venueId) ?? null : null;
    const searchText = normalize([
      event.title, event.summary, event.description, event.kind, event.organizer, event.guide, event.meetingPoint,
      venue?.name, venue?.district, venue?.street, event.audience.join(' '),
    ].filter(Boolean).join(' '));
    for (const occ of event.occurrences) items.push({ key: occ.id, event, occ, venue, searchText });
  }
  return items;
}

export const lastDay = (i: Item) => i.occ.endDate ?? i.occ.date;
export const isPast = (i: Item, today: string) => lastDay(i) < today;
export const isOngoingRange = (i: Item, today: string) => !!i.occ.endDate && i.occ.date < today && lastDay(i) >= today;

function matchesTime(item: Item, t: TimeFilter, today: string): boolean {
  const from = item.occ.date;
  const to = lastDay(item);
  switch (t.kind) {
    case 'all': return true;
    case 'upcoming': return to >= today;
    case 'today': return from <= today && today <= to;
    case 'week': { const [a, b] = weekRange(today); return overlaps(from, to, a, b); }
    case 'weekend': { const [a, b] = weekendRange(today); return overlaps(from, to, a, b); }
    case 'month': { const [a, b] = monthRange(t.month); return overlaps(from, to, a, b); }
  }
}

export function filterItems(items: Item[], f: Filters, today: string, favorites: ReadonlySet<string>): Item[] {
  const tokens = normalize(f.query).split(/\s+/).filter(Boolean);
  return items.filter((i) => {
    if (f.venueId && i.venue?.id !== f.venueId) return false;
    if (!matchesTime(i, f.time, today)) return false;
    if (f.categories.length && !i.event.categories.some((c) => f.categories.includes(c))) return false;
    if (f.free && i.event.cost.free !== true) return false;
    if (f.registration && i.event.registration.required !== true) return false;
    if (f.family && !i.event.familyFriendly) return false;
    if (f.favoritesOnly && !favorites.has(i.event.id)) return false;
    return tokens.every((t) => i.searchText.includes(t));
  });
}

/** Sortierdatum: laufende Zeiträume (z. B. Ausstellungen) zählen ab „heute“. */
const sortDate = (i: Item, today: string) => (isOngoingRange(i, today) ? today : i.occ.date);

export function sortItems(items: Item[], today: string, near: UserLocation | null): Item[] {
  const dist = new Map<string, number>();
  if (near) for (const i of items) if (i.venue?.lngLat) dist.set(i.key, distanceKm(near, i.venue.lngLat));
  return [...items].sort((a, b) => {
    if (near) {
      const da = dist.get(a.key) ?? Infinity;
      const db = dist.get(b.key) ?? Infinity;
      if (da !== db) return da - db;
    }
    const d = sortDate(a, today).localeCompare(sortDate(b, today));
    if (d) return d;
    const t = (a.occ.startTime ?? '99:99').localeCompare(b.occ.startTime ?? '99:99');
    return t || a.event.title.localeCompare(b.event.title, 'de');
  });
}

export function distanceKm(a: UserLocation, lngLat: [number, number]): number {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(lngLat[1] - a.lat);
  const dLon = rad(lngLat[0] - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(lngLat[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 10) * 100} m`;
  return `${km.toFixed(km < 10 ? 1 : 0).replace('.', ',')} km`;
}

export function activeFilterCount(f: Filters, defaults: Filters): number {
  return (JSON.stringify(f.time) !== JSON.stringify(defaults.time) ? 1 : 0) + f.categories.length + (f.free ? 1 : 0)
    + (f.registration ? 1 : 0) + (f.family ? 1 : 0) + (f.favoritesOnly ? 1 : 0) + (f.venueId ? 1 : 0);
}

/** Bis zu drei ähnliche Veranstaltungen – ausschließlich lokale, nachvollziehbare Regeln:
 *  gleiche Kategorie, gleicher Ort, gleicher Veranstalter, zeitliche Nähe. */
export function recommendations(current: Item, items: Item[], today: string, limit = 3): Item[] {
  const best = new Map<string, { item: Item; score: number }>();
  for (const i of items) {
    if (i.event.id === current.event.id) continue;
    if (isPast(i, today) && !isPast(current, today)) continue;
    let score = 0;
    if (i.event.categories[0] === current.event.categories[0]) score += 3;
    score += i.event.categories.filter((c) => current.event.categories.includes(c)).length;
    if (i.venue && i.venue.id === current.venue?.id) score += 2;
    if (i.event.organizer === current.event.organizer) score += 1;
    const days = Math.abs((Date.parse(i.occ.date) - Date.parse(current.occ.date)) / 86_400_000);
    if (days <= 14) score += 2; else if (days <= 45) score += 1;
    if (score < 4) continue;
    const prev = best.get(i.event.id);
    if (!prev || score > prev.score) best.set(i.event.id, { item: i, score });
  }
  return [...best.values()]
    .sort((a, b) => b.score - a.score || a.item.occ.date.localeCompare(b.item.occ.date))
    .slice(0, limit)
    .map((x) => x.item);
}

export function costLabel(e: EventRecord): string | null {
  const c = e.cost;
  if (c.free === true) return 'Kostenlos';
  if (c.free === false && c.adult != null) return c.reduced != null ? `${c.adult} € / ${c.reduced} €` : `${c.adult} €`;
  return null;
}
