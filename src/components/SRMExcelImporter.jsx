import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { generateBulkSrmPdfBytes } from '../srmPdfGenerator';

export const SRMExcelImporter = () => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // دالة لمطابقة عناوين الأعمدة بمرونة عالية
  const getFieldValue = (row, possibleNames) => {
    const keys = Object.keys(row);
    for (const name of possibleNames) {
      const foundKey = keys.find(k => k.trim().toLowerCase() === name.trim().toLowerCase());
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
        return row[foundKey];
      }
    }
    return '';
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage('1/4: جاري قراءة ملف Excel...');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("ملف الإكسل فارغ.");
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rawRows || rawRows.length === 0) {
        alert("لم يتم العثور على أسطر بيانات داخل الشيت الأول.");
        setLoading(false);
        setStatusMessage('');
        return;
      }

      setStatusMessage(`2/4: تحليل البيانات المخرجة (${rawRows.length} سطر)...`);

      // استخراج الأعمدة وتوافقها مع نظام SRM
      const formattedItems = rawRows.map(row => {
        let dateVal = getFieldValue(row, ['Date', 'date', 'DATE']);
        if (dateVal instanceof Date) {
          dateVal = dateVal.toISOString().split('T')[0];
        }

        const tournee = getFieldValue(row, ['Tournée', 'tournée', 'Tournee', 'tournee', 'N° Tournée', 'Ref', 'Reference', 'N°', 'ID']);
        const adresse = getFieldValue(row, ['Adresse', 'adresse', 'Lieu', 'Localisation']);
        const natureTerrain = getFieldValue(row, ['Nature terrain', 'nature terrain', 'Nature Terrain', 'Terrain', 'Material', 'Matériau']);
        const typeVal = getFieldValue(row, ['Type', 'type', 'Nature', 'nature']) || 'Fuite';
        const xVal = getFieldValue(row, ['X', 'x', 'Coord X', 'Longitude']);
        const yVal = getFieldValue(row, ['Y', 'y', 'Coord Y', 'Latitude']);

        return {
          date: String(dateVal).trim(),
          reference: String(tournee).trim(),
          adresse: String(adresse).trim(),
          material: String(natureTerrain).trim(),
          type: String(typeVal).trim(),
          x: String(xVal).trim(),
          y: String(yVal).trim()
        };
      }).filter(item => item.date || item.reference || item.adresse);

      if (formattedItems.length === 0) {
        alert("لم يتم التعرف على الأعمدة. تأكد من أن السطر الأول بالجدول يحتوي على العناوين مثل: Date, Tournée, Adresse, X, Y");
        setLoading(false);
        setStatusMessage('');
        return;
      }

      setStatusMessage(`3/4: جاري تعبئة ملف SRM.pdf الأصلي لـ (${formattedItems.length}) عنصر...`);

      // 💥 استدعاء الدالة الخاصة بك لتعبئة SRM.pdf الأصلي
      const pdfBytes = await generateBulkSrmPdfBytes(formattedItems);

      setStatusMessage('4/4: جاري التنزيل إلى الهاتف...');

      // تحميل الـ PDF المجمع فوراً
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Attachements_SRM_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatusMessage('✅ تم إنشاء وتحميل التقرير المجمع بنجاح!');
    } catch (err) {
      console.error("خطأ التوليد:", err);
      alert(`حدث خطأ أثناء التعبئة: ${err.message || 'تأكد من وجود SRM.pdf في ملف public'}`);
      setStatusMessage('❌ حدث خطأ أثناء العملية.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-cyan-500/40 rounded-2xl bg-slate-900/80 text-center max-w-xl mx-auto my-6 shadow-xl backdrop-blur-md">
      <h3 className="text-xl font-bold text-cyan-400 mb-2">
        تعبئة سريعة من جدول الاتاشمان (Excel)
      </h3>
      <p className="text-slate-300 text-sm mb-6">
        رفع جدول Excel وسيتم ملء قالب <b>SRM.pdf</b> المعتمد لكل التدخلات في ملف واحد.
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
        {loading ? 'جاري المعالجة...' : 'رفع جدول Excel وتوليد الـ PDF المجمع'}
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
