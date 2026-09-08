import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, getDoc, getDocs, query, where, addDoc, doc, Timestamp, orderBy, deleteDoc, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Review, ProductVariation } from '../types';
import { formatPrice } from '../lib/utils';
import { 
  ArrowLeft, 
  Star, 
  MessageSquare, 
  Heart, 
  ShoppingBag, 
  ShoppingCart, 
  Share2, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  LogIn, 
  Filter, 
  Layers,
  ThumbsUp,
  Tag,
  Bell,
  BellRing,
  QrCode,
  ArrowLeftRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductDetailsSkeleton } from '../components/Skeletons';
import ProductCard from '../components/ProductCard';
import ImageZoom from '../components/ImageZoom';
import ShareModal from '../components/ShareModal';
import PriceAlertModal from '../components/PriceAlertModal';
import ProductQRCodeModal from '../components/ProductQRCodeModal';
import BackInStockModal from '../components/BackInStockModal';
import LiveInventoryCounter, { notifyItemAddedToCart } from '../components/LiveInventoryCounter';
import FrequentlyBoughtTogether from '../components/FrequentlyBoughtTogether';
import { addRecentlyViewed } from '../utils/recentlyViewed';

const RATING_LABELS: Record<number, string> = {
  5: 'Excellent - Highly Recommended',
  4: 'Good - Satisfied with quality',
  3: 'Average - Met basic expectations',
  2: 'Below Average - Could be better',
  1: 'Poor - Not recommended'
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { addToCompare, isInCompare } = useCompare();
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const { isInWishlist, toggleWishlist: toggleWishlistContext } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [allCatalogProducts, setAllCatalogProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const isWishlisted = id ? isInWishlist(id) : false;

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [currentVariation, setCurrentVariation] = useState<ProductVariation | null>(null);

  // Review Form & Filter States
  const [reviewForm, setReviewForm] = useState({
    name: '',
    email: '',
    rating: 5,
    comment: ''
  });
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | 'all'>('all');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Modals (Share, Price Alert, QR Code, Back in Stock)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPriceAlertOpen, setIsPriceAlertOpen] = useState(false);
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [isBackInStockOpen, setIsBackInStockOpen] = useState(false);

  // Escape key event listener for modals
  useEffect(() => {
    const handleEscape = () => {
      setIsShareModalOpen(false);
      setIsPriceAlertOpen(false);
      setIsQRCodeModalOpen(false);
      setIsBackInStockOpen(false);
    };
    window.addEventListener('app:escape-pressed', handleEscape);
    return () => window.removeEventListener('app:escape-pressed', handleEscape);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);

    const fetchData = async () => {
      if (!id) return;
      try {
        // 1. Fetch current product
        const productSnap = await getDoc(doc(db, 'products', id));
        if (!productSnap.exists()) throw new Error('Product not found');
        
        const productData = { id: productSnap.id, ...productSnap.data() } as Product;
        setProduct(productData);

        // Record in Recently Viewed
        addRecentlyViewed(productData);

        // 2. Fetch reviews
        const reviewsSnap = await getDocs(query(
          collection(db, 'reviews'), 
          where('product_id', '==', id), 
          orderBy('created_at', 'desc')
        ));
        setReviews(reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));

        // 3. Fetch variations
        const variationsSnap = await getDocs(query(
          collection(db, 'product_variations'), 
          where('product_id', '==', id)
        ));
        setVariations(variationsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductVariation)));

        // 4. Fetch Related and Catalog Products for Recommendations
        try {
          const catalogSnap = await getDocs(query(collection(db, 'products'), limit(20)));
          const allItems = catalogSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
          setAllCatalogProducts(allItems);

          let items = allItems.filter(p => p.category === productData.category && p.id !== id);

          // If fewer than 3 items in same category, backfill with top products
          if (items.length < 3) {
            const fallbackItems = allItems.filter(p => p.id !== id && !items.some(existing => existing.id === p.id));
            items = [...items, ...fallbackItems].slice(0, 4);
          }

          setRelatedProducts(items.slice(0, 4));
        } catch (err) {
          console.warn('Failed to load related products:', err);
        }

      } catch (err) {
        console.error('Error fetching product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isAuthenticated, user]);

  // Track product variation selection
  useEffect(() => {
    if (Object.keys(selectedAttributes).length > 0) {
      const match = variations.find(v => {
        const vAttrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes;
        return Object.entries(selectedAttributes).every(([key, val]) => vAttrs[key] === val);
      });
      setCurrentVariation(match || null);
    } else {
      setCurrentVariation(null);
    }
  }, [selectedAttributes, variations]);

  // Wishlist toggle
  const toggleWishlist = async () => {
    if (!product) return;
    setWishlistLoading(true);
    try {
      await toggleWishlistContext(product);
    } catch (err) {
      console.error('Wishlist error:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  // Review submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !product) return;

    if (!reviewForm.comment.trim()) {
      showWarning('Please enter your feedback comments.', 'Feedback Required');
      return;
    }

    const reviewerName = (isAuthenticated && user?.name)
      ? user.name
      : (isAuthenticated && user?.email)
      ? user.email.split('@')[0]
      : (reviewForm.name.trim() || 'Verified Customer');

    setReviewSubmitting(true);
    try {
      const reviewData = {
        product_id: id,
        user_id: user?.id || 'guest_user',
        user_email: user?.email || reviewForm.email.trim() || '',
        customer_name: reviewerName,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
        created_at: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'reviews'), reviewData);
      const newReview = { id: docRef.id, ...reviewData } as unknown as Review;
      setReviews(prev => [newReview, ...prev]);
      setReviewForm({ name: '', email: '', rating: 5, comment: '' });
      showSuccess('Thank you! Your review and rating have been posted.', 'Review Published ⭐');
    } catch (err) {
      console.error('Error submitting review:', err);
      showError('Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Ratings calculation & breakdown
  const ratingStats = useMemo(() => {
    if (reviews.length === 0) {
      return { average: 0, total: 0, counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    reviews.forEach(r => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      counts[rounded] = (counts[rounded] || 0) + 1;
      sum += r.rating || 5;
    });
    return {
      average: Number((sum / reviews.length).toFixed(1)),
      total: reviews.length,
      counts
    };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    if (selectedRatingFilter === 'all') return reviews;
    return reviews.filter(r => Math.round(r.rating) === selectedRatingFilter);
  }, [reviews, selectedRatingFilter]);

  const formatDate = (date: any) => {
    if (!date) return 'Just now';
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    if (date && typeof date === 'object' && 'toDate' in date) return date.toDate().toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <ProductDetailsSkeleton />;
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center bg-white dark:bg-gray-950 transition-colors duration-300">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Product not found</h2>
        <p className="text-gray-500 text-sm mb-6">The requested product could not be located in our catalog.</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
        >
          Back to Collection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Collection
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">Home</Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-300 font-semibold">{product.category || 'Collection'}</span>
        </div>
      </div>

      {/* Main Product Showcase (Image with Zoom & Product Information) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Left: Interactive Image with Zoom Magnifier & Lightbox */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <ImageZoom src={product.image} alt={product.name} />

          {/* Product Badges */}
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-2">
            <div className="flex items-center gap-1.5 font-medium">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Authentic Guaranteed</span>
            </div>
            {product.brand && (
              <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold">
                Brand: {product.brand}
              </span>
            )}
          </div>
        </motion.div>

        {/* Right: Product Details & Options */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-6"
        >
          <div>
            {/* Title & Action Buttons */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                  {product.category || 'Lifestyle'}
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {product.name}
                </h1>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* QR Code Scan on Mobile Button */}
                <button
                  type="button"
                  onClick={() => setIsQRCodeModalOpen(true)}
                  title="Generate QR code to open on mobile"
                  className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
                >
                  <QrCode className="h-5 w-5" />
                </button>

                {/* Compare Button */}
                <button
                  type="button"
                  onClick={() => addToCompare(product)}
                  title={isInCompare(product.id) ? 'Remove from compare' : 'Add to comparison'}
                  className={`p-3 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer shadow-xs ${
                    isInCompare(product.id)
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                  }`}
                >
                  <ArrowLeftRight className="h-5 w-5" />
                </button>

                {/* Social Share Button */}
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  title="Share product with friends"
                  className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
                >
                  <Share2 className="h-5 w-5" />
                </button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={toggleWishlist}
                  disabled={wishlistLoading}
                  title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                  className={`p-3 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer shadow-xs ${
                    isWishlisted 
                      ? 'bg-red-500 text-white shadow-md shadow-red-500/25' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Rating Summary Snippet */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(ratingStats.average)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-200 dark:text-gray-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                {ratingStats.average > 0 ? ratingStats.average : 'No ratings yet'}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                ({ratingStats.total} {ratingStats.total === 1 ? 'review' : 'reviews'})
              </span>
            </div>

            {/* Price & Status & Alert Triggers */}
            {(() => {
              const isOutOfStock = (currentVariation !== null && currentVariation.quantity === 0) || 
                product.stock_status === 'out_of_stock' || 
                (typeof (product as any).stock === 'number' && (product as any).stock <= 0) || 
                (product as any).in_stock === false;

              return (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-4 bg-gray-50/80 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl sm:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                        {formatPrice(product.price)}
                      </span>
                      {isOutOfStock ? (
                        <span className="text-xs text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/60 px-2.5 py-1 rounded-full border border-red-200/60 dark:border-red-800/40">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="text-xs text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-950/60 px-2.5 py-1 rounded-full border border-green-200/60 dark:border-green-800/40">
                          In Stock
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Price Alert Action Button */}
                      <button
                        type="button"
                        onClick={() => setIsPriceAlertOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Set an alert if this item goes on discount"
                      >
                        <Bell className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Price Drop Alert</span>
                      </button>

                      {/* Notify Me When Available Button if out of stock */}
                      {isOutOfStock && (
                        <button
                          type="button"
                          onClick={() => setIsBackInStockOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
                        >
                          <BellRing className="h-3.5 w-3.5 animate-bounce" />
                          <span>Restock Alert</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Real-Time Live Inventory & In-Cart Activity Counter */}
                  <LiveInventoryCounter
                    productId={product.id}
                    initialStock={currentVariation?.quantity || (product as any).stock || 6}
                    isOutOfStock={isOutOfStock}
                  />
                </>
              );
            })()}

            {/* Product Description */}
            <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-t border-b border-gray-100 dark:border-gray-800 py-4">
              <p>{product.description}</p>
            </div>
          </div>

          {/* Options & Cart Box */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 space-y-6 shadow-sm">
            {product.attributes && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex justify-between items-center">
                  <span>Product Options</span>
                  {currentVariation && (
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                      currentVariation.quantity > 0 ? 'bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300'
                    }`}>
                      {currentVariation.quantity > 0 ? `In Stock: ${currentVariation.quantity}` : 'Out of Stock'}
                    </span>
                  )}
                </h3>
                <div className="space-y-3">
                  {Object.entries(JSON.parse(product.attributes)).map(([key, value]) => {
                    const options = (value as string).split(',').map(v => v.trim());
                    return (
                      <div key={key} className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">{key}</label>
                        <div className="flex flex-wrap gap-2">
                          {options.map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setSelectedAttributes({ ...selectedAttributes, [key]: opt })}
                              className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                selectedAttributes[key] === opt
                                  ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 text-white shadow-sm'
                                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-600 dark:hover:border-indigo-400'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons & Out-Of-Stock Handling */}
            {(() => {
              const isOutOfStock = (currentVariation !== null && currentVariation.quantity === 0) || 
                product.stock_status === 'out_of_stock' || 
                (typeof (product as any).stock === 'number' && (product as any).stock <= 0) || 
                (product as any).in_stock === false;

              if (isOutOfStock) {
                return (
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsBackInStockOpen(true)}
                      className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <BellRing className="h-5 w-5 animate-bounce" />
                      <span>Notify Me When Available</span>
                    </button>
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                      We will email you automatically when new stock arrives.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(product, selectedAttributes);
                      notifyItemAddedToCart(product.id);
                      showSuccess(`${product.name} added to your cart!`, 'Cart Updated');
                    }}
                    className="w-full py-3.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/60 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Add to Cart</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(product, selectedAttributes);
                      notifyItemAddedToCart(product.id);
                      showSuccess(`Proceeding to checkout with ${product.name}...`, 'Checkout Ready');
                      navigate('/checkout');
                    }}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-bold rounded-xl active:scale-95 transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Order Now</span>
                  </button>
                </div>
              );
            })()}
          </div>
        </motion.div>
      </div>

      {/* Frequently Bought Together (AI Recommendation Bundle) */}
      <FrequentlyBoughtTogether
        currentProduct={product}
        allProducts={allCatalogProducts}
      />

      {/* Related Products Section (Cross-Selling) */}
      {relatedProducts.length > 0 && (
        <section className="pt-8 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Layers className="h-4 w-4" />
                <span>Complete the Look</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                Related Products
              </h2>
            </div>
            <Link
              to={`/?search=${encodeURIComponent(product.category || '')}#products`}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View More in {product.category || 'Category'} →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(relProduct => (
              <ProductCard
                key={relProduct.id}
                product={relProduct}
                isWishlistedInitial={isInWishlist(relProduct.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Customer Reviews & Rating Feedback System */}
      <section className="pt-8 border-t border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Rating Statistics & Reviews List */}
          <div className="lg:col-span-7 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <span>Customer Reviews ({reviews.length})</span>
              </h2>
            </div>

            {/* Rating Breakdown Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                {/* Score Big Display */}
                <div className="sm:col-span-5 text-center sm:text-left sm:border-r border-gray-100 dark:border-gray-800 sm:pr-6">
                  <div className="text-5xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                    {ratingStats.average > 0 ? ratingStats.average : '0.0'}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start text-amber-400 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= Math.round(ratingStats.average)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200 dark:text-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Based on {ratingStats.total} verified feedback {ratingStats.total === 1 ? 'rating' : 'ratings'}
                  </p>
                </div>

                {/* Star Distribution Progress Bars */}
                <div className="sm:col-span-7 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingStats.counts[star] || 0;
                    const percent = ratingStats.total > 0 ? (count / ratingStats.total) * 100 : 0;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSelectedRatingFilter(selectedRatingFilter === star ? 'all' : star)}
                        className={`w-full flex items-center gap-3 text-xs group cursor-pointer py-0.5 rounded-lg transition-colors ${
                          selectedRatingFilter === star ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <span className="w-12 text-left flex items-center gap-1 font-semibold flex-shrink-0">
                          {star} <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" />
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              selectedRatingFilter === star ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-amber-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-mono text-[11px] text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rating Filter Filter Tags */}
              {selectedRatingFilter !== 'all' && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Showing only <strong>{selectedRatingFilter} Star</strong> reviews ({filteredReviews.length})
                  </span>
                  <button
                    onClick={() => setSelectedRatingFilter('all')}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    Clear filter
                  </button>
                </div>
              )}
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {filteredReviews.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-10 text-center border border-gray-100 dark:border-gray-800">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {reviews.length === 0 
                      ? 'No reviews yet. Be the first verified customer to share your thoughts!' 
                      : `No reviews found with ${selectedRatingFilter} stars.`}
                  </p>
                </div>
              ) : (
                filteredReviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                          {(review.customer_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                              {review.customer_name || 'Verified Customer'}
                            </h4>
                            <span className="inline-flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-950/50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3" />
                              Verified Purchase
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {formatDate(review.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-200 dark:text-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {review.comment}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Authenticated Review Submission Form */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 shadow-xs sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                  Write a Review
                </h3>
                <span className="text-xs text-gray-400">Feedback</span>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {isAuthenticated && user ? (
                  /* User Profile Badge */
                  <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                        {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {user.name || user.email.split('@')[0]}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{user.email}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  </div>
                ) : (
                  /* Guest User Name & Optional Email */
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={reviewForm.name}
                        onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                        placeholder="e.g. Alex Morgan"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                        Email Address <span className="text-[10px] font-normal text-gray-400">(optional)</span>
                      </label>
                      <input
                        type="email"
                        value={reviewForm.email}
                        onChange={(e) => setReviewForm({ ...reviewForm, email: e.target.value })}
                        placeholder="e.g. alex@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                )}

                {/* Rating Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Select Your Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(null)}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="focus:outline-none transition-transform hover:scale-110 cursor-pointer p-1"
                        title={`${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`h-7 w-7 ${
                            star <= (hoveredStar !== null ? hoveredStar : reviewForm.rating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-200 dark:text-gray-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold h-4">
                    {RATING_LABELS[hoveredStar !== null ? hoveredStar : reviewForm.rating]}
                  </p>
                </div>

                {/* Comment Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Your Feedback & Review
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reviewForm.comment}
                    onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none placeholder:text-gray-400"
                    placeholder="Share what you liked, product quality, fit, or performance..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  disabled={reviewSubmitting}
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  {reviewSubmitting ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ThumbsUp className="h-4 w-4" />
                      <span>Submit Review & Rating</span>
                    </>
                  )}
                </button>

                {!isAuthenticated && (
                  <p className="text-[11px] text-gray-400 text-center">
                    Have an account?{' '}
                    <Link to="/admin/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                      Sign in
                    </Link>{' '}
                    to receive a Verified Reviewer badge.
                  </p>
                )}
              </form>
            </div>
          </div>

        </div>
      </section>

      {/* Social Media Sharing Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        productName={product.name}
        productPrice={product.price}
        productImage={product.image}
      />

      {/* Price Drop Alert Modal */}
      <PriceAlertModal
        isOpen={isPriceAlertOpen}
        onClose={() => setIsPriceAlertOpen(false)}
        product={product}
      />

      {/* Mobile QR Code Scanner Modal */}
      <ProductQRCodeModal
        isOpen={isQRCodeModalOpen}
        onClose={() => setIsQRCodeModalOpen(false)}
        product={product}
      />

      {/* Out of Stock Restock Notification Modal */}
      <BackInStockModal
        isOpen={isBackInStockOpen}
        onClose={() => setIsBackInStockOpen(false)}
        product={product}
        selectedAttributes={selectedAttributes}
      />
    </div>
  );
}
