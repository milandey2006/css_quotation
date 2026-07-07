"use client";
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet's default marker icon paths break under Next.js bundling -- point them
// at the CDN copies instead of relying on webpack to resolve local asset paths.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// A pulsing colored dot marker (green = office, indigo = client site) -- gives the
// "Find My"-style live feel instead of a static pin.
const makeDotIcon = (color) => L.divIcon({
  className: '',
  html: `
    <span style="position:relative; display:flex; align-items:center; justify-content:center; width:22px; height:22px;">
      <span style="position:absolute; inset:0; border-radius:9999px; background:${color}; opacity:0.35; animation: live-pulse 1.6s ease-out infinite;"></span>
      <span style="position:relative; width:14px; height:14px; border-radius:9999px; background:${color}; border:2px solid white; box-shadow:0 1px 3px rgba(0,0,0,0.4);"></span>
    </span>
    <style>
      @keyframes live-pulse {
        0% { transform: scale(1); opacity: 0.45; }
        100% { transform: scale(2.4); opacity: 0; }
      }
    </style>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11],
});

const officeIcon = makeDotIcon('#10b981'); // emerald
const clientIcon = makeDotIcon('#6366f1'); // indigo

// Pans/flies to the focused point whenever it changes, without remounting the map.
// Depends on the primitive id/lat/lng (not the focusPoint object itself) -- the
// object is rebuilt every second by the parent's ticking elapsed-time clock, and
// keying off the object reference caused the map to re-fly (and fight the user's
// own pan/zoom) once a second even though the actual location never moved.
function FlyToFocus({ id, lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (id != null && lat != null && lng != null) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
    }
  }, [id, lat, lng, map]);
  return null;
}

const DEFAULT_CENTER = [19.1197, 72.8468]; // Andheri East, Mumbai -- fallback when no locations yet

const formatElapsed = (timestamp, now) => {
  const diffMs = now - new Date(timestamp);
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
};

export default function LiveMap({ points, focusPoint, now }) {
  const initialCenter = useRef(
    points.length > 0
      ? [points[0].lat, points[0].lng]
      : DEFAULT_CENTER
  );

  return (
    <MapContainer
      center={initialCenter.current}
      zoom={points.length > 0 ? 13 : 11}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToFocus id={focusPoint?.id} lat={focusPoint?.lat} lng={focusPoint?.lng} />
      {points.map(p => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={p.isOffice ? officeIcon : clientIcon}>
          <Popup>
            <div style={{ fontSize: 13 }}>
              <strong>{p.employeeId}</strong>
              <br />
              {p.isOffice ? 'Office' : (p.clientName || 'Client site')}
              <br />
              <span style={{ color: '#059669', fontWeight: 600 }}>{formatElapsed(p.punchTimestamp, now)}</span> on shift
              <br />
              <span style={{ color: '#94a3b8', fontSize: 11 }}>Location from punch-in</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
