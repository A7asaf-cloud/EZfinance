import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useFinanceData } from '../hooks/useFinanceData';
import { Card } from '../components/UI';
import { formatCurrency, cn } from '../lib/utils';
import { TrendingUp, TrendingDown, ArrowUpRight, Plus, Target, Briefcase, DollarSign, LineChart, Moon, Sun } from 'lucide-react';
import { COLORS } from '../types';
import { useUI } from '../contexts/UIContext';

interface OverviewProps {
  onNavigate: (id: any) => void;
}

export default function Overview({ onNavigate }: OverviewProps) {
  const { data } = useFinanceData();
  const { user } = useAuth();
  const { t, language, setLanguage, theme, toggleTheme } = useUI();

  const stockValue = data.stocks.reduce((acc, s) => acc + (s.shares * (s.currentPrice || s.avgBuyPrice)), 0);
  const netWorth = data.balance + 
    stockValue + 
    data.savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0);

  const totalStockInvestment = data.stocks.reduce((acc, s) => acc + (s.shares * s.avgBuyPrice), 0);
  const totalStockProfit = stockValue - totalStockInvestment;
  const totalStockProfitPerc = totalStockInvestment > 0 ? (totalStockProfit / totalStockInvestment) * 100 : 0;

  const stats = [
    { label: t('totalWealth'), value: netWorth, change: '+4.5%', trend: 'up', icon: DollarSign, currency: 'USD' },
    { label: 'Total Stock Profit', value: totalStockProfit, change: `${totalStockProfitPerc >= 0 ? '+' : ''}${totalStockProfitPerc.toFixed(1)}%`, trend: totalStockProfit >= 0 ? 'up' : 'down', icon: TrendingUp, currency: 'USD' },
    { label: t('marketValue'), value: stockValue, change: '+12.3%', trend: 'up', icon: LineChart, currency: 'USD' },
    { label: t('pension'), value: data.pension.balance, change: '+0.8%', trend: 'up', icon: Briefcase, currency: 'USD' },
  ];

  return (
    <div className="space-y-12 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-light tracking-tighter text-slate-900 dark:text-white capitalize">
            {t('welcome').split(' ')[0]} <span className="font-bold underline decoration-blue-500 underline-offset-8 decoration-4">{user?.name || 'User'}</span>
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 font-medium">Your financial landscape at a glance.</p>
        </div>
      </div>

      {/* Editorial Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <Card key={i} delay={i * 0.1} className="relative overflow-hidden group border-b-4 border-b-transparent hover:border-b-blue-500 transition-all">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-stone-500 mb-2">{s.label}</h3>
            <div className="text-3xl font-light tracking-tight text-slate-900 dark:text-white flex items-baseline gap-1">
              <span>{formatCurrency(s.value, s.currency, language).split('.')[0]}</span>
              <span className="text-sm opacity-40">.{formatCurrency(s.value, s.currency, language).split('.')[1] || '00'}</span>
            </div>
            <div className="flex items-center gap-2 mt-4 text-[10px] font-bold">
              <span className={cn(
                "flex items-center gap-0.5",
                s.trend === 'up' ? "text-emerald-500" : "text-red-500"
              )}>
                {s.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {s.change}
              </span>
              <span className="text-slate-300 dark:text-slate-700 uppercase">vs last month</span>
            </div>
            <div className="absolute right-[-10%] bottom-[-20%] opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <s.icon className="w-24 h-24" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2" title={t('totalWealth') + " " + t('history')}>
          <div className="h-[320px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { date: 'Jan', val: 50000 },
                { date: 'Feb', val: 55000 },
                { date: 'Mar', val: 58000 },
                { date: 'Apr', val: 62000 },
                { date: 'May', val: 65000 },
                { date: 'Jun', val: 72000 },
              ]}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#000' : '#1e293b', 
                    border: theme === 'dark' ? '1px solid #1c1917' : 'none', 
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 500
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="val" 
                  stroke="#2563eb" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorVal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Monthly Cash Flow">
          <div className="h-[320px] w-full pt-4">
            <div className="flex items-end gap-2 h-full">
              {[45, 52, 48, 61, 55, 68, 72, 65, 80, 85, 92, 100].map((h, i) => (
                <div key={i} className="flex-1 group relative">
                  <div 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-t-lg transition-all hover:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
              <span>JAN</span>
              <span>JUN</span>
              <span>DEC</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Market Watch (Top Movers)">
          <div className="space-y-1">
            {data.stocks.length === 0 ? (
               <p className="text-sm text-slate-400 italic py-8 text-center uppercase tracking-widest font-bold opacity-30">No active assets</p>
            ) : (
              [...data.stocks].sort((a, b) => {
                const aP = ((a.currentPrice || a.avgBuyPrice) - a.avgBuyPrice) / a.avgBuyPrice;
                const bP = ((b.currentPrice || b.avgBuyPrice) - b.avgBuyPrice) / b.avgBuyPrice;
                return bP - aP;
              }).slice(0, 4).map((s, i) => {
                const current = s.currentPrice || s.avgBuyPrice;
                const gain = current - s.avgBuyPrice;
                const gainPerc = (gain / s.avgBuyPrice) * 100;
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-stone-900 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-stone-800 flex items-center justify-center font-bold text-[10px] text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        {s.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-sm tabular-nums">{s.symbol}</p>
                        <p className="text-[10px] font-medium text-slate-400">{formatCurrency(current, 'USD', language)}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded text-[10px] font-black min-w-[60px] text-center",
                      gain >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {gain >= 0 ? '+' : ''}{gainPerc.toFixed(2)}%
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <button 
             onClick={() => onNavigate('stocks')}
             className="w-full py-4 text-[10px] font-black text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-[0.2em] border-t border-slate-50 dark:border-stone-900 mt-4"
          >
            Full Market View
          </button>
        </Card>

        <Card title="Upcoming Obligations">
          <div className="space-y-4">
            {data.reminders.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-8 text-center uppercase tracking-widest font-bold opacity-30">All systems clear</p>
            ) : (
              data.reminders.map(r => (
                <div key={r.id} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 group hover:border-blue-200 dark:hover:border-blue-900/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-stone-800 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm tracking-tight">{r.title}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('date')}: {new Date(r.dueDate).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
              <span className="font-bold text-sm tabular-nums">{formatCurrency(r.amount, 'ILS', language)}</span>
            </div>
              ))
            )}
            <button 
              onClick={() => onNavigate('cash')}
              className="w-full py-4 text-[10px] font-black text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-[0.2em] border-t border-slate-50 dark:border-slate-900 mt-4"
            >
              Access Ledger
            </button>
          </div>
        </Card>

        <div className="bg-slate-900 text-white rounded-[2rem] p-10 flex flex-col justify-between relative overflow-hidden group shadow-2xl">
          <div className="relative z-10">
            <h3 className="text-blue-400 text-[10px] font-black mb-4 uppercase tracking-[0.3em]">Editorial Insight</h3>
            <h2 className="text-4xl font-light tracking-tight mb-4 leading-tight">Your growth strategy is yielding <span className="text-blue-400">+12%</span> returns.</h2>
            <p className="text-slate-400 text-sm mb-10 max-w-sm leading-relaxed font-medium">Market sentiment remains bullish on your core holdings. Consider shifting surplus cash into higher-yield bond funds.</p>
          </div>
          <button 
            onClick={() => onNavigate('stocks')}
            className="bg-white text-slate-900 py-4 px-8 rounded-2xl w-fit text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-slate-100 transition-all active:scale-95 group"
          >
            Go to Portfolio
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </button>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-64 h-64" />
          </div>
        </div>
      </div>
    </div>
  );
}

