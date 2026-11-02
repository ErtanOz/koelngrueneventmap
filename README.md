# Köln im Grünen | EventMap 2026

*Natur entdecken. Veranstaltungen erleben.*

Interaktive Karte und Terminliste für das **Veranstaltungsprogramm 2026 des Amtes für Landschaftspflege und Grünflächen der Stadt Köln**.
Rein statisch (React + TypeScript + Vite + MapLibre GL JS), ohne Backend, Login, Cookies oder Tracking.

> **Unabhängiger technischer Prototyp.** Keine offizielle Anwendung der Stadt Köln. Angaben ohne Gewähr – bitte aktuelle Informationen beim Veranstalter prüfen.
> Es werden weder das Stadt-Köln-Logo noch geschützte Fotos verwendet; Logo-Mark und Icons sind eigene CSS-Grafiken bzw. Lucide-Icons.

## Schnellstart

```bash
npm install
npm run dev        # Entwicklungsserver (http://localhost:5173)
npm run build      # Datenvalidierung + Typprüfung + Produktionsbuild nach dist/
npm run preview    # gebauten Stand lokal ansehen
npm test           # Unit-Tests (Filter, Suche, Zeitlogik, Kalenderexport, Testfälle aus dem PDF)
```

Node.js ≥ 22.18 (Tests nutzen das eingebaute TypeScript-Stripping; in CI läuft Node 24).

## Funktionen

- **Karte und Liste** mit identischer Filterlogik; Marker nach Kategorie eingefärbt, Clustering, Zoom/Pan, „Ansicht zurücksetzen“, Auswahl in Liste und Karte synchron.
- **Suche** (Titel, Beschreibung, Ort, Stadtteil, Veranstalter) – ohne Umlaut-/ß-Probleme, sofort reagierend.
- **Filter:** Zeitraum (Kommende, Alle Termine, Heute, Diese Woche, Dieses Wochenende, Monat), 8 Kategorien, Kostenlos, Anmeldung erforderlich, Familienfreundlich, Favoriten – kombinierbar und mit einem Klick zurücksetzbar.
  Vergangene Termine bleiben über „Alle Termine“ erreichbar; gibt es keine kommenden Termine mehr, zeigt die App automatisch das Gesamtprogramm.
- **Detailansicht:** Termin(e), Ort und Treffpunkt, Kosten, Anmeldung, Barrierefreiheit (aus den PDF-Piktogrammen), ÖPNV, Kontakt, PDF-Quellseite, bis zu drei ähnliche Veranstaltungen (lokale Regeln: Kategorie, Ort, Veranstalter, zeitliche Nähe).
- **Aktionen:** Route planen (OpenStreetMap, alternativ Google Maps) · `.ics`-Export (Europe/Berlin mit VTIMEZONE, Serien für täglich identische Öffnungszeiten, ganztägig bei unbekannter Uhrzeit) · Teilen · Anmelden (nur vorhandene E-Mail-/URL-Angaben) · Favoriten (LocalStorage).
- **In meiner Nähe:** Standort wird erst nach Klick abgefragt; ohne Freigabe funktioniert alles weiter.
- **Deep Links** ohne Server-Routing: `?e=<Termin-ID>` (z. B. `?e=p48-botanische-mittagspause--2026-04-22t1230`) oder `?event=<Veranstaltungs-ID>`.
- **Responsive:** Desktop als Split-View (Liste ca. 38 %, Karte ca. 62 %), mobil mit Umschalter Liste/Karte, Bottom-Sheet für Details und Filter.
- **Barrierefreiheit (Ziel WCAG 2.2 AA):** semantisches HTML, Tastaturbedienung, sichtbarer Fokus, native `<dialog>`-Dialoge, `prefers-reduced-motion`, Kontraste geprüft, vollständige Listenansicht als Entsprechung der Karte, Marker sind echte Buttons.

## Daten

| Datei | Inhalt |
| --- | --- |
| `src/data/events.json` | Veranstaltungen mit einzelnen Terminen (ISO-8601, Europe/Berlin), Quelle und PDF-Seiten |
| `src/data/locations.geojson` | Orte mit WGS84-Koordinaten (`precision`, `coordinateSource`); Orte ohne sichere Verortung haben `geometry: null` |
| `DATA_QUALITY.md` | Umfang, Prüfverfahren, Einträge mit fehlenden/zweifelhaften Angaben, Annahmen |

Aktueller Umfang: **80 Veranstaltungen, 149 Einzeltermine, 32 Orte (29 mit Koordinaten)**. Mehrfachtermine sind einzeln auffindbar und mit der übergeordneten Veranstaltung verknüpft.
Es werden **keine Angaben ergänzt**: Unbekanntes (Uhrzeit, Preis, Anmeldung, Barrierefreiheit) bleibt `null` und wird in der App als „nicht angegeben“ gezeigt.

