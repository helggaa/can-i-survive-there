// src/context/CurrencyContext.tsx
// Global Currency Switcher Context with LocalStorage Persistence

import React, { createContext, useContext, useState } from 'react';
import {
  type TargetCurrency,
  SUPPORTED_CURRENCIES,
  type CurrencyConfig,
  convertCurrency,
  formatCurrencyValue,
} from '../services/currency';

interface FormattedPrice {
  primary: string;
  secondary?: string;
  isConverted: boolean;
}

interface CurrencyContextType {
  targetCurrency: TargetCurrency;
  setTargetCurrency: (curr: TargetCurrency) => void;
  availableCurrencies: CurrencyConfig[];
  formatPrice: (amount: number, nativeCurrency: string) => FormattedPrice;
  convertValue: (amount: number, nativeCurrency: string) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [targetCurrency, setTargetCurrencyState] = useState<TargetCurrency>(() => {
    try {
      const saved = localStorage.getItem('cist_target_currency') as TargetCurrency | null;
      if (saved && SUPPORTED_CURRENCIES.some((c) => c.code === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'LOCAL';
  });

  const setTargetCurrency = (curr: TargetCurrency) => {
    setTargetCurrencyState(curr);
    try {
      localStorage.setItem('cist_target_currency', curr);
    } catch {
      // ignore
    }
  };

  const convertValue = (amount: number, nativeCurrency: string): number => {
    if (targetCurrency === 'LOCAL' || targetCurrency === nativeCurrency) {
      return amount;
    }
    return convertCurrency(amount, nativeCurrency, targetCurrency);
  };

  const formatPrice = (amount: number, nativeCurrency: string): FormattedPrice => {
    if (isNaN(amount) || amount <= 0) {
      return { primary: '0', isConverted: false };
    }

    if (targetCurrency === 'LOCAL' || targetCurrency.toUpperCase() === nativeCurrency.toUpperCase()) {
      return {
        primary: formatCurrencyValue(amount, nativeCurrency),
        isConverted: false,
      };
    }

    const converted = convertCurrency(amount, nativeCurrency, targetCurrency);
    return {
      primary: formatCurrencyValue(converted, targetCurrency),
      secondary: `(~${formatCurrencyValue(amount, nativeCurrency)})`,
      isConverted: true,
    };
  };

  return (
    <CurrencyContext.Provider
      value={{
        targetCurrency,
        setTargetCurrency,
        availableCurrencies: SUPPORTED_CURRENCIES,
        formatPrice,
        convertValue,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
