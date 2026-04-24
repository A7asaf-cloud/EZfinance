import React, { useState } from 'react';
import { useFinanceData } from '../hooks/useFinanceData';
import { Card, Button } from '../components/UI';
import { formatCurrency, cn } from '../lib/utils';
import { Plus, Target, Calendar, TrendingUp } from 'lucide-react';
import { differenceInMonths, addMonths } from 'date-fns';
import { motion } from 'motion/react';

export default function SavingsModule() {
  const { data, addSavingsGoal, deleteSavingsGoal } = useFinanceData();
  const [showAdd, setShowAdd] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split('T')[0],
    color: '#3b82f6'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount) return;

    addSavingsGoal({
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount || '0'),
      deadline: new Date(formData.deadline).toISOString(),
      color: formData.color
    });

    setFormData({ ...formData, name: '', targetAmount: '', currentAmount: '' });
    setShowAdd(false);
  };

  const handleDeleteGoal = (id: string) => {
    deleteSavingsGoal(id);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Savings Goals</h2>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4" />
          New Goal
        </Button>
      </div>

      {showAdd && (
        <Card title="Start a New Goal" className="border-emerald-500 border-2 max-w-2xl">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase mb-1 opacity-60">Goal Name</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2"
                placeholder="e.g. New Car, Vacation"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1 opacity-60">Target Amount</label>
              <input 
                type="number" 
                required
                value={formData.targetAmount}
                onChange={e => setFormData({...formData, targetAmount: e.target.value})}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1 opacity-60">Initial Saving</label>
              <input 
                type="number" 
                value={formData.currentAmount}
                onChange={e => setFormData({...formData, currentAmount: e.target.value})}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1 opacity-60">Target Date</label>
              <input 
                type="date" 
                value={formData.deadline}
                onChange={e => setFormData({...formData, deadline: e.target.value})}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2"
              />
            </div>
            <div>
               <label className="block text-xs font-bold uppercase mb-1 opacity-60">Color Theme</label>
               <input 
                type="color" 
                value={formData.color}
                onChange={e => setFormData({...formData, color: e.target.value})}
                className="w-full h-10 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-1"
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Create Goal</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.savingsGoals.length === 0 ? (
          <div className="lg:col-span-3 py-12 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-3xl opacity-50">
             <Target className="w-12 h-12 mx-auto mb-4 text-stone-300" />
             <p>No active savings goals. Start planning for your future!</p>
          </div>
        ) : (
          data.savingsGoals.map(g => {
            const progress = (g.currentAmount / g.targetAmount) * 100;
            const remaining = g.targetAmount - g.currentAmount;
            const monthsLeft = differenceInMonths(new Date(g.deadline), new Date());
            const monthlyPlan = monthsLeft > 0 ? remaining / monthsLeft : remaining;

            return (
              <Card key={g.id} className="group relative">
                <button 
                  onClick={() => handleDeleteGoal(g.id)}
                  className="absolute top-4 right-4 p-2 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: g.color }}>
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{g.name}</h3>
                    <p className="text-xs text-stone-500 uppercase font-semibold">Target: {formatCurrency(g.targetAmount)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-2xl font-black tabular-nums">{Math.min(100, Math.round(progress))}%</span>
                    <span className="text-xs font-bold text-stone-500 uppercase">
                      {formatCurrency(g.currentAmount)} Saved
                    </span>
                  </div>
                  
                  <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, progress)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full" 
                      style={{ backgroundColor: g.color }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-50 dark:border-stone-800">
                    <div>
                      <div className="flex items-center gap-1 text-stone-500 mb-1">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase">Time Left</span>
                      </div>
                      <p className="font-bold text-sm">{monthsLeft} Months</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-stone-500 mb-1">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase">Monthly Save</span>
                      </div>
                      <p className="font-bold text-sm line-clamp-1">{formatCurrency(monthlyPlan)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button variant="secondary" size="sm" className="w-full py-3 border-dashed border-2 hover:border-solid">
                    Add Contribution
                  </Button>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  );
}
