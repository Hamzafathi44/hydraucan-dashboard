import React, { useState } from 'react';
import * as XLSX from 'xlsx';
// تنبيه: تأكد من ضبط المسار أدناه حسب موقع ملف دالة الـ PDF في مشروعك
import { generateBulkSrmPdfBytes } from '../srmPdfService'; 

export const SRMExcelImporter = () => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage('جاري قراءة ملف Excel...');

    try {
      // 1. قراءة الملف من الهاتف
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // 2. تحويل أسطر الجدول إلى JSON
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      setStatusMessage('جاري معالجة البيانات واستخراج التدخلات...');

      // 3. تحويل بيانات جدول الاتاشمان
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
          reference: String(tournee).trim(),     // رقم المعرف / Tournée
          adresse: String(adresse).trim(),
          material: String(natureTerrain).trim(), // طبيعة الأرض (Beton, Faience...)
          type: 'Fuite',
          nature: 'Casse',
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

      // 4. استدعاء دالة التجميع وتوليد الـ PDF
      const pdfBytes = await generateBulkSrmPdfBytes(formattedItems);

      // 5. تحميل الملف تلقائياً على الهاتف
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Attachement_SRM_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage('تم إكمال العملية وتحميل الملف بنجاح!');
    } catch (err) {
      console.error("خطأ في معالجة الملف:", err);
      alert("حدث خطأ أثناء قراءة ملف الإكسل أو إنشاء PDF.");
      setStatusMessage('حدث خطأ أثناء العملية.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      margin: '20px 0',
      padding: '24px',
      border: '2px dashed #007bff',
      borderRadius: '12px',
      backgroundColor: '#f8f9fa',
      textAlign: 'center',
      direction: 'rtl'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#1A2B56', fontWeight: 'bold' }}>
        تعبئة سريعة من جدول الاتاشمان (Excel)
      </h3>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '18px' }}>
        اختر ملف الإكسل وسيتم إنشاء جميع نماذج SRM في ملف PDF واحد مجمع.
      </p>

      <input 
        type="file" 
        accept=".xlsx, .xls" 
        onChange={handleFileUpload} 
        disabled={loading}
        id="srm-excel-input"
        style={{ display: 'none' }}
      />
      
      <label 
        htmlFor="srm-excel-input"
        style={{
          padding: '12px 24px',
          backgroundColor: loading ? '#6c757d' : '#28a745',
          color: 'white',
          borderRadius: '8px',
          fontWeight: 'bold',
          display: 'inline-block',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        {loading ? 'جاري المعالجة...' : 'رفع جدول Excel وتوليد الـ PDF'}
      </label>

      {statusMessage && (
        <p style={{ marginTop: '14px', fontSize: '14px', color: '#007bff', fontWeight: '500' }}>
          {statusMessage}
        </p>
      )}
    </div>
  );
};

export default SRMExcelImporter;
