import React, { useState } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
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
    <div className="w-full max-w-[480px] px-8 md:px-16 py-12 flex flex-col h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-20">
        <div className="flex items-center">
          <img 
            src="/logo-hydracane.png" 
            alt="HYDRAUCAN Logo" 
            className="h-14 w-auto object-contain"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all">
          <img src="https://flagcdn.com/w20/gb.png" alt="UK Flag" className="w-4 h-3 object-cover rounded-sm" />
          EN <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-12">
          <img 
            src="/logo-hydracane.png" 
            alt="HYDRAUCAN Logo" 
            className="w-full max-w-[260px] h-auto object-contain mx-auto mb-8"
          />
          <p className="text-slate-500 text-base font-medium">Welcome to HYDRAUCAN</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email / Identifiant</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="uisocial-input"
              placeholder="admin (ou adresse complète)"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="uisocial-input"
              placeholder="••••••••"
            />
            <div className="text-right mt-2">
              <button type="button" className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors">
                Forgot password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="uisocial-btn-primary mt-6 flex justify-center items-center"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};
