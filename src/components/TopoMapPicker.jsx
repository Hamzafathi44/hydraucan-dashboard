import React, { useState, useEffect } from 'react';
import {
  X as CloseIcon,
  MapPin,
  Trash2,
  Download,
  Plus,
  ClipboardPaste,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export default function TopoMapPicker({
  isOpen,
  onClose,
  onConfirm,
  initialPoints = []
}) {
  const [points, setPoints] = useState([]);
  const [manualX, setManualX] = useState('');
  const [manualY, setManualY] = useState('');
  const [zone, setZone] = useState('Maroc - Zone 1');

  useEffect(() => {
    if (isOpen) {
      setPoints(initialPoints || []);
    }
  }, [isOpen, initialPoints]);

  if (!isOpen) return null;

  // Extracts X and Y automatically from any text copied from TopoX.ma
  const parseAndAddCoordinates = (rawText) => {
    if (!rawText) return false;

    // Normalize French decimals (comma to dot) and remove spaces inside numbers
    const cleaned = rawText.replace(/,/g, '.');

    // Match numbers that look like Moroccan Lambert coordinates (typically 5 to 7 digits + decimals)
    // Or any pair of numbers in the copied text
    const numberMatches = cleaned.match(/-?\d+(\.\d+)?/g);

    if (numberMatches && numberMatches.length >= 2) {
      // Filter for typical Lambert X/Y values (> 1000) if present, otherwise take first two numbers
      const lambertCandidates = numberMatches.map(Number).filter((n) => n > 1000);
      const xVal = lambertCandidates.length >= 2 ? lambertCandidates[0] : Number(numberMatches[0]);
      const yVal = lambertCandidates.length >= 2 ? lambertCandidates[1] : Number(numberMatches[1]);

      const nextLabel = `P${points.length + 1}`;
      const newPoint = {
        id: Date.now(),
        label: nextLabel,
        x: Number(xVal.toFixed(2)),
        y: Number(yVal.toFixed(2)),
        z: 0,
        zone
      };

      setPoints((prev) => [...prev, newPoint]);
      setManualX(String(newPoint.x));
      setManualY(String(newPoint.y));
      toast.success(`${nextLabel} ajouté automatiquement (X: ${newPoint.x}, Y: ${newPoint.y})`);
      return true;
    }

    toast.error('Aucune coordonnée X/Y valide détectée dans le presse-papiers');
    return false;
  };

  // 1-Click Auto-Paste from Clipboard
  const handleAutoPasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      parseAndAddCoordinates(text);
    } catch (err) {
      toast.error('Veuillez autoriser le presse-papiers ou faire Ctrl+V dans le champ X');
    }
  };

  // If the user presses Ctrl+V directly inside the X input box, auto-split X and Y
  const handlePasteInInput = (e) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && /[\s,;:/|\t]/.test(pastedText.trim())) {
      e.preventDefault();
      parseAndAddCoordinates(pastedText);
    }
  };

  // Manual Add fallback
  const handleManualAdd = () => {
    const xNum = parseFloat(manualX.replace(',', '.'));
    const yNum = parseFloat(manualY.replace(',', '.'));

    if (isNaN(xNum) || isNaN(yNum)) {
      toast.error('Veuillez saisir des valeurs X et Y valides');
      return;
    }

    const nextLabel = `P${points.length + 1}`;
    setPoints([
      ...points,
      {
        id: Date.now(),
        label: nextLabel,
        x: Number(xNum.toFixed(2)),
        y: Number(yNum.toFixed(2)),
        z: 0,
        zone
      }
    ]);
    setManualX('');
    setManualY('');
    toast.success(`${nextLabel} ajouté`);
  };

  const handleRemovePoint = (id) => {
    setPoints(points.filter((p) => p.id !== id));
  };

  const handleExportTXT = () => {
    if (points.length === 0) {
      toast.error('Aucun point à exporter');
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
    toast.success('TXT exported');
  };

  const handleConfirm = () => {
    onConfirm(points);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-2 sm:p-6 backdrop-blur-md bg-slate-900/60">
      <div className="relative w-full max-w-6xl h-[95vh] sm:h-[92vh] flex flex-col rounded-2xl sm:rounded-[32px] shadow-2xl overflow-hidden bg-white/95 border border-white/40">
        
        {/* Header */}
        <div className="px-4 sm:px-8 py-3 flex justify-between items-center bg-gradient-to-b from-white to-white/80 border-b border-slate-100">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-500 ring-1 ring-cyan-500/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">TopoX Maroc</h3>
              <p className="text-[11px] sm:text-xs font-medium text-slate-500">
                1. Cliquez sur un point dans TopoX &rarr; 2. Copiez &rarr; 3. Cliquez sur "Coller X/Y Auto"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://topox.ma"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 flex items-center gap-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ouvrir TopoX</span>
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
        <div className="flex-grow w-full relative p-2 sm:p-3 bg-slate-50/50">
          <div className="w-full h-full rounded-2xl overflow-hidden ring-1 ring-slate-200/60 relative bg-white">
            <iframe
              src="https://topox.ma"
              title="TopoX Maroc"
              className="w-full h-full border-0"
              allow="geolocation; clipboard-write; clipboard-read"
              allowFullScreen
            />
          </div>
        </div>

        {/* Auto-Fill / Paste Bar */}
        <div className="px-4 sm:px-8 py-2.5 bg-slate-100/80 border-t border-slate-200 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAutoPasteFromClipboard}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm active:scale-95 transition"
          >
            <ClipboardPaste className="w-4 h-4" />
            Coller X/Y Auto
          </button>

          <select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700"
          >
            <option value="Maroc - Zone 1">Zone 1 (Nord)</option>
            <option value="Maroc - Zone 2">Zone 2 (Sud)</option>
            <option value="Maroc - Zone 3">Zone 3 (Sahara Nord)</option>
            <option value="Maroc - Zone 4">Zone 4 (Sahara Sud)</option>
          </select>

          <input
            type="text"
            placeholder="X (ou Ctrl+V ici)"
            value={manualX}
            onPaste={handlePasteInInput}
            onChange={(e) => setManualX(e.target.value)}
            className="w-32 sm:w-40 px-3 py-1.5 rounded-xl text-xs font-mono bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />

          <input
            type="text"
            placeholder="Y"
            value={manualY}
            onPaste={handlePasteInInput}
            onChange={(e) => setManualY(e.target.value)}
            className="w-32 sm:w-40 px-3 py-1.5 rounded-xl text-xs font-mono bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />

          <button
            type="button"
            onClick={handleManualAdd}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 transition"
          >
            + Ajouter
          </button>
        </div>

        {/* Points List */}
        <div className="px-4 sm:px-8 py-2.5 border-t border-slate-100 bg-white/90 max-h-28 overflow-y-auto">
          {points.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              Aucun point ajouté. Copiez un point depuis la carte TopoX puis cliquez sur "Coller X/Y Auto".
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {points.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]"
                >
                  <div>
                    <span className="font-bold text-slate-800 mr-2">{p.label}</span>
                    <span className="text-[10px] text-cyan-600 font-semibold">{p.zone}</span>
                    <div className="text-slate-600 font-mono">
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

        {/* Footer */}
        <div className="px-4 sm:px-8 py-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2 bg-white">
          <button
            onClick={handleExportTXT}
            disabled={points.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-40 transition"
          >
            <Download className="w-4 h-4" /> Export TXT
          </button>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-xs bg-white text-slate-600 border border-slate-200"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={points.length === 0}
              className="flex-1 sm:flex-none px-6 py-2 rounded-xl font-black text-white text-xs bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Valider ({points.length})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
