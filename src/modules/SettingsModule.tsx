import React, { useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { useFinanceData } from '../hooks/useFinanceData';
import { Card, Button } from '../components/UI';
import { 
  Sun, 
  Moon, 
  Lock, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsModule() {
  const { theme, toggleTheme, language, setLanguage, t } = useUI();
  const { clearAllData, data } = useFinanceData();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    const accountData = localStorage.getItem('ez_account');
    if (!accountData) return;
    
    const account = JSON.parse(accountData);
    
    if (btoa(passwords.old) !== account.passwordHash) {
      setPasswordStatus({ type: 'error', msg: t('wrongPassword') });
      return;
    }
    
    if (passwords.new !== passwords.confirm) {
      setPasswordStatus({ type: 'error', msg: t('passwordsDontMatch') });
      return;
    }

    if (passwords.new.length < 4) {
      setPasswordStatus({ type: 'error', msg: 'Min 4 characters' });
      return;
    }

    account.passwordHash = btoa(passwords.new);
    localStorage.setItem('ez_account', JSON.stringify(account));
    setPasswordStatus({ type: 'success', msg: t('passwordChanged') });
    setPasswords({ old: '', new: '', confirm: '' });
    setTimeout(() => {
      setShowPasswordChange(false);
      setPasswordStatus(null);
    }, 2000);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `ezfinance_export_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleClearData = () => {
    clearAllData();
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Account & Security */}
        <div className="space-y-8">
          <Card title="Account Details" className="relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 font-black text-2xl tracking-tighter italic">
                {user?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">Account Holder</p>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {user?.name}
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-stone-800 flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <span>Status</span>
              <span className="text-emerald-500">Active Editorial Tier</span>
            </div>
          </Card>

          <Card title="Security">
            <div className="space-y-4">
              <button 
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-stone-800/50 rounded-2xl group transition-all hover:bg-slate-100 dark:hover:bg-stone-800"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-sm font-bold tracking-tight">{t('changePassword')}</span>
                </div>
                <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-stone-700 flex items-center justify-center">
                  <span className="text-xl leading-none font-light">→</span>
                </div>
              </button>

              <AnimatePresence>
                {showPasswordChange && (
                  <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handlePasswordChange}
                    className="space-y-3 overflow-hidden pt-2"
                  >
                    <input 
                      type="password" 
                      placeholder="Old Password"
                      required
                      className="w-full bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                      value={passwords.old}
                      onChange={e => setPasswords({...passwords, old: e.target.value})}
                    />
                    <input 
                      type="password" 
                      placeholder="New Password"
                      required
                      className="w-full bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                      value={passwords.new}
                      onChange={e => setPasswords({...passwords, new: e.target.value})}
                    />
                    <input 
                      type="password" 
                      placeholder="Confirm New Password"
                      required
                      className="w-full bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                      value={passwords.confirm}
                      onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                    />
                    {passwordStatus && (
                      <div className={`p-3 rounded-xl text-[10px] font-black uppercase text-center flex items-center justify-center gap-2 ${passwordStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {passwordStatus.type === 'success' && <CheckCircle2 className="w-3 h-3" />}
                        {passwordStatus.msg}
                      </div>
                    )}
                    <Button type="submit" size="sm" className="w-full">{t('save')}</Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </div>

        {/* Data Management */}
        <div className="space-y-8">
          <Card title="Data Management">
            <div className="space-y-3">
              <button 
                onClick={exportData}
                className="w-full flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-2xl font-bold text-sm transition-all hover:bg-blue-100 dark:hover:bg-blue-900/20"
              >
                <Download className="w-4 h-4" />
                {t('exportData')}
              </button>

              <button 
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl font-bold text-sm transition-all hover:bg-red-100 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
                {t('clearData')}
              </button>

              <AnimatePresence>
                {showClearConfirm && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="p-6 border-2 border-red-500/20 bg-red-500/5 rounded-3xl space-y-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-red-500 rounded-xl text-white">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-sm text-red-600 uppercase tracking-tight mb-1">Destructive Action</p>
                        <p className="text-xs text-red-500/80 leading-relaxed">{t('confirmClear')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="danger" size="sm" className="flex-1" onClick={handleClearData}>Delete Permanently</Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowClearConfirm(false)} className="text-red-500">{t('cancel')}</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </div>
      </div>

      <div className="text-center font-mono text-[10px] text-slate-300 dark:text-stone-700 tracking-widest uppercase">
        EZfinance Core v2.4.1 // Local Storage Protocol
      </div>
    </div>
  );
}
