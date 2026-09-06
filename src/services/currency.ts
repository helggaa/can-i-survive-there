// src/services/currency.ts
// Multi-Currency Conversion & Real-Time Formatting Engine

export type TargetCurrency = 'LOCAL' | 'USD' | 'EUR' | 'IDR' | 'JPY' | 'GBP' | 'SGD' | 'AUD';

export interface CurrencyConfig {
  code: TargetCurrency;
  symbol: string;
  name: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'LOCAL', symbol: 'Native', name: 'Local Sovereign Currency', flag: '🌐' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
];

// Baseline USD reference rates (1 USD = X units of currency)
const USD_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  IDR: 16250,
  JPY: 153.2,
  SGD: 1.34,
  AUD: 1.52,
  CAD: 1.37,
  CHF: 0.90,
  CNY: 7.24,
  INR: 83.6,
  THB: 36.6,
  MYR: 4.71,
  PHP: 58.2,
  VND: 25450,
  BRL: 5.48,
  MXN: 18.25,
  AED: 3.6725,
  SAR: 3.75,
  KRW: 1385,
  NZD: 1.64,
  TRY: 33.2,
  ZAR: 18.4,
  SEK: 10.6,
  NOK: 10.8,
  DKK: 6.86,
  PLN: 3.96,
  CZK: 23.3,
  HUF: 365,
  RON: 4.58,
  CLP: 940,
  ARS: 960,
  COP: 4150,
  PEN: 3.75,
  EGP: 48.5,
  NGN: 1580,
  KES: 129,
};

/**
 * Converts any currency amount to a target currency code using baseline USD reference rates.
 */
export function convertCurrency(
  amount: number,
  fromCode: string,
  toCode: string
): number {
  if (isNaN(amount) || amount <= 0) return 0;
  const from = fromCode.toUpperCase().trim();
  const to = toCode.toUpperCase().trim();

  if (from === to || to === 'LOCAL') {
    return amount;
  }

  const fromRate = USD_RATES[from] || (from === 'IDR' ? 16250 : 1.0);
  const toRate = USD_RATES[to] || (to === 'IDR' ? 16250 : 1.0);

  // Convert amount -> USD -> target currency
  const amountInUSD = amount / fromRate;
  const converted = amountInUSD * toRate;

  // Sensible rounding for high vs low denomination currencies
  if (toRate >= 100) {
    return Math.round(converted);
  }
  return Math.round(converted * 100) / 100;
}

/**
 * Formats a currency value cleanly according to locale norms.
 */
export function formatCurrencyValue(amount: number, currencyCode: string): string {
  const code = currencyCode.toUpperCase().trim();
  if (code === 'IDR') {
    return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
  }
  if (code === 'USD') {
    return `$${Math.round(amount).toLocaleString('en-US')}`;
  }
  if (code === 'EUR') {
    return `€${Math.round(amount).toLocaleString('de-DE')}`;
  }
  if (code === 'GBP') {
    return `£${Math.round(amount).toLocaleString('en-GB')}`;
  }
  if (code === 'JPY') {
    return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
  }
  if (code === 'SGD') {
    return `S$${Math.round(amount).toLocaleString('en-SG')}`;
  }
  if (code === 'AUD') {
    return `A$${Math.round(amount).toLocaleString('en-AU')}`;
  }
  return `${Math.round(amount).toLocaleString()} ${code}`;
}
