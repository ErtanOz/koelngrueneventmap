#!/usr/bin/env python3
"""Erzeugt src/data/events.json und src/data/locations.geojson aus dem Veranstaltungsprogramm 2026.

Ablauf
  1. PDF-Seitentext einlesen (PyMuPDF).
  2. Kuratierte Einträge (scripts/events_source.py) gegen den PDF-Text prüfen:
     Datum, Uhrzeit, Telefon, E-Mail und Titel müssen auf den angegebenen Seiten stehen.
  3. Beschreibungstexte direkt aus dem PDF übernehmen (Silbentrennung entfernt).
  4. Barrierefreiheits-Piktogramme aus den Vektorgrafiken der Seiten lesen und per Formvergleich
     mit der Legende (Seiten 6/7) klassifizieren.
  5. Wiederkehrende Termine (Seiten 12, 19, 43) für 2026 einzeln ausformulieren.
  6. Veranstaltungsorte mit zwischengespeicherten Geocoding-Treffern (scripts/geocode-cache.json) verorten.
  7. events.json, locations.geojson und scripts/extract-report.json (Prüfbefunde) schreiben.

    pip install pymupdf tzdata
    python scripts/extract-events.py [pfad/zum.pdf]
"""
import calendar, json, re, sys
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import events_source as S  # noqa: E402

PDF = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "source" / "veranstaltungsprogramm-2026.pdf"
TZ = ZoneInfo("Europe/Berlin")
MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
CATEGORIES = {
    "natur": "Natur und Umwelt", "wald": "Wald und Bäume", "botanik": "Botanische Gärten",
    "fuehrungen": "Führungen und Exkursionen", "tiere": "Tiere und Artenschutz",
    "familie": "Familien und Kinder", "kultur": "Kultur und Geschichte", "sonstige": "Sonstige Veranstaltungen"}

report = {"warnings": [], "info": []}


def warn(msg):
    report["warnings"].append(msg)
    print("WARNUNG:", msg)


# ---------------------------------------------------------------- PDF lesen
doc = pymupdf.open(PDF)
if len(doc) != 148:
    warn(f"PDF hat {len(doc)} statt 148 Seiten")


def clean(t: str) -> str:
    t = t.replace("­\n", "").replace("­", "")
    t = t.replace("\t", " ")
    return re.sub(r"[  ]+", " ", t)


PAGES = {i + 1: clean(p.get_text()) for i, p in enumerate(doc)}


def norm(t: str) -> str:
    """Für Vergleiche: Whitespace, Anführungszeichen und Bindestriche vereinheitlichen."""
    t = t.replace("„", '"').replace("“", '"').replace("‚", "'").replace("‘", "'").replace("–", "-").replace("’", "'")
    return re.sub(r"\s+", " ", t).strip().lower()


def pages_text(pages):
    return "\n".join(PAGES[p] for p in pages)


# ---------------------------------------------------------------- Piktogramme (Barrierefreiheit)
LEGEND = {  # (Breite, Höhe, Gruppen, Pfadelemente) der Vektor-Icons aus Legende S. 6/7
    (36, 42, 2, 41): ("wheelchair", "voll"),
    (42, 42, 3, 92): ("wheelchair", "eingeschraenkt"),
    (41, 41, 3, 61): ("parking", True),
    (41, 41, 4, 76): ("toilet", "voll"),
    (41, 41, 5, 126): ("toilet", "eingeschraenkt"),
    (42, 30, 1, 41): ("visualAids", True),
    (42, 42, 5, 80): ("lift", "voll"),
}


def icon_clusters(page):
    groups = []
    for dr in page.get_drawings():
        r = pymupdf.Rect(dr["rect"])
        if r.width > 100:
            continue
        for g in groups:
            if pymupdf.Rect(g["rect"].x0 - 6, g["rect"].y0 - 6, g["rect"].x1 + 6, g["rect"].y1 + 6).intersects(r):
                g["rect"] |= r
                g["items"].append(dr)
                break
        else:
            groups.append({"rect": pymupdf.Rect(r), "items": [dr]})
    merged = True
    while merged:
        merged = False
        for i in range(len(groups)):
            for j in range(i + 1, len(groups)):
                a, b = groups[i]["rect"], groups[j]["rect"]
                if pymupdf.Rect(a.x0 - 6, a.y0 - 6, a.x1 + 6, a.y1 + 6).intersects(b):
                    groups[i]["rect"] |= b
                    groups[i]["items"] += groups[j]["items"]
                    del groups[j]
                    merged = True
                    break
            if merged:
                break
    return groups


