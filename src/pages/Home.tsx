import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeletons';
import TrendingProducts from '../components/TrendingProducts';
import RecentlyViewedSection from '../components/RecentlyViewedSection';
import { Product } from '../types';
import { ShoppingBag, ChevronRight, ChevronLeft, ArrowUpDown, Search, X, SlidersHorizontal, RotateCcw, Tag, Star, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import ProductFilterSidebar, { FilterState } from '../components/ProductFilterSidebar';

const initialFilters: FilterState = {
  category: 'all',
  selectedBrands: [],
  minPrice: 0,
  maxPrice: 5000,
  inStockOnly: false,
  minRating: 0,
};

const SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
    title: "Premium Essentials",
    description: "Discover our curated collection of high-quality products designed for the modern individual.",
    cta: "Shop Collection"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&q=80",
    title: "Modern Style",
    description: "Quality meets style in every piece. Elevate your daily routine with our exclusive items.",
    cta: "Explore Style"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&q=80",
    title: "Exclusive Offers",
    description: "Join our community today and get the best deals on our latest arrivals and seasonal picks.",
    cta: "Join Now"
  }
];

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Comprehensive filter state
  const [filters, setFilters] = useState<FilterState>(() => {
    const catParam = searchParams.get('category');
    return {
      ...initialFilters,
      category: catParam || 'all',
    };
  });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const searchQuery = searchParams.get('search')?.trim() || '';

  // Synchronize category param if present in URL
  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam && catParam !== filters.category) {
      setFilters(prev => ({ ...prev, category: catParam }));
    }
  }, [searchParams]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsSnap = await getDocs(query(collection(db, 'products'), orderBy('created_at', 'desc')));
        const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);

        if (isAuthenticated && user) {
          const wishlistSnap = await getDocs(query(collection(db, 'wishlist'), where('user_id', '==', user.id)));
          setWishlistIds(wishlistSnap.docs.map(doc => doc.data().product_id));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map(p => p.category || 'Uncategorized')))];
  }, [products]);

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'all') count++;
    if (filters.selectedBrands.length > 0) count += filters.selectedBrands.length;
    if (filters.minPrice > 0 || filters.maxPrice < 5000) count++;
    if (filters.inStockOnly) count++;
    if (filters.minRating > 0) count++;
    return count;
  }, [filters]);

  // Filter & Sort Pipeline
  const processedProducts = useMemo(() => {
    let result = [...products];

    // 1. Search Filter (by title/name, description, category, brand)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    // 2. Category Filter (via sidebar or top pills)
    if (filters.category !== 'all') {
      result = result.filter(p => (p.category || 'Uncategorized').toLowerCase() === filters.category.toLowerCase());
    }

    // 3. Brand Filter (multi-select)
    if (filters.selectedBrands.length > 0) {
      result = result.filter(p => p.brand && filters.selectedBrands.includes(p.brand));
    }

    // 4. Price Range Filter
    if (filters.minPrice > 0 || filters.maxPrice < 5000) {
      result = result.filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice);
    }

    // 5. In-Stock Filter
    if (filters.inStockOnly) {
      result = result.filter(p => (p.stock === undefined || p.stock > 0));
    }

    // 6. Rating Filter
    if (filters.minRating > 0) {
      result = result.filter(p => (p.rating || 4.5) >= filters.minRating);
    }

    // 7. Sorting
    result.sort((a, b) => {
      if (sortBy === 'price-asc') {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortBy === 'price-desc') {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortBy === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      // Default: 'newest'
      const getTime = (date: any): number => {
        if (!date) return 0;
        if (typeof date === 'object' && typeof date.toMillis === 'function') {
          return date.toMillis();
        }
        if (typeof date === 'object' && typeof date.toDate === 'function') {
          return date.toDate().getTime();
        }
        return new Date(date).getTime() || 0;
      };
      return getTime(b.created_at) - getTime(a.created_at);
    });

    return result;
  }, [products, searchQuery, filters, sortBy]);

  const handleClearSearch = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('search');
    newParams.delete('category');
    setSearchParams(newParams);
  };

  const handleResetAllFilters = () => {
    setFilters(initialFilters);
    handleClearSearch();
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Slider Section */}
      <section className="relative h-[500px] md:h-[600px] flex items-center overflow-hidden bg-gray-900">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-0"
          >
            <div className="absolute inset-0 bg-black/40 z-10" />
            <img
              src={SLIDES[currentSlide].image}
              alt={SLIDES[currentSlide].title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-2xl"
            >
              <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6">
                {SLIDES[currentSlide].title}
              </h1>
              <p className="text-xl text-gray-200 mb-10 leading-relaxed">
                {SLIDES[currentSlide].description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#products"
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-500/25"
                >
                  {SLIDES[currentSlide].cta}
                  <ShoppingBag className="ml-2 h-5 w-5" />
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slider Controls */}
        <div className="absolute bottom-8 right-8 z-30 flex gap-4">
          <button
            onClick={prevSlide}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all border border-white/20"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all border border-white/20"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                currentSlide === idx ? 'w-8 bg-indigo-500' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Trending Products Component (Dynamic Social Proof & Best Sellers) */}
      <TrendingProducts />

      {/* Featured Products */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        {/* Header & Controls */}
        <div className="space-y-5 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Tag className="h-3.5 w-3.5" />
                <span>Curated Catalog</span>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Our Collection
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                Showing {processedProducts.length} {processedProducts.length === 1 ? 'item' : 'items'} available
              </p>
            </div>

            {/* Action Buttons: Mobile Filter Trigger + Sort Dropdown */}
            <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
              {/* Mobile Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="md:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-600 dark:hover:border-indigo-500 text-gray-700 dark:text-gray-200 font-bold text-xs rounded-2xl shadow-2xs transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Open filter sidebar"
              >
                <SlidersHorizontal className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="h-5 min-w-[20px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sorting Dropdown */}
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-3.5 py-2">
                <ArrowUpDown className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:inline">
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-xs font-bold text-gray-900 dark:text-white focus:outline-none cursor-pointer pr-2"
                >
                  <option value="newest" className="dark:bg-gray-900">Newest Arrivals</option>
                  <option value="price-asc" className="dark:bg-gray-900">Price: Low to High</option>
                  <option value="price-desc" className="dark:bg-gray-900">Price: High to Low</option>
                  <option value="name-asc" className="dark:bg-gray-900">Product Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Search Badge */}
          {searchQuery && (
            <div className="flex items-center justify-between p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl">
              <div className="flex items-center gap-2 text-sm text-indigo-900 dark:text-indigo-200">
                <Search className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>
                  Showing results for <strong className="font-semibold text-indigo-700 dark:text-indigo-300">"{searchQuery}"</strong>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-200/60 dark:bg-indigo-900/80 font-bold">
                  {processedProducts.length} items
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearSearch}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 px-2.5 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X className="h-3.5 w-3.5" />
                Clear search
              </button>
            </div>
          )}

          {/* Category Filter Horizontal Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <SlidersHorizontal className="h-4 w-4 text-gray-400 flex-shrink-0 mr-1 hidden sm:block" />
            {categories.map((category) => {
              const isSelected = category.toLowerCase() === filters.category.toLowerCase() || (category === 'All' && filters.category === 'all');
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      category: category === 'All' ? 'all' : category
                    }));
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap flex-shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Active Filters Pill Summary Bar */}
          {activeFilterCount > 0 && (
            <div className="p-3 bg-gray-50/80 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-between gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider">
                  Active Filters:
                </span>

                {/* Category chip */}
                {filters.category !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
                    <span>Category: {filters.category}</span>
                    <button
                      type="button"
                      onClick={() => setFilters(prev => ({ ...prev, category: 'all' }))}
                      className="hover:text-red-500 cursor-pointer"
                      title="Remove category filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {/* Brand chips */}
                {filters.selectedBrands.map(brand => (
                  <span key={brand} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
                    <span>Brand: {brand}</span>
                    <button
                      type="button"
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        selectedBrands: prev.selectedBrands.filter(b => b !== brand)
                      }))}
                      className="hover:text-red-500 cursor-pointer"
                      title={`Remove ${brand}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                {/* Price range chip */}
                {(filters.minPrice > 0 || filters.maxPrice < 5000) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
                    <span>Price: ${filters.minPrice} - ${filters.maxPrice}</span>
                    <button
                      type="button"
                      onClick={() => setFilters(prev => ({ ...prev, minPrice: 0, maxPrice: 5000 }))}
                      className="hover:text-red-500 cursor-pointer"
                      title="Reset price filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {/* In Stock Only chip */}
                {filters.inStockOnly && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
                    <span>In Stock Only</span>
                    <button
                      type="button"
                      onClick={() => setFilters(prev => ({ ...prev, inStockOnly: false }))}
                      className="hover:text-red-500 cursor-pointer"
                      title="Remove in-stock filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {/* Min Rating chip */}
                {filters.minRating > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{filters.minRating}+ Stars</span>
                    <button
                      type="button"
                      onClick={() => setFilters(prev => ({ ...prev, minRating: 0 }))}
                      className="hover:text-red-500 cursor-pointer"
                      title="Reset rating filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>

              {/* Reset All Button */}
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="inline-flex items-center gap-1 font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-md px-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset all</span>
              </button>
            </div>
          )}
        </div>

        {/* Two-Column Layout: Filter Sidebar (Desktop) + Product Catalog */}
        <div className="flex items-start gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden md:block w-72 lg:w-80 flex-shrink-0 sticky top-24 self-start">
            <ProductFilterSidebar
              products={products}
              filters={filters}
              onFilterChange={setFilters}
              onReset={handleResetAllFilters}
              totalFilteredCount={processedProducts.length}
            />
          </div>

          {/* Product Grid / Loading / Empty State */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <ProductGridSkeleton count={6} />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {processedProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, delay: index * 0.03 }}
                      >
                        <ProductCard 
                          product={product} 
                          isWishlistedInitial={wishlistIds.includes(product.id)} 
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {processedProducts.length === 0 && (
                  <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border border-gray-100 dark:border-gray-800 p-8">
                    <ShoppingBag className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">No matching products</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto mb-6">
                      {searchQuery 
                        ? `No items match "${searchQuery}". Try adjusting your filters or search keywords.`
                        : 'No products meet the selected filter criteria. Try expanding your price range or resetting filters.'
                      }
                    </p>
                    <button
                      type="button"
                      onClick={handleResetAllFilters}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Filter Slide-Over Drawer */}
        <AnimatePresence>
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileFilterOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="relative w-full max-w-sm bg-white dark:bg-gray-900 h-full overflow-y-auto z-10 shadow-2xl p-5"
              >
                <ProductFilterSidebar
                  products={products}
                  filters={filters}
                  onFilterChange={setFilters}
                  onReset={handleResetAllFilters}
                  totalFilteredCount={processedProducts.length}
                  isMobileDrawer={true}
                  onCloseMobileDrawer={() => setIsMobileFilterOpen(false)}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* Recently Viewed Products Section */}
      <RecentlyViewedSection />
    </div>
  );
}
