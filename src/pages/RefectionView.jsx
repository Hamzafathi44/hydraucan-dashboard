import { useState } from 'react';
import { generateReportPDF } from '../pdfGenerator';
import { Wrench, FileDown } from 'lucide-react';

function RefectionView() {
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

  const handleSubmit = () => {
    if (!formData.date || !formData.reference) {
      alert('Please fill in the date and reference');
      return;
    }
    generateReportPDF([formData], formData.date.slice(0, 7));
  };

  const inputClass =
    "w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition";
  const labelClass =
    "block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

  return (
    <section className="p-4 md:p-6" dir="ltr">
      {/* SECTION HEADER */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-white">
          Refection Works
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Record renovation and repair works — manual entry
        </p>
      </div>

      {/* MAIN CARD */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/60 rounded-2xl p-5 md:p-6 shadow-lg max-w-5xl">

        {/* Card title with icon */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            New Entry — Refection
          </h3>
        </div>

        {/* FIELDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Date */}
          <div>
            <label className={labelClass}>Date</label>
            <input
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          {/* Reference */}
          <div>
            <label className={labelClass}>Reference</label>
            <input
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="e.g. PLA-089/26"
              className={inputClass}
            />
          </div>

          {/* Type */}
          <div>
            <label className={labelClass}>Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="Refection">Refection</option>
              <option value="Leak">Leak</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          {/* Material Used — full width */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className={labelClass}>Material Used</label>
            <input
              name="materialUsed"
              value={formData.materialUsed}
              onChange={handleChange}
              placeholder="e.g. [Porcelain tile 60x60 (15m²) + Adhesive 25kg (3u)]"
              className={inputClass}
            />
          </div>

          {/* Nature */}
          <div>
            <label className={labelClass}>Nature</label>
            <select
              name="terrainNature"
              value={formData.terrainNature}
              onChange={handleChange}
              className={inputClass}
            >
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

          {/* l */}
          <div>
            <label className={labelClass}>l (Width) — m</label>
            <input
              name="l"
              type="number"
              step="0.01"
              value={formData.l}
              onChange={handleChange}
              placeholder="e.g. 0.60"
              className={inputClass}
            />
          </div>

          {/* L */}
          <div>
            <label className={labelClass}>L (Length) — m</label>
            <input
              name="L"
              type="number"
              step="0.01"
              value={formData.L}
              onChange={handleChange}
              placeholder="e.g. 15.00"
              className={inputClass}
            />
          </div>

          {/* Auto Area */}
          <div>
            <label className={labelClass}>Area (m²) — auto</label>
            <input
              readOnly
              value={
                formData.l && formData.L
                  ? (parseFloat(formData.l) * parseFloat(formData.L)).toFixed(2)
                  : ''
              }
              placeholder="—"
              className={`${inputClass} bg-slate-950/60 text-cyan-400 font-semibold`}
            />
          </div>
        </div>

        {/* BUTTON */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmit}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-sm font-bold px-6 py-2.5 rounded-xl transition flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            Generate PDF
          </button>
        </div>
      </div>
    </section>
  );
}

export default RefectionView;