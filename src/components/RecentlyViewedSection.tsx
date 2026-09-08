import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { History, ChevronLeft, ChevronRight, Trash2, ShoppingCart, ArrowLeftRight, Star, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { getRecentlyViewed, clearRecentlyViewed } from '../utils/recentlyViewed';
import { formatPrice } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';
import { useToast } from '../context/ToastContext';

export default function RecentlyViewedSection() {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const { addToCompare, isInCompare } = useCompare();
  const { showSuccess } = useToast();

  const loadRecent = () => {
    setRecentProducts(getRecentlyViewed());
  };

  useEffect(() => {
    loadRecent();
    window.addEventListener('recently_viewed_updated', loadRecent);
    return () => window.removeEventListener('recently_viewed_updated', loadRecent);
  }, []);

  const handleClear = () => {
    clearRecentlyViewed();
    setRecentProducts([]);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (recentProducts.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <div className="bg-gray-50/70 dark:bg-gray-900/40 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Recently Viewed
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                The last {recentProducts.length} items you browsed during this session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer mr-2"
              title="Clear recently viewed history"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>

            {/* Scroll Navigation Arrows */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => scroll('left')}
                className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-xs"
                title="Scroll Left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-xs"
                title="Scroll Right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Scrollable Carousel */}
        <div
          ref={scrollContainerRef}
          className="flex gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800"
        >
          {recentProducts.map((product) => {
            const isCompared = isInCompare(product.id);

            return (
              <div
                key={product.id}
                className="flex-shrink-0 w-64 sm:w-72 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col"
              >
                {/* Product Image & Top Badge/Actions */}
                <div className="relative aspect-square w-full overflow-hidden bg-gray-50 dark:bg-gray-950">
                  <Link to={`/product/${product.id}`} className="block w-full h-full">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </Link>

                  {/* Compare Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addToCompare(product);
                    }}
                    title={isCompared ? 'Remove from compare' : 'Add to compare'}
                    className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-xs ${
                      isCompared
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/80 dark:bg-gray-900/80 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                  </button>

                  {product.category && (
                    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {product.category}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col flex-1">
                  <Link
                    to={`/product/${product.id}`}
                    className="font-bold text-sm text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1 mb-1"
                  >
                    {product.name}
                  </Link>

                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                      {formatPrice(product.price)}
                    </span>
                    {product.brand && (
                      <span className="text-[11px] text-gray-400 truncate max-w-[100px]">
                        {product.brand}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-auto pt-2 border-t border-gray-50 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(product);
                        showSuccess(`${product.name} added to cart!`, 'Cart Updated');
                      }}
                      className="py-2 px-2.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>

                    <Link
                      to={`/product/${product.id}`}
                      className="py-2 px-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 group/btn"
                    >
                      <span>View</span>
                      <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
