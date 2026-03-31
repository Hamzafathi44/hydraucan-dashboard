import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { X as CloseIcon, MapPin, Target, Navigation } from 'lucide-react';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const PrecisionIcon = L.divIcon({
  html: `<div style="width: 14px; height: 14px; background: #ef4444; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transform: translate(-50%, -50%);"></div>`,
  className: '',
  iconSize: [0, 0] // Centered exactly at coordinate
});
L.Marker.prototype.options.icon = PrecisionIcon;

function LocationMarker({ position, setPosition, autoLocate }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
    locationfound(e) {
      if (!position && autoLocate) {
        map.flyTo(e.latlng, 18);
      }
    }
  });

  useEffect(() => {
    if (autoLocate && !position) {
      map.locate({ setView: false, maxZoom: 18 });
    }
  }, [map, autoLocate, position]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

function MapLayerListener({ onLayerChange }) {
  useMapEvents({
    baselayerchange(e) {
      onLayerChange(e.name);
    }
  });
  return null;
}

export default function SrmMapPicker({ isOpen, onClose, onConfirm, initialLocation }) {
  const defaultCenter = [31.7917, -7.0926]; 
  const [position, setPosition] = useState(null);
  const [currentMapType, setCurrentMapType] = useState('Normal');
  
  useEffect(() => {
    if (isOpen) {
      if (initialLocation && initialLocation.x && initialLocation.y) {
        const x = parseFloat(initialLocation.x);
        const y = parseFloat(initialLocation.y);
        if (!isNaN(x) && !isNaN(y)) {
          setPosition({ lat: y, lng: x });
        } else {
          setPosition(null);
        }
      } else {
        setPosition(null);
      }
    }
  }, [isOpen, initialLocation]);

  if (!isOpen) return null;

  const handleAutoLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          alert("Erreur de géolocalisation: veuillez autoriser l'accès à votre position dans le navigateur.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("La géolocalisation n'est pas supportée par ce navigateur.");
    }
  };

  const handleConfirm = () => {
    if (position) {
      onConfirm({
        x: position.lng.toFixed(6),
        y: position.lat.toFixed(6),
        mapType: currentMapType
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-slate-900/60 transition-opacity duration-300">
      <div 
        className="relative w-full max-w-4xl h-[85vh] flex flex-col rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.3),_inset_0_1px_0_rgba(255,255,255,0.4)] overflow-hidden bg-white/95 border border-white/40 ring-1 ring-slate-900/5 backdrop-blur-2xl transition-transform duration-500 ease-out translate-y-0 scale-100"
        style={{ animation: 'mapModalAppear 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <style>{`
          @keyframes mapModalAppear {
            from { opacity: 0; transform: translateY(40px) scale(0.96); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .custom-map-container .leaflet-control-container .leaflet-control { border-radius: 12px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; }
        `}</style>
        
        {/* Header */}
        <div className="px-8 py-6 flex justify-between items-start bg-gradient-to-b from-white to-white/80 border-b border-slate-100">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent ring-1 ring-accent/30 shadow-inner">
              <MapPin className="w-6 h-6 drop-shadow-sm" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Sélectionner la Position</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Ajustez le marqueur avec précision sur la carte</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleAutoLocate}
              className="group h-10 px-4 hidden sm:flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 shadow-sm transition-all hover:bg-blue-100 hover:border-blue-300 active:scale-95 text-blue-600 font-bold text-sm"
              title="Ma position actuelle"
            >
              <Navigation className="w-4 h-4 fill-blue-600/20" /> <span>Me localiser</span>
            </button>
            <button 
              onClick={onClose}
              className="group w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 shadow-sm transition-all hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 active:scale-90"
            >
              <CloseIcon className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-grow w-full relative group p-4 bg-slate-50/50">
          <div className="w-full h-full rounded-2xl overflow-hidden ring-1 ring-slate-200/60 shadow-inner custom-map-container relative">
            <MapContainer 
              center={position ? [position.lat, position.lng] : defaultCenter} 
              zoom={position ? 18 : 6} 
              scrollWheelZoom={true} 
              className="w-full h-full z-0 font-sans"
            >
              <LayersControl position="bottomright">
                <LayersControl.BaseLayer checked name="Normal">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Satellite">
                  <TileLayer
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                </LayersControl.BaseLayer>
              </LayersControl>
              <LocationMarker position={position} setPosition={setPosition} autoLocate={!initialLocation?.x} />
              <MapLayerListener onLayerChange={setCurrentMapType} />
            </MapContainer>
            
            {/* Overlay instruction when no position */}
            {!position && (
               <div className="absolute inset-0 z-[400] flex items-center justify-center pointer-events-none bg-slate-900/5 backdrop-blur-[2px] transition-opacity duration-300">
                  <div className="px-6 py-4 rounded-2xl shadow-xl bg-white/95 text-slate-900 border border-white text-center transform -translate-y-4">
                    <Target className="w-8 h-8 mx-auto text-accent mb-2 animate-bounce" />
                    <p className="text-base font-bold">Localisation requise</p>
                    <p className="text-sm text-slate-500 font-medium">Cliquez sur la carte ou utilisez le bouton "Me localiser"</p>
                  </div>
               </div>
            )}

            {/* Mobile Auto Locate Button */}
            <div className="absolute top-4 left-4 z-[400] sm:hidden">
              <button 
                onClick={handleAutoLocate}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-md text-blue-600 active:scale-95 transition-transform"
                title="Ma position actuelle"
              >
                <Navigation className="w-5 h-5 fill-blue-600/20" />
              </button>
            </div>

            {/* Crosshair decoration to feel more "tool" like */}
            {position && (
              <div className="absolute top-4 right-4 z-[400] pointer-events-none bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 transition-all">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-700">GPS Actif</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/80">
          <div className="flex-1 w-full relative">
            {position ? (
              <div className="flex gap-4">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm transition-all hover:bg-white hover:shadow-md hover:border-slate-300 group">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-accent transition-colors">Longitude (X)</span>
                    <span className="font-mono text-base font-black text-slate-800 tracking-tight">{position.lng.toFixed(6)}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">X</div>
                </div>
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm transition-all hover:bg-white hover:shadow-md hover:border-slate-300 group">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-accent transition-colors">Latitude (Y)</span>
                    <span className="font-mono text-base font-black text-slate-800 tracking-tight">{position.lat.toFixed(6)}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">Y</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-rose-50/50 border border-rose-100 rounded-xl w-fit">
                 <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></div>
                 <span className="text-sm font-semibold text-rose-600">En attente des coordonnées...</span>
              </div>
            )}
          </div>
          
          <div className="flex w-full md:w-auto gap-3 items-center">
            <button 
              onClick={onClose}
              className="flex-1 md:flex-none px-6 py-3.5 rounded-xl font-bold transition-all bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm active:scale-95"
            >
              Annuler
            </button>
            <button 
              onClick={handleConfirm}
              disabled={!position}
              className="group flex-1 md:flex-none px-8 py-3.5 bg-ink text-white font-black tracking-wide rounded-xl shadow-[0_8px_16px_rgba(30,43,88,0.2)] hover:bg-[#152345] hover:shadow-[0_12px_24px_rgba(30,43,88,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 flex items-center gap-3"
            >
              <span>Valider les coordonnées</span>
              <Target className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
