import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tag, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Clock, 
  ArrowRight, 
  Pause, 
  Play, 
  Percent, 
  Flame, 
  Truck, 
  Gift, 
  Zap 
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export interface PromoOffer {
  id: string;
  badge: string;
  badgeIcon?: 'flame' | 'truck' | 'gift' | 'zap' | 'percent';
  title: string;
  description: string;
  code: string;
  discount: string;
  category?: string;
  targetId?: string;
  highlightText?: string;
  expiresInHours?: number;
}

export const DEFAULT_PROMO_OFFERS: PromoOffer[] = [
  {
    id: 'promo-1',
    badge: 'FLASH SALE',
    badgeIcon: 'flame',
    title: 'Flash Tech Savings',
    description: 'Get an instant 20% discount on all premium laptops & audio gear.',
    code: 'TECH20',
    discount: '20% OFF',
    category: 'Laptops',
    targetId: 'products',
    highlightText: 'Store-wide tech savings'
  },
  {
    id: 'promo-2',
    badge: 'FREE SHIPPING',
    badgeIcon: 'truck',
    title: 'Zero-Cost Delivery',
    description: 'Free expedited 2-day delivery on all orders over $50.',
    code: 'FREESHIP',
    discount: 'FREE SHIPPING',
    targetId: 'products',
    highlightText: 'Express courier included'
  },
  {
    id: 'promo-3',
    badge: 'NEW ARRIVALS',
    badgeIcon: 'percent',
    title: 'Fresh Seasonal Styles',
    description: 'Save 15% on brand-new smart accessories & mobile gadgets.',
    code: 'NEW15',
    discount: '15% OFF',
    category: 'Accessories',
    targetId: 'products',
    highlightText: 'New styles just dropped'
  },
  {
    id: 'promo-4',
    badge: 'BUNDLE & SAVE',
    badgeIcon: 'gift',
    title: 'Smart Gadget Multi-Buy',
    description: 'Purchase any 2 or more devices and get $30 automatic checkout credit.',
    code: 'BUNDLE30',
    discount: '$30 CREDIT',
    targetId: 'products',
    highlightText: 'Instant cart discount'
  },
  {
    id: 'promo-5',
    badge: 'VIP REWARDS',
    badgeIcon: 'zap',
    title: 'Exclusive Member Bonus',
    description: 'Extra 10% off store-wide for all registered community accounts.',
    code: 'VIPEXTRA',
    discount: 'EXTRA 10%',
    targetId: 'products',
    highlightText: 'Stackable savings'
  }
];

interface PromotionalBannerProps {
  offers?: PromoOffer[];
  autoCycleInterval?: number; // ms
  onApplyCategory?: (category: string) => void;
  className?: string;
}

