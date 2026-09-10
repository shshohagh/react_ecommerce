import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Product } from '../types';

export interface CartItem extends Product {
  quantity: number;
  selectedAttributes?: Record<string, string>;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, attributes?: Record<string, string>) => void;
  removeFromCart: (productId: string, attributes?: Record<string, string>) => void;
  decreaseQuantity: (productId: string, attributes?: Record<string, string>) => void;
  clearCart: () => void;
  cartCount: number;
  isAutoSaved: boolean;
  lastSavedAt: number | null;
}

const CART_STORAGE_KEY = 'cart';
const CART_META_KEY = 'cart_meta';
const DEBOUNCE_DELAY_MS = 350;

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // 1. Initial State Restoration from Local Storage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to parse saved cart from localStorage:', err);
    }
    return [];
  });

  const [isAutoSaved, setIsAutoSaved] = useState<boolean>(true);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(() => {
    try {
      const meta = localStorage.getItem(CART_META_KEY);
      if (meta) {
        const parsed = JSON.parse(meta);
        return parsed.lastSavedAt || null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestCartRef = useRef<CartItem[]>(cart);

  // Keep latest cart ref updated for synchronous beforeunload flush
  useEffect(() => {
    latestCartRef.current = cart;
  }, [cart]);

  // Synchronous flush helper for beforeunload / pagehide
  const flushCartToStorage = useCallback((itemsToSave: CartItem[]) => {
    try {
      const timestamp = Date.now();
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(itemsToSave));
      localStorage.setItem(CART_META_KEY, JSON.stringify({
        lastSavedAt: timestamp,
        itemCount: itemsToSave.reduce((acc, i) => acc + (i.quantity || 1), 0),
        version: 1
      }));
      setLastSavedAt(timestamp);
      setIsAutoSaved(true);
    } catch (err) {
      console.warn('Could not persist cart to localStorage:', err);
    }
  }, []);

  // 2. Debounced Auto-save on Cart Mutations
  useEffect(() => {
    setIsAutoSaved(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      flushCartToStorage(cart);
    }, DEBOUNCE_DELAY_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [cart, flushCartToStorage]);

  // 3. Guarantee Save on Page Unload / Visibility Change
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      flushCartToStorage(latestCartRef.current);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        flushCartToStorage(latestCartRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushCartToStorage]);

  const addToCart = (product: Product, attributes?: Record<string, string>) => {
    setCart((prev) => {
      const existingItem = prev.find(
        (item) => 
          item.id === product.id && 
          JSON.stringify(item.selectedAttributes || {}) === JSON.stringify(attributes || {})
      );

      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id && 
          JSON.stringify(item.selectedAttributes || {}) === JSON.stringify(attributes || {})
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...product, quantity: 1, selectedAttributes: attributes }];
    });
  };

  const decreaseQuantity = (productId: string, attributes?: Record<string, string>) => {
    setCart((prev) => {
      const existingItem = prev.find(
        (item) => 
          item.id === productId && 
          JSON.stringify(item.selectedAttributes || {}) === JSON.stringify(attributes || {})
      );

      if (existingItem && existingItem.quantity > 1) {
        return prev.map((item) =>
          item.id === productId && 
          JSON.stringify(item.selectedAttributes || {}) === JSON.stringify(attributes || {})
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }

      return prev.filter((item) => 
        !(item.id === productId && JSON.stringify(item.selectedAttributes || {}) === JSON.stringify(attributes || {}))
      );
    });
  };

  const removeFromCart = (productId: string, attributes?: Record<string, string>) => {
    setCart((prev) => prev.filter((item) => 
      !(item.id === productId && JSON.stringify(item.selectedAttributes || {}) === JSON.stringify(attributes || {}))
    ));
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(CART_META_KEY);
      setLastSavedAt(null);
      setIsAutoSaved(true);
    } catch (e) {
      console.warn('Error clearing cart storage:', e);
    }
  };

  const cartCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      decreaseQuantity, 
      clearCart, 
      cartCount,
      isAutoSaved,
      lastSavedAt
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

