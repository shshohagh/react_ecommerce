import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../lib/utils';
import { CheckCircle2, AlertCircle, CreditCard, Truck, ShieldCheck, ArrowLeft, MapPin, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { ShippingArea } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';

export default function Checkout() {
  const { cart, clearCart, cartCount } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ id: string; data: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shippingAreas, setShippingAreas] = useState<ShippingArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<ShippingArea | null>(null);

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
  }, []);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingCost = selectedArea ? selectedArea.cost : 0;
  const total = subtotal + shippingCost;

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
      const orderData = {
        ...formData,
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
        shipping_cost: shippingCost,
        total,
        status: 'pending',
        created_at: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setOrderSuccess({ id: docRef.id, data: orderData });
      clearCart();
    } catch (err) {
      console.error('Order placement error:', err);
      setError('Failed to place order. Please try again.');
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
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
            Thank you for your purchase. Your order ID is <span className="font-bold text-indigo-600 dark:text-indigo-400">#{orderSuccess.id}</span>
          </p>

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
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 mt-8"
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

            <div className="space-y-4 pt-6 border-t border-gray-50 dark:border-gray-800">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Shipping</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(shippingCost)}</span>
              </div>
              <div className="pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between">
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
