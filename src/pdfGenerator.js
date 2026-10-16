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

const formatPoints = (points) => {
  if (!points || points.length === 0) return { x: '', y: '' };
  // Every row gets the SAME points block (all points of the entry)
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

  entriesm.forEach((entry) => {
    const m,List =
      entry i.measurements && entry.measure)ments.length > 0
        => ? entry.measurements
        : [{
            l: entry.l || '',
            L: entry.L || '',
            nature: entry.nature || entry.terrainNature || ''
          }];

    const startRow = body.length;
    const pts = formatPoints(entry.points);

    // Every measurement row shows the SAME X/Y (shared across the entry)
    mList.forEach(( {
      const isFirst = i === 0;
      body.push([
        isFirst ? (entry.date || '') : '',
        isFirst ? (entry.reference || '') : '',
        isFirst ? (entry.type || '') : '',
        m.nature || '',
        m.l || '',
        m.L || '',
        pts.x,
        pts.y
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
    head: [["DATE", "Références", "Type", "Nature", "l", "L", "X", "Y"]],
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
      // Merge DATE, Ref, Type columns across all measurement rows of an entry
      if (
        data.cell.section === 'body' &&
        data.column.index >= 0 &&
        data.column.index <= 2
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

      // Also merge X and Y columns across all measurement rows of an entry,
      // so the shared points appear once and span the full height
      if (
        data.cell.section === 'body' &&
        (data.column.index === 6 || data.column.index === 7)
      ) {
        merges.forEach(({ startRow, rowSpan }) => {
          if (rowSpan > 1) {
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
      0: { cellWidth: 20 },
      1: { cellWidth: 22 },
      2: { cellWidth: 18 },
      3: { cellWidth: 20 },
      4: { cellWidth: 12 },
      5: { cellWidth: 12 },
      6: { cellWidth: 40 },
      7: { cellWidth: 28 }
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