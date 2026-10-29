import { useState, useMemo, useRef, useEffect } from 'react';
import { useEnveloppes } from '../hooks/useEnveloppes';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Wallet, FileDown, Plus, Trash2, Image as ImageIcon, X, Save, Loader2, AlertTriangle, Pencil, Search } from 'lucide-react';

// Proof images used to be stored as base64 inside the Firestore document.
// Firestore documents are limited to ~1 MiB, so a report with a proof for
// every purchase failed on save with only a generic error. Proofs are now
// uploaded on save and only their download URLs are stored in Firestore,
// so the document stays small no matter how many proofs are attached.
// Dual storage: Cloudinary (free, VITE_CLOUDINARY_CLOUD_NAME /
// VITE_CLOUDINARY_UPLOAD_PRESET) is tried first, then Firebase Storage
// (kept for when its Blaze billing is fixed), then the base64 fallback
// for small reports. Old base64 proofs are kept working (PDF + display)
// and are migrated to Storage the next time their report is saved.
const PROOF_FIELDS = ['cimentImg', 'argileImg', 'carburantImg', 'autresImg'];

// Material types for the "Matériau" column (copy, 2026-10-29): this column
// replaces the old fixed "Argile / Faïence" column. Each day-row picks its
// material — Argile, Faïence, Revsol, Pavé, etc. — and "Autre" opens a
// free-text field to type any other material. Quantity, unit price and
// proof work exactly as before, whatever the type.
const MATERIAL_TYPES = ['Argile', 'Faïence', 'Revsol', 'Pavé', 'Béton', 'Goudron', 'Lamozik', 'Carrelage', 'Autre'];
const materialLabelOf = (row) => row.argileType === 'Autre' ? (row.argileCustomType || 'Autre') : (row.argileType || 'Argile');

const uploadProofToCloudinary = async (dataUrl, rowId, field) => {
  // Second storage (free Cloudinary), tried FIRST so proofs save now
  // while Firebase Storage is still blocked on Blaze billing. Firebase
  // code below is kept untouched, so it works again automatically once
  // Blaze is fixed. Returns null when Cloudinary is not configured.
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !preset) return null;
  const blob = await fetch(dataUrl).then((r) => r.blob());
  const form = new FormData();
  form.append('file', blob, `${rowId}-${field}.jpg`);
  form.append('upload_preset', preset);
  form.append('folder', 'enveloppe_preuves');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    const json = await res.json();
    if (!res.ok || !json.secure_url) {
      throw new Error(json.error?.message || 'Cloudinary upload failed');
    }
    return json.secure_url;
  } finally {
    clearTimeout(timer);
  }
};

const uploadProofImage = async (dataUrl, rowId, field) => {
  // Missing proof field on an old report must become null, never undefined:
  // Firestore updateDoc() rejects explicit undefined values, which made
  // editing old reports fail even without a new proof.
  if (dataUrl === undefined) return null;
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return dataUrl;
  }
  // Try Cloudinary first; if it is not configured or it fails, fall
  // through to Firebase Storage below (kept for when Blaze is fixed).
  try {
    const cloudinaryUrl = await uploadProofToCloudinary(dataUrl, rowId, field);
    if (cloudinaryUrl) return cloudinaryUrl;
  } catch (err) {
    console.error('Cloudinary proof upload failed, trying Firebase:', err?.message || err);
  }
  const storage = getStorage();
  const blob = await fetch(dataUrl).then((r) => r.blob());
  const path = `enveloppe_preuves/${Date.now()}-${Math.random().toString(36).slice(2)}/${rowId}-${field}.jpg`;
  // Never hang forever on a slow / blocked upload: fail fast after 20s
  // so the user gets a real error instead of a stuck "Sauvegarde..." button.
  // The underlying upload error is also logged, because a timeout usually
  // means Storage is not enabled / reachable, not just a slow network.
  // This is now the ONLY Storage attempt for a proof: proofs are no longer
  // uploaded when picked (that caused a second 45s wait before save).
  const upload = (async () => {
    const snapshot = await uploadBytes(ref(storage, path), blob);
    return getDownloadURL(snapshot.ref);
  })();
  upload.catch((err) => {
    console.error('Storage proof upload failed:', err?.code || err?.message || err);
  });
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Envoi de la preuve trop long (timeout 20s) — vérifiez la connexion et Firebase Storage")), 20000)
  );
  return Promise.race([upload, timeout]);
};

