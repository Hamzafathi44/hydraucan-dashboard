import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generatePDF = (dataList) => {
  const doc = new jsPDF();
  
  // إضافة عنوان للتقرير
  doc.setFontSize(18);
  doc.text("Daily Work Report", 14, 15);
  
  // تجهيز البيانات
  const tableRows = dataList.map(item => [
    item.date, 
    item.reference, 
    item.type, 
    item.materialUtiliser, 
    item.natureDeTerrain
  ]);

  // إنشاء الجدول بنفس تنسيق الصورة التي أرسلتها
  doc.autoTable({
    head: [["DATE", "References", "Type", "Material Utiliser", "Nature de Terrain"]],
    body: tableRows,
    startY: 25,
    theme: 'grid', // يعطي شكل الجدول المخطط
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] }
  });
  
  doc.save("Daily_Work_Report.pdf");
};