interface StockPriceInfo {
  price: number;
  change: number;
  changePct: number;
}

export async function fetchStockPrices(symbols: string[]): Promise<Record<string, StockPriceInfo>> {
  if (symbols.length === 0) return {};

  const results: Record<string, StockPriceInfo> = {};

  const fetchSymbol = async (symbol: string) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
      const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      
      const response = await fetch(proxiedUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const result = data.chart?.result?.[0];
      
      if (result && result.meta) {
        const meta = result.meta;
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose || meta.previousClose;
        const change = currentPrice - previousClose;
        const changePct = (change / previousClose) * 100;
        
        results[symbol] = {
          price: currentPrice,
          change: change,
          changePct: changePct
        };
      }
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
    }
  };

  // Fetch all in parallel
  await Promise.all(symbols.map(fetchSymbol));
  
  return results;
}
