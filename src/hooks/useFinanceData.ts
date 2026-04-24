import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  FinanceData,
  Transaction,
  Stock,
  SavingsGoal,
  PensionFund,
  StockTransaction,
  Recurring
} from '../types';

const INITIAL_PENSION: PensionFund = {
  balance: 0,
  monthlyContribution: 0,
  retirementDate: new Date(new Date().getFullYear() + 25, 0, 1).toISOString(),
  expectedAnnualReturn: 7,
};

const INITIAL_DATA: FinanceData = {
  transactions: [],
  stocks: [],
  stockTransactions: [],
  savingsGoals: [],
  pension: INITIAL_PENSION,
  reminders: [],
  recurring: [],
  balance: 0,
};

function getKey(userId: string) { return 'ezfinance_data_' + userId; }

function loadData(userId: string): FinanceData {
  try {
    const raw = localStorage.getItem(getKey(userId));
    return raw ? { ...INITIAL_DATA, ...JSON.parse(raw) } : { ...INITIAL_DATA };
  } catch { return { ...INITIAL_DATA }; }
}

function saveData(userId: string, data: FinanceData) {
  localStorage.setItem(getKey(userId), JSON.stringify(data));
}

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function useFinanceData() {
  const { user } = useAuth();
  const [data, setDataState] = useState<FinanceData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setDataState(loadData(user.id));
    setLoading(false);
  }, [user]);

  const update = useCallback((updater: (prev: FinanceData) => FinanceData) => {
    if (!user) return;
    setDataState(prev => {
      const next = updater(prev);
      saveData(user.id, next);
      return next;
    });
  }, [user]);

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id'>) => {
    update(prev => ({
      ...prev,
      balance: t.type === 'income' ? prev.balance + t.amount : prev.balance - t.amount,
      transactions: [{ ...t, id: uid() }, ...prev.transactions],
    }));
  }, [update]);

  const deleteTransaction = useCallback(async (id: string) => {
    update(prev => {
      const t = prev.transactions.find(x => x.id === id);
      if (!t) return prev;
      return {
        ...prev,
        balance: t.type === 'income' ? prev.balance - t.amount : prev.balance + t.amount,
        transactions: prev.transactions.filter(x => x.id !== id),
      };
    });
  }, [update]);

  const addStock = useCallback(async (s: Omit<Stock, 'id' | 'currentPrice'>) => {
    update(prev => {
      const cost = s.shares * s.avgBuyPrice;
      const existing = prev.stocks.find(x => x.symbol === s.symbol);
      let newStocks: Stock[];
      if (existing) {
        const totalShares = existing.shares + s.shares;
        const newAvg = ((existing.shares * existing.avgBuyPrice) + (s.shares * s.avgBuyPrice)) / totalShares;
        newStocks = prev.stocks.map(x => x.symbol === s.symbol
          ? { ...x, shares: totalShares, avgBuyPrice: newAvg, currentPrice: s.avgBuyPrice } : x);
      } else {
        newStocks = [...prev.stocks, { ...s, id: uid(), currentPrice: s.avgBuyPrice }];
      }
      return {
        ...prev,
        balance: prev.balance - cost,
        stocks: newStocks,
        stockTransactions: [{ id: uid(), symbol: s.symbol, shares: s.shares, price: s.avgBuyPrice, date: new Date().toISOString(), type: 'buy' as const }, ...prev.stockTransactions],
      };
    });
  }, [update]);

  const sellStock = useCallback(async (symbol: string, shares: number, price: number) => {
    update(prev => {
      const stock = prev.stocks.find(x => x.symbol === symbol);
      if (!stock || stock.shares < shares) return prev;
      return {
        ...prev,
        balance: prev.balance + shares * price,
        stocks: stock.shares === shares
          ? prev.stocks.filter(x => x.symbol !== symbol)
          : prev.stocks.map(x => x.symbol === symbol ? { ...x, shares: x.shares - shares } : x),
        stockTransactions: [{ id: uid(), symbol, shares, price, date: new Date().toISOString(), type: 'sell' as const }, ...prev.stockTransactions],
      };
    });
  }, [update]);

  const updatePension = useCallback(async (p: Partial<PensionFund>) => {
    update(prev => ({ ...prev, pension: { ...prev.pension, ...p } }));
  }, [update]);

  const addSavingsGoal = useCallback(async (g: Omit<SavingsGoal, 'id'>) => {
    update(prev => ({ ...prev, savingsGoals: [...prev.savingsGoals, { ...g, id: uid() }] }));
  }, [update]);

  const deleteSavingsGoal = useCallback(async (id: string) => {
    update(prev => ({ ...prev, savingsGoals: prev.savingsGoals.filter(x => x.id !== id) }));
  }, [update]);

  const addRecurring = useCallback(async (r: Omit<Recurring, 'id'>) => {
    update(prev => ({ ...prev, recurring: [...prev.recurring, { ...r, id: uid() }] }));
  }, [update]);

  const deleteRecurring = useCallback(async (id: string) => {
    update(prev => ({ ...prev, recurring: prev.recurring.filter(x => x.id !== id) }));
  }, [update]);

  return { data, loading, addTransaction, deleteTransaction, addStock, sellStock, updatePension, addSavingsGoal, deleteSavingsGoal, addRecurring, deleteRecurring, setData: update };
}
