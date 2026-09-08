import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../lib/utils';
import { Trash2, ShoppingBag, ArrowLeft, Plus, Minus, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Cart() {
  const { cart, removeFromCart, clearCart, cartCount, addToCart, decreaseQuantity } = useCart();
  const { showSuccess, showInfo } = useToast();
  const navigate = useNavigate();

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleClearCart = () => {
    clearCart();
    showInfo('Your shopping cart has been cleared.', 'Cart Cleared');
  };

  const handleRemove = (item: any) => {
    removeFromCart(item.id, item.selectedAttributes);
    showInfo(`${item.name} removed from your cart.`, 'Item Removed');
  };

  const handleIncrease = (item: any) => {
    addToCart(item, item.selectedAttributes);
    showSuccess(`Increased ${item.name} quantity`, 'Cart Updated');
  };

  const handleDecrease = (item: any) => {
    decreaseQuantity(item.id, item.selectedAttributes);
    showInfo(`Decreased ${item.name} quantity`, 'Cart Updated');
  };

  if (cartCount === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center bg-white dark:bg-gray-950 transition-colors duration-300">
        <div className="mb-6 flex justify-center">
          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-full">
            <ShoppingBag className="h-12 w-12 text-gray-300 dark:text-gray-700" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Shopping Cart</h1>
        <button
          onClick={handleClearCart}
          className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
        >
          <Trash2 className="h-4 w-4" />
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => (
              <motion.div
                key={`${item.id}-${JSON.stringify(item.selectedAttributes)}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex gap-4 items-center"
              >
                <div className="h-24 w-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-gray-900 dark:text-white">{item.name}</h3>
                  {item.selectedAttributes && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.entries(item.selectedAttributes).map(([key, val]) => (
                        <span key={key} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {key}: {val}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-1">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-1">
                  <button
                    onClick={() => handleDecrease(item)}
                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors active:scale-90"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-bold text-gray-900 dark:text-white w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleIncrease(item)}
                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors active:scale-90"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => handleRemove(item)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors active:scale-90"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <Link
            to="/"
            className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-indigo-600 mt-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Shipping</span>
                <span className="font-bold text-green-600">Free</span>
              </div>
              <div className="pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{formatPrice(subtotal)}</span>
              </div>
            </div>
            <button
              onClick={() => {
                showSuccess('Proceeding to checkout...', 'Checkout');
                navigate('/checkout');
              }}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="h-5 w-5" />
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
