import { X } from 'lucide-react';
import { PROGRAM_URL, allEvents, allItems, venues } from '../lib/data';
import { Dialog } from './Dialog';

export function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const located = [...venues.values()].filter((v) => v.lngLat).length;
  return (
    <Dialog open={open} onClose={onClose} label="Info zu Köln im Grünen EventMap 2026" className="modal">
      <div className="modal-head">
        <h2 className="modal-title">Über diese Anwendung</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Info schließen"><X size={20} aria-hidden="true" /></button>
      </div>
      <div className="modal-body">
        <p>
          <strong>Köln im Grünen | EventMap 2026</strong> macht das Veranstaltungsprogramm 2026 des Amtes für Landschaftspflege und Grünflächen
          der Stadt Köln auf einer Karte entdeckbar: {allEvents.length} Veranstaltungen mit {allItems.length} Terminen an {located} verorteten Plätzen.
        </p>
        <p className="callout">
          Dies ist ein <strong>unabhängiger technischer Prototyp</strong> und kein offizieller, von der Stadt Köln freigegebener Online-Dienst.
        </p>
        <h3>Datenquelle</h3>
        <p>
          Alle Angaben stammen aus dem Veranstaltungsprogramm 2026 (Amt für Landschaftspflege und Grünflächen, Stadt Köln, 148 Seiten).
          Jede Veranstaltung nennt ihre PDF-Seite. Angaben ohne Gewähr – bitte aktuelle Informationen beim Veranstalter prüfen.
          Fehlende Angaben (z. B. Uhrzeit, Preis) sind als „nicht angegeben“ gekennzeichnet und wurden nicht ergänzt.
        </p>
        <p><a href={PROGRAM_URL} target="_blank" rel="noopener noreferrer">Offizielles Programm der Stadt Köln (externe Seite)</a></p>
        <h3>Barrierefreiheit der Veranstaltungen</h3>
        <p>
          Die Angaben stammen aus den Piktogrammen am Ende der jeweiligen Programmeinträge. Fehlt ein Piktogramm,
          liegt keine Angabe vor. Laut Programm erfolgt die Teilnahme an Veranstaltungen auf eigene Gefahr.
        </p>
        <h3>Karte und Datenschutz</h3>
        <ul>
          <li>Kartendaten © OpenStreetMap-Mitwirkende. Beim Anzeigen der Karte lädt Ihr Browser Kartenkacheln von tile.openstreetmap.org; dabei wird technisch bedingt Ihre IP-Adresse an den Kartenanbieter übermittelt.</li>
          <li>Keine Cookies, kein Tracking, keine Analyse, kein Login.</li>
          <li>Favoriten werden nur lokal in Ihrem Browser gespeichert.</li>
          <li>Der Standort wird nur abgefragt, wenn Sie „In meiner Nähe“ wählen, und nicht gespeichert oder übertragen.</li>
          <li>Orte wurden einmalig mit OpenStreetMap-Daten verortet. Wo ein Treffpunkt nicht eindeutig lokalisierbar ist, gibt es keinen Kartenmarker – die Veranstaltung bleibt in der Liste.</li>
        </ul>
      </div>
    </Dialog>
  );
}
