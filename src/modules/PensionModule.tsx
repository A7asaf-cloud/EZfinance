import React from 'react';
import { useFinanceData } from '../hooks/useFinanceData';
import { Card } from '../components/UI';
import { formatCurrency, cn } from '../lib/utils';
import { Umbrella, Landmark, ArrowRight, History } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { useUI } from '../contexts/UIContext';

export default function PensionModule() {
  const { data, updatePension } = useFinanceData();
  const { t, language } = useUI();
  const { balance, monthlyContribution, retirementDate, expectedAnnualReturn } = data.pension;

  const currentYear = new Date().getFullYear();
  const retirementYear = new Date(retirementDate).getFullYear();
  const yearsToRetirement = retirementYear - currentYear;

  // Projection Logic
  const projectionData = [];
  let currentProj = balance;
  const rate = expectedAnnualReturn / 100;

  for (let i = 0; i <= Math.min(yearsToRetirement, 50); i++) {
    projectionData.push({
      year: currentYear + i,
      value: Math.round(currentProj)
    });
    // Simple compound interest with monthly contributions
    currentProj = currentProj * (1 + rate) + (monthlyContribution * 12);
  }

  const finalValue = projectionData[projectionData.length - 1]?.value || 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('pension')}</h2>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full text-xs font-bold uppercase">
          <Landmark className="w-3 h-3" />
          Fund Secure
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        <Card className="lg:col-span-1 space-y-6">
          <div className="p-4 bg-stone-900 text-white rounded-2xl">
            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">{t('balance')}</p>
            <h3 className="text-3xl font-black tabular-nums">{formatCurrency(balance, 'USD', language)}</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-2 opacity-60">{t('monthlyContribution')}</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="0" 
                  max="10000" 
                  step="100"
                  value={monthlyContribution}
                  onChange={e => updatePension({ monthlyContribution: parseInt(e.target.value) })}
                  className="flex-1 accent-stone-900 dark:accent-stone-100"
                />
                <span className="font-bold text-sm w-20 text-right">{formatCurrency(monthlyContribution, 'USD', language)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1 opacity-60">{t('expectedReturn')} (%)</label>
              <input 
                type="number" 
                value={expectedAnnualReturn}
                onChange={e => updatePension({ expectedAnnualReturn: parseFloat(e.target.value) })}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1 opacity-60">Retirement Date</label>
              <input 
                type="date" 
                value={new Date(retirementDate).toISOString().split('T')[0]}
                onChange={e => updatePension({ retirementDate: new Date(e.target.value).toISOString() })}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2 font-bold"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-stone-100 dark:border-stone-800">
             <div className="flex items-center gap-2 text-stone-500 mb-2">
                <History className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-tight">Recent History</span>
             </div>
             <div className="space-y-2">
                {[
                  { desc: 'Monthly Employer Match', amt: 450, date: 'Apr 20' },
                  { desc: 'Employee Voluntary', amt: 200, date: 'Apr 18' },
                ].map((h, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span>{h.desc}</span>
                    <span className="font-mono text-xs opacity-60">{h.date}</span>
                  </div>
                ))}
             </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 flex flex-col" title="Retirement Projection">
          <div className="flex-1 min-h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="colorPension" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1c1917', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  formatter={(val: number) => formatCurrency(val, 'USD', language)}
                />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorPension)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800">
            <div>
              <p className="text-stone-500 text-xs font-bold uppercase mb-1">Est. Portfolio at {retirementYear}</p>
              <p className="text-3xl font-black text-violet-600 dark:text-violet-400 tabular-nums">{formatCurrency(finalValue, 'USD', language)}</p>
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 text-stone-500 text-xs font-bold uppercase">
                <ArrowRight className="w-4 h-4 text-violet-500" />
                Monthly Withdrawal Potential
              </div>
              <p className="text-xl font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                {formatCurrency(finalValue * 0.04 / 12, 'USD', language)} / month
                <span className="block text-[10px] opacity-60 font-normal normal-case mt-1 italic">Based on standard 4% rule</span>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
