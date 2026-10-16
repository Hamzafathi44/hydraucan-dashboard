import React, { useState, useEffect } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup, useMapEvents, LayersControl
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  X as CloseIcon, MapPin, Navigation, Trash2, Download, Plus
} from 'lucide-react';
import { wgs84ToLambertMarocZone1 } from '../utils/lambertMaroc';

const PinIcon = (label) =>
  L.divIcon({
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
        <div style="background:#ef4444; color:white; font-weight:bold; font-size:11px; padding:2px 8px; border-radius:6px; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.3);">${label}</div>
        <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid #ef4444; margin-top:-1px;"></div>
        <div style="width:8px; height:8px; background:#ef4444; border:2px solid white; border-radius:50%; box-shadow:0 1px 3px rgba(0,0,0,0.4); margin-top:-2px;"></div>
      </div>`,
    className: '',
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

export default function TopoMapPicker({
  isOpen,
  onClose,
  onConfirm,
  initialPoints = []
}) {
  const defaultCenter = [31.7917, -7.0926];
  const [points, setPoints] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setPoints(initialPoints || []);
    }
  }, [isOpen, initialPoints]);

  if (!isOpen) return null;

  const handleMapClick = (latlng) => {
    const lambert = wgs84ToLambertMarocZone1(latlng.lat, latlng.lng);
    const nextLabel = `P${points.length + 1}`;
    setPoints([
      ...points,
      {
        id: Date.now(),
        label: nextLabel,
        lat: latlng.lat,
        lng: latlng.lng,
        x: lambert.x,
        y: lambert.y,
        z: 0,
        zone: 'Maroc - Zone 1'
      }
    ]);
  };

  const handleRemovePoint = (id) => {
    setPoints(points.filter((p) => p.id !== id));
  };

  const handleAutoLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => handleMapClick({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => alert('Erreur de géolocalisation'),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      alert('Géolocalisation non supportée');
    }
  };

  const handleExportTXT = () => {
    if (points.length === 0) {
      alert('Aucun point à exporter');
      return;
    }
    const content = points
      .map((p) => `${p.label} ${p.zone}\nX : ${p.x} m\nY : ${p.y} m\nZ : ${p.z}\n`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `points-topo-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirm = () => {
    onConfirm(points);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-2 sm:p-6 backdrop-blur-md bg-slate-900/60">
      <div className="relative w-full max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col rounded-2xl sm:rounded-[32px] shadow-2xl overflow-hidden bg-white/95 border border-white/40">
        <div className="px-4 sm:px-8 py-3 sm:py-5 flex justify-between items-start bg-gradient-to-b from-white to-white/80 border-b border-slate-100">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-500 ring-1 ring-cyan-500/30">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black text-slate-900">Topo Map</h3>
              <p className="text-[11px] sm:text-sm font-medium text-slate-500">
                Tap on map to add points (Lambert Maroc Z1)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 hover:bg-rose-50 transition"
          >
            <CloseIcon className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-grow w-full relative p-2 sm:p-4 bg-slate-50/50">
          <div className="w-full h-full rounded-2xl overflow-hidden ring-1 ring-slate-200/60 relative">
            <MapContainer
              center={defaultCenter}
              zoom={6}
              scrollWheelZoom={true}
              className="w-full h-full z-0"
            >
              <LayersControl position="bottomright">
                <LayersControl.BaseLayer checked name="Topo">
                  <TileLayer
                    attribution='&copy; OpenTopoMap'
                    url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Satellite">
                  <TileLayer
                    attribution='&copy; Esri'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Normal">
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              <ClickHandler onMapClick={handleMapClick} />

              {points.map((p) => (
                <Marker key={p.id} position={[p.lat, p.lng]} icon={PinIcon(p.label)}>
                  <Popup>
                    <div style={{ fontFamily: 'system-ui', minWidth: 160 }}>
                      <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 6 }}>
                        — {p.label}
                      </div>
                      <div style={{ fontSize: 12, marginBottom: 4 }}>{p.zone} :</div>
                      <div style={{ fontSize: 12 }}>X : {p.x} m</div>
                      <div style={{ fontSize: 12 }}>Y : {p.y} m</div>
                      <div style={{ fontSize: 12 }}>Z : {p.z}</div>
                      <button
                        onClick={() => handleRemovePoint(p.id)}
                        style={{
                          marginTop: 8, color: '#ef4444', fontSize: 11,
                          fontWeight: 'bold', cursor: 'pointer',
                          background: 'transparent', border: 'none'
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="px-4 sm:px-8 py-3 sm:py-4 border-t border-slate-100 bg-white/80 max-h-32 overflow-y-auto">
          {points.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Aucun point ajouté</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {points.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px]"
                >
                  <div>
                    <div className="font-bold text-slate-800">{p.label}</div>
                    <div className="text-slate-500 font-mono">
                      X: {p.x} / Y: {p.y}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemovePoint(p.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 sm:px-8 py-3 sm:py-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2 bg-white/80">
          <button
            onClick={handleExportTXT}
            disabled={points.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-40 transition"
          >
            <Download className="w-4 h-4" /> Export TXT
          </button>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs bg-white text-slate-600 border border-slate-200"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={points.length === 0}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-white text-xs bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Valider ({points.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}