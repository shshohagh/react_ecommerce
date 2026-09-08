import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../lib/utils';
import {
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Truck,
  ShieldCheck,
  ArrowLeft,
  MapPin,
  FileText,
  ShieldAlert,
  Mail,
  Tag,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ShippingArea } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { getDeviceId } from '../lib/fingerprint';
import { doc, getDoc } from 'firebase/firestore';

interface DiscountRule {
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minOrder?: number;
  description: string;
}

const PREDEFINED_DISCOUNT_CODES: Record<string, DiscountRule> = {
  SAVE20: {
    code: 'SAVE20',
    type: 'percentage',
    value: 20,
    description: '20% off entire order',
  },
  WELCOME10: {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    description: '10% welcome discount',
  },
  FLASH30: {
    code: 'FLASH30',
    type: 'percentage',
    value: 30,
    minOrder: 100,
    description: '30% off orders over $100',
  },
  VIP50: {
    code: 'VIP50',
    type: 'fixed',
    value: 50,
    minOrder: 100,
    description: '$50 off orders over $100',
  },
  FREESHIP: {
    code: 'FREESHIP',
    type: 'free_shipping',
    value: 0,
    description: '100% Free Shipping on your delivery',
  },
};

export default function Checkout() {
  const { cart, clearCart, cartCount } = useCart();
  const { showSuccess, showError, showInfo } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ id: string; data: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shippingAreas, setShippingAreas] = useState<ShippingArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<ShippingArea | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');

  // Discount code states
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountRule | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    address: '',
    payment_method: 'cod',
    shipping_area_id: ''
  });

  useEffect(() => {
    const fetchShippingAreas = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'shipping_areas'), orderBy('name', 'asc')));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShippingArea));
        setShippingAreas(data);
        if (data.length > 0) {
          setSelectedArea(data[0]);
          setFormData(prev => ({ ...prev, shipping_area_id: data[0].id }));
        }
      } catch (err) {
        console.error('Failed to fetch shipping areas:', err);
      }
    };
    fetchShippingAreas();
    
    // Get device ID on load
    getDeviceId().then(id => setDeviceId(id));
  }, []);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Calculate discount and shipping based on promo code
  let discountAmount = 0;
  let effectiveShippingCost = selectedArea ? selectedArea.cost : 0;

  if (appliedDiscount) {
    if (appliedDiscount.type === 'percentage') {
      discountAmount = (subtotal * appliedDiscount.value) / 100;
    } else if (appliedDiscount.type === 'fixed') {
      discountAmount = Math.min(subtotal, appliedDiscount.value);
    } else if (appliedDiscount.type === 'free_shipping') {
      effectiveShippingCost = 0;
    }
  }

  const total = Math.max(0, subtotal - discountAmount) + effectiveShippingCost;

  const handleApplyCoupon = (codeToApply?: string) => {
    setCouponError(null);
    const targetCode = (codeToApply || couponInput).trim().toUpperCase();

    if (!targetCode) {
      setCouponError('Please enter a discount code.');
      return;
    }

    const matchedDiscount = PREDEFINED_DISCOUNT_CODES[targetCode];

    if (!matchedDiscount) {
      setCouponError(`Coupon code "${targetCode}" is invalid.`);
      showError(`Coupon code "${targetCode}" is not recognized.`, 'Invalid Code');
      return;
    }

    if (matchedDiscount.minOrder && subtotal < matchedDiscount.minOrder) {
      const msg = `Code "${targetCode}" requires a minimum order of ${formatPrice(matchedDiscount.minOrder)}.`;
      setCouponError(msg);
      showError(msg, 'Minimum Order Required');
      return;
    }

    setAppliedDiscount(matchedDiscount);
    setCouponInput(targetCode);
    showSuccess(
      `Discount code "${matchedDiscount.code}" applied: ${matchedDiscount.description}!`,
      'Coupon Applied 🎉'
    );
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(null);
    setCouponInput('');
    setCouponError(null);
    showInfo('Discount code removed.', 'Coupon Removed');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'shipping_area_id') {
      const area = shippingAreas.find(a => a.id === value);
      if (area) setSelectedArea(area);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // 1. Check if phone is blocked
      const phoneBlockRef = doc(db, 'blocked_customers', formData.phone.replace(/\s+/g, ''));
      const phoneBlockSnap = await getDoc(phoneBlockRef);
      if (phoneBlockSnap.exists()) {
        const msg = 'This phone number has been blocked due to suspicious activity.';
        setError(msg);
        showError(msg, 'Order Blocked');
        setSubmitting(false);
        return;
      }

      // 2. Check if device is blocked
      if (deviceId) {
        const deviceBlockRef = doc(db, 'blocked_devices', deviceId);
        const deviceBlockSnap = await getDoc(deviceBlockRef);
        if (deviceBlockSnap.exists()) {
          const msg = 'This device has been blocked due to suspicious activity.';
          setError(msg);
          showError(msg, 'Order Blocked');
          setSubmitting(false);
          return;
        }
      }

      const orderData = {
        ...formData,
        device_id: deviceId,
        items: cart.map(item => ({
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          attributes: JSON.stringify(item.selectedAttributes || {})
        })),
        product_name: cart.length > 1 ? `${cart[0].name} + ${cart.length - 1} more` : cart[0].name,
        product_price: total,
        subtotal,
        discount_code: appliedDiscount?.code || null,
        discount_amount: discountAmount,
        shipping_cost: effectiveShippingCost,
        total,
        status: 'pending',
        created_at: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setOrderSuccess({ id: docRef.id, data: orderData });
      clearCart();
      showSuccess(`Order #${docRef.id} placed successfully!`, 'Purchase Completed');

      // Trigger automated email receipt via backend SMTP service
      if (formData.email && formData.email.includes('@')) {
        try {
          fetch('/api/send-order-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              order: {
                id: docRef.id,
                ...orderData
              },
              items: orderData.items
            })
          }).catch(e => console.warn('Email dispatch warning:', e));
        } catch (e) {
          console.warn('Failed to invoke receipt endpoint:', e);
        }
      }
    } catch (err) {
      console.error('Order placement error:', err);
      setError('Failed to place order. Please try again.');
      showError('Failed to place order. Please check connection and try again.');
      try {
        handleFirestoreError(err, OperationType.CREATE, 'orders');
      } catch (e) {
        // Error already logged and handled by handleFirestoreError
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 dark:border-gray-800 text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-full">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Order Placed Successfully!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-lg">
            Thank you for your purchase. Your order ID is <span className="font-bold text-indigo-600 dark:text-indigo-400">#{orderSuccess.id}</span>
          </p>

          {orderSuccess.data.email && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold border border-indigo-100 dark:border-indigo-800 mb-8">
              <Mail className="h-3.5 w-3.5" />
              <span>An automated order receipt & tracking details have been sent to <strong>{orderSuccess.data.email}</strong></span>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Order Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{orderSuccess.data.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{orderSuccess.data.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shipping Address</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{orderSuccess.data.address}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Items</p>
                <div className="space-y-3">
                  {orderSuccess.data.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 dark:text-white">{item.quantity}x</span>
                        <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Total Amount</span>
                <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{formatPrice(orderSuccess.data.total)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
            >
              Back to Home
            </button>
            <button
              onClick={() => navigate(`/track-order/${orderSuccess.id}`)}
              className="px-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              Track Order
            </button>
            <button
              onClick={() => navigate(`/invoice/${orderSuccess.id}`)}
              className="px-8 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            >
              <FileText className="h-5 w-5" />
              Invoice
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cartCount === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your cart is empty</h2>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
        >
          Go Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate('/cart')}
        className="flex items-center text-sm font-bold text-gray-500 hover:text-indigo-600 mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Cart
      </button>

      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-12">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Checkout Form */}
        <div className="space-y-8">
          <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                <Truck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shipping Information</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                  <input
                    required
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Shipping Area</label>
                  <div className="relative">
                    <select
                      required
                      name="shipping_area_id"
                      value={formData.shipping_area_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                    >
                      <option value="" disabled>Select Shipping Area</option>
                      {shippingAreas.map(area => (
                        <option key={area.id} value={area.id}>
                          {area.name} (BDT {area.cost})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Shipping Address</label>
                  <textarea
                    required
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="123 Main St, City, Country"
                  />
                </div>
              </div>

              <div className="pt-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                    <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Method</h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <label className="relative flex items-center p-4 border-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl cursor-pointer">
                    <input type="radio" name="payment_method" value="cod" defaultChecked className="hidden" />
                    <div className="flex-grow">
                      <p className="font-bold text-gray-900 dark:text-white">Cash on Delivery</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Pay when you receive your order</p>
                    </div>
                    <CheckCircle2 className="h-6 w-6 text-indigo-600" />
                  </label>
                  <div className="p-4 border-2 border-gray-100 dark:border-gray-800 rounded-2xl opacity-50 cursor-not-allowed">
                    <p className="font-bold text-gray-400">Credit / Debit Card</p>
                    <p className="text-xs text-gray-400">Coming soon</p>
                  </div>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl flex items-center gap-2"
                >
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 mt-8 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {submitting ? 'Placing Order...' : 'Complete Purchase'}
              </button>
            </form>
          </section>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {cart.map((item) => (
                <div key={`${item.id}-${JSON.stringify(item.selectedAttributes)}`} className="flex gap-4">
                  <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Discount Code Entry Box */}
            <div className="py-5 border-t border-b border-gray-100 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="checkout-coupon-input"
                  className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Tag className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Promo / Discount Code</span>
                </label>
                {appliedDiscount && (
                  <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    <span>Applied</span>
                  </span>
                )}
              </div>

              {appliedDiscount ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black font-mono text-emerald-800 dark:text-emerald-300">
                          {appliedDiscount.code}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200/70 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200 font-bold">
                          {appliedDiscount.type === 'percentage'
                            ? `${appliedDiscount.value}% OFF`
                            : appliedDiscount.type === 'fixed'
                            ? `${formatPrice(appliedDiscount.value)} OFF`
                            : 'FREE SHIPPING'}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        {appliedDiscount.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1.5 text-emerald-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    title="Remove discount code"
                    aria-label="Remove discount code"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <input
                        id="checkout-coupon-input"
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          if (couponError) setCouponError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        placeholder="e.g. SAVE20, WELCOME10"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono font-bold text-gray-900 dark:text-white uppercase placeholder:normal-case placeholder:font-sans placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus-visible:outline-none transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-indigo-600/20 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      Apply
                    </button>
                  </div>

                  {couponError && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{couponError}</span>
                    </p>
                  )}

                  {/* Predefined mock coupons suggestions */}
                  <div className="pt-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Available Promo Codes (Click to apply):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.values(PREDEFINED_DISCOUNT_CODES).map((promo) => (
                        <button
                          key={promo.code}
                          type="button"
                          onClick={() => handleApplyCoupon(promo.code)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                          title={promo.description}
                        >
                          <Tag className="h-2.5 w-2.5" />
                          <span>{promo.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-3 pt-5">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="flex items-center gap-1">
                    <span>Discount ({appliedDiscount?.code})</span>
                  </span>
                  <span className="font-bold">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span>Shipping</span>
                  {appliedDiscount?.type === 'free_shipping' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                      PROMO
                    </span>
                  )}
                </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {effectiveShippingCost === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">FREE</span>
                  ) : (
                    formatPrice(effectiveShippingCost)
                  )}
                </span>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-baseline">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-indigo-600 mt-0.5" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                Your transaction is secure. We use industry-standard encryption to protect your data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
