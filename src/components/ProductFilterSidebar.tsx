import React, { useState, useMemo } from 'react';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X, 
  DollarSign, 
  Tag, 
  Award, 
  Star, 
  CheckCircle2, 
  Sparkles,
  Search
} from 'lucide-react';
import { Product } from '../types';
import { useCurrency } from '../context/CurrencyContext';

export interface FilterState {
  category: string;
  selectedBrands: string[];
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  minRating: number; // 0 = all, 4 = 4+ stars, etc.
}

interface ProductFilterSidebarProps {
  products: Product[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  totalFilteredCount: number;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

const PRICE_PRESETS = [
  { label: 'All Prices', min: 0, max: 5000 },
  { label: 'Under $100', min: 0, max: 100 },
  { label: '$100 to $500', min: 100, max: 500 },
  { label: '$500 to $1,000', min: 500, max: 1000 },
  { label: '$1,000+', min: 1000, max: 5000 }
];

export default function ProductFilterSidebar({
  products,
  filters,
  onFilterChange,
  onReset,
  totalFilteredCount,
  isMobileDrawer = false,
  onCloseMobileDrawer
}: ProductFilterSidebarProps) {
  const { formatPrice } = useCurrency();

  // Collapsible sections
  const [openSections, setOpenSections] = useState({
    price: true,
    category: true,
    brand: true,
    rating: true,
    stock: true
  });

  const [brandSearch, setBrandSearch] = useState('');

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Extract unique categories with product counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  const uniqueCategories = useMemo(() => {
    return Object.keys(categoryCounts).sort();
  }, [categoryCounts]);

  // Extract unique brands with product counts
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      if (p.brand) {
        counts[p.brand] = (counts[p.brand] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const uniqueBrands = useMemo(() => {
    return Object.keys(brandCounts).sort();
  }, [brandCounts]);

  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return uniqueBrands;
    return uniqueBrands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase().trim()));
  }, [uniqueBrands, brandSearch]);

