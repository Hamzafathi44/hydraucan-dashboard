import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { PDFDocument, rgb } from 'pdf-lib';

export const SRMExcelImporter = () => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // دالة إنشاء PDF لكل عنصر
  const generateSrmPdfForSingleItem = async (pdfDoc, itemData) => {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
    const { width, height } = page.getSize();

    // رسم الإطار والعنوان الرئيسي
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderWidth: 2,
      borderColor: rgb(0.1, 0.17, 0.33),
    });

    page.drawText('ATTACHEMENT DE TRAVAUX - SRM', {
      x: 150,
      y: height - 60,
      size: 18,
      color: rgb(0.1, 0.17, 0.33),
    });

    // إضافة البيانات الأساسية داخل الصفحة
    const startY = height - 120;
    const lineHeight = 30;

    const fields = [
      { label: 'Date:', value: itemData.date || '-' },
      { label: 'N° Tournee / Ref:', value: itemData.reference || '-' },
      { label: 'Adresse:', value: itemData.adresse || '-' },
      { label: 'Nature du terrain:', value: itemData.material || '-' },
      { label: 'Type d intervention:', value: itemData.type || 'Fuite' },
      { label: 'Coordonnees X:', value: itemData.x || '-' },
      { label: 'Coordonnees Y:', value: itemData.y || '-' },
    ];

    fields.forEach((field, index) => {
      page.drawText(`${field.label} ${field.value}`, {
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
    setStatusMessage('جاري قراءة ملف Excel...');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      setStatusMessage('جاري معالجة البيانات واستخراج التدخلات...');

      const formattedItems = rawRows.map(row => {
        let dateVal = row['Date'] || row['date'] || '';
        if (dateVal instanceof Date) {
          dateVal = dateVal.toISOString().split('T')[0];
        }

        const tournee = row['Tournée'] || row['tournée'] || row['Tournee'] || row['N° Tournée'] || '';
        const adresse = row['Adresse'] || row['adresse'] || '';
        const natureTerrain = row['Nature terrain'] || row['nature terrain'] || row['Nature Terrain'] || '';

        return {
          date: String(dateVal).trim(),
          reference: String(tournee).trim(),
          adresse: String(adresse).trim(),
          material: String(natureTerrain).trim(),
          type: 'Fuite',
          x: String(row['X'] || row['x'] || '').trim(),
          y: String(row['Y'] || row['y'] || '').trim()
        };
      }).filter(item => item.date || item.reference);

      if (formattedItems.length === 0) {
        alert("لم يتم العثور على أسطر تحتوي على بيانات (تأكد من اختيار الورقة الصحيحة).");
        setLoading(false);
        setStatusMessage('');
        return;
      }

      setStatusMessage(`جاري إنشاء PDF لـ (${formattedItems.length}) عنصر...`);

      // إنشاء مستند PDF مجمع جديد
      const pdfDoc = await PDFDocument.create();

      for (const item of formattedItems) {
        await generateSrmPdfForSingleItem(pdfDoc, item);
      }

      const pdfBytes = await pdfDoc.save();

      // تحميل الملف المجمع مباشرة على الهاتف
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Attachements_SRM_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage('تم إكمال العملية وتحميل الملف بنجاح!');
    } catch (err) {
      console.error("خطأ في معالجة الملف:", err);
      alert("حدث خطأ أثناء قراءة ملف الإكسل أو إنشاء الـ PDF.");
      setStatusMessage('حدث خطأ أثناء العملية.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-cyan-500/40 rounded-2xl bg-slate-900/60 text-center max-w-xl mx-auto my-8 shadow-xl backdrop-blur-md">
      <h3 className="text-xl font-bold text-cyan-400 mb-2">
        تعبئة سريعة من جدول الاتاشمان (Excel)
      </h3>
      <p className="text-slate-300 text-sm mb-6">
        اختر ملف الإكسل وسيقوم النظام بتوليد نماذج الـ SRM المجمعة في ملف PDF واحد مباشرة.
      </p>

      <input 
        type="file" 
        accept=".xlsx, .xls" 
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
        {loading ? 'جاري المعالجة...' : 'رفع جدول Excel وتوليد الـ PDF'}
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
