import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { LoginForm } from './components/LoginForm';
import { DashboardPreview } from './components/DashboardPreview';
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

const AuthenticatedApp = ({ user, activeView, setActiveView }) => {
  const dashboardData = useDashboardData(user); // explicitly pass user

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
        {activeView === 'rapport' && (
          <MonthlyReportView 
            {...dashboardData} 
          />
        )}
        {activeView === 'database' && (
          <DatabaseView 
            {...dashboardData}
          />
        )}
        {activeView === 'fichier' && (
          <FichierExploitationEauView user={user} {...dashboardData} />
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
      <main className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 lg:p-12" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #1A2B56 0%, #050505 100%)", backgroundColor: "#0F0F0F" }}>
        <Toaster position="top-right" richColors />
        <div className="uisocial-card w-full max-w-7xl flex flex-col md:flex-row min-h-[800px]">
          <div className="w-full md:w-[45%] lg:w-[42%] relative flex items-stretch">
            <DashboardPreview />
          </div>
          <div className="flex-1 bg-white flex items-center justify-center h-full">
            <LoginForm />
          </div>
        </div>
      </main>
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