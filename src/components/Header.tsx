import { ExternalLink, Info } from 'lucide-react';
import { PROGRAM_URL } from '../lib/data';

export function Header({ onInfo }: { onInfo: () => void }) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true"><i /></span>
        <div className="brand-text">
          <h1 className="brand-title">Köln im Grünen <span className="brand-year">EventMap 2026</span></h1>
          <p className="brand-sub">Veranstaltungen 2026 entdecken</p>
        </div>
      </div>
      <nav className="header-nav" aria-label="Weitere Informationen">
        <a className="header-link" href={PROGRAM_URL} target="_blank" rel="noopener noreferrer">
          <span>Programm</span> <ExternalLink size={14} aria-hidden="true" />
          <span className="sr-only"> (offizielle Seite der Stadt Köln, öffnet in neuem Tab)</span>
        </a>
        <button type="button" className="icon-btn" onClick={onInfo} aria-haspopup="dialog" aria-label="Info zu dieser Anwendung">
          <Info size={20} aria-hidden="true" />
        </button>
      </nav>
    </header>
  );
}
