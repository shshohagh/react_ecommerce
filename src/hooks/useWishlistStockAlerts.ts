import { useEffect, useCallback } from 'react';
import { Product } from '../types';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'swiftcart_out_of_stock_wishlist';

export function useWishlistStockAlerts(wishlist: Product[]) {
  const { showSuccess, showToast } = useToast();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Helper to check if a product is out of stock
  const isProductOutOfStock = useCallback((p: Product): boolean => {
    if (p.stock_status === 'out_of_stock') return true;
    if (typeof p.stock === 'number' && p.stock <= 0) return true;
    if (p.in_stock === false) return true;
    return false;
  }, []);

  // Monitor wishlist items and check if any previously out-of-stock items have become in-stock
  useEffect(() => {
    if (!wishlist || wishlist.length === 0) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const previouslyOutOfStockIds: string[] = stored ? JSON.parse(stored) : [];

      const currentOutOfStockIds: string[] = [];

      wishlist.forEach((product) => {
        const isCurrentlyOOS = isProductOutOfStock(product);

        if (isCurrentlyOOS) {
          currentOutOfStockIds.push(product.id);
        } else if (previouslyOutOfStockIds.includes(product.id)) {
          // The item was previously out of stock and is now in stock!
          // Trigger the toast notification system with an action button
          showToast({
            type: 'success',
            title: '🎉 Back in Stock Alert!',
            message: `"${product.name}" in your wishlist is back in stock! Order before it sells out.`,
            duration: 9000,
            action: {
              label: 'Add to Cart',
              onClick: () => {
                addToCart(product);
                showSuccess(`Added "${product.name}" to your cart!`, 'Cart Updated');
              },
            },
          });
        }
      });

      // Update storage with current out of stock list
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOutOfStockIds));
    } catch (e) {
      console.warn('Failed to process stock alert state:', e);
    }
  }, [wishlist, isProductOutOfStock, showToast, addToCart, showSuccess]);

  // Method to simulate an item restocking (for testing or interactive demo)
  const triggerRestockAlert = useCallback(
    (product: Product) => {
      showToast({
        type: 'success',
        title: '🎉 Back in Stock Alert!',
        message: `Great news! "${product.name}" from your wishlist is now back in stock! Only ${
          product.stock || 12
        } units available.`,
        duration: 9000,
        action: {
          label: 'Add to Cart',
          onClick: () => {
            addToCart(product);
            showSuccess(`Added "${product.name}" to your cart!`, 'Cart Updated');
            navigate('/cart');
          },
        },
      });
    },
    [showToast, addToCart, showSuccess, navigate]
  );

  return {
    isProductOutOfStock,
    triggerRestockAlert,
  };
}
