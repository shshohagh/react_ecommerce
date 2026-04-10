import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { formatPrice } from '../lib/utils';
import { Printer, Download, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function Invoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!id) return;
      try {
        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error('Error fetching order for invoice:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  const handlePrint = () => {
    try {
      window.focus();
      window.print();
    } catch (err) {
      console.error('Print failed:', err);
      alert('Print failed. Please try opening the invoice in a new tab or use your browser\'s print shortcut (Ctrl+P or Cmd+P).');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Invoice not found</h2>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const date = order.created_at?.toDate 
    ? order.created_at.toDate() 
    : order.created_at 
      ? new Date(order.created_at) 
      : new Date();

  const safeJsonParse = (str: string) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return {};
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
      <div className="max-w-4xl mx-auto">
        {/* Actions - Hidden on print */}
        <div className="mb-8 flex justify-between items-center print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </button>
          <div className="flex gap-4">
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Invoice
            </button>
          </div>
        </div>

        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl text-blue-700 dark:text-blue-300 text-sm print:hidden">
          <p className="font-bold mb-1">Print Tip:</p>
          <p>If the print button doesn't respond, please open the application in a new tab using the icon in the top right corner of the preview, then try printing again.</p>
        </div>

        {/* Invoice Card */}
        <div
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden print:shadow-none print:border-none print:rounded-none print:m-0 print:p-0"
        >
          {/* Header */}
          <div className="bg-indigo-600 p-8 md:p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:bg-white print:text-black print:border-b print:border-gray-200 print:p-6 print:gap-2">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">INVOICE</h1>
              <p className="text-indigo-100 print:text-gray-500">Order #{order.id}</p>
            </div>
            <div className="text-right md:text-right flex flex-col items-start md:items-end">
              <h2 className="text-xl font-bold mb-1">SwiftCart</h2>
              <p className="text-indigo-100 text-sm print:text-gray-500">Premium Essentials Store</p>
              <p className="text-indigo-100 text-sm print:text-gray-500">{date.toLocaleDateString()} {date.toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-12 print:p-6">
            {/* Billing & Shipping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Bill To</h3>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{order.customer_name}</p>
                  <p className="text-gray-500 dark:text-gray-400">{order.email}</p>
                  <p className="text-gray-500 dark:text-gray-400">{order.phone}</p>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Ship To</h3>
                <div className="space-y-1">
                  <p className="text-gray-900 dark:text-white font-medium">{order.address}</p>
                  <p className="text-gray-500 dark:text-gray-400">Shipping Method: Standard Delivery</p>
                  <p className="text-gray-500 dark:text-gray-400">Payment: {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Qty</th>
                    <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Price</th>
                    <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {order.items ? (
                    order.items.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-6">
                          <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                          {item.attributes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {Object.entries(safeJsonParse(item.attributes)).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </p>
                          )}
                        </td>
                        <td className="py-6 text-center text-gray-600 dark:text-gray-300">{item.quantity}</td>
                        <td className="py-6 text-right text-gray-600 dark:text-gray-300">{formatPrice(item.price)}</td>
                        <td className="py-6 text-right font-bold text-gray-900 dark:text-white">{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-6">
                        <p className="font-bold text-gray-900 dark:text-white">{order.product_name}</p>
                        {order.attributes && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {Object.entries(safeJsonParse(order.attributes)).map(([k, v]) => `${k}: ${v}`).join(', ')}
                          </p>
                        )}
                      </td>
                      <td className="py-6 text-center text-gray-600 dark:text-gray-300">1</td>
                      <td className="py-6 text-right text-gray-600 dark:text-gray-300">{formatPrice(order.product_price)}</td>
                      <td className="py-6 text-right font-bold text-gray-900 dark:text-white">{formatPrice(order.product_price)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full md:w-64 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatPrice(order.total - (order.shipping_cost || 0))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Shipping</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatPrice(order.shipping_cost || 0)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-12 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Thank you for shopping with SwiftCart!</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">If you have any questions about this invoice, please contact support@swiftcart.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
