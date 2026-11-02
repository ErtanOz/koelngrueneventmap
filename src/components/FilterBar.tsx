import { useState } from 'react';
import { ChevronDown, Heart, LocateFixed, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import type { CategoryId, Filters, TimeFilter } from '../types';
import { CATEGORIES } from '../lib/categories';
import { monthLabel } from '../lib/dateUtils';
import { CATEGORY_ORDER, activeFilterCount } from '../lib/eventFilters';
import { monthsWithEvents, venues } from '../lib/data';
import type { GeoStatus } from '../lib/hooks';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  filters: Filters;
  defaultFilters: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
  resultCount: number;
  noUpcoming: boolean;
  geoStatus: GeoStatus;
  nearActive: boolean;
  onToggleNear: () => void;
  favoritesCount: number;
  onOpenSheet: () => void;
  compact: boolean;
}

const TIME_OPTIONS: { kind: Exclude<TimeFilter['kind'], 'month'>; label: string }[] = [
  { kind: 'upcoming', label: 'Kommende' },
  { kind: 'all', label: 'Alle Termine' },
  { kind: 'today', label: 'Heute' },
  { kind: 'week', label: 'Diese Woche' },
  { kind: 'weekend', label: 'Dieses Wochenende' },
];

const GEO_MESSAGES: Partial<Record<GeoStatus, string>> = {
  loading: 'Standort wird ermittelt …',
  denied: 'Standortfreigabe abgelehnt. Die Liste bleibt nach Datum sortiert.',
  unavailable: 'Standort konnte nicht ermittelt werden. Die Liste bleibt nach Datum sortiert.',
};

