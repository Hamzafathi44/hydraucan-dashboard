import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { generateBulkSrmPdfBytes } from '../srmPdfGenerator';

export const SRMExcelImporter = () => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Helper to retrieve fields dynamically
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

  // Handles Excel Date formatting cleanly to preserve exact DD/MM/YYYY
  const parseDateToIso = (rawDate) => {
    if (!rawDate) return '';
    const str = String(rawDate).trim();

    if (str.includes('/') || str.includes('-')) {
      const sep = str.includes('/') ? '/' : '-';
      const parts = str.split(sep);
      
      if (parts.length === 3) {
        let [part1, part2, part3] = parts;
        
        // Ensure 4-digit year
        if (part3.length === 2) part3 = `20${part3}`;
        
        // Pad days and months
        part1 = part1.padStart(2, '0');
        part2 = part2.padStart(2, '0');

        // Check if raw input was already YYYY-MM-DD
        if (part1.length === 4) {
          return `${part1}-${part2}-${part3}`;
        }

        // If raw input was DD/MM/YYYY, convert to YYYY-MM-DD so srmPdfGenerator outputs DD/MM/YYYY
        return `${part3}-${part2}-${part1}`;
      }
    }
    return str;
  };

  // Sanitizes text for pdf-lib Helvetica font encoding
  const formatObservation = (text) => {
    if (!text) return 'FUITE';
    let clean = String(text).toUpperCase().trim();
    clean = clean.replace(/É|È|Ê|Ë/g, 'E');
    return clean;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage('1/4: Reading Excel file...');

    try {
      const data = await file.arrayBuffer();
      // Raw mode enabled to prevent Excel date auto-swapping
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

      setStatusMessage(`2/4: Processing ${rawRows.length} items...`);

      const formattedItems = rawRows.map(row => {
        const rawDate = getFieldValue(row, ['Date', 'date', 'DATE']);
        const dateIso = parseDateToIso(rawDate);

        const nCompteur = getFieldValue(row, ['N compteur', 'N° compteur', 'Ncompteur', 'Compteur', 'Ref', 'Tournee']);
        const adresse = getFieldValue(row, ['Adresse', 'adresse', 'Lieu']);
        const rawObs = getFieldValue(row, ['Observation', 'observation', 'Type', 'Nature']);
        
        const cleanObs = formatObservation(rawObs);
        const isFuiteSpeciale = cleanObs.includes('SPECIAL');

        return {
          date: dateIso,
          reference: String(nCompteur).trim(),
          adresse: String(adresse).trim(),
          type: cleanObs,
          obs1: cleanObs,
          obs2: '',
          material: isFuiteSpeciale ? 'pvc' : '', // Sets PVC when observation is FUITE SPECIALE
          mat_pvc: isFuiteSpeciale,               // Activates PVC checkbox
          fuite_can: isFuiteSpeciale,              // Switches canalisation on for special leak
          fuite_bra: !isFuiteSpeciale,             // Unchecks branchement when PVC special leak
          x: '',
          y: ''
        };
      }).filter(item => item.date || item.reference);

      if (formattedItems.length === 0) {
        alert("Could not recognize rows. Ensure 'Date' and 'N compteur' headers are present.");
        setLoading(false);
        setStatusMessage('');
        return;
      }

      setStatusMessage(`3/4: Generating PDF forms for ${formattedItems.length} items...`);

      const pdfBytes = await generateBulkSrmPdfBytes(formattedItems);

      setStatusMessage('4/4: Downloading PDF file...');

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Attachements_SRM_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatusMessage(`✅ Successfully generated PDF for ${formattedItems.length} items!`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert(`Error generating PDF: ${err.message || 'Make sure public/SRM.pdf exists'}`);
      setStatusMessage('❌ Error during processing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-cyan-500/40 rounded-2xl bg-slate-900/80 text-center max-w-xl mx-auto my-6 shadow-xl backdrop-blur-md">
      <h3 className="text-xl font-bold text-cyan-400 mb-2">
        SRM Excel Importer
      </h3>
      <p className="text-slate-300 text-sm mb-6">
        Upload your Excel file to automatically generate filled SRM PDF forms.
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
