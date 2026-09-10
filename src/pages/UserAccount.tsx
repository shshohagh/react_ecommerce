import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Package, 
  MapPin, 
  Bell, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  Truck, 
  FileText, 
  ShoppingBag, 
  ExternalLink, 
  ShieldCheck, 
  Save, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Home,
  Briefcase,
  Globe
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, formatDate } from '../lib/utils';
import { Order, UserAddress, UserPreferences } from '../types';
import { collection, query, where, onSnapshot, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

export default function UserAccount() {
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showSuccess, showError, showInfo } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'orders' | 'addresses' | 'notifications' | 'profile'
  const activeTab = searchParams.get('tab') || 'orders';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // State for orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderFilter, setOrderFilter] = useState('all');

  // State for addresses
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [addressForm, setAddressForm] = useState({
    full_name: user?.name || '',
    phone: '',
    street_address: '',
    apartment: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
    label: 'Home' as 'Home' | 'Work' | 'Other',
    is_default: false
  });

  // State for notification preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    user_id: user?.email || 'guest_user',
    email_order_updates: true,
    email_promotions: true,
    email_price_alerts: true,
    email_stock_alerts: true,
    sms_notifications: false
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // User identifier for data isolation (prefer user.id which matches Firebase Auth uid)
  const userId = user?.id || (isAuthenticated ? user?.email : null) || 'guest_user';

  // 1. Load Orders
  useEffect(() => {
    setLoadingOrders(true);
    const ordersRef = collection(db, 'orders');
    
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const orderList: Order[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        orderList.push({
          id: doc.id,
          ...data,
          created_at: data.created_at || new Date().toISOString()
        } as Order);
      });
      // Sort newest first
      orderList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(orderList);
      setLoadingOrders(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      console.warn("Could not sync orders live:", error);
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // 2. Load Saved Addresses
  useEffect(() => {
    setLoadingAddresses(true);

    if (!isAuthenticated || !user?.id) {
      // Guest mode: load addresses from localStorage
      const saved = localStorage.getItem('swiftcart_guest_addresses');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAddresses(parsed);
            setLoadingAddresses(false);
            return;
          }
        } catch (e) {}
      }
      // Seed default demo address for guest
      const defaultAddress: UserAddress = {
        id: 'addr_default_1',
        user_id: 'guest_user',
        full_name: user?.name || 'Shohagh User',
        phone: '+1 (555) 234-5678',
        street_address: '742 Evergreen Terrace',
        apartment: 'Suite 4B',
        city: 'Springfield',
        state: 'Oregon',
        postal_code: '97477',
        country: 'United States',
        is_default: true,
        label: 'Home',
        created_at: new Date().toISOString()
      };
      setAddresses([defaultAddress]);
      setLoadingAddresses(false);
      return;
    }

    // Authenticated mode: scoped query for current user
    const q = query(collection(db, 'user_addresses'), where('user_id', '==', user.id));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const addrList: UserAddress[] = [];
        snapshot.forEach(docSnap => {
          addrList.push({
            id: docSnap.id,
            ...docSnap.data()
          } as UserAddress);
        });
        if (addrList.length > 0) {
          setAddresses(addrList);
        } else {
          // Seed initial default address for new user
          const defaultAddress: UserAddress = {
            id: 'addr_default_1',
            user_id: user.id,
            full_name: user.name || 'Shohagh User',
            phone: '+1 (555) 234-5678',
            street_address: '742 Evergreen Terrace',
            apartment: 'Suite 4B',
            city: 'Springfield',
            state: 'Oregon',
            postal_code: '97477',
            country: 'United States',
            is_default: true,
            label: 'Home',
            created_at: new Date().toISOString()
          };
          setAddresses([defaultAddress]);
        }
        setLoadingAddresses(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'user_addresses');
        console.warn("Could not sync user addresses live from Firestore:", error);
        setLoadingAddresses(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated, user?.id, user?.name]);

  // 3. Load Notification Preferences
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      // Guest mode: load preferences from localStorage
      const saved = localStorage.getItem('swiftcart_prefs_guest');
      if (saved) {
        try {
          setPreferences(JSON.parse(saved));
        } catch (e) {}
      }
      return;
    }

    // Authenticated mode: listen to user_preferences document
    const prefsDocRef = doc(db, 'user_preferences', user.id);
    const unsubscribe = onSnapshot(
      prefsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setPreferences(docSnap.data() as UserPreferences);
        } else {
          const saved = localStorage.getItem(`swiftcart_prefs_${user.id}`);
          if (saved) {
            try {
              setPreferences(JSON.parse(saved));
            } catch (e) {}
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `user_preferences/${user.id}`);
        console.warn("Could not sync user preferences live:", error);
        const saved = localStorage.getItem(`swiftcart_prefs_${user.id}`);
        if (saved) {
          try {
            setPreferences(JSON.parse(saved));
          } catch (e) {}
        }
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated, user?.id]);

  // Handle Save Address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.full_name || !addressForm.street_address || !addressForm.city || !addressForm.phone) {
      showError('Please fill in all required address fields.', 'Missing Information');
      return;
    }

    try {
      const addressId = editingAddress?.id || `addr_${Date.now()}`;
      const effectiveUserId = user?.id || 'guest_user';

      const addressPayload: UserAddress = {
        id: addressId,
        user_id: effectiveUserId,
        full_name: addressForm.full_name,
        phone: addressForm.phone,
        street_address: addressForm.street_address,
        apartment: addressForm.apartment,
        city: addressForm.city,
        state: addressForm.state,
        postal_code: addressForm.postal_code,
        country: addressForm.country,
        label: addressForm.label,
        is_default: addressForm.is_default || addresses.length === 0,
        created_at: editingAddress?.created_at || new Date().toISOString()
      };

      if (isAuthenticated && user?.id) {
        const addressDocRef = doc(db, 'user_addresses', addressId);
        // If marked as default, unset previous defaults
        if (addressPayload.is_default) {
          addresses.forEach(async (a) => {
            if (a.id && a.id !== addressId && a.is_default) {
              await updateDoc(doc(db, 'user_addresses', a.id), { is_default: false }).catch(() => {});
            }
          });
        }
        await setDoc(addressDocRef, addressPayload);
      }

      // Local state update & storage update
      const updatedList = (() => {
        const filtered = addresses.filter(a => a.id !== addressId);
        if (addressPayload.is_default) {
          return [addressPayload, ...filtered.map(a => ({ ...a, is_default: false }))];
        }
        return [...filtered, addressPayload];
      })();

      setAddresses(updatedList);
      if (!isAuthenticated || !user?.id) {
        localStorage.setItem('swiftcart_guest_addresses', JSON.stringify(updatedList));
      }

      showSuccess(
        editingAddress ? 'Address updated successfully!' : 'New shipping address added!',
        'Address Saved'
      );
      setIsAddressModalOpen(false);
      setEditingAddress(null);
      setAddressForm({
        full_name: user?.name || '',
        phone: '',
        street_address: '',
        apartment: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'United States',
        label: 'Home',
        is_default: false
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'user_addresses');
      console.error('Error saving address:', err);
      showError('Failed to save address. Please try again.', 'Error');
    }
  };

  // Handle Delete Address
  const handleDeleteAddress = async (id: string) => {
    try {
      if (isAuthenticated && user?.id) {
        await deleteDoc(doc(db, 'user_addresses', id)).catch(() => {});
      }
      const updated = addresses.filter(a => a.id !== id);
      setAddresses(updated);
      if (!isAuthenticated || !user?.id) {
        localStorage.setItem('swiftcart_guest_addresses', JSON.stringify(updated));
      }
      showSuccess('Shipping address removed.', 'Address Deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `user_addresses/${id}`);
      showError('Could not delete address.', 'Error');
    }
  };

  // Handle Set Default Address
  const handleSetDefaultAddress = async (targetAddress: UserAddress) => {
    if (!targetAddress.id) return;
    try {
      if (isAuthenticated && user?.id) {
        await updateDoc(doc(db, 'user_addresses', targetAddress.id), { is_default: true }).catch(() => {});
        addresses.forEach(async (a) => {
          if (a.id && a.id !== targetAddress.id && a.is_default) {
            await updateDoc(doc(db, 'user_addresses', a.id), { is_default: false }).catch(() => {});
          }
        });
      }

      const updated = addresses.map(a => ({
        ...a,
        is_default: a.id === targetAddress.id
      }));

      setAddresses(updated);
      if (!isAuthenticated || !user?.id) {
        localStorage.setItem('swiftcart_guest_addresses', JSON.stringify(updated));
      }

      showSuccess(`"${targetAddress.label || 'Selected'}" set as default delivery address.`, 'Default Address Updated');
    } catch (err) {
      showError('Failed to set default address.', 'Error');
    }
  };

  // Handle Save Preferences
  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const targetPrefId = user?.id || userId;
      const payload: UserPreferences = {
        ...preferences,
        user_id: targetPrefId,
        updated_at: new Date().toISOString()
      };

      if (isAuthenticated && user?.id) {
        const prefsDocRef = doc(db, 'user_preferences', user.id);
        await setDoc(prefsDocRef, payload);
      }

      localStorage.setItem(`swiftcart_prefs_${targetPrefId}`, JSON.stringify(payload));
      showSuccess('Your email & communication preferences have been saved!', 'Preferences Saved');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `user_preferences/${user?.id || 'guest'}`);
      console.warn("Saving to local storage as fallback:", err);
      localStorage.setItem(`swiftcart_prefs_${user?.id || userId}`, JSON.stringify(preferences));
      showSuccess('Preferences saved locally.', 'Updated');
    } finally {
      setSavingPrefs(false);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    if (orderFilter === 'all') return true;
    return order.status === orderFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 py-8 sm:py-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header & Account Profile Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-indigo-500/25 flex-shrink-0">
              {(user?.name || 'Customer').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                  {user?.name || 'My Account'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  Verified Member
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                <Mail className="h-3.5 w-3.5" />
                <span>{user?.email || 'shshohagh4@gmail.com'}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-6 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Orders</span>
              <span className="text-xl font-black text-gray-900 dark:text-white">{orders.length}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Addresses</span>
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{addresses.length}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Member Status</span>
              <span className="text-xs font-bold px-2 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-lg inline-block">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Order History</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('addresses')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'addresses'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Saved Addresses</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'addresses' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
              {addresses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Email & Notifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            <span>Account Details</span>
          </button>
        </div>

        {/* Tab 1: Order History */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Order History & Invoices</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Track shipments, download invoices, and reorder previous items.</p>
              </div>

              {/* Order Status Filters */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                {['all', 'pending', 'confirmed', 'delivered'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      orderFilter === st
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {loadingOrders ? (
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800">
                <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-gray-500">Loading your orders...</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-mono font-bold text-gray-400">Order #{order.id.slice(0, 10)}</p>
                          <p className="text-sm font-extrabold text-gray-900 dark:text-white">{formatDate(order.created_at)}</p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                        order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300' :
                        order.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {order.status === 'pending' && <Clock className="h-3 w-3 mr-1.5 animate-spin" />}
                        {order.status === 'confirmed' && <CheckCircle2 className="h-3 w-3 mr-1.5" />}
                        {order.status === 'delivered' && <Truck className="h-3 w-3 mr-1.5" />}
                        <span className="capitalize">{order.status}</span>
                      </span>
                    </div>

                    {/* Order Details Body */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 font-bold block mb-1">Item Purchased:</span>
                        <p className="font-extrabold text-gray-900 dark:text-white text-sm">{order.product_name}</p>
                        {order.attributes && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {Object.entries(JSON.parse(order.attributes)).map(([k, v]) => (
                              <span key={k} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                {k}: {v as string}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-gray-400 font-bold block mb-1">Shipping Destination:</span>
                        <p className="font-medium text-gray-700 dark:text-gray-300">{order.customer_name}</p>
                        <p className="text-gray-500 dark:text-gray-400 truncate">{order.address}</p>
                        <p className="text-gray-500 dark:text-gray-400">{order.phone}</p>
                      </div>

                      <div className="flex flex-col justify-between">
                        <div>
                          <span className="text-gray-400 font-bold block mb-1">Total Amount:</span>
                          <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                            {formatPrice(order.total || order.product_price || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Links */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <Link
                        to={`/invoice/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>View Invoice</span>
                      </Link>

                      <Link
                        to={`/track-order/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        <span>Track Delivery</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800 space-y-4">
                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto text-gray-400">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">No orders found</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    You haven't placed any orders matching this filter yet.
                  </p>
                </div>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                >
                  <span>Start Shopping</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Saved Shipping Addresses */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Saved Shipping Addresses</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Manage your delivery locations for 1-click expedited checkout.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingAddress(null);
                  setAddressForm({
                    full_name: user?.name || '',
                    phone: '',
                    street_address: '',
                    apartment: '',
                    city: '',
                    state: '',
                    postal_code: '',
                    country: 'United States',
                    label: 'Home',
                    is_default: addresses.length === 0
                  });
                  setIsAddressModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Address</span>
              </button>
            </div>

            {loadingAddresses ? (
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800">
                <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-gray-500">Loading saved addresses...</p>
              </div>
            ) : addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`bg-white dark:bg-gray-900 rounded-3xl border p-6 shadow-sm relative transition-all ${
                      addr.is_default 
                        ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20' 
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                    }`}
                  >
                    {/* Default Badge & Label */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          {addr.label === 'Work' ? <Briefcase className="h-4 w-4" /> : <Home className="h-4 w-4" />}
                        </span>
                        <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                          {addr.label || 'Home Address'}
                        </span>
                      </div>

                      {addr.is_default && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          <Check className="h-3 w-3" />
                          Default
                        </span>
                      )}
                    </div>

                    {/* Address Body */}
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300 mb-6">
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{addr.full_name}</p>
                      <p>{addr.street_address}{addr.apartment ? `, ${addr.apartment}` : ''}</p>
                      <p>{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postal_code || ''}</p>
                      <p className="text-gray-400 font-semibold">{addr.country}</p>
                      <p className="pt-2 text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-mono">
                        <Phone className="h-3 w-3 text-gray-400" />
                        {addr.phone}
                      </p>
                    </div>

                    {/* Address Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                      {!addr.is_default ? (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr)}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          Set as Default
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Main Delivery Destination</span>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddress(addr);
                            setAddressForm({
                              full_name: addr.full_name,
                              phone: addr.phone,
                              street_address: addr.street_address,
                              apartment: addr.apartment || '',
                              city: addr.city,
                              state: addr.state || '',
                              postal_code: addr.postal_code || '',
                              country: addr.country,
                              label: addr.label || 'Home',
                              is_default: addr.is_default || false
                            });
                            setIsAddressModalOpen(true);
                          }}
                          className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                          title="Edit Address"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => addr.id && handleDeleteAddress(addr.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors"
                          title="Delete Address"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800 space-y-4">
                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto text-gray-400">
                  <MapPin className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">No saved addresses</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Save your shipping address now to speed up your future checkouts.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Manage Notification Preferences */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Notification & Communication Settings</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Choose what emails and alert messages you want to receive from SwiftCart.</p>
              </div>
              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{savingPrefs ? 'Saving...' : 'Save Preferences'}</span>
              </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 shadow-sm overflow-hidden">
              
              {/* Pref 1: Order Updates */}
              <div className="p-6 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">Order Status & Tracking Updates</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Receive email receipts, packing confirmations, and delivery milestone notifications.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email_order_updates}
                    onChange={(e) => setPreferences(p => ({ ...p, email_order_updates: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Pref 2: Price Alerts */}
              <div className="p-6 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">Price Drop Alerts</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get an instant email alert when saved products or wishlist items go on discount.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email_price_alerts}
                    onChange={(e) => setPreferences(p => ({ ...p, email_price_alerts: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Pref 3: Restock Alerts */}
              <div className="p-6 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">Back-in-Stock Notifications</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Receive alert emails the minute previously sold-out items are replenished.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email_stock_alerts}
                    onChange={(e) => setPreferences(p => ({ ...p, email_stock_alerts: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Pref 4: Deals & Promotions */}
              <div className="p-6 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">Weekly Deals & Promo Codes</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Curated weekly catalog specials, flash coupon codes, and member-only promotions.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email_promotions}
                    onChange={(e) => setPreferences(p => ({ ...p, email_promotions: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Pref 5: SMS Shipment Alerts */}
              <div className="p-6 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">SMS Courier Notifications</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get an instant text message on out-for-delivery day and when your package reaches your door.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.sms_notifications}
                    onChange={(e) => setPreferences(p => ({ ...p, sms_notifications: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Account Details & Security */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 space-y-6 shadow-sm">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Account Details</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">View and review your personal customer credentials.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="font-bold text-gray-400 uppercase tracking-wider block">Full Name</span>
                <p className="text-sm font-extrabold text-gray-900 dark:text-white">{user?.name || 'Shohagh User'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="font-bold text-gray-400 uppercase tracking-wider block">Primary Email</span>
                <p className="text-sm font-extrabold text-gray-900 dark:text-white">{user?.email || 'shshohagh4@gmail.com'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="font-bold text-gray-400 uppercase tracking-wider block">Security Level</span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  <span>2FA & Google Cloud Auth Protected</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="font-bold text-gray-400 uppercase tracking-wider block">Role</span>
                <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 capitalize">{user?.role || 'Customer'}</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Add / Edit Address Modal */}
      <AnimatePresence>
        {isAddressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                  {editingAddress ? 'Edit Shipping Address' : 'Add New Shipping Address'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Address Label</label>
                  <div className="flex items-center gap-2">
                    {(['Home', 'Work', 'Other'] as const).map(lbl => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setAddressForm(f => ({ ...f, label: lbl }))}
                        className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                          addressForm.label === lbl
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={addressForm.full_name}
                      onChange={(e) => setAddressForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="e.g. John Doe"
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+1 (555) 000-0000"
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.street_address}
                    onChange={(e) => setAddressForm(f => ({ ...f, street_address: e.target.value }))}
                    placeholder="123 Main St, Apt 4B"
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="New York"
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">State/Province</label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm(f => ({ ...f, state: e.target.value }))}
                      placeholder="NY"
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={addressForm.postal_code}
                      onChange={(e) => setAddressForm(f => ({ ...f, postal_code: e.target.value }))}
                      placeholder="10001"
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.country}
                    onChange={(e) => setAddressForm(f => ({ ...f, country: e.target.value }))}
                    placeholder="United States"
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_default_chk"
                    checked={addressForm.is_default}
                    onChange={(e) => setAddressForm(f => ({ ...f, is_default: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                  />
                  <label htmlFor="is_default_chk" className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                    Set this as my default shipping address
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
