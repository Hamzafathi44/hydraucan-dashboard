import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserPlus, Clock, Play, Square, Loader2, Calendar as CalendarIcon, 
  Trash2, Edit2, Check, X, Filter, BarChart3, PlusCircle, ChevronLeft, ChevronRight, PauseCircle, PlayCircle, CheckSquare, Square as SquareIcon
} from 'lucide-react';
import { usePointageData } from '../hooks/usePointageData';

export const PointageView = ({ user }) => {
  const {
    workers, paginatedList, filteredList, activeSessions,
    currentPage, setCurrentPage, totalPages, ITEMS_PER_PAGE,
    months, selectedMonth, setSelectedMonth, monthlySummary,
    addWorker, removeWorker, 
    handleCheckIn, handleBulkCheckIn, handlePause, handleResume, handleCheckOut,
    handleAddManualLog, handleUpdateHours, handleDeleteLog,
    isSubmitting
  } = usePointageData(user);

  const [newWorkerName, setNewWorkerName] = useState('');
  const [editingLogId, setEditingLogId] = useState(null);
  const [editHoursVal, setEditHoursVal] = useState('');
  
  // Manual & Bulk Selection state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualData, setManualData] = useState({ workerId: '', date: '', hours: '' });
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  // Helpers
  const formatTime = (iso) => iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

  const submitAddWorker = (e) => {
    e.preventDefault();
    addWorker(newWorkerName);
    setNewWorkerName('');
  };

  const submitManualLog = (e) => {
    e.preventDefault();
    const w = workers.find(w => w.id === manualData.workerId);
    if (!w) return;
    handleAddManualLog(w.id, w.name, manualData.date, manualData.hours);
    setManualData({ workerId: '', date: '', hours: '' });
    setShowManualForm(false);
  };

  const saveEditHours = (logId) => {
    handleUpdateHours(logId, editHoursVal);
    setEditingLogId(null);
  };

  const toggleWorkerSelection = (workerId) => {
    if (selectedWorkers.includes(workerId)) {
      setSelectedWorkers(selectedWorkers.filter(id => id !== workerId));
    } else {
      setSelectedWorkers([...selectedWorkers, workerId]);
    }
  };

  const toggleSelectAll = () => {
    const offlineWorkers = workers.filter(w => !activeSessions[w.id]);
    if (selectedWorkers.length === offlineWorkers.length) {
      setSelectedWorkers([]);
    } else {
      setSelectedWorkers(offlineWorkers.map(w => w.id));
    }
  };

  const execBulkStart = () => {
    const toStart = workers.filter(w => selectedWorkers.includes(w.id));
    handleBulkCheckIn(toStart);
    setSelectedWorkers([]);
  };

  const offlineWorkerCount = workers.filter(w => !activeSessions[w.id]).length;

  return (
    <Motion.div
      key="pointage"
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="pb-12"
    >
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">GESTION DES ÉQUIPES</h1>
          <p className="text-slate-400 text-sm font-medium">Contrôlez les heures de travail de vos groupes et ajustez indépendamment.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-10">
        {/* Workers Management Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          <Motion.section 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-line p-6 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-cyan-500" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-white">Personnel</h2>
            </div>
            
            <form onSubmit={submitAddWorker} className="flex gap-2 mb-6">
              <input type="text" placeholder="Nom de l'ouvrier..." value={newWorkerName} onChange={(e) => setNewWorkerName(e.target.value)} className="input-field flex-1" required />
              <button type="submit" disabled={isSubmitting} className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-all"><UserPlus className="w-5 h-5" /></button>
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide border-t border-line pt-2">
              {workers.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Aucun ouvrier enregistré.</p>
              ) : (
                workers.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group">
                    <span className="text-sm font-bold text-slate-200">{w.name}</span>
                    <button onClick={() => removeWorker(w.id)} className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))
              )}
            </div>
          </Motion.section>

          {/* Manual Entry Form Toggle */}
          <button onClick={() => setShowManualForm(!showManualForm)} className="w-full flex items-center justify-center gap-2 p-3 border border-line bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all text-xs">
            <PlusCircle className="w-4 h-4" /> POINTAGE MANUEL (HORS TIMER)
          </button>

          <AnimatePresence>
            {showManualForm && (
              <Motion.form 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                onSubmit={submitManualLog} className="bg-slate-900/60 border border-indigo-500/30 p-5 rounded-2xl space-y-4 overflow-hidden"
              >
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Ouvrier</label>
                  <select required value={manualData.workerId} onChange={e => setManualData({...manualData, workerId: e.target.value})} className="input-field w-full">
                    <option value="">Sélectionner</option>
                    {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Date</label><input type="date" required value={manualData.date} onChange={e => setManualData({...manualData, date: e.target.value})} className="input-field w-full" /></div>
                <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Heures (Ex: 8 ou 8.5)</label><input type="number" step="0.5" required value={manualData.hours} onChange={e => setManualData({...manualData, hours: e.target.value})} className="input-field w-full font-mono" /></div>
                <button type="submit" disabled={isSubmitting} className="w-full btn-primary py-2 text-xs">Ajouter Historique</button>
              </Motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Live Tracking Grid */}
        <div className="xl:col-span-3">
          <Motion.section 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-line p-8 shadow-lg min-h-[400px]"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-500" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">Timers en Direct</h2>
              </div>

              {/* Bulk Selection Actions */}
              <div className="flex items-center gap-4 bg-slate-900/50 px-4 py-2 rounded-xl border border-line">
                <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
                  {selectedWorkers.length === offlineWorkerCount && offlineWorkerCount > 0 ? <CheckSquare className="w-4 h-4 text-cyan-500" /> : <SquareIcon className="w-4 h-4" />}
                  Tout sélectionner
                </button>
                {selectedWorkers.length > 0 && (
                  <button onClick={execBulkStart} disabled={isSubmitting} className="flex items-center gap-2 bg-cyan-500 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors">
                    <Play className="w-3 h-3" fill="currentColor" /> Démarrer ({selectedWorkers.length})
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workers.length === 0 ? (
                 <div className="col-span-full py-16 text-center text-slate-500"><Users className="w-12 h-12 mx-auto mb-4 opacity-20" /><p>Ajoutez des ouvriers pour commencer le pointage.</p></div>
              ) : (
                workers.map(worker => {
                  const session = activeSessions[worker.id];
                  const isActive = !!session;
                  const isPaused = session?.isPaused;
                  const isSelected = selectedWorkers.includes(worker.id);

                  let cardStyle = "bg-white/5 border-white/10 hover:border-slate-500";
                  let statusBadge = <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Hors Ligne</span>;

                  if (isActive) {
                    if (isPaused) {
                       cardStyle = "bg-yellow-900/20 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.1)]";
                       statusBadge = <span className="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-400 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /> En Pause</span>;
                    } else {
                       cardStyle = "bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.1)]";
                       statusBadge = <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> En Service</span>;
                    }
                  } else if (isSelected) {
                     cardStyle = "bg-slate-800 border-cyan-500/50";
                  }

                  return (
                    <div key={worker.id} className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${cardStyle}`}>
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-start gap-3">
                          {!isActive && (
                            <button onClick={() => toggleWorkerSelection(worker.id)} className="mt-1 text-slate-400 hover:text-cyan-400 transition-colors">
                              {isSelected ? <CheckSquare className="w-5 h-5 text-cyan-500" /> : <SquareIcon className="w-5 h-5" />}
                            </button>
                          )}
                          <div>
                            <h3 className="font-bold text-white text-lg">{worker.name}</h3>
                            {statusBadge}
                          </div>
                        </div>
                        {isActive && (
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Heure Entrée</div>
                            <div className="text-white font-mono font-bold text-sm tracking-widest">{formatTime(session.checkIn)}</div>
                          </div>
                        )}
                      </div>

                      {isActive ? (
                        <div className="flex gap-2">
                           {isPaused ? (
                              <button onClick={() => handleResume(worker)} disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 font-black tracking-widest uppercase transition-all text-xs">
                                <PlayCircle className="w-4 h-4" /> Reprendre
                              </button>
                           ) : (
                              <button onClick={() => handlePause(worker)} disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-500/20 text-slate-300 hover:bg-slate-500/40 hover:text-white font-black tracking-widest uppercase transition-all text-xs">
                                <PauseCircle className="w-4 h-4" /> Pause
                              </button>
                           )}
                           
                           <button onClick={() => handleCheckOut(worker)} disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-black tracking-widest uppercase transition-all text-xs">
                             <Square className="w-4 h-4" fill="currentColor" /> Arrêter
                           </button>
                        </div>
                      ) : (
                         <button onClick={() => handleCheckIn(worker)} disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 font-black tracking-widest uppercase transition-all">
                           <Play className="w-5 h-5" fill="currentColor" /> Démarrer Seul
                         </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Motion.section>
        </div>
      </div>

      {/* History & Filtering */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Filtrer l'Historique</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full sm:w-auto">
            {months.map(m => (
              <button key={m} onClick={() => setSelectedMonth(m)} className={`month-pill whitespace-nowrap ${selectedMonth === m ? 'month-pill-active' : ''}`}>{m}</button>
            ))}
          </div>
        </div>

        {/* Monthly Summary Box */}
        <AnimatePresence mode="wait">
          {selectedMonth !== 'Tous' && monthlySummary.length > 0 && (
            <Motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6 overflow-hidden">
              <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-5 h-5 text-indigo-400" /><h3 className="text-sm font-bold uppercase tracking-widest text-indigo-100">Bilan: {selectedMonth}</h3></div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {monthlySummary.map(ms => (
                  <div key={ms.name} className="bg-slate-900/60 border border-line p-4 rounded-xl text-center">
                    <div className="text-sm font-bold text-slate-300 truncate mb-1">{ms.name}</div>
                    <div className="text-2xl font-black text-white">{ms.totalHours} <span className="text-xs text-slate-500 font-medium">H</span></div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">{ms.daysCount} Jours</div>
                  </div>
                ))}
              </div>
            </Motion.div>
          )}
        </AnimatePresence>

        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-line overflow-hidden shadow-lg">
          <div className="data-row bg-white/5 border-b-2 border-line">
            <div className="col-header flex gap-2"><CalendarIcon className="w-3 h-3"/> Date</div>
            <div className="col-header">Ouvrier</div>
            <div className="col-header">Entrée</div>
            <div className="col-header">Sortie</div>
            <div className="col-header text-right w-24">Heures</div>
            <div className="col-header text-right w-20">Actions</div>
          </div>
          
          <div className="data-grid min-h-[300px]">
            <AnimatePresence mode="popLayout">
              {paginatedList.length > 0 ? (paginatedList.map(item => (
                <Motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="data-row group hover:bg-white/[0.02] transition-colors">
                  <div className="data-value data-mono text-slate-300">{formatDate(item.checkIn || item.date)}</div>
                  <div className="data-value font-bold text-white flex items-center gap-2">
                    {item.workerName}
                    {item.isManual && <span className="text-[9px] uppercase bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-black border border-indigo-500/30">Manuel</span>}
                  </div>
                  <div className="data-value data-mono text-cyan-400/90">{formatTime(item.checkIn)}</div>
                  <div className={`data-value data-mono ${item.checkOut ? 'text-slate-300' : 'text-green-400 font-bold animate-pulse'}`}>
                    {item.isPaused ? "En Pause" : item.checkOut ? formatTime(item.checkOut) : 'En cours...'}
                  </div>
                  
                  {/* Total Hours Editable Column */}
                  <div className="flex justify-end data-value data-mono w-24">
                    {editingLogId === item.id ? (
                      <div className="flex gap-1 items-center">
                        <input type="number" step="0.5" value={editHoursVal} onChange={e => setEditHoursVal(e.target.value)} className="w-14 bg-slate-800 border border-cyan-500 text-white px-1 py-0.5 rounded text-xs text-right outline-none" autoFocus />
                        <button onClick={() => saveEditHours(item.id)} className="text-green-400"><Check className="w-4 h-4"/></button>
                        <button onClick={() => setEditingLogId(null)} className="text-red-400"><X className="w-4 h-4"/></button>
                      </div>
                    ) : (
                      <span className="bg-white/5 border border-white/5 px-2.5 py-1 rounded-md white font-bold inline-block min-w-[3rem] text-center">
                        {item.totalHours ? `${item.totalHours} h` : '-'}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-end gap-1 w-20">
                    <button onClick={() => { setEditingLogId(item.id); setEditHoursVal(item.totalHours || ''); }} className="p-1.5 text-slate-400 hover:text-indigo-400"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteLog(item.id)} className="p-1.5 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </Motion.div>
              ))) : (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 border-t border-line/50 col-span-full"><Clock className="w-8 h-8 mb-4 opacity-20" /><p className="text-sm">Aucun historique de pointage.</p></div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Pagination Controls ... */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
             <p className="text-xs font-medium text-slate-400">Page {currentPage} sur {totalPages}</p>
             <div className="flex gap-1">
               <button onClick={() => setCurrentPage(p => Math.max(p-1, 1))} disabled={currentPage===1} className="p-2 border border-line rounded-lg hover:bg-slate-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4"/></button>
               <button onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} disabled={currentPage===totalPages} className="p-2 border border-line rounded-lg hover:bg-slate-50 disabled:opacity-50"><ChevronRight className="w-4 h-4"/></button>
             </div>
          </div>
        )}
      </section>
    </Motion.div>
  );
};
