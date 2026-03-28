import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { 
  Menu, X, LayoutDashboard, FileText, TrendingUp, Settings, LogOut 
} from 'lucide-react';

export const DashboardLayout = ({ children, activeView, setActiveView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="dashboard-layout relative">
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-6 right-6 z-30 p-2.5 bg-white border border-line shadow-sm text-ink rounded-xl"
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
          <img src="/logo-hydracane.png" alt="HYDRAUCAN" className="h-16 w-auto object-contain" referrerPolicy="no-referrer" />
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => { setActiveView('home'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeView === 'home' ? 'bg-accent/10 text-ink' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            TABLEAU DE BORD
          </button>
          <button 
            onClick={() => { setActiveView('rapport'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeView === 'rapport' ? 'bg-accent/10 text-ink' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <FileText className="w-5 h-5" />
            RAPPORT MENSUEL
          </button>
          <button 
            onClick={() => { setActiveView('database'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeView === 'database' ? 'bg-accent/10 text-ink' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <TrendingUp className="w-5 h-5" />
            Base de données
          </button>
          <button 
            onClick={() => { setActiveView('settings'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeView === 'settings' ? 'bg-accent/10 text-ink' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <Settings className="w-5 h-5" />
            Paramètres
          </button>
        </nav>

        <div className="pt-6 border-t border-line">
          <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm transition-all">
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
