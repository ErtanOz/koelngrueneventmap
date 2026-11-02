export type CategoryId =
  | 'natur' | 'wald' | 'botanik' | 'fuehrungen' | 'tiere' | 'familie' | 'kultur' | 'sonstige';

export interface Occurrence {
  id: string;
  date: string;
  endDate: string | null;
  daily: boolean;
  startTime: string | null;
  endTime: string | null;
  start: string | null;
  end: string | null;
  approximate: boolean;
  note: string | null;
  weekday: string;
}

export interface Cost {
  free: boolean | null;
  adult: number | null;
  reduced: number | null;
  reducedFor: string | null;
  note: string | null;
}

export interface Registration {
  required: boolean | null;
  deadline: string | null;
  email: string | null;
  phone: string | null;
  url: string | null;
  note: string | null;
}

export interface Contact {
  name: string | null;
  phone: string | null;
  email: string | null;
  web: string | null;
}

export interface Accessibility {
  wheelchair?: 'voll' | 'eingeschraenkt';
  parking?: boolean;
  toilet?: 'voll' | 'eingeschraenkt';
  visualAids?: boolean;
  lift?: 'voll';
  items: string[];
  sourcePage: number;
  basis: string;
}

export interface EventRecord {
  id: string;
  title: string;
  kind: string;
  categories: CategoryId[];
  organizer: string;
  guide: string | null;
  summary: string;
  description: string | null;
  venueId: string | null;
  meetingPoint: string;
  transit: string[];
  cost: Cost;
  registration: Registration;
  contact: Contact | null;
  audience: string[];
  familyFriendly: boolean;
  maxParticipants: number | null;
  duration: string | null;
  notes: string[];
  accessibility: Accessibility | null;
  recurrence: string | null;
  sourcePages: number[];
  occurrences: Occurrence[];
}

export interface EventsFile {
  meta: { title: string; source: string; timezone: string; year: number; categories: Record<CategoryId, string> };
  events: EventRecord[];
}

export type Precision = 'address' | 'poi' | 'stop' | 'junction' | 'street' | 'pdf';

export interface Venue {
  id: string;
  name: string;
  street: string | null;
  postalCode: string | null;
  district: string | null;
  precision: Precision | null;
  coordinateSource: string | null;
  unlocatedReason: string | null;
  sourcePages: number[];
  lngLat: [number, number] | null;
}

/** Ein einzelner Termin samt zugehöriger Veranstaltung und Ort – Grundeinheit von Liste und Karte. */
export interface Item {
  key: string;
  event: EventRecord;
  occ: Occurrence;
  venue: Venue | null;
  searchText: string;
}

export type TimeFilter =
  | { kind: 'upcoming' }
  | { kind: 'all' }
  | { kind: 'today' }
  | { kind: 'week' }
  | { kind: 'weekend' }
  | { kind: 'month'; month: string };

export interface Filters {
  query: string;
  time: TimeFilter;
  categories: CategoryId[];
  free: boolean;
  registration: boolean;
  family: boolean;
  favoritesOnly: boolean;
  venueId: string | null;
}

export interface UserLocation { lat: number; lon: number }
