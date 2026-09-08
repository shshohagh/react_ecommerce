import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Printer,
  Download,
  Share2,
  ExternalLink,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  FileText,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Order } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';

interface InvoicePreviewModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoicePreviewModal({ order, isOpen, onClose }: InvoicePreviewModalProps) {
  const { formatPrice } = useCurrency();
  const { showSuccess, showInfo } = useToast();

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const items = (order as any).items || [];
  const subtotal = (order as any).subtotal || (order.product_price || order.total || 0);
  const shippingCost = (order as any).shipping_cost ?? (order as any).shipping ?? 0;
  const discountAmount = (order as any).discount_amount || 0;
  const discountCode = (order as any).discount_code;
  const total = order.total || (order.product_price || 0);

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'Recent';
    if (typeof dateValue === 'object' && 'toDate' in dateValue) {
      return dateValue.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    const d = new Date(dateValue);
    return isNaN(d.getTime())
      ? 'Recent'
      : d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  };

  const handlePrint = () => {
    try {
      showSuccess('Opening browser print dialogue...', 'Print Ready');
      window.print();
    } catch (e) {
      showInfo('Please press Ctrl+P or Cmd+P to print your invoice.', 'Print Invoice');
    }
  };

  const handleCopyInvoiceLink = async () => {
    const url = `${window.location.origin}/invoice/${order.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showSuccess('Invoice link copied to your clipboard!', 'Link Copied');
    } catch (e) {
      showInfo(`Invoice URL: ${url}`, 'Invoice URL');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Top Modal Header & Actions Bar */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4 bg-gray-50/70 dark:bg-gray-800/50 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Invoice Preview #{order.id}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Issued on {formatDate(order.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title="Print Invoice"
              >
                <Printer className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">Print</span>
              </button>

              {/* Copy Share Link */}
              <button
                type="button"
                onClick={handleCopyInvoiceLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title="Copy Link"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>

              {/* Open Full Screen Link */}
              <Link
                to={`/invoice/${order.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200/60 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title="Open full page invoice in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Full View</span>
              </Link>

              {/* Close Modal Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Close invoice preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Printable / Viewable Invoice Body (Scrollable) */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 custom-scrollbar">
            {/* Invoice Top Branding */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">SwiftCart</h4>
                  <p className="text-xs text-gray-400">Official Purchase Invoice</p>
                </div>
              </div>

              <div className="sm:text-right space-y-0.5">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800">
                  {order.status || 'Paid'}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Payment: {(order as any).payment_method?.toUpperCase() || 'COD / Instant'}
                </p>
              </div>
            </div>

            {/* Bill To & Order Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-gray-50/70 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Customer Details</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  <span>{order.customer_name || 'Guest Shopper'}</span>
                </p>
                {order.phone && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <span>{order.phone}</span>
                  </p>
                )}
                {order.email && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    <span>{order.email}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Shipping Address</p>
                <p className="text-xs text-gray-700 dark:text-gray-200 flex items-start gap-1.5 leading-relaxed">
                  <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>{order.address || 'Address not specified'}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span>Order Date: {formatDate(order.created_at)}</span>
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Itemized Products</p>
              <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {items.length > 0 ? (
                  items.map((item: any, idx: number) => {
                    const qty = item.quantity || 1;
                    const price = item.price || 0;
                    return (
                      <div key={idx} className="p-3 sm:p-4 flex items-center justify-between gap-4 bg-white dark:bg-gray-900">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                            <img
                              src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Qty: {qty} &times; {formatPrice(price)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right font-bold text-sm text-gray-900 dark:text-white">
                          {formatPrice(qty * price)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 sm:p-4 flex items-center justify-between gap-4 bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                        <img
                          src={(order as any).product_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                          alt={order.product_name || 'Product'}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-gray-900 dark:text-white">{order.product_name || 'Item'}</h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Qty: 1 &times; {formatPrice(order.product_price || total)}</p>
                      </div>
                    </div>
                    <div className="text-right font-bold text-sm text-gray-900 dark:text-white">
                      {formatPrice(order.product_price || total)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Totals Breakdown */}
            <div className="p-5 bg-gray-50/70 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2.5 max-w-sm ml-auto">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1">
                    <span>Discount</span>
                    {discountCode && (
                      <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/60 rounded text-[10px] font-mono font-bold">
                        {discountCode}
                      </span>
                    )}
                  </span>
                  <span className="font-bold">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                </span>
              </div>

              <div className="pt-2.5 border-t border-gray-200 dark:border-gray-700 flex justify-between items-baseline">
                <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Total</span>
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Trust Footer Notice */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>Verified digitally generated invoice &bull; SwiftCart Inc.</span>
              </div>
              <span>Support: help@swiftcart.store</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
