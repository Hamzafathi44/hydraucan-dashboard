import { useState, useMemo, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { Wallet, FileDown, Plus, Trash2, Image as ImageIcon, X, Save, Loader2, AlertTriangle } from 'lucide-react';

const DOC_ID = 'monthly_report'; // We save one main report for now

export const EnveloppeFinanciereView = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [header, setHeader] = useState({
    beneficiaire: '',
    montantAlloue: ''
  });

  const [rows, setRows] = useState([]);

  // Image Upload State
  const fileInputRef = useRef(null);
  const [activeUpload, setActiveUpload] = useState({ rowId: null, field: null });

  // 1. Load Data from Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        const docRef = doc(db, 'enveloppe_reports', DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setHeader(data.header || { beneficiaire: '', montantAlloue: '' });
          setRows(data.rows || []);
        } else {
          // Default empty row if no data exists
          setRows([{ id: Date.now(), cimentQt: '', cimentPrix: '', cimentImg: null, argileQt: '', argilePrix: '', argileImg: null, carburant: '', carburantImg: null, autres: '', autresImg: null }]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. Save Data to Firestore
  const saveData = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'enveloppe_reports', DOC_ID);
      await setDoc(docRef, { header, rows }, { merge: true });
      toast.success("Rapport sauvegardé avec succès !");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleHeaderChange = (e) => {
    setHeader({ ...header, [e.target.name]: e.target.value });
  };

  const handleRowChange = (id, field, value) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRow = () => {
    setRows([...rows, { id: Date.now(), cimentQt: '', cimentPrix: '', cimentImg: null, argileQt: '', argilePrix: '', argileImg: null, carburant: '', carburantImg: null, autres: '', autresImg: null }]);
  };

  const removeRow = (id) => {
    if (rows.length === 1) return;
    setRows(rows.filter(r => r.id !== id));
  };

  // 3. Image Handlers
  const triggerImageUpload = (rowId, field) => {
    setActiveUpload({ rowId, field });
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !activeUpload.rowId || !activeUpload.field) return;

    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Image trop lourde (max 1.5MB pour éviter de bloquer la base)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setRows(rows.map(r => 
        r.id === activeUpload.rowId ? { ...r, [activeUpload.field]: base64 } : r
      ));
      toast.success("Preuve ajoutée");
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = (rowId, field) => {
    setRows(rows.map(r => r.id === rowId ? { ...r, [field]: null } : r));
  };

  // 4. Calculations (Fixed)
  const calculatedRows = useMemo(() => {
    return rows.map((d) => {
      const cimentTotal = (parseFloat(d.cimentQt) || 0) * (parseFloat(d.cimentPrix) || 0);
      const argileTotal = (parseFloat(d.argileQt) || 0) * (parseFloat(d.argilePrix) || 0);
      const carburant = parseFloat(d.carburant) || 0;
      const autres = parseFloat(d.autres) || 0;
      
      const totalJour = cimentTotal + argileTotal + carburant + autres;
      return { ...d, cimentTotal, argileTotal, totalJour };
    });
  }, [rows]);

  const totals = useMemo(() => {
    return calculatedRows.reduce((acc, curr) => ({
      cimentTotal: acc.cimentTotal + curr.cimentTotal,
      argileTotal: acc.argileTotal + curr.argileTotal,
      carburant: acc.carburant + (parseFloat(curr.carburant) || 0),
      autres: acc.autres + (parseFloat(curr.autres) || 0),
      totalJour: acc.totalJour + curr.totalJour,
    }), { cimentTotal: 0, argileTotal: 0, carburant: 0, autres: 0, totalJour: 0 });
  }, [calculatedRows]);

  const montantAlloue = parseFloat(header.montantAlloue) || 0;
  const soldeRestant = montantAlloue - totals.totalJour;

  // 5. PDF Generation with Multiple Images
  const handleGeneratePDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const loadingToast = toast.loading("Génération du PDF...");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("SITUATION DE CONSOMMATION DE L'ENVELOPPE FINANCIÈRE", 148, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Bénéficiaire : ${header.beneficiaire || '................................'}`, 14, 25);
    doc.text(`Montant alloué : ${montantAlloue.toFixed(2)} DH`, 14, 31);

    // We use a simplified table for PDF to show images neatly
    const tableBody = calculatedRows.map((d, index) => {
      // We construct the image string (comma separated if multiple, but here we show just the presence)
      return [
        index + 1,
        d.cimentQt, d.cimentPrix, d.cimentTotal ? d.cimentTotal.toFixed(2) : '',
        d.argileQt, d.argilePrix, d.argileTotal ? d.argileTotal.toFixed(2) : '',
        d.carburant,
        d.autres,
        d.totalJour ? d.totalJour.toFixed(2) : '',
        '' // Placeholder for images, we'll draw them manually
      ];
    });

    tableBody.push([
      { content: 'TOTAL', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } },
      '', '', totals.cimentTotal.toFixed(2),
      '', '', totals.argileTotal.toFixed(2),
      totals.carburant.toFixed(2),
      totals.autres.toFixed(2),
      totals.totalJour.toFixed(2),
      ''
    ]);

    autoTable(doc, {
      head: [
        [
          { content: 'N°', rowSpan: 2 },
          { content: 'Ciment', colSpan: 3, styles: { halign: 'center' } },
          { content: 'Argile / Faïence', colSpan: 3, styles: { halign: 'center' } },
          { content: 'Carburant', rowSpan: 2 },
          { content: 'Autres', rowSpan: 2 },
          { content: 'Total', rowSpan: 2 },
          { content: 'Preuves (Images)', rowSpan: 2 }
        ],
        ['Qt', 'Prix U.', 'Total', 'Qt', 'Prix U.', 'Total']
      ],
      body: tableBody,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1, halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 12 }, 2: { cellWidth: 15 }, 3: { cellWidth: 20 },
        4: { cellWidth: 12 }, 5: { cellWidth: 15 }, 6: { cellWidth: 20 },
        7: { cellWidth: 20 }, 8: { cellWidth: 20 }, 9: { cellWidth: 20 },
        10: { cellWidth: 40 } // Wide column for images
      },
      didDrawCell: function (data) {
        // Draw images in the last column (index 10)
        if (data.section === 'body' && data.column.index === 10) {
          const rowData = calculatedRows[data.row.index];
          if (!rowData) return;

          // Collect all images for this row
          const images = [rowData.cimentImg, rowData.argileImg, rowData.carburantImg, rowData.autresImg].filter(img => img);
          
          if (images.length > 0) {
            const padding = 1;
            const imgWidth = (data.cell.width - (padding * (images.length + 1))) / images.length;
            const imgHeight = data.cell.height - (padding * 2);

            images.forEach((img, idx) => {
              const x = data.cell.x + padding + (idx * (imgWidth + padding));
              try {
                doc.addImage(img, 'JPEG', x, data.cell.y + padding, imgWidth, imgHeight);
              } catch (err) {
                console.warn("Image error", err);
              }
            });
          }
        }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    
    autoTable(doc, {
      head: [['Récapitulatif', 'Montant (DH)']],
      body: [
        ['Montant alloué', montantAlloue.toFixed(2)],
        ['Total dépensé', totals.totalJour.toFixed(2)],
        ['Solde restant', soldeRestant.toFixed(2)]
      ],
      startY: finalY,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [60, 179, 143], textColor: 255, fontStyle: 'bold' },
      margin: { left: 14, right: 200 }
    });

    doc.save(`Enveloppe.pdf`);
    toast.dismiss(loadingToast);
    toast.success("PDF généré !");
  };

  const inputClass = "w-full bg-slate-900/60 border border-slate-700 rounded-lg px-1 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition text-center";
  const inputHeaderClass = "w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition";
  const labelClass = "block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5";
  const imgButtonClass = "w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-[10px] py-1 rounded flex items-center justify-center gap-1 mt-1 transition";

  if (loading) {
    return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>;
  }

  return (
    <section className="p-2 md:p-6" dir="ltr">
      {/* Hidden File Input */}
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Enveloppe Financière</h2>
          <p className="text-sm text-slate-400 mt-1">Gérez vos dépenses et joignez les preuves.</p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={saveData} disabled={saving} className="flex-1 md:flex-none justify-center bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-sm font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          <button onClick={handleGeneratePDF} className="flex-1 md:flex-none justify-center bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-sm font-bold px-4 py-2 rounded-xl transition flex items-center gap-2">
            <FileDown className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* HEADER */}
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

      {/* TABLE */}
      <div className="bg-slate-900/50 border border-slate-700/60 rounded-2xl p-2 md:p-4 mb-6 overflow-hidden">
        <div className="flex justify-end mb-2">
          <button onClick={addRow} className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
            <Plus className="w-="3.5 h-3.5" /> Ajpyouter une ligne
          </-button>
        </div>

        <div className="1overflow-x-auto">
          <table className px="w-full text-xs text--slate-300 min-w-[1000px]">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300">
                <th className="py-2 px-1 border border-slate-700 w-8" rowSpan={2}>N°</th>
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
                <th className1 border border-slate-700">Img</th>
              </tr>
            </thead>
            <tbody>
              {calculatedRows.map((d, i) => (
                <tr key={d.id} className="hover:bg-white/5 border-b border-slate-800">
                  <td className="text-center font-bold text-slate-400 border border-slate-800">{i + 1}</td>
                  
                  {/* CIMENT */}
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

                  {/* ARGILE */}
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

                  {/* CARBURANT */}
                  <td className="p-1 border border-slate-800"><input type="number" value={d.carburant} onChange={(e) => handleRowChange(d.id, 'carburant', e.target.value)} className={inputClass} /></td>
                  <td className="border border-slate-800 p-1 align-top">
                    {d.carburant > 0 && (
                      d.carburantImg ? (
                        <div className="relative group"><img src={d.carburantImg} className="h-8 w-full object-cover rounded border border-slate-600" /><button onClick={() => removeImage(d.id, 'carburantImg')} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3 text-white"/></button></div>
                      ) : <button onClick={() => triggerImageUpload(d.id, 'carburantImg')} className={imgButtonClass}><ImageIcon className="w-3 h-3"/>Preuve</button>
                    )}
                  </td>

                  {/* AUTRES */}
                  <td className="p-1 border border-slate-800"><input type="number" value={d.autres} onChange={(e) => handleRowChange(d.id, 'autres', e.target.value)} className={inputClass} /></td>
                  <td className="border border-slate-800 p-1 align-top">
                    {d.autres > 0 && (
                      d.autresImg ? (
                        <div className="relative group"><img src={d.autresImg} className="h-8 w-full object-cover rounded border border-slate-600" /><button onClick={() => removeImage(d.id, 'autresImg')} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3 text-white"/></button></div>
                      ) : <button onClick={() => triggerImageUpload(d.id, 'autresImg')} className={imgButtonClass}><ImageIcon className="w-3 h-3"/>Preuve</button>
                    )}
                  </td>

                  {/* TOTAL & DELETE */}
                  <td className="text-center font-bold text-emerald-400 border border-slate-800 bg-slate-900/30">{d.totalJour ? d.totalJour.toFixed(2) : ''}</td>
                  <td className="text-center border border-slate-800">
                    <button onClick={() => removeRow(d.id)} disabled={rows.length === 1} className="text-slate-500 hover:text-red-400 disabled:opacity-30 p-1"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              
              {/* TOTALS ROW */}
              <tr className="bg-slate-800/80 font-bold text-white border-t-2 border-cyan-500/50">
                <td colSpan={3} className="text-center py-3 border border-slate-700">TOTAL CIMENT</td>
                <td className="text-center text-cyan-400 border border-slate-700 bg-slate-900/30">{totals.cimentTotal.toFixed(2)}</td>
                <td colSpan={4} className="text-center py-3 border border-slate-700">TOTAL ARGILE</td>
                <td className="text-center text-cyan-400 border border-slate-700 bg-slate-900/30">{totals.argileTotal.toFixed(2)}</td>
                <td colSpan={2} className="text-center py-3 border border-slate-700">TOTAL CARBURANT</td>
                <td className="text-center text-cyan-400 border border-slate-700 bg-slate-900/30">{totals.carburant.toFixed(2)}</td>
                <td colSpan={2} className="text-center py-3 border border-slate-700">TOTAL AUTRES</td>
                <td className="text-center text-cyan-400 border border-slate-700 bg-slate-900/30">{totals.autres.toFixed(2)}</td>
                <td className="text-center text-emerald-400 text-sm border border-slate-700">{totals.totalJour.toFixed(2)}</td>
                <td className="border border-slate-700"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="bg-slate-900/50 border border-slate-700/60 rounded-2xl p-4 max-w-sm">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Récapitulatif</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center border-b border-slate-700/50 pb-1">
            <span className="text-xs text-slate-400">Montant alloué</span>
            <span className="font-mono font-bold text-white text-sm">{montantAlloue.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-700/50 pb-1">
            <span className="text-xs text-slate-400">Total dépensé</span>
            <span className="font-mono font-bold text-cyan-400 text-sm">{totals.totalJour.toFixed(2)} DH</span>
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
    </section>
  );
};