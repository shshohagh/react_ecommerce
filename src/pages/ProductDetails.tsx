import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Product, Review, ProductVariation } from '../types';
import { formatPrice } from '../lib/utils';
import { ArrowLeft, CheckCircle2, AlertCircle, Star, MessageSquare, Heart, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ id: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    address: ''
  });

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [currentVariation, setCurrentVariation] = useState<ProductVariation | null>(null);

  const [reviewForm, setReviewForm] = useState({
    customer_name: '',
    rating: 5,
    comment: ''
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, reviewsRes, variationsRes] = await Promise.all([
          fetch(`/api/products/${id}`),
          fetch(`/api/products/${id}/reviews`),
          fetch(`/api/products/${id}/variations`)
        ]);

        if (!productRes.ok) throw new Error('Product not found');
        
        const productData = await productRes.json();
        const reviewsData = await reviewsRes.json();
        const variationsData = await variationsRes.json();

        setProduct(productData);
        setReviews(reviewsData);
        setVariations(variationsData);

        if (isAuthenticated) {
          const wishlistRes = await fetch('/api/wishlist', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (wishlistRes.ok) {
            const wishlistData = await wishlistRes.json();
            setIsWishlisted(wishlistData.some((p: Product) => p.id === parseInt(id!)));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isAuthenticated, token]);

  useEffect(() => {
    if (Object.keys(selectedAttributes).length > 0) {
      const match = variations.find(v => {
        const vAttrs = JSON.parse(v.attributes);
        return Object.entries(selectedAttributes).every(([key, val]) => vAttrs[key] === val);
      });
      setCurrentVariation(match || null);
    } else {
      setCurrentVariation(null);
    }
  }, [selectedAttributes, variations]);

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      alert('Please log in to add items to your wishlist.');
      return;
    }

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        const res = await fetch(`/api/wishlist/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setIsWishlisted(false);
      } else {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ product_id: parseInt(id!) })
        });
        if (res.ok) setIsWishlisted(true);
      }
    } catch (err) {
      console.error('Wishlist error:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
// ... existing handleSubmit ...
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          product_id: parseInt(id!),
          attributes: JSON.stringify(selectedAttributes)
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to place order');
      }

      const data = await res.json();
      setSuccess({ id: data.id });
      setFormData({ customer_name: '', email: '', phone: '', address: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);

    try {
      const res = await fetch(`/api/products/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm)
      });

      if (!res.ok) throw new Error('Failed to submit review');

      const newReview = await res.json();
      setReviews([newReview, ...reviews]);
      setReviewForm({ customer_name: '', rating: 5, comment: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center bg-white dark:bg-gray-950 transition-colors duration-300">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Product not found</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 dark:text-indigo-400 hover:underline">
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to collection
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Product Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-900"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Product Info & Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">{product.name}</h1>
              <button
                onClick={toggleWishlist}
                disabled={wishlistLoading}
                className={`p-3 rounded-2xl transition-all duration-300 ${
                  isWishlisted 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950'
                }`}
              >
                <Heart className={`h-6 w-6 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-6">{formatPrice(product.price)}</p>
            <div className="prose prose-indigo dark:prose-invert text-gray-500 dark:text-gray-400 max-w-none">
              <p>{product.description}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm transition-colors duration-300">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order Now</h2>

            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-2xl p-6 text-center"
                >
                  <CheckCircle2 className="h-12 w-12 text-green-500 dark:text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-2">Order Placed Successfully!</h3>
                  <p className="text-green-700 dark:text-green-400 text-sm mb-4">Your Order ID is: <span className="font-bold">#{success.id}</span></p>
                  <p className="text-green-700 dark:text-green-400 text-sm mb-6">We'll contact you soon to confirm your delivery.</p>
                  
                  <div className="flex flex-col gap-3">
                    <Link
                      to={`/track-order/${success.id}`}
                      className="w-full py-3 bg-indigo-600 dark:bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all text-center"
                    >
                      Track Your Order
                    </Link>
                    <button
                      onClick={() => setSuccess(null)}
                      className="text-sm font-bold text-green-700 dark:text-green-400 hover:underline"
                    >
                      Place another order
                    </button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {product.attributes && (
                    <div className="space-y-4 mb-6">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex justify-between items-center">
                        Select Options
                        {currentVariation && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            currentVariation.quantity > 0 ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                          }`}>
                            {currentVariation.quantity > 0 ? `In Stock: ${currentVariation.quantity}` : 'Out of Stock'}
                          </span>
                        )}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(JSON.parse(product.attributes)).map(([key, value]) => {
                          const options = (value as string).split(',').map(v => v.trim());
                          return (
                            <div key={key} className="space-y-2">
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">{key}</label>
                              <div className="flex flex-wrap gap-2">
                                {options.map(opt => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setSelectedAttributes({ ...selectedAttributes, [key]: opt })}
                                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                                      selectedAttributes[key] === opt
                                        ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-600 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
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

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                    <input
                      required
                      type="text"
                      value={formData.customer_name}
                      onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                    <input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Delivery Address</label>
                    <textarea
                      required
                      rows={3}
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                      placeholder="123 Street Name, City, Country"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => addToCart(product, selectedAttributes)}
                      disabled={submitting || (currentVariation !== null && currentVariation.quantity === 0)}
                      className="w-full py-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add to Cart
                    </button>
                    <button
                      disabled={submitting || (currentVariation !== null && currentVariation.quantity === 0)}
                      type="submit"
                      className="w-full py-4 bg-indigo-600 dark:bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
                    >
                      {submitting ? 'Processing...' : (currentVariation !== null && currentVariation.quantity === 0 ? 'Out of Stock' : 'Confirm Order')}
                    </button>
                  </div>
                </form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Reviews Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mt-20">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <MessageSquare className="mr-3 h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              Customer Reviews ({reviews.length})
            </h2>
          </div>

          <div className="space-y-6">
            {reviews.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800">
                <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mr-3">
                        {review.customer_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{review.customer_name}</h4>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{review.comment}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm sticky top-8 transition-colors duration-300">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Write a Review</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
                <input
                  required
                  type="text"
                  value={reviewForm.customer_name}
                  onChange={e => setReviewForm({ ...reviewForm, customer_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Your Comment</label>
                <textarea
                  required
                  rows={4}
                  value={reviewForm.comment}
                  onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="What did you think about this product?"
                />
              </div>

              <button
                disabled={reviewSubmitting}
                type="submit"
                className="w-full py-4 bg-gray-900 dark:bg-indigo-600 text-white font-bold rounded-xl hover:bg-black dark:hover:bg-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
