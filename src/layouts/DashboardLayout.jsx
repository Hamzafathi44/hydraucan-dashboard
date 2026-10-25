import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import {
  Menu, X, LayoutDashboard, FileText, Settings, LogOut, Droplets, PieChart, Clock, FileSpreadsheet, Wrench, Wallet, ShieldCheck
} from 'lucide-react';

const MENU_GROUPS = [
  {
    label: 'Principal',
    items: [
      ['home', LayoutDashboard, 'Tableau de bord'],
      ['pointage', Clock, 'Pointage'],
      ['rapport', FileText, 'Rapport mensuel'],
      ['statistics', PieChart, 'Statistiques'],
    ],
  },
  {
    label: 'Travaux',
    items: [
      ['refection', Wrench, 'Réfection'],
      ['fichier', Droplets, 'Exploitation eau'],
      ['srm-excel', FileSpreadsheet, 'Import Excel SRM'],
    ],
  },
  {
    label: 'Gestion',
    items: [
      ['enveloppe', Wallet, 'Enveloppe financière'],
      ['settings', Settings, 'Paramètres'],
    ],
  },
];

const VIEW_TITLES = {
  home: 'Tableau de bord',
  pointage: 'Pointage',
  rapport: 'Rapport mensuel',
  refection: 'Réfection',
  statistics: 'Statistiques',
  fichier: 'Exploitation eau',
  'srm-excel': 'Import Excel SRM',
  enveloppe: 'Enveloppe financière',
  settings: 'Paramètres',
};

export const DashboardLayout = ({ children, activeView, setActiveView, theme, onToggleTheme }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const go = (view) => { setActiveView(view); setIsMobileMenuOpen(false); };

  return (
    <div className="dashboard-layout relative bg-[#EEF2F7] min-h-screen">
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        aria-label="Ouvrir le menu"
        className="lg:hidden fixed top-4 right-4 z-30 p-3 bg-[#16294D] text-white rounded-xl shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between">
          <img src="/logo-hydracane.png" alt="HYDRAUCAN" className="h-12 w-auto object-contain brightness-200" referrerPolicy="no-referrer" />
          <button aria-label="Fermer le menu" onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2.5 text-slate-300 hover:text-white bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-3 py-2.5">
          <ShieldCheck className="w-5 h-5 text-cyan-300 shrink-0" />
          <div>
            <p className="text-xs font-bold text-white leading-tight">Espace employés</p>
            <p className="text-[11px] text-slate-300 leading-tight">Accès réservé · Hydraucan</p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto min-h-0 pr-1">
          {MENU_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{group.label}</p>
              <div className="space-y-1">
                {group.items.map(([view, Icon, label]) => (
                  <button
                    key={view}
                    onClick={() => go(view)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeView === view ? 'bg-white text-[#16294D] shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${activeView === view ? 'text-cyan-600' : 'text-slate-400'}`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="pt-4 border-t border-white/10">
          <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-3 py-2.5 text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-xl font-semibold text-sm transition-all">
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="sticky top-0 z-20 -mx-4 -mt-4 px-4 sm:-mx-6 sm:-mt-6 sm:px-6 md:-mx-8 md:-mt-8 md:px-8 lg:-mx-12 lg:-mt-12 lg:px-12 py-3 mb-6 flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-slate-200">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700">Hydraucan · Interne</p>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{VIEW_TITLES[activeView] || 'Tableau de bord'}</h2>
          </div>
          <div className="flex items-center gap-2">
            {onToggleTheme && (
              <button onClick={onToggleTheme} aria-label="Changer de thème" className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition">
                {theme === 'dark' ? '☀️ Clair' : '🌙 Sombre'}
              </button>
            )}
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Employés uniquement
            </span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
};
