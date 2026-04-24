import { useEffect, useState, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  serverTimestamp, 
  getDoc,
  runTransaction
} from 'firebase/firestore';
import { db, auth, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { fetchStockPrices } from '../services/stocksService';
import { 
  FinanceData, 
  Transaction, 
  Stock, 
  SavingsGoal, 
  PensionFund, 
  Reminder, 
  StockTransaction,
  Recurring
} from '../types';

const INITIAL_PENSION: PensionFund = {
  balance: 0,
  monthlyContribution: 0,
  retirementDate: new Date(new Date().getFullYear() + 25, 0, 1).toISOString(),
  expectedAnnualReturn: 7,
};

export function useFinanceData() {
  const { user } = useAuth();
  const [data, setData] = useState<FinanceData>({
    transactions: [],
    stocks: [],
    stockTransactions: [],
    savingsGoals: [],
    pension: INITIAL_PENSION,
    reminders: [],
    recurring: [],
    balance: 0,
  });
  const [loading, setLoading] = useState(true);

  // Sync with Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userId = user.id;
    const unsubQueries: (() => void)[] = [];

    // 1. User Profile (Balance & Pension)
    const userRef = doc(db, 'users', userId);
    onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data();
        setData(prev => ({
          ...prev,
          balance: userData.balance || 0,
          pension: userData.pension || INITIAL_PENSION
        }));
      } else {
        // Initialize user profile
        setDoc(userRef, {
          balance: 0,
          pension: INITIAL_PENSION,
          updatedAt: new Date().toISOString()
        });
      }
    });

    // 2. Collections
    const collections = [
      { name: 'transactions', key: 'transactions' },
      { name: 'stocks', key: 'stocks' },
      { name: 'stockTransactions', key: 'stockTransactions' },
      { name: 'savingsGoals', key: 'savingsGoals' },
      { name: 'reminders', key: 'reminders' },
      { name: 'recurring', key: 'recurring' },
    ];

    collections.forEach(({ name, key }) => {
      const q = query(collection(db, name), where('userId', '==', userId));
      unsubQueries.push(onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setData(prev => ({ ...prev, [key]: items }));
      }));
    });

    setLoading(false);
    return () => unsubQueries.forEach(unsub => unsub());
  }, [user]);

  // Mutations
  const addTransaction = useCallback(async (t: Omit<Transaction, 'id'>) => {
    if (!user) return;
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.id);
        const userSnap = await transaction.get(userRef);
        
        const currentBalance = userSnap.exists() ? userSnap.data().balance || 0 : 0;
        const newBalance = t.type === 'income' ? currentBalance + t.amount : currentBalance - t.amount;
        
        const transRef = doc(collection(db, 'transactions'));
        transaction.set(transRef, { ...t, userId: user.id });
        if (userSnap.exists()) {
          transaction.update(userRef, { balance: newBalance, updatedAt: new Date().toISOString() });
        } else {
          transaction.set(userRef, { balance: newBalance, pension: INITIAL_PENSION, updatedAt: new Date().toISOString() });
        }
      });
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await runTransaction(db, async (transaction) => {
        const transRef = doc(db, 'transactions', id);
        const transSnap = await transaction.get(transRef);
        if (!transSnap.exists()) return;
        
        const t = transSnap.data();
        const userRef = doc(db, 'users', user.id);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) return;

        const currentBalance = userSnap.data().balance || 0;
        const newBalance = t.type === 'income' ? currentBalance - t.amount : currentBalance + t.amount;

        transaction.delete(transRef);
        transaction.update(userRef, { balance: newBalance, updatedAt: new Date().toISOString() });
      });
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const addStock = useCallback(async (s: Omit<Stock, 'id' | 'currentPrice'>) => {
    if (!user) return;
    try {
      await runTransaction(db, async (transaction) => {
        const userId = user.id;
        const userRef = doc(db, 'users', userId);
        const userSnap = await transaction.get(userRef);
        const balance = userSnap.data()?.balance || 0;
        
        const cost = s.shares * s.avgBuyPrice;
        const stockId = `${userId}_${s.symbol.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const stockRef = doc(db, 'stocks', stockId);
        const stockSnap = await transaction.get(stockRef);

        if (stockSnap.exists()) {
          const existing = stockSnap.data();
          const newTotalShares = existing.shares + s.shares;
          const newAvgPrice = ((existing.shares * existing.avgBuyPrice) + (s.shares * s.avgBuyPrice)) / newTotalShares;
          transaction.update(stockRef, {
            shares: newTotalShares,
            avgBuyPrice: newAvgPrice,
            currentPrice: s.avgBuyPrice 
          });
        } else {
          transaction.set(stockRef, {
            ...s,
            userId,
            currentPrice: s.avgBuyPrice
          });
        }

        const historyRef = doc(collection(db, 'stockTransactions'));
        transaction.set(historyRef, {
          userId,
          symbol: s.symbol,
          shares: s.shares,
          price: s.avgBuyPrice,
          date: new Date().toISOString(),
          type: 'buy'
        });

        transaction.update(userRef, { balance: balance - cost, updatedAt: new Date().toISOString() });
      });
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const sellStock = useCallback(async (symbol: string, shares: number, price: number) => {
    if (!user) return;
    try {
      await runTransaction(db, async (transaction) => {
        const userId = user.id;
        const stockId = `${userId}_${symbol.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const stockRef = doc(db, 'stocks', stockId);
        const stockSnap = await transaction.get(stockRef);
        
        if (!stockSnap.exists()) return;
        const stock = stockSnap.data();

        const userRef = doc(db, 'users', userId);
        const userSnap = await transaction.get(userRef);
        const balance = userSnap.data()?.balance || 0;

        if (stock.shares <= shares) {
          transaction.delete(stockRef);
        } else {
          transaction.update(stockRef, { shares: stock.shares - shares });
        }

        const historyRef = doc(collection(db, 'stockTransactions'));
        transaction.set(historyRef, {
          userId,
          symbol,
          shares,
          price,
          date: new Date().toISOString(),
          type: 'sell'
        });

        transaction.update(userRef, { balance: balance + (shares * price), updatedAt: new Date().toISOString() });
      });
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const updatePension = useCallback(async (p: Partial<PensionFund>) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.id);
      const snap = await getDoc(userRef);
      const currentPension = snap.data()?.pension || INITIAL_PENSION;
      await updateDoc(userRef, {
        pension: { ...currentPension, ...p },
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const addSavingsGoal = useCallback(async (g: Omit<SavingsGoal, 'id'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'savingsGoals'), { ...g, userId: user.id });
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const addRecurring = useCallback(async (r: Omit<Recurring, 'id'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'recurring'), { ...r, userId: user.id });
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const deleteRecurring = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'recurring', id));
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const deleteSavingsGoal = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'savingsGoals', id));
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  // Auto Salary & Recurring check
  useEffect(() => {
    if (!user || data.recurring.length === 0) return;

    const checkRecurring = async () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      for (const rec of data.recurring) {
        const lastApplied = new Date(rec.lastApplied);
        const shouldApply = 
          today.getDate() >= rec.dayOfMonth && 
          (lastApplied.getMonth() !== currentMonth || lastApplied.getFullYear() !== currentYear);

        if (shouldApply) {
          // Apply recurring transaction
          await addTransaction({
            amount: rec.amount,
            type: rec.type,
            category: rec.category,
            description: rec.description,
            date: today.toISOString(),
            account: 'Auto-Applied'
          });

          // Update last applied
          await updateDoc(doc(db, 'recurring', rec.id), {
            lastApplied: today.toISOString()
          });
        }
      }
    };

    checkRecurring();
  }, [user, data.recurring, addTransaction]);

  const refreshStockPrices = useCallback(async () => {
    if (!user || data.stocks.length === 0) return;
    const symbols = data.stocks.map(s => s.symbol);
    const prices = await fetchStockPrices(symbols);
    
    if (Object.keys(prices).length === 0) return;

    try {
      await runTransaction(db, async (transaction) => {
         for (const s of data.stocks) {
           if (prices[s.symbol]) {
             const stockRef = doc(db, 'stocks', s.id);
             transaction.update(stockRef, { currentPrice: prices[s.symbol] });
           }
         }
      });
    } catch (e) {
      console.error("Failed to update stock prices", e);
    }
  }, [user, data.stocks]);

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
    setData: (d: any) => console.log('Use specific mutations for Firebase')
  };
}
