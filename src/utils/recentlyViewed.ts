import { Product } from '../types';

const SESSION_STORAGE_KEY = 'swiftcart_session_recently_viewed';
const LOCAL_STORAGE_KEY = 'swiftcart_recently_viewed';
const MAX_RECENT_ITEMS = 8;

export function getRecentlyViewed(): Product[] {
  try {
    // Check sessionStorage first (strictly during current session)
    const sessionSaved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionSaved) {
      const parsed = JSON.parse(sessionSaved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, MAX_RECENT_ITEMS);
      }
    }

    // Fallback to localStorage
    const localSaved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localSaved) {
      const parsed = JSON.parse(localSaved);
      return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_ITEMS) : [];
    }

    return [];
  } catch (err) {
    console.warn('Failed to load recently viewed products:', err);
    return [];
  }
}

export function addRecentlyViewed(product: Product): void {
  try {
    if (!product || !product.id) return;
    const current = getRecentlyViewed();
    // Filter out the current item if it already exists, so it gets moved to the front
    const filtered = current.filter((p) => p.id !== product.id);
    const updated = [product, ...filtered].slice(0, MAX_RECENT_ITEMS);
    
    // Save to both sessionStorage (current session) and localStorage (persistence)
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    // Dispatch a custom event so other components (e.g. Home page) update reactively
    window.dispatchEvent(new Event('recently_viewed_updated'));
  } catch (err) {
    console.warn('Failed to save recently viewed product:', err);
  }
}

export function clearRecentlyViewed(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    window.dispatchEvent(new Event('recently_viewed_updated'));
  } catch (err) {
    console.warn('Failed to clear recently viewed products:', err);
  }
}
