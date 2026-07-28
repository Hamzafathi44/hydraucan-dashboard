import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { generateBulkSrmPdfBytes } from '../srmPdfGenerator';

export const SRMExcelImporter = () => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Helper to extract fields flexibly
  const getFieldValue = (row, possibleNames) => {
    const keys = Object.keys(row);
    for (const name of possibleNames) {
      const foundKey = keys.find(k => k.trim().toLowerCase() === name.trim().toLowerCase());
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
        return row[foundKey];
      }
    }
    return '';
  };

  // Helper to format dates correctly without timezone shift
  const formatDateValue = (rawDate) => {
    if (!rawDate) return '';
    
    // If Excel gave a JS Date object
    if (rawDate instanceof Date) {
      const day = String(rawDate.getDate()).padStart(2, '0');
      const month = String(rawDate.getMonth() + 1).padStart(2, '0');
      const year = rawDate.getFullYear();
      return `${year}-${month}-${day}`;
    }

    // If it's a string like "1/5/2026" or "01/05/2026"
    const str = String(rawDate).trim();
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        let [d, m, y] = parts;
        if (y.length === 2) y = `20${y}`;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }

    return str;
  };

  // Helper to sanitize accents for standard PDF Helvetica font
  const sanitizeText = (text) => {
    if (!text) return '';
    return String(text)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Removes accents (É -> E, è -> e)
      .toUpperCase()
      .trim();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage('1/4: Reading Excel file...');

    try {
      const data = await file.arrayBuffer();
      // Notice: raw date strings preserved to prevent timezone shift
      const workbook = XLSX.read(data, { type: 'array', cellDates: false });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("Excel file is empty.");
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

      if (!rawRows || rawRows.length === 0) {
        alert("No rows found in the sheet.");
        setLoading(false);
        setStatusMessage('');
        return;
      }

      setStatusMessage(`2/4: Parsing ${rawRows.length} rows...`);

      const formattedItems = rawRows.map(row => {
        const rawDate = getFieldValue(row, ['Date', 'date', 'DATE']);
        const dateVal = formatDateValue(rawDate);

        const nCompteur = getFieldValue(row, ['N compteur', 'N° compteur', 'Ncompteur', 'Compteur', 'Ref', 'Tournee']);
        const adresse = getFieldValue(row, ['Adresse', 'adresse', 'Lieu']);
        const rawObs = getFieldValue(row, ['Observation', 'observation', 'Type', 'Nature']);
        
        // Sanitize observation text ("FUITE SPÉCIALE" becomes "FUITE SPECIALE")
        const cleanObs = sanitizeText(rawObs) || 'FUITE';

        return {
          date: dateVal,
          reference: String(nCompteur).trim(),
          adresse: String(adresse).trim(),
          type: cleanObs,
          nature: cleanObs,
          material: '',
          x: '',
          y: ''
        };
      }).filter(item => item.date || item.reference);

      if (formattedItems.length === 0) {
        alert("Could not recognize data rows. Please ensure column headers exist: Date, N compteur");
        setLoading(false);
        setStatusMessage('');
        return;
      }

      setStatusMessage(`3/4: Generating PDF for (${formattedItems.length}) items...`);

      const pdfBytes = await generateBulkSrmPdfBytes(formattedItems);

      setStatusMessage('4/4: Downloading PDF...');

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Attachements_SRM_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatusMessage(`✅ Generated PDF for ${formattedItems.length} items successfully!`);
    } catch (err) {
      console.error("Build Error:", err);
      alert(`Error generating PDF: ${err.message || 'Check SRM.pdf file in public'}`);
      setStatusMessage('❌ Error occurred during processing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-cyan-500/40 rounded-2xl bg-slate-900/80 text-center max-w-xl mx-auto my-6 shadow-xl backdrop-blur-md">
      <h3 className="text-xl font-bold text-cyan-400 mb-2">
        SRM Excel Attachment Importer
      </h3>
      <p className="text-slate-300 text-sm mb-6">
        Upload your Excel file to generate all filled SRM forms into a single PDF document.
      </p>

      <input 
        type="file" 
        accept=".xlsx, .xls, .csv" 
        onChange={handleFileUpload} 
        disabled={loading}
        id="srm-excel-input"
        className="hidden"
      />
      
      <label 
        htmlFor="srm-excel-input"
        className={`px-6 py-3.5 rounded-xl font-bold text-white transition-all duration-200 inline-block cursor-pointer shadow-lg ${
          loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95'
        }`}
      >
        {loading ? 'Processing...' : 'Upload Excel & Generate PDF'}
      </label>

      {statusMessage && (
        <p className="mt-4 text-sm font-semibold text-cyan-300 animate-pulse">
          {statusMessage}
        </p>
      )}
    </div>
  );
};

export default SRMExcelImporter;