def page_icons(n):
    found = {}
    for g in icon_clusters(doc[n - 1]):
        sig = (round(g["rect"].width), round(g["rect"].height), len(g["items"]), sum(len(i["items"]) for i in g["items"]))
        if sig in LEGEND:
            k, v = LEGEND[sig]
            found[k] = v
        else:
            warn(f"Seite {n}: unbekanntes Piktogramm {sig}")
    return found


ACCESS_TEXT = {
    ("wheelchair", "voll"): "Für Rollstuhlfahrer*innen voll zugänglich",
    ("wheelchair", "eingeschraenkt"): "Für Rollstuhlfahrer*innen eingeschränkt zugänglich (Zugang nur mit Hilfe möglich)",
    ("parking", True): "Markierte Behindertenparkplätze vorhanden",
    ("toilet", "voll"): "Toiletten für Rollstuhlfahrer*innen voll zugänglich",
    ("toilet", "eingeschraenkt"): "Toiletten für Rollstuhlfahrer*innen eingeschränkt zugänglich",
    ("visualAids", True): "Hilfen für Blinde und Sehbehinderte vorhanden",
    ("lift", "voll"): "Aufzüge für Rollstuhlfahrer*innen voll zugänglich",
}


def accessibility_for(last_page):
    icons = page_icons(last_page)
    if not icons:
        return None
    items = [ACCESS_TEXT[(k, v)] for k, v in icons.items()]
    return {**icons, "items": items, "sourcePage": last_page,
            "basis": "Piktogramme am Ende des Programmeintrags (Legende PDF S. 6–7)"}


# ---------------------------------------------------------------- Textaufbereitung
def description_for(ev):
    start = ev.get("desc_from")
    if not start:
        return None, []
    text = pages_text(ev["pages"])
    # Seitenzahl-Zeilen (nur Ziffern) entfernen
    text = "\n".join(l for l in text.split("\n") if not re.fullmatch(r"\s*\d{1,3}\s*", l))
    ns = norm(text)
    flat = re.sub(r"\s+", " ", text)
    idx = norm(flat).find(norm(start))
    if idx < 0:
        warn(f"{ev['id']}: Beschreibungsanfang „{start}“ nicht gefunden")
        return None, []
    # Index im normierten Text -> gleicher Index im flachen Text (norm ändert nur Zeichen 1:1, lower/strip)
    flat_n = flat
    lead = len(flat) - len(flat.lstrip())
    pos = idx + lead
    rest = flat_n[pos:]
    end_label = ev.get("desc_to") or "Termin"
    # Ende der Beschreibung = Feldbezeichnung mit Doppelpunkt („Termin:“, „Termine:“, „Ausstellungszeitraum:“ …)
    end_pat = {"Ausstellungs": r"Ausstellungs-\s*zeitraum:", "Kontakt": r"Kontakt:"}.get(end_label, rf"{re.escape(end_label)}e?:")
    m = re.search(end_pat, rest)
    chunk = rest[: m.start()] if m else rest
    chunk = chunk.strip()
    chunk = re.sub(r"\s*[^.!?]*:$", "", chunk)  # überleitender Halbsatz vor „Termin:“ gehört nicht zur Beschreibung
    notes = []
    h = re.search(r"Hinweis:\s*(.*)$", chunk)
    if h:
        notes.append(h.group(1).strip())
        chunk = chunk[: h.start()].strip()
    return chunk, notes


