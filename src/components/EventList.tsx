import { useEffect, useMemo, useRef } from 'react';
import { SearchX } from 'lucide-react';
import type { Item, UserLocation } from '../types';
import { monthLabel } from '../lib/dateUtils';
import { distanceKm, isOngoingRange } from '../lib/eventFilters';
import { EventCard } from './EventCard';

interface Props {
  items: Item[];
  today: string;
  selectedKey: string | null;
  favorites: ReadonlySet<string>;
  near: UserLocation | null;
  noUpcoming: boolean;
  hidden: boolean;
  onSelect: (key: string) => void;
  onToggleFavorite: (eventId: string) => void;
  onReset: () => void;
}

export function EventList({ items, today, selectedKey, favorites, near, noUpcoming, hidden, onSelect, onToggleFavorite, onReset }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Gruppierung nach Monat (nur bei Datumssortierung)
  const groups = useMemo(() => {
    if (near) return [{ label: null as string | null, items }];
    const map = new Map<string, Item[]>();
    for (const i of items) {
      const d = isOngoingRange(i, today) ? today : i.occ.date;
      const m = d.slice(0, 7);
      (map.get(m) ?? map.set(m, []).get(m)!).push(i);
    }
    return [...map].map(([m, list]) => ({ label: monthLabel(m) as string | null, items: list }));
  }, [items, near, today]);

  // Auswahl (z. B. per Kartenmarker) in die Liste scrollen
  useEffect(() => {
    if (!selectedKey || hidden) return;
    const el = ref.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(selectedKey)}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [selectedKey, hidden]);

  return (
    <div className="list-scroll" ref={ref} hidden={hidden}>
      <h2 className="sr-only">Veranstaltungsliste</h2>
      {noUpcoming && (
        <p className="notice">Für den Rest des Jahres 2026 sind keine weiteren Termine geplant. Hier sehen Sie das gesamte Programm.</p>
      )}
      {items.length === 0 ? (
        <div className="empty">
          <SearchX size={28} aria-hidden="true" />
          <p className="empty-title">Keine passenden Veranstaltungen</p>
          <p className="empty-text">Mit diesen Filtern gibt es keine Treffer. Lockern Sie die Auswahl oder setzen Sie die Filter zurück.</p>
          <button type="button" className="btn btn-secondary" onClick={onReset}>Filter zurücksetzen</button>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.label ?? 'nearby'} className="month-group">
            {g.label && <h3 className="month-heading">{g.label}</h3>}
            <ul className="card-list">
              {g.items.map((i) => (
                <EventCard
                  key={i.key}
                  item={i}
                  today={today}
                  selected={i.key === selectedKey}
                  favorite={favorites.has(i.event.id)}
                  distanceKm={near && i.venue?.lngLat ? distanceKm(near, i.venue.lngLat) : undefined}
                  onSelect={onSelect}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </ul>
          </section>
        ))
      )}
      <Footer />
    </div>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <p>Datenquelle: Veranstaltungsprogramm 2026, Amt für Landschaftspflege und Grünflächen, Stadt Köln.</p>
      <p>Angaben ohne Gewähr. Bitte aktuelle Veranstaltungsinformationen beim Veranstalter prüfen.</p>
      <p>Unabhängiger technischer Prototyp – kein offizieller Online-Dienst der Stadt Köln.</p>
    </footer>
  );
}
