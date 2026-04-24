import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { Button, Card } from '../components/UI';
import { Wallet, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthScreen() {
  const { login, isFirstVisit, createAccount } = useAuth();
  const { t, language, setLanguage } = useUI();
  const [fullName, setFullName] = useState('');
  const [password, setPasswordInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get user name from localStorage if not first visit
  const existingName = !isFirstVisit ? JSON.parse(localStorage.getItem('ez_account') || '{}').name : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isFirstVisit) {
      if (fullName.length < 2) {
        setError(language === 'he' ? 'שם חייב להיות לפחות 2 תווים' : 'Name must be at least 2 characters');
        return;
      }
      if (password.length < 4) {
        setError(language === 'he' ? 'הסיסמא חייבת להיות לפחות 4 תווים' : 'Password must be at least 4 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError(t('passwordsDontMatch'));
        return;
      }
      createAccount(fullName, password);
      return;
    }

    setLoading(true);
    const success = await login(password);
    if (!success) {
      setError(t('wrongPassword'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white mb-6 shadow-2xl shadow-blue-500/40 border border-white/10">
            <Wallet className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white italic">EZ<span className="text-slate-500 font-normal not-italic">finance</span></h1>
          <p className="text-slate-400 mt-3 text-center text-sm font-medium tracking-tight max-w-[240px]">
             {isFirstVisit ? (language === 'he' ? 'צור חשבון חדש' : 'Create a new account') : `Welcome back, ${existingName}`}
          </p>
        </div>

        <Card className="p-10 bg-[#0a0a0a] border-white/5 shadow-2xl">
          <div className="flex justify-between items-start mb-8">
            <h2 className="text-2xl font-black tracking-tight text-white">
              {isFirstVisit ? (language === 'he' ? 'הרשמה' : 'Create Account') : t('login')}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {isFirstVisit && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                    {language === 'he' ? 'שם מלא' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'he' ? 'ישראל ישראלי' : 'Asaf Cohen'}
                    required
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all font-bold text-white placeholder:text-slate-700"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                  {t('password')}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all font-mono text-xl text-white tracking-widest placeholder:text-slate-700"
                  value={password}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus={!isFirstVisit}
                />
              </div>

              {isFirstVisit && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                    {t('confirmPassword')}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    required
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all font-mono text-xl text-white tracking-widest placeholder:text-slate-700"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-500 text-center"
              >
                {error}
              </motion.div>
            )}

            <Button 
              type="submit"
              disabled={loading || !password}
              className="w-full flex items-center justify-center gap-3 py-5 text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
            >
              {loading ? (language === 'he' ? 'מתחבר...' : 'Validating...') : (isFirstVisit ? (language === 'he' ? 'צור חשבון' : 'Create Account') : t('openDashboard'))}
              {!loading && <ArrowRight className={`w-4 h-4 ${language === 'he' ? 'rotate-180' : ''}`} />}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center flex justify-center items-center">
            <p className="text-[10px] uppercase font-bold text-white/10 tracking-[0.3em]">
              Encrypted Local Session
            </p>
          </div>
        </Card>

        <p className="mt-10 text-center text-[10px] text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
          Private local storage. Your data never leaves this device. All information is cleared upon clearing browser data.
        </p>
      </motion.div>
    </div>
  );
}
