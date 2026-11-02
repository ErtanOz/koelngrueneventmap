import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { List, Map as MapIcon, X } from 'lucide-react';
import type { CategoryId, Filters, Item } from './types';
import { allItems, itemsByKey } from './lib/data';
import { todayISO } from './lib/dateUtils';
import { CATEGORY_ORDER, EMPTY_FILTERS, filterItems, lastDay, sortItems } from './lib/eventFilters';
import { useFavorites, useMediaQuery, useUserLocation } from './lib/hooks';
import { AboutDialog } from './components/AboutDialog';
import { Dialog } from './components/Dialog';
import { EventDetails } from './components/EventDetails';
import { EventList } from './components/EventList';
import { CategoryChips, FilterBar, NearButton, TimeChips, ToggleChips } from './components/FilterBar';
import { Header } from './components/Header';
import { MapView, type PinData } from './components/MapView';

/** Deep Link: ?e=<Termin-ID> (oder ?event=<Veranstaltungs-ID> → nächster Termin). Funktioniert ohne Server-Routing. */
function selectionFromUrl(today: string): string | null {
  const q = new URLSearchParams(window.location.search);
  const e = q.get('e');
  if (e && itemsByKey.has(e)) return e;
  const ev = q.get('event');
  if (ev) {
    const list = allItems.filter((i) => i.event.id === ev).sort((a, b) => a.occ.date.localeCompare(b.occ.date));
    return (list.find((i) => lastDay(i) >= today) ?? list[0])?.key ?? null;
  }
  return null;
}

