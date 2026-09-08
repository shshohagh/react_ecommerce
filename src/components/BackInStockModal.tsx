import React, { useState, useEffect } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { formatPrice } from '../lib/utils';
import { 
  X, 
  Bell, 
  Mail, 
  CheckCircle2, 
  Sparkles, 
  Send,
  PackageX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

interface BackInStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  selectedAttributes?: Record<string, string>;
}

export default function BackInStockModal({
  isOpen,
  onClose,
  product,
  selectedAttributes = {}
}: BackInStockModalProps) {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      showWarning('Please enter a valid email address.', 'Invalid Email');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        product_id: product.id,
        product_name: product.name,
        product_image: product.image,
        product_price: product.price,
        product_category: product.category || 'General',
        email: cleanEmail,
        user_id: user?.id || null,
        user_name: user?.name || null,
        selected_attributes: selectedAttributes,
        status: 'pending',
        created_at: Timestamp.now()
      };

      await addDoc(collection(db, 'stock_notifications'), payload);

      setIsSuccess(true);
      showSuccess(
        `We will notify ${cleanEmail} immediately when ${product.name} is back in stock!`,
        'Alert Configured'
      );
    } catch (err) {
      console.error('Error creating stock notification:', err);
      showError('Failed to register stock notification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={handleModalClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 z-10 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleModalClose}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Content */}
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header */}
                <div className="space-y-2 text-center">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                    <Bell className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                    Notify Me When Available
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    This item is currently out of stock. Leave your email and we'll notify you the moment inventory is replenished.
                  </p>
                </div>

                {/* Product Summary Card */}
                <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{product.name}</h4>
                    <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{formatPrice(product.price)}</p>
                    
                    {/* Selected Options / Variation */}
                    {Object.keys(selectedAttributes).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(selectedAttributes).map(([k, v]) => (
                          <span key={k} className="text-[10px] bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200/50 flex items-center gap-1">
                    <PackageX className="h-3 w-3" />
                    Out of Stock
                  </span>
                </div>

                {/* Email Input Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    We will never share your email or send spam. One-time notification only.
                  </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {submitting ? (
                      <span className="inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Notify Me</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-1">
                    You're On The List!
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    We've saved your request. As soon as <strong>{product.name}</strong> is back in stock, we'll send a direct restock alert to <strong>{email}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Back to Product
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
