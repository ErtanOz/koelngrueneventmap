import type { Item } from '../types';

const CRLF = '\r\n';
const pad = (n: number) => String(n).padStart(2, '0');

const escapeText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Zeilen auf höchstens 75 Oktette falten (RFC 5545). */
function fold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > (out.length ? 74 : 75)) { out.push(cur); cur = ''; bytes = 0; }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join(CRLF + ' ');
}

const compactDate = (iso: string) => iso.replace(/-/g, '');
const compactLocal = (date: string, time: string) => `${compactDate(date)}T${time.replace(':', '')}00`;

/** UTC-Zeitstempel aus einem ISO-String mit Offset (z. B. 2026-03-29T16:00+02:00). */
function toUtcStamp(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function nextDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

const VTIMEZONE = [
  'BEGIN:VTIMEZONE', 'TZID:Europe/Berlin',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];

export function buildIcs(item: Item, shareUrl: string, now = new Date()): string {
  const { event: e, occ, venue } = item;
  const lines: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Köln im Grünen EventMap 2026//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  if (occ.startTime) lines.push(...VTIMEZONE);
  lines.push('BEGIN:VEVENT', `UID:${occ.id}@koeln-im-gruenen-eventmap`, `DTSTAMP:${toUtcStamp(now.toISOString())}`);

  if (occ.startTime) {
    lines.push(`DTSTART;TZID=Europe/Berlin:${compactLocal(occ.date, occ.startTime)}`);
    if (occ.endTime) lines.push(`DTEND;TZID=Europe/Berlin:${compactLocal(occ.date, occ.endTime)}`);
    // Täglich wiederkehrender Zeitraum (z. B. Ausstellung): gleiche Uhrzeit an jedem Tag bis zum letzten Tag
    if (occ.endDate && occ.end) lines.push(`RRULE:FREQ=DAILY;UNTIL=${toUtcStamp(occ.end)}`);
  } else {
    // Uhrzeit unbekannt: ganztägig – es wird keine Uhrzeit erfunden
    lines.push(`DTSTART;VALUE=DATE:${compactDate(occ.date)}`, `DTEND;VALUE=DATE:${compactDate(nextDay(occ.endDate ?? occ.date))}`);
  }

  const venueLine = venue
    ? [venue.name, [venue.street, [venue.postalCode, venue.district].filter(Boolean).join(' ')].filter(Boolean).join(', ')].filter(Boolean).join(', ')
    : null;
  const place = [e.meetingPoint, venueLine].filter(Boolean).join(' – ');
  const desc = [
    e.summary,
    !occ.startTime ? 'Uhrzeit im Programm nicht angegeben.' : null,
    occ.startTime && !occ.endTime ? 'Endzeit im Programm nicht angegeben.' : null,
    occ.note,
    `Treffpunkt: ${e.meetingPoint}`,
    e.registration.required
      ? `Anmeldung erforderlich${e.registration.deadline ? ` (${e.registration.deadline})` : ''}${e.registration.email ? `: ${e.registration.email}` : ''}`
      : null,
    `Quelle: Veranstaltungsprogramm 2026, Amt für Landschaftspflege und Grünflächen, Stadt Köln, S. ${e.sourcePages[0]}. Angaben ohne Gewähr.`,
  ].filter(Boolean).join('\n');

  lines.push(`SUMMARY:${escapeText(e.title)}`, `LOCATION:${escapeText(place)}`, `DESCRIPTION:${escapeText(desc)}`, `URL:${shareUrl}`);
  if (venue?.lngLat) lines.push(`GEO:${venue.lngLat[1]};${venue.lngLat[0]}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.map(fold).join(CRLF) + CRLF;
}

export function downloadIcs(item: Item, shareUrl: string) {
  const blob = new Blob([buildIcs(item, shareUrl)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${item.occ.id}.ics`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
