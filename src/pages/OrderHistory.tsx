import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Order, Product } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'motion/react';
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  FileText,
  Search,
  ArrowRight,
  ShoppingBag,
  RefreshCw,
  Copy,
  ExternalLink,
  ChevronRight,
  Filter,
  User,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import OrderProgressStepper from '../components/OrderProgressStepper';
import InvoicePreviewModal from '../components/InvoicePreviewModal';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'Order Placed', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900', icon: Package },
  shipped: { label: 'Shipped', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900', icon: CheckCircle },
};

export default function OrderHistory() {
  const { user, isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const { addToCart } = useCart();
  const { showSuccess, showInfo, showError } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch latest orders from Firestore
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('created_at', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      
      let fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      // If user is authenticated, prioritize matching email or user_id
      if (isAuthenticated && user?.email) {
        const userOrders = fetchedOrders.filter(
          o => (o.email && o.email.toLowerCase() === user.email.toLowerCase()) || (o as any).user_id === user.id
        );
        // If we found specific user orders, display them; otherwise display all fetched orders
        if (userOrders.length > 0) {
          fetchedOrders = userOrders;
        }
      }

      setOrders(fetchedOrders);
    } catch (err) {
      console.error('Error fetching order history:', err);
      showError('Unable to load order history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated, user?.email]);

  const handleCopyOrderId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      showSuccess(`Order ID #${id} copied to clipboard!`, 'Copied');
      setTimeout(() => setCopiedId(null), 2500);
    } catch (e) {
      showInfo(`Order ID: #${id}`, 'Order ID');
    }
  };

  const handleReorder = (order: Order) => {
    try {
      const items = (order as any).items;
      if (Array.isArray(items) && items.length > 0) {
        items.forEach(item => {
          addToCart({
            id: item.product_id || item.id || order.product_id,
            name: item.name || order.product_name || 'Product',
            price: item.price || 0,
            image: item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
            description: '',
            category: '',
            brand: '',
            is_featured: false,
            created_at: new Date().toISOString()
          }, item.attributes ? JSON.parse(item.attributes) : undefined);
        });
      } else {
        addToCart({
          id: order.product_id || order.id,
          name: order.product_name || 'Product',
          price: order.product_price || 0,
          image: (order as any).product_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
          description: '',
          category: '',
          brand: '',
          is_featured: false,
          created_at: new Date().toISOString()
        }, order.attributes ? JSON.parse(order.attributes) : undefined);
      }
      showSuccess('Items added to your cart!', 'Re-ordered');
      navigate('/cart');
    } catch (e) {
      showError('Could not add items to cart.');
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'Recent';
    if (typeof dateValue === 'object' && 'toDate' in dateValue) {
      return dateValue.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? 'Recent' : d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const q = searchFilter.toLowerCase().trim();
    if (!q) return matchesStatus;

    const matchesId = order.id?.toLowerCase().includes(q);
    const matchesName = order.customer_name?.toLowerCase().includes(q);
    const matchesProduct = order.product_name?.toLowerCase().includes(q);
    const matchesPhone = order.phone?.toLowerCase().includes(q);
    
    return matchesStatus && (matchesId || matchesName || matchesProduct || matchesPhone);
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Package className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Order History & Invoices
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Track orders, download official PDF invoices, and manage previous purchases.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              title="Refresh order history"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link
              to="/track-order"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <Truck className="h-4 w-4" />
              <span>Track By ID</span>
            </Link>
          </div>
        </div>

        {/* Filters & Search Controls */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
            {['all', 'pending', 'confirmed', 'shipped', 'delivered'].map((status) => {
              const count = status === 'all' ? orders.length : orders.filter(o => o.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedStatus === status
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{status}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    selectedStatus === status
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by Order ID, name..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="text-sm font-semibold text-gray-500">Loading your orders...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-12 text-center shadow-xs">
            <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-950/60 rounded-3xl flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Orders Found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-6">
              {searchFilter
                ? `No orders matching "${searchFilter}". Try adjusting your search query.`
                : 'You have not placed any orders yet. Discover our premium collection and enjoy 20% off with promo code SAVE20.'}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/25"
            >
              <span>Explore Products</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Orders List */}
        {!loading && filteredOrders.length > 0 && (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusInfo.icon;
              const items = (order as any).items || [];
              const totalAmount = order.total || order.product_price || 0;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 shadow-xs hover:shadow-md transition-all space-y-6"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</span>
                        <span className="text-base font-extrabold text-gray-900 dark:text-white font-mono">
                          #{order.id}
                        </span>
                        <button
                          onClick={() => handleCopyOrderId(order.id)}
                          className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                          title="Copy order ID"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Placed on {formatDate(order.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        <span>{statusInfo.label}</span>
                      </span>

                      {/* Total Price */}
                      <div className="text-right pl-3 border-l border-gray-100 dark:border-gray-800">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Amount</p>
                        <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                          {formatPrice(totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Lifecycle Progress Stepper */}
                  <div className="bg-gray-50/70 dark:bg-gray-800/40 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <OrderProgressStepper status={order.status} createdAt={order.created_at} />
                  </div>

                  {/* Products in this Order */}
                  <div className="space-y-3">
                    {items.length > 0 ? (
                      items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-4 p-3 bg-gray-50/60 dark:bg-gray-800/40 rounded-2xl">
                          <div className="flex items-center gap-3.5">
                            <div className="h-14 w-14 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                              <img
                                src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                                alt={item.name}
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                                {item.name}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Qty: {item.quantity || 1} &bull; Unit: {formatPrice(item.price || 0)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right font-bold text-sm text-gray-900 dark:text-white">
                            {formatPrice((item.price || 0) * (item.quantity || 1))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between gap-4 p-3 bg-gray-50/60 dark:bg-gray-800/40 rounded-2xl">
                        <div className="flex items-center gap-3.5">
                          <div className="h-14 w-14 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                            <img
                              src={(order as any).product_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                              alt={order.product_name || 'Product'}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                              {order.product_name || 'Premium Product'}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Recipient: {order.customer_name} &bull; {order.phone}
                            </p>
                          </div>
                        </div>

                        <div className="text-right font-bold text-sm text-gray-900 dark:text-white">
                          {formatPrice(order.product_price || totalAmount)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Deliver to:</span>
                      <span className="line-clamp-1">{order.address}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 ml-auto">
                      {/* Preview Invoice in Modal */}
                      <button
                        type="button"
                        onClick={() => setSelectedInvoiceOrder(order)}
                        className="px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-600 dark:hover:border-indigo-500 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        title="Preview invoice in modal before downloading"
                      >
                        <Eye className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Preview Invoice</span>
                      </button>

                      {/* View Full Invoice Page */}
                      <Link
                        to={`/invoice/${order.id}`}
                        className="px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-600 dark:hover:border-indigo-500 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>View Invoice</span>
                      </Link>

                      {/* Track Order button */}
                      <Link
                        to={`/track-order/${order.id}`}
                        className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        <span>Track Live</span>
                      </Link>

                      {/* Buy Again button */}
                      <button
                        type="button"
                        onClick={() => handleReorder(order)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Buy Again</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        order={selectedInvoiceOrder}
        isOpen={!!selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
      />
    </div>
  );
}
