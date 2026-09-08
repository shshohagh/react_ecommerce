import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, setDoc, deleteDoc, getDoc, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './ToastContext';
import { Product } from '../types';

interface WishlistContextType {
  wishlist: Product[];
  wishlistIds: string[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string, productName?: string) => Promise<void>;
  addToWishlist: (product: Product) => Promise<void>;
  clearWishlist: () => Promise<void>;
  loading: boolean;
  isCloudSynced: boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const GUEST_WISHLIST_STORAGE_KEY = 'swiftcart_guest_wishlist';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showInfo, showError } = useToast();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // Helper to load guest wishlist from localStorage
  const loadGuestWishlist = useCallback((): Product[] => {
    try {
      const saved = localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Failed to load guest wishlist:', err);
      return [];
    }
  }, []);

  // Helper to save guest wishlist to localStorage
  const saveGuestWishlist = useCallback((items: Product[]) => {
    try {
      localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to save guest wishlist:', err);
    }
  }, []);

  // Fetch full product details for a list of product IDs
  const fetchProductsByIds = useCallback(async (ids: string[]): Promise<Product[]> => {
    if (ids.length === 0) return [];
    try {
      const products = await Promise.all(
        ids.map(async (pid) => {
          try {
            const pSnap = await getDoc(doc(db, 'products', pid));
            if (pSnap.exists()) {
              return { id: pSnap.id, ...pSnap.data() } as Product;
            }
          } catch (e) {
            console.warn(`Error fetching product ${pid}:`, e);
          }
          return null;
        })
      );
      return products.filter((p): p is Product => p !== null);
    } catch (err) {
      console.error('Error fetching wishlist products:', err);
      return [];
    }
  }, []);

  // Primary effect: sync with Firestore when user is authenticated, or use localStorage for guest
  useEffect(() => {
    let unsubscribe = () => {};

    if (isAuthenticated && user?.id) {
      setLoading(true);
      setIsCloudSynced(true);

      // Check if there are any guest items to migrate into the user's Firestore wishlist
      const guestItems = loadGuestWishlist();
      if (guestItems.length > 0) {
        (async () => {
          try {
            for (const item of guestItems) {
              // Check if already in Firestore
              const checkQ = query(
                collection(db, 'wishlist'),
                where('user_id', '==', user.id),
                where('product_id', '==', item.id)
              );
              const checkSnap = await getDocs(checkQ);
              if (checkSnap.empty) {
                await addDoc(collection(db, 'wishlist'), {
                  user_id: user.id,
                  product_id: item.id,
                  created_at: Timestamp.now()
                });
              }
            }
            // Clear migrated guest items
            localStorage.removeItem(GUEST_WISHLIST_STORAGE_KEY);
            showInfo('Your saved favorites have been synced to your account!', 'Wishlist Synced');
          } catch (migrationErr) {
            console.warn('Could not migrate guest wishlist:', migrationErr);
          }
        })();
      }

      // Real-time listener for the user's Firestore wishlist
      const q = query(collection(db, 'wishlist'), where('user_id', '==', user.id));
      unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          const productIds = snapshot.docs.map((d) => d.data().product_id as string);
          setWishlistIds(productIds);

          const fullProducts = await fetchProductsByIds(productIds);
          setWishlist(fullProducts);
          setLoading(false);
        },
        (error) => {
          console.error('Wishlist Firestore onSnapshot error:', error);
          setLoading(false);
        }
      );
    } else {
      // Guest mode: load from localStorage
      setIsCloudSynced(false);
      const guestList = loadGuestWishlist();
      setWishlist(guestList);
      setWishlistIds(guestList.map((p) => p.id));
      setLoading(false);
    }

    return () => unsubscribe();
  }, [isAuthenticated, user?.id, loadGuestWishlist, fetchProductsByIds, showInfo]);

  // Check if product is in wishlist
  const isInWishlist = useCallback(
    (productId: string): boolean => {
      return wishlistIds.includes(productId);
    },
    [wishlistIds]
  );

  // Toggle wishlist item
  const toggleWishlist = useCallback(
    async (product: Product) => {
      if (!product || !product.id) return;
      const isAlreadyIn = isInWishlist(product.id);

      if (isAuthenticated && user?.id) {
        // Authenticated user: update Firestore
        try {
          if (isAlreadyIn) {
            const q = query(
              collection(db, 'wishlist'),
              where('user_id', '==', user.id),
              where('product_id', '==', product.id)
            );
            const snap = await getDocs(q);
            await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, 'wishlist', d.id))));
            setWishlistIds((prev) => prev.filter((id) => id !== product.id));
            setWishlist((prev) => prev.filter((p) => p.id !== product.id));
            showInfo(`${product.name} removed from wishlist.`, 'Wishlist Updated');
          } else {
            await addDoc(collection(db, 'wishlist'), {
              user_id: user.id,
              product_id: product.id,
              created_at: Timestamp.now()
            });
            setWishlistIds((prev) => [...prev, product.id]);
            setWishlist((prev) => [...prev, product]);
            showSuccess(`${product.name} saved to your cloud wishlist!`, 'Saved to Favorites');
          }
        } catch (err) {
          console.error('Firestore wishlist toggle error:', err);
          showError('Failed to update wishlist on cloud. Please try again.');
        }
      } else {
        // Guest user: save locally in localStorage
        if (isAlreadyIn) {
          const updated = wishlist.filter((p) => p.id !== product.id);
          setWishlist(updated);
          setWishlistIds(updated.map((p) => p.id));
          saveGuestWishlist(updated);
          showInfo(`${product.name} removed from favorites.`, 'Wishlist Updated');
        } else {
          const updated = [...wishlist, product];
          setWishlist(updated);
          setWishlistIds(updated.map((p) => p.id));
          saveGuestWishlist(updated);
          showSuccess(`${product.name} added to favorites! Sign in to sync across devices.`, 'Wishlist Added');
        }
      }
    },
    [isAuthenticated, user?.id, isInWishlist, wishlist, saveGuestWishlist, showInfo, showSuccess, showError]
  );

  // Add to wishlist
  const addToWishlist = useCallback(
    async (product: Product) => {
      if (isInWishlist(product.id)) return;
      await toggleWishlist(product);
    },
    [isInWishlist, toggleWishlist]
  );

  // Remove from wishlist
  const removeFromWishlist = useCallback(
    async (productId: string, productName?: string) => {
      if (isAuthenticated && user?.id) {
        try {
          const q = query(
            collection(db, 'wishlist'),
            where('user_id', '==', user.id),
            where('product_id', '==', productId)
          );
          const snap = await getDocs(q);
          await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, 'wishlist', d.id))));
          setWishlistIds((prev) => prev.filter((id) => id !== productId));
          setWishlist((prev) => prev.filter((p) => p.id !== productId));
          showInfo(`Removed "${productName || 'Item'}" from wishlist.`, 'Wishlist Updated');
        } catch (err) {
          console.error('Failed to remove from cloud wishlist:', err);
          showError('Failed to remove item from wishlist.');
        }
      } else {
        const updated = wishlist.filter((p) => p.id !== productId);
        setWishlist(updated);
        setWishlistIds(updated.map((p) => p.id));
        saveGuestWishlist(updated);
        showInfo(`Removed "${productName || 'Item'}" from favorites.`, 'Wishlist Updated');
      }
    },
    [isAuthenticated, user?.id, wishlist, saveGuestWishlist, showInfo, showError]
  );

  // Clear entire wishlist
  const clearWishlist = useCallback(async () => {
    if (isAuthenticated && user?.id) {
      try {
        const q = query(collection(db, 'wishlist'), where('user_id', '==', user.id));
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, 'wishlist', d.id))));
        setWishlist([]);
        setWishlistIds([]);
        showSuccess('Wishlist cleared.', 'Wishlist Cleared');
      } catch (err) {
        console.error('Failed to clear wishlist:', err);
        showError('Failed to clear wishlist.');
      }
    } else {
      setWishlist([]);
      setWishlistIds([]);
      saveGuestWishlist([]);
      showSuccess('Favorites cleared.', 'Wishlist Cleared');
    }
  }, [isAuthenticated, user?.id, saveGuestWishlist, showSuccess, showError]);

  const refreshWishlist = useCallback(async () => {
    if (isAuthenticated && user?.id) {
      setLoading(true);
      try {
        const q = query(collection(db, 'wishlist'), where('user_id', '==', user.id));
        const snap = await getDocs(q);
        const pids = snap.docs.map((d) => d.data().product_id as string);
        setWishlistIds(pids);
        const products = await fetchProductsByIds(pids);
        setWishlist(products);
      } finally {
        setLoading(false);
      }
    }
  }, [isAuthenticated, user?.id, fetchProductsByIds]);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistIds,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        addToWishlist,
        clearWishlist,
        loading,
        isCloudSynced,
        refreshWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