export default function App() {
  const today = useMemo(todayISO, []);
  const isDesktop = useMediaQuery('(min-width: 900px)');
  const noUpcoming = useMemo(() => !allItems.some((i) => lastDay(i) >= today), [today]);
  const defaultFilters = useMemo<Filters>(() => ({ ...EMPTY_FILTERS, time: noUpcoming ? { kind: 'all' } : { kind: 'upcoming' } }), [noUpcoming]);

  const [selectedKey, setSelectedKey] = useState<string | null>(() => selectionFromUrl(today));
  const [filters, setFilters] = useState<Filters>(() => {
    const sel = selectionFromUrl(today);
    const item = sel ? itemsByKey.get(sel) : null;
    // Deep Link auf vergangenen Termin: Gesamtprogramm zeigen, damit der Termin in der Liste sichtbar ist
    return item && lastDay(item) < today ? { ...defaultFilters, time: { kind: 'all' } } : defaultFilters;
  });
  const [view, setView] = useState<'list' | 'map'>('list');
  const [filterSheet, setFilterSheet] = useState(false);
  const [about, setAbout] = useState(false);
  const [flyTo, setFlyTo] = useState<{ venueId: string; nonce: number } | null>(() => {
    // Deep Link: Karte direkt auf den Ort der ausgewählten Veranstaltung ausrichten
    const venue = selectedKey ? itemsByKey.get(selectedKey)?.venue : null;
    return venue?.lngLat ? { venueId: venue.id, nonce: 1 } : null;
  });
  const { favorites, toggle: toggleFavorite } = useFavorites();
  const geo = useUserLocation();
  const nearActive = geo.status === 'active' && !!geo.location;

  // ---- Auswahl & URL --------------------------------------------------------------
  const pushedRef = useRef(false);
  const select = useCallback((key: string) => {
    setSelectedKey(key);
    const u = new URL(window.location.href);
    u.searchParams.set('e', key);
    const url = u.search;
    if (new URLSearchParams(window.location.search).get('e') !== key) {
      // Nur der erste Wechsel von „Liste“ zu „Details“ erzeugt einen Verlaufseintrag (Zurück schließt die Details);
      // weitere Wechsel (andere Termine, Empfehlungen) ersetzen ihn.
      if (new URLSearchParams(window.location.search).has('e')) window.history.replaceState(null, '', url);
      else { window.history.pushState(null, '', url); pushedRef.current = true; }
    }
    const venue = itemsByKey.get(key)?.venue;
    if (venue?.lngLat) setFlyTo((f) => ({ venueId: venue.id, nonce: (f?.nonce ?? 0) + 1 }));
  }, []);

  const closeDetails = useCallback(() => {
    if (pushedRef.current) { pushedRef.current = false; window.history.back(); }
    else {
      const u = new URL(window.location.href);
      u.searchParams.delete('e');
      window.history.replaceState(null, '', u.pathname + u.search);
      setSelectedKey(null);
    }
  }, []);

  useEffect(() => {
    const onPop = () => { pushedRef.current = false; setSelectedKey(selectionFromUrl(todayISO())); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const selected: Item | null = selectedKey ? itemsByKey.get(selectedKey) ?? null : null;

  // ---- Filtern / Sortieren ------------------------------------------------------------
  const filtered = useMemo(() => filterItems(allItems, filters, today, favorites), [filters, today, favorites]);
  const sorted = useMemo(() => sortItems(filtered, today, nearActive ? geo.location : null), [filtered, today, nearActive, geo.location]);

  // Karte nutzt dieselbe Filterlogik, aber ohne Ortsfokus (sonst verschwänden die übrigen Marker)
  const mapItems = useMemo(() => filterItems(allItems, { ...filters, venueId: null }, today, favorites), [filters, today, favorites]);
  const pins = useMemo<PinData[]>(() => {
    const byVenue = new Map<string, Item[]>();
    for (const i of mapItems) if (i.venue?.lngLat) (byVenue.get(i.venue.id) ?? byVenue.set(i.venue.id, []).get(i.venue.id)!).push(i);
    return [...byVenue.values()].map((list) => {
      const counts = new Map<CategoryId, number>();
      for (const i of list) counts.set(i.event.categories[0], (counts.get(i.event.categories[0]) ?? 0) + 1);
      const category = CATEGORY_ORDER.filter((c) => counts.has(c)).sort((a, b) => counts.get(b)! - counts.get(a)!)[0];
      return { venue: list[0].venue!, count: list.length, category };
    });
  }, [mapItems]);

  const activeVenueId = filters.venueId ?? selected?.venue?.id ?? null;

  const onPinSelect = useCallback((venueId: string) => {
    const atVenue = mapItems.filter((i) => i.venue?.id === venueId);
    if (atVenue.length === 1) {
      select(atVenue[0].key);
      return;
    }
    setFilters((f) => ({ ...f, venueId: f.venueId === venueId ? null : venueId }));
    if (selectedKey) closeDetails();
    if (!isDesktop) setView('list');
  }, [mapItems, select, selectedKey, closeDetails, isDesktop]);

  const resetFilters = useCallback(() => setFilters(defaultFilters), [defaultFilters]);
  const toggleNear = useCallback(() => (nearActive ? geo.clear() : geo.locate()), [nearActive, geo]);

  const filterProps = {
    filters, defaultFilters, onChange: setFilters, onReset: resetFilters, resultCount: sorted.length, noUpcoming,
    geoStatus: geo.status, nearActive, onToggleNear: toggleNear, favoritesCount: favorites.size,
  };

  const showDetailsPanel = isDesktop && selected;

  return (
    <div className="app">
      <Header onInfo={() => setAbout(true)} />

      <main className="layout" data-view={view}>
        <div className="filters-area" hidden={!!showDetailsPanel}>
          <FilterBar {...filterProps} compact={!isDesktop} onOpenSheet={() => setFilterSheet(true)} />
        </div>

        <div className="list-area">
          <EventList
            items={sorted}
            today={today}
            selectedKey={selectedKey}
            favorites={favorites}
            near={nearActive ? geo.location : null}
            noUpcoming={noUpcoming}
            hidden={!!showDetailsPanel}
            onSelect={select}
            onToggleFavorite={toggleFavorite}
            onReset={resetFilters}
          />
          {showDetailsPanel && selected && (
            <EventDetails
              item={selected}
              today={today}
              favorite={favorites.has(selected.event.id)}
              variant="panel"
              onToggleFavorite={toggleFavorite}
              onSelect={select}
              onClose={closeDetails}
            />
          )}
        </div>

        <div className="map-area">
          <MapView pins={pins} activeVenueId={activeVenueId} userLocation={nearActive ? geo.location : null} flyTo={flyTo} onPinSelect={onPinSelect} />
        </div>
      </main>

      <footer className="app-footer">
        <span>Datenquelle: Veranstaltungsprogramm 2026, Amt für Landschaftspflege und Grünflächen, Stadt Köln.</span>
        <span>Angaben ohne Gewähr. Bitte aktuelle Veranstaltungsinformationen beim Veranstalter prüfen.</span>
        <button type="button" className="link-btn" onClick={() => setAbout(true)}>Unabhängiger Prototyp – Hinweise</button>
      </footer>

      {!isDesktop && (
        <nav className="tabbar" aria-label="Ansicht wählen">
          <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={20} aria-hidden="true" /> Liste</button>
          <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}><MapIcon size={20} aria-hidden="true" /> Karte</button>
        </nav>
      )}

      {/* Mobil: Details als Bottom Sheet */}
      <Dialog open={!isDesktop && !!selected} onClose={closeDetails} label="Veranstaltungsdetails" className="sheet">
        {selected && (
          <EventDetails
            item={selected}
            today={today}
            favorite={favorites.has(selected.event.id)}
            variant="sheet"
            onToggleFavorite={toggleFavorite}
            onSelect={select}
            onClose={closeDetails}
          />
        )}
      </Dialog>

      {/* Mobil: alle Filter */}
      <Dialog open={filterSheet && !isDesktop} onClose={() => setFilterSheet(false)} label="Filter" className="sheet sheet-filters">
        <div className="modal-head">
          <h2 className="modal-title">Filter</h2>
          <button type="button" className="icon-btn" onClick={() => setFilterSheet(false)} aria-label="Filter schließen"><X size={20} aria-hidden="true" /></button>
        </div>
        <div className="modal-body filter-sheet">
          <div className="filter-group"><h3 className="filter-label">Zeitraum</h3><TimeChips filters={filters} onChange={setFilters} noUpcoming={noUpcoming} /></div>
          <div className="filter-group"><h3 className="filter-label">Kategorie</h3><CategoryChips filters={filters} onChange={setFilters} /></div>
          <div className="filter-group">
            <h3 className="filter-label">Weitere</h3>
            <div className="chip-row" role="group" aria-label="Weitere Filter">
              <ToggleChips filters={filters} onChange={setFilters} favoritesCount={favorites.size} />
              <NearButton geoStatus={geo.status} nearActive={nearActive} onToggleNear={toggleNear} />
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" onClick={resetFilters}>Zurücksetzen</button>
          <button type="button" className="btn btn-primary" onClick={() => setFilterSheet(false)}>{sorted.length} {sorted.length === 1 ? 'Termin' : 'Termine'} anzeigen</button>
        </div>
      </Dialog>

      <AboutDialog open={about} onClose={() => setAbout(false)} />
    </div>
  );
}
