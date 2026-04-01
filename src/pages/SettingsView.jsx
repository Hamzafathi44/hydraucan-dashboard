import { motion as Motion } from 'motion/react';
import { PlusCircle, Trash2 } from 'lucide-react';

export const SettingsView = ({ typeOptions, natureOptions, handleAddOption, handleRemoveOption }) => {
  return (
    <Motion.div
      key="settings"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto"
    >
      <header className="mb-12">
        <h1 className="text-3xl font-black tracking-tight text-white mb-2">Paramètres de l'Application</h1>
        <p className="text-slate-400 text-sm font-medium">Gérez vos options de menu déroulant et vos préférences système.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Type Options */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-line p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-cyan-500" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-white">Options de Type</h2>
            </div>
            <button onClick={() => handleAddOption('type')} className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:text-white">Ajouter</button>
          </div>
          <div className="space-y-2">
            {typeOptions.map(opt => (
              <div key={opt} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 group">
                <span className="text-sm font-medium text-slate-200">{opt}</span>
                <button onClick={() => handleRemoveOption('type', opt)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Nature Options */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-line p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-cyan-500" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-white">Options de Nature</h2>
            </div>
            <button onClick={() => handleAddOption('nature')} className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:text-white">Ajouter</button>
          </div>
          <div className="space-y-2">
            {natureOptions.map(opt => (
              <div key={opt} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 group">
                <span className="text-sm font-medium text-slate-200">{opt}</span>
                <button onClick={() => handleRemoveOption('nature', opt)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Motion.div>
  );
};
