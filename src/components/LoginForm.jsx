import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { toast } from 'sonner';

export const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const finalEmail = email.includes('@') ? email : `${email}@hydraucane.com`;
      await signInWithEmailAndPassword(auth, finalEmail, password);
      // On auth state change in App.jsx handles routing/display
    } catch (error) {
      console.error("Login Error: ", error);
      toast.error('Échec de la connexion. Vérifiez vos identifiants.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] px-5 sm:px-8 py-8 sm:py-10 flex flex-col bg-white border border-slate-200 shadow-xl shadow-slate-900/5 rounded-3xl my-auto">
      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <img src="/logo-hydracane.png" alt="HYDRAUCAN Logo" className="h-14 w-auto object-contain mx-auto mb-4" />
          <h1 className="text-xl font-black text-slate-900">Connexion employés</h1>
          <p className="text-sm text-slate-500 mt-1">Accès réservé aux employés Hydraucan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email / Identifiant</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-600 transition-all shadow-sm"
              placeholder="admin (ou adresse complète)"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Mot de passe</label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-600 transition-all shadow-sm"
              placeholder="••••••••"
            />
            <div className="text-right mt-2">
              <button type="button" className="text-[11px] font-bold text-slate-500 hover:text-slate-700 transition-colors">
                Forgot password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-6 bg-[#16294D] hover:bg-[#0F1E3D] text-white text-base font-black rounded-2xl shadow-sm transition-all active:scale-[0.98] tracking-tight flex justify-center items-center"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};
