import { useState, useMemo, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { Wallet, FileDown, Plus, Trash2, Image as ImageIcon, X } from 'lucide-react';

export const EnveloppeFinanciereView = () => {
  const [header, setHeader] = useState({
    beneficiaire: '',
    montantAlloue: ''
  });

  // Start with 1 empty row
  const [rows, setRows] = useState([
    { id: Date.now(), cimentQt: '', cimentPrix: '', argileQt: '', argilePrix: '', carburant: '', autres: '', image: null }
  ]);

  // Hidden file input for image upload
  const fileInputRef = useRef(null);
  const [activeUploadId, setActiveUploadId] = useState(null);

  const handleHeaderChange = (e) => {
    setHeader({ ...header, [e.target.name]: e.target.value });
  };

  const handleRowChange = (id, field, value) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRow = () => {
    setRows([...rows, { id: Date.now(), cimentQt: '', cimentPrix: '', argileQt: '', argilePrix: '', carburant: '', autres: '', image: null }]);
  };

  const removeRow = (id) => {
    if (rows.length === 1) return;
    setRows(rows.filter(r => r.id !== id));
  };

  // Image Upload Handler
  const triggerImageUpload = (id) => {
    setActiveUploadId(id);
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !activeUploadId) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image trop lourde (max 2MB pour le PDF)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setRows(rows.map(r => r.id === activeUploadId ? { ...r, image: base64 } : r));
      toast.success("Image ajoutée");
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset
  };

  const removeImage = (id) => {
    setRows(rows.map(r => r.id === id ? { ...r, image: null } : r));
  };

  const calculatedRows = useMemo(() => {
    return rows.map((d) => {
      const cimentTotal = (parseFloat(d.cimentQt) || 0) * (parseFloat(d.cimentPrix) || 0);
      const argileTotal = (parseFloat(d.argileQt) || 0) * (parseFloat(d.argilePrix) || 0);
      const carburant = parseFloat(d.carburant) || 0;
      const autres = parseFloat(d.autres) || 0;
      
      const totalJour = cimentTotal + argileTotal + carburant + autres;
      
      return {
        ...d,
        cimentTotal,
        argileTotal,
        totalJour
      };
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

    doc.setFont("helvetica", "italic");
    doc.text("Objet : Suivi de l'utilisation des fonds alloués par l'entreprise, détaillant les dépenses effectuées et le solde restant disponible.", 14, 39);

    const tableBody = calculatedRows.map((d, index) => [
      index + 1,
      d.cimentQt,
      d.cimentPrix,
      d.cimentTotal ? d.cimentTotal.toFixed(2) : '',
      d.argileQt,
      d.argilePrix,
      d.argileTotal ? d.argileTotal.toFixed(2) : '',
      d.carburant,
      d.autres,
      d.totalJour ? d.totalJour.toFixed(2) : '',
      d.image ? 'Oui' : '' // We use didDrawCell to actually draw the image
    ]);

    tableBody.push([
      { content: 'TOTAL', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } },
      '',
      '',
      totals.cimentTotal.toFixed(2),
      '',
      '',
      totals.argileTotal.toFixed(2),
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
          { content: 'Carburant (DH)', rowSpan: 2 },
          { content: 'Autres', rowSpan: 2 },
          { content: 'Total', rowSpan: 2 },
          { content: 'Preuve', rowSpan: 2 }
        ],
        [
          'Qt', 'Prix U.', 'Total',
          'Qt', 'Prix U.', 'Total'
        ]
      ],
      body: tableBody,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.5, halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 }, // N°
        1: { cellWidth: 15 }, 2: { cellWidth: 18 }, 3: { cellWidth: 22 }, // Ciment
        4: { cellWidth: 15 }, 5: { cellWidth: 18 }, 6: { cellWidth: 22 }, // Argile
        7: { cellWidth: 25 }, // Carburant
        8: { cellWidth: 25 }, // Autres
        9: { cellWidth: 25 }, // Total
        10: { cellWidth: 35 } // Image
      },
      didDrawCell: function (data) {
        // Draw the image in the last column (index 10)
        if (data.section === 'body' && data.column.index === 10) {
          const rowData = calculatedRows[data.row.index];
          if (rowData && rowData.image) {
            try {
              // Add image scaled to fit the cell
              const padding = 1.5;
              doc.addImage(
                rowData.image, 
                'JPEG', 
                data.cell.x + padding, 
                data.cell.y + padding, 
                data.cell.width - (padding * 2), 
                data.cell.height - (padding * 2)
              );
            } catch (err) {
              console.warn("Could not render image in PDF", err);
            }
          }
        }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    
    autoTable(doc, {
      head: [['Récapitulatif de l\'Enveloppe', 'Montant (DH)']],
      body: [
        ['Montant de l\'enveloppe allouée', montantAlloue.toFixed(2)],
        ['Total des dépenses effectuées', totals.totalJour.toFixed(2)],
        ['Solde restant disponible', soldeRestant.toFixed(2)]
      ],
      startY: finalY,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [60, 179, 143], textColor: 255, fontStyle: 'bold' },
      margin: { left: 14, right: 200 }
    });

    doc.save(`Enveloppe.pdf`);
    toast.dismiss(loadingToast);
    toast.success("PDF généré avec succès");
  };

  const inputClass = "w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition";
  const inputHeaderClass = "w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition";
  const labelClass = "block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

  return (
    <section className="p-4 md:p-6" dir="ltr">
      {/* Hidden file input */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleImageChange} 
        className="hidden" 
      />

      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-white">Enveloppe Financière</h2>
        <p className="text-sm text-slate-400 mt-1">
          Suivi de consommation et calcul des dépenses
        </p>
      </div>

      {/* HEADER */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/60 rounded-2xl p-5 md:p-6 shadow-lg mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Informations Générales
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Bénéficiaire</label>
            <input name="beneficiaire" value={header.beneficiaire} onChange={handleHeaderChange} placeholder="Nom du bénéficiaire" className={inputHeaderClass} />
          </div>
          <div>
            <label className={labelClass}>Montant de l'enveloppe (DH)</label>
            <input name="montantAlloue" type="number" step="0.01" value={header.montantAlloue} onChange={handleHeaderChange} placeholder="0.00" className={inputHeaderClass} />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/60 rounded-2xl p-5 md:p-6 shadow-lg mb-6 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tableau des Dépenses</h3>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={addRow}
              className="flex-1 md:flex-none justify-center bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter Ligne
            </button>
            <button
              onClick={handleGeneratePDF}
              className="flex-1 md:flex-none justify-center bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-sm font-bold px-4 py-2 rounded-xl transition flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300 min-w-[1100px]">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300">
                <th className="py-2 px-1 border border-slate-700 w-10" rowSpan={2}>N°</th>
                <th className="py-1 border border-slate-700" colSpan={3}>Ciment</th>
                <th className="py-1 border border-slate-700" colSpan={3}>Argile / Faïence</th>
                <th className="py-2 px-1 border border-slate-700" rowSpan={2}>Carburant</th>
                <th className="py-2 px-1 border border-slate-700" rowSpan={2}>Autres</th>
                <th className="py-2 px-1 border border-slate-700" rowSpan={2}>Total</th>
                <th className="py-2 px-1 border border-slate-700" rowSpan={2}>Preuve (Image)</th>
                <th className="py-2 px-1 border border-slate-700" rowSpan={2}></th>
              </tr>
              <tr className="bg-slate-800/50 text-[10px] text-slate-400">
                <th className="py-1 px-1 border border-slate-700">Qt</th>
                <th className="py-1 px-1 border border-slate-700">Prix U.</th>
                <th className="py-1 px-1 border border-slate-700">Total</th>
                <th className="py-1 px-1 border border-slate-700">Qt</th>
                <th className="py-1 px-1 border border-slate-700">Prix U.</th>
                <th className="py-1 px-1 border border-slate-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {calculatedRows.map((d, i) => (
                <tr key={d.id} className="hover:bg-white/5 border-b border-slate-800">
                  <td className="text-center font-bold text-slate-400 border border-slate-800">{i + 1}</td>
                  
                  {/* Ciment */}
                  <td className="p-1 border border-slate-800">
                    <input type="number" value={d.cimentQt} onChange={(e) => handleRowChange(d.id, 'cimentQt', e.target.value)} className={inputClass} />
                  </td>
                  <td className="p-1 border border-slate-800">
                    <input type="number" value={d.cimentPrix} onChange={(e) => handleRowChange(d.id, 'cimentPrix', e.target.value)} className={inputClass} />
                  </td>
                  <td className="text-center font-mono text-cyan-400 border border-slate-800 bg-slate-900/30">
                    {d.cimentTotal ? d.cimentTotal.toFixed(2) : ''}
                  </td>

                  {/* Argile */}
                  <td className="p-1 border border-slate-800">
                    <input type="number" value={d.argileQt} onChange={(e) => handleRowChange(d.id, 'argileQt', e.target.value)} className={inputClass} />
                  </td>
                  <td className="p-1 border border-slate-800">
                    <input type="number" value={d.argilePrix} onChange={(e) => handleRowChange(d.id, 'argilePrix', e.target.value)} className={inputClass} />
                  </td>
                  <td className="text-center font-mono text-cyan-400 border border-slate-800 bg-slate-900/30">
                    {d.argileTotal ? d.argileTotal.toFixed(2) : ''}
                  </td>

                  {/* Carburant & Autres */}
                  <td className="p-1 border border-slate-800">
                    <input type="number" value={d.carburant} onChange={(e) => handleRowChange(d.id, 'carburant', e.target.value)} className={inputClass} />
                  </td>
                  <td className="p-1 border border-slate-800">
                    <input type="number" value={d.autres} onChange={(e) => handleRowChange(d.id, 'autres', e.target.value)} className={inputClass} />
                  </td>

                  {/* Total */}
                  <td className="text-center font-bold text-emerald-400 border border-slate-800 bg-slate-900/30">
                    {d.totalJour ? d.totalJour.toFixed(2) : ''}
                  </td>

                  {/* IMAGE PROOF */}
                  <td className="text-center border border-slate-800 p-1">
                    {d.image ? (
                      <div className="flex items-center justify-center gap-2">
                        <img src={d.image} alt="proof" className="h-8 w-8 object-cover rounded border border-slate-600" />
                        <button onClick={() => removeImage(d.id)} className="text-red-400 hover:text-red-300">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => triggerImageUpload(d.id)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 w-full transition text-[10px]">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Ajouter
                      </button>
                    )}
                  </td>

                  {/* DELETE ROW */}
                  <td className="text-center border border-slate-800">
                    <button onClick={() => removeRow(d.id)} disabled={rows.length === 1} className="text-slate-500 hover:text-red-400 disabled:opacity-30 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* TOTALS ROW */}
              <tr className="bg-slate-800/80 font-bold text-white border-t-2 border-cyan-500/50">
                <td colSpan={3} className="text-center py-3 border border-slate-700">TOTAL</td>
                <td className="text-center text-cyan-400 border border-slate-700">{totals.cimentTotal.toFixed(2)}</td>
                <td colSpan={2} className="border border-slate-700"></td>
                <td className="text-center text-cyan-400 border border-slate-700">{totals.argileTotal.toFixed(2)}</td>
                <td className="text-center text-cyan-400 border border-slate-700">{totals.carburant.toFixed(2)}</td>
                <td className="text-center text-cyan-400 border border-slate-700">{totals.autres.toFixed(2)}</td>
                <td className="text-center text-emerald-400 text-sm border border-slate-700">{totals.totalJour.toFixed(2)}</td>
                <td colSpan={2} className="border border-slate-700"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/60 rounded-2xl p-5 md:p-6 shadow-lg max-w-md">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
          Récapitulatif de l'Enveloppe
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
            <span className="text-sm text-slate-400">Montant alloué</span>
            <span className="font-mono font-bold text-white">{montantAlloue.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
            <span className="text-sm text-slate-400">Total dépensé</span>
            <span className="font-mono font-bold text-cyan-400">{totals.totalJour.toFixed(2)} DH</span>
          </div>
          <div className={`flex justify-between items-center pt-2 ${soldeRestant < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            <span className="text-sm font-bold">Solde restant</span>
            <span className="font-mono font-bold text-lg">{soldeRestant.toFixed(2)} DH</span>
          </div>
        </div>
      </div>
    </section>
  );
};