#!/usr/bin/env node
// Erzeugt DATA_QUALITY.md aus src/data/events.json, src/data/locations.geojson und scripts/extract-report.json.
// So bleiben alle Zahlen im Bericht mit den ausgelieferten Daten identisch.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const data = read('src/data/events.json');
const geo = read('src/data/locations.geojson');
const report = read('scripts/extract-report.json');

const events = data.events;
const venues = new Map(geo.features.map((f) => [f.id, f]));
const occs = events.flatMap((e) => e.occurrences.map((o) => ({ e, o })));
const rule = events.filter((e) => e.recurrence);
const program = events.filter((e) => !e.recurrence);
const cats = data.meta.categories;
const catCount = Object.fromEntries(Object.keys(cats).map((c) => [c, events.filter((e) => e.categories.includes(c)).length]));
const title = (e) => `${e.title} (S. ${e.sourcePages.join(', ')})`;
const list = (arr, fmt = title) => (arr.length ? arr.map((x) => `- ${fmt(x)}`).join('\n') : '- keine');

const noMarker = events.filter((e) => !e.venueId || !venues.get(e.venueId)?.geometry);
const approxVenues = geo.features.filter((f) => f.geometry && ['stop', 'junction', 'street'].includes(f.properties.precision));
const precision = {};
for (const f of geo.features) if (f.geometry) precision[f.properties.precision] = (precision[f.properties.precision] ?? 0) + 1;
const noTime = occs.filter(({ o }) => !o.startTime);
const approxTime = occs.filter(({ o }) => o.approximate && o.startTime);
const costUnknown = events.filter((e) => e.cost.free === null);
const regUnknown = events.filter((e) => e.registration.required === null);
const regNoRoute = events.filter((e) => e.registration.required === true && !(e.registration.email || e.registration.url || e.registration.phone));
const accessKnown = events.filter((e) => e.accessibility);
const noDesc = events.filter((e) => !e.description);

