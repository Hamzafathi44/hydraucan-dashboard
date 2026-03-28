import { motion as Motion, AnimatePresence } from 'motion/react';
import { 
  Search, Download, Plus, Filter, Calendar as CalendarIcon, 
  Trash2, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, PlusCircle 
} from 'lucide-react';
import { generateReportPDF } from '../pdfGenerator';

export const MonthlyReportView = ({
  stats, chartData, handleAdd, handleChange, formData, isSubmitting,
  typeOptions, natureOptions, searchTerm, setSearchTerm,
  months, selectedMonth, setSelectedMonth, paginatedList, handleDelete,
  totalPages, currentPage, setCurrentPage, ITEMS_PER_PAGE, filteredList, handleAddOption
}) => {
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
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">RAPPORT MENSUEL</h1>
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
        className="bg-white rounded-2xl border border-line p-8 mb-12 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-6">
          <Plus className="w-4 h-4 text-accent" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">Créer un Nouveau Rapport</h2>
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
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Matériel</label>
            <input name="material" placeholder="Matériels" onChange={handleChange} value={formData.material} className="input-field" />
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
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
            Ajouter
          </button>
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

        <div className="bg-white rounded-2xl border border-line overflow-hidden shadow-sm">
          <div className="data-row bg-slate-50/50 border-b-2 border-line">
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
                    <div className="data-value truncate pr-4">{item.material || '-'}</div>
                    <div className="data-value truncate pr-4">{item.nature || '-'}</div>
                    <div className="flex justify-end">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
              Affichage de <span className="text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> à <span className="text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredList.length)}</span> sur <span className="text-slate-900">{filteredList.length}</span> résultats
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
                      className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${currentPage === page ? 'bg-ink text-white' : 'hover:bg-slate-50 text-slate-400'}`}
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
    </Motion.div>
  );
};
