# Datenqualität

Automatisch erzeugt mit `node scripts/data-report.mjs` aus den ausgelieferten Daten (Stand der Extraktion: siehe `scripts/extract-report.json`).

Quelle: Veranstaltungsprogramm 2026, Amt für Landschaftspflege und Grünflächen, Stadt Köln (sk_473_25_veranstaltungsprogramm_2026_amt_67_barrierefrei.pdf, 148 Seiten)

## Umfang

| Kennzahl | Wert |
| --- | --- |
| Veranstaltungen (übergeordnete Einträge) | **80** |
| – davon Einzeleinträge aus dem Veranstaltungsprogramm (S. 46–146) | 76 |
| – davon wiederkehrende Angebote aus den allgemeinen Informationen (S. 12, 19, 43) | 4 |
| Einzeltermine (jeder Termin einzeln auffindbar) | **149** |
| – davon aus Wiederholungsregeln berechnet | 55 |
| – davon tägliche Zeiträume (Ausstellungen) | 2 |
| Veranstaltungsorte | 32 (29 mit Koordinaten, 3 ohne) |
| Veranstaltungen mit Kartenmarker | 76 |
| Veranstaltungen ohne Kartenmarker (nur Liste) | 4 |
| Veranstaltungen mit Barrierefreiheits-Piktogramm | 49 |
| Automatische Prüfwarnungen der Extraktion | 0 |

Veranstaltungen je Kategorie (Mehrfachzuordnung möglich): Natur und Umwelt 29 · Wald und Bäume 18 · Botanische Gärten 25 · Führungen und Exkursionen 55 · Tiere und Artenschutz 9 · Familien und Kinder 19 · Kultur und Geschichte 31 · Sonstige Veranstaltungen 4. Kategorien wurden nur anhand ausdrücklicher Inhalte vergeben (Veranstaltungsort, Titel, genannte Zielgruppe); eine Veranstaltung kann mehrere Kategorien tragen.

## So wurde geprüft

1. **Vollständigkeit:** Alle 148 Seiten wurden gelesen. Das Veranstaltungsprogramm (S. 46–146) enthält 76 Einträge, jeder ist verarbeitet. Eine unabhängige Gegenprüfung bestätigt, dass jede Programmseite mit Text einem Eintrag zugeordnet ist (nicht zugeordnete Seiten: keine); zusätzlich 3 wiederkehrende Führungsreihen und das offene Bienenhaus aus den allgemeinen Informationen.
2. **Abgleich gegen den PDF-Text:** `scripts/extract-events.py` prüft für jeden Eintrag maschinell, dass Datum, Uhrzeit, Telefonnummern, E-Mail-Adressen, Preise, Haltestellen, Leitungsnamen und Treffpunkt-Wörter auf den angegebenen PDF-Seiten stehen. Ergebnis: 0 Warnungen.
3. **Beschreibungen** sind wörtlich aus dem PDF übernommen (Silbentrennung entfernt). Die Kurzbeschreibungen sind eigene, kurze Zusammenfassungen ohne zusätzliche Fakten.
4. **Barrierefreiheit** wird aus den Vektor-Piktogrammen am Ende jedes Eintrags gelesen und per Formvergleich mit der Legende (S. 6–7) klassifiziert. Es wurden keine unbekannten Piktogramme gefunden.
5. **Zeitzonen:** `start`/`end` sind ISO-8601 mit Offset für Europe/Berlin; `npm run validate` prüft sie unabhängig von Python mit der Zeitzonen-Datenbank der Laufzeit (Sommerzeit ab 29.03., Winterzeit ab 25.10.2026).
6. **Koordinaten:** Plausibilitätsprüfung auf den Raum Köln (Lat 50,80–51,10; Lon 6,75–7,20) bei jedem Build.
7. **Testfälle aus dem Auftrag** (`npm test`): Botanische Mittagspause (S. 48, 3 Termine), Radführung (S. 72–73, ein Eintrag), Kölner Straßenbäume (S. 83, Treffpunkt nach Anmeldung, kein Marker), Lebendiges Museum (S. 128–129, 4 Termine; S. 62–63, 2 Termine), Waldweihnacht (S. 142–143, 2 Tage).

## Einträge mit fehlenden oder zweifelhaften Angaben

### Ohne Kartenmarker (nur in der Liste)

- Weißer Rheinbogen (S. 66) – Minigolfplatz/Parkplatz an der Uferstraße (Rodenkirchen) in OSM nicht eindeutig auffindbar; Uferstraße ist lang
- Kölner Straßenbäume – So wichtig und so gestresst (S. 83) – Treffpunkt wird erst nach Anmeldung bekannt gegeben
- Festungstage: Turm der Prinzengarde (S. 20, 92) – „Turm der Prinzengarde“ am Sachsenring in OSM/Nominatim nicht auffindbar
- Festungstage: Burgen im Rechtsrheinischen (S. 20, 94) – Haltestelle „Dellbrücker Hauptstraße“ nicht eindeutig auffindbar; Straße ist lang

