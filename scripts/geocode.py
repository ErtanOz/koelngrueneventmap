#!/usr/bin/env python3
"""Einmaliges Geocoding der Veranstaltungsorte (Nominatim / OpenStreetMap).

Liest scripts/venues.json, fragt jede `query` genau einmal ab (Rate Limit: 1 Anfrage/s,
eigener User-Agent) und legt die Rohergebnisse in scripts/geocode-cache.json ab.
Bereits gecachte Anfragen werden nicht erneut gestellt. Die App selbst geocodiert nie.

    python scripts/geocode.py
"""
import json
import os
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
UA = "KoelnImGruenen-EventMap-Prototype/0.1 (einmalige Datenaufbereitung; GitHub Pages Projekt)"
VIEWBOX = "6.75,51.10,7.20,50.80"  # Raum Köln (links,oben,rechts,unten)

def search(q: str):
    params = urllib.parse.urlencode({
        "format": "jsonv2", "limit": 5, "q": q, "countrycodes": "de",
        "viewbox": VIEWBOX, "bounded": 1, "addressdetails": 0,
    })
    req = urllib.request.Request("https://nominatim.openstreetmap.org/search?" + params,
                                 headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def save_cache(path, cache):
    """Replace the cache only after the complete new JSON has reached disk."""
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent,
                                         prefix=path.name + ".", suffix=".tmp", delete=False) as f:
            temporary = Path(f.name)
            json.dump(cache, f, ensure_ascii=False, indent=1)
            f.flush()
            os.fsync(f.fileno())
        os.replace(temporary, path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def main():
    venues = json.loads((ROOT / "venues.json").read_text(encoding="utf-8"))
    cache_path = ROOT / "geocode-cache.json"
    cache = json.loads(cache_path.read_text(encoding="utf-8")) if cache_path.exists() else {}
    failures = 0
    for v in venues:
        q = (v.get("geocode") or {}).get("query")
        if not q or q in cache:
            continue
        try:
            res = search(q)
        except (OSError, urllib.error.URLError, json.JSONDecodeError) as e:
            # Failed requests stay uncached so the next run can retry them.
            failures += 1
            print("FEHLER", v["id"], e)
            time.sleep(2)
            continue
        cache[q] = [{k: r.get(k) for k in ("lat", "lon", "display_name", "category", "type", "osm_type", "osm_id")} for r in res]
        print(f'{v["id"]:28} {q!r} -> {len(res)} Treffer')
        save_cache(cache_path, cache)
        time.sleep(1.1)
    return 1 if failures else 0

if __name__ == "__main__":
    raise SystemExit(main())
