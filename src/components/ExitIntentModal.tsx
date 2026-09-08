import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Sparkles, Copy, Check, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function ExitIntentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { showSuccess, showInfo } = useToast();

  const COUPON_CODE = 'SAVE20';

  useEffect(() => {
    // Check if exit intent was already shown this session
    const hasSeenExitIntent = sessionStorage.getItem('has_seen_exit_intent');
    if (hasSeenExitIntent) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse moves within 15px of the top edge
      if (e.clientY <= 15) {
        const alreadyTriggered = sessionStorage.getItem('has_seen_exit_intent');
        if (!alreadyTriggered) {
          sessionStorage.setItem('has_seen_exit_intent', 'true');
          setIsOpen(true);
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    // Also close on escape key
    const handleEscape = () => setIsOpen(false);
    window.addEventListener('app:escape-pressed', handleEscape);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('app:escape-pressed', handleEscape);
    };
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(COUPON_CODE);
      setIsCopied(true);
      showSuccess(`Coupon code "${COUPON_CODE}" copied! Apply it at checkout.`, 'Discount Unlocked');
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      showInfo(`Coupon code is ${COUPON_CODE}`, 'Discount Code');
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'exit_intent_popup' }),
      });

      if (res.ok) {
        setIsSubscribed(true);
        showSuccess('You\'re subscribed! Use code SAVE20 for 20% off.', 'Welcome Discount');
      } else {
        setIsSubscribed(true);
      }
    } catch (err) {
      setIsSubscribed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-10"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-20 cursor-pointer"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Top Accent Gradient Header */}
            <div className="bg-gradient-to-r from-red-600 via-indigo-600 to-indigo-700 p-8 text-white text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              <div className="inline-flex items-center justify-center p-3 bg-white/15 backdrop-blur-md rounded-2xl mb-3 ring-1 ring-white/30">
                <Gift className="h-8 w-8 text-amber-300" />
              </div>

              <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-[11px] font-extrabold rounded-full uppercase tracking-wider mb-2">
                Special One-Time Offer
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Wait! Don't Leave Empty Handed
              </h2>
              <p className="text-indigo-100 text-sm mt-1.5 max-w-sm mx-auto">
                Get an instant <span className="font-extrabold text-amber-300">20% discount</span> on your order today!
              </p>
            </div>

            {/* Content Area */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Coupon Box */}
              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4 border border-dashed border-indigo-300 dark:border-indigo-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-left">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Your Promo Code</p>
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-wider">{COUPON_CODE}</p>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Email Signup or Success View */}
              {!isSubscribed ? (
                <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Want secret VIP deals and flash sales?
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
                    >
                      {isSubmitting ? '...' : 'Claim 20%'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <p className="font-semibold">You're on the VIP list! Code <strong className="font-bold">{COUPON_CODE}</strong> is ready to use.</p>
                </div>
              )}

              {/* Bottom Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue Shopping</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="py-3 px-4 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer text-center"
                >
                  No thanks, I'll pay full price
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
