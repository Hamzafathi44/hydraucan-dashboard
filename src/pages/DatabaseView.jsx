import { motion as Motion, AnimatePresence } from 'motion/react';
import { Search, Calendar as CalendarIcon, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export const DatabaseView = ({ 
  searchTerm, setSearchTerm, paginatedList, handleDelete, 
  totalPages, currentPage, setCurrentPage, filteredList, ITEMS_PER_PAGE 
}) => {
  return (
    <Motion.div
      key="database"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Base de données complète</h1>
          <p className="text-slate-400 text-sm font-medium">Consultez l'historique complet de tous les travaux enregistrés.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="search-bar">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher dans la base..." 
              className="bg-transparent border-none outline-none text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-line overflow-hidden shadow-sm">
        <div className="data-row bg-slate-50/50 border-b-2 border-line">
          <div className="col-header">Date</div>
          <div className="col-header">Références</div>
          <div className="col-header">Type</div>
          <div className="col-header">Matériel</div>
          <div className="col-header">Nature</div>
          <div className="col-header text-right">Action</div>
        </div>
        <div className="data-grid min-h-[600px]">
          <AnimatePresence mode="popLayout">
            {paginatedList.map((item) => (
              <Motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
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
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Pagination Controls for Database View */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6">
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
    </Motion.div>
  );
};
