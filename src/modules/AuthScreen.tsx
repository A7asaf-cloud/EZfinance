import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { Button, Card } from '../components/UI';
import { Wallet, ArrowRight, Globe } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthScreen() {
  const { login } = useAuth();
  const { t, language, setLanguage } = useUI();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    // Artificial delay for a "connecting" feel
    setTimeout(() => {
      login(name);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-500/20">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-blue-700 dark:text-blue-400">EZ<span className="text-slate-400 font-normal">FINANCE</span></h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-center text-sm font-medium tracking-tight">
            Sophisticated financial tracking made EZ.
          </p>
        </div>

        <Card className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-2">{t('welcome')}</h2>
              <p className="text-sm text-slate-500 font-medium">{t('enterName')}</p>
            </div>
            <button 
              onClick={() => setLanguage(language === 'en' ? 'he' : 'en')}
              className="p-2 hover:bg-slate-50 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"
            >
              <Globe className="w-3 h-3" />
              {language === 'en' ? 'HE' : 'EN'}
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">
                {language === 'he' ? 'שם חשבון' : 'Account Name'}
              </label>
              <input
                type="text"
                placeholder="e.g. Asaf"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-bold"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <Button 
              type="submit"
              disabled={!name.trim() || loading}
              className="w-full flex items-center justify-center gap-3 py-4 text-xs font-black uppercase tracking-widest"
            >
              {loading ? (language === 'he' ? 'מתחבר...' : 'Entering...') : t('openDashboard')}
              <ArrowRight className={`w-4 h-4 ${language === 'he' ? 'rotate-180' : ''}`} />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] uppercase font-bold text-slate-300 tracking-[0.2em]">
              Simple Cloud Sync Enabled
            </p>
          </div>
        </Card>

        <p className="mt-8 text-center text-[10px] text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
          No passwords required. Your data is synced to the cloud via anonymous identity. All rights reserved by EZfinance Editorial.
        </p>
      </motion.div>
    </div>
  );
}
