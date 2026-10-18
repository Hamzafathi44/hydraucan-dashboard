import { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { Wallet, FileDown, Calculator } from 'lucide-react';

const initialDays = Array.from({ length: 31 }, (_, i) => ({
  day: i + 1,
  date: '',
  cimentQt: '',
  cimentPrix: '',
  argileQt: '',
  argilePrix: '',
  carburant: '',
  autres: ''
}));

export const EnveloppeFinanciereView = () => {
  const [header, setHeader] = useState({
    date: '',
    beneficiaire: '',
    montantAlloue: ''
  });

  const [days, setDays] = useState(initialDays);

  const handleHeaderChange = (e) => {
    setHeader({ ...header, [e.target.name]: e.target.value });
  };

  const handleDayChange = (index, field, value) => {
    const updated = [...days];
    updated[index][field] = value;
    setDays(updated);
  };

  const calculatedDays = useMemo(() => {
    return days.map((d) => {
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
  }, [days]);

  const totals = useMemo(() => {
    return calculatedDays.reduce((acc, curr) => ({
      cimentQt: acc.cimentQt + (parseFloat(curr.cimentQt) || 0),
      cimentTotal: acc.cimentTotal + curr.cimentTotal,
      argileQt: acc.argileQt + (parseFloat(curr.argileQt) || 0),
      argileTotal: acc.argileTotal + curr.argileTotal,
      carburant: acc.carburant + (parseFloat(curr.carburant) || 0),
      autres: acc.autres + (parseFloat(curr.autres) || 0),
      totalJour: acc.totalJour + curr.totalJour,
    }), {
      cimentQt: 0, cimentTotal: 0,
      argileQt: 0, argileTotal: 0,
      carburant: 0, autres: 0, totalJour: 0
    });
  }, [calculatedDays]);

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
    doc.text(`Date : ${header.date || '..../..../........'}`, 14, 25);
    doc.text(`Bénéficiaire : ${header.beneficiaire || '................................'}`, 14, 31);
    doc.text(`Montant alloué : ${montantAlloue.toFixed(2)} DH`, 14, 37);

    doc.setFont("helvetica", "italic");
    doc.text("Objet : Suivi de l'utilisation des fonds alloués par l'entreprise, détaillant les dépenses effectuées et le solde restant disponible.", 14, 45);

    const tableBody = calculatedDays.map((d) => [
      d.day,
      d.date,
      d.cimentQt,
      d.cimentPrix,
      d.cimentTotal ? d.cimentTotal.toFixed(2) : '',
      d.argileQt,
      d.argilePrix,
      d.argileTotal ? d.argileTotal.toFixed(2) : '',
      d.carburant,
      d.autres,
      d.totalJour ? d.totalJour.toFixed(2) : ''
    ]);

    tableBody.push([
      { content: 'TOTAL', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } },
      totals.cimentQt,
      '',
      totals.cimentTotal.toFixed(2),
      totals.argileQt,
      '',
      totals.argileTotal.toFixed(2),
      totals.carburant.toFixed(2),
      totals.autres.toFixed(2),
      totals.totalJour.toFixed(2)
    ]);

    autoTable(doc, {
      head: [
        [
          { content: 'Jour', rowSpan: 2 },
          { content: 'Date', rowSpan: 2 },
          { content: 'Ciment', colSpan: 3, styles: { halign: 'center' } },
          { content: 'Argile / Faïence', colSpan: 3, styles: { halign: 'center' } },
          { content: 'Carburant (DH)', rowSpan: 2 },
          { content: 'Autres', rowSpan: 2 },
          { content: 'Total Jour', rowSpan: 2 }
        ],
        [
          'Qt', 'Prix Unit.', 'Total',
          'Qt', 'Prix Unit.', 'Total'
        ]
      ],
      body: tableBody,
      startY: 50,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1, halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        2: { cellWidth: 15 }, 3: { cellWidth: 15 }, 4: { cellWidth: 20 },
        5: { cellWidth: 15 }, 6: { cellWidth: 15 }, 7: { cellWidth: 20 },
        8: { cellWidth: 20 },
        9: { cellWidth: 20 },
        10: { cellWidth: 25 }
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

    doc.save(`Enveloppe_${header.date || 'Mois'}.pdf`);
    toast.dismiss(loadingToast);
    toast.success("PDF généré avec succès");
  };

  const inputClass = "w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition";
  const inputHeaderClass = "w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition";
  const labelClass = "block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

  return (
    <section className="p-4 md:p-6" dir="ltr">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-white">Enveloppe Financière</h2>
        <p className="text-sm text-slate-400 mt-1">
          Suivi de consommation et calcul des dépenses journalières
        </p>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/60 rounded-2xl p-5 md:p-6 shadow-lg mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Informations Générales
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Date</label>
            <input name="date" type="date" value={header.date} onChange={handleHeaderChange} className={inputHeaderClass} />
          </div>
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

      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/60 rounded-2xl p-5 md:p-6 shadow-lg mb-6 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tableau Journalier</h3>
          </div>
          <button
            onClick={handleGeneratePDF}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-sm font-bold px-5 py-2 rounded-xl transition flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300 min-w-[1000px]">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300">
                <th className="py-2 px-1 border border-slate-700" rowSpan={2}>Jour</th>
                <th className="py-2 px-1 border border-slate-700" rowSpan={2}>Date</th>
                <th className="py-1 border border-slate-700" colSpan={3}>Ciment</th>
                <th className="py-1 border border-slate-700" colSpan={3}>Argile / Faïence</th>
                <th className="py-2 px-1 border border-slate-700" rowSpan={2}>Carburant</th>
                <th className="py-2 px-1 border border-slate-700" rowSpan={2}>Autres</th>
                <th className="py-2 px-1 border border-slate-700" rowSpan={2}>Total Jour</th>
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
              {calculatedDays.map((d, i) => (
                <tr key={i} className="hover:bg-white/5 border-b border-slate-800">
                  <td className="text-center font-bold text-slate-400 border border-slate-800">{d.day}</td>
                  <td className="p-1 border border-slate-800">
                    <input type="date" value={d.date} onChange={(e) => handleDayChange(i, 'date', e.target.value)} className={inputClass} />
                  </td>
                  
                  <td className="p-1 border border-slate-800">
                    <input type="number" value={d.cimentQt} onChange={(e) => handleDayChange(i, 'cimentQt', e.target.value)} className={inputClass} />
                  </td>
                  <td className="p-1 border border-slate-800">
                    <input type="number" value={d.cimentPrix} onChange={(e) => handleDayChange(i, 'cimentPrix', e.target.value)} className={inputClass} />
                  </td>
                  <td className="text-center font-mono text-cyan-400 border border-slate-800 bg-slate-900/30">
                    {d.cimentTotal ? d.cimentTotal.toFixed(2) : ''}
                  </td>

                  <td className="p-1 border border-slate-800">
                    <input type="number" value={d.argileQt} onChange={(e) => handleDayChange(i, 'argileQt', e.target.value)} className={inputClass} />
                  </td>
                  <td className="p-1 border border-slate-800">
                    <input type="number" value={d.argilePrix} onChange={(e) => handleDayChange(i, 'argilePrix', e.target.value)} className={inputClass} />
                  </td>
                  <td className="text-center font-mono text-cyan-400 border border-slate-800 bg-slate-900/30">
                    {d.argileTotal ? d.argileTotal.toFixed(2) : ''}
                  </td>

                  <td className="p-1 border border-slate-800">
                    <input type="number" value={d.carburant} onChange={(e) => handleDayChange(i, 'carburant', e.target.value)} className={inputClass} />
                  </td>
                  <td className="p-1 border border-slate-800">
                    <input type="number" value={d.autres} onChange={(e) => handleDayChange(i, 'autres', e.target.value)} className={inputClass} />
                  </td>

                  <td className="text-center font-bold text-emerald-400 border border-slate-800 bg-slate-900/30">
                    {d.totalJour ? d.totalJour.toFixed(2) : ''}
                  </td>
                </tr>
              ))}
              
              <tr className="bg-slate-800/80 font-bold text-white border-t-2 border-cyan-500/50">
                <td colSpan={2} className="text-center py-3 border border-slate-700">TOTAL</td>
                <td className="text-center border border-slate-700 text-slate-300">{totals.cimentQt || ''}</td>
                <td className="text-center border border-slate-700 text-slate-500">—</td>
                <td className="text-center text-cyan-400 border border-slate-700">{totals.cimentTotal.toFixed(2)}</td>
                <td className="text-center border border-slate-700 text-slate-300">{totals.argileQt || ''}</td>
                <td className="text-center border border-slate-700 text-slate-500">—</td>
                <td className="text-center text-cyan-400 border border-slate-700">{totals.argileTotal.toFixed(2)}</td>
                <td className="text-center text-cyan-400 border border-slate-700">{totals.carburant.toFixed(2)}</td>
                <td className="text-center text-cyan-400 border border-slate-700">{totals.autres.toFixed(2)}</td>
                <td className="text-center text-emerald-400 text-sm border border-slate-700">{totals.totalJour.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

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