# ---------------------------------------------------------------- Prüfungen gegen das PDF
def days_in_text(n: str):
    """Alle (Tag, Monat)-Paare, die im Text vorkommen – auch Aufzählungen wie „14. und 15. März“."""
    found = set()
    for m in re.finditer(r"((?:\d{1,2}\.?\s*(?:und\s+|bis\s+|,\s*)?)+)\s*(" + "|".join(x.lower() for x in MONTHS) + r")", n):
        for d in re.findall(r"\d{1,2}", m.group(1)):
            found.add((int(d), MONTHS.index(m.group(2).capitalize()) + 1))
    return found


def time_in_text(t: str, n: str) -> bool:
    h, mm = t.split(":")
    h = int(h)
    if mm != "00":
        return f"{h}:{mm}" in n or f"{h}.{mm}" in n
    # „11 Uhr“, „11 bis 16 Uhr“, „bis 16 Uhr“, „10 und 11:30 Uhr“, „ab 12 Uhr“
    return bool(re.search(rf"(?<![\d:.]){h}(?::00)?\s*(uhr|bis|und)(?![a-zäöüß])", n) or re.search(rf"bis\s+{h}(?::00)?\s*uhr", n))


def verify(ev):
    texts = pages_text(ev["pages"] + ev.get("extra_pages", []))
    n = norm(texts)
    base = ev["pages"]
    nt = re.sub(r'["„“]', "", n)
    probe = ev.get("probe")
    if not probe:
        t = norm(re.sub(r"[„“\"]", "", ev["title"]))
        key = t.split(" - ")[-1] if " - " in t else t
        key = key.split(": ")[-1]
        probe = key[:22]
    probe = norm(probe)
    if probe not in nt and probe.replace(" ", "") not in nt.replace(" ", ""):
        warn(f"{ev['id']}: Titel „{ev['title']}“ (Suchbegriff „{probe}“) nicht auf Seite(n) {base} gefunden")
    if not ev.get("rule"):
        days = days_in_text(n)
        for o in ev["occ"]:
            d = date.fromisoformat(o["date"])
            if (d.day, d.month) not in days:
                warn(f"{ev['id']}: Datum {d.day}. {MONTHS[d.month - 1]} nicht im PDF-Text der Seiten {ev['pages']}")
            if o.get("until"):
                u = date.fromisoformat(o["until"])
                if (u.day, u.month) not in days:
                    warn(f"{ev['id']}: Enddatum {u.day}. {MONTHS[u.month - 1]} nicht im PDF-Text")
            for key_, t_ in (("start", o.get("start")), ("end", o.get("end"))):
                if not t_ or (key_ == "end" and (o.get("approx") or ev.get("duration"))):
                    continue  # Endzeiten aus „ungefähr“/Dauerangaben sind abgeleitet und als approximate markiert
                if not time_in_text(t_, n):
                    warn(f"{ev['id']}: Uhrzeit {t_} ({o['date']}) nicht im PDF-Text")
    # Haltestellen, Leitung, Preise, Treffpunkt müssen im PDF-Text der Seiten vorkommen
    nn = n.replace(" ", "")
    for t in ev.get("transit", []):
        name = t.split(" (")[0].split(",")[0]
        if name.startswith(("Alternativ", "Endpunkt")):
            continue
        if norm(name).replace(" ", "") not in nn:
            warn(f"{ev['id']}: Haltestelle „{name}“ nicht im PDF-Text der Seiten {base + ev.get('extra_pages', [])}")
    guide = ev.get("guide")
    if guide:
        for part in re.split(r" und ", guide.split(",")[0]):
            if norm(part).replace(" ", "") not in nn:
                warn(f"{ev['id']}: Leitung „{part}“ nicht im PDF-Text")
    cost = ev.get("cost") or {}
    for k in ("adult", "reduced"):
        if cost.get(k) is not None and f"{cost[k]} euro" not in n:
            warn(f"{ev['id']}: Preis {cost[k]} Euro nicht im PDF-Text")
    words = [w for w in re.findall(r"[a-zäöüß]{4,}", norm(ev["meet"]))]
    if words:
        hit = sum(1 for w in words if w in n)
        if hit / len(words) < 0.8:
            warn(f"{ev['id']}: Treffpunkt „{ev['meet']}“ nur zu {hit}/{len(words)} Wörtern im PDF-Text")
    contact = ev.get("contact") or {}
    r = ev.get("reg") or {}
    for label, val in (("E-Mail", contact.get("email")), ("E-Mail (Anmeldung)", r.get("email")),
                       ("Telefon", contact.get("phone")), ("Telefon (Anmeldung)", r.get("phone"))):
        if val and norm(val).replace(" ", "") not in n.replace(" ", ""):
            warn(f"{ev['id']}: {label} „{val}“ nicht im PDF-Text der Seiten {base + ev.get('extra_pages', [])}")


