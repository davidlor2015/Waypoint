import 'leaflet/dist/leaflet.css';
import { useMemo } from 'react';
import L, { type LatLngTuple } from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { Trip } from '../../shared/api/trips';
import { useGeocode } from '../../shared/hooks/useGeocode';



interface DestinationsMapProps {
  trips: Trip[];
}



// Defined once at module scope to avoid recreating on every render.
const amberPin = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#B45309;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.22)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -12],
});



export const DestinationsMap = ({ trips }: DestinationsMapProps) => {
  const destinations = useMemo(
    () => [...new Set(trips.map((t) => t.destination))],
    [trips],
  );

  const { pins, loading } = useGeocode(destinations);

  // Map each destination to the list of trip titles going there.
  const tripsByDestination = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const trip of trips) {
      const existing = map.get(trip.destination) ?? [];
      map.set(trip.destination, [...existing, trip.title]);
    }
    return map;
  }, [trips]);

  if (loading && pins.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 h-64 text-flint text-sm">
        <div className="w-4 h-4 rounded-full border-2 border-amber border-t-transparent animate-spin flex-shrink-0" />
        Locating destinations...
      </div>
    );
  }

  if (pins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-flint text-sm gap-1">
        <span aria-hidden="true">No destinations to map yet.</span>
      </div>
    );
  }

  const bounds: LatLngTuple[] = pins.map((p) => p.coords);

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [48, 48], maxZoom: 10 }}
      style={{ height: '300px', width: '100%', borderRadius: '12px' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {pins.map((pin) => (
        <Marker key={pin.destination} position={pin.coords} icon={amberPin}>
          <Popup>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem' }}>
              <p style={{ fontWeight: 700, marginBottom: '4px', color: '#1C1917' }}>
                {pin.destination}
              </p>
              <ul style={{ margin: 0, paddingLeft: '14px', color: '#78716C' }}>
                {(tripsByDestination.get(pin.destination) ?? []).map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