export function SearchField({ value, onChange, compact }: { value: string; onChange: (v: string) => void; compact: boolean }) {
  return (
    <div className="search">
      <Search size={18} aria-hidden="true" className="search-icon" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={compact ? 'Veranstaltung suchen …' : 'Titel, Ort, Stadtteil oder Veranstalter suchen …'}
        aria-label="Veranstaltungen durchsuchen"
        autoComplete="off"
        enterKeyHint="search"
      />
      {value && (
        <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="Suche leeren">
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function TimeChips({ filters, onChange, noUpcoming }: Pick<Props, 'filters' | 'onChange' | 'noUpcoming'>) {
  const isMonth = filters.time.kind === 'month';
  return (
    <div className="chip-row" role="group" aria-label="Zeitraum">
      {TIME_OPTIONS.filter((o) => !(noUpcoming && o.kind === 'upcoming')).map((o) => (
        <button
          key={o.kind}
          type="button"
          className="chip"
          aria-pressed={filters.time.kind === o.kind}
          onClick={() => onChange({ ...filters, time: { kind: o.kind } })}
        >
          {o.label}
        </button>
      ))}
      <label className={`chip chip-select${isMonth ? ' is-on' : ''}`}>
        <span className="sr-only">Monat auswählen</span>
        <select
          value={filters.time.kind === 'month' ? filters.time.month : ''}
          onChange={(e) => onChange({ ...filters, time: e.target.value ? { kind: 'month', month: e.target.value } : { kind: 'all' } })}
        >
          <option value="">Monat wählen</option>
          {monthsWithEvents.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </label>
    </div>
  );
}

export function CategoryChips({ filters, onChange }: Pick<Props, 'filters' | 'onChange'>) {
  const toggle = (c: CategoryId) => {
    const has = filters.categories.includes(c);
    onChange({ ...filters, categories: has ? filters.categories.filter((x) => x !== c) : [...filters.categories, c] });
  };
  return (
    <div className="chip-row" role="group" aria-label="Kategorie">
      {CATEGORY_ORDER.map((c) => (
        <button key={c} type="button" className="chip chip-cat" aria-pressed={filters.categories.includes(c)} onClick={() => toggle(c)}>
          <span className="chip-dot" style={{ background: CATEGORIES[c].color }}><CategoryIcon id={c} size={11} /></span>
          {CATEGORIES[c].label}
        </button>
      ))}
    </div>
  );
}

export function ToggleChips({ filters, onChange, favoritesCount, variant = 'all' }: Pick<Props, 'filters' | 'onChange' | 'favoritesCount'> & { variant?: 'quick' | 'more' | 'all' }) {
  const toggleCat = (c: CategoryId) => onChange({ ...filters, categories: filters.categories.includes(c) ? filters.categories.filter((x) => x !== c) : [...filters.categories, c] });
  return (
    <>
      {variant !== 'more' && (
        <>
          <button type="button" className="chip" aria-pressed={filters.free} onClick={() => onChange({ ...filters, free: !filters.free })}>Kostenlos</button>
          <button type="button" className="chip" aria-pressed={filters.family} onClick={() => onChange({ ...filters, family: !filters.family })}>Für Familien</button>
          {variant === 'quick' && <button type="button" className="chip" aria-pressed={filters.categories.includes('fuehrungen')} onClick={() => toggleCat('fuehrungen')}>Führungen</button>}
        </>
      )}
      {variant !== 'quick' && (
        <>
          <button type="button" className="chip" aria-pressed={filters.registration} onClick={() => onChange({ ...filters, registration: !filters.registration })}>Anmeldung erforderlich</button>
          <button type="button" className="chip" aria-pressed={filters.favoritesOnly} onClick={() => onChange({ ...filters, favoritesOnly: !filters.favoritesOnly })}>
            <Heart size={13} aria-hidden="true" /> Favoriten{favoritesCount ? ` (${favoritesCount})` : ''}
          </button>
        </>
      )}
    </>
  );
}

export function NearButton({ geoStatus, nearActive, onToggleNear }: Pick<Props, 'geoStatus' | 'nearActive' | 'onToggleNear'>) {
  return (
    <>
      <button type="button" className="chip chip-near" aria-pressed={nearActive} onClick={onToggleNear} disabled={geoStatus === 'loading'}>
        <LocateFixed size={14} aria-hidden="true" /> In meiner Nähe
      </button>
      <span className="sr-only" role="status">{GEO_MESSAGES[geoStatus] ?? (nearActive ? 'Veranstaltungen nach Entfernung sortiert.' : '')}</span>
    </>
  );
}

export function FilterBar(props: Props) {
  const { filters, onChange, onReset, resultCount, compact, onOpenSheet, geoStatus, nearActive, onToggleNear, favoritesCount } = props;
  const venueName = filters.venueId ? venues.get(filters.venueId)?.name : null;
  const n = activeFilterCount(filters, props.defaultFilters);
  const changed = n > 0 || filters.query.trim() !== '';
  const geoMessage = GEO_MESSAGES[geoStatus];
  const [moreOpen, setMoreOpen] = useState(false);
  const moreCount = filters.categories.filter((c) => c !== 'fuehrungen').length + (filters.registration ? 1 : 0) + (filters.favoritesOnly ? 1 : 0);

  return (
    <div className="filterbar">
      <div className="search-row">
        <SearchField compact={compact} value={filters.query} onChange={(query) => onChange({ ...filters, query })} />
        {compact && (
          <button type="button" className="btn-filter" onClick={onOpenSheet} aria-haspopup="dialog">
            <SlidersHorizontal size={18} aria-hidden="true" />
            <span>Filter</span>
            {n > 0 && <span className="badge" aria-label={`${n} aktiv`}>{n}</span>}
          </button>
        )}
      </div>

      {compact ? (
        <div className="chip-scroll">
          <TimeChips filters={filters} onChange={onChange} noUpcoming={props.noUpcoming} />
          <div className="chip-row">
            <ToggleChips filters={filters} onChange={onChange} favoritesCount={favoritesCount} variant="quick" />
            <NearButton geoStatus={geoStatus} nearActive={nearActive} onToggleNear={onToggleNear} />
          </div>
        </div>
      ) : (
        <div className="filter-groups">
          <TimeChips filters={filters} onChange={onChange} noUpcoming={props.noUpcoming} />
          <div className="chip-row" role="group" aria-label="Schnellfilter">
            <ToggleChips filters={filters} onChange={onChange} favoritesCount={favoritesCount} variant="quick" />
            <NearButton geoStatus={geoStatus} nearActive={nearActive} onToggleNear={onToggleNear} />
            <button type="button" className="chip chip-more" aria-expanded={moreOpen} aria-controls="more-filters" onClick={() => setMoreOpen((o) => !o)}>
              <SlidersHorizontal size={14} aria-hidden="true" /> Mehr Filter{moreCount ? ` (${moreCount})` : ''}
              <ChevronDown size={14} aria-hidden="true" className={moreOpen ? 'flip' : ''} />
            </button>
          </div>
          {moreOpen && (
            <div id="more-filters" className="more-filters">
              <div className="filter-group"><h2 className="filter-label">Kategorie</h2><CategoryChips filters={filters} onChange={onChange} /></div>
              <div className="filter-group"><h2 className="filter-label">Weitere</h2><div className="chip-row" role="group" aria-label="Weitere Filter"><ToggleChips filters={filters} onChange={onChange} favoritesCount={favoritesCount} variant="more" /></div></div>
            </div>
          )}
        </div>
      )}

      {geoMessage && <p className="hint" role="status">{geoMessage}</p>}

      {venueName && (
        <p className="venue-focus">
          <span>Ort: <strong>{venueName}</strong></span>
          <button type="button" className="link-btn" onClick={() => onChange({ ...filters, venueId: null })}>Alle Orte <X size={14} aria-hidden="true" /></button>
        </p>
      )}

      <div className="result-row">
        <p className="result-count" aria-live="polite" aria-atomic="true">
          <strong>{resultCount}</strong> {resultCount === 1 ? 'Termin' : 'Termine'} gefunden
        </p>
        {changed && (
          <button type="button" className="link-btn" onClick={onReset}><RotateCcw size={14} aria-hidden="true" /> Filter zurücksetzen</button>
        )}
      </div>
    </div>
  );
}
