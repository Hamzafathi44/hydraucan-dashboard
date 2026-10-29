import { useEffect, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import {
  Menu, X, LayoutDashboard, FileText, Settings, LogOut, Droplets, PieChart, Clock, FileSpreadsheet, Wrench, Wallet, ShieldCheck, ChevronsLeft, ChevronsRight
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

// Taste Skill v2, app sheet framed-sheet (seed 1626834225):
// one tinted L-frame (sidebar + 48px top bar, no rule between them),
// the work on a white sheet inset 8px from the right/bottom edges,
// 1px edge, no shadow. Active nav is a neutral grey pill, not a
// coloured bar. No logic changes here, only the shell.
//
// Batch 1 — Amicro-compatible mono sidebar (style inspiration only):
// Amicro (amicro.dev, MIT) has no sidebar primitive and no Amicro
// code is copied here. Its Mono style is followed locally instead:
// lucide icons in one colour only (slate-400 inactive, navy #16294D
// active), stroke-width 1.5, no coloured chips, no rainbow, no emoji,
// and a subtle spring press/hover via motion/react. No entrance
// animation is added for the whole page.
export const DashboardLayout = ({ children, activeView, setActiveView, theme, onToggleTheme, accent = 'navy', onAccentChange, isThemeExempt = false }) => {
  const accentList = [
    { id: 'navy', name: 'Marine', light: '#16294D' },
    { id: 'teal', name: 'Sarcelle', light: '#0F766E' },
    { id: 'gold', name: 'Or', light: '#B45309' },
    { id: 'green', name: 'Vert', light: '#15803D' },
  ];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // VibePrompt Batch 1 (copy only): collapsible sidebar, in the
  // VibePrompt "collapsible sidebar nav" style — grouped nav that
  // shrinks to icons only. Choice is saved, so it survives a
  // refresh, like the active view. Desktop only; on mobile the
  // drawer behaviour is unchanged. No VibePrompt code is copied
  // here; the pattern is rebuilt locally in this shell's style.
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try { return localStorage.getItem('hydraucan-sidebar-collapsed') === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('hydraucan-sidebar-collapsed', isCollapsed ? '1' : '0'); } catch {}
  }, [isCollapsed]);
  const go = (view) => { setActiveView(view); setIsMobileMenuOpen(false); };

  return (
    <div className="dashboard-layout relative bg-sidebar min-h-screen">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''} ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between">
          <img src="/logo-hydracane.png" alt="HYDRAUCAN" className="sidebar-logo h-12 w-auto object-contain" referrerPolicy="no-referrer" />
          <button aria-label="Fermer le menu" onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2.5 text-slate-500 hover:text-slate-900 bg-slate-200/60 rounded-lg">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button
            aria-label={isCollapsed ? 'Développer la barre latérale' : 'Réduire la barre latérale'}
            title={isCollapsed ? 'Développer la barre latérale' : 'Réduire la barre latérale'}
            onClick={() => setIsCollapsed((v) => !v)}
            className="hidden lg:flex p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg"
          >
            {isCollapsed ? <ChevronsRight className="w-5 h-5" strokeWidth={1.5} /> : <ChevronsLeft className="w-5 h-5" strokeWidth={1.5} />}
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-white border border-line px-3 py-2.5">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0" strokeWidth={1.5} />
          <div className="user-chip-text">
            <p className="text-xs font-semibold text-slate-900 leading-tight">Espace employés</p>
            <p className="text-[11px] text-slate-500 leading-tight">Accès réservé · Hydraucan</p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto min-h-0 pr-1">
          {MENU_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="group-label px-3 mb-2 text-xs font-medium text-slate-500">{group.label}</p>
              <div className="space-y-1">
                {group.items.map(([view, Icon, label]) => (
                  <Motion.button
                    key={view}
                    onClick={() => go(view)}
                    title={label}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`mono-nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeView === view ? 'bg-[#E2E6EA] text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${activeView === view ? 'text-accent' : 'text-slate-400'}`} strokeWidth={1.5} />
                    <span className="nav-label truncate">{label}</span>
                  </Motion.button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="pt-4 border-t border-slate-300/60">
          <Motion.button
            onClick={() => signOut(auth)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="mono-nav-item w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg font-medium text-sm transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5 shrink-0 text-slate-400" strokeWidth={1.5} />
            <span className="nav-label truncate">Déconnexion</span>
          </Motion.button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Ouvrir le menu"
              className="lg:hidden p-2 bg-white border border-line rounded-lg text-slate-700"
            >
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <p className="text-xs font-medium text-slate-500">Hydraucan · Interne</p>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white border border-line px-3 py-1 text-[11px] font-medium text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Employés uniquement
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isThemeExempt && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-line px-3 py-1 text-[11px] font-medium text-slate-600" title="Enveloppe garde le thème d'origine">
                Thème d'origine
              </span>
            )}
            {!isThemeExempt && onAccentChange && (
              <span className="inline-flex items-center gap-1.5" role="group" aria-label="Couleur du thème">
                {accentList.map((a) => (
                  <button key={a.id} type="button" title={a.name} aria-label={`Thème ${a.name}`} aria-pressed={accent === a.id} onClick={() => onAccentChange(a.id)} className={`w-5 h-5 rounded-full border-2 transition ${accent === a.id ? 'border-slate-900 scale-110' : 'border-slate-300 hover:scale-110'}`} style={{ backgroundColor: a.light }} />
                ))}
              </span>
            )}
            {onToggleTheme && (
              <button onClick={onToggleTheme} aria-label="Changer de thème" className="inline-flex items-center gap-1.5 rounded-full bg-white border border-line px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition">
                {theme === 'dark' ? 'Clair' : 'Sombre'}
              </button>
            )}
          </div>
        </header>

        <main className={"main-content " + (isThemeExempt ? "theme-exempt" : "")}>
          {activeView !== 'home' && (
            <div className="mb-6">
              {/* Transitions Batch 4 (copy only): text states swap,
                  in the transitions.dev "text states swap" style —
                  rebuilt locally. The page title blurs and fades
                  out, then the new title blurs in, on every view
                  change. Presentation only. */}
              <AnimatePresence mode="wait">
                <Motion.h2
                  key={activeView}
                  initial={{ opacity: 0, filter: 'blur(4px)', y: 6 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                  exit={{ opacity: 0, filter: 'blur(4px)', y: -6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="text-2xl font-semibold text-slate-900 leading-tight"
                >
                  {VIEW_TITLES[activeView] || 'Tableau de bord'}
                </Motion.h2>
              </AnimatePresence>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};
