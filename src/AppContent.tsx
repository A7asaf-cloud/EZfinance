import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  Target, 
  Umbrella, 
  FileUp, 
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  Globe,
  LogOut
} from 'lucide-react';
import { useUI } from './contexts/UIContext';
import { useAuth } from './contexts/AuthContext';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import Overview from './modules/Overview';
import CashModule from './modules/CashModule';
import StockModule from './modules/StockModule';
import SavingsModule from './modules/SavingsModule';
import PensionModule from './modules/PensionModule';
import ImportModule from './modules/ImportModule';
import AuthScreen from './modules/AuthScreen';

type ModuleId = 'overview' | 'cash' | 'stocks' | 'savings' | 'pension' | 'import';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [activeModule, setActiveModule] = useState<ModuleId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, language, dir, toggleTheme, setLanguage, t } = useUI();

  if (loading) return null;
  if (!user) return <AuthScreen />;

  const menuItems = [
    { id: 'overview', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'cash', label: t('cash'), icon: Wallet },
    { id: 'stocks', label: t('stocks'), icon: TrendingUp },
    { id: 'savings', label: t('savings'), icon: Target },
    { id: 'pension', label: t('pension'), icon: Umbrella },
    { id: 'import', label: t('import'), icon: FileUp },
  ];

  const renderModule = () => {
    switch (activeModule) {
      case 'overview': return <Overview onNavigate={setActiveModule} />;
      case 'cash': return <CashModule />;
      case 'stocks': return <StockModule />;
      case 'savings': return <SavingsModule />;
      case 'pension': return <PensionModule />;
      case 'import': return <ImportModule />;
      default: return <Overview onNavigate={setActiveModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex font-sans selection:bg-blue-100 dark:selection:bg-slate-800">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-900 transition-transform lg:translate-x-0 overflow-y-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        dir === 'rtl' && "left-auto right-0 translate-x-full lg:translate-x-0",
        dir === 'rtl' && sidebarOpen && "translate-x-0"
      )}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xl font-black tracking-tighter text-blue-700 dark:text-blue-400 italic">EZ<span className="text-slate-300 dark:text-slate-700 font-normal not-italic tracking-normal">finance</span></div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-4 px-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveModule(item.id as ModuleId);
                setSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                activeModule === item.id 
                  ? "text-blue-600 dark:text-blue-400 font-bold" 
                  : "text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              {activeModule === item.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"
                />
              )}
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                activeModule === item.id ? "text-blue-600 dark:text-blue-400" : "text-slate-300 group-hover:text-slate-500"
              )} />
              <span className="text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-100 dark:border-slate-900 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex gap-2">
              <button onClick={toggleTheme} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full transition-colors border border-transparent hover:border-slate-200">
                {theme === 'light' ? <Moon className="w-4 h-4 text-slate-500" /> : <Sun className="w-4 h-4 text-slate-500" />}
              </button>
              <button 
                onClick={() => setLanguage(language === 'en' ? 'he' : 'en')} 
                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full transition-colors border border-transparent hover:border-slate-200 text-[10px] font-black text-slate-500"
              >
                {language === 'en' ? 'HE' : 'EN'}
              </button>
            </div>
            <div className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{language}</div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-bold text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/70 dark:bg-black/70 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-900">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic">
              Editorial Summary
            </h1>
            <div className="text-xl font-bold flex items-center gap-2">
              {menuItems.find(m => m.id === activeModule)?.label}
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {/* Profile/Quick Info could go here */}
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderModule()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
