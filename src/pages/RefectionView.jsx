import { useState, useMemo } from 'react';
import { generateReportPDF } from '../pdfGenerator';
import { useRefections } from '../hooks/useRefections';
import TopoMapPicker from '../components/TopoMapPicker';
import {
  Wrench, FileDown, Save, Trash2, Loader2, Search, Plus, X, MapPin
} from 'lucide-react';
import { toast } from 'sonner';

const NATURES = [
  'Masonry',
  'Painting',
  'Tiling',
  'Electrical',
  'Plumbing',
  'Carpentry',
  'Partition',
  'Finishing',
  'Concrete',
  'Terrazzo',
  'C.D',
  'T.N',
  'Faience'
];

export const RefectionView = () => {
  const { refections, loading, addRefection, deleteRefection } = useRefections();

  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapPoints, setMapPoints] = useState([]);

  const [formData, setFormData] = useState({
    date: '',
    reference: '',
    type: 'Refection',
    materialUsed: ''
  });

  const [measurements, setMeasurements] = useState([
    { l: '', L: '', nature: '' }
  ]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMeasurementChange = (index, field, value) => {
    const updated = [...measurements];
    updated[index][field] = value;
    setMeasurements(updated);
  };

  const addMeasurement = () => {
    setMeasurements([...measurements, { l: '', L: '', nature: '' }]);
  };

  const removeMeasurement = (index) => {
    if (measurements.length === 1) return;
    setMeasurements(measurements.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      date: '',
      reference: '',
      type: 'Refection',
      materialUsed: ''
    });
    setMeasurements([{ l: '', L: '', nature: '' }]);
    setMapPoints([]);
  };

  const handleSave = async () => {
    if (!formData.date || !formData.reference) {
      toast.error('Please fill in the date and reference');
      return;
    }

    const cleanMeasurements = measurements.filter(
      (m) => m.l !== '' && m.L !== '' && m.nature !== ''
    );

    if (cleanMeasurements.length === 0) {
      toast.error('Add at least one measurement (l, L, nature)');
      return;
    }

    setSaving(true);
    const result = await addRefection({
      ...formData,
      measurements: cleanMeasurements,
      points: mapPoints
    });
    setSaving(false);
    if (result.success) {
      toast.success('Entry saved');
      resetForm();
    } else {
      toast.error('Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    const result = await deleteRefection(id);
    if (result.success) toast.success('Deleted');
    else toast.error('Failed to delete');
  };

  const handleSingleDownload = (entry) => {
    const month = entry.date ? entry.date.slice(0, 7) : 'Tous';
    generateReportPDF([entry], month);
  };

  const handleGeneratePDF = () => {
    if (filtered.length === 0) {
      toast.error('No entries to export');
      return;
    }
    const month = filtered[0]?.date?.slice(0, 7) || 'Tous';
    generateReportPDF(filtered, month);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return refections;
    const q = search.toLowerCase();
    return refections.filter((r) => {
      const measurementsText = (r.measurements || [])
        .map((m) => `${m.l} ${m.L} ${m.nature || ''}`)
        .join(' ');
      return (
        (r.date || '').toLowerCase().includes(q) ||
        (r.reference || '').toLowerCase().includes(q) ||
        (r.type || '').toLowerCase().includes(q) ||
        (r.materialUsed || '').toLowerCase().includes(q) ||
        measurementsText.toLowerCase().includes(q)
      );
    });
  }, [refections, search]);

  const inputClass =
    "w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition";
  const labelClass =
    "block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

  return (
    <section className="p-4 md:p-6" dir="ltr">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-white">Refection Works</h2>
        <p className="text-sm text-slate-400 mt-1">
          Record renovation and repair works — manual entry
        </p>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/60 rounded-2xl p-5 md:p-6 shadow-lg max-w-5xl mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            New Entry — Refection
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Date</label>
            <input name="date" type="date" value={formData.date} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Reference</label>
            <input name="reference" value={formData.reference} onChange={handleChange} placeholder="e.g. PLA-089/26" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Type</label>
            <select name="type" value={formData.type} onChange={handleChange} className={inputClass}>
              <option value="Refection">Refection</option>
              <option value="Leak">Leak</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className={labelClass}>Material Used</label>
            <input name="materialUsed" value={formData.materialUsed} onChange={handleChange} placeholder="e.g. [Porcelain tile 60x60 (15m²) + Adhesive 25kg (3u)]" className={inputClass} />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <label className={labelClass}>Measurements (l × L — each with its own nature)</label>
            <button
              type="button"
              onClick={addMeasurement}
              className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Measurement
            </button>
          </div>

          <div className="space-y-2">
            {measurements.map((m, idx) => {
              const area =
                m.l && m.L
                  ? (parseFloat(m.l) * parseFloat(m.L)).toFixed(2)
                  : '';
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      value={m.l}
                      onChange={(e) => handleMeasurementChange(idx, 'l', e.target.value)}
                      placeholder="l (m)"
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      value={m.L}
                      onChange={(e) => handleMeasurementChange(idx, 'L', e.target.value)}
                      placeholder="L (m)"
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      readOnly
                      value={area}
                      placeholder="Area"
                      className={`${inputClass} bg-slate-950/60 text-cyan-400 font-semibold`}
                    />
                  </div>
                  <div className="col-span-4">
                    <select
                      value={m.nature}
                      onChange={(e) => handleMeasurementChange(idx, 'nature', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">-- Nature --</option>
                      {NATURES.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeMeasurement(idx)}
                      disabled={measurements.length === 1}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg p-2 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => setIsMapOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-sm font-bold transition"
          >
            <MapPin className="w-4 h-4" />
            {mapPoints.length > 0
              ? `Points (${mapPoints.length})`
              : 'Choose Location (Topo Map)'}
          </button>
          {mapPoints.length > 0 && (
            <span className="text-xs text-cyan-400 font-mono truncate max-w-xs">
              {mapPoints.map((p) => p.label).join(', ')}
            </span>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-sm font-bold px-6 py-2.5 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/60 rounded-2xl p-5 md:p-6 shadow-lg max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <FileDown className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Saved Entries ({filtered.length}{search && ` / ${refections.length}`})
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entries..."
                className="w-full sm:w-64 bg-slate-900/60 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <button
              onClick={handleGeneratePDF}
              className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-sm font-bold px-5 py-2 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <FileDown className="w-4 h-4" />
              Generate PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-500 py-10 text-sm">
            {search ? 'No matching entries' : 'No entries yet'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-left py-2 px-2">Ref</th>
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Material</th>
                  <th className="text-left py-2 px-2">Nature</th>
                  <th className="text-center py-2 px-2">l</th>
                  <th className="text-center py-2 px-2">L</th>
                  <th className="text-center py-2 px-2">Area</th>
                  <th className="text-center py-2 px-2">Pts</th>
                  <th className="text-center py-2 px-2">PDF</th>
                  <th className="text-center py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const mList =
                    r.measurements && r.measurements.length > 0
                      ? r.measurements
                      : [{ l: r.l || '', L: r.L || '', nature: r.terrainNature || r.nature || '' }];
                  const pointsCount = (r.points || []).length;

                  return mList.map((m, i) => {
                    const isFirst = i === 0;
                    const area =
                      m.l && m.L
                        ? (parseFloat(m.l) * parseFloat(m.L)).toFixed(2)
                        : '';
                    return (
                      <tr key={`${r.id}-${i}`} className="border-b border-slate-800 hover:bg-white/5">
                        {isFirst && (
                          <>
                            <td rowSpan={mList.length} className="py-2 px-2 align-top">{r.date}</td>
                            <td rowSpan={mList.length} className="py-2 px-2 align-top">{r.reference}</td>
                            <td rowSpan={mList.length} className="py-2 px-2 align-top">{r.type}</td>
                            <td rowSpan={mList.length} className="py-2 px-2 align-top max-w-[220px] truncate">{r.materialUsed}</td>
                          </>
                        )}
                        <td className="py-2 px-2">{m.nature}</td>
                        <td className="text-center py-2 px-2">{m.l}</td>
                        <td className="text-center py-2 px-2">{m.L}</td>
                        <td className="text-center py-2 px-2 text-cyan-400 font-semibold">{area}</td>
                        {isFirst && (
                          <>
                            <td rowSpan={mList.length} className="text-center py-2 px-2 align-top text-cyan-400 font-bold">
                              {pointsCount > 0 ? `${pointsCount}` : '—'}
                            </td>
                            <td rowSpan={mList.length} className="text-center py-2 px-2 align-top">
                              <button
                                onClick={() => handleSingleDownload(r)}
                                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg p-1.5 transition"
                                title="Download this entry as PDF"
                              >
                                <FileDown className="w-3.5 h-3.5" />
                              </button>
                            </td>
                            <td rowSpan={mList.length} className="text-center py-2 px-2 align-top">
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg p-1.5 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TopoMapPicker
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirm={(pts) => setMapPoints(pts)}
        initialPoints={mapPoints}
      />
    </section>
  );
};