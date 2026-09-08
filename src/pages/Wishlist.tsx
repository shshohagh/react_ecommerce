import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  ShoppingBag, 
  ArrowLeft, 
  Trash2, 
  BellRing, 
  ShoppingCart, 
  CheckCircle2, 
  AlertCircle, 
  Cloud, 
  LogIn, 
  Sparkles, 
  Lock, 
  User, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ProductGridSkeleton } from '../components/Skeletons';
import { useWishlistStockAlerts } from '../hooks/useWishlistStockAlerts';

export default function Wishlist() {
  const { user, isAuthenticated, loginWithGoogle, login } = useAuth();
  const { wishlist, removeFromWishlist, clearWishlist, loading, isCloudSynced } = useWishlist();
  const { showSuccess, showError, showInfo } = useToast();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Auth modal state for unauthenticated users wishing to sync
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { isProductOutOfStock, triggerRestockAlert } = useWishlistStockAlerts(wishlist);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
      setShowAuthModal(false);
      showSuccess('Signed in successfully! Your favorites are now synced across devices.', 'Account Connected');
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setAuthError(err.message || 'Google sign-in failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      await login(authEmail, authPassword);
      setShowAuthModal(false);
      showSuccess('Signed in! Your favorites are now synced across devices.', 'Account Connected');
    } catch (err: any) {
      console.error('Email sign in error:', err);
      setAuthError(err.message || 'Invalid credentials. You can also sign in with Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-2 shimmer" />
            <div className="h-8 w-44 bg-gray-200 dark:bg-gray-800 rounded-lg shimmer" />
          </div>
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded-full shimmer" />
        </div>
        <ProductGridSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link
            to="/"
            className="inline-flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shopping
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">My Wishlist</h1>
            {isCloudSynced ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80">
                <Cloud className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Firestore Cloud Synced</span>
              </span>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 hover:bg-amber-100 transition-colors cursor-pointer"
                title="Click to sign in and sync across all your devices"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Sync to Cloud Account</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-full text-sm font-bold border border-indigo-100 dark:border-indigo-900">
            {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'}
          </div>

          {wishlist.length > 0 && (
            <button
              onClick={clearWishlist}
              className="px-3.5 py-2 text-xs font-bold text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Remove all items from wishlist"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Cloud Sync Status Banner */}
      {!isAuthenticated && wishlist.length > 0 && (
        <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-indigo-950/40 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl flex-shrink-0 shadow-sm">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Save to your Firestore account for cross-device access
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                Currently saved on this browser. Sign in so your favorites are safely backed up in the cloud and accessible anywhere.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <LogIn className="h-4 w-4" />
            <span>Connect Account & Sync</span>
          </button>
        </div>
      )}

      {/* Back In Stock Smart Alert Banner */}
      <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-indigo-50 dark:from-amber-950/30 dark:to-indigo-950/30 rounded-2xl border border-amber-200/60 dark:border-indigo-900/50 flex items-start sm:items-center gap-3.5">
        <div className="p-2 bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 rounded-xl flex-shrink-0">
          <BellRing className="h-5 w-5" />
        </div>
        <div className="flex-grow">
          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
            Smart Back-in-Stock Notifications Active
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
            You will receive instant notifications whenever an out-of-stock item in your wishlist becomes available again.
          </p>
        </div>
      </div>

      {/* Empty State */}
      {wishlist.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-16 text-center shadow-sm space-y-6">
          <div className="h-20 w-20 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
            <Heart className="h-10 w-10" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your wishlist is empty</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Tap the heart icon on any product in our store to save it to your wishlist and track availability across devices.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Explore Products</span>
            </Link>
            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In to Access Cloud Favorites</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Wishlist Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {wishlist.map((product, index) => {
            const isOOS = isProductOutOfStock(product);

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col relative"
              >
                <div className="aspect-square overflow-hidden relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />

                  {/* Stock Status Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    {isOOS ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/90 text-white backdrop-blur-xs shadow-sm">
                        <AlertCircle className="h-3 w-3" />
                        <span>Out of Stock</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600/90 text-white backdrop-blur-xs shadow-sm">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>In Stock</span>
                      </span>
                    )}
                  </div>

                  {/* Cloud Synced Pin */}
                  {isCloudSynced && (
                    <div className="absolute bottom-4 left-4 z-10">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                        <Cloud className="h-3 w-3 text-indigo-400" />
                        <span>Cloud Saved</span>
                      </span>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(product.id, product.name)}
                    className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-red-500 rounded-xl shadow-sm hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
                    title="Remove from wishlist"
                    aria-label={`Remove ${product.name} from wishlist`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>{product.category || 'Category'}</span>
                    {product.brand && <span>{product.brand}</span>}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{product.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">
                    {product.description}
                  </p>

                  {/* Out of Stock restock notification row */}
                  {isOOS ? (
                    <div className="mb-4 p-3 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200/70 dark:border-amber-900/50 space-y-2">
                      <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-bold">
                        <span className="flex items-center gap-1.5">
                          <BellRing className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                          <span>Stock Alert Active</span>
                        </span>
                        <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">Auto-notifying</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerRestockAlert(product)}
                        className="w-full py-1.5 px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer active:scale-95"
                        title="Simulate stock restock to trigger toast notification"
                      >
                        <BellRing className="h-3.5 w-3.5" />
                        <span>Simulate Restock Alert</span>
                      </button>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(product.price)}</span>
                    <div className="flex items-center gap-2">
                      {!isOOS && (
                        <button
                          type="button"
                          onClick={() => {
                            addToCart(product);
                            showSuccess(`Added "${product.name}" to cart!`, 'Cart Updated');
                          }}
                          className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-xl transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                          title="Add to cart"
                          aria-label={`Add ${product.name} to cart`}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </button>
                      )}
                      <Link
                        to={`/product/${product.id}`}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Cross-Device Account Sync Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                  <Cloud className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                  Sync Wishlist Across Devices
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Connect your account to save your favorite products to Firestore and access them anytime, anywhere.
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* 1-Click Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="w-full py-3 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all flex items-center justify-center gap-3 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" referrerPolicy="no-referrer" />
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-gray-100 dark:border-gray-800" />
                <span className="px-3 bg-white dark:bg-gray-900 text-[10px] uppercase font-bold text-gray-400 tracking-wider absolute">
                  Or with email
                </span>
              </div>

              {/* Quick Email Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    required
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {authLoading ? 'Signing in...' : 'Sign In & Sync'}
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  Continue Browsing Locally
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
