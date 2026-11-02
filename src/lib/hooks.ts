import { useCallback, useEffect, useState } from 'react';
import type { UserLocation } from '../types';

const FAV_KEY = 'kig-eventmap-favorites-v1';

function readFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/** Favoriten (Event-IDs) nur lokal im Browser – ohne Registrierung. */
export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(readFavorites);
  const toggle = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(FAV_KEY, JSON.stringify([...next])); } catch { /* Speicher gesperrt: Favoriten gelten nur für diese Sitzung */ }
      return next;
    });
  }, []);
  return { favorites, toggle };
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    onChange();
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export type GeoStatus = 'idle' | 'loading' | 'active' | 'denied' | 'unavailable';

/** Standort wird ausschließlich nach ausdrücklicher Nutzeraktion (locate) abgefragt. */
export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<GeoStatus>('idle');

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) { setStatus('unavailable'); return; }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setStatus('active'); },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  const clear = useCallback(() => { setLocation(null); setStatus('idle'); }, []);
  return { location, status, locate, clear };
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
