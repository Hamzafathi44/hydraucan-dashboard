import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { toast } from 'sonner';

export const LoginForm = ({ theme }) => {
  const isDark = theme === 'dark';
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Entrez d’abord votre email / identifiant pour recevoir le lien de réinitialisation.');
      return;
    }
    const finalEmail = email.includes('@') ? email : `${email}@hydraucane.com`;
    try {
      await sendPasswordResetEmail(auth, finalEmail);
      toast.success('Lien de réinitialisation envoyé à votre email.');
    } catch (error) {
      console.error("Password Reset Error: ", error);
      toast.error('Impossible d’envoyer le lien. Vérifiez votre email.');
    }
  };

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
    <div className={`w-full max-w-[440px] px-5 sm:px-8 py-8 sm:py-10 flex flex-col border shadow-xl rounded-3xl my-auto ${isDark ? 'bg-slate-900 border-slate-700 shadow-black/40' : 'bg-white border-slate-200 shadow-slate-900/5'}`}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <img src="/logo-hydracane.png" alt="HYDRAUCAN Logo" className="h-14 w-auto object-contain mx-auto mb-4" />
          <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Connexion employés</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Accès réservé aux employés Hydraucan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className={`text-[11px] font-bold uppercase tracking-widest ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email / Identifiant</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-5 py-4 border rounded-2xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-600 transition-[color,background-color,border-color,transform,opacity] shadow-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              placeholder="admin (ou adresse complète)"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <label className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Mot de passe</label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-5 py-4 border rounded-2xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-600 transition-[color,background-color,border-color,transform,opacity] shadow-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              placeholder="••••••••"
            />
            <div className="text-right mt-2">
              <button type="button" onClick={handleForgotPassword} className={`text-[11px] font-bold transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                Mot de passe oublié ?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-6 bg-[#16294D] hover:bg-[#0F1E3D] text-white text-base font-black rounded-2xl shadow-sm transition-[color,background-color,border-color,transform,opacity] active:scale-[0.98] tracking-tight flex justify-center items-center"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Connexion"}
          </button>
        </form>
      </div>
    </div>
  );
};