  // Calculate absolute min & max prices across the catalog
  const catalogPriceLimits = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 2000 };
    const prices = products.map(p => p.price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices))
    };
  }, [products]);

  // Check active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'all') count++;
    if (filters.selectedBrands.length > 0) count += filters.selectedBrands.length;
    if (filters.minPrice > 0 || filters.maxPrice < 5000) count++;
    if (filters.inStockOnly) count++;
    if (filters.minRating > 0) count++;
    return count;
  }, [filters]);

  // Handlers
  const handleCategorySelect = (cat: string) => {
    onFilterChange({
      ...filters,
      category: cat === filters.category ? 'all' : cat
    });
  };

  const handleBrandToggle = (brand: string) => {
    const isSelected = filters.selectedBrands.includes(brand);
    const updated = isSelected
      ? filters.selectedBrands.filter(b => b !== brand)
      : [...filters.selectedBrands, brand];
    onFilterChange({
      ...filters,
      selectedBrands: updated
    });
  };

  const handlePricePreset = (min: number, max: number) => {
    onFilterChange({
      ...filters,
      minPrice: min,
      maxPrice: max
    });
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) || 0;
    onFilterChange({
      ...filters,
      minPrice: Math.min(val, filters.maxPrice)
    });
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) || 0;
    onFilterChange({
      ...filters,
      maxPrice: Math.max(val, filters.minPrice)
    });
  };

  return (
    <div className={`bg-white dark:bg-gray-900 ${isMobileDrawer ? 'p-6' : 'p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs'}`}>
      {/* Header with Title & Reset */}
      <div className="flex items-center justify-between pb-5 border-b border-gray-100 dark:border-gray-800 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white">
                  {activeFilterCount}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-gray-400">
              {totalFilteredCount} matching {totalFilteredCount === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
              title="Clear all filters"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}

          {isMobileDrawer && onCloseMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Close filter drawer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
            Active Filters
          </span>
          <div className="flex flex-wrap gap-1.5">
            {filters.category !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900">
                <span>{filters.category}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, category: 'all' })}
                  className="hover:text-indigo-900 dark:hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.selectedBrands.map(b => (
              <span
                key={b}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900"
              >
                <span>{b}</span>
                <button
                  type="button"
                  onClick={() => handleBrandToggle(b)}
                  className="hover:text-indigo-900 dark:hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {(filters.minPrice > 0 || filters.maxPrice < 5000) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900">
                <span>{formatPrice(filters.minPrice)} - {formatPrice(filters.maxPrice)}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, minPrice: 0, maxPrice: 5000 })}
                  className="hover:text-indigo-900 dark:hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.inStockOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900">
                <span>In Stock Only</span>
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, inStockOnly: false })}
                  className="hover:text-indigo-900 dark:hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.minRating > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900">
                <span>{filters.minRating}★ & Above</span>
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, minRating: 0 })}
                  className="hover:text-indigo-900 dark:hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* 1. Price Range Section */}
        <div className="space-y-3 pb-5 border-b border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Price Range</span>
            </span>
            {openSections.price ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {openSections.price && (
            <div className="space-y-4 pt-1">
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                {PRICE_PRESETS.map((preset) => {
                  const isSelected = filters.minPrice === preset.min && filters.maxPrice === preset.max;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handlePricePreset(preset.min, preset.max)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Slider Controls */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={catalogPriceLimits.min}
                  max={Math.max(catalogPriceLimits.max, 2000)}
                  step={20}
                  value={filters.maxPrice}
                  onChange={(e) => onFilterChange({ ...filters, maxPrice: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                  <span>Min: {formatPrice(filters.minPrice)}</span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">Max: {formatPrice(filters.maxPrice)}</span>
                </div>
              </div>

              {/* Numeric Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1">Min ($)</label>
                  <input
                    type="number"
                    min={0}
                    max={filters.maxPrice}
                    value={filters.minPrice}
                    onChange={handleMinPriceChange}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1">Max ($)</label>
                  <input
                    type="number"
                    min={filters.minPrice}
                    max={10000}
                    value={filters.maxPrice}
                    onChange={handleMaxPriceChange}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Category Section */}
        <div className="space-y-3 pb-5 border-b border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => toggleSection('category')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Category</span>
            </span>
            {openSections.category ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {openSections.category && (
            <div className="space-y-1 pt-1">
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, category: 'all' })}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  filters.category === 'all'
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                }`}
              >
                <span>All Categories</span>
                <span className="text-[11px] font-mono text-gray-400">
                  {products.length}
                </span>
              </button>

              {uniqueCategories.map((cat) => {
                const isSelected = filters.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <span className="text-[11px] font-mono text-gray-400">
                      {categoryCounts[cat] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Brand Section */}
        <div className="space-y-3 pb-5 border-b border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => toggleSection('brand')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Brand</span>
            </span>
            {openSections.brand ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {openSections.brand && (
            <div className="space-y-2 pt-1">
              {uniqueBrands.length > 5 && (
                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder="Search brand..."
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-400"
                  />
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                </div>
              )}

              <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                {filteredBrands.length === 0 ? (
                  <p className="text-[11px] text-gray-400 py-1">No matching brands</p>
                ) : (
                  filteredBrands.map((brand) => {
                    const isSelected = filters.selectedBrands.includes(brand);
                    return (
                      <label
                        key={brand}
                        className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleBrandToggle(brand)}
                            className="rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                          />
                          <span className={isSelected ? 'font-bold text-indigo-600 dark:text-indigo-400' : ''}>
                            {brand}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-gray-400">
                          {brandCounts[brand] || 0}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. Availability / In-Stock Toggle */}
        <div className="space-y-3 pb-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>In Stock Only</span>
            </span>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, inStockOnly: !filters.inStockOnly })}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                filters.inStockOnly ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              aria-label="Toggle in-stock only"
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  filters.inStockOnly ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 5. Rating Section */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => toggleSection('rating')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>Customer Rating</span>
            </span>
            {openSections.rating ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {openSections.rating && (
            <div className="space-y-1 pt-1">
              {[
                { rating: 0, label: 'All Ratings' },
                { rating: 4, label: '4 Stars & Above' },
                { rating: 3, label: '3 Stars & Above' },
                { rating: 2, label: '2 Stars & Above' }
              ].map(opt => {
                const isSelected = filters.minRating === opt.rating;
                return (
                  <button
                    key={opt.rating}
                    type="button"
                    onClick={() => onFilterChange({ ...filters, minRating: opt.rating })}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {opt.rating > 0 && (
                        <div className="flex text-amber-400">
                          {[...Array(opt.rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400" />
                          ))}
                        </div>
                      )}
                      <span>{opt.label}</span>
                    </span>
                    {isSelected && <Check className="h-3 w-3 text-amber-600 dark:text-amber-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isMobileDrawer && onCloseMobileDrawer && (
        <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Show {totalFilteredCount} Products
          </button>
        </div>
      )}
    </div>
  );
}
