import React, { useEffect, useState } from 'react';
import { Flame, Eye, ShoppingCart, Clock, Sparkles } from 'lucide-react';
import { doc, onSnapshot, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

interface LiveInventoryCounterProps {
  productId: string;
  initialStock?: number;
  isOutOfStock?: boolean;
}

export default function LiveInventoryCounter({ productId, initialStock = 7, isOutOfStock = false }: LiveInventoryCounterProps) {
  const [inCartsCount, setInCartsCount] = useState<number>(3);
  const [activeViewers, setActiveViewers] = useState<number>(8);
  const [remainingStock, setRemainingStock] = useState<number>(initialStock);
  const [lastPurchasedMins, setLastPurchasedMins] = useState<number>(12);

  // Deterministic seed based on product ID for stable, believable initial numbers
  useEffect(() => {
    if (!productId) return;
    
    // Hash productId to generate stable initial numbers
    let hash = 0;
    for (let i = 0; i < productId.length; i++) {
      hash = (hash << 5) - hash + productId.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    
    const baseInCart = (absHash % 5) + 2; // 2 - 6 people
    const baseViewers = (absHash % 14) + 6; // 6 - 19 viewers
    const baseStockCount = Math.max(1, ((absHash % 6) + 2)); // 2 - 7 remaining
    const baseLastMins = (absHash % 35) + 3; // 3 - 38 mins ago

    setInCartsCount(baseInCart);
    setActiveViewers(baseViewers);
    setRemainingStock(baseStockCount);
    setLastPurchasedMins(baseLastMins);

    // Subscribe to Firestore for real-time multiplayer updates
    const activityDocRef = doc(db, 'live_product_activity', productId);
    const unsubscribe = onSnapshot(activityDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (typeof data.in_carts_count === 'number') setInCartsCount(data.in_carts_count);
        if (typeof data.active_viewers === 'number') setActiveViewers(data.active_viewers);
        if (typeof data.remaining_inventory === 'number') setRemainingStock(data.remaining_inventory);
        if (typeof data.last_purchased_minutes_ago === 'number') setLastPurchasedMins(data.last_purchased_minutes_ago);
      } else {
        // Initialize doc in Firestore so other clients can sync
        setDoc(activityDocRef, {
          product_id: productId,
          in_carts_count: baseInCart,
          active_viewers: baseViewers,
          remaining_inventory: baseStockCount,
          last_purchased_minutes_ago: baseLastMins,
          updated_at: new Date().toISOString()
        }).catch(() => {});
      }
    }, (err) => {
      console.debug("Firestore live activity sync running locally", err);
    });

    // Gentle realistic jitter to make the live feel organic
    const interval = setInterval(() => {
      setActiveViewers((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(3, Math.min(28, prev + delta));
      });
    }, 9000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [productId]);

  if (isOutOfStock) return null;

  // Calculate remaining stock percentage for urgency bar (out of max 15)
  const maxStock = 15;
  const stockPercentage = Math.min(100, Math.max(15, (remainingStock / maxStock) * 100));

  return (
    <div className="space-y-3.5 my-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-rose-500/5 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-rose-500/10 border border-amber-200/60 dark:border-amber-900/40">
      {/* Live Cart & Stock Urgency Top Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* In Cart Counter */}
        <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShoppingCart className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span><strong className="text-amber-800 dark:text-amber-200">{inCartsCount} people</strong> have this in their cart</span>
          </span>
        </div>

        {/* Live Active Viewers */}
        <div className="flex items-center gap-1.5 font-semibold text-gray-500 dark:text-gray-400">
          <Eye className="h-3.5 w-3.5 text-indigo-500" />
          <span><strong className="text-gray-800 dark:text-gray-200">{activeViewers}</strong> browsing now</span>
        </div>
      </div>

      {/* Stock Urgency Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 animate-pulse" />
            {remainingStock <= 4 ? (
              <span>Only {remainingStock} items left in stock – order soon!</span>
            ) : (
              <span>High Demand: {remainingStock} left in stock</span>
            )}
          </span>
          <span className="text-[11px] text-gray-400 font-medium font-mono">
            {Math.round(100 - stockPercentage)}% claimed
          </span>
        </div>

        {/* Bar */}
        <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-700 ease-out shadow-xs"
            style={{ width: `${Math.max(10, 100 - stockPercentage + 20)}%` }}
          />
        </div>
      </div>

      {/* Recent purchase ticker */}
      <div className="flex items-center justify-between pt-1 border-t border-amber-100/60 dark:border-amber-900/30 text-[11px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-emerald-500" />
          <span>Last purchased <strong className="text-gray-700 dark:text-gray-300">{lastPurchasedMins}m ago</strong></span>
        </div>
        <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
          <Sparkles className="h-3 w-3" />
          <span>Verified Fast Dispatch</span>
        </div>
      </div>
    </div>
  );
}

// Export helper to bump real-time activity when current user adds to cart
export async function notifyItemAddedToCart(productId: string) {
  try {
    const activityDocRef = doc(db, 'live_product_activity', productId);
    await updateDoc(activityDocRef, {
      in_carts_count: increment(1),
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    // If doc doesn't exist yet or offline, continue gracefully
  }
}
