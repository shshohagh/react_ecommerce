import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Heart, ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Product } from '../types';
import { formatPrice } from '../lib/utils';
import { motion } from 'motion/react';

export default function Wishlist() {
  const { user, isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchWishlist = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'wishlist'), where('user_id', '==', user.id));
      const snap = await getDocs(q);
      const productIds = snap.docs.map(doc => doc.data().product_id);
      
      const products = await Promise.all(productIds.map(async (pid) => {
        const pSnap = await getDoc(doc(db, 'products', pid));
        return pSnap.exists() ? { id: pSnap.id, ...pSnap.data() } as Product : null;
      }));

      setWishlist(products.filter(p => p !== null) as Product[]);
    } catch (err) {
      setError('Could not load your wishlist.');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;
    try {
      const q = query(collection(db, 'wishlist'), where('user_id', '==', user.id), where('product_id', '==', productId));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'wishlist', d.id))));
      setWishlist(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Failed to remove from wishlist', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl border border-gray-100 p-12 shadow-sm">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Your Wishlist</h1>
          <p className="text-gray-500 mb-8 text-lg">Please log in to view and manage your wishlist.</p>
          <Link
            to="/admin/login"
            className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shopping
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900">My Wishlist</h1>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold">
          {wishlist.length} Items
        </div>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
          <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-8">Save items you love to find them easily later.</p>
          <Link
            to="/"
            className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {wishlist.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="aspect-square overflow-hidden relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-xl shadow-sm hover:bg-red-50 transition-colors"
                  title="Remove from wishlist"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{product.name}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-bold text-indigo-600">{formatPrice(product.price)}</span>
                  <Link
                    to={`/product/${product.id}`}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
