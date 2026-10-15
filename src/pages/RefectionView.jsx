import { useState } from 'react';
import { generateReportPDF } from '../utils/pdfGenerator';

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
    "w-full bg-[#0F1B2D] border border-[#1E2F4A] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition";
  const labelClass =
    "block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5";

  return (
    <section className="bg-[#0B1424] min-h-screen p-4 md:p-6" dir="ltr">
      {/* SECTION HEADER */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-white">
          Refection Works
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Record renovation and repair works — manual entry
        </p>
      </div>

      {/* MAIN CARD */}
      <div className="bg-[#0F1B2D] border border-[#1E2F4A] rounded-2xl p-5 md:p-6 shadow-lg max-w-5xl">
        {/* Card title with icon */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            New Entry — Refection
          </h3>
        </div>

        {/* FIELDS GRID */}
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
              className={`${inputClass} bg-[#0B1424] text-emerald-400 font-semibold`}
            />
          </div>
        </div>

        {/* BUTTON */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Generate PDF
          </button>
        </div>
      </div>
    </section>
  );
}

export default RefectionView;