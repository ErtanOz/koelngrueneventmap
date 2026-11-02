import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { RotateCcw } from 'lucide-react';
import type { CategoryId, UserLocation, Venue } from '../types';
import { CATEGORIES } from '../lib/categories';
import { prefersReducedMotion } from '../lib/hooks';
import { CategoryIcon } from './CategoryIcon';

export interface PinData { venue: Venue; count: number; category: CategoryId }

interface Cluster { key: string; lngLat: [number, number]; pins: PinData[]; count: number }

interface Props {
  pins: PinData[];
  activeVenueId: string | null;
  userLocation: UserLocation | null;
  flyTo: { venueId: string; nonce: number } | null;
  onPinSelect: (venueId: string) => void;
}

// Der Worker wird von Vite als eigene Datei gebündelt; MapLibre leitet die URL sonst aus dem eigenen Modulpfad ab.
maplibregl.setWorkerUrl(workerUrl);

const KOELN_CENTER: [number, number] = [6.9603, 50.9375];
const CLUSTER_RADIUS_PX = 46;

const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>-Mitwirkende',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-saturation': -0.4, 'raster-contrast': -0.08, 'raster-brightness-min': 0.04 } }],
};

const LOCALE = {
  'NavigationControl.ZoomIn': 'Vergrößern',
  'NavigationControl.ZoomOut': 'Verkleinern',
  'NavigationControl.ResetBearing': 'Nach Norden ausrichten',
  'AttributionControl.ToggleAttribution': 'Quellenangabe ein- oder ausblenden',
  'AttributionControl.MapFeedback': 'Kartenfeedback',
  'FullscreenControl.Enter': 'Vollbild',
  'FullscreenControl.Exit': 'Vollbild beenden',
  'Map.Title': 'Karte',
};

function computeClusters(map: maplibregl.Map, pins: PinData[]): Cluster[] {
  const pts = pins.map((p) => ({ p, px: map.project(p.venue.lngLat as [number, number]) }));
  const used = new Set<string>();
  const out: Cluster[] = [];
  for (const a of pts) {
    if (used.has(a.p.venue.id)) continue;
    const members = pts.filter((b) => !used.has(b.p.venue.id) && Math.hypot(a.px.x - b.px.x, a.px.y - b.px.y) <= CLUSTER_RADIUS_PX);
    for (const m of members) used.add(m.p.venue.id);
    const count = members.reduce((s, m) => s + m.p.count, 0);
    const lng = members.reduce((s, m) => s + (m.p.venue.lngLat![0] * m.p.count), 0) / count;
    const lat = members.reduce((s, m) => s + (m.p.venue.lngLat![1] * m.p.count), 0) / count;
    const single = members.length === 1;
    out.push({
      key: single ? `pin:${a.p.venue.id}` : `cluster:${members.map((m) => m.p.venue.id).sort().join('|')}`,
      lngLat: single ? (a.p.venue.lngLat as [number, number]) : [lng, lat],
      pins: members.map((m) => m.p),
      count,
    });
  }
  return out;
}

