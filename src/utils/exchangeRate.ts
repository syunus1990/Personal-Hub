import { ExchangeRateRecord, Loan, LoanPayment } from '../types';

export const DEFAULT_EXCHANGE_RATE: ExchangeRateRecord = {
  rateInrToSar: 0.045, // 1 INR ≈ 0.045 SAR
  rateSarToInr: 22.22, // 1 SAR ≈ 22.22 INR
  lastUpdated: new Date().toISOString(),
  source: 'Standard Rate (Offline Cache)',
};

const STORAGE_KEY_EXCHANGE_RATE = 'hub_exchange_rate_v1';

/**
 * Load stored exchange rate from local storage
 */
export function loadStoredExchangeRate(): ExchangeRateRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXCHANGE_RATE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.rateInrToSar === 'number' && parsed.rateInrToSar > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading stored exchange rate:', e);
  }
  return DEFAULT_EXCHANGE_RATE;
}

/**
 * Save exchange rate to local storage
 */
export function saveStoredExchangeRate(record: ExchangeRateRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY_EXCHANGE_RATE, JSON.stringify(record));
  } catch (e) {
    console.error('Error saving exchange rate:', e);
  }
}

/**
 * Fetch live exchange rate from open exchange rate API with timeout and fallback
 */
export async function fetchLiveExchangeRate(): Promise<{
  record: ExchangeRateRecord;
  success: boolean;
  message: string;
}> {
  const currentStored = loadStoredExchangeRate();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // Free Open Exchange Rate API for SAR base
    const res = await fetch('https://open.er-api.com/v6/latest/SAR', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    if (data && data.rates && typeof data.rates.INR === 'number') {
      const rateSarToInr = data.rates.INR;
      const rateInrToSar = rateSarToInr > 0 ? 1 / rateSarToInr : 0.045;

      const newRecord: ExchangeRateRecord = {
        rateInrToSar: Number(rateInrToSar.toFixed(6)),
        rateSarToInr: Number(rateSarToInr.toFixed(4)),
        lastUpdated: new Date().toISOString(),
        source: 'Live Exchange API (open.er-api.com)',
      };

      saveStoredExchangeRate(newRecord);
      return {
        record: newRecord,
        success: true,
        message: 'Exchange rate updated: 1 SAR = ₹' + rateSarToInr.toFixed(2) + ' INR',
      };
    }
    throw new Error('Invalid rate payload');
  } catch (err: any) {
    console.warn('Could not fetch live exchange rate, using cached rate:', err?.message || err);
    return {
      record: currentStored,
      success: false,
      message: 'Network unavailable. Using cached exchange rate from ' + new Date(currentStored.lastUpdated).toLocaleDateString(),
    };
  }
}

/**
 * Calculate loan balances, total payments, and SAR conversions
 */
export interface CalculatedLoanDetails {
  originalAmount: number;
  originalCurrency: 'INR' | 'SAR';
  originalSarEquivalent: number;
  totalPaidInOriginalCurrency: number;
  totalPaidInSar: number;
  remainingInOriginalCurrency: number;
  currentRemainingInSar: number;
  isCompleted: boolean;
  paymentProgressPercentage: number;
  paymentsCount: number;
}

export function calculateLoanDetails(
  loan: Loan,
  payments: LoanPayment[],
  currentRateInrToSar: number
): CalculatedLoanDetails {
  const loanPayments = payments.filter((p) => p.loanId === loan.id);

  let totalPaidInOriginalCurrency = 0;
  let totalPaidInSar = 0;

  for (const p of loanPayments) {
    const paymentAmount = Number(p.amount) || 0;
    const rateUsed = p.exchangeRateUsed || currentRateInrToSar || 0.045;

    if (loan.originalCurrency === 'INR') {
      if (p.currency === 'INR') {
        totalPaidInOriginalCurrency += paymentAmount;
        totalPaidInSar += paymentAmount * rateUsed;
      } else {
        // Payment was in SAR -> convert to INR for loan reduction using payment rate
        const convertedToInr = rateUsed > 0 ? paymentAmount / rateUsed : paymentAmount * 22.22;
        totalPaidInOriginalCurrency += convertedToInr;
        totalPaidInSar += paymentAmount;
      }
    } else {
      // Loan is in SAR
      if (p.currency === 'SAR') {
        totalPaidInOriginalCurrency += paymentAmount;
        totalPaidInSar += paymentAmount;
      } else {
        // Payment in INR -> convert to SAR using payment rate
        const convertedToSar = paymentAmount * rateUsed;
        totalPaidInOriginalCurrency += convertedToSar;
        totalPaidInSar += convertedToSar;
      }
    }
  }

  const remainingInOriginalCurrency = Math.max(0, loan.originalAmount - totalPaidInOriginalCurrency);

  const originalSarEquivalent =
    loan.originalCurrency === 'INR'
      ? loan.originalAmount * currentRateInrToSar
      : loan.originalAmount;

  const currentRemainingInSar =
    loan.originalCurrency === 'INR'
      ? remainingInOriginalCurrency * currentRateInrToSar
      : remainingInOriginalCurrency;

  const isCompleted = remainingInOriginalCurrency <= 0.01;
  const paymentProgressPercentage = Math.min(
    100,
    Math.round((totalPaidInOriginalCurrency / (loan.originalAmount || 1)) * 100)
  );

  return {
    originalAmount: loan.originalAmount,
    originalCurrency: loan.originalCurrency,
    originalSarEquivalent,
    totalPaidInOriginalCurrency,
    totalPaidInSar,
    remainingInOriginalCurrency,
    currentRemainingInSar,
    isCompleted,
    paymentProgressPercentage,
    paymentsCount: loanPayments.length,
  };
}
