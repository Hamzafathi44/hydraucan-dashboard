import { useState, useEffect, useRef } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { LoginForm } from './components/LoginForm';
import { Toaster } from 'sonner';
import { AnimatePresence, motion as Motion, useReducedMotion } from 'motion/react';

// Hooks & Layouts
import { useDashboardData } from './hooks/useDashboardData';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ACCENTS, getAccent } from './lib/accent';

// View Pages
import { DashboardHome } from './pages/DashboardHome';
import { MonthlyReportView } from './pages/MonthlyReportView';
import { SettingsView } from './pages/SettingsView';
import { FichierExploitationEauView } from './pages/FichierExploitationEauView';
import { StatisticsView } from './pages/StatisticsView';
import { PointageView } from './pages/PointageView';
import { RefectionView } from './pages/RefectionView';
import { EnveloppeFinanciereView } from './pages/EnveloppeFinanciereView';

// استيراد مكون استيراد الإكسل الجديد
import SRMExcelImporter from './components/SRMExcelImporter';

const AccentPicker = ({ accent, onAccentChange }) => (
  <span className="inline-flex items-center gap-1.5" role="group" aria-label="Couleur du thème">
    {ACCENTS.map((a) => (
      <button
        key={a.id}
        type="button"
        title={a.name}
        aria-label={`Thème ${a.name}`}
        aria-pressed={accent === a.id}
        onClick={() => onAccentChange(a.id)}
        className={`w-5 h-5 rounded-full border-2 transition ${accent === a.id ? 'border-slate-900 scale-110' : 'border-white/60 hover:scale-110'}`}
        style={{ backgroundColor: a.light }}
      />
    ))}
  </span>
);

// Theme exemption, updated 2026-10-28: Réfection's exemption was
// removed at Michael's request, so Réfection now follows the
// chosen accent and light/dark mode like every other view.
// Enveloppe financière stays exempt (light + navy, "Thème
// d'origine" badge) — only its exemption remains.
const EXEMPT_VIEWS = ['enveloppe'];

// Transitions Batch 1 (copy only): page side-by-side, in the
// transitions.dev "page side-by-side" style — rebuilt locally with
// motion, which the app already uses, not copied from the site.
// Previously the views switched with no transition (AnimatePresence
// was present but its children had no keys, so exits never ran).
// Each view is now a keyed motion wrapper: entering from the right
// when moving forward through the view order and from the left when
// moving back, with a short blur fade, 0.35s. No view, data or route
// is changed; Réfection and Enveloppe views themselves are untouched.
const VIEW_ORDER = ['home', 'pointage', 'rapport', 'refection', 'statistics', 'fichier', 'srm-excel', 'enveloppe', 'settings'];
const PageTransition = ({ viewKey, direction, children }) => {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) {
    return <div className="min-w-0">{children}</div>;
  }
  return (
    <Motion.div
      key={viewKey}
      initial={{ opacity: 0, x: direction * 28, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: direction * -28, filter: 'blur(4px)' }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="min-w-0"
    >
      {children}
    </Motion.div>
  );
};

