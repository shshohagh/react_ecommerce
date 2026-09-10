import React, { useState, useMemo } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Review } from '../types';
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  LogIn, 
  Send, 
  Sparkles, 
  Filter, 
  User, 
  ThumbsUp, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';

interface ProductReviewsProps {
  productId: string;
  productName: string;
  reviews: Review[];
  onReviewAdded: (newReview: Review) => void;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  5: 'Exceptional - Exceeded expectations!',
  4: 'Good - Highly satisfied with quality',
  3: 'Average - Met basic expectations',
  2: 'Fair - Needs some improvement',
  1: 'Poor - Not satisfied'
};

export default function ProductReviews({
  productId,
  productName,
  reviews,
  onReviewAdded
}: ProductReviewsProps) {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | 'all'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Statistics calculation
  const stats = useMemo(() => {
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

    const average = Number((sum / reviews.length).toFixed(1));
    return { average, total: reviews.length, counts };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    if (selectedRatingFilter === 'all') return reviews;
    return reviews.filter(r => Math.round(r.rating) === selectedRatingFilter);
  }, [reviews, selectedRatingFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanComment = comment.trim();

    if (!cleanComment) {
      showWarning('Please enter your written feedback comments.', 'Feedback Required');
      return;
    }

    if (cleanComment.length < 5) {
      showWarning('Please provide at least 5 characters of feedback.', 'Too Short');
      return;
    }

    const reviewerName = isAuthenticated && user
      ? (user.name || user.email.split('@')[0])
      : guestName.trim() || 'Verified Customer';

    const reviewerEmail = isAuthenticated && user
      ? user.email
      : guestEmail.trim();

    setIsSubmitting(true);
    try {
      const reviewPayload = {
        product_id: productId,
        customer_name: reviewerName,
        rating: rating,
        comment: cleanComment,
        user_id: user?.id || 'guest_user',
        user_email: reviewerEmail,
        created_at: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'reviews'), reviewPayload);
      const createdReview: Review = {
        id: docRef.id,
        ...reviewPayload
      } as unknown as Review;

      onReviewAdded(createdReview);
      setComment('');
      setRating(5);
      if (!isAuthenticated) {
        setGuestName('');
        setGuestEmail('');
      }

      showSuccess(
        `Thank you ${reviewerName}! Your ${rating}-star rating and review have been published.`,
        'Review Published ⭐'
      );
    } catch (err) {
      console.error('Error submitting review:', err);
      showError('Failed to publish your review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Just now';
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    if (date && typeof date === 'object' && 'toDate' in date) return date.toDate().toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  return (
    <section className="pt-10 border-t border-gray-100 dark:border-gray-800 space-y-10" id="product-reviews">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <MessageSquare className="h-4 w-4" />
            <span>Community Feedback</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Ratings & Customer Reviews
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real feedback from verified purchasers of {productName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Rating Breakdown Card & Reviews List (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Summary Breakdown Card */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              {/* Score Display */}
              <div className="sm:col-span-5 text-center sm:text-left sm:border-r border-gray-100 dark:border-gray-800 sm:pr-6">
                <div className="text-5xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                  {stats.average > 0 ? stats.average.toFixed(1) : '0.0'}
                </div>
                <div className="flex items-center justify-center sm:justify-start text-amber-400 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(stats.average)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-200 dark:text-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Based on {stats.total} verified {stats.total === 1 ? 'review' : 'reviews'}
                </p>
              </div>

              {/* Star Distribution Histogram */}
              <div className="sm:col-span-7 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.counts[star] || 0;
                  const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  const isFiltered = selectedRatingFilter === star;

                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRatingFilter(isFiltered ? 'all' : star)}
                      className={`w-full flex items-center gap-3 text-xs group cursor-pointer py-1 px-2 rounded-xl transition-colors ${
                        isFiltered
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 font-bold text-indigo-600 dark:text-indigo-400'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-600 dark:text-gray-400'
                      }`}
                      title={`Filter by ${star} star reviews`}
                    >
                      <span className="w-12 text-left flex items-center gap-1 font-semibold flex-shrink-0">
                        {star} <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" />
                      </span>
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFiltered ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-amber-400'
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

            {/* Filter Reset Pill */}
            {selectedRatingFilter !== 'all' && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  Showing only <strong>{selectedRatingFilter} Star</strong> reviews ({filteredReviews.length})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedRatingFilter('all')}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  Show all reviews
                </button>
              </div>
            )}
          </div>

          {/* List of Reviews */}
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-10 text-center border border-gray-100 dark:border-gray-800 space-y-2">
                <MessageSquare className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="font-bold text-gray-900 dark:text-white text-sm">
                  {reviews.length === 0 ? 'No customer reviews yet' : `No ${selectedRatingFilter}-star reviews found`}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs max-w-sm mx-auto">
                  {reviews.length === 0
                    ? 'Be the first authenticated customer to share your thoughts and star rating!'
                    : 'Try clearing the star filter to see all feedback.'}
                </p>
              </div>
            ) : (
              filteredReviews.map((rev) => (
                <motion.div
                  key={rev.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                        {(rev.customer_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                            {rev.customer_name || 'Verified Customer'}
                          </h4>
                          <span className="inline-flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-950/50 px-2 py-0.5 rounded-full border border-green-200/50 dark:border-green-800/40">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          {formatDate(rev.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Star Rating Display */}
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= rev.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-200 dark:text-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                    {rev.comment}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Interactive Review Submission Form (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 shadow-xs sticky top-24 space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                  Write a Review
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  Verified Ratings
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Share your experience to help other shoppers make informed decisions.
              </p>
            </div>

            {/* Authenticated User Status Banner */}
            {isAuthenticated && user ? (
              <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {user.name || user.email.split('@')[0]}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate max-w-[180px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
                  <CheckCircle2 className="h-3 w-3" />
                  Authenticated
                </span>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>Verified Purchaser Tip</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  Sign in with your customer account to earn a "Verified Buyer" badge on your review.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In Now →</span>
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Unauthenticated Name & Email Fields */}
              {!isAuthenticated && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Jordan Smith"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Your Email <span className="text-[10px] font-normal text-gray-400">(Optional for receipt matching)</span>
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="e.g. jordan@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>
              )}

              {/* Star Rating Interactive Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Overall Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= (hoveredRating !== null ? hoveredRating : rating);
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onMouseEnter={() => setHoveredRating(starVal)}
                        onMouseLeave={() => setHoveredRating(null)}
                        onClick={() => setRating(starVal)}
                        className="focus:outline-none transition-transform hover:scale-125 cursor-pointer p-1"
                        aria-label={`Rate ${starVal} star${starVal > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-200 dark:text-gray-700'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-2">
                    {hoveredRating !== null ? hoveredRating : rating} / 5
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">
                  {RATING_DESCRIPTIONS[hoveredRating !== null ? hoveredRating : rating]}
                </p>
              </div>

              {/* Written Feedback Textarea */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Your Feedback & Review
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {comment.length} / 500
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you think of the product quality, fit, style, and delivery? Be honest and descriptive..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400 resize-none leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Publishing Review...</span>
                  </span>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Review & Rating</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
