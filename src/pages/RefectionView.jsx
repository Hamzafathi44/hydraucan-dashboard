import { useState } from 'react';
import { generateReportPDF } from '../pdfGenerator';
import { useRefections } from '../hooks/useRefections';
import { Wrench, FileDown, Save, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const RefectionView = () => {
  const { refections, loading, addRefection, deleteRefection } = useRefections();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    date: '',
    reference: '',
    type: 'Refection',
    materialUsed: '',
    terrainNature: '',
    l: '',
    L: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      date: '',
      reference: '',
      type: 'Refection',
      materialUsed: '',
      terrainNature: '',
      l: '',
      L: ''
    });
  };

  const handleSave = async () => {
    if (!formData.date || !formData.reference) {
      toast.error('Please fill in the date and reference');
      return;
    }
    setSaving(true);
    const result = await addRefection(formData);
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

  const handleGeneratePDF = () => {
    if (refections.length === 0) {
      toast.error('No entries to export');
      return;
    }
    const month = refections[0]?.date?.slice(0, 7) || 'Tous';
    generateReportPDF(refections, month);
  };

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

      {/* FORM CARD */}
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

          <div>
            <label className={labelClass}>Nature</label>
            <select name="terrainNature" value={formData.terrainNature} onChange={handleChange} className={inputClass}>
              <option value="">-- Select --</option>
              <option value="Masonry">Masonry</option>
              <option value="Painting">Painting</option>
              <option value="Tiling">Tiling</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Carpentry">Carpentry</option>
              <option value="Partition">Partition</option>
              <option value="Finishing">Finishing</option>
              <option value="Concrete">Concrete</option>
              <option value="Terrazzo">Terrazzo</option>
              <option value="C.D">C.D</option>
              <option value="T.N">T.N</option>
              <option value="Faience">Faience</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>l (Width) — m</label>
            <input name="l" type="number" step="0.01" value={formData.l} onChange={handleChange} placeholder="e.g. 0.60" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>L (Length) — m</label>
            <input name="L" type="number" step="0.01" value={formData.L} onChange={handleChange} placeholder="e.g. 15.00" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Area (m²) — auto</label>
            <input
              readOnly
              value={formData.l && formData.L ? (parseFloat(formData.l) * parseFloat(formData.L)).toFixed(2) : ''}
              placeholder="—"
              className={`${inputClass} bg-slate-950/60 text-cyan-400 font-semibold`}
            />
          </div>
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

      {/* TABLE CARD */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/60 rounded-2xl p-5 md:p-6 shadow-lg max-w-5xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <FileDown className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Saved Entries ({refections.length})
            </h3>
          </div>

          <button
            onClick={handleGeneratePDF}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-sm font-bold px-5 py-2 rounded-xl transition flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            Generate PDF
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : refections.length === 0 ? (
          <p className="text-center text-slate-500 py-10 text-sm">No entries yet</p>
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
                  <th className="text-center py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {refections.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800 hover:bg-white/5">
                    <td className="py-2 px-2">{r.date}</td>
                    <td className="py-2 px-2">{r.reference}</td>
                    <td className="py-2 px-2">{r.type}</td>
                    <td className="py-2 px-2 max-w-[220px] truncate">{r.materialUsed}</td>
                    <td className="py-2 px-2">{r.terrainNature}</td>
                    <td className="text-center py-2 px-2">{r.l}</td>
                    <td className="text-center py-2 px-2">{r.L}</td>
                    <td className="text-center py-2 px-2 text-cyan-400 font-semibold">
                      {r.l && r.L ? (parseFloat(r.l) * parseFloat(r.L)).toFixed(2) : ''}
                    </td>
                    <td className="text-center py-2 px-2">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg p-1.5 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};