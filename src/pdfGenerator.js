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

// Build the body. Each entry becomes one or more rows (one per measurement).
// If the entry has points, add an extra row right after with the coordinates.
const buildBody = (entries) => {
  const body = [];
  const merges = [];     // { startRow, rowSpan } for shared columns
  const pointRows = [];  // rows that only contain coordinate text

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

    // If entry has points, add a coordinates row spanning all columns
    if (Array.isArray(entry.points) && entry.points.length > 0) {
      const pointsText = entry.points
        .map((p) => `${p.label || ''}  X: ${p.x || ''}  Y: ${p.y || ''}  Z: ${p.z ?? 0}`)
        .join('\n');

      body.push([
        { content: pointsText, colSpan: 7, styles: { halign: 'left', fontStyle: 'italic' } },
        '', '', '', '', '', ''
      ]);
      pointRows.push(body.length - 1);
    }
  });

  return { body, merges, pointRows };
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

  const { body, merges, pointRows } = buildBody(filteredList);

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
      // Points rows: hide from merging logic
      if (pointRows.includes(data.row.index)) {
        return;
      }

      // Merge columns 0..3 (DATE, Ref, Type, Matériel) across measurements
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

    didDrawCell: function (data) {
      // Style the points row: light background
      if (data.section === 'body' && pointRows.includes(data.row.index)) {
        const { x, y, width, height } = data.cell;
        doc.setFillColor(245, 250, 248);
        doc.rect(x, y, width, height, 'F');
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