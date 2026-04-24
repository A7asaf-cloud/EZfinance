/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'income' | 'expense';
export type AssetType = 'cash' | 'stock' | 'savings' | 'pension';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  account: string;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgBuyPrice: number;
  currentPrice: number;
  buyDate: string;
  todayChange?: number;
  todayChangePct?: number;
}

export type StockTransactionType = 'buy' | 'sell';

export interface StockTransaction {
  id: string;
  symbol: string;
  shares: number;
  price: number;
  date: string;
  type: StockTransactionType;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
}

export interface PensionFund {
  balance: number;
  monthlyContribution: number;
  retirementDate: string;
  expectedAnnualReturn: number;
}

export interface Reminder {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  isPaid: boolean;
}

export interface Recurring {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  dayOfMonth: number;
  lastApplied: string;
}

export interface FinanceData {
  transactions: Transaction[];
  stocks: Stock[];
  stockTransactions: StockTransaction[];
  savingsGoals: SavingsGoal[];
  pension: PensionFund;
  reminders: Reminder[];
  recurring: Recurring[];
  balance: number;
}

export const CATEGORIES = {
  income: ['Salary', 'Bonus', 'Investment', 'Other'],
  expense: ['Housing', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Credit Card', 'Other']
};

export const COLORS = {
  income: '#10b981', // emerald-500
  expense: '#ef4444', // red-500
  investment: '#3b82f6', // blue-500
  pension: '#8b5cf6', // violet-500
};