### Daten neu erzeugen (optional)

Die ausgelieferten Daten sind eingecheckt; der Build braucht weder Python noch das PDF.

```bash
pip install pymupdf tzdata
# PDF nach source/veranstaltungsprogramm-2026.pdf legen
python scripts/geocode.py          # nur neue Orte (Nominatim, 1 Anfrage/s, Cache in scripts/geocode-cache.json)
python scripts/extract-events.py   # PDF-Abgleich → events.json, locations.geojson, extract-report.json
npm run validate                   # JSON-/GeoJSON-Validierung (läuft auch vor jedem Build)
node scripts/data-report.mjs       # erzeugt DATA_QUALITY.md
```

`scripts/events_source.py` enthält die kuratierte Strukturierung (Titel, Kategorien, Kosten, Termine …) je Programmeintrag mit PDF-Seite; `extract-events.py` prüft jede Angabe gegen den PDF-Text und liest Beschreibungen und Barrierefreiheits-Piktogramme direkt aus dem PDF. `scripts/venues.json` beschreibt die Orte und die gewählten Geocoding-Treffer.

## Auf GitHub Pages veröffentlichen

1. Repository anlegen (Name beliebig) und den Code auf den Branch `main` pushen.
2. Im Repository **Settings → Pages → Build and deployment → Source: GitHub Actions** wählen.
3. Der Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) testet, validiert, baut und veröffentlicht bei jedem Push nach `main`.
   Die Seite erscheint unter `https://<benutzer>.github.io/<repository>/`.

Der Vite-Basispfad ist relativ (`base: './'`), JS, CSS, Schriften und der Karten-Worker funktionieren daher unter jedem Unterpfad ohne Anpassung. Die Daten sind in das Bundle eingebettet; Deep Links nutzen Query-Parameter statt Server-Routing.
Es werden keine Secrets benötigt.

## Karte, Kachelanbieter und Datenschutz

- Kartenkacheln kommen von `tile.openstreetmap.org` (© OpenStreetMap-Mitwirkende, Attribution in der Karte). Beim Laden der Karte wird technisch bedingt die IP-Adresse des Besuchers an den Kartenserver übertragen; die Anwendung weist in der Info-Ansicht darauf hin.
- Die [Nutzungsbedingungen der OSM-Kacheln](https://operations.osmfoundation.org/policies/tiles/) erlauben nur moderate Nutzung. **Für einen produktiven Betrieb mit nennenswertem Verkehr** bitte einen eigenen Kachelserver oder einen Anbieter mit passenden Konditionen eintragen – es genügt, `STYLE` in `src/components/MapView.tsx` anzupassen.
- Keine Cookies, keine Analytics, keine Schrift-Server (Inter wird lokal ausgeliefert). Favoriten liegen nur im LocalStorage des Browsers. Der Standort wird nur nach Klick abgefragt und weder gespeichert noch gesendet.

## Projektstruktur

```
src/
  components/   MapView, EventList, EventCard, EventDetails, FilterBar, Header, Dialog, AboutDialog, CategoryIcon
  lib/          eventFilters.ts, dateUtils.ts, calendarExport.ts, data.ts, categories.ts, hooks.ts
  data/         events.json, locations.geojson
  styles/       tokens.css (Design Tokens), main.css
  App.tsx, main.tsx, types.ts
scripts/        extract-events.py, events_source.py, geocode.py, venues.json, validate-data.mjs, data-report.mjs
tests/          lib.test.ts
public/         favicon.svg
.github/workflows/deploy.yml
DATA_QUALITY.md
```

## Bekannte Einschränkungen

- Wiederkehrende Angebote (Forstbotanischer Garten, Wildpark Dünnwald, offenes Bienenhaus) sind für das ganze Jahr 2026 aus der Regel im PDF berechnet; Feiertage/Ausfälle sind nicht abgebildet.
- 4 Veranstaltungen haben keinen Kartenmarker, weil der Treffpunkt nicht eindeutig lokalisierbar ist bzw. erst nach der Anmeldung mitgeteilt wird – sie bleiben in der Liste. Einzelheiten in [`DATA_QUALITY.md`](DATA_QUALITY.md).
- Koordinaten stammen aus OpenStreetMap und wurden nicht vor Ort geprüft; Haltestellen-/Kreuzungspositionen sind in der Detailansicht entsprechend gekennzeichnet.
- Das Programm-PDF der Stadt ist wegen ungeklärter Nutzungsrechte nicht im Repository (`.gitignore`).
