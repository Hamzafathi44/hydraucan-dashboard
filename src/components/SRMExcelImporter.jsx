import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { generateBulkSrmPdfBytes } from '../srmPdfGenerator';

export const SRMExcelImporter = () => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // دالة البحث عن العناوين بمرونة عالية
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
        alert("لم يتم العثور على أسطر بيانات داخل الشيت.");
        setLoading(false);
        setStatusMessage('');
        return;
      }

      setStatusMessage(`2/4: تحليل أسطر الجدول (${rawRows.length} سطر)...`);

      // قراءة الأعمدة المطابقة تماماً لجدولك في الصورة
      const formattedItems = rawRows.map(row => {
        let dateVal = getFieldValue(row, ['Date', 'date', 'DATE']);
        if (dateVal instanceof Date) {
          dateVal = dateVal.toISOString().split('T')[0];
        }

        const nCompteur = getFieldValue(row, ['N compteur', 'N° compteur', 'Ncompteur', 'Compteur', 'Ref', 'Tournee']);
        const adresse = getFieldValue(row, ['Adresse', 'adresse', 'Lieu']);
        const observation = getFieldValue(row, ['Observation', 'observation', 'Type', 'Nature']);

        return {
          date: String(dateVal).trim(),
          reference: String(nCompteur).trim(),
          adresse: String(adresse).trim(),
          type: String(observation).trim() || 'FUITE',
          material: '',
          x: '',
          y: ''
        };
      }).filter(item => item.date || item.reference); // يتطلب وجود تاريخ أو رقم compteur فقط

      if (formattedItems.length === 0) {
        alert("تعذر التعرف على بيانات الجدول! تأكد من وجود صف يحتوي على العناوين: Date, N compteur");
        setLoading(false);
        setStatusMessage('');
        return;
      }

      setStatusMessage(`3/4: جاري تعبئة SRM.pdf لعدد (${formattedItems.length}) عنصر...`);

      // استدعاء دالة التعبئة المجمعة
      const pdfBytes = await generateBulkSrmPdfBytes(formattedItems);

      setStatusMessage('4/4: جاري التحميل للهاتف...');

      // تحميل الملف المجمع
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Attachements_SRM_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatusMessage(`✅ تم إنشاء وتنزيل PDF مجمع لـ (${formattedItems.length}) عنصر بنجاح!`);
    } catch (err) {
      console.error("خطأ أثناء التنفيذ:", err);
      alert(`حدث خطأ: ${err.message || 'فشل في معالجة الملف'}`);
      setStatusMessage('❌ حدث خطأ أثناء المعالجة.');
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
        قم برفع جدول Excel المحدث وسيتم تعبئة جميع نماذج الـ SRM المجمعة فوراً.
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
        {loading ? 'جاري التوليد...' : 'رفع جدول Excel وتوليد الـ PDF المجمع'}
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