### Ungefähre Kartenposition

Der Treffpunkt liegt an einer Haltestelle, Kreuzung oder kurzen Straße; die Position stammt aus OpenStreetMap und wurde nicht vor Ort geprüft. In der Detailansicht steht ein entsprechender Hinweis.

- Waldbad Dünnwald (Eingang) (stop) – Quelle: OSM/Nominatim: Waldbad, Dünnwalder Mühlenweg, Dünnwald, Mülheim, Köln, Nordrhein-Westfalen, 51069, Deutsc
- Worringer Bruch (Senfweg/Bruchstraße) (junction) – Quelle: OSM/Overpass: Knoten Senfweg × Bruchstraße (Worringen)
- Waldlabor (Bachemer Landstraße/Stüttgenweg) (junction) – Quelle: OSM/Overpass: Knoten Stüttgenweg × Bachemer Landstraße
- KVB-Haltestelle Westhoven/Kölner Straße (stop) – Quelle: OSM/Nominatim: Westhoven, Kölner Straße, Kölner Straße, Kaserne Westhoven, Westhoven, Porz, Köln, Nordrhe
- Stadtwald (Dürener Straße/Stadtwaldgürtel) (stop) – Quelle: OSM/Nominatim: Dürener Straße/Gürtel, Stadtwaldgürtel, Lindenthal, Köln, Nordrhein-Westfalen, 50931, Deut
- KVB-Haltestelle Stüttgenhof (stop) – Quelle: OSM/Nominatim: Stüttgenhof, Stüttgenweg, Lindenthal, Köln, Nordrhein-Westfalen, 50935, Deutschland
- KVB-Haltestelle Wilhelm-Sollmann-Straße (stop) – Quelle: OSM/Overpass: Haltestelle Wilhelm-Sollmann-Straße (tram_stop)
- Ostfriedhof (Eingang Dellbrücker Mauspfad) (stop) – Quelle: OSM/Nominatim: Ostfriedhof, Dellbrücker Mauspfad, Dellbrück, Mülheim, Köln, Nordrhein-Westfalen, 51069, D
- Fort I (Oberländer Wall) (street) – Quelle: OSM/Nominatim, Mittel von 2 Straßenabschnitten: Oberländer Wall Köln
- An der Malzmühle / Mühlenbach (street) – Quelle: OSM/Nominatim: An der Malzmühle, Georgsviertel, Altstadt-Süd, Innenstadt, Köln, Nordrhein-Westfalen, 5067
- Am Kümpchenshof / Gereonswall (street) – Quelle: OSM/Nominatim, Mittel von 2 Straßenabschnitten: Am Kümpchenshof Köln

Verteilung der Genauigkeit: poi 12, address 5, stop 6, junction 2, pdf 1, street 3. (`address` = Hausnummer, `poi` = benannter Ort, `stop` = Haltestelle, `junction` = Kreuzung, `street` = Straßenmitte, `pdf` = Koordinaten aus dem PDF.)

### Unbekannte oder ungefähre Uhrzeiten

Uhrzeit im PDF nicht angegeben (Termin wird als „Uhrzeit offen“ geführt, im Kalenderexport ganztägig):

- Dahlienpracht im Botanischen Garten (S. 109)
- Freiluga: Tag der offenen Tür (S. 21, 22, 23, 81)

Endzeit nur „ungefähr“ oder aus einer Dauerangabe abgeleitet (als `approximate` markiert):

- Ab in den Wald: Radführung durch den äußeren Wald- und Wiesengürtel, Teil I rechtsrheinisch (S. 72, 73)
- Radführung durch den äußeren Wald- und Wiesengürtel, Teil II, linksrheinisch (S. 127)
- Führung über den Ostfriedhof (S. 140)
- Kölner Straßenbäume – So wichtig und so gestresst (S. 83)
- Festungstage: Burgen im Rechtsrheinischen (S. 20, 94)

Bei allen übrigen Terminen mit Anfangszeit, aber ohne Endzeit, ist die Endzeit im PDF nicht genannt und bleibt leer.

### Kosten unbekannt

- Weihnachtsbaumverkauf des Lions Club Köln-Hanse (S. 146)
- Bienenhaus in Finkens Garten geöffnet (S. 10, 12)

### Anmeldung nicht eindeutig

Anmeldung im PDF weder verlangt noch ausgeschlossen (21 Einträge, darunter alle Festungstage mit Verweis auf www.fortis-colonia.de):

