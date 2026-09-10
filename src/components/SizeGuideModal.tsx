import React, { useState, useMemo } from 'react';
import { X, Ruler, Check, Info, HelpCircle, Compass, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
  productName?: string;
}

type MeasurementUnit = 'in' | 'cm';

interface SizeRow {
  size: string;
  [key: string]: string | number;
}

export default function SizeGuideModal({
  isOpen,
  onClose,
  category = 'General',
  productName
}: SizeGuideModalProps) {
  const [unit, setUnit] = useState<MeasurementUnit>('in');

  // Detect active category tab based on passed category string
  const detectedType = useMemo(() => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('shoe') || cat.includes('foot') || cat.includes('sneaker') || cat.includes('boot')) {
      return 'shoes';
    }
    if (cat.includes('watch') || cat.includes('jewelry') || cat.includes('ring') || cat.includes('bracelet')) {
      return 'watches';
    }
    if (cat.includes('bag') || cat.includes('backpack') || cat.includes('luggage') || cat.includes('wallet')) {
      return 'bags';
    }
    if (cat.includes('tech') || cat.includes('electronic') || cat.includes('gadget') || cat.includes('phone') || cat.includes('laptop')) {
      return 'electronics';
    }
    return 'apparel';
  }, [category]);

  const [activeTab, setActiveTab] = useState<'apparel' | 'shoes' | 'watches' | 'bags' | 'electronics'>(detectedType);

  // Sync tab when modal opens or category changes
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(detectedType);
    }
  }, [isOpen, detectedType]);

  // Convert inches to cm helper
  const formatVal = (inVal: number) => {
    if (unit === 'cm') {
      return (inVal * 2.54).toFixed(1);
    }
    return inVal.toFixed(1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="size-guide-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            id="size-guide-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden my-auto"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Ruler className="h-4 w-4" />
                  <span>Fit & Dimensions</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                  Interactive Size & Fit Guide
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tailored specifications for <span className="font-semibold text-gray-800 dark:text-gray-200">{category || 'this product'}</span>
                  {productName ? ` (${productName})` : ''}
                </p>
              </div>

              <button
                id="close-size-guide-btn"
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                title="Close Size Guide"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Category Selectors & Units Bar */}
            <div className="px-6 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3 bg-gray-50/70 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-800">
              {/* Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs font-bold">
                {[
                  { id: 'apparel', label: 'Apparel & Tops' },
                  { id: 'shoes', label: 'Footwear' },
                  { id: 'watches', label: 'Watches & Jewelry' },
                  { id: 'bags', label: 'Bags & Packs' },
                  { id: 'electronics', label: 'Gadgets' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === t.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Unit Switcher */}
              <div className="flex items-center bg-gray-200 dark:bg-gray-800 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUnit('in')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    unit === 'in'
                      ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                  }`}
                >
                  Inches
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('cm')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    unit === 'cm'
                      ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                  }`}
                >
                  CM
                </button>
              </div>
            </div>

            {/* Modal Body with Category Specific Tables */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              {/* Apparel Table */}
              {activeTab === 'apparel' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800">
                        <tr>
                          <th className="px-4 py-3">Size</th>
                          <th className="px-4 py-3">US / UK</th>
                          <th className="px-4 py-3">Chest ({unit})</th>
                          <th className="px-4 py-3">Waist ({unit})</th>
                          <th className="px-4 py-3">Length ({unit})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-200">
                        {[
                          { size: 'XS', std: '34', chest: 34, waist: 28, len: 26 },
                          { size: 'S', std: '36', chest: 37, waist: 30, len: 27 },
                          { size: 'M', std: '38 - 40', chest: 40, waist: 32, len: 28 },
                          { size: 'L', std: '42', chest: 43, waist: 35, len: 29.5 },
                          { size: 'XL', std: '44 - 46', chest: 46, waist: 38, len: 30.5 },
                          { size: 'XXL', std: '48', chest: 50, waist: 42, len: 31.5 }
                        ].map(row => (
                          <tr key={row.size} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors">
                            <td className="px-4 py-3 font-extrabold text-indigo-600 dark:text-indigo-400">{row.size}</td>
                            <td className="px-4 py-3 text-gray-500">{row.std}</td>
                            <td className="px-4 py-3">{formatVal(row.chest)}</td>
                            <td className="px-4 py-3">{formatVal(row.waist)}</td>
                            <td className="px-4 py-3">{formatVal(row.len)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3">
                    <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      <p className="font-bold text-gray-800 dark:text-white mb-0.5">Measuring Tips for Clothing:</p>
                      Measure around the fullest part of your chest, keeping the tape horizontal. For waist, measure around your natural waistline where your trousers naturally sit.
                    </div>
                  </div>
                </div>
              )}

              {/* Shoes Table */}
              {activeTab === 'shoes' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800">
                        <tr>
                          <th className="px-4 py-3">US Men</th>
                          <th className="px-4 py-3">US Women</th>
                          <th className="px-4 py-3">UK</th>
                          <th className="px-4 py-3">EU</th>
                          <th className="px-4 py-3">Foot Length ({unit})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-200">
                        {[
                          { usM: '7.0', usW: '8.5', uk: '6.0', eu: '40', len: 9.8 },
                          { usM: '8.0', usW: '9.5', uk: '7.0', eu: '41', len: 10.2 },
                          { usM: '9.0', usW: '10.5', uk: '8.0', eu: '42.5', len: 10.5 },
                          { usM: '10.0', usW: '11.5', uk: '9.0', eu: '44', len: 10.9 },
                          { usM: '11.0', usW: '12.5', uk: '10.0', eu: '45', len: 11.2 },
                          { usM: '12.0', usW: '13.5', uk: '11.0', eu: '46.5', len: 11.6 }
                        ].map(row => (
                          <tr key={row.usM} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors">
                            <td className="px-4 py-3 font-extrabold text-indigo-600 dark:text-indigo-400">{row.usM}</td>
                            <td className="px-4 py-3">{row.usW}</td>
                            <td className="px-4 py-3">{row.uk}</td>
                            <td className="px-4 py-3">{row.eu}</td>
                            <td className="px-4 py-3">{formatVal(row.len)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-amber-50/70 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/50 flex items-start gap-3">
                    <Compass className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      <p className="font-bold text-gray-800 dark:text-white mb-0.5">Footwear Fit Guide:</p>
                      Place heel against a wall on a sheet of paper. Mark the longest toe tip and measure to the wall edge. If you fall between sizes or have wider feet, we advise ordering a half size up.
                    </div>
                  </div>
                </div>
              )}

              {/* Watches & Jewelry */}
              {activeTab === 'watches' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800">
                        <tr>
                          <th className="px-4 py-3">Case Size</th>
                          <th className="px-4 py-3">Recommended Wrist Size ({unit})</th>
                          <th className="px-4 py-3">Band Width</th>
                          <th className="px-4 py-3">Profile Fit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-200">
                        {[
                          { case: '38mm', wrist: 5.8, band: '20mm', fit: 'Compact / Slim Wrist' },
                          { case: '40mm', wrist: 6.3, band: '20mm', fit: 'Classic Unisex Fit' },
                          { case: '42mm', wrist: 6.8, band: '22mm', fit: 'Standard Modern Fit' },
                          { case: '44mm', wrist: 7.2, band: '22mm', fit: 'Bold / Sport Fit' },
                          { case: '46mm+', wrist: 7.8, band: '24mm', fit: 'Oversized Statement' }
                        ].map(row => (
                          <tr key={row.case} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors">
                            <td className="px-4 py-3 font-extrabold text-indigo-600 dark:text-indigo-400">{row.case}</td>
                            <td className="px-4 py-3">{formatVal(row.wrist)} - {formatVal(row.wrist + 1.2)}</td>
                            <td className="px-4 py-3">{row.band}</td>
                            <td className="px-4 py-3 text-gray-500">{row.fit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3">
                    <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      <p className="font-bold text-gray-800 dark:text-white mb-0.5">Wrist Sizing:</p>
                      Wrap a strip of paper around your wrist just below the wrist bone. Mark where it overlaps and lay flat against a ruler.
                    </div>
                  </div>
                </div>
              )}

              {/* Bags & Packs */}
              {activeTab === 'bags' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800">
                        <tr>
                          <th className="px-4 py-3">Bag Type</th>
                          <th className="px-4 py-3">Capacity</th>
                          <th className="px-4 py-3">Laptop Fit</th>
                          <th className="px-4 py-3">Carry-On Approved</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-200">
                        {[
                          { type: 'Compact Sling / Crossbody', cap: '3L - 6L', lap: 'Tablet / iPad Mini', carry: 'Personal Item' },
                          { type: 'Daypack / Commuter', cap: '15L - 22L', lap: 'Up to 14" Laptop', carry: 'Underseat Flight' },
                          { type: 'Everyday Backpack', cap: '24L - 30L', lap: 'Up to 16" Pro Laptop', carry: 'Cabin Approved' },
                          { type: 'Travel / Weekender', cap: '35L - 45L', lap: 'Dedicated 16" Sleeve', carry: 'Overhead Bin' }
                        ].map(row => (
                          <tr key={row.type} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors">
                            <td className="px-4 py-3 font-extrabold text-indigo-600 dark:text-indigo-400">{row.type}</td>
                            <td className="px-4 py-3 font-semibold">{row.cap}</td>
                            <td className="px-4 py-3">{row.lap}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 font-semibold">
                                <Check className="h-3 w-3" />
                                {row.carry}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Electronics & Gadgets */}
              {activeTab === 'electronics' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800">
                        <tr>
                          <th className="px-4 py-3">Device Class</th>
                          <th className="px-4 py-3">Screen Diagonal</th>
                          <th className="px-4 py-3">Form Factor</th>
                          <th className="px-4 py-3">Port & Mount Standards</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-200">
                        {[
                          { dev: 'Smartphone & Handheld', scr: '6.1" - 6.8"', form: 'Pocketable Slim', port: 'USB-C / Qi Wireless' },
                          { dev: 'Tablet / E-Reader', scr: '8.3" - 13.0"', form: 'Ultra-thin Slate', port: 'USB-C / Magnetic Dock' },
                          { dev: 'Laptop & Ultrabook', scr: '13.3" - 16.2"', form: 'Clamshell Aluminum', port: 'Thunderbolt / HDMI' },
                          { dev: 'Wearables & Audio', scr: '1.4" - 2.0"', form: 'Ergonomic In-Ear / Wrist', port: 'Fast Charge Case' }
                        ].map(row => (
                          <tr key={row.dev} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors">
                            <td className="px-4 py-3 font-extrabold text-indigo-600 dark:text-indigo-400">{row.dev}</td>
                            <td className="px-4 py-3 font-semibold">{row.scr}</td>
                            <td className="px-4 py-3">{row.form}</td>
                            <td className="px-4 py-3 text-gray-500">{row.port}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Satisfaction / Guarantee Footnote */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl text-xs text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Not sure which size fits you? Free 30-day exchanges on all orders.</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
              >
                Got It, Thanks
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
