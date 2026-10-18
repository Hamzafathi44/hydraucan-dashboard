import { useState, useMemo, useRef, useEffect } from 'react';
import { useEnveloppes } from '../hooks/useEnveloppes';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { Wallet, FileDown, Plus, Trash2, Image as ImageIcon, X, Save, Loader2, AlertTriangle, Pencil, Search } from 'lucide-react';

export const EnveloppeFinanciereView = () => {
  const { reports, loading, addReport, updateReport, deleteReport } = useEnveloppes();
  
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');

  // ✅ Date removed from header
  const [header, setHeader] = useState({ beneficiaire: '', montantAlloue: '' });
  const [rows, setRows] = useState([]);
  
  const fileInputRef = useRef(null);
  const [activeUpload, setActiveUpload] = useState({ rowId: null, field: null });

  // ✅ Date added to the row
  const createEmptyRow = () => ({
    id: Date.now() + Math.random(),
    date: '',
    cimentQt: '', cimentPrix: '', cimentImg: null,
    argileQt: '', argilePrix: '', argileImg: null,
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
    setHeader(report.header);
    setRows(report.rows);
    setEditingId(report.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!header.beneficiaire || !header.montantAlloue) {
      return toast.error("Veuillez remplir le bénéficiaire et le montant");
    }
    
    setSaving(true);
    let result;
    if (editingId) {
      result = await updateReport(editingId, { header, rows });
    } else {
      result = await addReport({ header, rows });
    }
    setSaving(false);

    if (result.success) {
      toast.success(editingId ? "Rapport mis à jour !" : "Rapport sauvegardé !");
      resetForm();
    } else {
      toast.error("Erreur de sauvegarde");
    }
  };

  const handleHeaderChange = (e) => setHeader({ ...header, [e.target.name]: e.target.value });
  const handleRowChange = (id, field, value) => setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
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
        const scale = Math.min(1, 800 / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const safeBase64 = canvas.toDataURL('image/jpeg', 0.7);
        
        setRows(rows.map(r => r.id === activeUpload.rowId ? { ...r, [activeUpload.field]: safeBase64 } : r));
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

  const downloadPDF = async (reportHeader, reportRows) => {
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

    // --- 1. HEADER (LOGO & TEXT) ---
    try {
      const logoData = await toBase64('/logo-hydracane.png');
      doc.addImage(logoData, 'PNG', 14, 10, 30, 12); 
    } catch (e) {
      console.warn("Logo not found");
    }

    // Title (Centered)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("SITUATION DE CONSOMMATION DE L'ENVELOPPE FINANCIÈRE", 148, 20, { align: 'center' });

    // Info text
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Bénéficiaire : ${reportHeader.beneficiaire || '................................'}`, 14, 32);
    doc.text(`Montant de l'enveloppe allouée : ${alloue.toFixed(2)} DH`, 14, 38);

    // Objet text
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("Objet : Suivi de l'utilisation des fonds alloués par l'entreprise, détaillant les dépenses effectuées et le solde restant disponible.", 14, 45);

    // --- 2. MAIN TABLE ---
    // ✅ Added 'Date' to the table body
    const tableBody = processedRows.map((d, index) => [
      index + 1,
      d.date || '',
      d.cimentQt, d.cimentPrix, d.cimentTotal ? d.cimentTotal.toFixed(2) : '',
      d.argileQt, d.argilePrix, d.argileTotal ? d.argileTotal.toFixed(2) : '',
      d.carburant,
      d.autres,
      d.totalLigne ? d.totalLigne.toFixed(2) : ''
    ]);

    // ✅ PERFECTLY ALIGNED TOTAL ROW (covers 11 columns: 0=N°, 1=Date, 2=C.Qt, 3=C.Prix, 4=C.Tot, 5=A.Qt, 6=A.Prix, 7=A.Tot, 8=Carb, 9=Aut, 10=Tot)
    tableBody.push([
      { content: 'TOTAL', colSpan: 3, styles: { fontStyle: 'bold', halign: 'center' } },
      '', // Ciment Qt
      '', // Ciment Prix
      finalTotals.cimentTotal.toFixed(2), // Ciment Total
      '', // Argile Qt
      '', // Argile Prix
      finalTotals.argileTotal.toFixed(2), // Argile Total
      finalTotals.carburant.toFixed(2),
      finalTotals.autres.toFixed(2),
      finalTotals.totalGeneral.toFixed(2)
    ]);

    autoTable(doc, {
      head: [
        [
          { content: 'N°', rowSpan: 2 },
          { content: 'Date', rowSpan: 2 }, // ✅ NEW DATE COLUMN
          { content: 'Ciment', colSpan: 3, styles: { halign: 'center' } },
          { content: 'Argile / Faïence', colSpan: 3, styles: { halign: 'center' } },
          { content: 'Carburant', rowSpan: 2 },
          { content: 'Autres', rowSpan: 2 },
          { content: 'Total', rowSpan: 2 }
        ],
        ['Qt', 'Prix U.', 'Total', 'Qt', 'Prix U.', 'Total']
      ],
      body: tableBody,
      startY: 52,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2, halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [60, 179, 143], textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 10 },  // N°
        1: { cellWidth: 22 },  // Date
        2: { cellWidth: 15 }, 3: { cellWidth: 15 }, 4: { cellWidth: 20 }, // Ciment
        5: { cellWidth: 15 }, 6: { cellWidth: 15 }, 7: { cellWidth: 20 }, // Argile
        8: { cellWidth: 20 },  // Carburant
        9: { cellWidth: 20 },  // Autres
        10: { cellWidth: 25 }  // Total
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
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [60, 179, 143], textColor: 255, fontStyle: 'bold' },
      margin: { left: 14, right: 200 }
    });

    // --- 4. PROOF IMAGES (6 PER PAGE) ---
    const imagesToPrint = [];
    processedRows.forEach((row, index) => {
      if (row.cimentImg) imagesToPrint.push({ label: 'Ciment', amount: row.cimentTotal, img: row.cimentImg, line: index + 1 });
      if (row.argileImg) imagesToPrint.push({ label: 'Argile / Faïence', amount: row.argileTotal, img: row.argileImg, line: index + 1 });
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
      imagesToPrint.forEach((item) => {
        if (count > 0 && count % 6 === 0) {
          doc.addPage();
          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          doc.text("JUSTIFICATIFS DES DÉPENSES (SUITE)", 148, 15, { align: 'center' });
        }

        const col = count % 2; // 0 for left, 1 for right
        const row = Math.floor((count % 6) / 2); // 0, 1, 2

        const x = col === 0 ? 14 : 148; 
        const y = 30 + (row * 70); 

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.text(`Ligne ${item.line} - ${item.label} : ${item.amount.toFixed(2)} DH`, x, y - 2);

        try {
          doc.setDrawColor(200, 200, 200);
          doc.rect(x, y, 135, 60); 
          doc.addImage(item.img, 'JPEG', x, y, 135, 60);
        } catch (e) {
          doc.setTextColor(255, 0, 0);
          doc.text("Erreur d'affichage de l'image", x + 2, y + 10);
        }

        count++;
      });
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
          <button onClick={handleSave} disabled={saving} className="flex-1 md:flex-none justify-center bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-sm font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Sauvegarde...' : (editingId ? 'Mettre à jour' : 'Sauvegarder')}
          </button>
        </div>
      </div>

      {/* HEADER FORM (No Date) */}
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
          <table className="w-full text-xs text-slate-300 min-w-[1100px]">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300">
                <th className="py-2 px-1 border border-slate-700 w-8" rowSpan={2}>N°</th>
                <th className="py-2 px-1 border border-slate-700 w-24" rowSpan={2}>Date</th> {/* ✅ NEW DATE COLUMN */}
                <th className="py-1 border border-slate-700" colSpan={4}>Ciment</th>
                <th className="py-1 border border-slate-700" colSpan={4}>Argile / Faïence</th>
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
                  <td className="p-1 border border-slate-800"><input type="date" value={d.date} onChange={(e) => handleRowChange(d.id, 'date', e.target.value)} className={inputClass} /></td> {/* ✅ DATE INPUT IN ROW */}
                  
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
            <table className="w-full text-xs text-slate- py300">
              <thead>
                <tr className="border--b border-slate-700 text-slate-400 uppercase tracking-w2ider text-[10px]">
                  px <th className="text--left py-2 px-2">Bénéficiaire</th>
                  <th className="text-center py-2 px-2">Montant Alloué</th>
                  <th className="text-center py-2 px-2">Dépensé</th>
                  <th className="text-center2">Solde</th>
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