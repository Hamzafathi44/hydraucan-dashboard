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

const formatPoints = (points) => {
  if (!points || points.length === 0) return { x: '', y: '' };
  const xText = points
    .map((p) => `${p.label || ''}: ${p.x ?? ''}`)
    .join('\n');
  const yText = points
    .map((p) => `${p.y ?? ''}`)
    .join('\n');
  return { x: xText, y: yText };
};

const buildBody = (entries) => {
  const body = [];
  const merges = [];

  const expanded = entries.map(entry => {
    const mList = entry.measurements && entry.measurements.length > 0
        ? entry.measurements
        : [{ l: entry.l || '', L: entry.L || '', nature: entry.nature || entry.terrainNature || '' }];
    const pts = formatPoints(entry.points);
    const totalRows = Math.max(mList.length, entry.points ? entry.points.length : 1);
    return { entry, mList, pts, totalRows };
  });

  // Group by Date
  let currentRow = 0;
  let i = 0;
  while (i < expanded.length) {
    let j = i + 1;
    let dateSpan = expanded[i].totalRows;
    while (j < expanded.length && expanded[j].entry.date === expanded[i].entry.date) {
      dateSpan += expanded[j].totalRows;
      j++;
    }

    if (dateSpan > 1) {
      merges.push({ col: 0, startRow: currentRow, rowSpan: dateSpan });
    }

    for (let k = i; k < j; k++) {
      const { entry, mList, pts, totalRows } = expanded[k];

      if (totalRows > 1) {
        merges.push({ col: 1, startRow: currentRow, rowSpan: totalRows }); // Ref
        merges.push({ col: 2, startRow: currentRow, rowSpan: totalRows }); // Type
        merges.push({ col: 3, startRow: currentRow, rowSpan: totalRows }); // Matériel Utilisé
      }

      mList.forEach((m, idx) => {
        const isFirst = idx === 0;
        body.push([
          isFirst && k === i ? (entry.date || '') : '',
          isFirst ? (entry.reference || '') : '',
          isFirst ? (entry.type || '') : '',
          isFirst ? (entry.material || '') : '',
          m.nature || '',
          m.l || '',
          m.L || '',
          pts.x,
          pts.y
        ]);
      });
      currentRow += totalRows;
    }
    i = j;
  }

  return { body, merges };
};

export const generateReportPDF = async (filteredList, selectedMonth) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const loadingToast = toast.loading("Génération du PDF...");

  try {
    const logoData = await toBase64('/logo-hydracane.png');
    doc.addImage(logoData, 'PNG', 14, 10, 30, 12);
  } catch {
    console.warn("Logo non trouvé");
  }

  const title = selectedMonth === 'Tous' ? "Rapport Mensuel - Global" : `Rapport Mensuel - ${selectedMonth}`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 148, 25, { align: 'center' });

  const { body, merges } = buildBody(filteredList);

  autoTable(doc, {
    head: [["DATE", "Références", "Type", "Matériel Utilisé", "Nature", "l", "L", "X", "Y"]],
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
      if (data.cell.section === 'body') {
        merges.forEach(({ col, startRow, rowSpan }) => {
          if (data.column.index === col) {
            if (data.row.index === startRow) {
              data.cell.rowSpan = rowSpan;
              data.cell.styles.valign = 'middle';
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
      0: { cellWidth: 25 },
      1: { cellWidth: 30 },
      2: { cellWidth: 20 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { cellWidth: 15 },
      6: { cellWidth: 15 },
      7: { cellWidth: 35 },
      8: { cellWidth: 30 }
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
