import { useEffect, useState, useCallback } from 'react';
import { fetchStockPrices } from '../services/stocksService';
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

const STORAGE_KEY = 'ez_finance_data';

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

export function useFinanceData() {
  const [data, setData] = useState<FinanceData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse data", e);
      }
    }
    setLoading(false);
  }, []);

  // Persist to localStorage
  const persistData = useCallback((newData: FinanceData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newTransaction = { ...t, id };
    const newBalance = t.type === 'income' ? data.balance + t.amount : data.balance - t.amount;
    
    persistData({
      ...data,
      balance: newBalance,
      transactions: [newTransaction, ...data.transactions]
    });
  }, [data, persistData]);

  const deleteTransaction = useCallback((id: string) => {
    const t = data.transactions.find(trans => trans.id === id);
    if (!t) return;
    
    const newBalance = t.type === 'income' ? data.balance - t.amount : data.balance + t.amount;
    persistData({
      ...data,
      balance: newBalance,
      transactions: data.transactions.filter(trans => trans.id !== id)
    });
  }, [data, persistData]);

  const addStock = useCallback((s: Omit<Stock, 'id' | 'currentPrice'>) => {
    const cost = s.shares * s.avgBuyPrice;
    const existingIndex = data.stocks.findIndex(item => item.symbol === s.symbol);
    
    let newStocks = [...data.stocks];
    if (existingIndex >= 0) {
      const existing = newStocks[existingIndex];
      const newTotalShares = existing.shares + s.shares;
      const newAvgPrice = ((existing.shares * existing.avgBuyPrice) + (s.shares * s.avgBuyPrice)) / newTotalShares;
      newStocks[existingIndex] = {
        ...existing,
        shares: newTotalShares,
        avgBuyPrice: newAvgPrice,
        currentPrice: s.avgBuyPrice,
        buyDate: s.buyDate || new Date().toISOString()
      };
    } else {
      const newStock = { 
        ...s, 
        id: Math.random().toString(36).substr(2, 9),
        currentPrice: s.avgBuyPrice 
      };
      newStocks.push(newStock);
    }

    const historyEntry: StockTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: s.symbol,
      shares: s.shares,
      price: s.avgBuyPrice,
      date: s.buyDate || new Date().toISOString(),
      type: 'buy'
    };

    persistData({
      ...data,
      balance: data.balance - cost,
      stocks: newStocks,
      stockTransactions: [historyEntry, ...data.stockTransactions]
    });
  }, [data, persistData]);

  const sellStock = useCallback((symbol: string, shares: number, price: number) => {
    const stockIndex = data.stocks.findIndex(s => s.symbol === symbol);
    if (stockIndex < 0) return;
    
    const stock = data.stocks[stockIndex];
    let newStocks = [...data.stocks];
    
    if (stock.shares <= shares) {
      newStocks.splice(stockIndex, 1);
    } else {
      newStocks[stockIndex] = { ...stock, shares: stock.shares - shares };
    }

    const historyEntry: StockTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      shares,
      price,
      date: new Date().toISOString(),
      type: 'sell'
    };

    persistData({
      ...data,
      balance: data.balance + (shares * price),
      stocks: newStocks,
      stockTransactions: [historyEntry, ...data.stockTransactions]
    });
  }, [data, persistData]);

  const updatePension = useCallback((p: Partial<PensionFund>) => {
    persistData({
      ...data,
      pension: { ...data.pension, ...p }
    });
  }, [data, persistData]);

  const addSavingsGoal = useCallback((g: Omit<SavingsGoal, 'id'>) => {
    persistData({
      ...data,
      savingsGoals: [...data.savingsGoals, { ...g, id: Math.random().toString(36).substr(2, 9) }]
    });
  }, [data, persistData]);

  const addRecurring = useCallback((r: Omit<Recurring, 'id'>) => {
    persistData({
      ...data,
      recurring: [...data.recurring, { ...r, id: Math.random().toString(36).substr(2, 9) }]
    });
  }, [data, persistData]);

  const deleteRecurring = useCallback((id: string) => {
    persistData({
      ...data,
      recurring: data.recurring.filter(r => r.id !== id)
    });
  }, [data, persistData]);

  const deleteSavingsGoal = useCallback((id: string) => {
    persistData({
      ...data,
      savingsGoals: data.savingsGoals.filter(g => g.id !== id)
    });
  }, [data, persistData]);

  const refreshStockPrices = useCallback(async () => {
    if (data.stocks.length === 0) return;
    const symbols = data.stocks.map(s => s.symbol);
    const results = await fetchStockPrices(symbols);
    
    if (Object.keys(results).length === 0) return;

    const newStocks = data.stocks.map(s => {
      if (results[s.symbol]) {
        return { 
          ...s, 
          currentPrice: results[s.symbol].price,
          todayChange: results[s.symbol].change,
          todayChangePct: results[s.symbol].changePct
        };
      }
      return s;
    });

    persistData({ ...data, stocks: newStocks });
  }, [data, persistData]);

  const clearAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setData(INITIAL_DATA);
  }, []);

  return {
    data,
    loading,
    addTransaction,
    addStock,
    sellStock,
    updatePension,
    addSavingsGoal,
    deleteTransaction,
    addRecurring,
    deleteRecurring,
    deleteSavingsGoal,
    refreshStockPrices,
    clearAllData,
    setData: persistData
  };
}
