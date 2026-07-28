import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { generateBulkSrmPdfBytes } from '../srmPdfGenerator';

export const SRMExcelImporter = () => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Flexible field finder
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

  // Strictly parses dates as DD/MM/YYYY
  const formatDateValue = (rawDate) => {
    if (!rawDate) return '';

    const str = String(rawDate).trim();

    // If string contains slash or dash (e.g. "01/05/2026" or "1-5-2026")
    if (str.includes('/') || str.includes('-')) {
      const separator = str.includes('/') ? '/' : '-';
      const parts = str.split(separator);

      if (parts.length === 3) {
        let [day, month, year] = parts;
        
        // Handle short year formats like "26" -> "2026"
        if (year.length === 2) year = `20${year}`;
        
        // Pad day and month with leading zeros
        day = day.padStart(2, '0');
        month = month.padStart(2, '0');

        // Returns YYYY-MM-DD so srmPdfGenerator can display it as DD/MM/YYYY
        return `${year}-${month}-${day}`;
      }
    }

    return str;
  };

  // Sanitizes accented characters so pdf-lib Helvetica standard font doesn't fail
  const sanitizeObservation = (text) => {
    if (!text) return 'FUITE';
    let cleanStr = String(text).toUpperCase().trim();

    // Replace accented É with standard E
    cleanStr = cleanStr.replace(/É|È|Ê|Ë/g, 'E');

    return cleanStr;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage('1/4: Reading Excel file...');

    try {
      const data = await file.arrayBuffer();
      // Keep cell dates disabled to prevent timezone auto-conversion
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
        const dateVal = formatDateValue(rawDate);

        const nCompteur = getFieldValue(row, ['N compteur', 'N° compteur', 'Ncompteur', 'Compteur', 'Ref', 'Tournee']);
        const adresse = getFieldValue(row, ['Adresse', 'adresse', 'Lieu']);
        const rawObs = getFieldValue(row, ['Observation', 'observation', 'Type', 'Nature']);
        
        const cleanObs = sanitizeObservation(rawObs);

        return {
          date: dateVal,
          reference: String(nCompteur).trim(),
          adresse: String(adresse).trim(),
          type: cleanObs,
          nature: cleanObs,
          type_autre: cleanObs.includes('SPECIAL'),
          material: '',
          x: '',
          y: ''
        };
      }).filter(item => item.date || item.reference);

      if (formattedItems.length === 0) {
        alert("Could not recognize rows. Check that your Excel table has 'Date' and 'N compteur' headers.");
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
