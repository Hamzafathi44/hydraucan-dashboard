import React from 'react';
import {
  X as CloseIcon,
  MapPin,
  ExternalLink,
  Check
} from 'lucide-react';

export default function TopoMapPicker({
  isOpen,
  onClose,
  onConfirm
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-2 sm:p-6 backdrop-blur-md bg-slate-900/60">
      <div className="relative w-full max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col rounded-2xl sm:rounded-[32px] shadow-2xl overflow-hidden bg-white/95 border border-white/40">
        
        {/* Header */}
        <div className="px-4 sm:px-8 py-3 sm:py-5 flex justify-between items-center bg-gradient-to-b from-white to-white/80 border-b border-slate-100">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-500 ring-1 ring-cyan-500/30">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black text-slate-900">TopoX Maroc</h3>
              <p className="text-[11px] sm:text-sm font-medium text-slate-500">
                Sélectionnez et exportez vos coordonnées via TopoX.ma
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://topox.ma"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 flex items-center gap-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Ouvrir sur TopoX.ma</span>
            </a>

            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 hover:bg-rose-50 transition"
            >
              <CloseIcon className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Embedded TopoX.ma */}
        <div className="flex-grow w-full relative p-2 sm:p-4 bg-slate-50/50">
          <div className="w-full h-full rounded-2xl overflow-hidden ring-1 ring-slate-200/60 relative bg-white">
            <iframe
              src="https://topox.ma"
              title="TopoX Maroc"
              className="w-full h-full border-0"
              allow="geolocation; clipboard-write"
              allowFullScreen
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-8 py-3 sm:py-4 border-t border-slate-100 flex justify-end items-center gap-2 bg-white/80">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
          >
            Fermer
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl font-black text-white text-xs bg-cyan-600 hover:bg-cyan-700 flex items-center justify-center gap-2 transition"
          >
            <Check className="w-4 h-4" /> Terminer
          </button>
        </div>

      </div>
    </div>
  );
}
