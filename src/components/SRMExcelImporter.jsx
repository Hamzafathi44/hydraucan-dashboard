import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { PDFDocument, rgb } from 'pdf-lib';

export const SRMExcelImporter = () => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // دالة لمطابقة أسماء الأعمدة بمرونة
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

  // رسم صفحة PDF واحدة
  const generateSrmPdfForSingleItem = async (pdfDoc, itemData) => {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderWidth: 2,
      borderColor: rgb(0.1, 0.17, 0.33),
    });

    page.drawText('ATTACHEMENT DE TRAVAUX - SRM', {
      x: 130,
      y: height - 60,
      size: 16,
      color: rgb(0.1, 0.17, 0.33),
    });

    const startY = height - 120;
    const lineHeight = 35;

    const fields = [
      { label: 'Date:', value: itemData.date || '-' },
      { label: 'N° Tournee / Ref:', value: itemData.reference || '-' },
      { label: 'Adresse / Lieu:', value: itemData.adresse || '-' },
      { label: 'Nature du terrain:', value: itemData.material || '-' },
      { label: 'Type d intervention:', value: itemData.type || 'Fuite' },
      { label: 'Coordonnees X:', value: itemData.x || '-' },
      { label: 'Coordonnees Y:', value: itemData.y || '-' },
    ];

    fields.forEach((field, index) => {
      page.drawText(`${field.label} ${String(field.value)}`, {
        x: 50,
        y: startY - index * lineHeight,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
      });
    });
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
        throw new Error("ملف الإكسل فارغ أو غير صالح.");
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rawRows || rawRows.length === 0) {
        alert("لم يتم العثور على أسطر بيانات داخل الشيت الأول من الملف.");
        setLoading(false);
        setStatusMessage('');
        return;
      }

      setStatusMessage(`2/4: قراءة (${rawRows.length}) سطر من الجدول...`);

      const formattedItems = rawRows.map(row => {
        let dateVal = getFieldValue(row, ['Date', 'date', 'DATE']);
        if (dateVal instanceof Date) {
          dateVal = dateVal.toISOString().split('T')[0];
        }

        const tournee = getFieldValue(row, ['Tournée', 'tournée', 'Tournee', 'tournee', 'N° Tournée', 'Ref', 'Reference', 'ID']);
        const adresse = getFieldValue(row, ['Adresse', 'adresse', 'Lieu', 'Localisation']);
        const natureTerrain = getFieldValue(row, ['Nature terrain', 'nature terrain', 'Nature Terrain', 'Terrain', 'Material']);
        const xVal = getFieldValue(row, ['X', 'x', 'Coord X', 'Longitude']);
        const yVal = getFieldValue(row, ['Y', 'y', 'Coord Y', 'Latitude']);

        return {
          date: String(dateVal).trim(),
          reference: String(tournee).trim(),
          adresse: String(adresse).trim(),
          material: String(natureTerrain).trim(),
          type: 'Fuite',
          x: String(xVal).trim(),
          y: String(yVal).trim()
        };
      }).filter(item => item.date || item.reference || item.adresse);

      if (formattedItems.length === 0) {
        alert("تعذر التعرف على أعمدة التاريخ أو النمرة أو العنوان. تأكد من أن السطر الأول بالملف يحتوي على أسماء الأعمدة.");
        setLoading(false);
        setStatusMessage('');
        return;
      }

      setStatusMessage(`3/4: جاري توليد الـ PDF لعدد (${formattedItems.length}) عنصر...`);

      const pdfDoc = await PDFDocument.create();

      for (const item of formattedItems) {
        await generateSrmPdfForSingleItem(pdfDoc, item);
      }

      const pdfBytes = await pdfDoc.save();

      setStatusMessage('4/4: جاري تجهيز الملف للتنزيل...');

      // طريقة تنزيل متوافقة مع متصفحات الهاتف
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Attachements_SRM_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatusMessage('✅ تم إنشاء وتحميل الملف بنجاح!');
    } catch (err) {
      console.error("خطأ أثناء التنفيذ:", err);
      alert(`حدث خطأ: ${err.message || 'فشل في قراءة الملف'}`);
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
        قم برفع ملف Excel لتوليد نماذج الـ SRM تلقائياً.
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
        {loading ? 'جاري التوليد...' : 'رفع جدول Excel وتوليد الـ PDF'}
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
