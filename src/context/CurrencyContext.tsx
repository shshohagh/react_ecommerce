import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rate: number; // exchange rate relative to 1 USD
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rate: 1.0, decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rate: 0.92, decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rate: 0.79, decimals: 2 },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', flag: '🇧🇩', rate: 121.5, decimals: 0 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', rate: 1.36, decimals: 2 },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', flag: '🇦🇺', rate: 1.52, decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', rate: 154.0, decimals: 0 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', rate: 86.5, decimals: 2 },
];

interface CurrencyContextType {
  currency: string;
  setCurrency: (code: string) => void;
  currentCurrency: Currency;
  currencies: Currency[];
  rates: Record<string, number>;
  convertPrice: (priceInUSD: number) => number;
  formatPrice: (priceInUSD: number, customCurrencyCode?: string) => string;
  isLoadingRates: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencyCode, setCurrencyCode] = useState<string>(() => {
    const saved = localStorage.getItem('selected_currency');
    if (saved && SUPPORTED_CURRENCIES.some(c => c.code === saved)) {
      return saved;
    }
    return 'USD';
  });

  const [rates, setRates] = useState<Record<string, number>>(() => {
    try {
      const cached = localStorage.getItem('cached_exchange_rates');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.rates === 'object') {
          return parsed.rates;
        }
      }
    } catch (e) {
      // ignore
    }
    return SUPPORTED_CURRENCIES.reduce((acc, curr) => {
      acc[curr.code] = curr.rate;
      return acc;
    }, {} as Record<string, number>);
  });

  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Fetch dynamic exchange rates on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchLiveRates() {
      try {
        setIsLoadingRates(true);
        // Using reliable public exchange rate API
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        if (isMounted && data && data.rates) {
          const newRates: Record<string, number> = {};
          SUPPORTED_CURRENCIES.forEach(c => {
            newRates[c.code] = data.rates[c.code] || c.rate;
          });
          setRates(newRates);
          localStorage.setItem('cached_exchange_rates', JSON.stringify({
            timestamp: Date.now(),
            rates: newRates
          }));
        }
      } catch (err) {
        console.warn('Could not fetch live exchange rates, falling back to default rates:', err);
      } finally {
        if (isMounted) setIsLoadingRates(false);
      }
    }

    fetchLiveRates();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSetCurrency = (code: string) => {
    if (SUPPORTED_CURRENCIES.some(c => c.code === code)) {
      setCurrencyCode(code);
      localStorage.setItem('selected_currency', code);
    }
  };

  const currentCurrency = useMemo(() => {
    return SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
  }, [currencyCode]);

  const convertPrice = (priceInUSD: number): number => {
    if (typeof priceInUSD !== 'number' || isNaN(priceInUSD)) return 0;
    const rate = rates[currencyCode] || currentCurrency.rate;
    return priceInUSD * rate;
  };

  const formatPrice = (priceInUSD: number, customCurrencyCode?: string): string => {
    const targetCode = customCurrencyCode || currencyCode;
    const curr = SUPPORTED_CURRENCIES.find(c => c.code === targetCode) || currentCurrency;
    const rate = rates[targetCode] || curr.rate;
    const converted = (typeof priceInUSD === 'number' && !isNaN(priceInUSD) ? priceInUSD : 0) * rate;

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: curr.code,
        minimumFractionDigits: curr.decimals,
        maximumFractionDigits: curr.decimals,
      }).format(converted);
    } catch (e) {
      return `${curr.symbol}${converted.toFixed(curr.decimals)}`;
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency: currencyCode,
        setCurrency: handleSetCurrency,
        currentCurrency,
        currencies: SUPPORTED_CURRENCIES,
        rates,
        convertPrice,
        formatPrice,
        isLoadingRates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Fallback safe defaults if used outside provider
    return {
      currency: 'USD',
      setCurrency: () => {},
      currentCurrency: SUPPORTED_CURRENCIES[0],
      currencies: SUPPORTED_CURRENCIES,
      rates: { USD: 1 },
      convertPrice: (p: number) => p,
      formatPrice: (p: number) => `$${p.toFixed(2)}`,
      isLoadingRates: false,
    };
  }
  return context;
}