- Kamelien – Fernöstlicher Blütenzauber (S. 46)
- Kamelientage: Geschichten, Beratung und Teeverkostung (S. 50)
- Dahlienpracht im Botanischen Garten (S. 109)
- Weihnachtsbaumverkauf des Lions Club Köln-Hanse (S. 146)
- Führung durch den Wildpark Dünnwald (monatlich) (S. 43)
- Bienenhaus in Finkens Garten geöffnet (S. 10, 12)
- 15 Kölner Festungstage (S. 88–103): „Anmeldebedingungen bitte unter www.fortis-colonia.de prüfen“

Anmeldung erforderlich, aber kein Meldeweg im PDF: 
- Weißer Rheinbogen (S. 66)

### Beschreibung

20 Einträge haben im PDF keinen Beschreibungstext, nur Titel, Termin und Ort (v. a. Themenführungen im Botanischen Garten). Es wurde nichts hinzugefügt; die Kurzbeschreibung nennt dann nur Art und Thema.

## Annahmen und Einschränkungen

- **Wiederkehrende Angebote** (Führung durch den Forstbotanischen Garten (monatlich, Mittwoch); Führung durch den Forstbotanischen Garten (monatlich, Samstag); Führung durch den Wildpark Dünnwald (monatlich); Bienenhaus in Finkens Garten geöffnet) wurden aus der Regel im PDF für das ganze Kalenderjahr 2026 berechnet. Feiertage, Ferien oder Ausfälle sind im PDF nicht genannt und deshalb **nicht** berücksichtigt. Diese Termine sind in der App als „Regelmäßiger Termin“ gekennzeichnet.
- **Beim Bienenhaus (S. 12)** nennt das PDF „von März bis November jeden 2. und 4. Sonntag im Monat und am 1. Advent“; berechnet wurden die Sonntage von März bis November 2026 plus der 1. Advent (29.11.2026). Preise sind nicht angegeben.
- **Barrierefreiheit** gilt für die Veranstaltung, wie sie am Ende des Eintrags mit Piktogrammen gekennzeichnet ist. Fehlt ein Piktogramm, ist das keine Aussage über Unzugänglichkeit, sondern „keine Angabe“. Auf S. 12 (Finkens Garten) stehen zwei verschiedene Piktogramme; sie lassen sich dem Bienenhaus nicht eindeutig zuordnen und wurden deshalb nicht übernommen.
- **Seitenverweise:** PDF-Seitenzahl und gedruckte Seitenzahl stimmen überein. Mehrseitige Einträge nennen alle Seiten; Einträge, die im Programmteil und in den allgemeinen Informationen vorkommen (Stadtgärtnerei S. 35/65, Freiluga S. 21–23/81, Fortis Colonia S. 20), verweisen auf beide.
- **Nicht als Veranstaltung aufgenommen** (kein konkretes Datum/keine Uhrzeit im PDF oder nur Dauerangebot): Gruppenführungen nach Vereinbarung (Flora S. 15–16, Forstbotanischer Garten, Greifvogelstation S. 27, Krematorium S. 30, Rheinpark S. 33, Finkens Garten S. 11), Unterricht der Grünen Schule/Waldschule, Öffnungszeiten der Einrichtungen (Haus des Waldes, Greifvogelstation, Umweltbildungszentrum, Tierpark), Friedhofsberatung (S. 24), „Ein Wald für Köln“ (Pflanzaktion „jeweils zum Ende des Jahres“, S. 42), Tag des Baumes am 25. April (Pflanzaktion auf Gut Leidenhausen ohne Uhrzeit, S. 29), Tierpark-Fotowettbewerb und Nikolauslauf (S. 31, ohne Datum). Der Internationale Tag des Waldes (S. 28) ist durch die Einträge S. 53 und S. 54 abgedeckt.
- **Orte:** Mehrere Treffpunkte auf Gut Leidenhausen (Haus des Waldes, Greifvogelschutzstation, Hirschgarten, Umweltbildungszentrum) teilen sich einen Kartenmarker; der Treffpunkt steht im Text. Die Zwischenwerk-Va-Führung nutzt den Marker der Freiluga (gleiche Adresse Belvederestraße 159).
- **Geocoding** erfolgte einmalig mit Nominatim/Overpass (OpenStreetMap-Daten, ODbL), mit Rate-Limit und Cache (`scripts/geocode-cache.json`). Die Treffer wurden manuell auf Plausibilität geprüft, aber nicht vor Ort bestätigt. Das PDF nennt nur für S. 64 Koordinaten (Google Maps); diese wurden unverändert übernommen.
- **Aktualität:** Das PDF ist der Stand 11/2025 (Druckvermerk). Änderungen durch Veranstalter sind nicht abgebildet.