export default function PromotionalBanner({
  offers = DEFAULT_PROMO_OFFERS,
  autoCycleInterval = 5500,
  onApplyCategory,
  className = ''
}: PromotionalBannerProps) {
  const { showSuccess } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Countdown timer in seconds (ticking down)
  const [remainingSeconds, setRemainingSeconds] = useState(6 * 3600 + 42 * 60 + 15);

  const activeOffer = offers[currentIndex] || offers[0];

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds(prev => (prev > 0 ? prev - 1 : 24 * 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % offers.length);
  }, [offers.length]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + offers.length) % offers.length);
  }, [offers.length]);

  useEffect(() => {
    if (isPaused || offers.length <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, autoCycleInterval);
    return () => clearInterval(interval);
  }, [isPaused, offers.length, autoCycleInterval, handleNext]);

  const handleCopyCode = async (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      showSuccess(`Coupon code "${code}" copied to clipboard!`);
      setTimeout(() => setCopiedCode(null), 3000);
    } catch {
      setCopiedCode(code);
      showSuccess(`Code: ${code}`);
      setTimeout(() => setCopiedCode(null), 3000);
    }
  };

  const handleCtaClick = () => {
    if (activeOffer.category && onApplyCategory) {
      onApplyCategory(activeOffer.category);
    }
    const target = document.getElementById(activeOffer.targetId || 'products');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderBadgeIcon = (type?: string) => {
    switch (type) {
      case 'flame':
        return <Flame className="h-3 w-3 text-amber-300" />;
      case 'truck':
        return <Truck className="h-3 w-3 text-emerald-300" />;
      case 'gift':
        return <Gift className="h-3 w-3 text-pink-300" />;
      case 'zap':
        return <Zap className="h-3 w-3 text-yellow-300" />;
      default:
        return <Percent className="h-3 w-3 text-indigo-300" />;
    }
  };

  if (isDismissed) {
    return (
      <aside aria-label="Discount Offers Bar" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-end">
        <button
          type="button"
          onClick={() => setIsDismissed(false)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all shadow-2xs active:scale-95 cursor-pointer"
        >
          <Tag className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>View Store Offers ({offers.length})</span>
          <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px]">
            {activeOffer.discount}
          </span>
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Promotional Announcement"
      className={`relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/60 shadow-md ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute -top-12 left-1/4 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 right-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 relative z-10">
        <div className="flex items-center justify-between gap-3">
          {/* Left Arrow Controls */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label="Previous promotional offer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Center Dynamic Offer Content */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeOffer.id}
                initial={{ opacity: 0, y: direction === 1 ? 12 : -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: direction === 1 ? -12 : 12 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-center md:text-left"
              >
                {/* Offer Badges */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 shadow-2xs">
                    {renderBadgeIcon(activeOffer.badgeIcon)}
                    <span>{activeOffer.badge}</span>
                  </span>

                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black tracking-wide bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-sm">
                    {activeOffer.discount}
                  </span>
                </div>

                {/* Offer Text */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <p className="text-xs sm:text-sm font-semibold text-gray-100 flex items-center gap-1.5">
                    <span className="font-extrabold text-white">{activeOffer.title}:</span>
                    <span className="text-gray-300 hidden lg:inline">{activeOffer.description}</span>
                    <span className="text-gray-300 lg:hidden truncate max-w-[240px] sm:max-w-xs">{activeOffer.description}</span>
                  </p>

                  {/* Countdown Timer */}
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-amber-300 text-[11px] font-mono font-bold tracking-tight">
                    <Clock className="h-3 w-3 text-amber-400 animate-pulse" />
                    <span>{formatCountdown(remainingSeconds)}</span>
                  </div>
                </div>

                {/* Promo Code & Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap justify-center mt-1 md:mt-0">
                  <div className="inline-flex items-center rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 p-0.5 pl-2.5 transition-all shadow-2xs">
                    <span className="text-[11px] font-mono font-black text-amber-300 tracking-wider">
                      {activeOffer.code}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopyCode(activeOffer.code, e)}
                      className={`ml-2 px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                        copiedCode === activeOffer.code
                          ? 'bg-emerald-500 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                      title="Copy coupon code"
                    >
                      {copiedCode === activeOffer.code ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCtaClick}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white text-slate-950 hover:bg-gray-100 font-extrabold text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Shop Deal</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={handleNext}
              className="hidden sm:inline-flex p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label="Next promotional offer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden md:inline-flex"
              aria-label={isPaused ? 'Resume banner rotation' : 'Pause banner rotation'}
              title={isPaused ? 'Resume auto-cycle' : 'Pause auto-cycle'}
            >
              {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label="Dismiss promotional banner"
              title="Hide banner"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {offers.map((offer, idx) => (
            <button
              key={offer.id}
              type="button"
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentIndex === idx 
                  ? 'w-6 bg-indigo-400' 
                  : 'w-1.5 bg-white/25 hover:bg-white/50'
              }`}
              aria-label={`Go to offer ${idx + 1}: ${offer.title}`}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
