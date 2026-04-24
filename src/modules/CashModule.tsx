import React, { useState } from 'react';
import { useFinanceData } from '../hooks/useFinanceData';
import { Card, Button } from '../components/UI';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { useUI } from '../contexts/UIContext';
import { CATEGORIES, TransactionType, Recurring } from '../types';
import { Plus, Trash2, Filter, Search, ArrowUpCircle, ArrowDownCircle, Repeat, Calendar, Wallet } from 'lucide-react';

type CashView = 'transactions' | 'recurring';

export default function CashModule() {
  const { data, addTransaction, deleteTransaction, addRecurring, deleteRecurring } = useFinanceData();
  const { dir, t, language } = useUI();
  
  const [activeTab, setActiveTab] = useState<CashView>('transactions');
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<{ type: TransactionType | 'all', search: string }>({ type: 'all', search: '' });

  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as TransactionType,
    category: 'Housing',
    description: '',
    date: new Date().toISOString().split('T')[0],
    dayOfMonth: '1'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) return;
    
    if (activeTab === 'transactions') {
      addTransaction({
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        description: formData.description || formData.category,
        date: new Date(formData.date).toISOString(),
        account: 'Cash'
      });
    } else {
      addRecurring({
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        description: formData.description || formData.category,
        dayOfMonth: parseInt(formData.dayOfMonth),
        lastApplied: new Date(2000, 0, 1).toISOString() // Epoch to ensure first application
      });
    }
    
    setFormData({ ...formData, amount: '', description: '' });
    setShowAdd(false);
  };

  const filtered = data.transactions.filter(tData => {
    const matchesSearch = tData.description.toLowerCase().includes(filter.search.toLowerCase()) || 
                          tData.category.toLowerCase().includes(filter.search.toLowerCase());
    const matchesType = filter.type === 'all' || tData.type === filter.type;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-stone-900 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('transactions')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
              activeTab === 'transactions' ? "bg-white dark:bg-stone-800 text-blue-600 shadow-sm" : "text-slate-500"
            )}
          >
            <Wallet className="w-4 h-4" />
            {t('recentTransactions')}
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
              activeTab === 'recurring' ? "bg-white dark:bg-stone-800 text-blue-600 shadow-sm" : "text-slate-500"
            )}
          >
            <Repeat className="w-4 h-4" />
            {t('recurring')}
          </button>
        </div>
        
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4" />
          {activeTab === 'transactions' ? t('addTransaction') : t('setupAutoPay')}
        </Button>
      </div>

      {showAdd && (
        <Card title={activeTab === 'transactions' ? t('addTransaction') : t('setupAutoPay')} className="border-blue-600 border-2">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end text-left">
            <div>
              <label className="block text-xs font-bold uppercase mb-1 opacity-60">{t('amount')} (USD)</label>
              <input 
                type="number" 
                required
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                className="w-full bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-lg p-2 font-mono"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1 opacity-60">Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}
                className="w-full bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-lg p-2"
              >
                <option value="expense">{t('expense')}</option>
                <option value="income">{t('income')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1 opacity-60">{t('category')}</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-lg p-2"
              >
                {CATEGORIES[formData.type].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            {activeTab === 'transactions' ? (
               <div>
                <label className="block text-xs font-bold uppercase mb-1 opacity-60">{t('date')}</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-lg p-2"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase mb-1 opacity-60">Day of Month</label>
                <input 
                  type="number" 
                  min="1" max="31"
                  value={formData.dayOfMonth}
                  onChange={e => setFormData({...formData, dayOfMonth: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-lg p-2"
                />
              </div>
            )}

            <div className="lg:col-span-1">
              <label className="block text-xs font-bold uppercase mb-1 opacity-60">{t('description')}</label>
              <input 
                type="text" 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-lg p-2"
                placeholder={activeTab === 'transactions' ? "e.g. Coffee" : "e.g. Monthly Salary"}
              />
            </div>
            <Button type="submit" className="w-full">{t('save')}</Button>
          </form>
        </Card>
      )}

      {activeTab === 'transactions' ? (
        <Card>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search..."
                value={filter.search}
                onChange={e => setFilter({...filter, search: e.target.value})}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-stone-800 border border-slate-100 dark:border-stone-800 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-stone-800 p-1 rounded-xl w-full md:w-auto">
              {(['all', 'income', 'expense'] as const).map(tr => (
                <button
                  key={tr}
                  onClick={() => setFilter({...filter, type: tr})}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all",
                    filter.type === tr ? "bg-white dark:bg-black shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tr === 'all' ? (language === 'he' ? 'הכל' : 'All') : t(tr as any)}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className={cn("w-full text-left", language === 'he' ? "text-right" : "text-left")}>
              <thead>
                <tr className="border-b border-slate-100 dark:border-stone-800">
                  <th className="pb-4 font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">{t('date')}</th>
                  <th className="pb-4 font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">{t('description')}</th>
                  <th className="pb-4 font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">{t('category')}</th>
                  <th className="pb-4 font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">{t('amount')}</th>
                  <th className="pb-4 font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">{t('sell')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-stone-900">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-slate-500 italic font-bold opacity-30 uppercase tracking-widest">No transactions found</td>
                  </tr>
                ) : (
                  filtered.map(item => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-stone-900/30 transition-colors">
                      <td className="py-4 text-xs font-bold text-slate-400 tabular-nums">{formatDate(item.date, language)}</td>
                      <td className="py-4 font-black text-sm flex items-center gap-2">
                        {item.type === 'income' ? <ArrowUpCircle className="w-4 h-4 text-emerald-500" /> : <ArrowDownCircle className="w-4 h-4 text-red-500" />}
                        {item.description}
                      </td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-stone-800 rounded-lg text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          {item.category}
                        </span>
                      </td>
                      <td className={cn(
                        "py-4 text-sm font-black tabular-nums",
                        item.type === 'income' ? "text-emerald-500" : "text-red-500"
                      )}>
                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, 'USD', language)}
                      </td>
                      <td className="py-4">
                        <button 
                          onClick={() => deleteTransaction(item.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card title={t('recurring')}>
          <div className="overflow-x-auto">
            <table className={cn("w-full text-left", language === 'he' ? "text-right" : "text-left")}>
              <thead>
                <tr className="border-b border-slate-100 dark:border-stone-800">
                  <th className="pb-4 font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">{t('date')} (Day)</th>
                  <th className="pb-4 font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">{t('description')}</th>
                  <th className="pb-4 font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">{t('category')}</th>
                  <th className="pb-4 font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">{t('amount')}</th>
                  <th className="pb-4 font-black text-[10px] uppercase text-slate-400 tracking-[0.2em] text-right">{t('lastUpdated')}</th>
                  <th className="pb-4 font-black text-[10px] uppercase text-slate-400 tracking-[0.2em] text-right">{t('sell')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-stone-900">
                {data.recurring.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-slate-500 italic font-bold opacity-30 uppercase tracking-widest">No recurring transactions set up</td>
                  </tr>
                ) : (
                  data.recurring.map(rec => (
                    <tr key={rec.id} className="group hover:bg-slate-50/50 dark:hover:bg-stone-900/30 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="font-black text-sm tracking-tight">{rec.dayOfMonth}th</span>
                        </div>
                      </td>
                      <td className="py-4 font-black text-sm">{rec.description}</td>
                      <td className="py-4">
                         <span className="px-2 py-1 bg-slate-100 dark:bg-stone-800 rounded-lg text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          {rec.category}
                        </span>
                      </td>
                      <td className={cn(
                        "py-4 text-sm font-black tabular-nums",
                        rec.type === 'income' ? "text-emerald-500" : "text-red-500"
                      )}>
                        {rec.type === 'income' ? '+' : '-'}{formatCurrency(rec.amount, 'USD', language)}
                      </td>
                      <td className="py-4 text-xs font-bold text-right text-slate-400 tabular-nums">
                        {rec.lastApplied === new Date(2000, 0, 1).toISOString() ? '---' : formatDate(rec.lastApplied, language)}
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => deleteRecurring(rec.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
