import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { LoginForm } from './components/LoginForm';
import { Toaster } from 'sonner';
import { AnimatePresence } from 'motion/react';

// Hooks & Layouts
import { useDashboardData } from './hooks/useDashboardData';
import { DashboardLayout } from './layouts/DashboardLayout';

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

const AuthenticatedApp = ({ user, activeView, setActiveView }) => {
  const dashboardData = useDashboardData(user);

  return (
    <DashboardLayout activeView={activeView} setActiveView={setActiveView}>
      <AnimatePresence mode="wait">
        {activeView === 'home' && (
          <DashboardHome 
            stats={dashboardData.stats} 
            dataList={dashboardData.dataList} 
            chartData={dashboardData.chartData} 
          />
        )}
        {activeView === 'pointage' && (
          <PointageView user={user} />
        )}
        {activeView === 'rapport' && (
          <MonthlyReportView 
            {...dashboardData} 
          />
        )}
        {activeView === 'refection' && (
          <RefectionView />
        )}
        {activeView === 'statistics' && (
          <StatisticsView dataList={dashboardData.dataList} />
        )}
        {activeView === 'fichier' && (
          <FichierExploitationEauView user={user} {...dashboardData} />
        )}
        
        {activeView === 'srm-excel' && (
          <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <SRMExcelImporter />
          </div>
        )}

        {/* ✅ CORRECTED PLACEMENT: The Enveloppe block goes here, outside the srm-excel block */}
        {activeView === 'enveloppe' && (
          <EnveloppeFinanciereView />
        )}

        {activeView === 'settings' && (
          <SettingsView 
            typeOptions={dashboardData.typeOptions}
            natureOptions={dashboardData.natureOptions}
            handleAddOption={dashboardData.handleAddOption}
            handleRemoveOption={dashboardData.handleRemoveOption}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeView, setActiveView] = useState('home');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-[#1A2B56]/30 border-t-[#1A2B56] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#EEF2F7] flex flex-col">
        <header className="bg-[#16294D] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <img src="/logo-hydracane.png" alt="HYDRAUCAN" className="h-10 w-auto object-contain brightness-200" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" /> Espace employés
            </span>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
          <Toaster position="top-center" richColors />
          <LoginForm />
        </main>
        <footer className="pb-6 text-center text-xs text-slate-500">
          Usage interne uniquement · Réservé aux employés Hydraucan
        </footer>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <AuthenticatedApp user={user} activeView={activeView} setActiveView={setActiveView} />
    </>
  );
}

export default App;