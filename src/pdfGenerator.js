import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

// Helper to convert images to Base64
const toBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
};

export const generateReportPDF = async (filteredList, selectedMonth) => {
  const doc = new jsPDF();
  const loadingToast = toast.loading("Génération du PDF...");
  
  try {
    const logoData = await toBase64('/logo-hydracane.png');
    doc.addImage(logoData, 'PNG', 15, 10, 45, 15); 
  } catch {
    console.warn("Logo non trouvé");
  }

  const title = selectedMonth === 'Tous' ? "Rapport Mensuel - Global" : `Rapport Mensuel - ${selectedMonth}`;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 105, 25, { align: 'center' });

  const bodyData = filteredList.map(item => [
    item.date, 
    item.reference, 
    item.type, 
    item.material, 
    item.nature
  ]);

  autoTable(doc, {
    head: [["DATE", "Références", "Type", "Matériel Utilisé", "Nature"]],
    body: bodyData,
    startY: 40,
    theme: 'grid',
    didParseCell: function(data) {
      if (data.column.index === 0 && data.cell.section === 'body') {
        const rowIndex = data.row.index;
        const currentDate = data.cell.raw;
        let rowSpan = 1;
        for (let i = rowIndex + 1; i < data.table.body.length; i++) {
          if (data.table.body[i].cells[0].raw === currentDate) { rowSpan++; } else { break; }
        }
        if (rowSpan > 1) { data.cell.rowSpan = rowSpan; }
        if (rowIndex > 0 && data.table.body[rowIndex - 1].cells[0].raw === currentDate) { data.cell.text = ['']; }
      }
    },
    styles: { valign: 'middle', halign: 'center', fontSize: 10 }
  });
  
  doc.save(`${title}.pdf`);
  toast.dismiss(loadingToast);
  toast.success("PDF exporté avec succès");
};