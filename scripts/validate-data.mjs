#!/usr/bin/env node
// Validiert src/data/events.json und src/data/locations.geojson vor dem Build.
// Läuft ohne Abhängigkeiten (nur Node). Bei Fehlern: Exit-Code 1.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const events = JSON.parse(readFileSync(join(root, 'src/data/events.json'), 'utf8'));
const geo = JSON.parse(readFileSync(join(root, 'src/data/locations.geojson'), 'utf8'));

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);

const CATEGORIES = Object.keys(events.meta.categories);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BBOX = { minLat: 50.8, maxLat: 51.1, minLon: 6.75, maxLon: 7.2 }; // Raum Köln

// Offset von Europe/Berlin für ein lokales Datum/Zeit (Intl, ohne tz-Datenbank im Repo)
function berlinOffset(date, time) {
  const utcGuess = new Date(`${date}T${time}:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).formatToParts(utcGuess);
  const g = (t) => Number(parts.find((p) => p.type === t).value);
  const asUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'));
  // Differenz zwischen „Berliner Wandzeit zum geratenen UTC-Zeitpunkt“ und UTC-Zeitpunkt
  let diff = Math.round((asUtc - utcGuess.getTime()) / 60000);
  // zweite Iteration um den Zeitpunkt der Umstellung korrekt zu treffen
  const corrected = new Date(utcGuess.getTime() - diff * 60000);
  const p2 = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).formatToParts(corrected);
  const g2 = (t) => Number(p2.find((p) => p.type === t).value);
  diff = Math.round((Date.UTC(g2('year'), g2('month') - 1, g2('day'), g2('hour'), g2('minute')) - corrected.getTime()) / 60000);
  const sign = diff < 0 ? '-' : '+';
  const abs = Math.abs(diff);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

// ---- GeoJSON
const venueIds = new Set();
if (geo.type !== 'FeatureCollection') err('locations.geojson: type muss FeatureCollection sein');
for (const f of geo.features) {
  const id = f.id ?? f.properties?.id;
  if (!id) { err('Feature ohne id'); continue; }
  if (venueIds.has(id)) err(`Ort ${id}: doppelte id`);
  venueIds.add(id);
  if (!f.properties?.name) err(`Ort ${id}: name fehlt`);
  if (f.geometry === null) {
    if (!f.properties.unlocatedReason) err(`Ort ${id}: ohne Geometrie braucht unlocatedReason`);
    continue;
  }
  if (f.geometry?.type !== 'Point') { err(`Ort ${id}: Geometrie muss Point sein`); continue; }
  const [lon, lat] = f.geometry.coordinates;
  if (!(lat >= BBOX.minLat && lat <= BBOX.maxLat && lon >= BBOX.minLon && lon <= BBOX.maxLon)) err(`Ort ${id}: Koordinate (${lat}, ${lon}) liegt nicht im Raum Köln`);
  if (!f.properties.precision) err(`Ort ${id}: precision fehlt`);
  if (!f.properties.coordinateSource) err(`Ort ${id}: coordinateSource fehlt`);
}

// ---- Events
const eventIds = new Set();
const occIds = new Set();
let occCount = 0;
for (const e of events.events) {
  const where = `Event ${e.id}`;
  if (eventIds.has(e.id)) err(`${where}: doppelte id`);
  eventIds.add(e.id);
  if (!/^[a-z0-9-]+$/.test(e.id)) err(`${where}: id enthält ungültige Zeichen`);
  if (!e.title?.trim()) err(`${where}: Titel fehlt`);
  if (!e.summary?.trim()) err(`${where}: Kurzbeschreibung fehlt`);
  if (!e.categories?.length) err(`${where}: keine Kategorie`);
  for (const c of e.categories ?? []) if (!CATEGORIES.includes(c)) err(`${where}: unbekannte Kategorie ${c}`);
  if (e.venueId !== null && !venueIds.has(e.venueId)) err(`${where}: venueId ${e.venueId} nicht in locations.geojson`);
  if (!e.sourcePages?.length) err(`${where}: Quellenseiten fehlen`);
  for (const p of e.sourcePages ?? []) if (!(Number.isInteger(p) && p >= 1 && p <= 148)) err(`${where}: ungültige PDF-Seite ${p}`);
  if (!e.meetingPoint) err(`${where}: Treffpunkt fehlt`);
  for (const k of ['free', 'adult', 'reduced']) if (!(k in e.cost)) err(`${where}: cost.${k} fehlt`);
  if (e.cost.free === false && e.cost.adult == null && !e.cost.note) err(`${where}: kostenpflichtig, aber ohne Preis`);
  const r = e.registration;
  if (!r || !('required' in r)) err(`${where}: registration.required fehlt`);
  if (r?.email && !EMAIL.test(r.email)) err(`${where}: ungültige Anmelde-E-Mail ${r.email}`);
  if (r?.url && !/^https:\/\//.test(r.url)) err(`${where}: Anmelde-URL muss https sein`);
  if (r?.required === true && !(r.email || r.url || r.phone) && !r.note) warnings.push(`${where}: Anmeldung erforderlich, aber kein Meldeweg im PDF`);
  if (e.contact?.email && !EMAIL.test(e.contact.email)) err(`${where}: ungültige Kontakt-E-Mail`);
  if (!e.occurrences?.length) err(`${where}: keine Termine`);
  for (const o of e.occurrences ?? []) {
    occCount++;
    const w = `Termin ${o.id}`;
    if (occIds.has(o.id)) err(`${w}: doppelte id`);
    occIds.add(o.id);
    if (!o.id.startsWith(`${e.id}--`)) err(`${w}: id muss mit Event-id beginnen`);
    if (!ISO_DATE.test(o.date)) err(`${w}: ungültiges Datum`);
    if (o.endDate && (!ISO_DATE.test(o.endDate) || o.endDate < o.date)) err(`${w}: ungültiges Enddatum`);
    if (o.daily && !o.endDate) err(`${w}: daily ohne endDate`);
    for (const k of ['startTime', 'endTime']) if (o[k] !== null && !TIME.test(o[k])) err(`${w}: ${k} ungültig`);
    if (o.endTime && !o.startTime) err(`${w}: endTime ohne startTime`);
    if (o.startTime) {
      const expect = `${o.date}T${o.startTime}${berlinOffset(o.date, o.startTime)}`;
      if (o.start !== expect) err(`${w}: start ${o.start} ≠ erwartet ${expect} (Europe/Berlin)`);
      if (o.endTime) {
        const endExpect = `${o.endDate ?? o.date}T${o.endTime}${berlinOffset(o.endDate ?? o.date, o.endTime)}`;
        if (o.end !== endExpect) err(`${w}: end ${o.end} ≠ erwartet ${endExpect}`);
        if (!o.endDate && o.endTime <= o.startTime) err(`${w}: Ende liegt nicht nach Beginn`);
      }
    } else if (o.start !== null) err(`${w}: start gesetzt, obwohl Uhrzeit unbekannt`);
    const wd = new Date(`${o.date}T12:00:00Z`).getUTCDay();
    const names = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    if (names[wd] !== o.weekday) err(`${w}: Wochentag ${o.weekday} passt nicht zu ${o.date}`);
    if (!o.date.startsWith('2026-')) err(`${w}: Datum liegt nicht in 2026`);
  }
}

console.log(`Daten geprüft: ${events.events.length} Veranstaltungen, ${occCount} Termine, ${geo.features.length} Orte (${geo.features.filter((f) => f.geometry).length} mit Koordinaten).`);
for (const w of warnings) console.warn('Hinweis:', w);
if (errors.length) {
  console.error(`\n${errors.length} Fehler:`);
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}
console.log('Validierung erfolgreich.');
