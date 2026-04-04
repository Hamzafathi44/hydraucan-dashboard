import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { 
  Search, Download, Plus, Filter, Calendar as CalendarIcon, 
  Trash2, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, PlusCircle, Edit2, FileDown, Loader2, FileText, MapPin
} from 'lucide-react';
import { generateReportPDF } from '../pdfGenerator';
import SrmCheckboxItem from '../components/SrmCheckboxItem';
import SrmMapPicker from '../components/SrmMapPicker';
import MaterialBuilder from '../components/MaterialBuilder';
import { formatMaterialsData } from '../hooks/useDashboardData';
import { mapItemToSrmForm, generateSrmPdf } from '../srmPdfGenerator';
import { toast } from 'sonner';

export const MonthlyReportView = ({
  stats, chartData, handleAdd, handleChange, formData, setFormData, isSubmitting,
  typeOptions, natureOptions, searchTerm, setSearchTerm,
  months, selectedMonth, setSelectedMonth, paginatedList, handleDelete,
  totalPages, currentPage, setCurrentPage, ITEMS_PER_PAGE, filteredList, handleAddOption,
  editingId, handleEdit, handleCancelEdit
}) => {
  const [showFicheDetails, setShowFicheDetails] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [loadingPdfId, setLoadingPdfId] = useState(null);



  return (
    <Motion.div
      key="rapport"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Top Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">RAPPORT MENSUEL</h1>
          <p className="text-slate-400 text-sm font-medium">Gérez et exportez vos rapports de travail mensuels avec précision.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="search-bar">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher des rapports..." 
              className="bg-transparent border-none outline-none text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => generateReportPDF(filteredList, selectedMonth)} disabled={filteredList.length === 0} className="btn-accent">
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </header>

      {/* Entry Form */}
      <Motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-line p-8 mb-12 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {editingId ? <Edit2 className="w-4 h-4 text-cyan-500" /> : <Plus className="w-4 h-4 text-cyan-500" />}
            <h2 className="text-xs font-bold uppercase tracking-widest text-white">
              {editingId ? "Modifier le Rapport" : "Créer un Nouveau Rapport"}
            </h2>
          </div>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">
              Annuler
            </button>
          )}
        </div>
        
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Date</label>
            <input name="date" type="date" required onChange={handleChange} value={formData.date} className="input-field" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Référence</label>
            <input name="reference" placeholder="Réf #" onChange={handleChange} value={formData.reference} className="input-field" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Type</label>
              <button type="button" onClick={() => handleAddOption('type')} className="text-accent hover:text-ink">
                <PlusCircle className="w-3 h-3" />
              </button>
            </div>
            <select name="type" onChange={handleChange} value={formData.type} className="input-field appearance-none">
              <option value="">Sélectionner le Type</option>
              {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="col-span-1 md:col-span-3 lg:col-span-6 w-full">
            <MaterialBuilder 
              type={formData.type} 
              data={formData.materialsData} 
              onChange={(newMaterialsData) => {
                setFormData({
                  ...formData,
                  materialsData: newMaterialsData,
                  material: formatMaterialsData(newMaterialsData)
                });
              }}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nature</label>
              <button type="button" onClick={() => handleAddOption('nature')} className="text-accent hover:text-ink">
                <PlusCircle className="w-3 h-3" />
              </button>
            </div>
            <select name="nature" onChange={handleChange} value={formData.nature} className="input-field appearance-none">
              <option value="">Sélectionner la Nature</option>
              {natureOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="col-span-1 md:col-span-3 lg:col-span-6 flex gap-2 w-full mt-2">
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
              {editingId ? "MAJ" : "Ajouter"}
            </button>
            <button type="button" onClick={() => setShowFicheDetails(!showFicheDetails)} className="px-4 flex-none border border-line bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all h-[42px] flex items-center gap-2">
              <FileText className="w-4 h-4" /> {showFicheDetails ? "Masquer la Fiche EAU" : "Ajouter les détails de la Fiche EAU"}
            </button>
          </div>
          
          {showFicheDetails && (
            <div className="col-span-1 md:col-span-3 lg:col-span-6 mt-4 p-6 bg-white/5 border border-line rounded-2xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4">
               {/* GPS + Address */}
               <div className="space-y-4">
                 <h3 className="text-sm font-black uppercase text-white border-b border-line pb-2">Localisation</h3>
                 <div>
                   <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Adresse Exacte</label>
                   <input name="adresse" value={formData.adresse} onChange={handleChange} className="input-field w-full" placeholder="Adresse complète..." />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">GPS X (Longitude)</label>
                     <input name="x" value={formData.x} onChange={handleChange} className="input-field w-full font-mono text-sm" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">GPS Y (Latitude)</label>
                     <input name="y" value={formData.y} onChange={handleChange} className="input-field w-full font-mono text-sm" />
                   </div>
                 </div>
                 <div className="flex gap-2">
                    <button type="button" onClick={() => setIsMapOpen(true)} className="flex-1 px-4 py-2 border border-line bg-cyan-500/10 hover:bg-cyan-500/20 rounded-xl font-bold text-cyan-400 transition-colors text-xs flex justify-center items-center gap-2">
                      <MapPin className="w-4 h-4" /> Pointer sur la carte
                    </button>
                 </div>
                 
                 <h3 className="text-sm font-black uppercase text-white border-b border-line pb-2 mt-6">Élément Fuite & Débit</h3>
                 <div className="grid grid-cols-2 gap-2">
                    <SrmCheckboxItem label="Canalisation" name="fuite_can" form={formData} handleInputChange={handleChange} />
                    <SrmCheckboxItem label="Branchement" name="fuite_bra" form={formData} handleInputChange={handleChange} />
                    <SrmCheckboxItem label="Débit Faible" name="debit_fai" form={formData} handleInputChange={handleChange} />
                    <SrmCheckboxItem label="Débit Moyen" name="debit_moy" form={formData} handleInputChange={handleChange} />
                    <SrmCheckboxItem label="Débit Fort" name="debit_for" form={formData} handleInputChange={handleChange} />
                 </div>
                 <input type="text" name="estimation" value={formData.estimation} onChange={handleChange} placeholder="Estimation (L/min)" className="input-field w-full mt-2" />
               </div>

               {/* Checkboxes */}
               <div className="space-y-4">
                 <h3 className="text-sm font-black uppercase text-white border-b border-line pb-2">Origine & Matériaux</h3>
                 <div className="grid grid-cols-2 gap-2 mb-4">
                    <SrmCheckboxItem label="Terrain" name="org_ter" form={formData} handleInputChange={handleChange} />
                    <SrmCheckboxItem label="Mauvaise Exé." name="org_mau" form={formData} handleInputChange={handleChange} />
                    <SrmCheckboxItem label="Corrosion" name="org_cor" form={formData} handleInputChange={handleChange} />
                    <SrmCheckboxItem label="Autre Org." name="org_autre" form={formData} handleInputChange={handleChange} />
                 </div>
                 
                 <h3 className="text-sm font-black uppercase text-white border-b border-line pb-2">Visualisation Fuite</h3>
                 <div className="grid grid-cols-2 gap-2 mb-4">
                    <SrmCheckboxItem label="Oui, visible" name="vis_oui" form={formData} handleInputChange={handleChange} />
                    <SrmCheckboxItem label="Affaissement" name="vis_aff" form={formData} handleInputChange={handleChange} />
                    <SrmCheckboxItem label="Casse cire" name="type_casse" form={formData} handleInputChange={handleChange} />
                    <SrmCheckboxItem label="Fissure" name="type_fissure" form={formData} handleInputChange={handleChange} />
                 </div>
                 
                 <h3 className="text-sm font-black uppercase text-white border-b border-line pb-2">Matériau</h3>
                 <div className="grid grid-cols-3 gap-2">
                    <SrmCheckboxItem label="AC" name="mat_ac" form={formData} handleInputChange={handleChange} />
                    <SrmCheckboxItem label="FG" name="mat_fg" form={formData} handleInputChange={handleChange} />
                    <SrmCheckboxItem label="FD" name="mat_fd" form={formData} handleInputChange={handleChange} />
                    <SrmCheckboxItem label="PE" name="mat_pe" form={formData} handleInputChange={handleChange} />
                    <SrmCheckboxItem label="PVC" name="mat_pvc" form={formData} handleInputChange={handleChange} />
                 </div>
               </div>
            </div>
          )}
        </form>


      </Motion.section>

      {/* Filters & Table */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Filtrer les Enregistrements</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-md">
            {months.map(m => (
              <button 
                key={m} 
                onClick={() => setSelectedMonth(m)} 
                className={`month-pill whitespace-nowrap ${selectedMonth === m ? 'month-pill-active' : ''}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-line overflow-hidden shadow-lg">
          <div className="data-row bg-white/5 border-b-2 border-line">
            <div className="col-header">Date</div>
            <div className="col-header">Références</div>
            <div className="col-header">Type</div>
            <div className="col-header">Matériel</div>
            <div className="col-header">Nature</div>
            <div className="col-header text-right">Action</div>
          </div>
          
          <div className="data-grid min-h-[400px]">
            <AnimatePresence mode="popLayout">
              {paginatedList.length > 0 ? (
                paginatedList.map((item) => (
                  <Motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="data-row group"
                  >
                    <div className="data-value data-mono flex items-center gap-2">
                      <CalendarIcon className="w-3 h-3 text-slate-300" />
                      {item.date}
                    </div>
                    <div className="data-value truncate pr-4">{item.reference || '-'}</div>
                    <div className="data-value truncate pr-4">{item.type || '-'}</div>
                    <div className="data-value truncate pr-4" title={formatMaterialsData(item.materialsData) || item.material}>
                      {formatMaterialsData(item.materialsData) || item.material || '-'}
                    </div>
                    <div className="data-value truncate pr-4">{item.nature || '-'}</div>
                    <div className="flex justify-end gap-1">

                      <button 
                        onClick={() => {
                          handleEdit(item);
                          setShowFicheDetails(true);
                        }}
                        className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Modifier (Avec Fiche)"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-slate-300">
                  {searchTerm ? (
                    <>
                      <AlertCircle className="w-12 h-12 mb-4 opacity-10" />
                      <p className="text-sm font-medium">Aucun résultat pour "{searchTerm}"</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-12 h-12 mb-4 opacity-10" />
                      <p className="text-sm font-medium">Tout est à jour ! Aucun rapport pour cette période.</p>
                    </>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-xs font-medium text-slate-400">
              Affichage de <span className="text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> à <span className="text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredList.length)}</span> sur <span className="text-white">{filteredList.length}</span> résultats
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-line rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (totalPages > 7) {
                    if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                      if (page === 2 || page === totalPages - 1) return <span key={page} className="text-slate-300">...</span>;
                      return null;
                    }
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${currentPage === page ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'hover:bg-white/10 text-slate-400'}`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-line rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      <SrmMapPicker 
        isOpen={isMapOpen} 
        onClose={() => setIsMapOpen(false)} 
        onConfirm={(coords) => {
           handleChange({ target: { name: 'x', value: coords.x, type: 'text' }});
           handleChange({ target: { name: 'y', value: coords.y, type: 'text' }});
           handleChange({ target: { name: 'mapType', value: coords.mapType || 'Normal', type: 'text' }});
        }} 
        initialLocation={{ x: formData.x, y: formData.y }}
      />
    </Motion.div>
  );
};

