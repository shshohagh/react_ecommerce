import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Review } from '../types';
import { ArrowRight, Heart, Star, ShoppingCart, Zap, ArrowLeftRight, Eye } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';
import { addRecentlyViewed } from '../utils/recentlyViewed';
import QuickViewModal from './QuickViewModal';

interface ProductCardProps {
  product: Product;
  isWishlistedInitial?: boolean;
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToCompare, isInCompare } = useCompare();
  const { formatPrice } = useCurrency();
  const { showSuccess } = useToast();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const isWishlisted = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);

  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      try {
        const q = query(collection(db, 'reviews'), where('product_id', '==', product.id));
        const snap = await getDocs(q);
        if (!isMounted) return;
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        setReviews(data);
        if (data.length > 0) {
          const sum = data.reduce((acc: number, r: Review) => acc + (r.rating || 5), 0);
          setAverageRating(sum / data.length);
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      }
    };
    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, [product.id]);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistLoading(true);
    try {
      await toggleWishlist(product);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleProductClick = () => {
    addRecentlyViewed(product);
  };

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col relative focus-within:ring-2 focus-within:ring-indigo-500/40">
      {/* Top Floating Actions (Wishlist & Compare) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCompare(product);
          }}
          title={isCompared ? 'Remove from comparison' : 'Compare product'}
          aria-label={isCompared ? `Remove ${product.name} from comparison` : `Compare ${product.name}`}
          className={`p-2 rounded-xl backdrop-blur-md transition-all duration-200 active:scale-90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
            isCompared
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-white/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 shadow-sm'
          }`}
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>

        <button
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className={`p-2 rounded-xl backdrop-blur-md transition-all duration-300 active:scale-90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
            isWishlisted 
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
              : 'bg-white/80 dark:bg-gray-800/80 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-gray-700 shadow-sm'
          }`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="aspect-square overflow-hidden relative group/img">
        <Link 
          to={`/product/${product.id}`} 
          onClick={handleProductClick}
          className="block w-full h-full"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        </Link>

        {product.is_featured && (
          <span className="absolute top-3 left-3 bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Featured
          </span>
        )}

        {/* Quick View Button on Thumbnail */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addRecentlyViewed(product);
            setIsQuickViewOpen(true);
          }}
          id={`quick-view-btn-${product.id}`}
          className="absolute inset-x-4 bottom-3 z-10 flex items-center justify-center gap-2 py-2 px-3 bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white rounded-xl shadow-md text-xs font-bold opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 focus-visible:opacity-100 sm:translate-y-2 group-hover:translate-y-0 group-focus-within:translate-y-0 focus:translate-y-0 transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-xs border border-gray-100 dark:border-gray-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          title="Quick View Product"
          aria-label={`Quick view ${product.name}`}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Quick View</span>
        </button>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
          <Link
            to={`/product/${product.id}`}
            onClick={handleProductClick}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm"
          >
            {product.name}
          </Link>
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">
          {product.description}
        </p>
        
        <div className="flex items-center gap-1 mb-4">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3.5 w-3.5 ${
                  star <= Math.round(averageRating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-200 dark:text-gray-700 fill-gray-200 dark:fill-gray-700'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 ml-1">
            {averageRating > 0 ? averageRating.toFixed(1) : 'No reviews'}
            {reviews.length > 0 && ` (${reviews.length})`}
          </span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(product.price)}</span>
          <Link
            to={`/product/${product.id}`}
            onClick={handleProductClick}
            className="inline-flex items-center text-sm font-semibold text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md p-1"
          >
            Details
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-auto">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(product);
              showSuccess(`${product.name} added to your cart!`, 'Cart Updated');
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add to Cart
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addRecentlyViewed(product);
              if (product.attributes) {
                navigate(`/product/${product.id}`);
              } else {
                addToCart(product);
                showSuccess(`Proceeding to checkout with ${product.name}...`, 'Checkout Ready');
                navigate('/checkout');
              }
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-500/25 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label={`Order ${product.name} now`}
          >
            <Zap className="h-3.5 w-3.5" />
            Order Now
          </button>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </div>
  );
}
