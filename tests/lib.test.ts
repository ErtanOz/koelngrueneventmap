// Ausführen: npm test  (Node >= 22.18 mit eingebautem TypeScript-Stripping, keine zusätzlichen Abhängigkeiten)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { EventsFile, Filters, Item, Venue } from '../src/types.ts';
import { buildItems, filterItems, recommendations, sortItems, EMPTY_FILTERS, normalize } from '../src/lib/eventFilters.ts';
import { addDays, formatTimeRange, monthRange, weekendRange, weekRange, weekdayIndex } from '../src/lib/dateUtils.ts';
import { buildIcs } from '../src/lib/calendarExport.ts';

const events = JSON.parse(readFileSync(new URL('../src/data/events.json', import.meta.url), 'utf8')) as EventsFile;
const geo = JSON.parse(readFileSync(new URL('../src/data/locations.geojson', import.meta.url), 'utf8')) as {
  features: { id: string; properties: Omit<Venue, 'lngLat'>; geometry: { coordinates: [number, number] } | null }[];
};
const venues = new Map<string, Venue>(geo.features.map((f) => [f.id, { ...f.properties, lngLat: f.geometry ? f.geometry.coordinates : null }]));
const items = buildItems(events, venues);
const F = (over: Partial<Filters>): Filters => ({ ...EMPTY_FILTERS, time: { kind: 'all' }, ...over });
const find = (id: string) => items.filter((i) => i.event.id === id);
const run = (f: Partial<Filters>, today = '2026-01-01') => filterItems(items, F(f), today, new Set());

test('Mehrfachtermine bleiben einzeln auffindbar und mit der Veranstaltung verknüpft', () => {
  assert.equal(find('p48-botanische-mittagspause').length, 3);
  assert.equal(find('p128-lebendiges-museum-kreativ').length, 4);
  assert.equal(find('p142-waldweihnacht').length, 2);
  assert.ok(find('p48-botanische-mittagspause').every((i) => i.event.id === 'p48-botanische-mittagspause'));
});

test('Kölner Straßenbäume: Treffpunkt erst nach Anmeldung, kein Kartenmarker', () => {
  const [i] = find('p83-strassenbaeume');
  assert.equal(i.venue, null);
  assert.match(i.event.meetingPoint, /Anmeldung/);
});

test('Radführung über zwei Seiten ist ein Eintrag mit beiden Quellenseiten', () => {
  assert.deepEqual(find('p72-radfuehrung-teil1')[0].event.sourcePages, [72, 73]);
});

test('Suche ignoriert Groß-/Kleinschreibung, Umlaute und ß', () => {
  assert.equal(normalize('Straßenbäume'), 'strassenbaume');
  assert.equal(run({ query: 'STRASSENBÄUME' }).length, 1);
  assert.equal(run({ query: 'straßenbäume' }).length, 1);
  assert.ok(run({ query: 'rodenkirchen finkens' }).length > 5);
  assert.equal(run({ query: 'gibt-es-nicht-xyz' }).length, 0);
});

test('Zeitfilter: Heute, Woche, Wochenende, Monat, laufende Zeiträume', () => {
  const today = '2026-07-11'; // Samstag der Festungstage
  assert.equal(weekdayIndex(today), 5);
  assert.deepEqual(weekendRange(today), ['2026-07-11', '2026-07-12']);
  assert.deepEqual(weekendRange('2026-07-08'), ['2026-07-11', '2026-07-12']);
  assert.deepEqual(weekRange(today), ['2026-07-06', '2026-07-12']);
  assert.deepEqual(monthRange('2026-02'), ['2026-02-01', '2026-02-28']);
  const todayItems = run({ time: { kind: 'today' } }, today);
  assert.ok(todayItems.length >= 9 && todayItems.every((i) => i.occ.date === today || (i.occ.endDate && i.occ.date <= today && today <= i.occ.endDate)));
  assert.ok(run({ time: { kind: 'weekend' } }, '2026-07-08').some((i) => i.event.id.includes('-ft-')));
  assert.ok(run({ time: { kind: 'today' } }, '2026-02-10').some((i) => i.event.id === 'p46-kamelien-ausstellung'));
  assert.ok(!run({ time: { kind: 'today' } }, '2026-04-01').some((i) => i.event.id === 'p46-kamelien-ausstellung'));
  assert.ok(run({ time: { kind: 'month', month: '2026-03' } }).some((i) => i.event.id === 'p46-kamelien-ausstellung'));
});

