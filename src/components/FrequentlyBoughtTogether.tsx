import React, { useState, useMemo } from 'react';
import { Plus, Check, ShoppingBag, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { formatPrice } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

interface FrequentlyBoughtTogetherProps {
  currentProduct: Product;
  allProducts: Product[];
}

export default function FrequentlyBoughtTogether({ currentProduct, allProducts }: FrequentlyBoughtTogetherProps) {
  const { addToCart } = useCart();
  const { showSuccess } = useToast();

  // Smart Recommendation Algorithm:
  // 1. First priority: products from same category or complementary accessories
  // 2. Second priority: popular / featured products
  // 3. Filter out current product itself
  const recommendedItems = useMemo<Product[]>(() => {
    if (!allProducts || allProducts.length <= 1) return [];

    const candidates = allProducts.filter(p => p.id !== currentProduct.id);

    // Score candidates based on category affinity, brand match, and feature status
    const scored = candidates.map(product => {
      let score = 0;
      if (product.category === currentProduct.category) score += 5;
      if (product.brand && currentProduct.brand && product.brand === currentProduct.brand) score += 3;
      if (product.is_featured) score += 2;
      
      // Price affinity: complementary items often cost 20%-80% of main product
      const priceRatio = product.price / Math.max(currentProduct.price, 1);
      if (priceRatio >= 0.1 && priceRatio <= 1.2) score += 2;

      return { product, score };
    });

    // Sort descending by affinity score
    scored.sort((a, b) => b.score - a.score);

    // Pick top 2 complementary products
    return scored.slice(0, 2).map(s => s.product);
  }, [currentProduct, allProducts]);

  // Track selection state: main product is checked by default, plus recommended items
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    return [currentProduct.id, ...recommendedItems.map(p => p.id)];
  });

  // Re-sync when currentProduct or recommendations change
  React.useEffect(() => {
    setSelectedIds([currentProduct.id, ...recommendedItems.map(p => p.id)]);
  }, [currentProduct.id, recommendedItems]);

  if (recommendedItems.length === 0) {
    return null;
  }

  const bundleList = [currentProduct, ...recommendedItems];

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        // Prevent unchecking everything
        if (prev.length === 1) return prev;
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Pricing calculations
  const selectedProducts = bundleList.filter(p => selectedIds.includes(p.id));
  const rawTotalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);

  // Bundle Discount: 12% off if 2 items, 15% off if 3 items
  const discountRate = selectedProducts.length >= 3 ? 0.15 : (selectedProducts.length === 2 ? 0.10 : 0);
  const discountAmount = rawTotalPrice * discountRate;
  const finalBundlePrice = rawTotalPrice - discountAmount;

  const handleAddBundleToCart = () => {
    selectedProducts.forEach(product => {
      addToCart(product);
    });
    showSuccess(
      `Added ${selectedProducts.length} bundle items to your cart with ${Math.round(discountRate * 100)}% bundle savings!`,
      'Bundle Added to Cart'
    );
  };

  return (
    <div className="my-10 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            <Sparkles className="h-4 w-4" />
            <span>Smart Recommendations</span>
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
            Frequently Bought Together
          </h3>
        </div>
        {discountRate > 0 && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 rounded-full text-xs font-bold">
            <Tag className="h-3.5 w-3.5" />
            <span>Save {Math.round(discountRate * 100)}% on this bundle</span>
          </span>
        )}
      </div>

      {/* Visual Product Chain & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Product Cards Row */}
        <div className="lg:col-span-8 flex flex-col sm:flex-row items-center justify-start gap-4 overflow-x-auto py-2">
          {bundleList.map((item, index) => {
            const isSelected = selectedIds.includes(item.id);
            const isCurrent = item.id === currentProduct.id;

            return (
              <React.Fragment key={item.id}>
                {index > 0 && (
                  <div className="flex items-center justify-center p-2 text-gray-400 dark:text-gray-600">
                    <Plus className="h-5 w-5" />
                  </div>
                )}
                
                <div 
                  onClick={() => toggleItem(item.id)}
                  className={`group relative flex flex-col items-center p-3.5 rounded-2xl border transition-all cursor-pointer w-full sm:w-44 flex-shrink-0 ${
                    isSelected 
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30 shadow-xs' 
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 opacity-60'
                  }`}
                >
                  {/* Selection Checkbox Pill */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <div className={`h-5 w-5 rounded-md flex items-center justify-center transition-colors ${
                      isSelected 
                        ? 'bg-indigo-600 text-white' 
                        : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    }`}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>

                  {/* Product Thumbnail */}
                  <div className="h-28 w-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-2.5 flex items-center justify-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Details */}
                  <div className="text-center w-full px-1">
                    {isCurrent && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md mb-1 inline-block">
                        This Item
                      </span>
                    )}
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Bundle Summary & Add Button */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-4">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-500 dark:text-gray-400 font-medium">
              <span>Selected items ({selectedProducts.length}):</span>
              <span className={discountRate > 0 ? 'line-through' : 'font-bold text-gray-900 dark:text-white'}>
                {formatPrice(rawTotalPrice)}
              </span>
            </div>

            {discountRate > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Bundle savings ({Math.round(discountRate * 100)}%):</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm font-bold text-gray-900 dark:text-white">Bundle Price:</span>
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                {formatPrice(finalBundlePrice)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddBundleToCart}
            disabled={selectedProducts.length === 0}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Add All {selectedProducts.length} to Cart</span>
          </button>

          <p className="text-[11px] text-center text-gray-400">
            Items will be bundled together with one-click checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
