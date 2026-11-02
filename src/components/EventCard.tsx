import { Heart, MapPin, UserCheck } from 'lucide-react';
import type { Item } from '../types';
import { CATEGORIES } from '../lib/categories';
import { dayParts, formatDateShort, formatTimeRange } from '../lib/dateUtils';
import { costLabel, formatDistance, isPast } from '../lib/eventFilters';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  item: Item;
  today: string;
  selected: boolean;
  favorite: boolean;
  distanceKm?: number;
  onSelect: (key: string) => void;
  onToggleFavorite: (eventId: string) => void;
}

export function EventCard({ item, today, selected, favorite, distanceKm, onSelect, onToggleFavorite }: Props) {
  const { event: e, occ, venue } = item;
  const primary = CATEGORIES[e.categories[0]];
  const past = isPast(item, today);
  const dp = dayParts(occ.date);
  const time = formatTimeRange(occ.startTime, occ.endTime, occ.approximate);
  const cost = costLabel(e);
  const place = venue ? [venue.name, venue.district].filter(Boolean).join(' · ') : e.meetingPoint;

  const when = occ.endDate
    ? `${formatDateShort(occ.date)} – ${formatDateShort(occ.endDate)}`
    : null;

  return (
    <li className={`card${selected ? ' is-selected' : ''}${past ? ' is-past' : ''}`} data-key={item.key}>
      <button
        type="button"
        className="card-main"
        onClick={() => onSelect(item.key)}
        aria-current={selected ? 'true' : undefined}
        aria-label={`${e.title}, ${when ?? `${dp.weekdayLong}, ${formatDateShort(occ.date)}`}${time ? `, ${time}` : ', Uhrzeit unbekannt'}, ${place}${cost ? `, ${cost}` : ''}${e.registration.required ? ', Anmeldung erforderlich' : ''}${past ? ', bereits vorbei' : ''}`}
      >
        <span className="card-date" aria-hidden="true">
          {occ.endDate ? (
            <>
              <span className="card-date-range">{formatDateShort(occ.date)}</span>
              <span className="card-date-to">bis</span>
              <span className="card-date-range">{formatDateShort(occ.endDate)}</span>
            </>
          ) : (
            <>
              <span className="card-date-wd">{dp.weekday}</span>
              <span className="card-date-day">{dp.day}</span>
              <span className="card-date-mo">{dp.month}</span>
            </>
          )}
        </span>
        <span className="card-body" aria-hidden="true">
          <span className="card-meta">
            <span className="card-cat" style={{ color: primary.color }}>
              <CategoryIcon id={e.categories[0]} size={13} />
              {primary.label}
            </span>
            <span className="card-time">{occ.daily ? `täglich ${time ?? 'Uhrzeit offen'}` : time ?? 'Uhrzeit offen'}</span>
          </span>
          <span className="card-title">{e.title}</span>
          <span className="card-place"><MapPin size={13} aria-hidden="true" /> {place}{distanceKm != null ? ` · ${formatDistance(distanceKm)}` : ''}</span>
          <span className="card-tags">
            {past && <span className="tag tag-muted">Vorbei</span>}
            {cost && <span className={`tag${e.cost.free ? ' tag-free' : ''}`}>{cost}</span>}
            {e.registration.required && <span className="tag"><UserCheck size={12} aria-hidden="true" /> Anmeldung</span>}
            {!venue && <span className="tag tag-muted">Ohne Kartenposition</span>}
          </span>
        </span>
      </button>
      <button
        type="button"
        className={`fav${favorite ? ' is-on' : ''}`}
        aria-pressed={favorite}
        aria-label={favorite ? `„${e.title}“ aus Favoriten entfernen` : `„${e.title}“ zu Favoriten hinzufügen`}
        onClick={() => onToggleFavorite(e.id)}
      >
        <Heart size={18} aria-hidden="true" fill={favorite ? 'currentColor' : 'none'} />
      </button>
    </li>
  );
}
