import { Currency } from '../types';

export const DEFAULT_SAR_TO_INR_RATE = 25.7; // 1 SAR = 25.7 INR as per live backup

export interface CurrencyConfig {
  code: Currency;
  name: string;
  symbol: string;
  creativeSymbol: string;
  region: 'GCC' | 'Asia' | 'Global';
  locale: string;
  /** Relative conversion rate from 1 SAR to this currency (approximate default) */
  sarRate: number;
}

export const CURRENCY_LIST: CurrencyConfig[] = [
  // GCC Currencies
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'SAR',
    creativeSymbol: '﷼',
    region: 'GCC',
    locale: 'en-US',
    sarRate: 1.0,
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'AED',
    creativeSymbol: 'د.إ',
    region: 'GCC',
    locale: 'en-AE',
    sarRate: 0.98,
  },
  {
    code: 'QAR',
    name: 'Qatari Riyal',
    symbol: 'QAR',
    creativeSymbol: 'ر.ق',
    region: 'GCC',
    locale: 'en-QA',
    sarRate: 0.97,
  },
  {
    code: 'KWD',
    name: 'Kuwaiti Dinar',
    symbol: 'KWD',
    creativeSymbol: 'د.ك',
    region: 'GCC',
    locale: 'en-KW',
    sarRate: 0.082,
  },
  {
    code: 'BHD',
    name: 'Bahraini Dinar',
    symbol: 'BHD',
    creativeSymbol: '.د.ب',
    region: 'GCC',
    locale: 'en-BH',
    sarRate: 0.1,
  },
  {
    code: 'OMR',
    name: 'Omani Rial',
    symbol: 'OMR',
    creativeSymbol: 'ر.ع.',
    region: 'GCC',
    locale: 'en-OM',
    sarRate: 0.103,
  },
  // Asian Currencies
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    creativeSymbol: '₹',
    region: 'Asia',
    locale: 'en-IN',
    sarRate: 25.7,
  },
  {
    code: 'PKR',
    name: 'Pakistani Rupee',
    symbol: 'PKR',
    creativeSymbol: '₨',
    region: 'Asia',
    locale: 'en-PK',
    sarRate: 74.2,
  },
  {
    code: 'BDT',
    name: 'Bangladeshi Taka',
    symbol: 'BDT',
    creativeSymbol: '৳',
    region: 'Asia',
    locale: 'en-BD',
    sarRate: 32.1,
  },
  {
    code: 'PHP',
    name: 'Philippine Peso',
    symbol: 'PHP',
    creativeSymbol: '₱',
    region: 'Asia',
    locale: 'en-PH',
    sarRate: 15.3,
  },
  {
    code: 'IDR',
    name: 'Indonesian Rupiah',
    symbol: 'IDR',
    creativeSymbol: 'Rp',
    region: 'Asia',
    locale: 'id-ID',
    sarRate: 4350,
  },
  // Global
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    creativeSymbol: '$',
    region: 'Global',
    locale: 'en-US',
    sarRate: 0.266,
  },
];

export function getCurrencyConfig(code: Currency): CurrencyConfig {
  return CURRENCY_LIST.find((c) => c.code === code) || CURRENCY_LIST[0];
}

/**
 * Converts SAR amount to INR based on the rate (1 SAR = rate INR)
 */
export function convertSARtoINR(amountSAR: number, rate: number = DEFAULT_SAR_TO_INR_RATE): number {
  return amountSAR * rate;
}

/**
 * Converts SAR amount to any target currency using configured or custom rate
 */
export function convertSARtoCurrency(
  amountSAR: number,
  targetCurrency: Currency,
  customSarToInrRate: number = DEFAULT_SAR_TO_INR_RATE
): number {
  if (targetCurrency === 'SAR') return amountSAR;
  if (targetCurrency === 'INR') return amountSAR * customSarToInrRate;

  const cfg = getCurrencyConfig(targetCurrency);
  return amountSAR * cfg.sarRate;
}

/**
 * Formats a currency amount nicely with creative out-of-the-box symbols
 */
export function formatCurrency(
  amountSAR: number,
  displayCurrency: Currency = 'SAR',
  rate: number = DEFAULT_SAR_TO_INR_RATE,
  showCode = true,
  creativeSymbol = true,
  enableExchangeRate = true
): string {
  if (isNaN(amountSAR) || amountSAR === null || amountSAR === undefined) {
    amountSAR = 0;
  }

  // If exchange rate is disabled, always format using base SAR currency
  const targetCurrency = enableExchangeRate ? displayCurrency : 'SAR';
  const cfg = getCurrencyConfig(targetCurrency);

  const converted = targetCurrency === 'SAR' ? amountSAR : convertSARtoCurrency(amountSAR, targetCurrency, rate);

  const fractionDigits = targetCurrency === 'KWD' || targetCurrency === 'BHD' || targetCurrency === 'OMR' ? 3 : targetCurrency === 'IDR' ? 0 : 2;

  const formatted = new Intl.NumberFormat(cfg.locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(converted);

  if (!showCode) return formatted;

  if (targetCurrency === 'SAR') {
    return creativeSymbol ? `${formatted} ﷼` : `${formatted} SAR`;
  }

  if (['INR', 'PKR', 'BDT', 'PHP', 'USD'].includes(targetCurrency)) {
    return `${cfg.creativeSymbol}${formatted}`;
  }

  return `${formatted} ${cfg.creativeSymbol}`;
}

/**
 * Returns secondary equivalent amount string for dual-currency clarity
 * e.g., if viewing in SAR, returns "≈ ₹11,225"
 * Returns empty string if enableExchangeRate is disabled.
 */
export function formatSecondaryEquivalent(
  amountSAR: number,
  currentDisplay: Currency,
  rate: number = DEFAULT_SAR_TO_INR_RATE,
  enableExchangeRate = true
): string {
  if (!enableExchangeRate) return '';

  if (currentDisplay === 'SAR') {
    const inr = convertSARtoINR(amountSAR, rate);
    return `≈ ₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(inr)}`;
  } else {
    return `≈ ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amountSAR)} ﷼`;
  }
}
