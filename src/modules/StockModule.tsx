import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFinanceData } from '../hooks/useFinanceData';
import { Card, Button } from '../components/UI';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Plus, 
  TrendingUp, 
  RefreshCw, 
  DollarSign, 
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  X,
  Clock
} from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { Stock } from '../types';

type SortKey = 'symbol' | 'name' | 'shares' | 'avgBuyPrice' | 'currentPrice' | 'todayChange' | 'totalValue' | 'profitLoss';
type SortOrder = 'asc' | 'desc';

export default function StockModule() {
  const { data, addStock, refreshStockPrices, sellStock } = useFinanceData();
  const { language, t } = useUI();
  const [showAdd, setShowAdd] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [useCached, setUseCached] = useState(false);
  
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    shares: '',
    avgBuyPrice: '',
    buyDate: new Date().toISOString().split('T')[0],
  });

  const [sortConfig, setSortConfig] = useState<{ key: SortKey, order: SortOrder }>({ 
    key: 'totalValue', 
    order: 'desc' 
  });

  const fetchPrices = useCallback(async () => {
    if (data.stocks.length === 0) return;
    setIsRefreshing(true);
    setUseCached(false);
    try {
      await refreshStockPrices();
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch prices:", error);
      setUseCached(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [data.stocks.length, refreshStockPrices]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Live refresh every 60s
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.symbol || !formData.shares || !formData.avgBuyPrice) return;
    
    addStock({
      symbol: formData.symbol.toUpperCase(),
      name: formData.name || formData.symbol.toUpperCase(),
      shares: parseFloat(formData.shares),
      avgBuyPrice: parseFloat(formData.avgBuyPrice),
      // Set initial current price to buy price until next refresh
      currentPrice: parseFloat(formData.avgBuyPrice),
      buyDate: new Date(formData.buyDate).toISOString()
    });
    
    setFormData({ 
      symbol: '', 
      name: '', 
      shares: '', 
      avgBuyPrice: '', 
      buyDate: new Date().toISOString().split('T')[0] 
    });
    setShowAdd(false);
    // Trigger immediate refresh for the new symbol
    fetchPrices();
  };

  const stocksWithCalcs = useMemo(() => {
    return data.stocks.map(s => {
      const currentPrice = s.currentPrice || s.avgBuyPrice;
      const totalValue = s.shares * currentPrice;
      const costBasis = s.shares * s.avgBuyPrice;
      const profitLoss = totalValue - costBasis;
      const profitLossPct = costBasis !== 0 ? (profitLoss / costBasis) * 100 : 0;
      
      return {
        ...s,
        currentPrice,
        totalValue,
        costBasis,
        profitLoss,
        profitLossPct
      };
    });
  }, [data.stocks]);

  const sortedStocks = useMemo(() => {
    const items = [...stocksWithCalcs];
    return items.sort((a, b) => {
      let valA: any = a[sortConfig.key];
      let valB: any = b[sortConfig.key];
      
      // Handle cases where fields might be undefined (like todayChange)
      if (valA === undefined) valA = -Infinity;
      if (valB === undefined) valB = -Infinity;

      if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [stocksWithCalcs, sortConfig]);

  const portfolioTotals = useMemo(() => {
    return stocksWithCalcs.reduce((acc, s) => ({
      totalValue: acc.totalValue + s.totalValue,
      totalCostBasis: acc.totalCostBasis + s.costBasis,
      totalProfitLoss: acc.totalProfitLoss + s.profitLoss
    }), { totalValue: 0, totalCostBasis: 0, totalProfitLoss: 0 });
  }, [stocksWithCalcs]);

  const totalPLPct = portfolioTotals.totalCostBasis !== 0 
    ? (portfolioTotals.totalProfitLoss / portfolioTotals.totalCostBasis) * 100 
    : 0;

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIcon = ({ ik }: { ik: SortKey }) => {
    if (sortConfig.key !== ik) return <div className="w-3 h-3 opacity-20"><ChevronUp className="w-full h-full" /></div>;
    return sortConfig.order === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-black p-6 rounded-3xl border border-slate-100 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{t('totalMarketValue')}</p>
            <div className="text-3xl font-black tabular-nums dark:text-white">
              ${portfolioTotals.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="h-10 w-[1px] bg-slate-100 dark:bg-stone-800" />
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{t('totalPL')}</p>
            <div className={cn(
              "text-xl font-black tabular-nums",
              portfolioTotals.totalProfitLoss >= 0 ? "text-emerald-500" : "text-red-500"
            )}>
              {portfolioTotals.totalProfitLoss >= 0 ? '+' : ''}
              ${Math.abs(portfolioTotals.totalProfitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs ml-2 opacity-80">
                ({totalPLPct >= 0 ? '+' : ''}{totalPLPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
             <div className="flex items-center justify-end gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                  Updating...
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" />
                  {t('lastUpdated')}: {lastUpdated ? lastUpdated.toLocaleTimeString() : '---'}
                </>
              )}
            </div>
            {useCached && (
              <div className="flex items-center justify-end gap-1 text-[9px] text-amber-500 font-bold uppercase mt-1">
                <AlertTriangle className="w-2 h-2" />
                Using Cached Prices
              </div>
            )}
          </div>
          <Button 
            onClick={() => setShowAdd(!showAdd)} 
            className="rounded-2xl gap-2 text-xs font-black uppercase tracking-widest px-6 py-3"
          >
            <Plus className="w-4 h-4" />
            {t('buyAsset')}
          </Button>
        </div>
      </div>

      {/* Add Stock Form overlay */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg relative dark:bg-black dark:border-stone-800">
            <button 
              onClick={() => setShowAdd(false)}
              className="absolute right-4 top-4 p-2 hover:bg-slate-100 dark:hover:bg-stone-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
            
            <h2 className="text-2xl font-black tracking-tight mb-6 dark:text-white">{t('addToPortfolio')}</h2>
            
            <form onSubmit={handleAddSubmit} className="space-y-6 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{t('symbol')}</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="AAPL"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-100 dark:border-stone-700 focus:border-blue-500 outline-none transition-all font-mono font-bold dark:text-white"
                    value={formData.symbol}
                    onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="col-span-1 text-left">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{t('company')}</label>
                  <input 
                    type="text" 
                    placeholder="Apple Inc."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-100 dark:border-stone-700 focus:border-blue-500 outline-none transition-all font-bold dark:text-white"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{t('shares')}</label>
                  <input 
                    type="number" 
                    required 
                    step="any"
                    placeholder="10"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-100 dark:border-stone-700 focus:border-blue-500 outline-none transition-all font-bold dark:text-white"
                    value={formData.shares}
                    onChange={e => setFormData({...formData, shares: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{t('buyPrice')} (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      type="number" 
                      required 
                      step="0.01"
                      placeholder="150.00"
                      className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-100 dark:border-stone-700 focus:border-blue-500 outline-none transition-all font-bold dark:text-white"
                      value={formData.avgBuyPrice}
                      onChange={e => setFormData({...formData, avgBuyPrice: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{t('buyDate')}</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-100 dark:border-stone-700 focus:border-blue-500 outline-none transition-all font-bold dark:text-white"
                  value={formData.buyDate}
                  onChange={e => setFormData({...formData, buyDate: e.target.value})}
                />
              </div>

              <Button type="submit" className="w-full py-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20">
                {t('confirmPurchase')}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Main Table Section */}
      <Card className="p-0 overflow-hidden dark:bg-black dark:border-stone-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-stone-800/50 border-b border-slate-100 dark:border-stone-800">
                <th onClick={() => handleSort('symbol')} className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('symbol')} <SortIcon ik="symbol" /></div>
                </th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('company')}</th>
                <th onClick={() => handleSort('shares')} className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors">
                   <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('shares')} <SortIcon ik="shares" /></div>
                </th>
                <th onClick={() => handleSort('avgBuyPrice')} className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors">
                   <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('avgBuy')} <SortIcon ik="avgBuyPrice" /></div>
                </th>
                <th onClick={() => handleSort('currentPrice')} className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors">
                   <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('currentPrice')} <SortIcon ik="currentPrice" /></div>
                </th>
                <th onClick={() => handleSort('todayChange')} className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors">
                   <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('changeToday')} <SortIcon ik="todayChange" /></div>
                </th>
                <th onClick={() => handleSort('totalValue')} className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors">
                   <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('totalValue')} <SortIcon ik="totalValue" /></div>
                </th>
                <th onClick={() => handleSort('profitLoss')} className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors">
                   <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('profitAndLoss')} <SortIcon ik="profitLoss" /></div>
                </th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-stone-800/50">
              {sortedStocks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 italic">No assets in portfolio.</td>
                </tr>
              ) : (
                sortedStocks.map(s => {
                  const pnlPos = s.profitLoss >= 0;
                  const todayPos = (s.todayChange || 0) >= 0;
                  
                  return (
                    <tr 
                      key={s.id} 
                      className={cn(
                        "group hover:bg-slate-50 dark:hover:bg-stone-800 transition-all",
                        pnlPos ? "bg-emerald-500/[0.02]" : "bg-red-500/[0.02]"
                      )}
                    >
                      <td className="p-4">
                        <span className="font-black text-sm tracking-tight dark:text-white">{s.symbol}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-bold text-slate-500 truncate max-w-[120px] block">{s.name}</span>
                      </td>
                      <td className="p-4 tabular-nums font-bold text-sm dark:text-slate-200">
                        {s.shares.toLocaleString()}
                      </td>
                      <td className="p-4 tabular-nums text-sm text-slate-500">
                        ${s.avgBuyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 tabular-nums font-black text-sm dark:text-white">
                        ${s.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 tabular-nums text-xs">
                        <div className={cn(
                          "font-bold flex items-center gap-1",
                          todayPos ? "text-emerald-500" : "text-red-500"
                        )}>
                          {todayPos ? '+' : ''}{Math.abs(s.todayChange || 0).toFixed(2)}
                          <span className="opacity-70 text-[10px]">({todayPos ? '+' : ''}{Math.abs(s.todayChangePct || 0).toFixed(2)}%)</span>
                        </div>
                      </td>
                      <td className="p-4 tabular-nums font-black text-sm dark:text-white">
                        ${s.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 tabular-nums">
                        <div className={cn(
                          "font-black text-sm flex flex-col",
                          pnlPos ? "text-emerald-500" : "text-red-500"
                        )}>
                          <span>{pnlPos ? '+' : ''}${Math.abs(s.profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className="text-[10px] opacity-70 underline decoration-dotted underline-offset-2">
                             {pnlPos ? '+' : ''}{s.profitLossPct.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => {
                            if (window.confirm(`Sell ${s.symbol}? This will remove it from your portfolio.`)) {
                              sellStock(s.id);
                            }
                          }}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {sortedStocks.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white font-black">
                  <td colSpan={6} className="p-5 text-right uppercase tracking-widest text-[10px]">Portfolio Totals</td>
                  <td className="p-5 tabular-nums text-base">
                    ${portfolioTotals.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={cn(
                    "p-5 tabular-nums text-base",
                    portfolioTotals.totalProfitLoss >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {portfolioTotals.totalProfitLoss >= 0 ? '+' : ''}
                    ${Math.abs(portfolioTotals.totalProfitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
      
      <div className="flex items-center gap-4 text-slate-400">
        <TrendingUp className="w-5 h-5 opacity-50" />
        <p className="text-xs font-medium italic">
          {t('marketDataDelay')}
        </p>
      </div>
    </div>
  );
}

