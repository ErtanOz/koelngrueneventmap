import eventsJson from '../data/events.json';
import locationsJson from '../data/locations.geojson?raw';
import type { EventsFile, Item, Venue } from '../types';
import { buildItems } from './eventFilters';

interface GeoFeature {
  id: string;
  properties: Omit<Venue, 'lngLat'>;
  geometry: { type: 'Point'; coordinates: [number, number] } | null;
}

const events = eventsJson as unknown as EventsFile;
const geo = JSON.parse(locationsJson) as { features: GeoFeature[] };

export const venues = new Map<string, Venue>(
  geo.features.map((f) => [f.id, { ...f.properties, lngLat: f.geometry ? f.geometry.coordinates : null }]),
);

export const meta = events.meta;
export const allEvents = events.events;
export const allItems: Item[] = buildItems(events, venues);
export const itemsByKey = new Map(allItems.map((i) => [i.key, i]));

export const PROGRAM_URL = 'https://www.stadt.koeln/leben-in-koeln/freizeit-natur-sport/veranstaltungskalender';

/** Monate (YYYY-MM), in denen Termine liegen – für die Monatsauswahl. */
export const monthsWithEvents: string[] = [...new Set(allItems.flatMap((i) => {
  const out = [i.occ.date.slice(0, 7)];
  if (i.occ.endDate) out.push(i.occ.endDate.slice(0, 7));
  return out;
}))].sort();
