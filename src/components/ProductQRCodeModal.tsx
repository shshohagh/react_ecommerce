import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Product } from '../types';
import { formatPrice } from '../lib/utils';
import { 
  X, 
  QrCode, 
  Smartphone, 
  Copy, 
  Check, 
  Download, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';

interface ProductQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export default function ProductQRCodeModal({ isOpen, onClose, product }: ProductQRCodeModalProps) {
  const { showSuccess, showError } = useToast();
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      showSuccess('Product link copied to clipboard!', 'Link Copied');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
      showError('Failed to copy link.');
    }
  };

  const handleDownloadQR = () => {
    try {
      const svg = document.getElementById('product-qr-svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width + 40;
        canvas.height = img.height + 40;
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 20, 20);
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `${product.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-qr.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
          showSuccess('QR Code downloaded as PNG image!', 'Download Complete');
        }
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('Error downloading QR code:', err);
      showError('Failed to download QR code image.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 z-10 space-y-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                Scan on Mobile Device
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                Scan this QR code with your phone's camera to instantly view and purchase this product on mobile.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-5 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-800 inline-block shadow-inner mx-auto">
              <div className="bg-white p-4 rounded-xl shadow-xs">
                <QRCodeSVG
                  id="product-qr-svg"
                  value={currentUrl}
                  size={200}
                  level="H"
                  includeMargin={false}
                  fgColor="#1e1b4b"
                  bgColor="#ffffff"
                />
              </div>
            </div>

            {/* Product Micro Summary */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-left">
              <img
                src={product.image}
                alt={product.name}
                className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{product.name}</h4>
                <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{formatPrice(product.price)}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                Live URL
              </span>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="w-full py-2.5 px-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQR}
                className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>Save QR Image</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 pt-1">
              <Smartphone className="h-3.5 w-3.5" />
              <span>Compatible with iOS Camera and Android Lens</span>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
