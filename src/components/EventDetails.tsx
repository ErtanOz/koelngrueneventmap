import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Accessibility as AccessibilityIcon, Bus, CalendarPlus, ChevronLeft, Clock, ExternalLink, Globe, Heart,
  Mail, MapPin, Phone, Route, Share2, UserCheck, Wallet, X,
} from 'lucide-react';
import type { Item, Venue } from '../types';
import { CATEGORIES } from '../lib/categories';
import { downloadIcs } from '../lib/calendarExport';
import { allItems, itemsByKey } from '../lib/data';
import { dayParts, formatDateLong, formatDateRange, formatDateShort, formatTimeRange } from '../lib/dateUtils';
import { isPast, recommendations } from '../lib/eventFilters';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  item: Item;
  today: string;
  favorite: boolean;
  variant: 'panel' | 'sheet';
  onToggleFavorite: (eventId: string) => void;
  onSelect: (key: string) => void;
  onClose: () => void;
}

export const shareUrlFor = (key: string) => `${window.location.origin}${window.location.pathname}?e=${encodeURIComponent(key)}`;
const telHref = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`;
const webHref = (w: string) => (/^https?:\/\//.test(w) ? w : `https://${w}`);

function locationNote(venue: Venue): string | null {
  switch (venue.precision) {
    case 'stop': return venue.name.startsWith('KVB-Haltestelle') ? null : 'Ungefähre Lage: Die Karte zeigt die nächstgelegene Haltestelle; der Treffpunkt liegt in unmittelbarer Nähe.';
    case 'junction': return 'Die Karte zeigt die im Programm genannte Straßenkreuzung.';
    case 'street': return 'Ungefähre Lage (Straßenmitte): Der genaue Treffpunkt ergibt sich aus der Treffpunktangabe.';
    case 'pdf': return 'Koordinaten laut Veranstaltungsprogramm.';
    default: return null;
  }
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="d-section">
      <h3 className="d-heading"><span className="d-icon" aria-hidden="true">{icon}</span>{title}</h3>
      <div className="d-body">{children}</div>
    </section>
  );
}

