// Currency formatting utilities

export const currencySymbols = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'CHF': 'CHF ',
  'JPY': '¥',
  'CAD': 'C$',
  'AUD': 'A$',
  'SGD': 'S$',
  'HKD': 'HK$'
};

export const formatPrice = (price, currency = 'USD') => {
  if (!price && price !== 0) return null;
  
  const symbol = currencySymbols[currency] || currency + ' ';
  const formattedNumber = price.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  // For currencies like CHF that traditionally show after, keep them before for consistency
  return `${symbol}${formattedNumber}`;
};

export const getCurrencySymbol = (currency = 'USD') => {
  return currencySymbols[currency] || currency;
};