# ---------------------------------------------------------------- Termine
def iso(d: str, t: str | None):
    if not t:
        return None
    dt = datetime.fromisoformat(f"{d}T{t}").replace(tzinfo=TZ)
    return dt.isoformat(timespec="minutes")


def nth_weekday(year, month, weekday, n):
    cal = [d for d in calendar.Calendar().itermonthdates(year, month) if d.month == month and d.weekday() == weekday]
    return cal[n - 1] if len(cal) >= n else None


def expand_rule(rule):
    out = []
    for m in rule["months"]:
        for n in rule["n"]:
            d = nth_weekday(2026, m, rule["weekday"], n)
            if d:
                out.append(S.occ(d.isoformat(), rule["start"], rule["end"]))
    for extra in rule.get("extra", []):
        out.append(S.occ(extra, rule["start"], rule["end"]))
    out.sort(key=lambda o: o["date"])
    return out


def build_occurrences(ev):
    occs = expand_rule(ev["rule"]) if ev.get("rule") else ev["occ"]
    result, seen = [], set()
    for o in occs:
        oid = f"{ev['id']}--{o['date']}" + (f"t{o['start'].replace(':', '')}" if o["start"] else "")
        if oid in seen:
            warn(f"{ev['id']}: doppelter Termin {oid}")
        seen.add(oid)
        until = o.get("until")
        result.append({
            "id": oid, "date": o["date"], "endDate": until,
            "daily": bool(until),
            "startTime": o["start"], "endTime": o["end"],
            "start": iso(o["date"], o["start"]),
            "end": iso(until or o["date"], o["end"]),
            "approximate": bool(o.get("approx")),
            "note": o.get("note"),
            "weekday": WEEKDAYS[date.fromisoformat(o["date"]).weekday()],
        })
    return result


# ---------------------------------------------------------------- Orte
def load_venues():
    venues = json.loads((ROOT / "scripts" / "venues.json").read_text(encoding="utf-8"))
    cache = json.loads((ROOT / "scripts" / "geocode-cache.json").read_text(encoding="utf-8"))
    out = []
    for v in venues:
        coord = None
        if v.get("fixed"):
            f = v["fixed"]
            coord = {"lat": f["lat"], "lon": f["lon"], "precision": f["precision"], "source": f["source"]}
        elif v.get("geocode"):
            q = v["geocode"]["query"]
            res = cache.get(q) or []
            pick = v["geocode"].get("pick", 0)
            if not res:
                warn(f"Ort {v['id']}: kein Geocoding-Treffer für „{q}“")
            elif pick == "mean":
                lat = sum(float(r["lat"]) for r in res) / len(res)
                lon = sum(float(r["lon"]) for r in res) / len(res)
                coord = {"lat": lat, "lon": lon, "precision": v["geocode"]["precision"],
                         "source": f"OSM/Nominatim, Mittel von {len(res)} Straßenabschnitten: {q}"}
            else:
                r = res[pick]
                coord = {"lat": float(r["lat"]), "lon": float(r["lon"]), "precision": v["geocode"]["precision"],
                         "source": f"OSM/Nominatim: {r['display_name'][:90]}"}
        if coord:
            # Plausibilität: Raum Köln
            if not (50.80 <= coord["lat"] <= 51.10 and 6.75 <= coord["lon"] <= 7.20):
                warn(f"Ort {v['id']}: Koordinate außerhalb Kölns {coord}")
                coord = None
        out.append({**v, "coord": coord})
    return out


