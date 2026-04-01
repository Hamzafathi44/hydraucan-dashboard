import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { 
  Menu, X, LayoutDashboard, FileText, TrendingUp, Settings, LogOut, Droplets, PieChart 
} from 'lucide-react';

export const DashboardLayout = ({ children, activeView, setActiveView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="dashboard-layout relative" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #1A2B56 0%, #030303 100%)" }}>
      {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden fixed top-6 right-6 z-30 p-2.5 bg-slate-900/60 backdrop-blur-md border border-slate-700 shadow-sm text-cyan-400 rounded-xl"
        >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between px-2 mb-4">
          <img src="/logo-hydracane.png" alt="HYDRAUCAN" className="h-16 w-auto object-contain drop-shadow-md brightness-200" referrerPolicy="no-referrer" />
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => { setActiveView('home'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeView === 'home' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            TABLEAU DE BORD
          </button>
          <button 
            onClick={() => { setActiveView('rapport'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeView === 'rapport' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <FileText className="w-5 h-5" />
            RAPPORT MENSUEL
          </button>
          <button 
            onClick={() => { setActiveView('database'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeView === 'database' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <TrendingUp className="w-5 h-5" />
            Base de données
          </button>
          <button 
            onClick={() => { setActiveView('statistics'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeView === 'statistics' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <PieChart className="w-5 h-5" />
            Toutes les Statistiques
          </button>
          <button 
            onClick={() => { setActiveView('fichier'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeView === 'fichier' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <Droplets className="w-5 h-5" />
            Fichier EXPLOITATION EAU
          </button>
          <button 
            onClick={() => { setActiveView('settings'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeView === 'settings' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <Settings className="w-5 h-5" />
            Paramètres
          </button>
        </nav>

        <div className="pt-6 border-t border-line">
          <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl font-bold text-sm transition-all">
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
