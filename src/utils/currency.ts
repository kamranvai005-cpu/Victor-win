import { Currency } from '../types';

export function getCurrencySymbol(currency: Currency): string {
  switch (currency) {
    case 'BDT':
      return '৳';
    case 'INR':
      return '₹';
    case 'USD':
      return '$';
    case 'USDT':
      return '₮';
    default:
      return '৳';
  }
}

export function formatCurrency(amount: number, currency: Currency): string {
  const sym = getCurrencySymbol(currency);
  return `${sym}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