const md = `# Datenqualität

Automatisch erzeugt mit \`node scripts/data-report.mjs\` aus den ausgelieferten Daten (Stand der Extraktion: siehe \`scripts/extract-report.json\`).

Quelle: ${data.meta.source}

## Umfang

| Kennzahl | Wert |
| --- | --- |
| Veranstaltungen (übergeordnete Einträge) | **${events.length}** |
| – davon Einzeleinträge aus dem Veranstaltungsprogramm (S. 46–146) | ${program.length} |
| – davon wiederkehrende Angebote aus den allgemeinen Informationen (S. 12, 19, 43) | ${rule.length} |
| Einzeltermine (jeder Termin einzeln auffindbar) | **${occs.length}** |
| – davon aus Wiederholungsregeln berechnet | ${rule.reduce((s, e) => s + e.occurrences.length, 0)} |
| – davon tägliche Zeiträume (Ausstellungen) | ${occs.filter(({ o }) => o.daily).length} |
| Veranstaltungsorte | ${geo.features.length} (${geo.features.filter((f) => f.geometry).length} mit Koordinaten, ${geo.features.filter((f) => !f.geometry).length} ohne) |
| Veranstaltungen mit Kartenmarker | ${events.length - noMarker.length} |
| Veranstaltungen ohne Kartenmarker (nur Liste) | ${noMarker.length} |
| Veranstaltungen mit Barrierefreiheits-Piktogramm | ${accessKnown.length} |
| Automatische Prüfwarnungen der Extraktion | ${report.warnings.length} |

Veranstaltungen je Kategorie (Mehrfachzuordnung möglich): ${Object.entries(catCount).map(([c, n]) => `${cats[c]} ${n}`).join(' · ')}. Kategorien wurden nur anhand ausdrücklicher Inhalte vergeben (Veranstaltungsort, Titel, genannte Zielgruppe); eine Veranstaltung kann mehrere Kategorien tragen.

## So wurde geprüft

1. **Vollständigkeit:** Alle 148 Seiten wurden gelesen. Das Veranstaltungsprogramm (S. 46–146) enthält ${program.length} Einträge, jeder ist verarbeitet. Eine unabhängige Gegenprüfung bestätigt, dass jede Programmseite mit Text einem Eintrag zugeordnet ist (nicht zugeordnete Seiten: ${report.uncoveredProgramPages?.length ? report.uncoveredProgramPages.join(', ') : 'keine'}); zusätzlich 3 wiederkehrende Führungsreihen und das offene Bienenhaus aus den allgemeinen Informationen.
2. **Abgleich gegen den PDF-Text:** \`scripts/extract-events.py\` prüft für jeden Eintrag maschinell, dass Datum, Uhrzeit, Telefonnummern, E-Mail-Adressen, Preise, Haltestellen, Leitungsnamen und Treffpunkt-Wörter auf den angegebenen PDF-Seiten stehen. Ergebnis: ${report.warnings.length} Warnungen.
3. **Beschreibungen** sind wörtlich aus dem PDF übernommen (Silbentrennung entfernt). Die Kurzbeschreibungen sind eigene, kurze Zusammenfassungen ohne zusätzliche Fakten.
4. **Barrierefreiheit** wird aus den Vektor-Piktogrammen am Ende jedes Eintrags gelesen und per Formvergleich mit der Legende (S. 6–7) klassifiziert. Es wurden keine unbekannten Piktogramme gefunden.
5. **Zeitzonen:** \`start\`/\`end\` sind ISO-8601 mit Offset für Europe/Berlin; \`npm run validate\` prüft sie unabhängig von Python mit der Zeitzonen-Datenbank der Laufzeit (Sommerzeit ab 29.03., Winterzeit ab 25.10.2026).
6. **Koordinaten:** Plausibilitätsprüfung auf den Raum Köln (Lat 50,80–51,10; Lon 6,75–7,20) bei jedem Build.
7. **Testfälle aus dem Auftrag** (\`npm test\`): Botanische Mittagspause (S. 48, 3 Termine), Radführung (S. 72–73, ein Eintrag), Kölner Straßenbäume (S. 83, Treffpunkt nach Anmeldung, kein Marker), Lebendiges Museum (S. 128–129, 4 Termine; S. 62–63, 2 Termine), Waldweihnacht (S. 142–143, 2 Tage).

## Einträge mit fehlenden oder zweifelhaften Angaben

### Ohne Kartenmarker (nur in der Liste)

${list(noMarker, (e) => `${title(e)} – ${!e.venueId ? 'Treffpunkt wird erst nach Anmeldung bekannt gegeben' : venues.get(e.venueId).properties.unlocatedReason}`)}

### Ungefähre Kartenposition

Der Treffpunkt liegt an einer Haltestelle, Kreuzung oder kurzen Straße; die Position stammt aus OpenStreetMap und wurde nicht vor Ort geprüft. In der Detailansicht steht ein entsprechender Hinweis.

${list(approxVenues, (f) => `${f.properties.name} (${f.properties.precision}) – Quelle: ${f.properties.coordinateSource}`)}

Verteilung der Genauigkeit: ${Object.entries(precision).map(([k, v]) => `${k} ${v}`).join(', ')}. (\`address\` = Hausnummer, \`poi\` = benannter Ort, \`stop\` = Haltestelle, \`junction\` = Kreuzung, \`street\` = Straßenmitte, \`pdf\` = Koordinaten aus dem PDF.)

### Unbekannte oder ungefähre Uhrzeiten

Uhrzeit im PDF nicht angegeben (Termin wird als „Uhrzeit offen“ geführt, im Kalenderexport ganztägig):

${list(noTime.map(({ e }) => e), (e) => title(e))}

Endzeit nur „ungefähr“ oder aus einer Dauerangabe abgeleitet (als \`approximate\` markiert):

${list([...new Map(approxTime.map(({ e }) => [e.id, e])).values()])}

Bei allen übrigen Terminen mit Anfangszeit, aber ohne Endzeit, ist die Endzeit im PDF nicht genannt und bleibt leer.

### Kosten unbekannt

${list(costUnknown)}

### Anmeldung nicht eindeutig

Anmeldung im PDF weder verlangt noch ausgeschlossen (${regUnknown.length} Einträge, darunter alle Festungstage mit Verweis auf www.fortis-colonia.de):

${list(regUnknown.filter((e) => !e.id.includes('-ft-')))}
- ${events.filter((e) => e.id.includes('-ft-')).length} Kölner Festungstage (S. 88–103): „Anmeldebedingungen bitte unter www.fortis-colonia.de prüfen“

Anmeldung erforderlich, aber kein Meldeweg im PDF: ${regNoRoute.length ? '' : 'keiner.'}
${list(regNoRoute)}

### Beschreibung

${noDesc.length} Einträge haben im PDF keinen Beschreibungstext, nur Titel, Termin und Ort (v. a. Themenführungen im Botanischen Garten). Es wurde nichts hinzugefügt; die Kurzbeschreibung nennt dann nur Art und Thema.

## Annahmen und Einschränkungen

- **Wiederkehrende Angebote** (${rule.map((e) => e.title).join('; ')}) wurden aus der Regel im PDF für das ganze Kalenderjahr 2026 berechnet. Feiertage, Ferien oder Ausfälle sind im PDF nicht genannt und deshalb **nicht** berücksichtigt. Diese Termine sind in der App als „Regelmäßiger Termin“ gekennzeichnet.
- **Beim Bienenhaus (S. 12)** nennt das PDF „von März bis November jeden 2. und 4. Sonntag im Monat und am 1. Advent“; berechnet wurden die Sonntage von März bis November 2026 plus der 1. Advent (29.11.2026). Preise sind nicht angegeben.
- **Barrierefreiheit** gilt für die Veranstaltung, wie sie am Ende des Eintrags mit Piktogrammen gekennzeichnet ist. Fehlt ein Piktogramm, ist das keine Aussage über Unzugänglichkeit, sondern „keine Angabe“. Auf S. 12 (Finkens Garten) stehen zwei verschiedene Piktogramme; sie lassen sich dem Bienenhaus nicht eindeutig zuordnen und wurden deshalb nicht übernommen.
- **Seitenverweise:** PDF-Seitenzahl und gedruckte Seitenzahl stimmen überein. Mehrseitige Einträge nennen alle Seiten; Einträge, die im Programmteil und in den allgemeinen Informationen vorkommen (Stadtgärtnerei S. 35/65, Freiluga S. 21–23/81, Fortis Colonia S. 20), verweisen auf beide.
- **Nicht als Veranstaltung aufgenommen** (kein konkretes Datum/keine Uhrzeit im PDF oder nur Dauerangebot): Gruppenführungen nach Vereinbarung (Flora S. 15–16, Forstbotanischer Garten, Greifvogelstation S. 27, Krematorium S. 30, Rheinpark S. 33, Finkens Garten S. 11), Unterricht der Grünen Schule/Waldschule, Öffnungszeiten der Einrichtungen (Haus des Waldes, Greifvogelstation, Umweltbildungszentrum, Tierpark), Friedhofsberatung (S. 24), „Ein Wald für Köln“ (Pflanzaktion „jeweils zum Ende des Jahres“, S. 42), Tag des Baumes am 25. April (Pflanzaktion auf Gut Leidenhausen ohne Uhrzeit, S. 29), Tierpark-Fotowettbewerb und Nikolauslauf (S. 31, ohne Datum). Der Internationale Tag des Waldes (S. 28) ist durch die Einträge S. 53 und S. 54 abgedeckt.
- **Orte:** Mehrere Treffpunkte auf Gut Leidenhausen (Haus des Waldes, Greifvogelschutzstation, Hirschgarten, Umweltbildungszentrum) teilen sich einen Kartenmarker; der Treffpunkt steht im Text. Die Zwischenwerk-Va-Führung nutzt den Marker der Freiluga (gleiche Adresse Belvederestraße 159).
- **Geocoding** erfolgte einmalig mit Nominatim/Overpass (OpenStreetMap-Daten, ODbL), mit Rate-Limit und Cache (\`scripts/geocode-cache.json\`). Die Treffer wurden manuell auf Plausibilität geprüft, aber nicht vor Ort bestätigt. Das PDF nennt nur für S. 64 Koordinaten (Google Maps); diese wurden unverändert übernommen.
- **Aktualität:** Das PDF ist der Stand 11/2025 (Druckvermerk). Änderungen durch Veranstalter sind nicht abgebildet.
`;

writeFileSync(join(root, 'DATA_QUALITY.md'), md);
console.log(`DATA_QUALITY.md geschrieben (${events.length} Veranstaltungen, ${occs.length} Termine).`);