const AuthenticatedApp = ({ user, activeView, setActiveView, theme, onToggleTheme, accent, onAccentChange, isThemeExempt, effectiveTheme, effectiveAccent }) => {
  const dashboardData = useDashboardData(user);
  const prevViewRef = useRef(activeView);
  const direction = VIEW_ORDER.indexOf(activeView) >= VIEW_ORDER.indexOf(prevViewRef.current) ? 1 : -1;
  useEffect(() => { prevViewRef.current = activeView; }, [activeView]);

  return (
    <DashboardLayout activeView={activeView} setActiveView={setActiveView} theme={effectiveTheme} onToggleTheme={isThemeExempt ? null : onToggleTheme} accent={effectiveAccent} onAccentChange={isThemeExempt ? null : onAccentChange} isThemeExempt={isThemeExempt}>
      <AnimatePresence mode="wait">
        {activeView === 'home' && (
          <PageTransition key="home" viewKey="home" direction={direction}>
            <DashboardHome
              stats={dashboardData.stats}
              dataList={dashboardData.dataList}
              chartData={dashboardData.chartData}
              theme={theme}
              accent={accent}
            />
          </PageTransition>
        )}
        {activeView === 'pointage' && (
          <PageTransition key="pointage" viewKey="pointage" direction={direction}>
            <PointageView user={user} />
          </PageTransition>
        )}
        {activeView === 'rapport' && (
          <PageTransition key="rapport" viewKey="rapport" direction={direction}>
            <MonthlyReportView
              {...dashboardData}
            />
          </PageTransition>
        )}
        {activeView === 'refection' && (
          <PageTransition key="refection" viewKey="refection" direction={direction}>
            <RefectionView user={user} />
          </PageTransition>
        )}
        {activeView === 'statistics' && (
          <PageTransition key="statistics" viewKey="statistics" direction={direction}>
            <StatisticsView dataList={dashboardData.dataList} theme={theme} accent={accent} />
          </PageTransition>
        )}
        {activeView === 'fichier' && (
          <PageTransition key="fichier" viewKey="fichier" direction={direction}>
            <FichierExploitationEauView user={user} {...dashboardData} />
          </PageTransition>
        )}

        {activeView === 'srm-excel' && (
          <PageTransition key="srm-excel" viewKey="srm-excel" direction={direction}>
            <div className="p-4 md:p-6 max-w-4xl mx-auto">
              <SRMExcelImporter />
            </div>
          </PageTransition>
        )}

        {/* Enveloppe block: outside the srm-excel block */}
        {activeView === 'enveloppe' && (
          <PageTransition key="enveloppe" viewKey="enveloppe" direction={direction}>
            <EnveloppeFinanciereView user={user} />
          </PageTransition>
        )}

        {activeView === 'settings' && (
          <PageTransition key="settings" viewKey="settings" direction={direction}>
            <SettingsView
              typeOptions={dashboardData.typeOptions}
              natureOptions={dashboardData.natureOptions}
              handleAddOption={dashboardData.handleAddOption}
              handleRemoveOption={dashboardData.handleRemoveOption}
            />
          </PageTransition>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

const KNOWN_VIEWS = ['home', 'pointage', 'rapport', 'refection', 'statistics', 'fichier', 'srm-excel', 'enveloppe', 'settings'];

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Refresh fix (copy only, also applied to original): the active view
  // used to live only in React state, so a refresh always reset it to
  // 'home'. It is now saved in localStorage on every change and
  // restored on load (invalid values fall back to 'home'), so a
  // refresh on Réfection stays on Réfection — and the same holds for
  // every other view. No view file, data or route was changed.
  const [activeView, setActiveView] = useState(() => {
    try {
      const saved = localStorage.getItem('hydraucan-active-view');
      return KNOWN_VIEWS.includes(saved) ? saved : 'home';
    } catch { return 'home'; }
  });
  useEffect(() => {
    try { localStorage.setItem('hydraucan-active-view', activeView); } catch {}
  }, [activeView]);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('hydraucan-theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
  });
  const [accent, setAccent] = useState(() => {
    try { return getAccent(localStorage.getItem('hydraucan-accent')).id; } catch { return 'navy'; }
  });

  // User's saved choices are kept even while an exempt view is shown;
  // only what is applied to <html> is overridden there.
  useEffect(() => {
    try { localStorage.setItem('hydraucan-theme', theme); } catch {}
  }, [theme]);
  useEffect(() => {
    try { localStorage.setItem('hydraucan-accent', accent); } catch {}
  }, [accent]);

  const isThemeExempt = EXEMPT_VIEWS.includes(activeView);
  const effectiveTheme = isThemeExempt ? 'light' : theme;
  const effectiveAccent = isThemeExempt ? 'navy' : accent;

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', effectiveTheme === 'dark');
    document.documentElement.dataset.accent = effectiveAccent;
  }, [effectiveTheme, effectiveAccent]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    // Transitions Batch 3 (copy only): skeleton loader and reveal,
    // in the transitions.dev "skeleton loader and reveal" style —
    // rebuilt locally. While auth resolves, a skeleton of the real
    // shell (sidebar, top bar, KPI row, chart cards) pulses; when
    // the user is known, the authenticated app below fades in
    // (see the Motion wrapper on its return). No data is shown
    // here, only placeholders.
    return (
      <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-[#0F172A]' : 'bg-[#EEF2F7]'}`} aria-label="Chargement">
        <div className="hidden lg:block w-[240px] shrink-0 p-6 space-y-4">
          <div className="h-12 rounded-lg bg-slate-300/60 animate-pulse" />
          <div className="h-16 rounded-lg bg-slate-300/40 animate-pulse" />
          <div className="h-10 rounded-lg bg-slate-300/40 animate-pulse" />
          <div className="h-10 rounded-lg bg-slate-300/40 animate-pulse" />
          <div className="h-10 rounded-lg bg-slate-300/40 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0 p-2">
          <div className="h-12 rounded-lg bg-slate-300/40 animate-pulse mb-2" />
          <div className="bg-white rounded-2xl border border-line p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="h-24 rounded-xl bg-slate-200/70 animate-pulse" />
              <div className="h-24 rounded-xl bg-slate-200/70 animate-pulse" />
              <div className="h-24 rounded-xl bg-slate-200/70 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-64 rounded-xl bg-slate-200/70 animate-pulse" />
              <div className="h-64 rounded-xl bg-slate-200/70 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-[#0F172A]' : 'bg-[#EEF2F7]'}`}>
        <header className="bg-[#16294D] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <img src="/logo-hydracane.png" alt="HYDRAUCAN" className="h-10 w-auto object-contain brightness-200" />
            <div className="flex items-center gap-3">
              <AccentPicker accent={accent} onAccentChange={setAccent} />
              <button onClick={toggleTheme} aria-label="Changer de thème" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-bold hover:bg-white/20 transition">
                {theme === 'dark' ? 'Clair' : 'Sombre'}
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" /> Espace employés
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
          <Toaster position="top-center" richColors />
          <LoginForm theme={theme} />
        </main>
        <footer className="pb-6 text-center text-xs text-slate-500">
          Usage interne uniquement · Réservé aux employés Hydraucan
        </footer>
      </div>
    );
  }

  return (
    <Motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
      <Toaster position="top-right" richColors />
      <AuthenticatedApp user={user} activeView={activeView} setActiveView={setActiveView} theme={theme} onToggleTheme={toggleTheme} accent={accent} onAccentChange={setAccent} isThemeExempt={isThemeExempt} effectiveTheme={effectiveTheme} effectiveAccent={effectiveAccent} />
    </Motion.div>
  );
}

export default App;