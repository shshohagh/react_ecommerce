import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, Trash2, ShoppingCart, Star, CheckCircle, AlertCircle, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../lib/utils';

export default function CompareModal() {
  const { compareList, removeFromCompare, clearCompare, isCompareModalOpen, closeCompareModal } = useCompare();
  const { addToCart } = useCart();
  const { showSuccess } = useToast();
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCompareModalOpen) {
        closeCompareModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCompareModalOpen, closeCompareModal]);

  if (!isCompareModalOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="compare-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto"
        onClick={closeCompareModal}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-5xl bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  Compare Products
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {compareList.length} of 3 items selected for side-by-side evaluation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {compareList.length > 0 && (
                <button
                  type="button"
                  onClick={clearCompare}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              )}
              <button
                type="button"
                onClick={closeCompareModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
            {compareList.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="h-16 w-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <ArrowLeftRight className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">No products selected</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
                    Select up to 3 products across our store to compare specifications, ratings, and pricing side-by-side.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeCompareModal();
                    navigate('/#products');
                  }}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className={`grid grid-cols-${compareList.length} gap-4 sm:gap-6 min-w-[500px]`}>
                  {compareList.map((product) => {
                    let parsedAttributes: Record<string, string> = {};
                    try {
                      if (product.attributes) {
                        parsedAttributes = JSON.parse(product.attributes);
                      }
                    } catch {
                      parsedAttributes = {};
                    }

                    return (
                      <div
                        key={product.id}
                        className="bg-gray-50/60 dark:bg-gray-950/50 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 flex flex-col relative group transition-all"
                      >
                        {/* Remove Product from compare */}
                        <button
                          type="button"
                          onClick={() => removeFromCompare(product.id)}
                          className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 text-gray-400 hover:text-red-500 shadow-xs z-10 transition-colors"
                          title="Remove from comparison"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        {/* Image */}
                        <div className="aspect-square w-full rounded-xl overflow-hidden bg-white dark:bg-gray-900 mb-4 border border-gray-100 dark:border-gray-800 relative">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {product.is_featured && (
                            <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Featured
                            </span>
                          )}
                        </div>

                        {/* Title & Category */}
                        <div className="mb-4">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-0.5">
                            {product.category || 'General'}
                          </span>
                          <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white line-clamp-2">
                            {product.name}
                          </h4>
                          {product.brand && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              by {product.brand}
                            </span>
                          )}
                        </div>

                        {/* Specs & Comparison Metrics Table */}
                        <div className="space-y-3.5 text-xs text-gray-600 dark:text-gray-300 border-t border-b border-gray-200/80 dark:border-gray-800 py-4 mb-4 flex-1">
                          {/* Price Row */}
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-bold text-gray-500 dark:text-gray-400">Price:</span>
                            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                              {formatPrice(product.price)}
                            </span>
                          </div>

                          {/* Availability */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-gray-500 dark:text-gray-400">Status:</span>
                            <span className="inline-flex items-center gap-1 font-bold text-green-600 dark:text-green-400 text-[11px]">
                              <CheckCircle className="h-3.5 w-3.5" />
                              In Stock
                            </span>
                          </div>

                          {/* Category */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-gray-500 dark:text-gray-400">Category:</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                              {product.category || 'Lifestyle'}
                            </span>
                          </div>

                          {/* Brand */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-gray-500 dark:text-gray-400">Brand:</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                              {product.brand || 'SwiftCart Original'}
                            </span>
                          </div>

                          {/* Description Snippet */}
                          <div>
                            <span className="font-bold text-gray-500 dark:text-gray-400 block mb-1">
                              Description:
                            </span>
                            <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-3 bg-white/70 dark:bg-gray-900/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                              {product.description || 'No description provided.'}
                            </p>
                          </div>

                          {/* Custom Attributes / Variations */}
                          {Object.keys(parsedAttributes).length > 0 && (
                            <div className="pt-1">
                              <span className="font-bold text-gray-500 dark:text-gray-400 block mb-1">
                                Available Options:
                              </span>
                              <div className="space-y-1">
                                {Object.entries(parsedAttributes).map(([key, val]) => (
                                  <div key={key} className="text-[11px] flex items-center justify-between">
                                    <span className="text-gray-400 capitalize">{key}:</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-200 text-right truncate max-w-[120px]">
                                      {val}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-2 mt-auto">
                          <button
                            type="button"
                            onClick={() => {
                              addToCart(product);
                              showSuccess(`${product.name} added to cart!`, 'Cart Updated');
                            }}
                            className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            <span>Add to Cart</span>
                          </button>

                          <Link
                            to={`/product/${product.id}`}
                            onClick={closeCompareModal}
                            className="w-full py-2 px-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-600 text-gray-700 dark:text-gray-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 group"
                          >
                            <span>Full Details</span>
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-6 py-3.5 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-indigo-500" />
              Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 font-mono text-[10px] font-bold">Esc</kbd> anytime to exit.
            </span>
            <button
              onClick={closeCompareModal}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Back to Store
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
