import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export const MATERIAL_OPTIONS = {
  FUITE: {
    articles: {
      'Collier': { dns: ['50*20', '63*20', '75*20', '90*20', '110*20', '160*20'], unit: 'u' },
      'Raccord Manchon': { dns: ['32*32', '40*40', '50*50', '63*63'], unit: 'u' },
      'Raccord Simple': { dns: ['32*1"'], unit: 'u' },
      'R.PEC': { dns: ['25*20', '32*20', '40*40', '50*40', '63*40'], unit: 'u' },
      'Tuyau': { dns: ['21*32', '21*25', '63*21', '32*16'], unit: 'ml' }
    }
  },
  'FUITE SPECIALE': {
    articles: {
      'Manchon Reparation': { dns: ['63', '75', '90', '110'], unit: 'u' },
      'Joint Gibault': { dns: ['63', '75', '90', '110', '225', '400', '500'], unit: 'u' }
    }
  },
  RNVL: {
    mains: ['BR complete', 'Branchement sans collier', 'Branchement sans accessoires'],
    articles: {
      'Collier': { dns: ['50*20', '63*20', '75*20', '90*20', '110*20', '160*20'], unit: 'u' },
      'Tuyau': { dns: ['21*32', '21*25', '63*21', '32*16'], unit: 'ml' }
    },
    getAllowedArticles: (main) => {
      if (main === 'BR complete') return ['Collier', 'Tuyau'];
      if (main === 'Branchement sans collier') return ['Tuyau'];
      if (main === 'Branchement sans accessoires') return ['Collier', 'Tuyau'];
      return [];
    }
  }
};

