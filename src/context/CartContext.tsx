import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product } from '../types';

interface CartItem extends Product {
  quantity: number;
  selectedAttributes?: Record<string, string>;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, attributes?: Record<string, string>) => void;
  removeFromCart: (productId: number, attributes?: Record<string, string>) => void;
  decreaseQuantity: (productId: number, attributes?: Record<string, string>) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, attributes?: Record<string, string>) => {
    setCart((prev) => {
      const existingItem = prev.find(
        (item) => 
          item.id === product.id && 
          JSON.stringify(item.selectedAttributes) === JSON.stringify(attributes)
      );

      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id && 
          JSON.stringify(item.selectedAttributes) === JSON.stringify(attributes)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...product, quantity: 1, selectedAttributes: attributes }];
    });
  };

  const decreaseQuantity = (productId: number, attributes?: Record<string, string>) => {
    setCart((prev) => {
      const existingItem = prev.find(
        (item) => 
          item.id === productId && 
          JSON.stringify(item.selectedAttributes) === JSON.stringify(attributes)
      );

      if (existingItem && existingItem.quantity > 1) {
        return prev.map((item) =>
          item.id === productId && 
          JSON.stringify(item.selectedAttributes) === JSON.stringify(attributes)
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }

      return prev.filter((item) => 
        !(item.id === productId && JSON.stringify(item.selectedAttributes) === JSON.stringify(attributes))
      );
    });
  };

  const removeFromCart = (productId: number, attributes?: Record<string, string>) => {
    setCart((prev) => prev.filter((item) => 
      !(item.id === productId && JSON.stringify(item.selectedAttributes) === JSON.stringify(attributes))
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartCount }}>
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