def main():
    events = []
    for ev in S.EVENTS:
        verify(ev)
        desc, notes = description_for(ev)
        occs = build_occurrences(ev)
        if not occs:
            warn(f"{ev['id']}: keine Termine")
        all_notes = list(ev.get("notes", [])) + notes
        events.append({
            "id": ev["id"], "title": ev["title"], "kind": ev["kind"],
            "categories": ev["cats"], "organizer": ev["org"], "guide": ev.get("guide"),
            "summary": ev["summary"], "description": desc,
            "venueId": ev["venue"], "meetingPoint": ev["meet"], "transit": ev["transit"],
            "cost": ev["cost"], "registration": ev["reg"], "contact": ev.get("contact"),
            "audience": ev["audience"], "familyFriendly": bool(ev["family"]) or S.FAMILIE in ev["cats"],
            "maxParticipants": ev.get("maxp"), "duration": ev.get("duration"),
            "notes": all_notes,
            "accessibility": accessibility_for(ev["pages"][-1]),
            "recurrence": ev.get("derived"),
            "sourcePages": sorted(set(ev["pages"] + ev.get("extra_pages", []))),
            "occurrences": occs,
        })

    venues = load_venues()
    used = {e["venueId"] for e in events if e["venueId"]}
    unknown = used - {v["id"] for v in venues}
    if unknown:
        warn(f"Events verweisen auf unbekannte Orte: {sorted(unknown)}")
    features, venue_meta = [], []
    for v in venues:
        if v["id"] not in used:
            report["info"].append(f"Ort {v['id']} wird von keinem Event genutzt")
        props = {"id": v["id"], "name": v["name"], "street": v.get("street"), "postalCode": v.get("plz"),
                 "district": v.get("district"), "sourcePages": v.get("pages", []),
                 "precision": v["coord"]["precision"] if v.get("coord") else None,
                 "coordinateSource": v["coord"]["source"] if v.get("coord") else None,
                 "unlocatedReason": v.get("unlocated")}
        if v.get("coord"):
            features.append({"type": "Feature", "id": v["id"], "properties": props,
                             "geometry": {"type": "Point", "coordinates": [round(v["coord"]["lon"], 6), round(v["coord"]["lat"], 6)]}})
        else:
            venue_meta.append(props)

    # Orte ohne Koordinate bleiben als Feature mit geometry null (GeoJSON erlaubt das) erhalten
    for p in venue_meta:
        features.append({"type": "Feature", "id": p["id"], "properties": p, "geometry": None})

    data = {"meta": {
        "title": "Köln im Grünen | EventMap 2026",
        "source": "Veranstaltungsprogramm 2026, Amt für Landschaftspflege und Grünflächen, Stadt Köln (sk_473_25_veranstaltungsprogramm_2026_amt_67_barrierefrei.pdf, 148 Seiten)",
        "timezone": "Europe/Berlin", "year": 2026,
        "categories": CATEGORIES,
        "generator": "scripts/extract-events.py"},
        "events": events}
    out = ROOT / "src" / "data"
    out.mkdir(parents=True, exist_ok=True)
    (out / "events.json").write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    (out / "locations.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    # Unabhängige Vollständigkeitsprüfung: Jede Programmseite (46–146) mit Text muss von einem Eintrag abgedeckt sein.
    covered = {pg for e in events for pg in e["sourcePages"]}
    uncovered = [pg for pg in range(46, 147) if len(re.sub(r"\s+|\d+", "", PAGES[pg])) > 25 and pg not in covered]
    if uncovered:
        warn(f"Programmseiten mit Text ohne zugeordneten Eintrag: {uncovered}")
    report["uncoveredProgramPages"] = uncovered
    n_occ = sum(len(e["occurrences"]) for e in events)
    report["stats"] = {"events": len(events), "occurrences": n_occ,
                       "venues": len(venues), "venuesLocated": sum(1 for v in venues if v.get("coord")),
                       "eventsWithoutMarker": [e["id"] for e in events if not e["venueId"] or not any(
                           f["id"] == e["venueId"] and f["geometry"] for f in features)]}
    (ROOT / "scripts" / "extract-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(events)} Veranstaltungen, {n_occ} Termine, {len(report['warnings'])} Warnungen")


if __name__ == "__main__":
    main()
