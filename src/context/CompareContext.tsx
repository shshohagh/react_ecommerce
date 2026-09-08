import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { useToast } from './ToastContext';

interface CompareContextType {
  compareList: Product[];
  addToCompare: (product: Product) => boolean;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (open: boolean) => void;
  openCompareModal: () => void;
  closeCompareModal: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const COMPARE_STORAGE_KEY = 'swiftcart_compare_list';

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const { showSuccess, showWarning, showInfo } = useToast();
  const [compareList, setCompareList] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(COMPARE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareList));
    } catch (e) {
      console.warn('Failed to save comparison to localStorage:', e);
    }
  }, [compareList]);

  const isInCompare = (productId: string) => {
    return compareList.some((p) => p.id === productId);
  };

  const addToCompare = (product: Product): boolean => {
    if (isInCompare(product.id)) {
      removeFromCompare(product.id);
      return false;
    }

    if (compareList.length >= 3) {
      showWarning('You can compare up to 3 products at a time. Please remove an item first.', 'Comparison Limit');
      setIsCompareModalOpen(true);
      return false;
    }

    const updated = [...compareList, product];
    setCompareList(updated);
    showSuccess(`"${product.name}" added to comparison (${updated.length}/3).`, 'Added to Compare');
    return true;
  };

  const removeFromCompare = (productId: string) => {
    const item = compareList.find((p) => p.id === productId);
    setCompareList((prev) => prev.filter((p) => p.id !== productId));
    if (item) {
      showInfo(`"${item.name}" removed from comparison.`, 'Comparison Updated');
    }
  };

  const clearCompare = () => {
    setCompareList([]);
    setIsCompareModalOpen(false);
    showInfo('Comparison list cleared.', 'Compare Cleared');
  };

  const openCompareModal = () => setIsCompareModalOpen(true);
  const closeCompareModal = () => setIsCompareModalOpen(false);

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        isCompareModalOpen,
        setIsCompareModalOpen,
        openCompareModal,
        closeCompareModal
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
