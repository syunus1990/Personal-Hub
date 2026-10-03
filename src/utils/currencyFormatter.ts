import React from 'react';

/**
 * Official Saudi Riyal Symbol (Unicode U+20C1: ⃁)
 */
export const SAR_UNICODE = '\u20C1';
export const INR_UNICODE = '₹';

interface FormatCurrencyOptions {
  forceDecimals?: boolean;
  maxDecimals?: number;
  showApprox?: boolean;
}

/**
 * Smart decimal formatting:
 * If an integer, shows without decimals (e.g., 10,265).
 * If it has decimals or forceDecimals is true, shows 2 decimals (e.g., 10,265.50).
 */
export function formatSmartNumber(value: number, forceDecimals = false, maxDecimals = 2): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0';
  }

  const absVal = Math.abs(value);
  const isInteger = Math.abs(absVal - Math.round(absVal)) < 0.005;

  if (forceDecimals) {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxDecimals,
    });
  }

  if (isInteger) {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Format an amount in Saudi Riyal (⃁)
 * Example: formatSAR(10265) => "⃁ 10,265"
 * Example: formatSAR(2340.5) => "⃁ 2,340.50"
 */
export function formatSAR(amount: number, options?: FormatCurrencyOptions): string {
  const numStr = formatSmartNumber(amount, options?.forceDecimals, options?.maxDecimals);
  const prefix = options?.showApprox ? '≈ ⃁ ' : '⃁ ';
  return `${prefix}${numStr}`;
}

/**
 * Format an amount in Indian Rupee (₹)
 * Example: formatINR(100000) => "₹100,000"
 */
export function formatINR(amount: number, options?: FormatCurrencyOptions): string {
  const numStr = formatSmartNumber(amount, options?.forceDecimals, options?.maxDecimals);
  const prefix = options?.showApprox ? '≈ ₹' : '₹';
  return `${prefix}${numStr}`;
}

/**
 * Format currency dynamically based on currency code ('SAR' | 'INR')
 */
export function formatCurrency(
  amount: number,
  currency: 'SAR' | 'INR' = 'SAR',
  options?: FormatCurrencyOptions
): string {
  if (currency === 'INR') {
    return formatINR(amount, options);
  }
  return formatSAR(amount, options);
}

/**
 * Format dual currency representation for INR loans
 * Example: formatLoanDual(100000, 'INR', 4500) => { primary: "₹100,000", secondary: "≈ ⃁ 4,500" }
 */
export function formatLoanDual(
  amountOriginal: number,
  originalCurrency: 'INR' | 'SAR',
  sarEquivalent?: number
): { primary: string; secondary?: string } {
  if (originalCurrency === 'INR') {
    const primary = formatINR(amountOriginal);
    const secondary = sarEquivalent !== undefined ? `≈ ${formatSAR(sarEquivalent)}` : undefined;
    return { primary, secondary };
  }
  return { primary: formatSAR(amountOriginal) };
}
