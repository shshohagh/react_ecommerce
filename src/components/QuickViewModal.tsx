import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, ShoppingCart, Zap, Eye, Check, Heart, ShieldCheck, Truck, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { Product, Review, ProductVariation } from '../types';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToCompare, isInCompare } = useCompare();
  const { formatPrice } = useCurrency();
  const { showSuccess, showInfo } = useToast();

  const [quantity, setQuantity] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setSelectedAttributes({});
      setIsAdded(false);

      // Fetch variations
      const fetchVariationsAndReviews = async () => {
        try {
          // Fetch variations
          const vSnap = await getDocs(query(collection(db, 'product_variations'), where('product_id', '==', product.id)));
          const vData = vSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductVariation));
          setVariations(vData);

          // Fetch reviews
          const rSnap = await getDocs(query(collection(db, 'reviews'), where('product_id', '==', product.id)));
          const rData = rSnap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
          setReviews(rData);
          if (rData.length > 0) {
            const sum = rData.reduce((acc, r) => acc + (r.rating || 5), 0);
            setAverageRating(sum / rData.length);
          } else {
            setAverageRating(0);
          }
        } catch (err) {
          console.error('Error fetching quick view details:', err);
        }
      };

      fetchVariationsAndReviews();
    }
  }, [product]);

  // Keyboard shortcut: Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const isCompared = isInCompare(product.id);

  // Extract available attribute options
  const attributeOptions: Record<string, string[]> = {};
  if (product.attributes) {
    try {
      const parsed = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes;
      Object.entries(parsed).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          attributeOptions[key] = val as string[];
        } else if (typeof val === 'string') {
          attributeOptions[key] = [val];
        }
      });
    } catch (e) {
      // Ignored
    }
  }

  const handleAddToCart = () => {
    addToCart(product, selectedAttributes);
    setIsAdded(true);
    showSuccess(`Added ${quantity}x "${product.name}" to your cart!`, 'Cart Updated');
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedAttributes);
    onClose();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
        onClick={onClose}
        id="quick-view-overlay"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden relative my-8"
          onClick={(e) => e.stopPropagation()}
          id="quick-view-modal-content"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            id="close-quick-view-btn"
            className="absolute top-4 right-4 z-20 p-2.5 bg-white/90 dark:bg-gray-800/90 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Close Quick View (Esc)"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
            {/* Left: Product Image */}
            <div className="md:col-span-5 bg-gray-50 dark:bg-gray-950 p-6 flex flex-col justify-center items-center relative group">
              <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-inner relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                {product.is_featured && (
                  <span className="absolute top-3 left-3 bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                    Featured
                  </span>
                )}
              </div>

              {/* Quick Perks */}
              <div className="grid grid-cols-2 gap-2 w-full mt-4 text-[11px] text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5 p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                  <Truck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Fast Delivery</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <span>Quality Assured</span>
                </div>
              </div>
            </div>

            {/* Right: Product Details & Purchase Actions */}
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5">
              <div>
                {/* Category & Brand Tag */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {product.category || 'General'}
                  </span>
                  {product.brand && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-full font-semibold">
                      {product.brand}
                    </span>
                  )}
                </div>

                {/* Product Title */}
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-snug">
                  {product.name}
                </h3>

                {/* Rating summary */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(averageRating || 5)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200 dark:text-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {averageRating > 0 ? averageRating.toFixed(1) : '5.0'}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 ml-1" />
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">In Stock</span>
                </div>

                {/* Price Display */}
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                    {formatPrice(product.price)}
                  </span>
                </div>

                {/* Product Description */}
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-3 line-clamp-3 leading-relaxed">
                  {product.description || 'Premium quality crafted with attention to detail and designed for durability.'}
                </p>

                {/* Attributes (if any) */}
                {Object.keys(attributeOptions).length > 0 && (
                  <div className="mt-4 space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    {Object.entries(attributeOptions).map(([attrName, options]) => (
                      <div key={attrName} className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 capitalize">
                          {attrName}: <span className="text-indigo-600 font-medium">{selectedAttributes[attrName] || options[0]}</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {options.map((opt) => {
                            const isSelected = (selectedAttributes[attrName] || options[0]) === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setSelectedAttributes(prev => ({ ...prev, [attrName]: opt }))}
                                className={`px-3 py-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToCart}
                    id="quick-view-add-to-cart-btn"
                    className="flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-100 dark:hover:bg-indigo-900/60 active:scale-95 transition-all cursor-pointer"
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    id="quick-view-buy-now-btn"
                    className="flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Buy Now</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      addToCompare(product);
                    }}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      isCompared
                        ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50'
                        : 'text-gray-500 hover:text-indigo-600'
                    }`}
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    <span>{isCompared ? 'In Compare' : 'Add to Compare'}</span>
                  </button>

                  <Link
                    to={`/product/${product.id}`}
                    onClick={onClose}
                    id="quick-view-full-details-link"
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <span>View Full Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
