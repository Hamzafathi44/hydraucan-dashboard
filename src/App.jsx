import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { LoginForm } from './components/LoginForm';
import { DashboardPreview } from './components/DashboardPreview';
import { HeroGeometric } from './components/ui/shape-landing-hero';
import { Toaster } from 'sonner';
import { AnimatePresence } from 'motion/react';

// Hooks & Layouts
import { useDashboardData } from './hooks/useDashboardData';
import { DashboardLayout } from './layouts/DashboardLayout';

// View Pages
import { DashboardHome } from './pages/DashboardHome';
import { MonthlyReportView } from './pages/MonthlyReportView';
import { DatabaseView } from './pages/DatabaseView';
import { SettingsView } from './pages/SettingsView';
import { FichierExploitationEauView } from './pages/FichierExploitationEauView';
import { StatisticsView } from './pages/StatisticsView';
import { PointageView } from './pages/PointageView';

// 1. استيراد المكون الجديد
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
        {activeView === 'statistics' && (
          <StatisticsView dataList={dashboardData.dataList} />
        )}
        {activeView === 'fichier' && (
          <FichierExploitationEauView user={user} {...dashboardData} />
        )}
        {/* 2. إضافة الواجهة الجديدة هنا */}
        {activeView === 'srm-excel' && (
          <div className="p-6">
            <SRMExcelImporter />
          </div>
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
      <HeroGeometric>
        <Toaster position="top-right" richColors />
        <div className="relative z-20 w-full flex items-center justify-center pointer-events-auto px-4 mt-8 md:mt-0">
          <LoginForm />
        </div>
      </HeroGeometric>
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
