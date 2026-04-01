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
    <div className="w-full max-w-[440px] px-8 md:px-10 py-12 flex flex-col bg-[#0A1020]/60 backdrop-blur-2xl border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] rounded-[2rem] my-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-20">
        <div className="flex items-center">
          <img 
            src="/logo-hydracane.png" 
            alt="HYDRAUCAN Logo" 
            className="h-14 w-auto object-contain"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white transition-all">
          <img src="https://flagcdn.com/w20/gb.png" alt="UK Flag" className="w-4 h-3 object-cover rounded-sm" />
          EN <ChevronDown className="w-3 h-3 text-white/50" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-12">
          <img 
            src="/logo-hydracane.png" 
            alt="HYDRAUCAN Logo" 
            className="w-full max-w-[260px] h-auto object-contain mx-auto mb-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.7)] brightness-200"
          />
          <p className="text-white/60 text-base font-medium">Welcome to HYDRAUCAN</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest ml-1">Email / Identifiant</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-medium placeholder:text-white/30 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all"
              placeholder="admin (ou adresse complète)"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Password</label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-medium placeholder:text-white/30 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all"
              placeholder="••••••••"
            />
            <div className="text-right mt-2">
              <button type="button" className="text-[11px] font-bold text-white/50 hover:text-white/80 transition-colors">
                Forgot password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 mt-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-base font-black rounded-2xl shadow-[0_12px_24px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98] tracking-tight flex justify-center items-center"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};
