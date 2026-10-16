import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

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

const buildBody = (entries) => {
  const body = [];
  const merges = [];

  entries.forEach((entry) => {
    const mList =
      entry.measurements && entry.measurements.length > 0
        ? entry.measurements
        : [{
            l: entry.l || '',
            L: entry.L || '',
            nature: entry.nature || entry.terrainNature || ''
          }];

    const startRow = body.length;

    mList.forEach((m, i) => {
      const isFirst = i === 0;
      body.push([
        isFirst ? (entry.date || '') : '',
        isFirst ? (entry.reference || '') : '',
        isFirst ? (entry.type || '') : '',
        isFirst ? (entry.material || entry.materialUsed || '') : '',
        m.nature || '',
        m.l || '',
        m.L || ''
      ]);
    });

    merges.push({ startRow, rowSpan: mList.length });
  });

  return { body, merges };
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

  const title =
    selectedMonth === 'Tous'
      ? "Rapport Mensuel - Global"
      : `Rapport Mensuel - ${selectedMonth}`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 105, 25, { align: 'center' });

  const { body, merges } = buildBody(filteredList);

  autoTable(doc, {
    head: [["DATE", "Références", "Type", "Matériel Utilisé", "Nature", "l", "L"]],
    body: body,
    startY: 40,
    theme: 'grid',

    headStyles: {
      fillColor: [60, 179, 143],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },

    didParseCell: function (data) {
      if (
        data.cell.section === 'body' &&
        data.column.index >= 0 &&
        data.column.index <= 3
      ) {
        merges.forEach(({ startRow, rowSpan }) => {
          if (rowSpan > 1) {
            if (data.row.index === startRow) {
              data.cell.rowSpan = rowSpan;
            } else if (
              data.row.index > startRow &&
              data.row.index < startRow + rowSpan
            ) {
              data.cell.text = [''];
            }
          }
        });
      }
    },

    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 22 },
      2: { cellWidth: 18 },
      3: { cellWidth: 55 },
      4: { cellWidth: 25 },
      5: { cellWidth: 12 },
      6: { cellWidth: 12 }
    },

    styles: {
      valign: 'middle',
      halign: 'center',
      fontSize: 9,
      cellPadding: 2
    }
  });

  doc.save(`${title}.pdf`);
  toast.dismiss(loadingToast);
  toast.success("PDF exporté avec succès");
};