const cleanRowForSave = (row) => {
  const cleaned = { ...row };
  Object.keys(cleaned).forEach((k) => {
    if (cleaned[k] === undefined) delete cleaned[k];
  });
  PROOF_FIELDS.forEach((field) => {
    if (cleaned[field] === undefined) cleaned[field] = null;
  });
  return cleaned;
};

// Upload all remaining base64 proofs in parallel (not row by row) and
// report progress, so a report with a proof for every purchase does not
// sit on "Sauvegarde..." with no feedback.
// If Storage upload fails (timeout, not enabled, rules), fall back to
// keeping the base64 proofs ONLY when the whole document stays under
// ~850 KB, so a small edit still saves. Large reports still need Storage,
// and then the real Storage error is thrown.
const prepareRowsForSave = async (rowsToSave, headerForSave, onProgress) => {
  const jobs = [];
  rowsToSave.forEach((row, rowIndex) => {
    PROOF_FIELDS.forEach((field) => {
      if (typeof row[field] === 'string' && row[field].startsWith('data:')) {
        jobs.push({ rowIndex, field });
      }
    });
  });
  const results = rowsToSave.map((r) => cleanRowForSave(r));
  let done = 0;
  let firstError = null;
  onProgress?.(0, jobs.length);
  await Promise.all(
    jobs.map(async (job) => {
      try {
        results[job.rowIndex][job.field] = await uploadProofImage(
          rowsToSave[job.rowIndex][job.field],
          rowsToSave[job.rowIndex].id,
          job.field
        );
      } catch (e) {
        if (!firstError) firstError = e;
        // Keep the original base64 proof for a possible fallback below.
        results[job.rowIndex][job.field] = rowsToSave[job.rowIndex][job.field];
      }
      done += 1;
      onProgress?.(done, jobs.length);
    })
  );
  if (firstError) {
    const estimatedSize = JSON.stringify({ header: headerForSave, rows: results }).length;
    if (estimatedSize < 850000) {
      toast.error("Firebase Storage indisponible — preuve sauvegardée sans Storage (limite 1 Mo). Vérifiez Storage dans Firebase.");
      return results;
    }
    throw firstError;
  }
  return results;
};