export function MapView({ pins, activeVenueId, userLocation, flyTo, onPinSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hosts = useRef(new Map<string, { el: HTMLDivElement; marker: maplibregl.Marker | null }>());
  const needsFit = useRef(true);
  const pinsRef = useRef(pins);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const [ready, setReady] = useState(false);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  pinsRef.current = pins;

  const refreshClusters = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    setClusters(computeClusters(map, pinsRef.current));
  }, []);

  const fitToPins = useCallback((animate: boolean) => {
    const map = mapRef.current;
    if (!map) return;
    const list = pinsRef.current;
    const opts = { padding: { top: 70, right: 60, bottom: 70, left: 60 }, maxZoom: 14, duration: animate && !prefersReducedMotion() ? 600 : 0 };
    if (list.length === 0) { map.easeTo({ center: KOELN_CENTER, zoom: 10.5, duration: opts.duration }); return; }
    const bounds = new maplibregl.LngLatBounds();
    for (const p of list) bounds.extend(p.venue.lngLat as [number, number]);
    if (list.length === 1) map.easeTo({ center: list[0].venue.lngLat as [number, number], zoom: 14, duration: opts.duration });
    else map.fitBounds(bounds, opts);
  }, []);

  // Karte einmalig anlegen
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: KOELN_CENTER,
      zoom: 10.5,
      minZoom: 8,
      maxZoom: 18,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: { compact: true },
      locale: LOCALE,
    });
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 90, unit: 'metric' }), 'bottom-left');
    mapRef.current = map;
    setReady(true);
    map.on('moveend', refreshClusters);
    map.on('zoomend', refreshClusters);

    const ro = new ResizeObserver(() => {
      map.resize();
      if (needsFit.current && containerRef.current && containerRef.current.clientWidth > 0) {
        needsFit.current = false;
        fitToPins(false);
      }
      refreshClusters();
    });
    ro.observe(containerRef.current);
    const markerHosts = hosts.current;
    return () => {
      ro.disconnect();
      for (const h of markerHosts.values()) h.marker?.remove();
      markerHosts.clear();
      userMarker.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [fitToPins, refreshClusters]);

  // Pins geändert (Filter) → Cluster neu berechnen; erstes Mal auf Treffer zoomen
  useEffect(() => {
    if (!ready) return;
    if (needsFit.current && containerRef.current && containerRef.current.clientWidth > 0) {
      needsFit.current = false;
      fitToPins(false);
    }
    refreshClusters();
  }, [pins, ready, fitToPins, refreshClusters]);

  // Marker-Hosts mit der Clusterliste abgleichen
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const keys = new Set(clusters.map((c) => c.key));
    for (const [k, h] of hosts.current) {
      if (!keys.has(k)) { h.marker?.remove(); hosts.current.delete(k); }
    }
    for (const c of clusters) {
      const h = hosts.current.get(c.key);
      if (!h) continue;
      if (!h.marker) h.marker = new maplibregl.Marker({ element: h.el, anchor: 'center' }).setLngLat(c.lngLat).addTo(map);
      else h.marker.setLngLat(c.lngLat);
    }
  }, [clusters]);

  // Zum ausgewählten Ort fliegen
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyTo) return;
    const v = pinsRef.current.find((p) => p.venue.id === flyTo.venueId)?.venue;
    if (!v?.lngLat) return;
    needsFit.current = false; // Eine ausdrückliche Auswahl (auch per Deep Link) hat Vorrang vor der Startansicht
    const zoom = Math.max(map.getZoom(), 14);
    if (prefersReducedMotion()) map.jumpTo({ center: v.lngLat, zoom });
    else map.flyTo({ center: v.lngLat, zoom, duration: 700, essential: false });
  }, [flyTo]);

  // Eigener Standort (nur nach Nutzeraktion)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    userMarker.current?.remove();
    userMarker.current = null;
    if (!userLocation) return;
    const el = document.createElement('div');
    el.className = 'user-dot';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', 'Ihr Standort');
    userMarker.current = new maplibregl.Marker({ element: el }).setLngLat([userLocation.lon, userLocation.lat]).addTo(map);
  }, [userLocation, ready]);

  const hostFor = (key: string, active: boolean, isCluster: boolean) => {
    let h = hosts.current.get(key);
    if (!h) {
      h = { el: document.createElement('div'), marker: null };
      hosts.current.set(key, h);
    }
    h.el.style.zIndex = active ? '4' : isCluster ? '2' : '1';
    return h.el;
  };

  const zoomToCluster = (c: Cluster) => {
    const map = mapRef.current;
    if (!map) return;
    const b = new maplibregl.LngLatBounds();
    for (const p of c.pins) b.extend(p.venue.lngLat as [number, number]);
    map.fitBounds(b, { padding: 90, maxZoom: 16, duration: prefersReducedMotion() ? 0 : 500 });
  };

  return (
    <div className="map-wrap">
      <div ref={containerRef} className="map" role="region" aria-label="Karte der Veranstaltungsorte" />
      <button type="button" className="map-reset" onClick={() => fitToPins(true)}>
        <RotateCcw size={15} aria-hidden="true" /> Ansicht zurücksetzen
      </button>
      {clusters.map((c) => {
        const single = c.pins.length === 1;
        const active = c.pins.some((p) => p.venue.id === activeVenueId);
        const host = hostFor(c.key, active, !single);
        if (single) {
          const p = c.pins[0];
          const color = CATEGORIES[p.category].color;
          return createPortal(
            <button
              type="button"
              className={`pin${active ? ' is-active' : ''}`}
              style={{ ['--pin' as string]: color }}
              aria-label={`${p.venue.name}: ${p.count} ${p.count === 1 ? 'Termin' : 'Termine'}`}
              aria-pressed={active}
              onClick={() => onPinSelect(p.venue.id)}
            >
              <CategoryIcon id={p.category} size={15} />
              {p.count > 1 && <span className="pin-count">{p.count}</span>}
              <span className="pin-label">{p.venue.name}</span>
            </button>,
            host,
            c.key,
          );
        }
        return createPortal(
          <button
            type="button"
            className={`cluster${active ? ' is-active' : ''}`}
            aria-label={`Gruppe aus ${c.pins.length} Orten mit ${c.count} Terminen. Zum Hineinzoomen aktivieren.`}
            onClick={() => zoomToCluster(c)}
          >
            {c.count}
          </button>,
          host,
          c.key,
        );
      })}
    </div>
  );
}