export function EventDetails({ item, today, favorite, variant, onToggleFavorite, onSelect, onClose }: Props) {
  const { event: e, occ, venue } = item;
  const [message, setMessage] = useState('');
  const topRef = useRef<HTMLDivElement>(null);
  const cat = CATEGORIES[e.categories[0]];
  const past = isPast(item, today);
  const time = formatTimeRange(occ.startTime, occ.endTime, occ.approximate);
  const dp = dayParts(occ.date);
  const hasPos = !!venue?.lngLat;
  const siblings = useMemo(() => e.occurrences.map((o) => itemsByKey.get(o.id)!).filter(Boolean), [e]);
  const recs = useMemo(() => recommendations(item, allItems, today), [item, today]);
  const r = e.registration;

  useEffect(() => { topRef.current?.scrollTo({ top: 0 }); setMessage(''); }, [item.key]);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const share = async () => {
    const url = shareUrlFor(item.key);
    try {
      if (navigator.share) { await navigator.share({ title: e.title, text: `${e.title} – ${formatDateLong(occ.date)}`, url }); return; }
      await navigator.clipboard.writeText(url);
      setMessage('Link in die Zwischenablage kopiert.');
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return;
      setMessage(`Link zum Kopieren: ${url}`);
    }
  };

  const [lon, lat] = venue?.lngLat ?? [0, 0];
  const osmRoute = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=%3B${lat}%2C${lon}`;
  const googleRoute = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  const mailSubject = encodeURIComponent(`Anmeldung: ${e.title} am ${formatDateShort(occ.date)}`);

  const dateLine = occ.endDate ? formatDateRange(occ.date, occ.endDate) : formatDateLong(occ.date);

  return (
    <article className={`details details-${variant}`} aria-labelledby="details-title">
      <div className="details-bar">
        <button type="button" className="back-btn" onClick={onClose}>
          {variant === 'panel' ? <><ChevronLeft size={18} aria-hidden="true" /> Zur Liste</> : <><X size={18} aria-hidden="true" /> Schließen</>}
        </button>
        <button
          type="button"
          className={`fav fav-inline${favorite ? ' is-on' : ''}`}
          aria-pressed={favorite}
          aria-label={favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          onClick={() => onToggleFavorite(e.id)}
        >
          <Heart size={20} aria-hidden="true" fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="details-scroll" ref={topRef}>
        <header className="details-head">
          <p className="eyebrow" style={{ color: cat.color }}>
            <CategoryIcon id={e.categories[0]} size={14} /> {e.kind}
          </p>
          <h2 id="details-title" className="details-title">{e.title}</h2>
          <p className="details-summary">{e.summary}</p>
          <ul className="cat-tags" aria-label="Kategorien">
            {e.categories.map((c) => (
              <li key={c}><span className="cat-dot" style={{ background: CATEGORIES[c].color }} aria-hidden="true" />{CATEGORIES[c].label}</li>
            ))}
          </ul>
          {past && <p className="notice notice-inline">Dieser Termin liegt in der Vergangenheit.</p>}
        </header>

        <div className="actions" role="group" aria-label="Aktionen">
          {hasPos && (
            <a className="btn btn-primary" href={osmRoute} target="_blank" rel="noopener noreferrer">
              <Route size={18} aria-hidden="true" /> Route planen<span className="sr-only"> (öffnet OpenStreetMap in neuem Tab)</span>
            </a>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => downloadIcs(item, shareUrlFor(item.key))}>
            <CalendarPlus size={18} aria-hidden="true" /> Zum Kalender
          </button>
          <button type="button" className="btn btn-secondary" onClick={share}>
            <Share2 size={18} aria-hidden="true" /> Teilen
          </button>
          {r.required && r.email && (
            <a className="btn btn-secondary" href={`mailto:${r.email}?subject=${mailSubject}`}>
              <UserCheck size={18} aria-hidden="true" /> Anmelden
            </a>
          )}
          {r.required && !r.email && r.url && (
            <a className="btn btn-secondary" href={r.url} target="_blank" rel="noopener noreferrer">
              <UserCheck size={18} aria-hidden="true" /> Anmelden<span className="sr-only"> (öffnet in neuem Tab)</span>
            </a>
          )}
        </div>
        <p className="share-msg" role="status">{message}</p>

        <Section icon={<Clock size={16} />} title="Termin">
          <p className="d-strong">{dateLine}</p>
          <p>
            {occ.daily ? `Täglich ${time ?? '(Uhrzeit im Programm nicht angegeben)'}` : time ?? 'Uhrzeit im Programm nicht angegeben'}
            {e.duration && !occ.endTime ? ` · Dauer ${e.duration}` : ''}
          </p>
          {occ.note && <p className="d-muted">{occ.note}</p>}
          {e.recurrence && (
            <p className="d-muted">Regelmäßiger Termin laut Programm: „{e.recurrence}“. Die Einzeltermine wurden daraus für 2026 berechnet – Feiertage und Ausfälle bitte beim Veranstalter prüfen.</p>
          )}
          {siblings.length > 1 && (
            <>
              <h4 className="d-sub">Alle Termine dieser Veranstaltung ({siblings.length})</h4>
              <ul className="date-chips">
                {siblings.map((s) => {
                  const p = dayParts(s.occ.date);
                  const t = formatTimeRange(s.occ.startTime, s.occ.endTime, s.occ.approximate);
                  return (
                    <li key={s.key}>
                      <button type="button" className="date-chip" aria-current={s.key === item.key ? 'true' : undefined} onClick={() => onSelect(s.key)}>
                        <span>{p.weekday}, {formatDateShort(s.occ.date)}</span>
                        {t && <span className="date-chip-time">{t}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <p className="d-muted">{dp.weekdayLong} · Zeitzone Europe/Berlin</p>
        </Section>

        <Section icon={<MapPin size={16} />} title="Ort und Treffpunkt">
          <p className="d-strong">{e.meetingPoint}</p>
          {venue && (
            <p>
              {venue.name}
              {(venue.street || venue.district) && <><br /><span className="d-muted">{[venue.street, [venue.postalCode, venue.district && `Köln-${venue.district}`].filter(Boolean).join(' ')].filter(Boolean).join(', ')}</span></>}
            </p>
          )}
          {venue?.lngLat && locationNote(venue) && <p className="d-muted">{locationNote(venue)}</p>}
          {!hasPos && (
            <p className="d-muted">
              {!venue
                ? 'Keine Kartenposition: Der Treffpunkt wird erst nach der Anmeldung bekannt gegeben.'
                : `Keine Kartenposition: ${venue.unlocatedReason ?? 'Ort nicht eindeutig lokalisierbar'}. Bitte die Treffpunktangabe beachten.`}
            </p>
          )}
          {hasPos && <p className="d-links"><a href={googleRoute} target="_blank" rel="noopener noreferrer">Ziel in Google Maps öffnen <ExternalLink size={13} aria-hidden="true" /></a></p>}
          {e.guide && <p className="d-muted">Leitung: {e.guide}</p>}
          <p className="d-muted">Veranstalter: {e.organizer}</p>
        </Section>

        <Section icon={<Wallet size={16} />} title="Kosten">
          {e.cost.free === true && <p className="d-strong">Kostenlos</p>}
          {e.cost.free === false && e.cost.adult != null && (
            <p>
              <span className="d-strong">{e.cost.adult} €</span> Erwachsene
              {e.cost.reduced != null && <><br /><span className="d-strong">{e.cost.reduced} €</span> ermäßigt <span className="d-muted">({e.cost.reducedFor})</span></>}
            </p>
          )}
          {e.cost.free === null && <p>Im Programm nicht angegeben.</p>}
          {e.cost.note && e.cost.free !== null && e.cost.note !== 'Die Teilnahme ist kostenlos.' && <p className="d-muted">{e.cost.note}</p>}
          {e.cost.note && e.cost.free === null && <p className="d-muted">{e.cost.note}</p>}
        </Section>

        <Section icon={<UserCheck size={16} />} title="Anmeldung">
          {r.required === true && <p className="d-strong">Anmeldung erforderlich{r.deadline ? ` – ${r.deadline}` : ''}</p>}
          {r.required === false && <p className="d-strong">Keine Anmeldung erforderlich</p>}
          {r.required === null && <p>Im Programm nicht angegeben.</p>}
          {r.note && <p className="d-muted">{r.note}</p>}
          {e.maxParticipants && <p className="d-muted">Höchstens {e.maxParticipants} Teilnehmende.</p>}
          {e.audience.length > 0 && <p className="d-muted">Zielgruppe: {e.audience.join(', ')}</p>}
          {r.required && (r.email || r.phone || r.url) && (
            <p className="d-links">
              {r.email && <a href={`mailto:${r.email}?subject=${mailSubject}`}><Mail size={14} aria-hidden="true" /> {r.email}</a>}
              {r.phone && <a href={telHref(r.phone)}><Phone size={14} aria-hidden="true" /> {r.phone}</a>}
              {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer"><Globe size={14} aria-hidden="true" /> {r.url.replace(/^https?:\/\//, '')}</a>}
            </p>
          )}
        </Section>

        <Section icon={<AccessibilityIcon size={16} />} title="Barrierefreiheit">
          {e.accessibility ? (
            <>
              <ul className="d-list">{e.accessibility.items.map((t) => <li key={t}>{t}</li>)}</ul>
              <p className="d-muted">Angabe laut Programm (Piktogramme, S. {e.accessibility.sourcePage}). Details zur Legende: S. 6–7.</p>
            </>
          ) : (
            <p>Im Programm keine Angabe zur Barrierefreiheit dieser Veranstaltung. Bitte beim Veranstalter nachfragen.</p>
          )}
        </Section>

        {e.transit.length > 0 && (
          <Section icon={<Bus size={16} />} title="Anreise mit dem ÖPNV">
            <ul className="d-list">{e.transit.map((t) => <li key={t}>{t}</li>)}</ul>
            <p className="d-muted">Haltestellen und Linien laut Programm; nächstgelegene Haltestellen, nicht zwingend der Treffpunkt.</p>
          </Section>
        )}

        {e.description && (
          <section className="d-section">
            <h3 className="d-heading">Beschreibung</h3>
            <div className="d-body"><p className="d-description">{e.description}</p></div>
          </section>
        )}

        {e.notes.length > 0 && (
          <section className="d-section">
            <h3 className="d-heading">Hinweise</h3>
            <div className="d-body"><ul className="d-list">{e.notes.map((n) => <li key={n}>{n}</li>)}</ul></div>
          </section>
        )}

        {e.contact && (e.contact.name || e.contact.phone || e.contact.email || e.contact.web) && (
          <section className="d-section">
            <h3 className="d-heading">Kontakt</h3>
            <div className="d-body">
              {e.contact.name && <p className="d-strong">{e.contact.name}</p>}
              <p className="d-links">
                {e.contact.phone && <a href={telHref(e.contact.phone)}><Phone size={14} aria-hidden="true" /> {e.contact.phone}</a>}
                {e.contact.email && <a href={`mailto:${e.contact.email}`}><Mail size={14} aria-hidden="true" /> {e.contact.email}</a>}
                {e.contact.web && <a href={webHref(e.contact.web)} target="_blank" rel="noopener noreferrer"><Globe size={14} aria-hidden="true" /> {e.contact.web.replace(/^https?:\/\//, '')}</a>}
              </p>
            </div>
          </section>
        )}

        {recs.length > 0 && (
          <section className="d-section">
            <h3 className="d-heading">Ähnliche Veranstaltungen</h3>
            <ul className="recs">
              {recs.map((s) => (
                <li key={s.key}>
                  <button type="button" onClick={() => onSelect(s.key)}>
                    <span className="recs-title">{s.event.title}</span>
                    <span className="recs-meta">
                      {s.occ.endDate ? `${formatDateShort(s.occ.date)} – ${formatDateShort(s.occ.endDate)}` : `${dayParts(s.occ.date).weekday}, ${formatDateShort(s.occ.date)}`}
                      {s.venue ? ` · ${s.venue.name}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="d-muted">Ausgewählt nach Kategorie, Ort, Veranstalter und zeitlicher Nähe.</p>
          </section>
        )}

        <p className="source-note">
          Quelle: Veranstaltungsprogramm 2026, Amt für Landschaftspflege und Grünflächen, Stadt Köln, PDF-Seite{e.sourcePages.length > 1 ? 'n' : ''} {e.sourcePages.join(', ')}.
          Angaben ohne Gewähr – bitte aktuelle Informationen beim Veranstalter prüfen.
        </p>
      </div>
    </article>
  );
}
