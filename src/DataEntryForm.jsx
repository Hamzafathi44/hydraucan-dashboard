import { useState } from 'react';
import { generatePDF } from './pdfGenerator'; // سننشئ هذا الملف لاحقاً

function DataEntryForm() {
  const [formData, setFormData] = useState({
    date: '',
    reference: '',
    type: '',
    materialUtiliser: '',
    natureDeTerrain: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>تسجيل العمل اليومي</h2>
      <input name="date" type="date" onChange={handleChange} placeholder="التاريخ" />
      <input name="reference" onChange={handleChange} placeholder="المرجع (Reference)" />
      <input name="type" onChange={handleChange} placeholder="النوع (Type)" />
      <input name="materialUtiliser" onChange={handleChange} placeholder="المواد المستخدمة" />
      <input name="natureDeTerrain" onChange={handleChange} placeholder="طبيعة الأرض" />
      
      <button onClick={() => generatePDF(formData)}>توليد ملف PDF</button>
    </div>
  );
}

export default DataEntryForm;