export const EnveloppeFinanciereView = () => {
  const { reports, loading, addReport, updateReport, deleteReport } = useEnveloppes();
  
  const [saving, setSaving] = useState(false);
  const [uploadingProofs, setUploadingProofs] = useState(0);
  const [saveProgress, setSaveProgress] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');

  const [header, setHeader] = useState({ beneficiaire: '', montantAlloue: '' });
  const [rows, setRows] = useState([]);
  
  const fileInputRef = useRef(null);
  const [activeUpload, setActiveUpload] = useState({ rowId: null, field: null });

  const createEmptyRow = () => ({
    id: Date.now() + Math.random(),
    date: '',
    cimentQt: '', cimentPrix: '', cimentImg: null,
    argileQt: '', argilePrix: '', argileImg: null,
    argileType: 'Argile', argileCustomType: '',
    carburant: '', carburantImg: null,
    autres: '', autresImg: null
  });

  const resetForm = () => {
    setHeader({ beneficiaire: '', montantAlloue: '' });
    setRows([createEmptyRow()]);
    setEditingId(null);
  };

  useEffect(() => {
    if (!editingId) resetForm();
  }, [editingId]);

  const handleEditClick = (report) => {
    setHeader(report.header || { beneficiaire: '', montantAlloue: '' });
    // Normalize old reports: missing proof fields become null (not
    // undefined, which Firestore rejects), missing text fields become ''.
    setRows(
      (report.rows || []).map((r) => ({
        id: r.id,
        date: r.date || '',
        cimentQt: r.cimentQt || '', cimentPrix: r.cimentPrix || '', cimentImg: r.cimentImg ?? null,
        argileQt: r.argileQt || '', argilePrix: r.argilePrix || '', argileImg: r.argileImg ?? null,
        argileType: r.argileType || 'Argile', argileCustomType: r.argileCustomType || '',
        carburant: r.carburant || '', carburantImg: r.carburantImg ?? null,
        autres: r.autres || '', autresImg: r.autresImg ?? null
      }))
    );
    setEditingId(report.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!header.beneficiaire || !header.montantAlloue) {
      return toast.error("Veuillez remplir le bénéficiaire et le montant");
    }
    if (uploadingProofs > 0) {
      return toast.error("Attendez la fin de l'envoi des preuves, puis réessayez");
    }

    setSaving(true);
    setSaveProgress('');
    try {
      // Upload base64 proofs to Storage first, so Firestore only receives
      // small download URLs. Existing Storage URLs are kept as-is.
      // If Storage fails and the report is small, prepareRowsForSave
      // falls back to base64 instead of failing the save.
      const rowsToSave = await prepareRowsForSave(rows, header, (done, total) => {
        setSaveProgress(total > 0 ? `${done}/${total} preuves` : '');
      });
      let result;
      if (editingId) {
        result = await updateReport(editingId, { header, rows: rowsToSave });
      } else {
        result = await addReport({ header, rows: rowsToSave });
      }

      if (result.success) {
        toast.success(editingId ? "Rapport mis à jour !" : "Rapport sauvegardé !");
        resetForm();
      } else {
        const reason = result.error?.message || result.error?.code || '';
        toast.error(reason ? `Erreur de sauvegarde: ${reason}` : "Erreur de sauvegarde");
      }
    } catch (e) {
      // Show the real reason (e.g. Storage not enabled / rules) instead of
      // a generic error, so the problem can actually be fixed.
      toast.error(`Erreur de sauvegarde: ${e?.message || e?.code || e}`);
    } finally {
      setSaving(false);
      setSaveProgress('');
    }
  };

  const handleHeaderChange = (e) => setHeader({ ...header, [e.target.name]: e.target.value });
  const handleRowChange = (id, field, value) => setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  // Material field (copy, 2026-10-29): a native <select> cannot be typed
  // in, which made "Autre" unusable in practice. This is a combobox: one
  // text field with the material list as suggestions — pick Faïence,
  // Revsol, Pavé… or just type any other material name directly. A typed
  // name that is not in the list is stored as a custom "Autre" value.
  const handleMaterialChange = (id, value) => setRows(rows.map((r) => {
    if (r.id !== id) return r;
    if (MATERIAL_TYPES.includes(value) && value !== 'Autre') {
      return { ...r, argileType: value, argileCustomType: '' };
    }
    if (value === '') return { ...r, argileType: 'Argile', argileCustomType: '' };
    return { ...r, argileType: 'Autre', argileCustomType: value === 'Autre' ? '' : value };
  }));
  const materialInputValue = (row) => row.argileType === 'Autre' ? (row.argileCustomType || '') : (row.argileType || 'Argile');
  const addRow = () => setRows([...rows, createEmptyRow()]);
  const removeRow = (id) => { if (rows.length > 1) setRows(rows.filter(r => r.id !== id)); };

  const triggerImageUpload = (rowId, field) => {
    setActiveUpload({ rowId, field });
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !activeUpload.rowId || !activeUpload.field) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Image trop lourde (max 2MB)");

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 700 / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const safeBase64 = canvas.toDataURL('image/jpeg', 0.65);
        const { rowId, field } = activeUpload;

        // Show the preview immediately and keep the proof as base64 until
        // save. Uploading here too caused a double wait when Storage is
        // down (45s on pick, then again on save). Save now makes the
        // single Storage attempt, with a 20s timeout, and falls back to
        // base64 for small reports, so picking a proof is instant.
        setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: safeBase64 } : r)));
        toast.success("Preuve ajoutée");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = (rowId, field) => setRows(rows.map(r => r.id === rowId ? { ...r, [field]: null } : r));

  const calculatedRows = useMemo(() => {
    return rows.map((d) => {
      const cimentTotal = (parseFloat(d.cimentQt) || 0) * (parseFloat(d.cimentPrix) || 0);
      const argileTotal = (parseFloat(d.argileQt) || 0) * (parseFloat(d.argilePrix) || 0);
      const carburant = parseFloat(d.carburant) || 0;
      const autres = parseFloat(d.autres) || 0;
      return { ...d, cimentTotal, argileTotal, totalLigne: cimentTotal + argileTotal + carburant + autres };
    });
  }, [rows]);

  const totals = useMemo(() => {
    return calculatedRows.reduce((acc, curr) => ({
      cimentTotal: acc.cimentTotal + curr.cimentTotal,
      argileTotal: acc.argileTotal + curr.argileTotal,
      carburant: acc.carburant + (parseFloat(curr.carburant) || 0),
      autres: acc.autres + (parseFloat(curr.autres) || 0),
      totalGeneral: acc.totalGeneral + curr.totalLigne,
    }), { cimentTotal: 0, argileTotal: 0, carburant: 0, autres: 0, totalGeneral: 0 });
  }, [calculatedRows]);

  const montantAlloue = parseFloat(header.montantAlloue) || 0;
  const soldeRestant = montantAlloue - totals.totalGeneral;

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

  const downloadPDF = async (reportHeader, reportRows = []) => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const loadingToast = toast.loading("Génération du PDF...");

    const processedRows = reportRows.map(r => {
      const cimentTotal = (parseFloat(r.cimentQt) || 0) * (parseFloat(r.cimentPrix) || 0);
      const argileTotal = (parseFloat(r.argileQt) || 0) * (parseFloat(r.argilePrix) || 0);
      const carburant = parseFloat(r.carburant) || 0;
      const autres = parseFloat(r.autres) || 0;
      return { ...r, cimentTotal, argileTotal, totalLigne: cimentTotal + argileTotal + carburant + autres };
    });

    const finalTotals = processedRows.reduce((acc, curr) => ({
      cimentTotal: acc.cimentTotal + curr.cimentTotal,
      argileTotal: acc.argileTotal + curr.argileTotal,
      carburant: acc.carburant + (parseFloat(curr.carburant) || 0),
      autres: acc.autres + (parseFloat(curr.autres) || 0),
      totalGeneral: acc.totalGeneral + curr.totalLigne,
    }), { cimentTotal: 0, argileTotal: 0, carburant: 0, autres: 0, totalGeneral: 0 });

    const alloue = parseFloat(reportHeader.montantAlloue) || 0;
    const solde = alloue - finalTotals.totalGeneral;

    // --- 1. HEADER ---
    try {
      const logoData = await toBase64('/logo-hydracane.png');
      doc.addImage(logoData, 'PNG', 14, 10, 30, 12); 
    } catch (e) {}

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("SITUATION DE CONSOMMATION DE L'ENVELOPPE FINANCIÈRE", 148, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Bénéficiaire : ${reportHeader.beneficiaire || '................................'}`, 14, 32);
    doc.text(`Montant de l'enveloppe allouée : ${alloue.toFixed(2)} DH`, 14, 38);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("Objet : Suivi de l'utilisation des fonds alloués par l'entreprise, détaillant les dépenses effectuées et le solde restant disponible.", 14, 45);

    // --- 2. MAIN TABLE ---
    const tableBody = processedRows.map((d, index) => [
      index + 1,
      d.date || '',
      d.cimentQt, d.cimentPrix, d.cimentTotal ? d.cimentTotal.toFixed(2) : '',
      materialLabelOf(d),
      d.argileQt, d.argilePrix, d.argileTotal ? d.argileTotal.toFixed(2) : '',
      d.carburant,
      d.autres,
      d.totalLigne ? d.totalLigne.toFixed(2) : ''
    ]);

    tableBody.push([
      { content: 'TOTAL', colSpan: 11, styles: { fontStyle: 'bold', halign: 'center' } },
      finalTotals.totalGeneral.toFixed(2)
    ]);

    autoTable(doc, {
      head: [['N°', 'Date', 'Ciment Qt', 'Ciment P.U.', 'Ciment Total', 'Matériau', 'Mat. Qt', 'Mat. P.U.', 'Mat. Total', 'Carburant', 'Autres', 'Total']],
      body: tableBody,
      startY: 50,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2, halign: 'center', valign: 'middle', textColor: [0, 0, 0] },
      headStyles: { fillColor: [60, 179, 143], textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 22 },
        2: { cellWidth: 16 }, 3: { cellWidth: 16 }, 4: { cellWidth: 20 },
        5: { cellWidth: 22 },
        6: { cellWidth: 16 }, 7: { cellWidth: 16 }, 8: { cellWidth: 20 },
        9: { cellWidth: 20 },
        10: { cellWidth: 20 },
        11: { cellWidth: 25 }
      }
    });

    // --- 3. RÉCAPITULATIF TABLE ---
    const finalY = doc.lastAutoTable.finalY + 15;
    
    autoTable(doc, {
      head: [['Récapitulatif', 'Montant (DH)']],
      body: [
        ['Montant alloué', alloue.toFixed(2)],
        ['Total dépensé', finalTotals.totalGeneral.toFixed(2)],
        ['Solde restant', solde.toFixed(2)]
      ],
      startY: finalY,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3, textColor: [0, 0, 0] },
      headStyles: { fillColor: [60, 179, 143], textColor: 255, fontStyle: 'bold' },
      margin: { left: 14, right: 200 }
    });

    // --- 4. PROOF IMAGES (80x55 SIZE) ---
    const imagesToPrint = [];
    processedRows.forEach((row, index) => {
      if (row.cimentImg) imagesToPrint.push({ label: 'Ciment', amount: row.cimentTotal, img: row.cimentImg, line: index + 1 });
      if (row.argileImg) imagesToPrint.push({ label: materialLabelOf(row), amount: row.argileTotal, img: row.argileImg, line: index + 1 });
      if (row.carburantImg) imagesToPrint.push({ label: 'Carburant', amount: parseFloat(row.carburant) || 0, img: row.carburantImg, line: index + 1 });
      if (row.autresImg) imagesToPrint.push({ label: 'Autres', amount: parseFloat(row.autres) || 0, img: row.autresImg, line: index + 1 });
    });

    if (imagesToPrint.length > 0) {
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("JUSTIFICATIFS DES DÉPENSES (PREUVES)", 148, 15, { align: 'center' });

      let count = 0;
      for (const item of imagesToPrint) {
        if (count > 0 && count % 6 === 0) {
          doc.addPage();
          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          doc.text("JUSTIFICATIFS DES DÉPENSES (SUITE)", 148, 15, { align: 'center' });
        }

        const col = count % 2; 
        const row = Math.floor((count % 6) / 2); 

        // ✅ NEW SIZE: 80 WIDTH x 55 HEIGHT
        const boxWidth = 80; 
        const boxHeight = 55; 
        const padding = 4; 
        
        // Centered columns for 80mm width
        const x = col === 0 ? 50 : 50 + boxWidth + 37; 
        const y = 25 + (row * 60); 

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        doc.text(`Ligne ${item.line} - ${item.label} : ${item.amount.toFixed(2)} DH`, x, y - 4);

        doc.setFillColor(248, 250, 252); 
        doc.rect(x, y, boxWidth, boxHeight, 'F'); 
        
        doc.setDrawColor(200, 200, 200); 
        doc.setLineWidth(0.3);
        doc.rect(x, y, boxWidth, boxHeight, 'S');

        try {
          // Storage URLs must be converted to base64 for jsPDF; old
          // base64 proofs are used directly.
          let imgData = item.img;
          if (typeof imgData === 'string' && imgData.startsWith('http')) {
            try {
              imgData = await toBase64(imgData);
            } catch (e) {
              // Fall through to addImage, which is caught below.
            }
          }
          const imgFormat = typeof imgData === 'string' && imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
          doc.addImage(imgData, imgFormat, x + padding, y + padding, boxWidth - (padding * 2), boxHeight - (padding * 2));
        } catch (e) {
          doc.setTextColor(255, 0, 0);
          doc.setFontSize(9);
          doc.text("Erreur d'affichage", x + padding + 10, y + boxHeight / 2);
        }

        count++;
      }
    }

    doc.save(`Enveloppe_${reportHeader.beneficiaire || 'Rapport'}.pdf`);
    toast.dismiss(loadingToast);
    toast.success("PDF généré avec succès !");
  };

  const inputClass = "w-full bg-slate-900/60 border border-slate-700 rounded-lg px-1 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition text-center";
  const inputHeaderClass = "w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition";
  const labelClass = "block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5";
  const imgButtonClass = "w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-[10px] py-1 rounded flex items-center justify-center gap-1 mt-1 transition";

  const filteredReports = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter(r => 
      (r.header?.beneficiaire || '').toLowerCase().includes(q) ||
      (r.header?.montantAlloue || '').toString().includes(q)
    );
  }, [reports, search]);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>;

  return (
    <section className="p-2 md:p-6" dir="ltr">
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {editingId ? "Modifier le Rapport" : "Nouveau Rapport"}
          </h2>
          <p className="text-sm text-slate-400 mt-1">Gérez vos dépenses et joignez les preuves.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => downloadPDF(header, rows)} className="flex-1 md:flex-none justify-center bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-sm font-bold px-4 py-2 rounded-xl transition flex items-center gap-2">
            <FileDown className="w-4 h-4" />
            PDF
          </button>
          {editingId && (
            <button onClick={resetForm} className="flex-1 md:flex-none justify-center bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition">
              Annuler
            </button>
          )}
          <button onClick={handleSave} disabled={saving || uploadingProofs > 0} className="flex-1 md:flex-none justify-center bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-sm font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50">
            {(saving || uploadingProofs > 0) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? `Sauvegarde... ${saveProgress}` : uploadingProofs > 0 ? `Envoi des preuves... (${uploadingProofs})` : (editingId ? 'Mettre à jour' : 'Sauvegarder')}
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-700/60 rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Bénéficiaire</label>
            <input name="beneficiaire" value={header.beneficiaire} onChange={handleHeaderChange} placeholder="Nom" className={inputHeaderClass} />
          </div>
          <div>
            <label className={labelClass}>Montant Alloué (DH)</label>
            <input name="montantAlloue" type="number" value={header.montantAlloue} onChange={handleHeaderChange} placeholder="0.00" className={inputHeaderClass} />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-700/60 rounded-2xl p-2 md:p-4 mb-6 overflow-hidden">
        <div className="flex justify-end mb-2">
          <button onClick={addRow} className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
            <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300 min-w-[1200px]">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300">
                <th className="py-2 px-1 border border-slate-700 w-8" rowSpan={2}>N°</th>
                <th className="py-2 px-1 border border-slate-700 w-24" rowSpan={2}>Date</th>
                <th className="py-1 border border-slate-700" colSpan={4}>Ciment</th>
                <th className="py-1 border border-slate-700" colSpan={5}>Matériau</th>
                <th className="py-1 border border-slate-700" colSpan={2}>Carburant</th>
                <th className="py-1 border border-slate-700" colSpan={2}>Autres</th>
                <th className="py-2 px-1 border border-slate-700" rowSpan={2}>Total</th>
                <th className="py-2 px-1 border border-slate-700" rowSpan={2}></th>
              </tr>
              <tr className="bg-slate-800/50 text-[10px] text-slate-400">
                <th className="py-1 px-1 border border-slate-700">Qt</th>
                <th className="py-1 px-1 border border-slate-700">Prix U.</th>
                <th className="py-1 px-1 border border-slate-700">Total</th>
                <th className="py-1 px-1 border border-slate-700">Img</th>

                <th className="py-1 px-1 border border-slate-700">Type</th>
                <th className="py-1 px-1 border border-slate-700">Qt</th>
                <th className="py-1 px-1 border border-slate-700">Prix U.</th>
                <th className="py-1 px-1 border border-slate-700">Total</th>
                <th className="py-1 px-1 border border-slate-700">Img</th>

                <th className="py-1 px-1 border border-slate-700">Montant</th>
                <th className="py-1 px-1 border border-slate-700">Img</th>

                <th className="py-1 px-1 border border-slate-700">Montant</th>
                <th className="py-1 px-1 border border-slate-700">Img</th>
              </tr>
            </thead>
            <tbody>
              {calculatedRows.map((d, i) => (
                <tr key={d.id} className="hover:bg-white/5 border-b border-slate-800">
                  <td className="text-center font-bold text-slate-400 border border-slate-800">{i + 1}</td>
                  <td className="p-1 border border-slate-800"><input type="date" value={d.date} onChange={(e) => handleRowChange(d.id, 'date', e.target.value)} className={inputClass} /></td>
                  
                  <td className="p-1 border border-slate-800"><input type="number" value={d.cimentQt} onChange={(e) => handleRowChange(d.id, 'cimentQt', e.target.value)} className={inputClass} /></td>
                  <td className="p-1 border border-slate-800"><input type="number" value={d.cimentPrix} onChange={(e) => handleRowChange(d.id, 'cimentPrix', e.target.value)} className={inputClass} /></td>
                  <td className="text-center font-mono text-cyan-400 border border-slate-800 bg-slate-900/30">{d.cimentTotal ? d.cimentTotal.toFixed(2) : ''}</td>
                  <td className="border border-slate-800 p-1 align-top">
                    {d.cimentTotal > 0 && (
                      d.cimentImg ? (
                        <div className="relative group"><img src={d.cimentImg} className="h-8 w-full object-cover rounded border border-slate-600" /><button onClick={() => removeImage(d.id, 'cimentImg')} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3 text-white"/></button></div>
                      ) : <button onClick={() => triggerImageUpload(d.id, 'cimentImg')} className={imgButtonClass}><ImageIcon className="w-3 h-3"/>Preuve</button>
                    )}
                  </td>

                  <td className="p-1 border border-slate-800 align-top">
                    <input
                      type="text"
                      list={`material-types-${d.id}`}
                      value={materialInputValue(d)}
                      onChange={(e) => handleMaterialChange(d.id, e.target.value)}
                      placeholder="Choisir ou taper un matériau…"
                      className={`${inputClass} !py-1.5 !text-[11px] min-w-[110px]`}
                    />
                    <datalist id={`material-types-${d.id}`}>
                      {MATERIAL_TYPES.filter((t) => t !== 'Autre').map((t) => <option key={t} value={t} />)}
                    </datalist>
                  </td>
                  <td className="p-1 border border-slate-800"><input type="number" value={d.argileQt} onChange={(e) => handleRowChange(d.id, 'argileQt', e.target.value)} className={inputClass} /></td>
                  <td className="p-1 border border-slate-800"><input type="number" value={d.argilePrix} onChange={(e) => handleRowChange(d.id, 'argilePrix', e.target.value)} className={inputClass} /></td>
                  <td className="text-center font-mono text-cyan-400 border border-slate-800 bg-slate-900/30">{d.argileTotal ? d.argileTotal.toFixed(2) : ''}</td>
                  <td className="border border-slate-800 p-1 align-top">
                    {d.argileTotal > 0 && (
                      d.argileImg ? (
                        <div className="relative group"><img src={d.argileImg} className="h-8 w-full object-cover rounded border border-slate-600" /><button onClick={() => removeImage(d.id, 'argileImg')} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3 text-white"/></button></div>
                      ) : <button onClick={() => triggerImageUpload(d.id, 'argileImg')} className={imgButtonClass}><ImageIcon className="w-3 h-3"/>Preuve</button>
                    )}
                  </td>

                  <td className="p-1 border border-slate-800"><input type="number" value={d.carburant} onChange={(e) => handleRowChange(d.id, 'carburant', e.target.value)} className={inputClass} /></td>
                  <td className="border border-slate-800 p-1 align-top">
                    {d.carburant > 0 && (
                      d.carburantImg ? (
                        <div className="relative group"><img src={d.carburantImg} className="h-8 w-full object-cover rounded border border-slate-600" /><button onClick={() => removeImage(d.id, 'carburantImg')} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3 text-white"/></button></div>
                      ) : <button onClick={() => triggerImageUpload(d.id, 'carburantImg')} className={imgButtonClass}><ImageIcon className="w-3 h-3"/>Preuve</button>
                    )}
                  </td>

                  <td className="p-1 border border-slate-800"><input type="number" value={d.autres} onChange={(e) => handleRowChange(d.id, 'autres', e.target.value)} className={inputClass} /></td>
                  <td className="border border-slate-800 p-1 align-top">
                    {d.autres > 0 && (
                      d.autresImg ? (
                        <div className="relative group"><img src={d.autresImg} className="h-8 w-full object-cover rounded border border-slate-600" /><button onClick={() => removeImage(d.id, 'autresImg')} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3 text-white"/></button></div>
                      ) : <button onClick={() => triggerImageUpload(d.id, 'autresImg')} className={imgButtonClass}><ImageIcon className="w-3 h-3"/>Preuve</button>
                    )}
                  </td>

                  <td className="text-center font-bold text-emerald-400 border border-slate-800 bg-slate-900/30">{d.totalLigne ? d.totalLigne.toFixed(2) : ''}</td>
                  <td className="text-center border border-slate-800">
                    <button onClick={() => removeRow(d.id)} disabled={rows.length === 1} className="text-slate-500 hover:text-red-400 disabled:opacity-30 p-1"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-700/60 rounded-2xl p-4 max-w-sm mb-10">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Récapitulatif</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center border-b border-slate-700/50 pb-1">
            <span className="text-xs text-slate-400">Montant alloué</span>
            <span className="font-mono font-bold text-white text-sm">{montantAlloue.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-700/50 pb-1">
            <span className="text-xs text-slate-400">Total dépensé</span>
            <span className="font-mono font-bold text-cyan-400 text-sm">{totals.totalGeneral.toFixed(2)} DH</span>
          </div>
          <div className={`flex justify-between items-center pt-2 ${soldeRestant < 0 ? 'text-red-500' : soldeRestant === 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
            <span className="text-xs font-bold flex items-center gap-1">
              {soldeRestant <= 0 && <AlertTriangle className="w-4 h-4" />}
              Solde restant
            </span>
            <span className="font-mono font-bold text-lg">{soldeRestant.toFixed(2)} DH</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/60 rounded-2xl p-5 md:p-6 shadow-lg max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Rapports Sauvegardés ({filteredReports.length})
            </h3>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full sm:w-64 bg-slate-900/60 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition" />
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <p className="text-center text-slate-500 py-10 text-sm">Aucun rapport sauvegardé</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="text-left py-2 px-2">Bénéficiaire</th>
                  <th className="text-center py-2 px-2">Montant Alloué</th>
                  <th className="text-center py-2 px-2">Dépensé</th>
                  <th className="text-center py-2 px-2">Solde</th>
                  <th className="text-center py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r) => {
                  const totDepense = r.rows.reduce((sum, row) => {
                    const ciment = (parseFloat(row.cimentQt) || 0) * (parseFloat(row.cimentPrix) || 0);
                    const argile = (parseFloat(row.argileQt) || 0) * (parseFloat(row.argilePrix) || 0);
                    const carb = parseFloat(row.carburant) || 0;
                    const aut = parseFloat(row.autres) || 0;
                    return sum + ciment + argile + carb + aut;
                  }, 0);
                  const alloue = parseFloat(r.header.montantAlloue) || 0;
                  const solde = alloue - totDepense;

                  return (
                    <tr key={r.id} className="border-b border-slate-800 hover:bg-white/5">
                      <td className="py-2 px-2">{r.header.beneficiaire || 'Sans nom'}</td>
                      <td className="text-center py-2 px-2 font-mono text-slate-300">{alloue.toFixed(2)}</td>
                      <td className="text-center py-2 px-2 font-mono text-cyan-400">{totDepense.toFixed(2)}</td>
                      <td className={`text-center py-2 px-2 font-mono font-bold ${solde < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{solde.toFixed(2)}</td>
                      <td className="text-center py-2 px-2">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => downloadPDF(r.header, r.rows)} className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg p-1.5 transition" title="Télécharger PDF">
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleEditClick(r)} className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg p-1.5 transition" title="Modifier">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteReport(r.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg p-1.5 transition" title="Supprimer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};