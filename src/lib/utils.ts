import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (price: number, currencyCode?: string) => {
  if (typeof price !== 'number' || isNaN(price)) return '$0.00';
  
  const savedCurrency = currencyCode || (typeof localStorage !== 'undefined' ? localStorage.getItem('selected_currency') : 'USD') || 'USD';
  
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: savedCurrency,
      minimumFractionDigits: savedCurrency === 'BDT' || savedCurrency === 'JPY' ? 0 : 2,
      maximumFractionDigits: savedCurrency === 'BDT' || savedCurrency === 'JPY' ? 0 : 2,
    }).format(price);
  } catch (e) {
    return `$${price.toFixed(2)}`;
  }
};

export const formatDate = (date: any) => {
  if (!date) return 'N/A';
  if (typeof date === 'string') return new Date(date).toLocaleDateString();
  if (date && typeof date === 'object' && 'toDate' in date) return date.toDate().toLocaleDateString();
  return new Date(date).toLocaleDateString();
};
