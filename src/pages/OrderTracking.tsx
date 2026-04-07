import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, getDoc, getDocs, query, where, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { Package, Truck, CheckCircle, Clock, ArrowLeft, MapPin, Phone, User, ChevronRight } from 'lucide-react';
import { Order } from '../types';
import { formatPrice } from '../lib/utils';

const steps = [
  { id: 'pending', label: 'Order Placed', icon: Clock, description: 'We have received your order.' },
  { id: 'confirmed', label: 'Confirmed', icon: Package, description: 'Your order has been confirmed and is being prepared.' },
  { id: 'shipped', label: 'Shipped', icon: Truck, description: 'Your order is on its way to you.' },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle, description: 'Your order has been delivered.' },
];

export default function OrderTracking() {
  const { id: urlId } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(urlId || '');
  const [order, setOrder] = useState<(Order & { product_image?: string }) | null>(null);
  const [searchResults, setSearchResults] = useState<(Order & { product_image?: string })[]>([]);
  const [loading, setLoading] = useState(!!urlId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (urlId) {
      fetchOrder(urlId);
    } else {
      setOrder(null);
    }
  }, [urlId]);

  const fetchOrder = async (id: string) => {
    setLoading(true);
    setError(null);
    setSearchResults([]);
    try {
      const docSnap = await getDoc(doc(db, 'orders', id));
      if (!docSnap.exists()) throw new Error('Order not found');
      
      const data = { id: docSnap.id, ...docSnap.data() } as Order;
      setOrder(data);
      if (urlId !== id) {
        navigate(`/track-order/${id}`, { replace: true });
      }
    } catch (err: any) {
      setError(err.message);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const qStr = searchQuery.trim();
    if (!qStr) return;

    setLoading(true);
    setError(null);
    setOrder(null);
    setSearchResults([]);

    try {
      // Try fetching by exact ID first
      const docSnap = await getDoc(doc(db, 'orders', qStr));
      if (docSnap.exists()) {
        fetchOrder(docSnap.id);
        return;
      }

      // If not ID, search by phone or name (limited search in Firestore)
      const qPhone = query(collection(db, 'orders'), where('phone', '==', qStr), limit(10));
      const qName = query(collection(db, 'orders'), where('customer_name', '==', qStr), limit(10));
      
      const [phoneSnap, nameSnap] = await Promise.all([getDocs(qPhone), getDocs(qName)]);
      const results = [
        ...phoneSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)),
        ...nameSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order))
      ];

      // Remove duplicates
      const uniqueResults = results.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

      if (uniqueResults.length === 0) {
        setError('No orders found matching your search.');
      } else if (uniqueResults.length === 1) {
        fetchOrder(uniqueResults[0].id);
      } else {
        setSearchResults(uniqueResults);
        if (urlId) {
          navigate('/track-order', { replace: true });
        }
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while searching.');
    } finally {
      setLoading(false);
    }
  };

  if (!urlId && !order && !loading && searchResults.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="bg-white rounded-3xl border border-gray-100 p-12 shadow-sm text-center">
          <Package className="h-16 w-16 text-indigo-600 mx-auto mb-6" />
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Track Your Order</h1>
          <p className="text-gray-500 mb-8 text-lg">Enter your order ID, name, or phone number to see the current status.</p>
          
          <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Order ID, Name, or Phone"
              className="flex-grow px-6 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
            >
              Track
            </button>
          </form>
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

  if (searchResults.length > 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <button onClick={() => setSearchResults([])} className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </button>
          
          <form onSubmit={handleSearch} className="flex-grow max-w-md flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, Name, or Phone"
              className="flex-grow px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-sm shadow-sm"
            >
              Track
            </button>
          </form>

          <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Results ({searchResults.length})</h1>
        </div>

        <div className="grid gap-4">
          {searchResults.map(result => (
            <button
              key={result.id}
              onClick={() => fetchOrder(result.id.toString())}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-600 transition-all text-left flex items-center gap-6 group"
            >
              <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                <img src={result.product_image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900">Order #{result.id}</h3>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase">
                    {result.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-3 w-3 mr-1" />
                    {result.customer_name}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-3 w-3 mr-1" />
                    {result.phone}
                  </div>
                </div>
                <p className="text-sm text-gray-500">{result.product_name}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(result.created_at).toLocaleDateString()}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-indigo-600" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-red-50 rounded-3xl p-12 border border-red-100">
          <h2 className="text-2xl font-bold text-red-900 mb-4">No Orders Found</h2>
          <p className="text-red-700 mb-8">{error || "We couldn't find any orders matching your search."}</p>
          
          <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-3 mb-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Order ID, Name, or Phone"
              className="flex-grow px-6 py-4 rounded-2xl border border-red-200 focus:ring-2 focus:ring-red-500 outline-none transition-all"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/25"
            >
              Retry
            </button>
          </form>

          <Link to="/" className="inline-flex items-center text-gray-600 font-bold hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shopping
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = steps.findIndex(step => step.id === order.status);
  // If status is 'confirmed', we show it as the second step.
  // If status is 'delivered', we show all steps as completed.
  // We'll assume a linear progression for simplicity.
  const activeIndex = order.status === 'pending' ? 0 : order.status === 'confirmed' ? 1 : order.status === 'shipped' ? 2 : order.status === 'delivered' ? 3 : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <Link to="/" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        
        <form onSubmit={handleSearch} className="flex-grow max-w-md flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ID, Name, or Phone"
            className="flex-grow px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-sm shadow-sm"
          >
            Track
          </button>
        </form>

        <div className="text-right hidden md:block">
          <p className="text-sm text-gray-500">Order ID</p>
          <p className="text-lg font-bold text-gray-900">#{order.id}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="p-8 border-b border-gray-50 bg-gray-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Track Your Order</h1>
                <p className="text-gray-500">Estimated Delivery: <span className="font-bold text-indigo-600">{order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString() : 'TBD'}</span></p>
                {order.attributes && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(JSON.parse(order.attributes)).map(([key, value]) => (
                      <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {key}: {value as string}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold self-start md:self-center">
                Status: {order.status.toUpperCase()}
              </div>
            </div>
        </div>

        <div className="p-8 md:p-12">
          {/* Progress Indicator */}
          <div className="relative">
            {/* Background Line */}
            <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 hidden md:block"></div>
            {/* Active Line */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
              className="absolute top-5 left-0 h-1 bg-indigo-600 hidden md:block transition-all duration-1000"
            ></motion.div>

            <div className="relative flex flex-col md:flex-row justify-between gap-8 md:gap-0">
              {steps.map((step, index) => {
                const isCompleted = index <= activeIndex;
                const isActive = index === activeIndex;
                const Icon = step.icon;

                return (
                  <div key={step.id} className="flex md:flex-col items-center md:text-center relative z-10 group">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.2 }}
                      className={`h-10 w-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                        isCompleted ? 'bg-indigo-600 border-indigo-100 text-white' : 'bg-white border-gray-100 text-gray-300'
                      } ${isActive ? 'ring-4 ring-indigo-50' : ''}`}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                    <div className="ml-4 md:ml-0 md:mt-4">
                      <h3 className={`font-bold text-sm ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</h3>
                      <p className="text-xs text-gray-500 max-w-[150px] hidden md:block mt-1">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                <img 
                  src={order.product_image} 
                  alt={order.product_name} 
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-gray-900 text-lg">{order.product_name}</h3>
                <p className="text-gray-500 text-sm mb-2">Quantity: 1</p>
                <p className="text-indigo-600 font-bold">{formatPrice(order.product_price || 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order History</h2>
            <div className="space-y-8">
              {order.history && order.history.length > 0 ? (
                order.history.map((item, i) => {
                  const step = steps.find(s => s.id === item.status);
                  const Icon = step?.icon || Clock;
                  return (
                    <div key={i} className="flex gap-6 relative">
                      {i !== order.history!.length - 1 && (
                        <div className="absolute left-5 top-10 bottom-[-32px] w-0.5 bg-gray-100"></div>
                      )}
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        i === 0 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-grow pb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <p className={`font-bold ${i === 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                            {step?.label || item.status.toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(item.created_at).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                        </div>
                        <p className={`text-sm ${i === 0 ? 'text-gray-600' : 'text-gray-400'}`}>
                          {item.description || step?.description || 'Status updated'}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-sm">No updates available yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Delivery Details</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Customer</p>
                  <p className="font-bold text-gray-900">{order.customer_name}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Phone</p>
                  <p className="font-bold text-gray-900">{order.phone}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Address</p>
                  <p className="font-bold text-gray-900 leading-relaxed">{order.address}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-lg shadow-indigo-500/25">
            <h3 className="text-lg font-bold mb-2">Need Help?</h3>
            <p className="text-indigo-100 text-sm mb-6">If you have any questions regarding your order, please contact our support team.</p>
            <button className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