test('Kommende: vergangene Termine bleiben unter „Alle Termine“ erreichbar', () => {
  const up = run({ time: { kind: 'upcoming' } }, '2026-12-10');
  assert.ok(up.length > 0 && up.length < run({ time: { kind: 'all' } }, '2026-12-10').length);
  assert.equal(run({ time: { kind: 'upcoming' } }, '2027-01-02').length, 0);
});

test('Filter sind kombinierbar', () => {
  const base = run({});
  const free = run({ free: true });
  const freeReg = run({ free: true, registration: true });
  const family = run({ family: true, categories: ['familie'] });
  assert.ok(free.length < base.length && freeReg.length < free.length && freeReg.length > 0);
  assert.ok(family.length > 0 && family.every((i) => i.event.familyFriendly));
  assert.ok(free.every((i) => i.event.cost.free === true));
  assert.ok(run({ venueId: 'flora' }).every((i) => i.venue?.id === 'flora'));
});

test('Sortierung: chronologisch; „in meiner Nähe“ nach Entfernung', () => {
  const sorted = sortItems(run({}), '2026-01-01', null);
  for (let k = 1; k < sorted.length; k++) assert.ok(sorted[k - 1].occ.date <= sorted[k].occ.date);
  const withPos = items.filter((i) => i.venue?.lngLat);
  const nearCenter = sortItems(withPos, '2026-01-01', { lat: 50.9413, lon: 6.9583 });
  const dist = (i: Item) => Math.hypot(i.venue!.lngLat![0] - 6.9583, i.venue!.lngLat![1] - 50.9413);
  assert.ok(dist(nearCenter[0]) <= dist(nearCenter[nearCenter.length - 1]));
});

test('Empfehlungen: höchstens drei, nie dieselbe Veranstaltung, je Veranstaltung nur einmal', () => {
  const cur = find('p47-kamelien-suedostasien')[0];
  const recs = recommendations(cur, items, '2026-01-01');
  assert.ok(recs.length > 0 && recs.length <= 3);
  assert.ok(recs.every((r) => r.event.id !== cur.event.id));
  assert.equal(new Set(recs.map((r) => r.event.id)).size, recs.length);
});

test('Zeitformat', () => {
  assert.equal(formatTimeRange('11:00', null), '11 Uhr');
  assert.equal(formatTimeRange('12:30', '13:00'), '12:30–13 Uhr');
  assert.equal(formatTimeRange('12:00', '16:00', true), '12 Uhr bis ca. 16 Uhr');
  assert.equal(formatTimeRange(null, null), null);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

const unfold = (ics: string) => ics.replace(/\r\n /g, '');
const ics = (item: Item) => buildIcs(item, `https://example.org/?e=${item.key}`, new Date('2026-01-01T00:00:00Z'));

test('ICS: Termin mit Uhrzeit nutzt Europe/Berlin mit VTIMEZONE, CRLF und gefaltete Zeilen', () => {
  const out = ics(find('p47-kamelien-suedostasien')[0]);
  assert.ok(out.startsWith('BEGIN:VCALENDAR\r\n') && out.endsWith('END:VCALENDAR\r\n'));
  const u = unfold(out);
  assert.match(u, /BEGIN:VTIMEZONE\r\nTZID:Europe\/Berlin/);
  assert.match(u, /DTSTART;TZID=Europe\/Berlin:20260208T110000/);
  assert.doesNotMatch(u, /DTEND/); // Endzeit steht nicht im PDF und wird nicht erfunden
  assert.match(u, /UID:p47-kamelien-suedostasien--2026-02-08t1100@/);
  for (const line of out.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75, line);
});

test('ICS: täglich identische Öffnungszeiten werden als Serie exportiert', () => {
  const u = unfold(ics(find('p46-kamelien-ausstellung')[0]));
  assert.match(u, /DTSTART;TZID=Europe\/Berlin:20260115T100000/);
  assert.match(u, /DTEND;TZID=Europe\/Berlin:20260115T160000/);
  assert.match(u, /RRULE:FREQ=DAILY;UNTIL=20260329T140000Z/); // 16:00 MESZ = 14:00 UTC
});

test('ICS: unbekannte Uhrzeit wird ganztägig exportiert, nichts erfunden', () => {
  const u = unfold(ics(find('p81-freiluga-tag-der-offenen-tuer')[0]));
  assert.match(u, /DTSTART;VALUE=DATE:20260613/);
  assert.match(u, /DTEND;VALUE=DATE:20260614/);
  assert.doesNotMatch(u, /VTIMEZONE/);
  assert.match(u, /Uhrzeit im Programm nicht angegeben/);
});

test('ICS: Sonderzeichen werden maskiert', () => {
  assert.match(unfold(ics(find('p50-kamelientage')[0])), /SUMMARY:Kamelientage: Geschichten\\, Beratung und Teeverkostung/);
});
