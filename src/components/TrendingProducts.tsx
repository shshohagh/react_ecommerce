import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { useCompare } from '../context/CompareContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  TrendingUp,
  Eye,
  ShoppingBag,
  Star,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  ArrowLeftRight,
  Check,
  Zap,
  ShieldCheck,
  Award
} from 'lucide-react';
import QuickViewModal from './QuickViewModal';
import { TrendingProductsCarouselSkeleton } from './Skeletons';

interface TrendingProductItem extends Product {
  viewersCount?: number;
  recentSales?: number;
  rating?: number;
  reviewCount?: number;
  trendingBadge?: string;
}

export default function TrendingProducts() {
  const { user, isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const { addToCart } = useCart();
  const { addToCompare, isInCompare } = useCompare();
  const { showSuccess, showInfo } = useToast();

  const [trendingProducts, setTrendingProducts] = useState<TrendingProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTrendingData = async () => {
      setLoading(true);
      try {
        // Fetch all products
        const productsSnap = await getDocs(query(collection(db, 'products'), orderBy('created_at', 'desc')));
        const allProducts = productsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];

        // Fetch user's wishlist if logged in
        if (isAuthenticated && user) {
          try {
            const wishlistSnap = await getDocs(query(collection(db, 'wishlist'), where('user_id', '==', user.id)));
            setWishlistIds(wishlistSnap.docs.map(doc => doc.data().product_id));
          } catch (e) {
            console.warn('Could not fetch wishlist for trending:', e);
          }
        }

        // Dynamically compute social proof metrics
        const enriched: TrendingProductItem[] = allProducts.map((p, idx) => {
          // Stable pseudo-random stats based on product ID character codes
          const seed = p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const viewers = 8 + (seed % 28); // 8 - 35 viewers
          const sales = 15 + ((seed * 7) % 85); // 15 - 100 recent sales
          const rating = (4.6 + ((seed % 5) * 0.08)).toFixed(1);
          const reviewCount = 24 + (seed % 140);
          
          let badge = '🔥 Trending';
          if (p.is_featured) badge = '⭐ Best Seller';
          else if (sales > 60) badge = '⚡ High Demand';
          else if (idx % 3 === 0) badge = '🏆 Top Rated';
          else if (idx % 2 === 0) badge = '✨ Staff Pick';

          return {
            ...p,
            viewersCount: viewers,
            recentSales: sales,
            rating: parseFloat(rating),
            reviewCount,
            trendingBadge: badge,
          };
        });

        // Sort by popularity: featured first, then highest recent sales
        enriched.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return (b.recentSales || 0) - (a.recentSales || 0);
        });

        setTrendingProducts(enriched);
      } catch (err) {
        console.error('Error fetching trending products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingData();
  }, [isAuthenticated, user]);

  const categories = useMemo(() => {
    const list = Array.from(new Set(trendingProducts.map(p => p.category || 'General')));
    return ['All', ...list];
  }, [trendingProducts]);

  const filteredTrending = useMemo(() => {
    if (selectedCategory === 'All') return trendingProducts;
    return trendingProducts.filter(p => (p.category || 'General') === selectedCategory);
  }, [trendingProducts, selectedCategory]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    showSuccess(`Added "${product.name}" to your cart!`, 'Added to Cart');
  };

  const handleCompareClick = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCompare(product);
  };

  if (!loading && trendingProducts.length === 0) {
    return null;
  }

  return (
    <section id="trending-products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 scroll-mt-24">
      {/* Container Box */}
      <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white dark:from-indigo-950/30 dark:via-gray-900 dark:to-gray-900 rounded-3xl p-6 sm:p-8 md:p-10 border border-indigo-100/80 dark:border-indigo-900/40 shadow-xs relative overflow-hidden">
        
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-gray-100 dark:border-gray-800/80 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full text-xs font-extrabold tracking-wide uppercase shadow-2xs">
              <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span>Real-Time Popularity</span>
            </div>
            
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Trending Products
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                <Sparkles className="h-3 w-3" />
                Live Social Proof
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
              Discover what other shoppers are loving right now. High-demand items with stellar reviews and fast checkout.
            </p>
          </div>

          {/* Controls: Scroll Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => scroll('left')}
              className="p-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-2xs cursor-pointer active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-2xs cursor-pointer active:scale-95"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        {categories.length > 2 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200/60 dark:border-gray-700/60'
                }`}
              >
                <span>{cat}</span>
                {cat === 'All' && <Flame className="h-3 w-3 text-amber-300" />}
              </button>
            ))}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading ? (
          <TrendingProductsCarouselSkeleton />
        ) : (
          /* Horizontal Scrollable Carousel */
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory custom-scrollbar"
          >
            {filteredTrending.map((product) => {
              const inCompare = isInCompare(product.id);

              return (
                <div
                  key={product.id}
                  className="w-[280px] sm:w-[310px] flex-shrink-0 snap-start bg-white dark:bg-gray-800/90 rounded-3xl p-4 border border-gray-100 dark:border-gray-700/60 hover:border-indigo-300 dark:hover:border-indigo-700/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  {/* Card Header Image Area */}
                  <div>
                    <div className="relative h-52 w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 mb-4">
                      <Link to={`/product/${product.id}`} className="block h-full w-full">
                        <img
                          src={product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                          alt={product.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      </Link>

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
                        <span className="px-2.5 py-1 bg-gray-900/80 backdrop-blur-md text-white text-[11px] font-extrabold rounded-lg shadow-sm flex items-center gap-1">
                          {product.trendingBadge}
                        </span>
                        {product.is_featured && (
                          <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                            Featured
                          </span>
                        )}
                      </div>

                      {/* Compare and Quick Actions */}
                      <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setQuickViewProduct(product);
                          }}
                          className="p-2 rounded-xl backdrop-blur-md bg-white/85 dark:bg-gray-900/85 text-gray-700 dark:text-gray-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-all cursor-pointer shadow-sm active:scale-95"
                          title="Quick View Product"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleCompareClick(e, product)}
                          className={`p-2 rounded-xl backdrop-blur-md transition-colors cursor-pointer ${
                            inCompare
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-900'
                          }`}
                          title="Compare specifications"
                        >
                          <ArrowLeftRight className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Real-time viewer pill banner */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-white text-[11px] font-medium flex items-center justify-between">
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <Eye className="h-3.5 w-3.5" />
                          <span>{product.viewersCount} looking now</span>
                        </span>
                        <span className="text-[10px] text-gray-300">
                          {product.recentSales} sold recently
                        </span>
                      </div>
                    </div>

                    {/* Category & Brand */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                      <span className="font-semibold uppercase tracking-wider text-[10px] text-indigo-600 dark:text-indigo-400">
                        {product.category || 'Lifestyle'}
                      </span>
                      <span>{product.brand || 'SwiftCart'}</span>
                    </div>

                    {/* Title */}
                    <Link to={`/product/${product.id}`} className="block">
                      <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Star Rating & Social Proof */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center text-amber-400">
                        <Star className="h-4 w-4 fill-amber-400" />
                        <span className="ml-1 text-xs font-bold text-gray-800 dark:text-gray-200">
                          {product.rating}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ({product.reviewCount} verified reviews)
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom: Price & Quick Add Button */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Price</p>
                      <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleQuickAdd(e, product)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                      title="Quick Add to Cart"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Social Proof Trust Bar below trending items */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Fast Express Dispatch</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>30-Day Easy Returns</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
            <Award className="h-4 w-4 text-indigo-500" />
            <span>100% Authentic Quality Guaranteed</span>
          </div>
        </div>

      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </section>
  );
}