export default function MaterialBuilder({ type, data = { main: '', items: [] }, onChange }) {
  const t = (type || '').toUpperCase().trim();
  let schema = null;
  if (t === 'FUITE SPECIALE' || t.includes('SPECIALE')) schema = MATERIAL_OPTIONS['FUITE SPECIALE'];
  else if (t.includes('FUITE')) schema = MATERIAL_OPTIONS['FUITE'];
  else if (t.includes('RNVL') || t.includes('RENOUVELLEMENT')) schema = MATERIAL_OPTIONS.RNVL;

  // Fallback for types that don't have schema
  if (!schema) {
    return (
      <div className="w-full text-xs text-slate-500 italic px-2 py-3 bg-slate-50 rounded-lg border border-slate-200">
        Veuillez d'abord sélectionner un <strong>Type d'intervention</strong> (Fuite ou RNVL) pour configurer les détails du matériel.
      </div>
    );
  }

  const handleMainChange = (e) => {
    onChange({ ...data, main: e.target.value, items: [] });
  };

  const addItem = () => {
    onChange({ 
      ...data, 
      items: [...(data.items || []), { article: '', dn: '', customDn: '', qty: 1 }] 
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...(data.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-update or reset DN when article changes
    if (field === 'article') {
       newItems[index].dn = '';
       newItems[index].customDn = '';
    }
    onChange({ ...data, items: newItems });
  };

  const removeItem = (index) => {
    const newItems = (data.items || []).filter((_, i) => i !== index);
    onChange({ ...data, items: newItems });
  };

  const allowedArticlesKeys = schema.mains 
    ? schema.getAllowedArticles(data.main)
    : Object.keys(schema.articles);

  const mainsOptions = schema.mains || [];

  return (
    <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-full">
      {mainsOptions.length > 0 && (
         <div className="mb-2">
           <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Configuration {t}</label>
           <select 
             className="input-field w-full text-sm py-2"
             value={data.main || ''} 
             onChange={handleMainChange}
           >
             <option value="">Sélectionner une configuration...</option>
             {mainsOptions.map(m => <option key={m} value={m}>{m}</option>)}
           </select>
         </div>
      )}

      {(allowedArticlesKeys.length > 0 && (!schema.mains || data.main)) && (
        <div className="space-y-2 mt-4">
          <div className="flex justify-between items-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              Composants ({(data.items || []).length})
            </span>
            <button 
              type="button" 
              onClick={addItem} 
              className="text-blue-600 hover:text-white hover:bg-blue-600 px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 rounded-lg transition-all border border-blue-200 hover:border-blue-600 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>
          
          <div className="space-y-2 mt-2">
            {(data.items || []).map((item, idx) => {
               const articleDef = schema.articles[item.article];
               const dns = articleDef ? articleDef.dns : [];
               const useMl = articleDef?.unit === 'ml';

               return (
                 <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center relative bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-blue-300">
                    <div className="flex-1 sm:w-1/3 flex flex-col gap-2">
                      <select 
                        className="input-field w-full text-xs py-2 font-medium text-slate-700"
                        value={allowedArticlesKeys.includes(item.article) ? item.article : (item.article ? 'Autre' : '')}
                        onChange={(e) => updateItem(idx, 'article', e.target.value)}
                      >
                        <option value="">Sélectionner Article...</option>
                        {allowedArticlesKeys.map(a => <option key={a} value={a}>{a}</option>)}
                        <option value="Autre">Autre...</option>
                      </select>

                      {(!allowedArticlesKeys.includes(item.article) && item.article !== '') && (
                        <input
                          type="text"
                          className="input-field w-full text-xs py-2 font-medium text-slate-700"
                          placeholder="Nom du matériel saisi..."
                          value={item.article === 'Autre' ? '' : item.article}
                          onChange={(e) => updateItem(idx, 'article', e.target.value)}
                        />
                      )}
                    </div>

                    {item.article && (
                      <div className="flex flex-col sm:flex-row gap-2 flex-[2] w-full">
                        {allowedArticlesKeys.includes(item.article) && dns.length > 0 ? (
                          <select 
                            className="input-field flex-1 text-xs py-2"
                            value={item.dn === 'Autre' ? 'Autre' : (dns.includes(item.dn) ? item.dn : (item.dn ? 'Autre' : ''))}
                            onChange={(e) => updateItem(idx, 'dn', e.target.value)}
                          >
                            <option value="">Sélectionner DN...</option>
                            {dns.map(d => <option key={d} value={d}>{d}</option>)}
                            <option value="Autre">Autre DN...</option>
                          </select>
                        ) : null}
                        
                        {(!allowedArticlesKeys.includes(item.article) || item.dn === 'Autre' || dns.length === 0) && (
                          <input 
                            type="text" 
                            className="input-field flex-1 text-xs py-2 max-w-[100px]" 
                            placeholder={!allowedArticlesKeys.includes(item.article) ? "Détail/DN" : "Saisir DN"}
                            value={(!allowedArticlesKeys.includes(item.article) || dns.length === 0) ? item.dn : item.customDn}
                            onChange={(e) => {
                              if (!allowedArticlesKeys.includes(item.article) || dns.length === 0) {
                                updateItem(idx, 'dn', e.target.value);
                              } else {
                                updateItem(idx, 'customDn', e.target.value);
                              }
                            }}
                          />
                        )}

                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg pr-3 w-28 shadow-sm">
                          <input 
                            type="number" 
                            min="0" step="any"
                            className="w-full bg-transparent border-none text-xs py-2 px-3 text-right focus:ring-0 font-bold text-slate-800"
                            value={item.qty}
                            onChange={(e) => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                          />
                          <span className="text-[10px] font-black text-slate-400 uppercase">{useMl ? 'ml' : 'ud'}</span>
                        </div>
                      </div>
                    )}

                    <button 
                      type="button" 
                      onClick={() => removeItem(idx)} 
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto border border-transparent hover:border-red-100"
                      title="Supprimer cet élément"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               );
            })}
            
            {(data.items || []).length === 0 && (
               <div className="text-center py-5 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-xl text-slate-400 text-xs font-medium">
                 Aucun composant matériel ajouté. 
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
